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
  source.replaceAll(`"${specifier}"`, JSON.stringify(replacement));

const [automationSource, focusSource] = await Promise.all([
  readFile(new URL("../app/crm/sales-automation.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/crm/manager-focus.ts", import.meta.url), "utf8"),
]);
const automationUrl = dataUrl(compile(automationSource));
const focusUrl = dataUrl(
  replaceSpecifier(compile(focusSource), "./sales-automation", automationUrl),
);
const { selectManagerFocus } = await import(focusUrl);

const openDeal = (overrides) => ({
  id: "deal-base",
  clientId: "client-1",
  ownerId: "user-1",
  status: "Переговоры",
  nextAction: "Позвонить",
  nextActionAt: "2026-08-01T10:00:00.000Z",
  needsNextAction: false,
  activeQuoteId: null,
  process: { replyExpectedAt: null },
  updatedAt: "2026-07-30T10:00:00.000Z",
  ...overrides,
});

const snapshot = {
  tasks: [
    {
      id: "task-overdue",
      assigneeId: "user-1",
      status: "open",
      dueAt: "2026-07-30T10:00:00.000Z",
    },
    {
      id: "task-today",
      assigneeId: "user-1",
      status: "open",
      dueAt: "2026-07-31T12:00:00.000Z",
    },
    {
      id: "task-other",
      assigneeId: "user-2",
      status: "open",
      dueAt: "2026-07-30T10:00:00.000Z",
    },
  ],
  deals: [
    openDeal({
      id: "deal-no-step",
      nextAction: "",
      nextActionAt: null,
      needsNextAction: true,
    }),
    openDeal({
      id: "deal-silent",
      activeQuoteId: "quote-sent",
      process: { replyExpectedAt: "2026-08-02T09:00:00.000Z" },
    }),
    openDeal({
      id: "deal-resolved",
      activeQuoteId: "quote-accepted",
    }),
  ],
  quotes: [
    {
      id: "quote-sent",
      dealId: "deal-silent",
      version: 2,
      status: "Отправлено",
      sentAt: "2026-07-29T09:00:00.000Z",
    },
    {
      id: "quote-accepted",
      dealId: "deal-resolved",
      version: 1,
      status: "Принято",
      sentAt: "2026-07-29T09:00:00.000Z",
    },
  ],
  clients: [
    {
      id: "client-1",
      ownerId: "user-1",
      expectedNextOrderAt: "2026-08-07",
      repeatReminderDays: 14,
    },
    {
      id: "client-outside-window",
      ownerId: "user-1",
      expectedNextOrderAt: "2026-08-20",
      repeatReminderDays: 14,
    },
  ],
  interactions: [],
};

test("builds all five My Day queues only from the manager's records", () => {
  const focus = selectManagerFocus(
    snapshot,
    { id: "user-1" },
    new Date("2026-07-31T09:00:00.000Z"),
  );

  assert.deepEqual(focus.overdueTasks.map((task) => task.id), ["task-overdue"]);
  assert.deepEqual(focus.todayTasks.map((task) => task.id), ["task-today"]);
  assert.deepEqual(
    focus.dealsWithoutNextStep.map((deal) => deal.id),
    ["deal-no-step"],
  );
  assert.deepEqual(focus.silentQuotes.map((row) => row.quote.id), ["quote-sent"]);
  assert.deepEqual(
    focus.upcomingReorders.map((row) => row.client.id),
    ["client-1"],
  );
});

test("excludes answered and resolved quotes from the no-response queue", () => {
  const answered = structuredClone(snapshot);
  answered.interactions.push({
    id: "reply",
    ownerId: "user-1",
    clientId: "client-1",
    kind: "Звонок",
    occurredAt: "2026-07-30T09:00:00.000Z",
  });

  const focus = selectManagerFocus(
    answered,
    { id: "user-1" },
    new Date("2026-07-31T09:00:00.000Z"),
  );
  assert.equal(focus.silentQuotes.length, 0);
});
