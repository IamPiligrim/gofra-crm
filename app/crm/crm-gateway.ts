import {
  BRIEF_ASSET_KINDS,
  CRM_SCHEMA_VERSION,
  DEFAULT_SALES_CONTROL_SETTINGS,
  DEAL_PROCESS_STEPS,
  DEAL_STATUSES,
  DECISION_INFLUENCES,
  DECISION_ROLES,
  PACKING_METHODS,
  PREFERRED_CHANNELS,
  QUOTE_STATUSES,
  LOSS_REASONS,
  SENT_IMPLYING_STATUSES,
  createEmptyDealBrief,
  createEmptyDealProcess,
  getImpliedProcessSteps,
  type Attachment,
  type BriefAsset,
  type BriefAssetStatus,
  type BriefDimensions,
  type Client,
  type Contact,
  type CrmSnapshot,
  type Deal,
  type DealBrief,
  type DealProcess,
  type DealProcessMilestone,
  type DealProcessStep,
  type DealStatus,
  type Dictionaries,
  type Interaction,
  type PackingMethod,
  type PriceApproval,
  type PriceApprovalStatus,
  type PriceApprovalTrigger,
  type Quote,
  type Session,
  type StatusEvent,
  type Target,
  type Task,
  type Team,
  type User,
  type UserRole,
} from "./domain";
import {
  calculateExpectedNextOrder,
  normalizeDealNextAction,
  resolveExpectedNextOrder,
  syncRepeatOrderTasks,
} from "./sales-automation";
import { syncThresholdPriceApprovals } from "./leader-control";
import {
  DEMO_TEAM_ID,
  DEMO_USER_IDS,
  demoSession,
  demoSnapshot,
  demoTargets,
  demoTeams,
  demoUsers,
} from "./fixtures";

export const CRM_STORAGE_KEY = "gofra-crm-prototype:v6";
export const LEGACY_CRM_STORAGE_KEYS = [
  "gofra-crm-prototype:v5",
  "gofra-crm-prototype:v4",
  "gofra-crm-prototype:v3",
  "gofra-crm-prototype:v2",
  "gofra-crm-prototype:v1",
] as const;

type JsonRecord = Record<string, unknown>;

const clone = <T,>(value: T): T =>
  JSON.parse(JSON.stringify(value)) as T;

const pause = (duration = 320) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, duration);
  });

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asRecord = (value: unknown): JsonRecord =>
  isRecord(value) ? value : {};

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const asNullableString = (
  value: unknown,
  fallback: string | null = null,
): string | null =>
  typeof value === "string" ? value : value === null ? null : fallback;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const asNullableNumber = (
  value: unknown,
  fallback: number | null = null,
): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const asBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const normalizeAttachments = (value: unknown): Attachment[] =>
  asArray(value).map((attachment, index) => {
    const record = asRecord(attachment);
    return {
      id: asString(record.id, `attachment-${index + 1}`),
      name: asString(record.name, `Файл ${index + 1}`),
      type: asString(record.type, "application/octet-stream"),
      size: Math.max(0, asNumber(record.size)),
    };
  });

const unique = <T,>(values: readonly T[]): T[] => [...new Set(values)];

const initialsFromName = (fullName: string): string =>
  fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("ru-RU") ?? "")
    .join("");

const hashText = (value: string): string => {
  let hash = 2166136261;
  for (const symbol of value) {
    hash ^= symbol.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

const importedUserId = (fullName: string): string =>
  `user-imported-${hashText(fullName.trim().toLocaleLowerCase("ru-RU"))}`;

const normalizeTeam = (value: unknown, now: string, index: number): Team => {
  const record = asRecord(value);
  const createdAt = asString(record.createdAt, now);

  return {
    ...record,
    id: asString(record.id, `team-imported-${index + 1}`),
    name: asString(record.name, `Команда ${index + 1}`),
    createdAt,
    updatedAt: asString(record.updatedAt, createdAt),
  } as Team;
};

const normalizeUser = (
  value: unknown,
  now: string,
  index: number,
  fallbackTeamId: string,
): User => {
  const record = asRecord(value);
  const fullName = asString(record.fullName, `Сотрудник ${index + 1}`);
  const createdAt = asString(record.createdAt, now);
  const role: UserRole =
    record.role === "manager" || record.role === "employee"
      ? record.role
      : "employee";

  return {
    ...record,
    id: asString(record.id, importedUserId(fullName)),
    teamId: asString(record.teamId, fallbackTeamId),
    fullName,
    email: asString(record.email),
    role,
    jobTitle: asString(
      record.jobTitle,
      role === "manager" ? "Руководитель отдела продаж" : "Менеджер по продажам",
    ),
    initials: asString(record.initials, initialsFromName(fullName)),
    isActive: asBoolean(record.isActive, true),
    createdAt,
    updatedAt: asString(record.updatedAt, createdAt),
  } as User;
};

const collectLegacyManagerNames = (source: JsonRecord): string[] =>
  unique(
    [
      ...asArray(source.clients),
      ...asArray(source.deals),
      ...asArray(source.interactions),
    ]
      .map((value) => asString(asRecord(value).managerName).trim())
      .filter(Boolean),
  );

const ensureRecordOwnersExist = (
  source: JsonRecord,
  users: User[],
  now: string,
  fallbackTeamId: string,
): void => {
  const records = [
    ...asArray(source.clients),
    ...asArray(source.contacts),
    ...asArray(source.deals),
    ...asArray(source.interactions),
  ];

  for (const value of records) {
    const record = asRecord(value);
    const ownerId = asString(record.ownerId);
    if (!ownerId || users.some((user) => user.id === ownerId)) continue;

    const fullName =
      asString(record.managerName).trim() || "Импортированный сотрудник";
    users.push({
      id: ownerId,
      teamId: fallbackTeamId,
      fullName,
      email: "",
      role: "employee",
      jobTitle: "Менеджер по продажам",
      initials: initialsFromName(fullName),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }
};

const normalizeDictionaries = (
  value: unknown,
  fallback: Dictionaries,
): Dictionaries => {
  const record = asRecord(value);
  const pickStrings = (key: keyof Dictionaries): string[] => {
    const values = asArray(record[key]).filter(
      (item): item is string => typeof item === "string",
    );
    return values.length ? unique(values) : clone(fallback[key]) as string[];
  };

  return {
    potentials: pickStrings("potentials"),
    industries: pickStrings("industries"),
    productTypes: pickStrings("productTypes"),
    sources: pickStrings("sources"),
    interactionTypes:
      pickStrings("interactionTypes") as Dictionaries["interactionTypes"],
  };
};

const normalizeTask = (
  value: unknown,
  now: string,
  index: number,
  fallbackAssigneeId: string,
): Task => {
  const record = asRecord(value);
  const createdAt = asString(record.createdAt, now);
  const id = asString(record.id, `task-imported-${index + 1}`);
  const status =
    record.status === "completed" ||
    record.status === "cancelled" ||
    record.status === "open"
      ? record.status
      : "open";
  const kind =
    record.kind === "call" ||
    record.kind === "meeting" ||
    record.kind === "email" ||
    record.kind === "proposal" ||
    record.kind === "follow_up" ||
    record.kind === "reminder" ||
    record.kind === "other"
      ? record.kind
      : "other";
  const priority =
    record.priority === "low" ||
    record.priority === "normal" ||
    record.priority === "high"
      ? record.priority
      : "normal";
  const source: Task["source"] =
    record.source === "manual" ||
    record.source === "client" ||
    record.source === "deal" ||
    record.source === "interaction" ||
    record.source === "repeat_order" ||
    record.source === "price_approval" ||
    record.source === "imported"
      ? record.source
      : id.includes("interaction") || id.includes("ИВ")
        ? "interaction"
        : id.includes("deal") || id.includes("СД")
          ? "deal"
          : id.includes("client") || id.includes("КЛ")
            ? "client"
            : "imported";
  const sourceId =
    asNullableString(record.sourceId) ??
    (source === "client"
      ? asNullableString(record.clientId)
      : source === "deal"
        ? asNullableString(record.dealId)
        : null);
  const checklist = asArray(record.checklist)
    .map((value, checklistIndex) => {
      const checklistItem = asRecord(value);
      const title = asString(checklistItem.title).trim();
      if (!title) return null;
      return {
        id: asString(
          checklistItem.id,
          `${id}-checklist-${checklistIndex + 1}`,
        ),
        title,
        completed: asBoolean(checklistItem.completed),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    ...record,
    id,
    title: asString(record.title, "Задача без названия"),
    description: asString(record.description),
    kind,
    status,
    priority,
    dueAt: asNullableString(record.dueAt),
    completedAt: asNullableString(record.completedAt),
    assigneeId: asString(record.assigneeId, fallbackAssigneeId),
    createdById: asString(record.createdById, fallbackAssigneeId),
    source,
    sourceId,
    checklist,
    clientId: asNullableString(record.clientId),
    dealId: asNullableString(record.dealId),
    contactId: asNullableString(record.contactId),
    createdAt,
    updatedAt: asString(record.updatedAt, createdAt),
  } as Task;
};

const normalizeStatusEvent = (
  value: unknown,
  now: string,
  index: number,
  fallbackUserId: string,
): StatusEvent => {
  const record = asRecord(value);
  const changedAt = asString(record.changedAt, now);

  return {
    ...record,
    id: asString(record.id, `status-event-imported-${index + 1}`),
    entityType: record.entityType === "deal" ? "deal" : "client",
    entityId: asString(record.entityId),
    fromStatus: asNullableString(record.fromStatus),
    toStatus: asNullableString(record.toStatus),
    changedById: asString(record.changedById, fallbackUserId),
    changedAt,
    createdAt: asString(record.createdAt, changedAt),
    updatedAt: asString(record.updatedAt, changedAt),
  } as StatusEvent;
};

const normalizeTarget = (
  value: unknown,
  now: string,
  index: number,
  fallbackTeamId: string,
): Target => {
  const record = asRecord(value);
  const createdAt = asString(record.createdAt, now);
  const metric =
    record.metric === "margin" ||
    record.metric === "deals_won" ||
    record.metric === "new_clients" ||
    record.metric === "activities" ||
    record.metric === "revenue"
      ? record.metric
      : "revenue";

  return {
    ...record,
    id: asString(record.id, `target-imported-${index + 1}`),
    scope: record.scope === "user" ? "user" : "team",
    subjectId: asString(record.subjectId, fallbackTeamId),
    metric,
    periodStart: asString(record.periodStart, "2026-07-01"),
    periodEnd: asString(record.periodEnd, "2026-07-31"),
    targetValue: asNumber(record.targetValue),
    unit: record.unit === "count" ? "count" : "RUB",
    createdAt,
    updatedAt: asString(record.updatedAt, createdAt),
  } as Target;
};

const createTasksFromLegacyRecords = (
  clients: readonly Client[],
  deals: readonly Deal[],
  interactions: readonly Interaction[],
  createdById: string,
): Task[] => {
  const clientTasks = clients
    .filter((client) => client.nextAction.trim())
    .map<Task>((client) => ({
      id: `task-legacy-client-${client.id}`,
      title: client.nextAction,
      description: `Мигрировано из следующего действия клиента «${client.companyName}».`,
      kind: "follow_up",
      status: "open",
      priority: "normal",
      dueAt: client.nextActionAt,
      completedAt: null,
      assigneeId: client.ownerId,
      createdById,
      source: "client",
      sourceId: client.id,
      checklist: [],
      clientId: client.id,
      dealId: null,
      contactId: null,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    }));

  const dealTasks = deals
    .filter((deal) => deal.nextAction.trim())
    .map<Task>((deal) => ({
      id: `task-legacy-deal-${deal.id}`,
      title: deal.nextAction,
      description: `Мигрировано из следующего действия сделки «${deal.title}».`,
      kind: "follow_up",
      status: "open",
      priority: "normal",
      dueAt: deal.nextActionAt,
      completedAt: null,
      assigneeId: deal.ownerId,
      createdById,
      source: "deal",
      sourceId: deal.id,
      checklist: [],
      clientId: deal.clientId,
      dealId: deal.id,
      contactId: deal.contactId,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    }));

  const interactionTasks = interactions
    .filter((interaction) => interaction.nextStep.trim())
    .map<Task>((interaction) => ({
      id: `task-legacy-interaction-${interaction.id}`,
      title: interaction.nextStep,
      description: `Мигрировано из следующего шага взаимодействия «${interaction.subject}».`,
      kind: "follow_up",
      status: "open",
      priority: "normal",
      dueAt: interaction.nextStepAt,
      completedAt: null,
      assigneeId: interaction.ownerId,
      createdById,
      source: "interaction",
      sourceId: interaction.id,
      checklist: [],
      clientId: interaction.clientId,
      dealId: null,
      contactId: interaction.contactId,
      createdAt: interaction.createdAt,
      updatedAt: interaction.updatedAt,
    }));

  return [...clientTasks, ...dealTasks, ...interactionTasks];
};

const createInitialStatusEvents = (
  clients: readonly Client[],
  deals: readonly Deal[],
): StatusEvent[] => [
  ...clients.map<StatusEvent>((client) => ({
    id: `status-legacy-client-${client.id}`,
    entityType: "client",
    entityId: client.id,
    fromStatus: null,
    toStatus: client.status,
    changedById: client.ownerId,
    changedAt: client.updatedAt,
    createdAt: client.updatedAt,
    updatedAt: client.updatedAt,
  })),
  ...deals.map<StatusEvent>((deal) => ({
    id: `status-legacy-deal-${deal.id}`,
    entityType: "deal",
    entityId: deal.id,
    fromStatus: null,
    toStatus: deal.status,
    changedById: deal.ownerId,
    changedAt: deal.updatedAt,
    createdAt: deal.updatedAt,
    updatedAt: deal.updatedAt,
  })),
];

const normalizeDimensions = (value: unknown): BriefDimensions => {
  const record = asRecord(value);
  return {
    length: asNullableNumber(record.length),
    width: asNullableNumber(record.width),
    height: asNullableNumber(record.height),
  };
};

const normalizeBriefAsset = (value: unknown): BriefAsset => {
  const record = asRecord(value);
  const status: BriefAssetStatus =
    record.status === "received" || record.status === "requested"
      ? record.status
      : "missing";
  return { status, note: asString(record.note) };
};

const normalizeDealBrief = (value: unknown): DealBrief => {
  const record = asRecord(value);
  const empty = createEmptyDealBrief();
  const packingMethod = PACKING_METHODS.find(
    (method) => method === record.packingMethod,
  ) as PackingMethod | undefined;

  return {
    ...empty,
    packagingType: asString(record.packagingType),
    fefco: asString(record.fefco),
    innerDimensions: normalizeDimensions(record.innerDimensions),
    outerDimensions: normalizeDimensions(record.outerDimensions),
    cardboardGrade: asString(record.cardboardGrade),
    fluteProfile: asString(record.fluteProfile),
    printMethod: asString(record.printMethod),
    printColors: asNullableNumber(record.printColors),
    coating: asString(record.coating),
    batchVolume: asString(record.batchVolume),
    monthlyVolume: asString(record.monthlyVolume),
    annualVolume: asString(record.annualVolume),
    packingMethod: packingMethod ?? empty.packingMethod,
    loadRequirement: asString(record.loadRequirement),
    storageRequirement: asString(record.storageRequirement),
    palletizing: asString(record.palletizing),
    currentSupplier: asString(record.currentSupplier),
    currentPrice: asNullableNumber(record.currentPrice),
    clientProblem: asString(record.clientProblem),
    assets: Object.fromEntries(
      BRIEF_ASSET_KINDS.map((kind) => [
        kind,
        normalizeBriefAsset(asRecord(record.assets)[kind]),
      ]),
    ) as DealBrief["assets"],
    updatedAt: asNullableString(record.updatedAt),
  };
};

const normalizeMilestone = (value: unknown): DealProcessMilestone => {
  const record = asRecord(value);
  return {
    completedAt: asNullableString(record.completedAt),
    completedById: asNullableString(record.completedById),
    note: asString(record.note),
  };
};

const normalizeDealProcess = (value: unknown): DealProcess => {
  const record = asRecord(value);
  const storedSteps = asRecord(record.steps);
  const process = createEmptyDealProcess();
  for (const step of DEAL_PROCESS_STEPS) {
    process.steps[step] = normalizeMilestone(storedSteps[step]);
  }
  process.replyExpectedAt = asNullableString(record.replyExpectedAt);
  process.sampleSkipped = asBoolean(record.sampleSkipped);
  process.updatedAt = asNullableString(record.updatedAt);
  return process;
};

const backfillProcessFromStatus = (
  process: DealProcess,
  deal: Pick<Deal, "id" | "status" | "createdAt" | "ownerId">,
  statusEvents: readonly StatusEvent[],
): DealProcess => {
  const implied = getImpliedProcessSteps(deal.status);
  const fallbackByStep: Partial<Record<DealProcessStep, DealStatus>> = {
    specReceived: "Уточняем ТЗ",
    calculationRequested: "Считаем цену",
    calculationReceived: "Считаем цену",
    quoteSent: "КП отправлено",
  };

  for (const step of implied) {
    if (process.steps[step].completedAt) continue;
    const fallbackStatus = fallbackByStep[step];
    const event = fallbackStatus
      ? statusEvents.find(
          (candidate) =>
            candidate.entityType === "deal" &&
            candidate.entityId === deal.id &&
            candidate.toStatus === fallbackStatus,
        )
      : undefined;
    process.steps[step] = {
      completedAt: event?.changedAt ?? deal.createdAt,
      completedById: deal.ownerId,
      note: "",
    };
  }
  return process;
};

const normalizeQuote = (value: unknown, now: string, index: number): Quote => {
  const record = asRecord(value);
  const dealId = asString(record.dealId);
  const version = Math.max(1, Math.trunc(asNumber(record.version, index + 1)));
  const rawStatus = asString(record.status) as Quote["status"];
  const createdAt = asString(record.createdAt, now);
  return {
    id: asString(record.id, `КП-${dealId}-${version}`),
    dealId,
    version,
    status: QUOTE_STATUSES.includes(rawStatus) ? rawStatus : "Черновик",
    revenue: Math.max(0, asNumber(record.revenue)),
    cost: Math.max(0, asNumber(record.cost)),
    logistics: Math.max(0, asNumber(record.logistics)),
    volume: asString(record.volume),
    validUntil: asNullableString(record.validUntil),
    changeReason: asString(record.changeReason),
    sentAt: asNullableString(record.sentAt),
    authorId: asString(record.authorId),
    comment: asString(record.comment),
    createdAt,
    updatedAt: asString(record.updatedAt, createdAt),
  };
};

const createQuoteFromLegacyDeal = (
  record: JsonRecord,
  deal: Pick<Deal, "id" | "status" | "ownerId" | "createdAt">,
  now: string,
): Quote | null => {
  const revenue = Math.max(0, asNumber(record.ourPrice, asNumber(record.clientPrice)));
  const cost = Math.max(0, asNumber(record.purchasePrice));
  const logistics = Math.max(0, asNumber(record.logistics));
  if (revenue === 0 && cost === 0 && logistics === 0) return null;
  const proposalDate = asNullableString(record.proposalDate);
  const sent = proposalDate !== null || SENT_IMPLYING_STATUSES.includes(deal.status);
  return {
    id: `КП-${deal.id}-1`,
    dealId: deal.id,
    version: 1,
    status: sent ? "Отправлено" : "Черновик",
    revenue,
    cost,
    logistics,
    volume: asString(record.volume),
    validUntil: null,
    changeReason: "",
    sentAt: proposalDate,
    authorId: deal.ownerId,
    comment: "",
    createdAt: asString(record.createdAt, now),
    updatedAt: asString(record.updatedAt, now),
  };
};

const syncLegacyDealEconomics = (deal: Deal, quote: Quote | undefined): void => {
  if (!quote) return;
  const margin = quote.revenue - quote.cost - quote.logistics;
  deal.clientPrice = quote.revenue;
  deal.ourPrice = quote.revenue;
  deal.purchasePrice = quote.cost;
  deal.logistics = quote.logistics;
  deal.margin = margin;
  deal.marginPercent =
    quote.revenue === 0
      ? 0
      : Math.round((margin / quote.revenue) * 1000) / 10;
  deal.proposalDate = quote.sentAt;
};

/**
 * Upgrades legacy browser snapshots to the current schema.
 * Existing record IDs and legacy display fields are kept verbatim.
 */
export const migrateCrmSnapshot = (
  input: unknown,
  migratedAt = new Date().toISOString(),
): CrmSnapshot => {
  if (!isRecord(input)) {
    throw new TypeError("Снимок CRM имеет неверный формат.");
  }

  const source = input;
  const hasCoreCollections = [
    source.clients,
    source.contacts,
    source.deals,
    source.interactions,
  ].every(Array.isArray);
  if (!hasCoreCollections || !isRecord(source.dictionaries)) {
    throw new TypeError("В снимке CRM отсутствуют обязательные коллекции.");
  }

  const sourceSchemaVersion = asNumber(source.schemaVersion, 1);
  const isTeamAware = sourceSchemaVersion >= 2;

  const teamsSource =
    isTeamAware && Array.isArray(source.teams) ? source.teams : demoTeams;
  const teams = teamsSource.map((team, index) =>
    normalizeTeam(team, migratedAt, index),
  );
  if (!teams.length) teams.push(clone(demoTeams[0]));

  const fallbackTeamId = teams[0]?.id ?? DEMO_TEAM_ID;
  const usersSource =
    isTeamAware && Array.isArray(source.users) ? source.users : demoUsers;
  const users = usersSource.map((user, index) =>
    normalizeUser(user, migratedAt, index, fallbackTeamId),
  );

  for (const managerName of collectLegacyManagerNames(source)) {
    if (
      users.some(
        (user) =>
          user.fullName.toLocaleLowerCase("ru-RU") ===
          managerName.toLocaleLowerCase("ru-RU"),
      )
    ) {
      continue;
    }

    users.push({
      id: importedUserId(managerName),
      teamId: fallbackTeamId,
      fullName: managerName,
      email: "",
      role: "employee",
      jobTitle: "Менеджер по продажам",
      initials: initialsFromName(managerName),
      isActive: true,
      createdAt: migratedAt,
      updatedAt: migratedAt,
    });
  }

  ensureRecordOwnersExist(source, users, migratedAt, fallbackTeamId);
  if (!users.length) users.push(clone(demoUsers[0]));

  const userById = new Map(users.map((user) => [user.id, user]));
  const userIdByName = new Map(
    users.map((user) => [
      user.fullName.toLocaleLowerCase("ru-RU"),
      user.id,
    ]),
  );

  const sourceSession = asRecord(source.session);
  const requestedCurrentUserId = asString(
    sourceSession.currentUserId,
    asString(source.currentUserId, DEMO_USER_IDS.sofia),
  );
  const currentUserId = userById.has(requestedCurrentUserId)
    ? requestedCurrentUserId
    : (users.find((user) => user.role === "manager")?.id ?? users[0].id);
  const currentUser = userById.get(currentUserId) ?? users[0];
  const requestedTeamId = asString(
    sourceSession.activeTeamId,
    currentUser.teamId,
  );
  const activeTeamId = teams.some((team) => team.id === requestedTeamId)
    ? requestedTeamId
    : fallbackTeamId;
  const session: Session = {
    ...sourceSession,
    id: asString(sourceSession.id, demoSession.id),
    currentUserId,
    activeTeamId,
    startedAt: asString(sourceSession.startedAt, migratedAt),
  } as Session;

  const resolveOwnerId = (
    record: JsonRecord,
    fallbackOwnerId = currentUserId,
  ): string => {
    const explicitOwnerId = asString(record.ownerId);
    if (explicitOwnerId && userById.has(explicitOwnerId)) {
      return explicitOwnerId;
    }

    const managerName = asString(record.managerName)
      .trim()
      .toLocaleLowerCase("ru-RU");
    return userIdByName.get(managerName) ?? fallbackOwnerId;
  };

  const clients = asArray(source.clients).map<Client>((value) => {
    const record = asRecord(value);
    const ownerId = resolveOwnerId(record);
    const lastContactAt = asNullableString(record.lastContactAt);
    const createdAt = asString(record.createdAt, lastContactAt ?? migratedAt);
    const updatedAt = asString(record.updatedAt, lastContactAt ?? createdAt);
    const orderFrequencyDays = asNullableNumber(record.orderFrequencyDays);
    const lastShipmentAt = asNullableString(record.lastShipmentAt);
    const storedExpectedNextOrderAt = asNullableString(
      record.expectedNextOrderAt,
    );
    const calculatedExpectedNextOrderAt = calculateExpectedNextOrder(
      lastShipmentAt,
      orderFrequencyDays,
    );
    const expectedNextOrderManual = asBoolean(
      record.expectedNextOrderManual,
      Boolean(
        storedExpectedNextOrderAt &&
          storedExpectedNextOrderAt !== calculatedExpectedNextOrderAt,
      ),
    );
    const expectedNextOrderAt = resolveExpectedNextOrder({
      lastShipmentAt,
      orderFrequencyDays,
      expectedNextOrderAt: storedExpectedNextOrderAt,
      expectedNextOrderManual,
    });
    const rawReminderDays = asNumber(record.repeatReminderDays, 14);

    return {
      ...record,
      ownerId,
      managerName: asString(
        record.managerName,
        userById.get(ownerId)?.fullName ?? "",
      ),
      orderFrequencyDays,
      lastShipmentAt,
      expectedNextOrderAt,
      expectedNextOrderManual,
      averageMonthlyVolume: Math.max(
        0,
        asNumber(record.averageMonthlyVolume),
      ),
      repeatReminderDays: rawReminderDays === 7 ? 7 : 14,
      createdAt,
      updatedAt,
    } as unknown as Client;
  });
  const clientById = new Map(clients.map((client) => [client.id, client]));

  const contacts = asArray(source.contacts).map<Contact>((value) => {
    const record = asRecord(value);
    const client = clientById.get(asString(record.clientId));
    const ownerId = resolveOwnerId(record, client?.ownerId ?? currentUserId);
    const createdAt = asString(record.createdAt, client?.createdAt ?? migratedAt);

    return {
      ...record,
      ownerId,
      decisionRole: DECISION_ROLES.includes(
        record.decisionRole as (typeof DECISION_ROLES)[number],
      )
        ? (record.decisionRole as Contact["decisionRole"])
        : "Закупщик",
      decisionInfluence: DECISION_INFLUENCES.includes(
        record.decisionInfluence as (typeof DECISION_INFLUENCES)[number],
      )
        ? (record.decisionInfluence as Contact["decisionInfluence"])
        : "Влияет",
      preferredChannel: PREFERRED_CHANNELS.includes(
        record.preferredChannel as (typeof PREFERRED_CHANNELS)[number],
      )
        ? (record.preferredChannel as Contact["preferredChannel"])
        : "Телефон",
      introductionNeeded: asString(record.introductionNeeded),
      createdAt,
      updatedAt: asString(record.updatedAt, createdAt),
    } as unknown as Contact;
  });

  const deals = asArray(source.deals).map<Deal>((value) => {
    const record = asRecord(value);
    const client = clientById.get(asString(record.clientId));
    const ownerId = resolveOwnerId(record, client?.ownerId ?? currentUserId);
    const proposalDate = asNullableString(record.proposalDate);
    const createdAt = asString(
      record.createdAt,
      proposalDate ? `${proposalDate}T08:00:00.000Z` : migratedAt,
    );

    const rawStatus = asString(record.status, "Новая заявка");
    const status = DEAL_STATUSES.includes(
      rawStatus as (typeof DEAL_STATUSES)[number],
    )
      ? (rawStatus as Deal["status"])
      : "Новая заявка";
    const process = normalizeDealProcess(record.process);
    const rawLossReason = asNullableString(record.lossReason);
    const lossReason = LOSS_REASONS.includes(
      rawLossReason as (typeof LOSS_REASONS)[number],
    )
      ? (rawLossReason as Deal["lossReason"])
      : rawLossReason
        ? "Другое"
        : null;
    return normalizeDealNextAction({
      ...record,
      ownerId,
      status,
      clientPrice: Math.max(0, asNumber(record.clientPrice, asNumber(record.ourPrice))),
      ourPrice: Math.max(0, asNumber(record.ourPrice, asNumber(record.clientPrice))),
      purchasePrice: Math.max(0, asNumber(record.purchasePrice)),
      logistics: Math.max(0, asNumber(record.logistics)),
      margin: asNumber(record.margin),
      marginPercent: asNumber(record.marginPercent),
      proposalDate,
      forecastCloseAt: asNullableString(
        record.forecastCloseAt,
        process.replyExpectedAt ?? asNullableString(record.nextActionAt),
      ),
      lossReason,
      brief: normalizeDealBrief(record.brief),
      process,
      activeQuoteId: asNullableString(record.activeQuoteId),
      nextAction: asString(record.nextAction),
      nextActionAt: asNullableString(record.nextActionAt),
      needsNextAction: asBoolean(record.needsNextAction),
      managerName: asString(
        record.managerName,
        userById.get(ownerId)?.fullName ?? "",
      ),
      createdAt,
      updatedAt: asString(record.updatedAt, createdAt),
    } as unknown as Deal, new Date(migratedAt));
  });

  const interactions = asArray(source.interactions).map<Interaction>((value) => {
    const record = asRecord(value);
    const client = clientById.get(asString(record.clientId));
    const ownerId = resolveOwnerId(record, client?.ownerId ?? currentUserId);
    const occurredAt = asString(record.occurredAt, migratedAt);
    const createdAt = asString(record.createdAt, occurredAt);

    return {
      ...record,
      ownerId,
      dealId: asNullableString(record.dealId),
      managerName: asString(
        record.managerName,
        userById.get(ownerId)?.fullName ?? "",
      ),
      attachments: normalizeAttachments(record.attachments),
      createdAt,
      updatedAt: asString(record.updatedAt, createdAt),
    } as unknown as Interaction;
  });

  const baseTasks = Array.isArray(source.tasks)
    ? source.tasks.map((task, index) =>
        normalizeTask(task, migratedAt, index, currentUserId),
      )
    : createTasksFromLegacyRecords(
        clients,
        deals,
        interactions,
        currentUserId,
      );
  const tasks = syncRepeatOrderTasks(clients, baseTasks, new Date(migratedAt));

  const priceApprovals = asArray(source.priceApprovals).map<PriceApproval>(
    (value, index) => {
      const record = asRecord(value);
      const statusValue = asString(record.status, "pending");
      const status: PriceApprovalStatus = [
        "pending",
        "approved",
        "rejected",
        "clarification",
      ].includes(statusValue)
        ? (statusValue as PriceApprovalStatus)
        : "pending";
      const createdAt = asString(record.createdAt, migratedAt);
      const triggerValue = asString(record.trigger, "manual");
      const trigger: PriceApprovalTrigger = [
        "manual",
        "discount",
        "low_margin",
        "discount_and_margin",
      ].includes(triggerValue)
        ? (triggerValue as PriceApprovalTrigger)
        : "manual";
      return {
        id: asString(record.id, `approval-${index + 1}`),
        clientId: asString(record.clientId),
        dealId: asString(record.dealId),
        product: asString(record.product),
        currentPrice: Math.max(0, asNumber(record.currentPrice)),
        requestedPrice: Math.max(0, asNumber(record.requestedPrice)),
        volume: asString(record.volume),
        reason: asString(record.reason),
        comment: asString(record.comment),
        attachments: normalizeAttachments(record.attachments),
        trigger,
        quoteId: asNullableString(record.quoteId),
        marginPercent: asNullableNumber(record.marginPercent),
        discountPercent: asNullableNumber(record.discountPercent),
        thresholdPercent: asNullableNumber(record.thresholdPercent),
        status,
        requestedById: asString(record.requestedById, currentUserId),
        reviewedById: asNullableString(record.reviewedById),
        reviewedAt: asNullableString(record.reviewedAt),
        ownerId: resolveOwnerId(record),
        createdAt,
        updatedAt: asString(record.updatedAt, createdAt),
      };
    },
  );

  const statusEvents = Array.isArray(source.statusEvents)
    ? source.statusEvents.map((event, index) =>
        normalizeStatusEvent(event, migratedAt, index, currentUserId),
      )
    : createInitialStatusEvents(clients, deals);

  const dealRecords = new Map(
    asArray(source.deals).map((value) => {
      const record = asRecord(value);
      return [asString(record.id), record] as const;
    }),
  );
  const dealById = new Map(deals.map((deal) => [deal.id, deal]));
  const quotes = asArray(source.quotes)
    .map((value, index) => normalizeQuote(value, migratedAt, index))
    .filter((quote) => dealById.has(quote.dealId));

  for (const deal of deals) {
    const record = dealRecords.get(deal.id) ?? {};
    const proposalDate = asNullableString(record.proposalDate);
    if (proposalDate && !deal.process.steps.quoteSent.completedAt) {
      deal.process.steps.quoteSent = {
        completedAt: proposalDate,
        completedById: deal.ownerId,
        note: "",
      };
    }
    if (deal.brief.updatedAt && !deal.process.steps.specReceived.completedAt) {
      deal.process.steps.specReceived = {
        completedAt: deal.brief.updatedAt,
        completedById: deal.ownerId,
        note: "",
      };
    }
    deal.process = backfillProcessFromStatus(deal.process, deal, statusEvents);

    const dealQuotes = quotes.filter((quote) => quote.dealId === deal.id);
    if (!dealQuotes.length) {
      const migratedQuote = createQuoteFromLegacyDeal(record, deal, migratedAt);
      if (migratedQuote) {
        quotes.push(migratedQuote);
        deal.activeQuoteId = migratedQuote.id;
        syncLegacyDealEconomics(deal, migratedQuote);
      } else {
        deal.activeQuoteId = null;
      }
      continue;
    }

    dealQuotes
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .forEach((quote, index) => {
        quote.version = index + 1;
      });
    if (!dealQuotes.some((quote) => quote.id === deal.activeQuoteId)) {
      const liveQuotes = dealQuotes.filter((quote) => quote.status !== "Заменено");
      deal.activeQuoteId = (liveQuotes.at(-1) ?? dealQuotes.at(-1))?.id ?? null;
    }
    syncLegacyDealEconomics(
      deal,
      dealQuotes.find((quote) => quote.id === deal.activeQuoteId),
    );
  }

  const targetSource = Array.isArray(source.targets)
    ? source.targets
    : demoTargets;
  const targets = targetSource.map((target, index) =>
    normalizeTarget(target, migratedAt, index, activeTeamId),
  );

  const salesControlSource = asRecord(source.salesControl);
  const salesControl = {
    minMarginPercent: clamp(
      asNumber(
        salesControlSource.minMarginPercent,
        DEFAULT_SALES_CONTROL_SETTINGS.minMarginPercent,
      ),
      0,
      100,
    ),
    maxDiscountPercent: clamp(
      asNumber(
        salesControlSource.maxDiscountPercent,
        DEFAULT_SALES_CONTROL_SETTINGS.maxDiscountPercent,
      ),
      0,
      100,
    ),
    stagnantDealDays: Math.max(
      1,
      Math.round(
        asNumber(
          salesControlSource.stagnantDealDays,
          DEFAULT_SALES_CONTROL_SETTINGS.stagnantDealDays,
        ),
      ),
    ),
    staleClientDays: Math.max(
      1,
      Math.round(
        asNumber(
          salesControlSource.staleClientDays,
          DEFAULT_SALES_CONTROL_SETTINGS.staleClientDays,
        ),
      ),
    ),
  };

  const normalizedSnapshot: CrmSnapshot = {
    schemaVersion: CRM_SCHEMA_VERSION,
    teams,
    users,
    session,
    clients,
    contacts,
    deals,
    interactions,
    priceApprovals,
    quotes,
    tasks,
    statusEvents,
    targets,
    salesControl,
    dictionaries: normalizeDictionaries(
      source.dictionaries,
      demoSnapshot.dictionaries,
    ),
  };

  return {
    ...normalizedSnapshot,
    priceApprovals: syncThresholdPriceApprovals(normalizedSnapshot),
  };
};

export interface CrmGateway {
  load(signal?: AbortSignal): Promise<CrmSnapshot>;
  save(snapshot: CrmSnapshot): Promise<void>;
  reset(): Promise<CrmSnapshot>;
}

class BrowserMockGateway implements CrmGateway {
  async load(signal?: AbortSignal): Promise<CrmSnapshot> {
    await pause();
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const stored = window.localStorage.getItem(CRM_STORAGE_KEY);
    if (stored) {
      try {
        const snapshot = migrateCrmSnapshot(JSON.parse(stored));
        window.localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(snapshot));
        return snapshot;
      } catch {
        window.localStorage.removeItem(CRM_STORAGE_KEY);
      }
    }

    for (const legacyKey of LEGACY_CRM_STORAGE_KEYS) {
      const legacy = window.localStorage.getItem(legacyKey);
      if (!legacy) continue;
      try {
        const snapshot = migrateCrmSnapshot(JSON.parse(legacy));
        window.localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(snapshot));
        return snapshot;
      } catch {
        // Keep legacy values as recoverable backups and try the next version.
      }
    }

    return clone(demoSnapshot);
  }

  async save(snapshot: CrmSnapshot): Promise<void> {
    const normalized = migrateCrmSnapshot(snapshot);
    window.localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(normalized));
  }

  async reset(): Promise<CrmSnapshot> {
    const snapshot = clone(demoSnapshot);
    window.localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(snapshot));
    for (const legacyKey of LEGACY_CRM_STORAGE_KEYS) {
      window.localStorage.removeItem(legacyKey);
    }
    await pause(180);
    return snapshot;
  }
}

export const crmGateway: CrmGateway = new BrowserMockGateway();
