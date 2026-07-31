import type { Client, CrmSnapshot, Deal, Quote, Task, User } from "./domain";
import { hasRequiredDealNextAction, isOpenDeal } from "./sales-automation";

const DAY_MS = 86_400_000;

const startOfDay = (value: Date): Date => {
  const result = new Date(value);
  result.setHours(0, 0, 0, 0);
  return result;
};

const safeDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const result = new Date(value);
  return Number.isNaN(result.getTime()) ? null : result;
};

const byDueAt = (left: Task, right: Task): number =>
  (safeDate(left.dueAt)?.getTime() ?? Number.MAX_SAFE_INTEGER) -
  (safeDate(right.dueAt)?.getTime() ?? Number.MAX_SAFE_INTEGER);

export interface SilentQuoteRow {
  deal: Deal;
  quote: Quote;
  replyExpectedAt: string | null;
}

export interface UpcomingReorderRow {
  client: Client;
  expectedAt: string;
  daysUntil: number;
}

export interface ManagerFocus {
  overdueTasks: Task[];
  todayTasks: Task[];
  dealsWithoutNextStep: Deal[];
  silentQuotes: SilentQuoteRow[];
  upcomingReorders: UpcomingReorderRow[];
}

export const selectManagerFocus = (
  snapshot: CrmSnapshot,
  user: Pick<User, "id">,
  now = new Date(),
): ManagerFocus => {
  const today = startOfDay(now);
  const tomorrow = new Date(today.getTime() + DAY_MS);
  const tasks = snapshot.tasks.filter(
    (task) => task.assigneeId === user.id && task.status === "open",
  );
  const deals = snapshot.deals.filter((deal) => deal.ownerId === user.id);
  const clients = snapshot.clients.filter((client) => client.ownerId === user.id);
  const interactions = snapshot.interactions.filter(
    (interaction) => interaction.ownerId === user.id,
  );

  const overdueTasks = tasks
    .filter((task) => {
      const dueAt = safeDate(task.dueAt);
      return Boolean(dueAt && dueAt.getTime() < today.getTime());
    })
    .sort(byDueAt);
  const todayTasks = tasks
    .filter((task) => {
      const dueAt = safeDate(task.dueAt);
      return Boolean(
        dueAt &&
          dueAt.getTime() >= today.getTime() &&
          dueAt.getTime() < tomorrow.getTime(),
      );
    })
    .sort(byDueAt);

  const dealsWithoutNextStep = deals
    .filter((deal) => isOpenDeal(deal) && !hasRequiredDealNextAction(deal))
    .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));

  const quoteById = new Map(snapshot.quotes.map((quote) => [quote.id, quote]));
  const silentQuotes = deals
    .map((deal) => ({
      deal,
      quote: deal.activeQuoteId ? quoteById.get(deal.activeQuoteId) : undefined,
    }))
    .filter(
      (entry): entry is { deal: Deal; quote: Quote } =>
        entry.quote?.status === "Отправлено" && Boolean(entry.quote.sentAt),
    )
    .filter(({ deal, quote }) => {
      const sentAt = safeDate(quote.sentAt);
      if (!sentAt) return false;
      return !interactions.some((interaction) => {
        if (interaction.clientId !== deal.clientId) return false;
        if (interaction.kind === "Отправка КП") return false;
        const occurredAt = safeDate(interaction.occurredAt);
        return Boolean(occurredAt && occurredAt.getTime() > sentAt.getTime());
      });
    })
    .map(({ deal, quote }) => ({
      deal,
      quote,
      replyExpectedAt: deal.process.replyExpectedAt,
    }))
    .sort((left, right) => {
      const leftDate = safeDate(left.replyExpectedAt ?? left.quote.sentAt);
      const rightDate = safeDate(right.replyExpectedAt ?? right.quote.sentAt);
      return (leftDate?.getTime() ?? 0) - (rightDate?.getTime() ?? 0);
    });

  const upcomingReorders = clients
    .map((client) => {
      const expectedAt = safeDate(client.expectedNextOrderAt);
      return expectedAt
        ? {
            client,
            expectedAt: client.expectedNextOrderAt as string,
            daysUntil: Math.ceil(
              (startOfDay(expectedAt).getTime() - today.getTime()) / DAY_MS,
            ),
          }
        : null;
    })
    .filter((entry): entry is UpcomingReorderRow => Boolean(entry))
    .filter(
      ({ client, daysUntil }) =>
        daysUntil <= client.repeatReminderDays && daysUntil >= -90,
    )
    .sort((left, right) => left.daysUntil - right.daysUntil);

  return {
    overdueTasks,
    todayTasks,
    dealsWithoutNextStep,
    silentQuotes,
    upcomingReorders,
  };
};
