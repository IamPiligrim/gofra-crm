import {
  type Client,
  type Deal,
  type DealStatus,
  type RepeatReminderDays,
  type Task,
} from "./domain";

export type RepeatSegment =
  | "all"
  | "30"
  | "60"
  | "90"
  | "sleeping"
  | "no_data";
export type RepeatQueueSegment = Exclude<RepeatSegment, "all">;

const DAY_MS = 86_400_000;
export const TERMINAL_DEAL_STATUSES = [
  "Закрыта успешно",
  "Проиграна",
  "Отменена",
] as const satisfies readonly DealStatus[];
export const ACTIVE_REPEAT_CLIENT_STATUSES = ["Активный клиент"] as const;
export const SHIPMENT_DEAL_STATUSES = [
  "Отгружено",
  "Закрыта успешно",
] as const satisfies readonly DealStatus[];

const terminalDealStatuses = new Set<DealStatus>(TERMINAL_DEAL_STATUSES);
const shipmentDealStatuses = new Set<DealStatus>(SHIPMENT_DEAL_STATUSES);
const activeRepeatClientStatuses = new Set<Client["status"]>(
  ACTIVE_REPEAT_CLIENT_STATUSES,
);
const MIGRATED_NEXT_ACTION = "Назначить следующий шаг по сделке";

const toDateOnly = (value: Date): string => value.toISOString().slice(0, 10);

const parseDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const date = new Date(value.length === 10 ? `${value}T12:00:00.000Z` : value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const isOpenDeal = (deal: Pick<Deal, "status">): boolean =>
  !terminalDealStatuses.has(deal.status);

export const recordsShipment = (deal: Pick<Deal, "status">): boolean =>
  shipmentDealStatuses.has(deal.status);

export const hasRequiredDealNextAction = (
  deal: Pick<Deal, "status" | "nextAction" | "nextActionAt"> &
    Partial<Pick<Deal, "needsNextAction">>,
): boolean =>
  !isOpenDeal(deal) ||
  (!deal.needsNextAction &&
    deal.nextAction.trim().length > 0 &&
    parseDate(deal.nextActionAt) !== null);

export const normalizeDealNextAction = <
  T extends Pick<Deal, "status" | "nextAction" | "nextActionAt"> &
    Partial<Pick<Deal, "needsNextAction">>,
>(
  deal: T,
  now = new Date(),
): T & Pick<Deal, "needsNextAction"> => {
  if (!isOpenDeal(deal)) {
    return { ...deal, needsNextAction: false };
  }
  if (hasRequiredDealNextAction(deal)) {
    return { ...deal, needsNextAction: false };
  }

  return {
    ...deal,
    nextAction: deal.nextAction.trim() || MIGRATED_NEXT_ACTION,
    nextActionAt: parseDate(deal.nextActionAt)
      ? deal.nextActionAt
      : now.toISOString(),
    needsNextAction: true,
  };
};

export const calculateExpectedNextOrder = (
  lastShipmentAt: string | null,
  orderFrequencyDays: number | null,
): string | null => {
  const shipmentDate = parseDate(lastShipmentAt);
  if (!shipmentDate || !orderFrequencyDays || orderFrequencyDays < 1) {
    return null;
  }

  shipmentDate.setUTCDate(shipmentDate.getUTCDate() + orderFrequencyDays);
  return toDateOnly(shipmentDate);
};

export const resolveExpectedNextOrder = (
  client: Pick<
    Client,
    | "lastShipmentAt"
    | "orderFrequencyDays"
    | "expectedNextOrderAt"
    | "expectedNextOrderManual"
  >,
): string | null => {
  if (client.expectedNextOrderManual) {
    const expectedDate = parseDate(client.expectedNextOrderAt);
    return expectedDate ? toDateOnly(expectedDate) : null;
  }
  return calculateExpectedNextOrder(
    client.lastShipmentAt,
    client.orderFrequencyDays,
  );
};

export const syncClientOrderCycleFromShipment = <
  T extends Pick<
    Client,
    | "lastShipmentAt"
    | "orderFrequencyDays"
    | "expectedNextOrderAt"
    | "expectedNextOrderManual"
  >,
>(
  client: T,
  shippedAt: string,
): T => {
  const shipmentDate = parseDate(shippedAt);
  if (!shipmentDate) return client;
  const lastShipmentAt = toDateOnly(shipmentDate);
  const nextClient = { ...client, lastShipmentAt };
  return {
    ...nextClient,
    expectedNextOrderAt: resolveExpectedNextOrder(nextClient),
  };
};

export const getDaysWithoutOrder = (
  client: Pick<Client, "lastShipmentAt" | "lastContactAt">,
  now = new Date(),
): number | null => {
  const anchor = parseDate(client.lastShipmentAt);
  if (!anchor) return null;
  return Math.max(0, Math.floor((now.getTime() - anchor.getTime()) / DAY_MS));
};

export const classifyRepeatSegment = (
  client: Pick<Client, "status" | "lastShipmentAt" | "lastContactAt">,
  now = new Date(),
): RepeatQueueSegment | null => {
  if (client.status === "Спящий клиент") return "sleeping";
  if (!activeRepeatClientStatuses.has(client.status)) return null;

  const days = getDaysWithoutOrder(client, now);
  if (days === null) return "no_data";
  if (days >= 120) return "sleeping";
  if (days >= 90) return "90";
  if (days >= 60) return "60";
  if (days >= 30) return "30";
  return null;
};

export const matchesRepeatSegment = (
  client: Pick<Client, "status" | "lastShipmentAt" | "lastContactAt">,
  segment: RepeatSegment,
  now = new Date(),
): boolean => {
  if (segment === "all") return true;
  return classifyRepeatSegment(client, now) === segment;
};

const reminderTaskId = (
  clientId: string,
  expectedAt: string,
  reminderDays: RepeatReminderDays,
) => `repeat-order:${clientId}:${expectedAt}:${reminderDays}`;

const reminderDueAt = (
  expectedAt: string,
  reminderDays: RepeatReminderDays,
): string => {
  const date = parseDate(expectedAt) ?? new Date();
  date.setUTCDate(date.getUTCDate() - reminderDays);
  date.setUTCHours(9, 0, 0, 0);
  return date.toISOString();
};

export const syncRepeatOrderTasks = (
  clients: Client[],
  tasks: Task[],
  now = new Date(),
): Task[] => {
  const eligibleClientIds = new Set(
    clients
      .filter(
        (client) =>
          activeRepeatClientStatuses.has(client.status) &&
          parseDate(client.expectedNextOrderAt) !== null,
      )
      .map((client) => client.id),
  );
  const stableTasks = tasks.filter(
    (task) =>
      task.source !== "repeat_order" ||
      task.status !== "open" ||
      (task.clientId !== null && eligibleClientIds.has(task.clientId)),
  );
  const next = [...stableTasks];

  for (const client of clients) {
    if (!eligibleClientIds.has(client.id) || !client.expectedNextOrderAt) continue;
    const id = reminderTaskId(
      client.id,
      client.expectedNextOrderAt,
      client.repeatReminderDays,
    );
    const clientTasks = next.filter(
      (task) =>
        task.source === "repeat_order" &&
        task.clientId === client.id &&
        task.status === "open",
    );
    for (const stale of clientTasks) {
      if (stale.id !== id) {
        const index = next.findIndex((task) => task.id === stale.id);
        next.splice(index, 1);
      }
    }
    if (next.some((task) => task.id === id)) continue;

    const createdAt = now.toISOString();
    next.push({
      id,
      title: `Подготовить повторный заказ: ${client.companyName}`,
      description: `Ожидаемый заказ ${client.expectedNextOrderAt}. Связаться с клиентом за ${client.repeatReminderDays} дней.`,
      kind: "reminder",
      status: "open",
      priority: "high",
      dueAt: reminderDueAt(
        client.expectedNextOrderAt,
        client.repeatReminderDays,
      ),
      completedAt: null,
      assigneeId: client.ownerId,
      createdById: client.ownerId,
      source: "repeat_order",
      sourceId: client.id,
      checklist: [],
      clientId: client.id,
      dealId: null,
      contactId: null,
      createdAt,
      updatedAt: createdAt,
    });
  }

  return next;
};
