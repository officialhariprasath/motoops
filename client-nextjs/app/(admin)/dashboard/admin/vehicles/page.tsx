"use client";

import Link from "next/link";
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
        vehicle.engineNumber,
        vehicle.chassisNumber,
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
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b">
              <th className="p-3 text-left">Photo</th>
              <th className="p-3 text-left">Vehicle</th>
              <th className="p-3 text-left">Registration / VIN</th>
              <th className="p-3 text-left">Owner</th>
              <th className="p-3 text-left">Workshop Info</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedVehicles.map((vehicle: any) => (
              <tr key={vehicle.id} className="border-b align-top hover:bg-slate-50">
                <td className="p-3">
                  {vehicle.photoUrl ? (
                    <img
                      src={vehicle.photoUrl}
                      alt={`${vehicle.registrationNumber} vehicle`}
                      className="h-16 w-20 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-20 items-center justify-center rounded-md border bg-slate-100 text-xs text-gray-500">
                      No photo
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <p className="font-semibold">{vehicle.brand} {vehicle.model}</p>
                  <p className="text-xs text-gray-500">Year: {vehicle.year || "N/A"}</p>
                  <p className="text-xs text-gray-500">Color: {vehicle.color || "N/A"}</p>
                </td>
                <td className="p-3">
                  <p className="font-semibold">{vehicle.registrationNumber}</p>
                  <p className="text-xs text-gray-500">VIN: {vehicle.vinNumber || "N/A"}</p>
                </td>
                <td className="p-3">
                  <p className="font-semibold">{vehicle.owner?.name || "No owner"}</p>
                  <p className="text-xs text-gray-500">{vehicle.owner?.mobile || "No mobile"}</p>
                  <p className="text-xs text-gray-500">{vehicle.owner?.email || "No email"}</p>
                </td>
                <td className="p-3">
                  <p>Mileage: {vehicle.mileage || "N/A"}</p>
                  <p className="text-xs text-gray-500">Engine: {vehicle.engineNumber || "N/A"}</p>
                  <p className="text-xs text-gray-500">Created: {vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleDateString() : "N/A"}</p>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/dashboard/admin/vehicles/${vehicle.id}`}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>

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
                  </div>
                </td>
              </tr>
            ))}

            {paginatedVehicles.length === 0 && (
              <tr>
                <td className="p-6 text-center text-sm text-gray-500" colSpan={6}>
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





