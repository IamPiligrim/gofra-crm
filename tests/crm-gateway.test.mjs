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
  snapshot.teams[0].name = "Команда из v3";
  snapshot.deals[0] = {
    ...snapshot.deals[0],
    status: "Переговоры",
    nextAction: "",
    nextActionAt: null,
    needsNextAction: undefined,
  };
  snapshot.clients[0] = {
    ...snapshot.clients[0],
    lastShipmentAt: "2026-07-01",
    orderFrequencyDays: 30,
    expectedNextOrderAt: "2026-07-15",
    expectedNextOrderManual: false,
  };

  const migrated = gateway.migrateCrmSnapshot(
    snapshot,
    "2026-07-31T09:00:00.000Z",
  );

  assert.equal(migrated.schemaVersion, 4);
  assert.equal(migrated.teams[0].name, "Команда из v3");
  assert.equal(migrated.deals[0].id, snapshot.deals[0].id);
  assert.equal(migrated.deals[0].needsNextAction, true);
  assert.equal(
    migrated.deals[0].nextAction,
    "Назначить следующий шаг по сделке",
  );
  assert.equal(
    migrated.deals[0].nextActionAt,
    "2026-07-31T09:00:00.000Z",
  );
  assert.equal(migrated.clients[0].expectedNextOrderAt, "2026-07-31");
});

test("save persists the normalized v4 snapshot", async () => {
  const values = new Map();
  const previousWindow = globalThis.window;
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  };

  try {
    const snapshot = structuredClone(fixtures.demoSnapshot);
    snapshot.deals[0] = {
      ...snapshot.deals[0],
      status: "Отложена",
      nextAction: "",
      nextActionAt: null,
      needsNextAction: false,
    };

    await gateway.crmGateway.save(snapshot);
    const stored = JSON.parse(values.get(gateway.CRM_STORAGE_KEY));
    assert.equal(stored.schemaVersion, 4);
    assert.equal(stored.deals[0].status, "Отложена");
    assert.equal(stored.deals[0].needsNextAction, true);
    assert.ok(stored.deals[0].nextAction);
    assert.ok(stored.deals[0].nextActionAt);
  } finally {
    globalThis.window = previousWindow;
  }
});
