export type JobCardLineItem = {
  id: string;
  description: string;
  rate: number;
  quantity: number;
  discountPercent: number;
};

export function calcLineAmounts(item: JobCardLineItem) {
  const rate = Number(item.rate || 0);
  const quantity = Number(item.quantity || 0);
  const discountPercent = Number(item.discountPercent || 0);
  const amount = rate * quantity;
  const discountAmount = (amount * discountPercent) / 100;
  const netAmount = amount - discountAmount;
  return { amount, discountAmount, netAmount };
}

export function calcLineItemsTotal(items: JobCardLineItem[]) {
  return items.reduce((sum, item) => sum + calcLineAmounts(item).netAmount, 0);
}

export function formatMoney(value: number) {
  return Number(value || 0).toFixed(2);
}
