"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";
import { normalizeJobCardStatus } from "@/lib/job-card-status";
import { formatMoney } from "@/lib/job-card-items";

async function apiGet(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Request failed");
  return json?.data ?? json ?? [];
}

function isSameDay(date: Date, now: Date) {
  return date.toDateString() === now.toDateString();
}

function isSameWeek(date: Date, now: Date) {
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return date >= start && date < end;
}

function isSameMonth(date: Date, now: Date) {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href?: string;
}) {
  const body = (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-sm font-medium text-muted-foreground">{label}</h2>
        <p className="mt-2 text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
  if (!href) return body;
  return (
    <Link href={href} className="block transition hover:opacity-90">
      {body}
    </Link>
  );
}

export default function DashboardPage() {
  const servicesQuery = useQuery({
    queryKey: ["dashboard", "services"],
    queryFn: () => apiGet("/api/services"),
  });
  const invoicesQuery = useQuery({
    queryKey: ["dashboard", "invoices"],
    queryFn: () => apiGet("/api/invoices"),
  });

  const stats = useMemo(() => {
    const now = new Date();
    const services = servicesQuery.data ?? [];
    const invoices = invoicesQuery.data ?? [];
    const bills = invoices.filter(
      (inv: any) => (inv.documentType || "BILL") === "BILL"
    );
    const estimates = invoices.filter(
      (inv: any) => inv.documentType === "ESTIMATE"
    );

    const todayJobs = services.filter((s: any) => {
      const d = new Date(s.jobCardAt || s.createdAt || s.serviceDate);
      return !Number.isNaN(d.getTime()) && isSameDay(d, now);
    }).length;

    const revenue = bills.reduce(
      (acc: any, invoice: any) => {
        const date = new Date(invoice.updatedAt || invoice.createdAt);
        const amount = Number(invoice.paidAmount || 0);
        if (isSameDay(date, now)) acc.daily += amount;
        if (isSameWeek(date, now)) acc.weekly += amount;
        if (isSameMonth(date, now)) acc.monthly += amount;
        return acc;
      },
      { daily: 0, weekly: 0, monthly: 0 }
    );

    return {
      todayJobs,
      inProgress: services.filter(
        (s: any) => normalizeJobCardStatus(s.status) === "IN_PROGRESS"
      ).length,
      assigned: services.filter(
        (s: any) => normalizeJobCardStatus(s.status) === "ASSIGNED"
      ).length,
      completed: services.filter((s: any) => s.status === "COMPLETED").length,
      pending: services.filter(
        (s: any) => normalizeJobCardStatus(s.status) === "PENDING"
      ).length,
      openEstimates: estimates.length,
      unpaidBills: bills.filter((b: any) => b.paymentStatus === "unpaid").length,
      partialBills: bills.filter((b: any) => b.paymentStatus === "partial")
        .length,
      paidBills: bills.filter((b: any) => b.paymentStatus === "paid").length,
      revenue,
    };
  }, [servicesQuery.data, invoicesQuery.data]);

  if (servicesQuery.isLoading || invoicesQuery.isLoading) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/admin/services?status=PENDING"
          className="rounded-md border px-3 py-1.5 text-sm"
        >
          Pending jobs
        </Link>
        <Link
          href="/dashboard/admin/invoices"
          className="rounded-md border px-3 py-1.5 text-sm"
        >
          Unpaid invoices
        </Link>
        <Link
          href="/dashboard/admin/services/create"
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
        >
          Create Job Card
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Today's job cards" value={stats.todayJobs} />
        <StatCard
          label="Unassigned"
          value={stats.pending}
          href="/dashboard/admin/services"
        />
        <StatCard
          label="Assigned"
          value={stats.assigned}
          href="/dashboard/admin/services"
        />
        <StatCard
          label="In progress"
          value={stats.inProgress}
          href="/dashboard/admin/services"
        />
        <StatCard label="Completed" value={stats.completed} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Open estimates"
          value={stats.openEstimates}
          href="/dashboard/admin/invoices"
        />
        <StatCard
          label="Unpaid bills"
          value={stats.unpaidBills}
          href="/dashboard/admin/invoices"
        />
        <StatCard label="Partial bills" value={stats.partialBills} />
        <StatCard label="Paid bills" value={stats.paidBills} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Collected today"
          value={`₹${formatMoney(stats.revenue.daily)}`}
        />
        <StatCard
          label="Collected this week"
          value={`₹${formatMoney(stats.revenue.weekly)}`}
        />
        <StatCard
          label="Collected this month"
          value={`₹${formatMoney(stats.revenue.monthly)}`}
        />
      </div>
    </div>
  );
}
