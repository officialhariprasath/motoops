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

/**
 * Percent rounding with 4 dp so amount→%→amount round-trips
 * (e.g. ₹50 off ₹1050 → 4.7619% → ₹50.00, not 4.76% → ₹49.98).
 */
export function roundPercent(value: number) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 10000) / 10000;
}

export function formatPercent(value: number) {
  const n = roundPercent(value);
  if (Number.isInteger(n)) return String(n);
  return parseFloat(n.toFixed(4)).toString();
}

/** Snap tolerance for amount→% (covers paise drift like 100 vs 100.11). */
const MONEY_SNAP = 0.2;
/** When %→amount drifts by a few paise (e.g. 4.76% of 1050 → 49.98), snap to ₹. */
const AMOUNT_ROUNDTRIP_SNAP = 0.05;

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

/** Prefer whole-rupee discount amounts when float % only drifted by paise. */
function snapDiscountAmount(amount: number, subtotal: number) {
  const a = roundMoney(amount);
  const whole = Math.round(a);
  if (
    whole >= 0 &&
    whole <= subtotal + AMOUNT_ROUNDTRIP_SNAP &&
    Math.abs(a - whole) <= AMOUNT_ROUNDTRIP_SNAP
  ) {
    return Math.min(whole, roundMoney(subtotal));
  }
  return a;
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
    discountAmount = snapDiscountAmount(
      roundMoney((subtotal * percent) / 100),
      subtotal
    );
  }
  return {
    discountPercent: percent,
    discountAmount,
    grandTotal: roundMoney(subtotal - discountAmount),
  };
}

/** Show Dis%/Dis-Amt on print when any line OR overall discount exists. */
export function hasDocumentDiscounts(
  items: JobCardLineItem[],
  overallDiscountPercent = 0
) {
  return (
    hasLineItemDiscounts(items) || Number(overallDiscountPercent || 0) > 0
  );
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
