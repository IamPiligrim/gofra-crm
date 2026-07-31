import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(
  new URL("../app/crm/permissions.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const permissions = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);

const users = [
  { id: "leader", teamId: "team", role: "manager" },
  { id: "employee-1", teamId: "team", role: "employee" },
  { id: "employee-2", teamId: "team", role: "employee" },
];
const deals = [
  { id: "deal-1", ownerId: "employee-1" },
  { id: "deal-2", ownerId: "employee-2" },
];
const quotes = [
  { id: "quote-1", dealId: "deal-1" },
  { id: "quote-2", dealId: "deal-2" },
  { id: "orphan", dealId: "missing" },
];

test("quote visibility follows the owning deal", () => {
  assert.deepEqual(
    permissions
      .filterAccessibleQuotes(users[1], quotes, deals, users)
      .map((quote) => quote.id),
    ["quote-1"],
  );
  assert.deepEqual(
    permissions
      .filterAccessibleQuotes(users[0], quotes, deals, users)
      .map((quote) => quote.id),
    ["quote-1", "quote-2"],
  );
});
