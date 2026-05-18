"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

type Invoice = {
  id: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;

  paymentStatus: "paid" | "unpaid" | "partial";

  createdAt: string;

  service: {
    id: string;
  };

  generatedBy: {
    id: string;
    name: string;
  };
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setErrorMessage("");
      const res = await fetch("/api/invoices", {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load invoices");
      }

      setInvoices(data?.data ?? data ?? []);
    } catch (error) {
      console.error("Failed to load invoices", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load invoices"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const invoice = invoices.find((item) => item.id === id);
    const paidAmount = status === "paid" ? Number(invoice?.totalAmount || 0) : 0;

    const res = await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ paidAmount }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorMessage(data?.message || "Failed to update payment status");
      return;
    }

    fetchInvoices();
  };

  if (loading) {
    return <p className="p-6">Loading invoices...</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Invoices</h1>

      {errorMessage && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {!errorMessage && invoices.length === 0 && (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          No invoices found.
        </div>
      )}

      <div className="grid gap-4">
        {invoices?.map((inv) => (
          <div
            key={inv.id}
            className="border rounded-xl p-4 shadow-sm flex justify-between items-center"
          >
            {/* LEFT SIDE */}
            <div>
              <p className="font-semibold">
                Invoice #{inv.id.slice(0, 6)}
              </p>

              <p className="text-sm text-gray-500">
                Service ID: {inv.service?.id}
              </p>

              <p className="text-sm text-gray-500">
                Created By: {inv.generatedBy?.name}
              </p>

              <p className="text-sm text-gray-500">
                Date: {new Date(inv.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* RIGHT SIDE */}
            <div className="text-right">
              <p className="text-lg font-bold">
                ৳ {inv.totalAmount}
              </p>

              <span
                className={`text-sm px-2 py-1 rounded ${
                  inv.paymentStatus === "paid"
                    ? "bg-green-100 text-green-700"
                    : inv.paymentStatus === "unpaid"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {inv.paymentStatus}
              </span>

              {/* ACTIONS */}
              <div className="mt-2 space-x-2">
                <Link
                  href={`/dashboard/admin/invoices/${inv.id}`}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded"
                >
                  View
                </Link>
                <Link
                  href={`/dashboard/admin/invoices/${inv.id}/payment`}
                  className="px-2 py-1 text-xs bg-yellow-500 text-white rounded"
                >
                  Update Payment
                </Link>
                                <button
                  onClick={() => updateStatus(inv.id, "paid")}
                  className="px-2 py-1 text-xs bg-green-500 text-white rounded"
                >
                  Mark Paid
                </button>

                <button
                  onClick={() => updateStatus(inv.id, "unpaid")}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                >
                  Unpaid
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
