"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";

async function getMyInvoices() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const res = await fetch("/api/invoices", {
    cache: "no-store",
  });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || "Failed to load invoices");
  }

  const invoices = json?.data ?? json ?? [];
  return invoices.filter((invoice: any) => invoice.service?.customer?.id === user.id);
}

export default function MyInvoicesPage() {
  const query = useQuery({
    queryKey: ["user", "invoices"],
    queryFn: getMyInvoices,
  });

  if (query.isLoading) {
    return <p>Loading invoices...</p>;
  }

  if (query.error instanceof Error) {
    return <p className="text-sm text-red-600">{query.error.message}</p>;
  }

  const invoices = query.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Invoices</h1>
        <p className="text-sm text-gray-500">
          View invoices for your services.
        </p>
      </div>

      {invoices.length === 0 && (
        <div className="rounded-md border bg-white p-6 text-sm text-gray-500">
          No invoices found.
        </div>
      )}

      <div className="grid gap-4">
        {invoices.map((invoice: any) => (
          <Card key={invoice.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <h2 className="font-semibold">Invoice #{invoice.id.slice(0, 8)}</h2>
                <p className="text-sm text-gray-500">
                  Vehicle:{" "}
                  {invoice.service?.vehicle?.registrationNumber ?? "N/A"}
                </p>
                <p className="text-sm text-gray-500">
                  Status: {invoice.paymentStatus}
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold">
                  {Number(invoice.totalAmount ?? 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  Due: {Number(invoice.dueAmount ?? 0).toFixed(2)}
                </p>
                <Link
                  href={`/dashboard/admin/invoices/${invoice.id}`}
                  className="mt-2 inline-block rounded bg-black px-3 py-1 text-sm text-white"
                >
                  View
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
