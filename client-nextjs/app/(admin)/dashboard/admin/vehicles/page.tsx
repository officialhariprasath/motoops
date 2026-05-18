"use client";

import { useEffect, useMemo, useState } from "react";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import VehicleForm from "./VehicleForm";

import { Button } from "@/components/ui/button";
import { useDeleteActionsEnabled } from "@/lib/delete-settings";
import { useGaragePageSize } from "@/lib/list-settings";
import ListControls from "@/components/dashboard/ListControls";

const getVehicles = async () => {
  const res = await fetch("/api/vehicles");

  if (!res.ok) {
    throw new Error("Failed to fetch vehicles");
  }

  return res.json();
};

const deleteVehicle = async (id: string) => {
  const res = await fetch(`/api/vehicles/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete vehicle");
  }

  return res.json();
};

export default function VehiclesPage() {
  const queryClient = useQueryClient();
  const deleteActionsEnabled = useDeleteActionsEnabled();
  const pageSize = useGaragePageSize();

  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const vehiclesQuery = useQuery({
    queryKey: ["vehicles"],
    queryFn: getVehicles,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });

  const vehicles = vehiclesQuery?.data?.data ?? [];
  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return vehicles;

    return vehicles.filter((vehicle: any) =>
      [
        vehicle.registrationNumber,
        vehicle.vinNumber,
        vehicle.brand,
        vehicle.model,
        vehicle.year,
        vehicle.color,
        vehicle.mileage,
        vehicle.owner?.name,
        vehicle.owner?.email,
        vehicle.owner?.mobile,
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
    return <div>Loading...</div>;
  }

  if (vehiclesQuery.error instanceof Error) {
    return <div>{vehiclesQuery.error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <VehicleForm
        editingVehicle={editingVehicle}
        onSuccess={() => {
          setEditingVehicle(null);
          queryClient.invalidateQueries({ queryKey: ["vehicles"] });
        }}
      />

      <ListControls
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search vehicles by registration, owner, brand, model, VIN, or mileage"
        page={page}
        totalPages={totalPages}
        totalItems={filteredVehicles.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <div className="overflow-hidden rounded-xl border bg-white p-6">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Registration</th>
              <th className="p-2 text-left">Brand</th>
              <th className="p-2 text-left">Model</th>
              <th className="p-2 text-left">Owner</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedVehicles.map((vehicle: any) => (
              <tr key={vehicle.id} className="border-b">
                <td className="p-2">{vehicle.registrationNumber}</td>
                <td className="p-2">{vehicle.brand}</td>
                <td className="p-2">{vehicle.model}</td>
                <td className="p-2">{vehicle.owner?.name}</td>
                <td className="flex gap-2 p-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingVehicle(vehicle)}
                  >
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={!deleteActionsEnabled || deleteMutation.isPending}
                    title={
                      deleteActionsEnabled
                        ? "Delete vehicle"
                        : "Enable delete actions in Settings first"
                    }
                    onClick={() => deleteMutation.mutate(vehicle.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}

            {paginatedVehicles.length === 0 && (
              <tr>
                <td className="p-6 text-center text-sm text-gray-500" colSpan={5}>
                  No vehicles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


