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

const [domainSource, automationSource, leaderSource] = await Promise.all([
  readFile(new URL("../app/crm/domain.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/crm/sales-automation.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/crm/leader-control.ts", import.meta.url), "utf8"),
]);
const domainUrl = dataUrl(compile(domainSource));
const automationUrl = dataUrl(compile(automationSource));
const leaderUrl = dataUrl(
  replaceSpecifier(
    replaceSpecifier(compile(leaderSource), "./domain", domainUrl),
    "./sales-automation",
    automationUrl,
  ),
);
const { selectLeaderControl, syncThresholdPriceApprovals } = await import(
  leaderUrl
);

const deal = (overrides) => ({
  id: "deal-open",
  clientId: "client-a",
  ownerId: "user-a",
  managerName: "Анна Менеджер",
  status: "КП отправлено",
  forecastCloseAt: "2026-08-20T00:00:00.000Z",
  lossReason: null,
  activeQuoteId: "quote-v2",
  ourPrice: 100000,
  purchasePrice: 80000,
  logistics: 10000,
  createdAt: "2026-06-01T08:00:00.000Z",
  updatedAt: "2026-07-01T08:00:00.000Z",
  ...overrides,
});

const snapshot = {
  salesControl: {
    minMarginPercent: 20,
    maxDiscountPercent: 5,
    stagnantDealDays: 14,
    staleClientDays: 30,
  },
  users: [
    { id: "user-a", fullName: "Анна Менеджер" },
    { id: "user-b", fullName: "Борис Менеджер" },
  ],
  clients: [
    {
      id: "client-a",
      ownerId: "user-a",
      companyName: "Альфа",
      source: "Рекомендация",
      status: "Активный клиент",
      lastContactAt: "2026-05-10T08:00:00.000Z",
      createdAt: "2026-05-01T08:00:00.000Z",
    },
    {
      id: "client-b",
      ownerId: "user-b",
      companyName: "Бета",
      source: "Сайт",
      status: "Новый лид",
      lastContactAt: "2026-07-25T08:00:00.000Z",
      createdAt: "2026-07-20T08:00:00.000Z",
    },
  ],
  deals: [
    deal({}),
    deal({
      id: "deal-won",
      activeQuoteId: null,
      status: "Закрыта успешно",
      forecastCloseAt: null,
      ourPrice: 150000,
    }),
    deal({
      id: "deal-lost",
      activeQuoteId: null,
      status: "Проиграна",
      forecastCloseAt: null,
      lossReason: "Цена",
      ourPrice: 130000,
    }),
  ],
  quotes: [
    {
      id: "quote-v1",
      dealId: "deal-open",
      version: 1,
      status: "Заменено",
      revenue: 120000,
      cost: 80000,
      logistics: 10000,
      volume: "1000 шт.",
      authorId: "user-a",
      createdAt: "2026-07-02T08:00:00.000Z",
      updatedAt: "2026-07-02T08:00:00.000Z",
    },
    {
      id: "quote-v2",
      dealId: "deal-open",
      version: 2,
      status: "Отправлено",
      revenue: 100000,
      cost: 80000,
      logistics: 10000,
      volume: "1000 шт.",
      authorId: "user-a",
      createdAt: "2026-07-05T08:00:00.000Z",
      updatedAt: "2026-07-05T08:00:00.000Z",
    },
  ],
  interactions: [],
  statusEvents: [],
  priceApprovals: [],
};

test("calculates monthly forecast, risks, conversion, margin and loss reasons", () => {
  const control = selectLeaderControl(
    snapshot,
    new Date("2026-07-31T09:00:00.000Z"),
  );

  assert.equal(control.forecast.length, 1);
  assert.equal(control.forecast[0].key, "2026-08");
  assert.equal(control.forecast[0].revenue, 100000);
  assert.equal(control.forecast[0].weightedRevenue, 50000);
  assert.deepEqual(control.stagnantDeals.map((row) => row.deal.id), [
    "deal-open",
  ]);
  assert.deepEqual(control.staleClients.map((row) => row.client.id), [
    "client-a",
  ]);
  assert.equal(control.managerConversion[0].conversionPercent, 50);
  assert.equal(control.sourceConversion[0].conversionPercent, 50);
  assert.equal(control.averageMarginPercent, 10);
  assert.deepEqual(control.lossReasons[0], {
    reason: "Цена",
    count: 1,
    sharePercent: 100,
  });
});

test("creates one stable approval for a discounted low-margin quote", () => {
  const approvals = syncThresholdPriceApprovals(snapshot);
  assert.equal(approvals.length, 1);
  assert.equal(approvals[0].id, "approval-quote-quote-v2");
  assert.equal(approvals[0].trigger, "discount_and_margin");
  assert.equal(approvals[0].marginPercent, 10);
  assert.equal(approvals[0].discountPercent, 16.7);

  const secondPass = syncThresholdPriceApprovals({
    ...snapshot,
    priceApprovals: approvals,
  });
  assert.deepEqual(secondPass, approvals);
});
