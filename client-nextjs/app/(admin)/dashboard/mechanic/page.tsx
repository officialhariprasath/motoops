"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import JobCardSummaryCard from "@/components/dashboard/JobCardSummaryCard";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatJobCardStatus,
  normalizeJobCardStatus,
} from "@/lib/job-card-status";

async function getMyServices() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user.id) return [];
  const res = await fetch(`/api/services?technicianId=${user.id}`, {
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to load services");
  return json?.data ?? json ?? [];
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function MechanicDashboardPage() {
  const query = useQuery({
    queryKey: ["mechanic", "dashboard", "services"],
    queryFn: getMyServices,
  });

  const services = query.data ?? [];
  const stats = useMemo(() => {
    const active = services.filter((s: any) =>
      ["ASSIGNED", "IN_PROGRESS"].includes(normalizeJobCardStatus(s.status))
    );
    return {
      assigned: services.filter(
        (s: any) => normalizeJobCardStatus(s.status) === "ASSIGNED"
      ).length,
      inProgress: services.filter(
        (s: any) => normalizeJobCardStatus(s.status) === "IN_PROGRESS"
      ).length,
      completed: services.filter(
        (s: any) => normalizeJobCardStatus(s.status) === "COMPLETED"
      ).length,
      active,
    };
  }, [services]);

  if (query.isLoading) return <p>Loading dashboard...</p>;
  if (query.error instanceof Error) {
    return <p className="text-sm text-red-600">{query.error.message}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Mechanic dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your assigned job cards. Open a card for full details and
          line items.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Assigned" value={stats.assigned} />
        <Stat label="In progress" value={stats.inProgress} />
        <Stat label="Completed" value={stats.completed} />
      </div>

      <div>
        <h2 className="mb-3 font-semibold">Active job cards</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stats.active.map((service: any) => (
            <JobCardSummaryCard
              key={service.id}
              service={service}
              href={`/dashboard/mechanic/services/${service.id}`}
            />
          ))}
          {stats.active.length === 0 && (
            <div className="col-span-full rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No active assigned jobs. Statuses shown as{" "}
              {formatJobCardStatus("ASSIGNED")} /{" "}
              {formatJobCardStatus("IN_PROGRESS")}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
