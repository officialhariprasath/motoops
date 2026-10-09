import { calcLineAmounts, roundMoney } from "@/lib/job-card-items";

type LineLike = {
  rate?: number;
  quantity?: number;
  discountPercent?: number;
  itemKind?: string;
};

type InvoiceLike = {
  documentType?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  service?: {
    lineItems?: LineLike[];
    jobCardAt?: string | Date;
    createdAt?: string | Date;
    serviceDate?: string | Date;
  };
  lineItems?: LineLike[];
};

function isSameMonth(date: Date, now: Date) {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function invoiceMonthDate(invoice: InvoiceLike): Date | null {
  const raw =
    invoice.createdAt ||
    invoice.updatedAt ||
    invoice.service?.jobCardAt ||
    invoice.service?.serviceDate ||
    invoice.service?.createdAt;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Net amount of PROFIT lines on one bill (legacy lines without kind = 0). */
export function profitNetFromInvoice(invoice: InvoiceLike): number {
  if ((invoice.documentType || "BILL") !== "BILL") return 0;
  const lines =
    invoice.service?.lineItems ?? invoice.lineItems ?? ([] as LineLike[]);
  let sum = 0;
  for (const line of lines) {
    if (String(line.itemKind || "").toUpperCase() !== "PROFIT") continue;
    sum += calcLineAmounts({
      id: "x",
      description: "",
      rate: Number(line.rate || 0),
      quantity: Number(line.quantity || 0),
      discountPercent: Number(line.discountPercent || 0),
      itemKind: "PROFIT",
    }).netAmount;
  }
  return roundMoney(sum);
}

/** Sum PROFIT line nets on BILL invoices in the current calendar month. */
export function monthlyProfitFromInvoices(
  invoices: InvoiceLike[],
  now = new Date()
) {
  let total = 0;
  for (const invoice of invoices ?? []) {
    const date = invoiceMonthDate(invoice);
    if (!date || !isSameMonth(date, now)) continue;
    total += profitNetFromInvoice(invoice);
  }
  return roundMoney(total);
}
