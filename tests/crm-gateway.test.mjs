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

const [domainSource, automationSource, fixturesSource, leaderControlSource, gatewaySource] =
  await Promise.all(
    ["domain.ts", "sales-automation.ts", "fixtures.ts", "leader-control.ts", "crm-gateway.ts"].map(
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
const leaderControlUrl = dataUrl(
  replaceSpecifier(
    replaceSpecifier(compile(leaderControlSource), "./domain", domainUrl),
    "./sales-automation",
    automationUrl,
  ),
);
const gatewayUrl = dataUrl(
  replaceSpecifier(
    replaceSpecifier(
      replaceSpecifier(
        replaceSpecifier(compile(gatewaySource), "./domain", domainUrl),
        "./sales-automation",
        automationUrl,
      ),
      "./leader-control",
      leaderControlUrl,
    ),
    "./fixtures",
    fixturesUrl,
  ),
);

const [gateway, fixtures] = await Promise.all([
  import(gatewayUrl),
  import(fixturesUrl),
]);

test("migrates v4 snapshots to v6 without losing current-main data and creates quote v1", () => {
  const snapshot = structuredClone(fixtures.demoSnapshot);
  snapshot.schemaVersion = 4;
  snapshot.teams[0].name = "Команда из v4";
  delete snapshot.quotes;
  snapshot.deals[0] = {
    ...snapshot.deals[0],
    status: "Переговоры",
    nextAction: "",
    nextActionAt: null,
    needsNextAction: undefined,
  };
  delete snapshot.deals[0].brief;
  delete snapshot.deals[0].process;
  delete snapshot.deals[0].activeQuoteId;
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

  assert.equal(migrated.schemaVersion, 6);
  assert.equal(migrated.teams[0].name, "Команда из v4");
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
  assert.ok(migrated.deals[0].brief);
  assert.ok(migrated.deals[0].process);
  assert.ok(migrated.deals[0].activeQuoteId);
  const migratedQuote = migrated.quotes.find(
    (quote) => quote.id === migrated.deals[0].activeQuoteId,
  );
  assert.equal(migratedQuote.revenue, snapshot.deals[0].ourPrice);
  assert.equal(migratedQuote.cost, snapshot.deals[0].purchasePrice);
  assert.ok(
    snapshot.priceApprovals.every((approval) =>
      migrated.priceApprovals.some((item) => item.id === approval.id),
    ),
  );
  assert.equal(migrated.salesControl.minMarginPercent, 20);
  assert.ok("forecastCloseAt" in migrated.deals[0]);
});

test("migrates PR5 quote economics and repairs active quote idempotently", () => {
  const snapshot = structuredClone(fixtures.demoSnapshot);
  snapshot.schemaVersion = 3;
  const deal = snapshot.deals[1];
  delete deal.clientPrice;
  delete deal.ourPrice;
  delete deal.purchasePrice;
  delete deal.logistics;
  delete deal.margin;
  delete deal.marginPercent;
  delete deal.proposalDate;
  deal.activeQuoteId = "missing-quote";
  snapshot.quotes = [
    {
      ...snapshot.quotes[1],
      id: "quote-pr5-v1",
      dealId: deal.id,
      revenue: 410000,
      cost: 260000,
      logistics: 30000,
      status: "Отправлено",
    },
  ];

  const migrated = gateway.migrateCrmSnapshot(
    snapshot,
    "2026-07-31T09:00:00.000Z",
  );
  const migratedDeal = migrated.deals.find((item) => item.id === deal.id);
  assert.equal(migratedDeal.activeQuoteId, "quote-pr5-v1");
  assert.equal(migratedDeal.ourPrice, 410000);
  assert.equal(migratedDeal.purchasePrice, 260000);
  assert.equal(migratedDeal.margin, 120000);

  const secondPass = gateway.migrateCrmSnapshot(
    migrated,
    "2026-07-31T09:00:00.000Z",
  );
  assert.deepEqual(secondPass, migrated);
});

test("save persists the normalized v6 snapshot", async () => {
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
    assert.equal(stored.schemaVersion, 6);
    assert.equal(stored.deals[0].status, "Отложена");
    assert.equal(stored.deals[0].needsNextAction, true);
    assert.ok(stored.deals[0].nextAction);
    assert.ok(stored.deals[0].nextActionAt);
    assert.ok(stored.quotes.length);
  } finally {
    globalThis.window = previousWindow;
  }
});
