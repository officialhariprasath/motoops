/**
 * Quick edge-case checks for discount helpers (run with npx ts-node or node after transpile).
 * Usage from client-nextjs: npx --yes tsx lib/job-card-items.discount.test.ts
 */
import {
  calcJobCardTotals,
  calcLineAmounts,
  calcOverallDiscount,
  hasDocumentDiscounts,
  hasLineItemDiscounts,
  percentFromDiscountAmount,
  roundMoney,
} from "./job-card-items";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// Amount → % snap
assert(percentFromDiscountAmount(100, 100) === 100, "100/100 → 100%");
assert(percentFromDiscountAmount(100, 100.11) === 100, "100/100.11 snaps to 100%");
assert(percentFromDiscountAmount(50, 100) === 50, "50/100 → 50%");
assert(percentFromDiscountAmount(50, 100.22) === 50, "50/100.22 snaps to 50%");
assert(percentFromDiscountAmount(25, 100) === 25, "25/100 → 25%");

// ₹50 off ₹1050 must stay ₹50 (not 49.98)
{
  const pct = percentFromDiscountAmount(50, 1050);
  const o = calcOverallDiscount(1050, pct);
  assert(o.discountAmount === 50, `50/1050 amount stays 50 (got ${o.discountAmount})`);
  assert(o.grandTotal === 1000, `50/1050 grand = 1000 (got ${o.grandTotal})`);
}

// Legacy saved 4.76% on 1050 still displays as ₹50 via paise snap
{
  const o = calcOverallDiscount(1050, 4.76);
  assert(o.discountAmount === 50, "legacy 4.76% snaps amount to 50");
  assert(o.grandTotal === 1000, "legacy 4.76% grand = 1000");
}

// 100% overall
{
  const o = calcOverallDiscount(1230, 100);
  assert(o.discountAmount === 1230, "100% discount amount = subtotal");
  assert(o.grandTotal === 0, "100% grand total = 0");
}

// Line rounding matches sum of rounded nets
{
  const items = [
    { id: "1", description: "A", rate: 33.33, quantity: 3, discountPercent: 10 },
    { id: "2", description: "B", rate: 10.1, quantity: 2, discountPercent: 0 },
  ];
  const nets = items.map((i) => calcLineAmounts(i).netAmount);
  const total = roundMoney(nets.reduce((a, b) => a + b, 0));
  const totals = calcJobCardTotals(items, 0);
  assert(totals.itemsSubtotal === total, "subtotal = sum of rounded line nets");
}

// Full waiver via amount on slightly drifted subtotal
{
  const items = [
    { id: "1", description: "X", rate: 33.37, quantity: 3, discountPercent: 0 },
  ];
  const sub = calcJobCardTotals(items, 0).itemsSubtotal;
  const pct = percentFromDiscountAmount(sub, sub);
  assert(pct === 100, "full amount waiver → 100%");
  const o = calcOverallDiscount(sub, pct);
  assert(o.grandTotal === 0, "full waiver grand = 0");
}

// Hide discount columns when no discounts; show for line OR overall
{
  const none = [
    { id: "1", description: "A", rate: 100, quantity: 1, discountPercent: 0 },
  ];
  const some = [
    { id: "1", description: "A", rate: 100, quantity: 1, discountPercent: 10 },
  ];
  assert(!hasLineItemDiscounts(none), "no line discounts");
  assert(hasLineItemDiscounts(some), "line discount");
  assert(!hasDocumentDiscounts(none, 0), "no discounts → hide cols");
  assert(hasDocumentDiscounts(none, 4.76), "overall only → show cols");
  assert(hasDocumentDiscounts(some, 0), "line only → show cols");
}

console.log("job-card-items discount tests: OK");
