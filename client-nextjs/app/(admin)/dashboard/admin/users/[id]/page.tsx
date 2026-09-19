"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import VehicleSummaryCard from "@/components/dashboard/VehicleSummaryCard";

async function getUser(id: string) {
  const res = await fetch(`/api/user/${id}`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to load customer");
  return json.data ?? json;
}

async function getOwnerVehicles(ownerId: string) {
  const res = await fetch(`/api/vehicles/owner/${ownerId}`, {
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to load vehicles");
  return json.data ?? json ?? [];
}

export default function UserDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const userQuery = useQuery({
    queryKey: ["user", id],
    queryFn: () => getUser(id),
    enabled: !!id,
  });

  const vehiclesQuery = useQuery({
    queryKey: ["vehicles", "owner", id],
    queryFn: () => getOwnerVehicles(id),
    enabled: !!id,
  });

  if (userQuery.isLoading) {
    return <p>Loading customer...</p>;
  }

  if (userQuery.isError || !userQuery.data) {
    return (
      <p className="text-red-600">
        {(userQuery.error as Error)?.message || "Customer not found."}
      </p>
    );
  }

  const customer = userQuery.data;
  const vehicles = vehiclesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Customer
            </p>
            <p className="text-xl font-semibold">{customer.name || "—"}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
            {customer.customerCode || "—"}
          </span>
        </div>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-slate-500">Mobile: </span>
            {customer.mobile || "—"}
          </p>
          <p>
            <span className="text-slate-500">Address: </span>
            {customer.address || "—"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-600">
          Vehicles for this customer
        </p>
        {vehiclesQuery.isLoading ? (
          <p className="text-sm text-slate-500">Loading vehicles...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {vehicles.map((vehicle: any) => (
              <VehicleSummaryCard key={vehicle.id} vehicle={vehicle} />
            ))}
            {vehicles.length === 0 && (
              <div className="col-span-full rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
                No vehicles linked to this customer yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
