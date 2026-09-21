"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, DOT_SEP } from "@/lib/job-card-items";

async function getMyInvoices() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const res = await fetch("/api/invoices", { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to load invoices");
  const invoices = json?.data ?? json ?? [];
  return invoices.filter(
    (invoice: any) => invoice.service?.customer?.id === user.id
  );
}

export default function MyInvoicesPage() {
  const query = useQuery({
    queryKey: ["user", "invoices"],
    queryFn: getMyInvoices,
  });

  if (query.isLoading) return <p>Loading invoices...</p>;
  if (query.error instanceof Error) {
    return <p className="text-sm text-red-600">{query.error.message}</p>;
  }

  const invoices = query.data ?? [];

  return (
    <div className="space-y-6">
      {invoices.length === 0 && (
        <div className="moto-card p-6 text-sm text-muted-foreground">
          No invoices found.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {invoices.map((invoice: any) => {
          const docType = invoice.documentType || "BILL";
          return (
            <Link
              key={invoice.id}
              href={`/dashboard/user/my-invoices/${invoice.id}`}
              className="block moto-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {invoice.invoiceNumber || invoice.id.slice(0, 8)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {invoice.service?.vehicle?.registrationNumber ?? "N/A"}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
                  {docType === "ESTIMATE" ? "Estimate" : "Bill"}
                </span>
              </div>
              <p className="mt-3 text-lg font-bold">
                {formatCurrency(Number(invoice.totalAmount))}
              </p>
              {docType === "BILL" && (
                <p className="text-sm capitalize text-muted-foreground">
                  {invoice.paymentStatus}
                  {DOT_SEP}Due {formatCurrency(Number(invoice.dueAmount))}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
