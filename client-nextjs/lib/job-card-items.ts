export type JobCardLineItem = {
  id: string;
  description: string;
  rate: number;
  quantity: number;
  discountPercent: number;
  /** Snapshot from catalog: GENERAL | PROFIT (optional for legacy lines). */
  itemKind?: "GENERAL" | "PROFIT";
};

export function roundMoney(value: number) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

/** Percent rounding (2 dp). Do not use roundMoney for percentages. */
export function roundPercent(value: number) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

export function formatPercent(value: number) {
  const n = roundPercent(value);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/** Snap tolerance for amount→% (covers paise drift like 100 vs 100.11). */
const MONEY_SNAP = 0.2;

/**
 * Derive overall/line discount % from a typed amount, snapping common values
 * so 100 off a 100.00/100.11 bill becomes 100% (not 99.89).
 */
export function percentFromDiscountAmount(
  discountAmount: number,
  baseAmount: number
) {
  const base = roundMoney(baseAmount);
  const capped = Math.min(
    Math.max(0, roundMoney(discountAmount)),
    Math.max(0, base)
  );
  if (base <= 0) return 0;
  if (base - capped <= MONEY_SNAP) return 100;
  if (Math.abs(capped - roundMoney(base / 2)) <= MONEY_SNAP) return 50;
  return Math.min(100, Math.max(0, roundPercent((capped / base) * 100)));
}

export function calcLineAmounts(item: JobCardLineItem) {
  const rate = Number(item.rate || 0);
  const quantity = Number(item.quantity || 0);
  let discountPercent = Math.min(
    100,
    Math.max(0, Number(item.discountPercent || 0))
  );
  const amount = roundMoney(rate * quantity);
  let discountAmount: number;
  if (discountPercent >= 100) {
    discountPercent = 100;
    discountAmount = amount;
  } else {
    discountAmount = roundMoney((amount * discountPercent) / 100);
  }
  const netAmount = roundMoney(amount - discountAmount);
  return { amount, discountAmount, netAmount, discountPercent };
}

/** Sum of line net amounts (after per-item discounts). */
export function calcLineItemsTotal(items: JobCardLineItem[]) {
  return roundMoney(
    items.reduce((sum, item) => sum + calcLineAmounts(item).netAmount, 0)
  );
}

/** Sum of line gross amounts (before per-item discounts). */
export function calcLineItemsGrossTotal(items: JobCardLineItem[]) {
  return roundMoney(
    items.reduce((sum, item) => sum + calcLineAmounts(item).amount, 0)
  );
}

export function hasLineItemDiscounts(items: JobCardLineItem[]) {
  return items.some((item) => {
    const { discountAmount, discountPercent } = calcLineAmounts(item);
    return discountPercent > 0 || discountAmount > 0;
  });
}

/**
 * Overall (job-card) discount applied on the items subtotal (after line discounts).
 * Percent is the source of truth; amount is derived.
 */
export function calcOverallDiscount(
  itemsSubtotal: number,
  discountPercent: number
) {
  const subtotal = roundMoney(itemsSubtotal);
  let percent = Math.min(100, Math.max(0, Number(discountPercent || 0)));
  let discountAmount: number;
  if (percent >= 100) {
    percent = 100;
    discountAmount = subtotal;
  } else {
    discountAmount = roundMoney((subtotal * percent) / 100);
  }
  return {
    discountPercent: percent,
    discountAmount,
    grandTotal: roundMoney(subtotal - discountAmount),
  };
}

export function calcJobCardTotals(
  items: JobCardLineItem[],
  overallDiscountPercent = 0
) {
  const grossTotal = calcLineItemsGrossTotal(items);
  const itemsSubtotal = calcLineItemsTotal(items);
  const overall = calcOverallDiscount(itemsSubtotal, overallDiscountPercent);
  return {
    grossTotal,
    itemsSubtotal,
    ...overall,
  };
}

export function formatMoney(value: number) {
  return Number(value || 0).toFixed(2);
}

/** Rupee amount that stays valid in UTF-8 source files. */
export function formatCurrency(value: number) {
  return `\u20B9${formatMoney(value)}`;
}

/** Safe visual separator (middle dot). */
export const DOT_SEP = " \u00B7 ";
