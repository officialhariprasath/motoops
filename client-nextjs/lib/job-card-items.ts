export type JobCardLineItem = {
  id: string;
  description: string;
  rate: number;
  quantity: number;
  discountPercent: number;
};

export function roundMoney(value: number) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

export function calcLineAmounts(item: JobCardLineItem) {
  const rate = Number(item.rate || 0);
  const quantity = Number(item.quantity || 0);
  const discountPercent = Number(item.discountPercent || 0);
  const amount = roundMoney(rate * quantity);
  const discountAmount = roundMoney((amount * discountPercent) / 100);
  const netAmount = roundMoney(amount - discountAmount);
  return { amount, discountAmount, netAmount };
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

/**
 * Overall (job-card) discount applied on the items subtotal (after line discounts).
 * Percent is the source of truth; amount is derived.
 */
export function calcOverallDiscount(
  itemsSubtotal: number,
  discountPercent: number
) {
  const percent = Math.min(100, Math.max(0, Number(discountPercent || 0)));
  const discountAmount = roundMoney((itemsSubtotal * percent) / 100);
  return {
    discountPercent: percent,
    discountAmount,
    grandTotal: roundMoney(itemsSubtotal - discountAmount),
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
