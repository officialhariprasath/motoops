"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import ListControls from "@/components/dashboard/ListControls";
import { useGaragePageSize } from "@/lib/list-settings";
import { formatCurrency, DOT_SEP } from "@/lib/job-card-items";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Invoice = {
  id: string;
  invoiceNumber?: string;
  documentType?: "ESTIMATE" | "BILL";
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: "paid" | "unpaid" | "partial";
  createdAt: string;
  service: {
    id: string;
    jobCardNumber?: string;
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
  generatedBy?: {
    id: string;
    name: string;
  };
};

function statusTone(status: string) {
  if (status === "paid") return "bg-emerald-50 text-emerald-800";
  if (status === "partial") return "bg-amber-50 text-amber-800";
  return "bg-rose-50 text-rose-800";
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = useGaragePageSize();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setErrorMessage("");
      const res = await fetch("/api/invoices", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load invoices");
      setInvoices(data?.data ?? data ?? []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load invoices"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const docType = invoice.documentType || "BILL";
      if (typeFilter !== "ALL" && docType !== typeFilter) return false;
      if (
        paymentFilter !== "ALL" &&
        invoice.paymentStatus !== paymentFilter
      ) {
        return false;
      }
      if (typeFilter === "ESTIMATE" && paymentFilter !== "ALL") {
        // estimates stay unpaid; still allow filter
      }
      if (!query) return true;

      return [
        invoice.invoiceNumber,
        invoice.id,
        invoice.documentType,
        invoice.paymentStatus,
        invoice.totalAmount,
        invoice.paidAmount,
        invoice.dueAmount,
        invoice.generatedBy?.name,
        invoice.service?.jobCardNumber,
        invoice.service?.vehicle?.registrationNumber,
        invoice.service?.vehicle?.brand,
        invoice.service?.vehicle?.model,
        invoice.service?.customer?.name,
        invoice.service?.customer?.mobile,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [invoices, search, typeFilter, paymentFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const paginatedInvoices = filteredInvoices.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, paymentFilter]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  if (loading) {
    return <p className="p-6">Loading invoices...</p>;
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <ListControls
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by number, customer, vehicle, or status"
        page={page}
        totalPages={totalPages}
        totalItems={filteredInvoices.length}
        pageSize={pageSize}
        onPageChange={setPage}
        filters={
          <div className="flex flex-wrap gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="ALL">All types</SelectItem>
                <SelectItem value="ESTIMATE">Estimate</SelectItem>
                <SelectItem value="BILL">Bill</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="ALL">All payments</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {!errorMessage && filteredInvoices.length === 0 && (
        <div className="rounded-md border border-border bg-muted px-4 py-6 text-sm text-muted-foreground">
          No invoices found.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {paginatedInvoices.map((inv) => {
          const docType = inv.documentType || "BILL";
          return (
            <Link
              key={inv.id}
              href={`/dashboard/admin/invoices/${inv.id}`}
              className="block rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {inv.invoiceNumber || inv.id.slice(0, 8)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {inv.service?.jobCardNumber || "Job card"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    docType === "ESTIMATE"
                      ? "bg-sky-50 text-sky-800"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {docType === "ESTIMATE" ? "Estimate" : "Bill"}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p>{inv.service?.customer?.name || "-"}</p>
                <p>
                  {inv.service?.vehicle?.registrationNumber || "-"}
                  {inv.service?.vehicle?.brand
                    ? `${DOT_SEP}${inv.service.vehicle.brand}`
                    : ""}
                </p>
              </div>

              <div className="mt-4 flex items-end justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {formatCurrency(Number(inv.totalAmount))}
                  </p>
                  {docType === "BILL" && (
                    <p className="text-xs text-muted-foreground">
                      Paid {formatCurrency(Number(inv.paidAmount))}
                      {DOT_SEP}Due {formatCurrency(Number(inv.dueAmount))}
                    </p>
                  )}
                </div>
                {docType === "BILL" && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${statusTone(
                      inv.paymentStatus
                    )}`}
                  >
                    {inv.paymentStatus}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
