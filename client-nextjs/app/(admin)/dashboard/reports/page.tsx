"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/job-card-items";
import { normalizeJobCardStatus } from "@/lib/job-card-status";
import { fetchInvoicesList, fetchServicesList } from "@/lib/query-fetchers";
import { queryKeys, STALE } from "@/lib/query-keys";

export default function ReportsPage() {
  const servicesQuery = useQuery({
    queryKey: queryKeys.servicesList,
    queryFn: fetchServicesList,
    staleTime: STALE.listsMs,
  });
  const invoicesQuery = useQuery({
    queryKey: queryKeys.invoicesList,
    queryFn: fetchInvoicesList,
    staleTime: STALE.listsMs,
  });

  const report = useMemo(() => {
    const services = servicesQuery.data ?? [];
    const invoices = invoicesQuery.data ?? [];
    const bills = invoices.filter(
      (inv: any) => (inv.documentType || "BILL") === "BILL"
    );

    return {
      servicesByStatus: services.reduce(
        (acc: Record<string, number>, service: any) => {
          const status = normalizeJobCardStatus(service.status) || "UNKNOWN";
          acc[status] = (acc[status] ?? 0) + 1;
          return acc;
        },
        {}
      ),
      billStats: {
        total: bills.length,
        paid: bills.filter((b: any) => b.paymentStatus === "paid").length,
        partial: bills.filter((b: any) => b.paymentStatus === "partial").length,
        unpaid: bills.filter((b: any) => b.paymentStatus === "unpaid").length,
      },
      estimates: invoices.filter((inv: any) => inv.documentType === "ESTIMATE")
        .length,
      revenue: bills.reduce(
        (sum: number, inv: any) => sum + Number(inv.paidAmount || 0),
        0
      ),
      outstanding: bills.reduce(
        (sum: number, inv: any) => sum + Number(inv.dueAmount || 0),
        0
      ),
    };
  }, [servicesQuery.data, invoicesQuery.data]);

  if (servicesQuery.isLoading || invoicesQuery.isLoading) {
    return <p>Loading reports...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Paid bills</p>
            <p className="mt-2 text-3xl font-bold">{report.billStats.paid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Partial bills</p>
            <p className="mt-2 text-3xl font-bold">{report.billStats.partial}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Unpaid bills</p>
            <p className="mt-2 text-3xl font-bold">{report.billStats.unpaid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Estimates</p>
            <p className="mt-2 text-3xl font-bold">{report.estimates}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Collected (bills)</p>
            <p className="mt-2 text-3xl font-bold">
              {formatCurrency(report.revenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Outstanding (bills)</p>
            <p className="mt-2 text-3xl font-bold">
              {formatCurrency(report.outstanding)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold">Job card status</h2>
          <div className="mt-4 space-y-2">
            {Object.entries(
              report.servicesByStatus as Record<string, number>
            ).map(([status, count]) => (
              <div key={status} className="flex justify-between border-b py-2">
                <span>{status.replaceAll("_", " ")}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
