"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";

async function apiGet(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || "Request failed");
  }

  return json?.data ?? json ?? [];
}

export default function ReportsPage() {
  const servicesQuery = useQuery({
    queryKey: ["reports", "services"],
    queryFn: () => apiGet("/api/services"),
  });
  const invoicesQuery = useQuery({
    queryKey: ["reports", "invoices"],
    queryFn: () => apiGet("/api/invoices"),
  });

  const report = useMemo(() => {
    const services = servicesQuery.data ?? [];
    const invoices = invoicesQuery.data ?? [];

    return {
      servicesByStatus: services.reduce((acc: Record<string, number>, service: any) => {
        const status = service.status ?? "UNKNOWN";
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      }, {}),
      invoiceStats: {
        total: invoices.length,
        paid: invoices.filter((invoice: any) => invoice.paymentStatus === "paid")
          .length,
        partial: invoices.filter(
          (invoice: any) => invoice.paymentStatus === "partial"
        ).length,
        unpaid: invoices.filter(
          (invoice: any) => invoice.paymentStatus === "unpaid"
        ).length,
      },
      revenue: invoices.reduce(
        (sum: number, invoice: any) => sum + Number(invoice.paidAmount || 0),
        0
      ),
      outstanding: invoices.reduce(
        (sum: number, invoice: any) => sum + Number(invoice.dueAmount || 0),
        0
      ),
    };
  }, [servicesQuery.data, invoicesQuery.data]);

  if (servicesQuery.isLoading || invoicesQuery.isLoading) {
    return <p>Loading reports...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-gray-500">
          Operational report for services, invoices, revenue, and outstanding
          payments.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Paid Invoices</p>
            <p className="mt-2 text-3xl font-bold">{report.invoiceStats.paid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Partial</p>
            <p className="mt-2 text-3xl font-bold">
              {report.invoiceStats.partial}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Unpaid</p>
            <p className="mt-2 text-3xl font-bold">
              {report.invoiceStats.unpaid}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Outstanding</p>
            <p className="mt-2 text-3xl font-bold">
              {report.outstanding.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold">Service Status</h2>
            <div className="mt-4 space-y-2">
              {Object.entries(report.servicesByStatus as Record<string, number>).map(([status, count]) => (
                <div key={status} className="flex justify-between border-b py-2">
                  <span>{status.replaceAll("_", " ")}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold">Suggestions</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-600">
              <li>Add date filters for revenue and invoice reports.</li>
              <li>Add mechanic productivity by completed subtasks.</li>
              <li>Add customer due report for unpaid invoices.</li>
              <li>Add printable PDF export for monthly accounts.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
