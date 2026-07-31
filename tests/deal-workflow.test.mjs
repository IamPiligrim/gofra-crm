import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(
  new URL("../app/crm/domain.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const domain = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);

test("calculates quote economics with explicit revenue, cost and logistics", () => {
  const quote = { revenue: 500000, cost: 320000, logistics: 40000 };
  assert.equal(domain.getQuoteMargin(quote), 140000);
  assert.equal(domain.getQuoteMarginPercent(quote), 28);
  assert.deepEqual(domain.ECONOMICS_LABELS, {
    revenue: "Выручка",
    cost: "Себестоимость",
    logistics: "Логистика",
    margin: "Маржа",
  });
});

test("tracks brief and process completion without counting skipped sample stages", () => {
  const brief = domain.createEmptyDealBrief();
  brief.packagingType = "Гофроящик";
  brief.fefco = "0201";
  brief.innerDimensions.length = 600;
  const briefCompletion = domain.getDealBriefCompletion(brief);
  assert.equal(briefCompletion.filled, 3);
  assert.equal(briefCompletion.total, 23);

  const process = domain.createEmptyDealProcess();
  process.sampleSkipped = true;
  process.steps.specReceived.completedAt = "2026-07-31T09:00:00.000Z";
  const processCompletion = domain.getDealProcessCompletion(process);
  assert.equal(processCompletion.filled, 1);
  assert.equal(processCompletion.total, 4);
});

test("uses active quote economics and falls back to legacy values", () => {
  const deal = {
    activeQuoteId: "quote-2",
    ourPrice: 100,
    purchasePrice: 60,
    logistics: 10,
  };
  const quote = {
    id: "quote-2",
    revenue: 800000,
    cost: 520000,
    logistics: 60000,
  };
  assert.deepEqual(domain.getDealEconomics(deal, [quote]), {
    revenue: 800000,
    cost: 520000,
    logistics: 60000,
    margin: 220000,
    marginPercent: 27.5,
  });
  assert.equal(
    domain.getDealEconomics({ ...deal, activeQuoteId: null }, []).revenue,
    100,
  );
});
