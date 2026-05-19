"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { addNotification } from "@/lib/notifications";

type Invoice = {
  id: string;
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
  const [status, setStatus] = useState<"paid" | "unpaid" | "partial">("unpaid");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetch(`/api/invoices/${invoiceId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const invoiceData = data?.data ?? data;

        if (!invoiceData) {
          throw new Error("Invoice not found");
        }

        setInvoice(invoiceData);
        setStatus(invoiceData.paymentStatus);
        setPaidAmount(Number(invoiceData.paidAmount || 0));
      })
      .catch((error) => {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load invoice"
        );
      });
  }, [invoiceId]);

  const handleStatusChange = (value: "paid" | "unpaid" | "partial") => {
    setStatus(value);

    if (!invoice) return;

    if (value === "paid") {
      setPaidAmount(Number(invoice.totalAmount || 0));
    }

    if (value === "unpaid") {
      setPaidAmount(0);
    }

    if (value === "partial") {
      setPaidAmount(Number(invoice.paidAmount || 0));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);

    const res = await fetch(`/api/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paidAmount: Number(paidAmount || 0),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorMessage(data?.message || "Failed to update payment");
      setSaving(false);
      return;
    }

    setSaving(false);
    router.push(`/dashboard/admin/invoices/${invoiceId}`);
  };

  if (errorMessage) {
    return <p className="p-6 text-red-600">{errorMessage}</p>;
  }

  if (!invoice) {
    return <p className="p-6">Loading invoice...</p>;
  }

  const dueAmount = Math.max(
    Number(invoice.totalAmount || 0) - Number(paidAmount || 0),
    0
  );

  return (
    <div className="max-w-xl p-6 mx-auto">
      <h1 className="mb-6 text-2xl font-bold">Update Payment</h1>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border p-5">
        <div>
          <p className="text-sm text-gray-500">Invoice</p>
          <p className="font-semibold">#{invoice.id.slice(0, 8)}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-xl font-bold">à§³ {invoice.totalAmount}</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Payment Status</label>

          <select
            value={status}
            onChange={(e) =>
              handleStatusChange(e.target.value as "paid" | "unpaid" | "partial")
            }
            className="w-full rounded-md border px-3 py-2"
          >
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {status === "partial" && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              Partial Paid Amount
            </label>

            <input
              type="number"
              min="0"
              max={invoice.totalAmount}
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(Number(e.target.value))}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        )}

        {status !== "partial" && (
          <div>
            <label className="mb-1 block text-sm font-medium">Paid Amount</label>

            <input
              type="number"
              value={paidAmount}
              disabled
              className="w-full rounded-md border bg-gray-100 px-3 py-2"
            />
          </div>
        )}

        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Due Amount</p>
          <p className="text-lg font-bold">à§³ {dueAmount}</p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Update Payment"}
        </button>
        
      </form>
    </div>
  );
}

