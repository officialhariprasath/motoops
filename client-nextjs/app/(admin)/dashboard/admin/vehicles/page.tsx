"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import ListControls from "@/components/dashboard/ListControls";
import VehicleSummaryCard from "@/components/dashboard/VehicleSummaryCard";
import { useGaragePageSize } from "@/lib/list-settings";

const getVehicles = async () => {
  const res = await fetch("/api/vehicles");
  if (!res.ok) throw new Error("Failed to fetch vehicles");
  return res.json();
};

export default function VehiclesPage() {
  const pageSize = useGaragePageSize();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const vehiclesQuery = useQuery({
    queryKey: ["vehicles"],
    queryFn: getVehicles,
  });

  const vehicles = vehiclesQuery?.data?.data ?? [];
  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return vehicles;

    return vehicles.filter((vehicle: any) =>
      [
        vehicle.registrationNumber,
        vehicle.brand,
        vehicle.model,
        vehicle.year,
        vehicle.vehicleCode,
        vehicle.owner?.name,
        vehicle.owner?.mobile,
        vehicle.owner?.customerCode,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [vehicles, search]);

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / pageSize));
  const paginatedVehicles = filteredVehicles.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  if (vehiclesQuery.isLoading) {
    return <div>Loading vehicles...</div>;
  }

  if (vehiclesQuery.error instanceof Error) {
    return <div className="text-red-600">{vehiclesQuery.error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <ListControls
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by registration, owner, make, model, JMV..."
        page={page}
        totalPages={totalPages}
        totalItems={filteredVehicles.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {paginatedVehicles.map((vehicle: any) => (
          <VehicleSummaryCard key={vehicle.id} vehicle={vehicle} />
        ))}
        {paginatedVehicles.length === 0 && (
          <div className="col-span-full rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
            No vehicles found.
          </div>
        )}
      </div>
    </div>
  );
}
