"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  calcLineAmounts,
  formatMoney,
  type JobCardLineItem,
} from "@/lib/job-card-items";

export default function CustomerInvoiceViewPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    fetch(`/api/invoices/${invoiceId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const row = data?.data ?? data;
        if (!row) throw new Error("Invoice not found");
        if (row.service?.customer?.id && row.service.customer.id !== user.id) {
          throw new Error("You do not have access to this invoice");
        }
        setInvoice(row);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      );
  }, [invoiceId]);

  const lineItems = useMemo(
    () => (invoice?.service?.lineItems ?? []) as JobCardLineItem[],
    [invoice]
  );

  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!invoice) return <p className="p-6">Loading...</p>;

  const docType = invoice.documentType || "BILL";

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href="/dashboard/user/my-invoices" className="text-sm underline">
          Back to my invoices
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded bg-black px-3 py-1.5 text-sm text-white"
        >
          Print
        </button>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <div className="flex justify-between gap-4 border-b pb-4">
          <div>
            <p className="text-xs uppercase text-slate-500">{docType}</p>
            <h1 className="text-xl font-semibold">
              {invoice.invoiceNumber || invoice.id.slice(0, 8)}
            </h1>
          </div>
          <p className="text-2xl font-bold">
            ₹{formatMoney(invoice.totalAmount)}
          </p>
        </div>

        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <p>Vehicle: {invoice.service?.vehicle?.registrationNumber || "—"}</p>
          <p>
            {invoice.service?.vehicle?.brand} {invoice.service?.vehicle?.model}
          </p>
          {docType === "BILL" && (
            <>
              <p className="capitalize">Status: {invoice.paymentStatus}</p>
              <p>Due: ₹{formatMoney(invoice.dueAmount)}</p>
            </>
          )}
        </div>

        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b text-slate-500">
              <th className="py-2">Item</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, i) => (
              <tr key={item.id || i} className="border-b">
                <td className="py-2">{item.description}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">
                  ₹{formatMoney(calcLineAmounts(item).netAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
