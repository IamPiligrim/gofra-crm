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
    const client = createClient({ lastShipmentAt: dateDaysAgo(days) });
    assert.equal(automation.classifyRepeatSegment(client, now), expected);
    assert.equal(
      queues.filter((segment) =>
        automation.matchesRepeatSegment(client, segment, now),
      ).length,
      expected ? 1 : 0,
    );
  }
});

test("keeps inactive clients out of active queues and separates missing shipment data", () => {
  const now = new Date("2026-07-31T12:00:00.000Z");
  assert.equal(
    automation.classifyRepeatSegment(
      createClient({ status: "Новый лид", lastShipmentAt: "2026-06-01" }),
      now,
    ),
    null,
  );
  assert.equal(
    automation.classifyRepeatSegment(
      createClient({ lastShipmentAt: null, lastContactAt: "2026-01-01" }),
      now,
    ),
    "no_data",
  );
  assert.equal(
    automation.classifyRepeatSegment(
      createClient({ status: "Спящий клиент", lastShipmentAt: null }),
      now,
    ),
    "sleeping",
  );
});

test("creates one stable repeat-order reminder and replaces stale reminders", () => {
  const client = createClient();
  const now = new Date("2026-07-10T09:00:00.000Z");
  const first = automation.syncRepeatOrderTasks([client], [], now);
  const second = automation.syncRepeatOrderTasks([client], first, now);

  assert.equal(first.length, 1);
  assert.equal(second.length, 1);
  assert.equal(first[0].id, "repeat-order:КЛ-ТЕСТ:2026-07-31:14");
  assert.equal(first[0].dueAt, "2026-07-17T09:00:00.000Z");

  const changedClient = createClient({
    expectedNextOrderAt: "2026-08-15",
    repeatReminderDays: 7,
  });
  const changed = automation.syncRepeatOrderTasks(
    [changedClient],
    second,
    now,
  );
  assert.equal(changed.length, 1);
  assert.equal(changed[0].id, "repeat-order:КЛ-ТЕСТ:2026-08-15:7");

  const inactive = automation.syncRepeatOrderTasks(
    [createClient({ status: "Отказ" })],
    changed,
    now,
  );
  assert.equal(inactive.length, 0);
});

test("requires a next step for all deals except terminal outcomes", () => {
  assert.equal(automation.isOpenDeal({ status: "Переговоры" }), true);
  assert.equal(automation.isOpenDeal({ status: "Отложена" }), true);
  assert.equal(automation.isOpenDeal({ status: "Закрыта успешно" }), false);
  assert.equal(automation.isOpenDeal({ status: "Проиграна" }), false);
  assert.equal(automation.isOpenDeal({ status: "Отменена" }), false);
});

test("normalizes legacy open deals without losing them and keeps them blocked", () => {
  const repaired = automation.normalizeDealNextAction(
    {
      id: "СД-LEGACY",
      status: "Переговоры",
      nextAction: "",
      nextActionAt: null,
    },
    new Date("2026-07-31T09:00:00.000Z"),
  );

  assert.equal(repaired.id, "СД-LEGACY");
  assert.equal(repaired.nextAction, "Назначить следующий шаг по сделке");
  assert.equal(repaired.nextActionAt, "2026-07-31T09:00:00.000Z");
  assert.equal(repaired.needsNextAction, true);
  assert.equal(automation.hasRequiredDealNextAction(repaired), false);

  const resolved = automation.normalizeDealNextAction({
    ...repaired,
    nextAction: "Позвонить закупщику",
    nextActionAt: "2026-08-01T09:00:00.000Z",
    needsNextAction: false,
  });
  assert.equal(resolved.needsNextAction, false);
  assert.equal(automation.hasRequiredDealNextAction(resolved), true);
});

test("recalculates automatic order dates after shipment but preserves manual dates", () => {
  const automatic = automation.syncClientOrderCycleFromShipment(
    createClient({
      orderFrequencyDays: 30,
      expectedNextOrderManual: false,
    }),
    "2026-08-10T18:00:00.000Z",
  );
  assert.equal(automatic.lastShipmentAt, "2026-08-10");
  assert.equal(automatic.expectedNextOrderAt, "2026-09-09");

  const manual = automation.syncClientOrderCycleFromShipment(
    createClient({
      orderFrequencyDays: 30,
      expectedNextOrderAt: "2026-09-20",
      expectedNextOrderManual: true,
    }),
    "2026-08-10T18:00:00.000Z",
  );
  assert.equal(manual.lastShipmentAt, "2026-08-10");
  assert.equal(manual.expectedNextOrderAt, "2026-09-20");
});
