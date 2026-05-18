"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import ListControls from "@/components/dashboard/ListControls";
import { useGaragePageSize } from "@/lib/list-settings";

type Invoice = {
  id: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: "paid" | "unpaid" | "partial";
  createdAt: string;
  service: {
    id: string;
    vehicle?: {
      registrationNumber?: string;
      brand?: string;
      model?: string;
    };
    customer?: {
      name?: string;
      email?: string;
      mobile?: string;
    };
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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = useGaragePageSize();

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

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return invoices;

    return invoices.filter((invoice) =>
      [
        invoice.id,
        invoice.paymentStatus,
        invoice.totalAmount,
        invoice.paidAmount,
        invoice.dueAmount,
        invoice.generatedBy?.name,
        invoice.service?.id,
        invoice.service?.vehicle?.registrationNumber,
        invoice.service?.vehicle?.brand,
        invoice.service?.vehicle?.model,
        invoice.service?.customer?.name,
        invoice.service?.customer?.email,
        invoice.service?.customer?.mobile,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [invoices, search]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const paginatedInvoices = filteredInvoices.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  if (loading) {
    return <p className="p-6">Loading invoices...</p>;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Invoices</h1>

      {errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <ListControls
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search invoices by customer, vehicle, status, amount, or invoice id"
        page={page}
        totalPages={totalPages}
        totalItems={filteredInvoices.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      {!errorMessage && filteredInvoices.length === 0 && (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          No invoices found.
        </div>
      )}

      <div className="grid gap-4">
        {paginatedInvoices.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between rounded-xl border p-4 shadow-sm"
          >
            <div>
              <p className="font-semibold">Invoice #{inv.id.slice(0, 6)}</p>
              <p className="text-sm text-gray-500">Service ID: {inv.service?.id}</p>
              <p className="text-sm text-gray-500">
                Vehicle: {inv.service?.vehicle?.registrationNumber || "N/A"}
              </p>
              <p className="text-sm text-gray-500">
                Customer: {inv.service?.customer?.name || "N/A"}
              </p>
              <p className="text-sm text-gray-500">
                Created By: {inv.generatedBy?.name}
              </p>
              <p className="text-sm text-gray-500">
                Date: {new Date(inv.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="text-right">
              <p className="text-lg font-bold">? {inv.totalAmount}</p>

              <span
                className={`rounded px-2 py-1 text-sm ${
                  inv.paymentStatus === "paid"
                    ? "bg-green-100 text-green-700"
                    : inv.paymentStatus === "unpaid"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {inv.paymentStatus}
              </span>

              <div className="mt-2 space-x-2">
                <Link
                  href={`/dashboard/admin/invoices/${inv.id}`}
                  className="rounded bg-blue-500 px-2 py-1 text-xs text-white"
                >
                  View
                </Link>
                <Link
                  href={`/dashboard/admin/invoices/${inv.id}/payment`}
                  className="rounded bg-yellow-500 px-2 py-1 text-xs text-white"
                >
                  Update Payment
                </Link>
                <button
                  onClick={() => updateStatus(inv.id, "paid")}
                  className="rounded bg-green-500 px-2 py-1 text-xs text-white"
                >
                  Mark Paid
                </button>

                <button
                  onClick={() => updateStatus(inv.id, "unpaid")}
                  className="rounded bg-red-500 px-2 py-1 text-xs text-white"
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

