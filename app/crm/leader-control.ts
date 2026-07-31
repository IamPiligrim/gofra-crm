import {
  DEFAULT_SALES_CONTROL_SETTINGS,
  getDealEconomics,
  getQuoteMarginPercent,
  type Client,
  type CrmSnapshot,
  type Deal,
  type DealStatus,
  type PriceApproval,
  type PriceApprovalTrigger,
  type Quote,
  type SalesControlSettings,
  type User,
} from "./domain";
import { isOpenDeal } from "./sales-automation";

const DAY_MS = 86_400_000;
const RESOLVED_STATUSES = new Set<DealStatus>([
  "Закрыта успешно",
  "Проиграна",
  "Отменена",
]);
const INACTIVE_CLIENT_STATUSES = new Set([
  "Не подходит",
  "Отказ",
  "Черный список",
]);

export const DEAL_STAGE_PROBABILITY: Record<DealStatus, number> = {
  "Новая заявка": 10,
  "Уточняем ТЗ": 20,
  "Считаем цену": 35,
  "КП отправлено": 50,
  "Переговоры": 65,
  "Согласование условий": 75,
  "Счет выставлен": 85,
  "Ожидаем оплату": 90,
  "Оплачено": 96,
  "В закупке / производстве": 100,
  "Готово к отгрузке": 100,
  "Отгружено": 100,
  "Закрыта успешно": 100,
  "Проиграна": 0,
  "Отложена": 15,
  "Отменена": 0,
};

const safeDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const latestDate = (values: Array<string | null | undefined>): Date | null =>
  values.reduce<Date | null>((latest, value) => {
    const parsed = safeDate(value);
    return parsed && (!latest || parsed > latest) ? parsed : latest;
  }, null);

const ageInDays = (value: Date | null, asOf: Date): number =>
  value ? Math.max(0, Math.floor((asOf.getTime() - value.getTime()) / DAY_MS)) : 0;

const monthKey = (date: Date): string =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

const MONTH_LABEL = new Intl.DateTimeFormat("ru-RU", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export interface ForecastMonth {
  key: string;
  label: string;
  deals: number;
  revenue: number;
  weightedRevenue: number;
}

export interface StagnantDealRow {
  deal: Deal;
  client: Client | null;
  owner: User | null;
  lastMovementAt: string;
  inactiveDays: number;
}

export interface StaleClientRow {
  client: Client;
  owner: User | null;
  lastProcessedAt: string | null;
  inactiveDays: number;
  neverProcessed: boolean;
}

export interface ConversionRow {
  id: string;
  label: string;
  won: number;
  resolved: number;
  conversionPercent: number;
}

export interface LossReasonRow {
  reason: string;
  count: number;
  sharePercent: number;
}

export interface LeaderControlSnapshot {
  forecast: ForecastMonth[];
  stagnantDeals: StagnantDealRow[];
  staleClients: StaleClientRow[];
  managerConversion: ConversionRow[];
  sourceConversion: ConversionRow[];
  lossReasons: LossReasonRow[];
  averageMarginPercent: number;
  averageMarginValue: number;
  activeRevenue: number;
  activeMargin: number;
  pendingApprovals: PriceApproval[];
}

const latestDealMovement = (snapshot: CrmSnapshot, deal: Deal): Date =>
  latestDate([
    deal.updatedAt,
    ...snapshot.interactions
      .filter((interaction) => interaction.dealId === deal.id)
      .map((interaction) => interaction.occurredAt),
    ...snapshot.quotes
      .filter((quote) => quote.dealId === deal.id)
      .map((quote) => quote.updatedAt),
    ...snapshot.statusEvents
      .filter((event) => event.entityType === "deal" && event.entityId === deal.id)
      .map((event) => event.changedAt),
  ]) ?? new Date(deal.createdAt);

const conversionRows = (
  deals: readonly Deal[],
  keyForDeal: (deal: Deal) => { id: string; label: string },
): ConversionRow[] => {
  const buckets = new Map<string, { label: string; won: number; resolved: number }>();
  for (const deal of deals) {
    if (!RESOLVED_STATUSES.has(deal.status)) continue;
    const key = keyForDeal(deal);
    const bucket = buckets.get(key.id) ?? { label: key.label, won: 0, resolved: 0 };
    bucket.resolved += 1;
    if (deal.status === "Закрыта успешно") bucket.won += 1;
    buckets.set(key.id, bucket);
  }
  return [...buckets.entries()]
    .map(([id, bucket]) => ({
      id,
      label: bucket.label,
      won: bucket.won,
      resolved: bucket.resolved,
      conversionPercent:
        bucket.resolved === 0
          ? 0
          : Math.round((bucket.won / bucket.resolved) * 1000) / 10,
    }))
    .sort(
      (left, right) =>
        right.conversionPercent - left.conversionPercent ||
        right.resolved - left.resolved ||
        left.label.localeCompare(right.label, "ru-RU"),
    );
};

export const selectLeaderControl = (
  snapshot: CrmSnapshot,
  asOf = new Date(),
): LeaderControlSnapshot => {
  const settings = snapshot.salesControl ?? DEFAULT_SALES_CONTROL_SETTINGS;
  const clientById = new Map(snapshot.clients.map((client) => [client.id, client]));
  const userById = new Map(snapshot.users.map((user) => [user.id, user]));
  const openDeals = snapshot.deals.filter(isOpenDeal);
  const forecastBuckets = new Map<string, ForecastMonth>();

  for (const deal of openDeals) {
    const closeAt = safeDate(deal.forecastCloseAt);
    if (!closeAt) continue;
    const economics = getDealEconomics(deal, snapshot.quotes);
    const key = monthKey(closeAt);
    const probability = DEAL_STAGE_PROBABILITY[deal.status] / 100;
    const bucket = forecastBuckets.get(key) ?? {
      key,
      label: MONTH_LABEL.format(closeAt),
      deals: 0,
      revenue: 0,
      weightedRevenue: 0,
    };
    bucket.deals += 1;
    bucket.revenue += economics.revenue;
    bucket.weightedRevenue += Math.round(economics.revenue * probability);
    forecastBuckets.set(key, bucket);
  }

  const stagnantDeals = openDeals
    .map<StagnantDealRow>((deal) => {
      const lastMovement = latestDealMovement(snapshot, deal);
      return {
        deal,
        client: clientById.get(deal.clientId) ?? null,
        owner: userById.get(deal.ownerId) ?? null,
        lastMovementAt: lastMovement.toISOString(),
        inactiveDays: ageInDays(lastMovement, asOf),
      };
    })
    .filter((row) => row.inactiveDays >= settings.stagnantDealDays)
    .sort((left, right) => right.inactiveDays - left.inactiveDays);

  const staleClients = snapshot.clients
    .filter((client) => !client.status || !INACTIVE_CLIENT_STATUSES.has(client.status))
    .map<StaleClientRow>((client) => {
      const interactionDates = snapshot.interactions
        .filter((interaction) => interaction.clientId === client.id)
        .map((interaction) => interaction.occurredAt);
      const lastProcessed = latestDate([client.lastContactAt, ...interactionDates]);
      const fallback = lastProcessed ?? safeDate(client.createdAt);
      return {
        client,
        owner: userById.get(client.ownerId) ?? null,
        lastProcessedAt: lastProcessed?.toISOString() ?? null,
        inactiveDays: ageInDays(fallback, asOf),
        neverProcessed: !lastProcessed,
      };
    })
    .filter((row) => row.inactiveDays >= settings.staleClientDays)
    .sort((left, right) => right.inactiveDays - left.inactiveDays);

  const activeEconomics = openDeals.map((deal) =>
    getDealEconomics(deal, snapshot.quotes),
  );
  const activeRevenue = activeEconomics.reduce(
    (sum, economics) => sum + economics.revenue,
    0,
  );
  const activeMargin = activeEconomics.reduce(
    (sum, economics) => sum + economics.margin,
    0,
  );

  const managerConversion = conversionRows(snapshot.deals, (deal) => {
    const owner = userById.get(deal.ownerId);
    return { id: deal.ownerId, label: owner?.fullName ?? deal.managerName ?? "Не назначен" };
  });
  const sourceConversion = conversionRows(snapshot.deals, (deal) => {
    const source = clientById.get(deal.clientId)?.source || "Источник не указан";
    return { id: source, label: source };
  });

  const lostDeals = snapshot.deals.filter((deal) =>
    ["Проиграна", "Отменена"].includes(deal.status),
  );
  const lossBuckets = new Map<string, number>();
  for (const deal of lostDeals) {
    const reason = deal.lossReason ?? "Причина не указана";
    lossBuckets.set(reason, (lossBuckets.get(reason) ?? 0) + 1);
  }
  const lossReasons = [...lossBuckets.entries()]
    .map(([reason, count]) => ({
      reason,
      count,
      sharePercent:
        lostDeals.length === 0
          ? 0
          : Math.round((count / lostDeals.length) * 1000) / 10,
    }))
    .sort((left, right) => right.count - left.count || left.reason.localeCompare(right.reason, "ru-RU"));

  return {
    forecast: [...forecastBuckets.values()].sort((left, right) =>
      left.key.localeCompare(right.key),
    ),
    stagnantDeals,
    staleClients,
    managerConversion,
    sourceConversion,
    lossReasons,
    averageMarginPercent:
      activeRevenue === 0
        ? 0
        : Math.round((activeMargin / activeRevenue) * 1000) / 10,
    averageMarginValue:
      activeEconomics.length === 0
        ? 0
        : Math.round(activeMargin / activeEconomics.length),
    activeRevenue,
    activeMargin,
    pendingApprovals: snapshot.priceApprovals
      .filter((approval) => approval.status === "pending" || approval.status === "clarification")
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
  };
};

const approvalTrigger = (
  marginPercent: number,
  discountPercent: number,
  settings: SalesControlSettings,
): PriceApprovalTrigger | null => {
  const lowMargin = marginPercent < settings.minMarginPercent;
  const excessiveDiscount = discountPercent > settings.maxDiscountPercent;
  if (lowMargin && excessiveDiscount) return "discount_and_margin";
  if (lowMargin) return "low_margin";
  if (excessiveDiscount) return "discount";
  return null;
};

const previousQuote = (quotes: readonly Quote[], current: Quote): Quote | null =>
  quotes
    .filter((quote) => quote.dealId === current.dealId && quote.version < current.version)
    .sort((left, right) => right.version - left.version)[0] ?? null;

export const syncThresholdPriceApprovals = (
  snapshot: CrmSnapshot,
): PriceApproval[] => {
  const settings = snapshot.salesControl ?? DEFAULT_SALES_CONTROL_SETTINGS;
  const approvals = [...snapshot.priceApprovals];
  const approvalQuoteIds = new Set(
    approvals.map((approval) => approval.quoteId).filter(Boolean),
  );
  const quoteById = new Map(snapshot.quotes.map((quote) => [quote.id, quote]));

  for (const deal of snapshot.deals) {
    if (!deal.activeQuoteId || approvalQuoteIds.has(deal.activeQuoteId)) continue;
    const quote = quoteById.get(deal.activeQuoteId);
    if (!quote || quote.status === "Заменено") continue;
    const previous = previousQuote(snapshot.quotes, quote);
    const discountPercent =
      previous && previous.revenue > 0 && quote.revenue < previous.revenue
        ? Math.round(((previous.revenue - quote.revenue) / previous.revenue) * 1000) / 10
        : 0;
    const marginPercent = getQuoteMarginPercent(quote);
    const trigger = approvalTrigger(marginPercent, discountPercent, settings);
    if (!trigger) continue;

    const reasons = [
      trigger === "low_margin" || trigger === "discount_and_margin"
        ? `Маржа ${marginPercent}% ниже порога ${settings.minMarginPercent}%`
        : null,
      trigger === "discount" || trigger === "discount_and_margin"
        ? `Скидка ${discountPercent}% выше порога ${settings.maxDiscountPercent}%`
        : null,
    ].filter(Boolean);
    approvals.unshift({
      id: `approval-quote-${quote.id}`,
      clientId: deal.clientId,
      dealId: deal.id,
      product: deal.product,
      currentPrice: previous?.revenue ?? quote.revenue,
      requestedPrice: quote.revenue,
      volume: quote.volume,
      reason: reasons.join(". "),
      comment: `Автоматически создано для КП версии ${quote.version}.`,
      attachments: [],
      trigger,
      quoteId: quote.id,
      marginPercent,
      discountPercent: discountPercent || null,
      thresholdPercent:
        trigger === "low_margin"
          ? settings.minMarginPercent
          : trigger === "discount"
            ? settings.maxDiscountPercent
            : null,
      status: "pending",
      requestedById: quote.authorId,
      reviewedById: null,
      reviewedAt: null,
      ownerId: deal.ownerId,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
    });
    approvalQuoteIds.add(quote.id);
  }
  return approvals;
};
