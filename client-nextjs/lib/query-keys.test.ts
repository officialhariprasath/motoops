/**
 * Shared cache key contract — run: npx --yes tsx lib/query-keys.test.ts
 */
import { queryKeys, STALE } from "./query-keys";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(
  JSON.stringify(queryKeys.servicesList) === JSON.stringify(["services", "list"]),
  "servicesList key"
);
assert(
  JSON.stringify(queryKeys.invoicesList) === JSON.stringify(["invoices", "list"]),
  "invoicesList key"
);
assert(
  JSON.stringify(queryKeys.usersList) === JSON.stringify(["users", "list"]),
  "usersList key"
);
assert(
  JSON.stringify(queryKeys.catalogItems) ===
    JSON.stringify(["catalog", "items"]),
  "catalogItems key"
);
assert(
  JSON.stringify(queryKeys.catalogItemsActive) ===
    JSON.stringify(["catalog", "items", "active"]),
  "catalogItemsActive key"
);
assert(STALE.listsMs >= 60_000, "lists staleTime at least 1 min");
assert(STALE.referenceMs >= STALE.listsMs, "reference stale >= lists");

console.log("query-keys.test.ts: all passed");
