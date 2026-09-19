"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import JobCardSummaryCard from "@/components/dashboard/JobCardSummaryCard";

async function getVehicle(id: string) {
  const res = await fetch(`/api/vehicles/${id}`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to load vehicle");
  return json.data ?? json;
}

async function getVehicleJobCards(vehicleId: string) {
  const res = await fetch(`/api/services?vehicleId=${vehicleId}`, {
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to load job cards");
  return json.data ?? json ?? [];
}

export default function VehicleDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const vehicleQuery = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => getVehicle(id),
    enabled: !!id,
  });

  const jobsQuery = useQuery({
    queryKey: ["services", "vehicle", id],
    queryFn: () => getVehicleJobCards(id),
    enabled: !!id,
  });

  if (vehicleQuery.isLoading) {
    return <p>Loading vehicle...</p>;
  }

  if (vehicleQuery.isError || !vehicleQuery.data) {
    return (
      <p className="text-red-600">
        {(vehicleQuery.error as Error)?.message || "Vehicle not found."}
      </p>
    );
  }

  const vehicle = vehicleQuery.data;
  const jobs = jobsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="moto-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Vehicle
            </p>
            <p className="text-xl font-semibold">
              {vehicle.registrationNumber || "-"}
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
            {vehicle.vehicleCode || "-"}
          </span>
        </div>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Make / Model: </span>
            {[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Year: </span>
            {vehicle.year || "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Owner: </span>
            {vehicle.owner?.name || "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Mobile: </span>
            {vehicle.owner?.mobile || "-"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Job cards for this vehicle
        </p>
        {jobsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading job cards...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((service: any) => (
              <JobCardSummaryCard key={service.id} service={service} />
            ))}
            {jobs.length === 0 && (
              <div className="col-span-full rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                No job cards for this vehicle yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
