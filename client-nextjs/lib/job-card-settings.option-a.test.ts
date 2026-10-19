/**
 * Option A job-card numbering checks.
 * Usage: npx --yes tsx lib/job-card-settings.option-a.test.ts
 */
import {
  alignLocalCounterFromServerNext,
  consumeNextJobCardNumber,
  peekNextJobCardNumber,
  previewJobCardNumber,
} from "./job-card-settings";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// Minimal localStorage for Node
const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => {
    store.set(k, v);
  },
  removeItem: (k: string) => {
    store.delete(k);
  },
  clear: () => store.clear(),
};
(globalThis as any).window = globalThis;

store.clear();
localStorage.setItem("garageSettings", JSON.stringify({ jobCardPrefix: "RM" }));
assert(
  peekNextJobCardNumber("2026-10-19T21:55") === "RM202610190001",
  "instant peek uses cached RM prefix",
);

store.clear();
assert(
  peekNextJobCardNumber("2026-10-19T10:00") === "JC202610190001",
  "empty cache defaults to JC until settings sync",
);

store.clear();
localStorage.setItem("garageSettings", JSON.stringify({ jobCardPrefix: "RM" }));
assert(
  peekNextJobCardNumber("2026-10-19T10:00") === "RM202610190001",
  "first peek is 0001",
);
consumeNextJobCardNumber("RM202610190004", "2026-10-19T10:00");
assert(
  peekNextJobCardNumber("2026-10-19T10:00") === "RM202610190005",
  "after server-assigned 0004, local next is 0005",
);

store.clear();
localStorage.setItem("garageSettings", JSON.stringify({ jobCardPrefix: "RM" }));
alignLocalCounterFromServerNext("RM202610190004");
assert(
  peekNextJobCardNumber("2026-10-19T10:00") === "RM202610190004",
  "align from server next-free keeps 0004 as peek",
);

assert(
  previewJobCardNumber("RM", "2026-10-19T10:00") === "RM202610190004",
  "settings preview stays instant with typed prefix",
);

console.log("job-card-settings Option A checks passed");
