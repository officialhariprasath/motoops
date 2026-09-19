"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import ListControls from "@/components/dashboard/ListControls";
import VehicleSummaryCard from "@/components/dashboard/VehicleSummaryCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGaragePageSize } from "@/lib/list-settings";

const getVehicles = async () => {
  const res = await fetch("/api/vehicles");
  if (!res.ok) throw new Error("Failed to fetch vehicles");
  return res.json();
};

function isSameMonth(value?: string | Date | null, now = new Date()) {
  if (!value) return false;
  const raw = String(value).slice(0, 10);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    return year === now.getFullYear() && month === now.getMonth();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

export default function VehiclesPage() {
  const pageSize = useGaragePageSize();
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<"ALL" | "THIS_MONTH">(
    "ALL"
  );
  const [page, setPage] = useState(1);

  const vehiclesQuery = useQuery({
    queryKey: ["vehicles"],
    queryFn: getVehicles,
  });

  const vehicles = vehiclesQuery?.data?.data ?? [];
  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = new Date();

    return vehicles.filter((vehicle: any) => {
      if (
        serviceFilter === "THIS_MONTH" &&
        !isSameMonth(vehicle.nextServiceAt, now)
      ) {
        return false;
      }

      if (!query) return true;

      return [
        vehicle.registrationNumber,
        vehicle.brand,
        vehicle.model,
        vehicle.year,
        vehicle.vehicleCode,
        vehicle.owner?.name,
        vehicle.owner?.mobile,
        vehicle.owner?.customerCode,
        vehicle.nextServiceOdometer,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [vehicles, search, serviceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / pageSize));
  const paginatedVehicles = filteredVehicles.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [search, serviceFilter]);

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
        filters={
          <Select
            value={serviceFilter}
            onValueChange={(value) =>
              setServiceFilter(value as "ALL" | "THIS_MONTH")
            }
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Service filter" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="ALL">All vehicles</SelectItem>
              <SelectItem value="THIS_MONTH">Service this month</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {paginatedVehicles.map((vehicle: any) => (
          <VehicleSummaryCard key={vehicle.id} vehicle={vehicle} />
        ))}
        {paginatedVehicles.length === 0 && (
          <div className="col-span-full rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No vehicles found.
          </div>
        )}
      </div>
    </div>
  );
}
