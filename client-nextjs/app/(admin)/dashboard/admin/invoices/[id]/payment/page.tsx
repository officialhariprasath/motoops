"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { addNotification } from "@/lib/notifications";
import { formatCurrency } from "@/lib/job-card-items";

type Invoice = {
  id: string;
  invoiceNumber?: string;
  documentType?: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: "paid" | "unpaid" | "partial";
};

export default function UpdateInvoicePaymentPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [paidAmount, setPaidAmount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetch(`/api/invoices/${invoiceId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const invoiceData = data?.data ?? data;
        if (!invoiceData) throw new Error("Invoice not found");
        if (invoiceData.documentType === "ESTIMATE") {
          throw new Error("Estimates do not accept payments. Generate a bill first.");
        }
        setInvoice(invoiceData);
        setPaidAmount(Number(invoiceData.paidAmount || 0));
      })
      .catch((error) => {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load invoice"
        );
      });
  }, [invoiceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");

    const res = await fetch(`/api/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paidAmount: Number(paidAmount || 0) }),
    });
    const data = await res.json();

    if (!res.ok) {
      setErrorMessage(data?.message || "Failed to update payment");
      setSaving(false);
      return;
    }

    addNotification({
      title: "Payment updated",
      message: `Paid amount set to ${formatCurrency(paidAmount)}.`,
      category: "invoice",
    });
    setSaving(false);
    router.push(`/dashboard/admin/invoices/${invoiceId}`);
  };

  if (errorMessage && !invoice) {
    return <p className="p-6 text-red-600">{errorMessage}</p>;
  }

  if (!invoice) {
    return <p className="p-6">Loading invoice...</p>;
  }

  const total = Number(invoice.totalAmount || 0);
  const dueAmount = Math.max(total - Number(paidAmount || 0), 0);
  const previewStatus =
    paidAmount <= 0 ? "unpaid" : paidAmount >= total ? "paid" : "partial";

  return (
    <div className="mx-auto max-w-xl p-6">
      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border p-5">
        <div>
          <p className="text-sm text-muted-foreground">Bill</p>
          <p className="font-semibold">
            {invoice.invoiceNumber || `#${invoice.id.slice(0, 8)}`}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Total Amount</p>
          <p className="text-xl font-bold">{formatCurrency(total)}</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Total amount paid (cumulative)
          </label>
          <input
            type="number"
            min="0"
            max={total}
            step="0.01"
            value={paidAmount}
            onChange={(e) => setPaidAmount(Number(e.target.value))}
            className="w-full rounded-md border px-3 py-2"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Enter the full amount paid so far. Status updates automatically.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Due</p>
            <p className="text-lg font-bold">{formatCurrency(dueAmount)}</p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="text-lg font-bold capitalize">{previewStatus}</p>
          </div>
        </div>

        {errorMessage && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPaidAmount(total)}
            className="flex-1 rounded-md border px-4 py-2"
          >
            Mark fully paid
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save payment"}
          </button>
        </div>
      </form>
    </div>
  );
}
