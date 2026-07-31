# Project Context Pack

- ID: `ctx-20260731121333-506f8f3e9e`
- Generated: 2026-07-31T12:13:33.529Z
- Project: ГОФРА CRM (`project-f82e060fa046c964c4c1`)
- Source state: `ac18184e5d3059059285cc1bfe607def563d2c06867a61561238cdc28ad3c57b`

## Task

Handoff context after completing the cross-page scroll fix: all workspace-local headers, tabs, filters and action bars scroll with content; global left sidebar remains independently sticky. Continue future CRM feature work from this verified state.

## Acceptance Criteria

- Preserve normal-flow positioning for workspace header and shared page-local controls.
- Preserve independent sticky/scrollable global left sidebar.
- Regression assertions in tests/static-build.test.mjs must remain green.
- Current verified checks: lint, 12 tests, production build, seven-route desktop/mobile browser audit, strict visual handoff pass.

## Routed Skills

- `bugfix-investigator` (custom): root-cause and regression workflow
- `beta-frontend-maintainer` (custom): frontend domain
- `frontend-quality-gate` (custom): frontend verification

## Project Shape

- Types: frontend
- Stack: Node.js, TypeScript, React, Vite, Tailwind CSS, GitHub Actions
- Domains inferred from task: frontend

## Relevant Commands

- Dev: `pnpm run dev` (cwd: `.`)
- Test: `pnpm run test` (cwd: `.`)
- Lint: `pnpm run lint` (cwd: `.`)
- Typecheck: `Not detected` (cwd: `.`)
- Build: `pnpm run build` (cwd: `.`)

## Risks And Quality Gaps

- Script `test` may be unsafe for automatic runs: Shell operator '&' is forbidden..
- Typecheck command is not detected.

## Selected Source Files

### `app/crm/WorkspaceFeatures.tsx`

Relevance: 135; currently changed, path matches "crm", filename matches "feature", filename matches "work".
SHA-256: `106f637118be87bc2bc15e347d373d93687ca2c87389e58524b712c03539b948`

```text
"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  DEAL_PIPELINE,
  type CrmSnapshot,
  type Deal,
  type Interaction,
  type StatusEvent,
  type Task,
  type User,
} from "./domain";
import { isOpenDeal } from "./sales-automation";
import "./workspace-features.css";

export interface WorkspaceFeatureProps {
  snapshot: CrmSnapshot | null;
  currentUser: User | null;
  onSnapshotChange: (snapshot: CrmSnapshot) => void;
  onOpenClient: (clientId: string) => void;
  onOpenDeal: (dealId: string) => void;
  loading?: boolean;
}

type CalendarMode = "month" | "agenda";
type StatisticsTab = "overview" | "funnel" | "sales" | "activity" | "team";
type RangePreset = "7" | "30" | "90" | "all";
type TaskStateFilter = "open" | "completed" | "all";
type TaskLinkFilter = "all" | "client" | "deal" | "general";
type IconName =
    | "arrow"
    | "calendar"
    | "check"
    | "chevron-left"
    | "chevron-right"
    | "clock"
    | "close"
    | "edit"
    | "plus"
    | "trend";

interface DrillRow {
  id: string;
  primary: string;
  secondary: string;
  meta: string;
  entity?: "client" | "deal";
  entityId?: string;
}

interface DrillState {
  title: string;
  eyebrow: string;
  rows: DrillRow[];
}

const DAY_MS = 86_400_000;
const TASK_KIND_LABELS: Record<Task["kind"], string> = {
  call: "Звонок",
  meeting: "Встреча",
  email: "Письмо",
  proposal: "Коммерческое предложение",
  follow_up: "Повторный контакт",
  reminder: "Напоминание",
  other: "Другое",
};

const TASK_KIND_SHORT: Record<Task["kind"], string> = {
  call: "ЗВ",
  meeting: "ВС"

... excerpt truncated ...
```

### `app/crm/fixtures.ts`

Relevance: 110; currently changed, filename matches "fix", path matches "crm", application source.
SHA-256: `c26942ae9ea098c36a2314cf34fa4d35a9b37486a9befcf5412d40bfb91d374b`

```text
import {
  CLIENT_STATUSES,
  CRM_SCHEMA_VERSION,
  DEAL_STATUSES,
  type Client,
  type Contact,
  type CrmSnapshot,
  type Deal,
  type Interaction,
  type PriceApproval,
  type Potential,
  type Session,
  type StatusEvent,
  type Target,
  type Task,
  type Team,
  type User,
} from "./domain";
import { isOpenDeal } from "./sales-automation";

export const DEMO_TEAM_ID = "team-gofra";
export const DEMO_USER_IDS = {
  sofia: "user-sofia",
  nikolai: "user-nikolai",
  timur: "user-timur",
} as const;

const DEMO_CREATED_AT = "2026-06-01T08:00:00.000Z";
const DEMO_UPDATED_AT = "2026-07-23T08:00:00.000Z";

export const demoTeams: Team[] = [
  {
    id: DEMO_TEAM_ID,
    name: "Команда ГОФРА",
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_UPDATED_AT,
  },
];

export const demoUsers: User[] = [
  {
    id: DEMO_USER_IDS.sofia,
    teamId: DEMO_TEAM_ID,
    fullName: "Софья Романова",
    email: "sofia@gofra.demo",
    role: "manager",
    jobTitle: "Руководитель отдела продаж",
    initials: "СР",
    isActive: true,
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_UPDATED_AT,
  },
  {
    id: DEMO_USER_IDS.nikolai,
    teamId: DEMO_TEAM_ID,
    fullName: "Николай Ветров",
    email: "nikolai@gofra.demo",
    role: "employee",
    jobTitle: "Менеджер по продажам",
    initials: "НВ",
    isActive: true,
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_UPDATED_AT,
  },
  {
    id: DEMO_USER_IDS.timur,
    teamId: DEMO_TEAM_ID,
    fullName: "Тимур Агапов",
    email: "timur@gofra.demo",
    role: "employee",
    jobTitle: "Менеджер по продажам",
    initials: "ТА",
    isActive: true,
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_UPDATED_AT,
  },
];

export const demoSession: Sessi

... excerpt truncated ...
```

### `app/crm/CrmApp.tsx`

Relevance: 109; currently changed, filename matches "crm", frontend file, application source.
SHA-256: `e184268d4c8db0794f2bd9e13f097a7a74a2dd2c46ce80167571949c7444eea4`

```text
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { crmGateway } from "./crm-gateway";
import { ChatView } from "./ChatView";
import { CrmIcon, type CrmIconName } from "./Icons";
import {
  CalendarView,
  DashboardView,
  StatisticsView,
} from "./WorkspaceFeatures";
import { ThemeSwitch } from "./theme";
import {
  CLIENT_PIPELINE,
  CLIENT_STATUSES,
  DECISION_INFLUENCES,
  DECISION_ROLES,
  DEAL_PIPELINE,
  DEAL_STATUSES,
  PREFERRED_CHANNELS,
  type Attachment,
  type AppModule,
  type Client,
  type ClientStatus,
  type Contact,
  type CrmSnapshot,
  type Deal,
  type DealStatus,
  type Interaction,
  type InteractionKind,
  type PriceApproval,
  type PriceApprovalStatus,
  type PipelineGroup,
  type Potential,
  type Task,
  type User,
} from "./domain";
import {
  calculateExpectedNextOrder,
  getDaysWithoutOrder,
  hasRequiredDealNextAction,
  isOpenDeal,
  matchesRepeatSegment,
  normalizeDealNextAction,
  recordsShipment,
  syncClientOrderCycleFromShipment,
  syncRepeatOrderTasks,
  TERMINAL_DEAL_STATUSES,
  type RepeatSegment,
} from "./sales-automation";
import {
  canAccessModule,
  canViewFinancials,
  filterAccessibleRecords,
  isManager,
} from "./permissions";

type ViewMode = "board" | "list";
type DrawerTarget =
  | { kind: "client"; id: string }
  | { kind: "deal"; id: string }
  | null;
type MoveIntent =
  | {
      kind: "client" | "deal";
      id: string;
      title: string;
      statuses: readonly string[];
    }
  | null;
type CreateKind = "client" | "deal" | "contact" | "interaction" | null;
type Glo

... excerpt truncated ...
```

### `app/globals.css`

Relevance: 109; currently changed, filename matches "global", frontend file, application source.
SHA-256: `b70a7ca2e3b36b5878d980b11a8acca400698225feff875e6efc67da7318278c`

```text
@import "tailwindcss";

@font-face {
  font-family: "Geist";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/fonts/geist-cyrillic.woff2") format("woff2");
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}

@font-face {
  font-family: "Geist";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/fonts/geist-latin.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
  U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122,
  U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

@font-face {
  font-family: "Geist Mono";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/fonts/geist-mono-cyrillic.woff2") format("woff2");
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}

@font-face {
  font-family: "Geist Mono";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/fonts/geist-mono-latin.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
  U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122,
  U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

:root {
  color-scheme: light;
  --canvas: #ede7dc;
  --surface: #f8f3e9;
  --surface-raised: #fffaf0;
  --surface-muted: #e8e0d3;
  --surface-strong: #ddd3c3;
  --surface-sunken: #e3dacb;
  --surface-glass: rgba(237, 231, 220, 0.94);
  --ink: #29251f;
  --muted: #6d665b;
  --faint: #938a7c;
  --line: #d4c9b9;
  --line-strong: #bbae9a;
  --accent: #a95222;
  --accent-strong: #813913;
  --accent-soft: #ead2bd;
  --accent-line:

... excerpt truncated ...
```

### `app/crm/crm-gateway.ts`

Relevance: 102; currently changed, filename matches "crm", application source.
SHA-256: `b5ec407f1f4c17cdcaf2a3f94ef6a435f38b12b310301481a4423f0b5c5638ec`

```text
import {
  CRM_SCHEMA_VERSION,
  DEAL_STATUSES,
  DECISION_INFLUENCES,
  DECISION_ROLES,
  PREFERRED_CHANNELS,
  type Attachment,
  type Client,
  type Contact,
  type CrmSnapshot,
  type Deal,
  type Dictionaries,
  type Interaction,
  type PriceApproval,
  type PriceApprovalStatus,
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
import {
  DEMO_TEAM_ID,
  DEMO_USER_IDS,
  demoSession,
  demoSnapshot,
  demoTargets,
  demoTeams,
  demoUsers,
} from "./fixtures";

export const CRM_STORAGE_KEY = "gofra-crm-prototype:v4";
export const LEGACY_CRM_STORAGE_KEYS = [
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
  typeof value === "number" && Number.isFin

... excerpt truncated ...
```

### `tests/crm-gateway.test.mjs`

Relevance: 100; currently changed, filename matches "crm", test coverage.
SHA-256: `ea2652985b5688574f992c406ec52b695213eb30ebe11dada5eaf12805c9c179`

```text
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const compile = (source) =>
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

const dataUrl = (source) =>
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;

const replaceSpecifier = (source, specifier, replacement) =>
  source
    .replaceAll(`"${specifier}"`, JSON.stringify(replacement))
    .replaceAll(`'${specifier}'`, JSON.stringify(replacement));

const [domainSource, automationSource, fixturesSource, gatewaySource] =
  await Promise.all(
    ["domain.ts", "sales-automation.ts", "fixtures.ts", "crm-gateway.ts"].map(
      (file) =>
        readFile(new URL(`../app/crm/${file}`, import.meta.url), "utf8"),
    ),
  );

const domainUrl = dataUrl(compile(domainSource));
const automationUrl = dataUrl(compile(automationSource));
const fixturesUrl = dataUrl(
  replaceSpecifier(
    replaceSpecifier(compile(fixturesSource), "./domain", domainUrl),
    "./sales-automation",
    automationUrl,
  ),
);
const gatewayUrl = dataUrl(
  replaceSpecifier(
    replaceSpecifier(
      replaceSpecifier(compile(gatewaySource), "./domain", domainUrl),
      "./sales-automation",
      automationUrl,
    ),
    "./fixtures",
    fixturesUrl,
  ),
);

const [gateway, fixtures] = await Promise.all([
  import(gatewayUrl),
  import(fixturesUrl),
]);

test("migrates v3 snapshots without losing team data and repairs open deals", () => {
  const snapshot = structuredClone(fixtures.demoSnapshot);
  snapshot.schemaVersion = 3;
  snapshot.teams[0].name =

... excerpt truncated ...
```

### `app/crm/domain.ts`

Relevance: 92; currently changed, path matches "crm", application source.
SHA-256: `4ce67389a1c02ef3378fc14db0fe1e0ec0a7130be031fd8235cef71669e2370f`

```text
export const CLIENT_STATUSES = [
  "Новый лид",
  "Нужно проверить",
  "Подходит",
  "Не подходит",
  "Контакт найден",
  "Первый контакт",
  "Есть интерес",
  "Запросили потребность",
  "Нужно КП",
  "КП отправлено",
  "Переговоры",
  "Тестовая поставка",
  "Активный клиент",
  "Спящий клиент",
  "Отказ",
  "Черный список",
] as const;

export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const DEAL_STATUSES = [
  "Новая заявка",
  "Уточняем ТЗ",
  "Считаем цену",
  "КП отправлено",
  "Переговоры",
  "Согласование условий",
  "Счет выставлен",
  "Ожидаем оплату",
  "Оплачено",
  "В закупке / производстве",
  "Готово к отгрузке",
  "Отгружено",
  "Закрыта успешно",
  "Проиграна",
  "Отложена",
  "Отменена",
] as const;

export type DealStatus = (typeof DEAL_STATUSES)[number];
export type Potential = "A" | "B" | "C" | "D";

export const CRM_SCHEMA_VERSION = 4 as const;
export type CrmSchemaVersion = typeof CRM_SCHEMA_VERSION;

export const DECISION_ROLES = [
  "Закупщик",
  "Технолог",
  "Производство",
  "Качество",
  "Финансовый директор",
  "Генеральный директор",
] as const;

export type DecisionRole = (typeof DECISION_ROLES)[number];

export const DECISION_INFLUENCES = [
  "Принимает решение",
  "Влияет",
  "Блокирует",
] as const;

export type DecisionInfluence = (typeof DECISION_INFLUENCES)[number];

export const PREFERRED_CHANNELS = [
  "Телефон",
  "Email",
  "WhatsApp",
  "Telegram",
  "Встреча",
] as const;

export type PreferredChannel = (typeof PREFERRED_CHANNELS)[number];
export type RepeatReminderDays = 7 | 14;

export interface TimestampedEntity {
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "manager" | "employee";

export interface Team exten

... excerpt truncated ...
```

### `app/crm/sales-automation.ts`

Relevance: 92; currently changed, path matches "crm", application source.
SHA-256: `da1505a47690718ca3ed21b9ff5ff279b5d086f232f363aabf134cb38f1a90f6`

```text
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
    deal.nextAction.trim(

... excerpt truncated ...
```

### `app/agency-redesign.css`

Relevance: 91; currently changed, frontend file, application source.
SHA-256: `4ebc7ec64d31bc98cc9e8707acecfdf98746247cce0370cbc7f9a6213e082105`

```text
/*
 * GOFRA / Operations System
 * Industrial-editorial design layer.
 *
 * This file intentionally sits after the product styles. It keeps the existing
 * application behavior while replacing the generic rounded-card language with
 * a stricter, brand-specific visual system.
 */

:root {
  --canvas: #e6e9e8;
  --surface: #eff1f0;
  --surface-raised: #f7f8f6;
  --surface-muted: #dde2e0;
  --surface-strong: #c9d0cd;
  --surface-sunken: #d5dad8;
  --surface-glass: rgba(230, 233, 232, 0.94);
  --ink: #151b1a;
  --muted: #566361;
  --faint: #7d8a87;
  --line: #b8c1be;
  --line-strong: #7d8b88;
  --accent: #3f6873;
  --accent-strong: #294f5a;
  --accent-soft: #c8d8dc;
  --accent-line: #85a7af;
  --danger: #a13b33;
  --danger-soft: #e7c0b9;
  --warning: #8a571e;
  --warning-soft: #e3cfad;
  --success: #4f6943;
  --success-soft: #cbd7c4;
  --nav-bg: #11191b;
  --nav-ink: #eaf0ef;
  --nav-muted: rgba(234, 240, 239, 0.58);
  --nav-hover: rgba(234, 240, 239, 0.055);
  --nav-active: rgba(234, 240, 239, 0.095);
  --nav-line: rgba(234, 240, 239, 0.15);
  --on-accent: #f7fbfa;
  --grid-line: rgba(47, 67, 68, 0.055);
  --hover-row: rgba(63, 104, 115, 0.065);
  --focus-ring: color-mix(in srgb, var(--accent) 72%, white);
  --overlay: rgba(7, 16, 18, 0.64);
  --toast-bg: #152023;
  --toast-ink: #eef3f1;
  --hero-surface: #1d2a2d;
  --hero-ink: #edf2f1;
  --hero-muted: rgba(237, 242, 241, 0.62);
  --hero-line: rgba(237, 242, 241, 0.15);
  --hero-tile: rgba(237, 242, 241, 0.08);
  --hero-accent: #8db2bb;
  --shadow: none;
  --shadow-elevated: 0 24px 70px -46px rgba(20, 46, 50, 0.68);
  --shadow-drawer: -24px 0 70px -48px rgba(7, 19, 21, 0.82);
  --radius-lg: 4px;

... excerpt truncated ...
```

### `package.json`

Relevance: 85; currently changed, project configuration.
SHA-256: `ae9112a4c6d45897f6625dc17bd603c7b015f82927b7d69851f0b8caba270d21`

```text
{
  "name": "gofra-crm-frontend",
  "version": "0.2.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=22.13.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit",
    "test": "vite build && node --test"
  },
  "dependencies": {
    "react": "19.2.6",
    "react-dom": "19.2.6"
  },
  "devDependencies": {
    "@tailwindcss/vite": "4.3.3",
    "@types/node": "22.19.19",
    "@types/react": "19.2.14",
    "@types/react-dom": "19.2.3",
    "@vitejs/plugin-react": "6.0.2",
    "tailwindcss": "4.3.3",
    "typescript": "5.9.3",
    "vite": "8.0.13"
  },
  "packageManager": "pnpm@11.9.0"
}


```

### `tests/sales-automation.test.mjs`

Relevance: 82; currently changed, test coverage.
SHA-256: `b8139ca67ff5b7e5f3adafe8393762a7462aa8efb0515980e4a937d82ce83b0a`

```text
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(
  new URL("../app/crm/sales-automation.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const automation = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);

const createClient = (overrides = {}) => ({
  id: "КЛ-ТЕСТ",
  companyName: "Тестовая упаковка",
  ownerId: "user-test",
  status: "Активный клиент",
  lastShipmentAt: "2026-07-01",
  lastContactAt: "2026-07-01T09:00:00.000Z",
  expectedNextOrderAt: "2026-07-31",
  repeatReminderDays: 14,
  ...overrides,
});

test("calculates the next expected order from shipment and cadence", () => {
  assert.equal(
    automation.calculateExpectedNextOrder("2026-07-01", 30),
    "2026-07-31",
  );
  assert.equal(automation.calculateExpectedNextOrder(null, 30), null);
  assert.equal(automation.calculateExpectedNextOrder("2026-07-01", null), null);
});

test("classifies active clients into exclusive 30/60/90/sleeping boundaries", () => {
  const now = new Date("2026-07-31T12:00:00.000Z");
  const dateDaysAgo = (days) =>
    new Date(now.getTime() - days * 86_400_000).toISOString().slice(0, 10);
  const queues = ["30", "60", "90", "sleeping", "no_data"];
  const cases = [
    [29, null],
    [30, "30"],
    [59, "30"],
    [60, "60"],
    [89, "60"],
    [90, "90"],
    [119, "90"],
    [120, "sleeping"],
  ];

  for (const [days, expected] of cases) {
    const client = createClient({ lastShipmentAt:

... excerpt truncated ...
```

### `tests/static-build.test.mjs`

Relevance: 82; currently changed, test coverage.
SHA-256: `6937df24b7d3b507d537a7473a3c417684549258d8706c199014e617f15fcedc`

```text
import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

test("builds a self-contained static GitHub Pages artifact", async () => {
  const index = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  const assetNames = await readdir(new URL("../dist/assets/", import.meta.url));

  assert.match(index, /<html lang="ru">/);
  assert.match(index, /<div id="root"><\/div>/);
  assert.match(index, /ГОФРА CRM/);
  assert.ok(assetNames.some((name) => name.endsWith(".js")));
  assert.ok(assetNames.some((name) => name.endsWith(".css")));
  await access(new URL("../dist/.nojekyll", import.meta.url));
  await access(new URL("../dist/fonts/geist-cyrillic.woff2", import.meta.url));
});

test("keeps every CRM status in the frontend contract", async () => {
  const [app, domain, gateway, packageJson, viteConfig, workflow] =
    await Promise.all([
      readFile(new URL("../app/crm/CrmApp.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/crm/domain.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/crm/crm-gateway.ts", import.meta.url), "utf8"),
      readFile(new URL("../package.json", import.meta.url), "utf8"),
      readFile(new URL("../vite.config.ts", import.meta.url), "utf8"),
      readFile(
        new URL("../.github/workflows/deploy-pages.yml", import.meta.url),
        "utf8",
      ),
    ]);

  assert.match(app, /CLIENT_PIPELINE/);
  assert.match(app, /DEAL_PIPELINE/);
  assert.match(domain, /"Черный список"/);
  assert.match(domain, /"В закупке \/ производстве"/);
  assert.match(domain,

... excerpt truncated ...
```

## Agent Rules

# AGENTS.md

Generated by the AI Dev System project bootstrap command.

## Project

- Name: ГОФРА CRM
- Root: `C:\Users\sacha\OneDrive\Документы\Сайт Леха`
- AI Dev System: `C:\Users\sacha\.codex\links\ai-dev-system`
- Project brief: `.ai-dev/project-brief.md`
- Project map: `.ai-dev/project-map.md`
- Quality gate: `.ai-dev/quality-gate.md`

## Agent Startup

1. Read this file before changing code.
2. Read `.ai-dev/project-brief.md` for the short handoff memory.
3. Read `.ai-dev/project-map.md` for structure and known commands.
4. Read `.ai-dev/quality-gate.md` before final verification.
5. Inspect nearby code and existing patterns before editing.
6. For substantive work, call `begin_task`. It resolves canonical project identity and compiles a bounded task-specific context pack under `.ai-dev/context/`.
7. Inspect the returned context pack, keep acceptance criteria current with `checkpoint_task`, then use `verify_task` and `complete_task`.
8. Use the AI Dev System MCP tools for durable knowledge and skill routing:
   - `project_identity`
   - `compile_project_context`
   - `project_context_status`
   - `match_auto_command`
   - `read_auto_command`
   - `search_knowledge`
   - `recommend_skills`
   - `search_skills`
   - `read_skill`
9. For frontend product or visual work, call `frontend_product_builder` and pass the implementation gate before changing product UI code.

## Detected Stack

- Node.js
- TypeScript
- React
- Vite
- Tailwind CSS
- GitHub Actions

Package manager: `pnpm`

Project types: `frontend`

## Components

| Component | Path | Ecosystem | Types | Stack |
| --- | --- | --- | --- | --- |
| gofra-crm-frontend | . | node | frontend | Node.js, TypeScript, React, Vite, Tailwind CSS |

## Commands

| Task | Component | CWD | Command | Source |
| --- | --- | --- | --- | --- |
| Dev | gofra-crm-frontend | . | pnpm run dev | package script |
| Test | gofra-crm-frontend | . | pnpm run test | package script |
| Lint | gofra-crm-frontend | . | pnpm run lint | package script |
| Typecheck | gofra-crm-frontend | . | Not detected | missing |
| Build | gofra-crm-frontend | . | pnpm run build | package script |

## Agent Standards

### Scope Control

- Keep changes scoped to the requested behavior.
- Prefer existing architecture, naming, components, utilities, and test style.
- Do not do unrelated refactors, formatting churn, dependency swaps, or file moves.
- Preserve user changes and never reset unrelated work.
- Do not introduce dependencies unless the benefit is clear and the project pattern supports it.

### Code Quality

- Read nearby code before editing.
- Keep changes small, reviewable, and reversible.
- Add or update tests for bug fixes, shared logic, data transformations, and user-visible behavior.
- Do not leave TODO placeholders or partial implementations in final work.
- Do not commit secrets, tokens, API keys, private credentials, or local-only config.

### Quality Gate

- Read `.ai-dev/quality-gate.md` before final verification.
- Run the narrowest relevant check first, then broader checks when shared behavior or build config is touched.
- If checks cannot run, report the exact reason.
- Do not mark work complete while relevant checks are failing.

### Frontend Quality Gate

- Verify responsive layout on desktop and mobile when UI changes are visible.
- Check loading, empty, error, hover, focus, and disabled states when touched.
- Ensure text does not overflow buttons, tables, cards, or navigation.
- Reuse the existing design system before adding one-off UI.
- For meaningful visual work, inspect the app in a browser or screenshot and report that verification.


## Auto Commands

These phrases are shortcuts for repeatable agent workflows. When the user writes one of them, resolve it through the AI Dev System MCP auto-command tools.

| Phrase | Command | Primary skills |
| --- | --- | --- |
| оформи проект для ИИ | `format_project_for_ai` | repo-onboarding, knowledge-curator, code-reviewer |
| подготовь проект | `prepare_repository` | repo-onboarding, knowledge-curator |
| обнови память проекта | `refresh_project_memory` | repo-onboarding, knowledge-curator, code-reviewer |
| начни новую фичу | `start_feature` | feature-builder, code-reviewer, knowledge-curator |
| найди баг | `investigate_bug` | bugfix-investigator, code-reviewer |
| сделай ревью | `review_changes` | code-reviewer |
| сгенерируй референсы для проекта | `generate_frontend_references` | frontend-product-builder |
| build frontend product | `build_frontend_product` | frontend-product-builder |
| улучши frontend/design | `improve_frontend_design` | frontend-product-builder |
| поддержи frontend/beta | `maintain_beta_frontend` | beta-frontend-maintainer, frontend-quality-gate, code-reviewer |
| проверь frontend quality gate | `frontend_quality_gate` | frontend-product-builder, frontend-quality-gate |
| проверь лендинг/конверсию | `review_landing_conversion` | landing-conversion-reviewer, design-taste-frontend, frontend-quality-gate |
| проверь библиотеку скиллов | `audit_skill_library` | kno

## Project Brief

# Project Brief

Generated: 2026-07-25T05:44:13.506Z

This is the short handoff cache for Codex, Claude, and other agents. Read it before loading the larger project map.

## Identity

- Name: gofra-crm
- Root: `C:\Users\sacha\Documents\Codex\2026-07-23\new-chat`
- Git repository detected: yes
- Project types: `frontend`
- Package manager: `pnpm`

## Stack

- Node.js
- TypeScript
- React
- Vite
- Tailwind CSS
- GitHub Actions

## Important Files And Folders

- README.md
- package.json
- tsconfig.json
- vite.config.ts
- GitHub Actions
- src/
- app/
- tests/

## Command Map

| Task | Command | Source |
| --- | --- | --- |
| Install | pnpm install | project files |
| Dev | pnpm dev | package script: dev |
| Test | pnpm test | package script: test |
| Lint | pnpm lint | package script: lint |
| Typecheck | Not detected | missing |
| Build | pnpm build | package script: build |

## Quality Gaps

- Typecheck command is not detected.

## Risk Signals

- No automatic risk signals detected.

## Dangerous Or Side-Effectful Scripts

- No package scripts were automatically flagged as side-effectful.

## Documentation

| Item | Status | Type |
| --- | --- | --- |
| README.md | present | file |
| docs | missing | missing |
| CONTRIBUTING.md | missing | missing |
| CHANGELOG.md | missing | missing |
| .github | present | directory |
| .github/workflows | present | directory |

## Environment And Secrets

- No `.env*` files detected by the lightweight scan.

## Recommended Skills

| Skill | Use when |
| --- | --- |
| `repo-onboarding` | Repository setup, AGENTS.md, project map, quality gate. |
| `feature-builder` | Feature implementation with repo patterns and tests. |
| `bugfix-investigator` | Bug, regression, failing test, or CI investigation. |
| `code-reviewer` | Risk review, missing tests, security/data/behavior checks. |
| `frontend-polisher` | Frontend/UI quality, states, responsiveness. |
| `beta-frontend-maintainer` | Existing beta frontend support with minimal safe diffs. |
| `frontend-quality-gate` | Final UI QA: responsive, accessibility, browser checks. |
| `landing-conversion-reviewer` | Landing page clarity, trust, CTA, and conversion review. |
| `design-taste-frontend` | Visually important frontend/design work. |
| `knowledge-curator` | Durable project notes and lessons. |

## Recommended Next Commands

- начни новую фичу: <описание>
- найди баг: <симптом или ошибка>
- поддержи frontend/beta: <экран или компонент>
- проверь frontend quality gate
- проверь лендинг/конверсию: <страница>
- улучши frontend/design: <экран или компонент>
- сделай ревью
- обнови память проекта
- обнови базу знаний

## Agent Handoff Rule

- Do not load the whole repository into chat context.
- Use this file for quick orientation, then `.ai-dev/project-map.md` for structure and `.ai-dev/quality-gate.md` for verification.
- Use MCP search for specific files, commands, risks, and skills.
- Do not run side-effectful scripts without explicit user approval.


## Quality Gate

# Quality Gate

Generated: 2026-07-30T20:40:45.148Z

## Default Verification

- Test: `pnpm run test`
- Lint: `pnpm run lint`
- Build: `pnpm run build`

## Missing Checks

- Typecheck command is not detected.

## Unsafe Or Manual Commands

- `test`: Shell operator '&' is forbidden.. Command: `vite build && node --test tests/static-build.test.mjs`

## Minimum Standard

- Run the narrowest fast check that proves the change.
- Run broader checks when touching shared utilities, build config, routing, auth, data models, or UI foundations.
- If a check is unavailable or cannot run locally, record the reason in the final response.
- Do not mark the task complete while known relevant checks are failing.

## Frontend QA

- Check desktop and mobile layouts.
- Check loading, empty, and error states when touched by the task.
- Verify text does not overflow buttons, cards, tables, or navigation.
- Verify interactive controls have clear hover/focus/disabled states.
- For visual changes, run or open the app and inspect the changed screens.
- When Playwright is available, run MCP `run_frontend_qa` for desktop/mobile screenshots, console errors, overflow, and basic accessibility.
- For product/design work, ordinary `run_frontend_qa` is not sufficient: require an approved direction and design system, then use `run_visual_reference_qa`, independent `record_visual_review`, and `frontend_product_gate` with `gate=handoff`.
- Check hierarchy, composition, typography, density, action clarity, content quality, asset authenticity, mobile UX, state coverage, and brand coherence separately. Do not use one overall design score.
- For handoff or beta release, use the `frontend-quality-gate` skill and report Gate: pass, warn, or block.

## Final Response Checklist

- Mention changed files.
- Mention checks run and results.
- Mention any skipped checks or residual risk.


## Open Questions

- No automatic unknowns.

## Context Boundaries

- Read selected files and their nearby dependencies before editing.
- Do not load unrelated repository files or the full skill catalog.
- Never include .env, private keys, certificates, or secret values in the context pack.
- Recompile after architecture, task scope, project state, or acceptance criteria change.
