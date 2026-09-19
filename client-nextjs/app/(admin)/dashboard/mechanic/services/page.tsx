"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import JobCardSummaryCard from "@/components/dashboard/JobCardSummaryCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normalizeJobCardStatus } from "@/lib/job-card-status";

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

export default function MechanicServicesPage() {
  const [filter, setFilter] = useState<"active" | "previous">("active");
  const query = useQuery({
    queryKey: ["mechanic", "services"],
    queryFn: getMyServices,
  });

  const services = useMemo(() => {
    const rows = query.data ?? [];
    return rows.filter((service: any) => {
      const status = normalizeJobCardStatus(service.status);
      const done = status === "COMPLETED" || status === "CANCELLED";
      return filter === "previous" ? done : !done;
    });
  }, [query.data, filter]);

  if (query.isLoading) return <p>Loading assigned services...</p>;
  if (query.error instanceof Error) {
    return <p className="text-sm text-red-600">{query.error.message}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Assigned services</h1>
          <p className="text-sm text-muted-foreground">
            Same job cards as the workshop list - open one to view details and
            manage items.
          </p>
        </div>
        <Select
          value={filter}
          onValueChange={(value) => setFilter(value as "active" | "previous")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card">
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="previous">Previous</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service: any) => (
          <JobCardSummaryCard
            key={service.id}
            service={service}
            href={`/dashboard/mechanic/services/${service.id}`}
          />
        ))}
        {services.length === 0 && (
          <div className="col-span-full rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No job cards in this list.
          </div>
        )}
      </div>
    </div>
  );
}
