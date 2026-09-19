"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LookupResult =
  | {
      type: "customer";
      customer: any;
      vehicles: any[];
    }
  | {
      type: "vehicle";
      vehicle: any;
      customer: any;
    };

type Props = {
  onSelect: (result: LookupResult) => void;
  onClear: () => void;
  selectedCustomerCode?: string;
  selectedVehicleCode?: string;
};

async function fetchCustomers() {
  const res = await fetch("/api/user", { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to load customers");
  return (json.data ?? json ?? []) as any[];
}

async function searchVehicles(q: string) {
  if (q.trim().length < 2) return [] as any[];
  const res = await fetch(
    `/api/vehicles/search?q=${encodeURIComponent(q.trim())}`,
    { cache: "no-store" }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to search vehicles");
  return (json.data ?? []) as any[];
}

async function fetchOwnerVehicles(ownerId: string) {
  const res = await fetch(`/api/vehicles/owner/${ownerId}`, {
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to load vehicles");
  return (json.data ?? json ?? []) as any[];
}

export default function CustomerVehicleLookup({
  onSelect,
  onClear,
  selectedCustomerCode,
  selectedVehicleCode,
}: Props) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pendingCustomer, setPendingCustomer] = useState<any | null>(null);
  const [ownerVehicles, setOwnerVehicles] = useState<any[]>([]);

  const customersQuery = useQuery({
    queryKey: ["users-for-lookup"],
    queryFn: fetchCustomers,
  });

  const vehiclesQuery = useQuery({
    queryKey: ["vehicles-search", query],
    queryFn: () => searchVehicles(query),
    enabled: query.trim().length >= 2,
  });

  const customerMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const users = (customersQuery.data ?? []).filter(
      (user) => String(user.role || "").toLowerCase() === "user"
    );
    return users
      .filter((user) =>
        [user.name, user.mobile, user.customerCode, user.address]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [customersQuery.data, query]);

  const vehicleMatches = vehiclesQuery.data ?? [];

  const pickCustomer = async (customer: any) => {
    setShowSuggestions(false);
    setQuery(`${customer.name} (${customer.mobile})`);
    const vehicles = await fetchOwnerVehicles(customer.id);
    if (vehicles.length === 1) {
      setPendingCustomer(null);
      setOwnerVehicles([]);
      onSelect({
        type: "vehicle",
        vehicle: vehicles[0],
        customer: vehicles[0].owner || customer,
      });
      return;
    }
    if (vehicles.length === 0) {
      setPendingCustomer(null);
      setOwnerVehicles([]);
      onSelect({ type: "customer", customer, vehicles: [] });
      return;
    }
    setPendingCustomer(customer);
    setOwnerVehicles(vehicles);
  };

  const pickVehicle = (vehicle: any, customer?: any) => {
    setShowSuggestions(false);
    setPendingCustomer(null);
    setOwnerVehicles([]);
    setQuery(
      `${vehicle.registrationNumber} - ${vehicle.owner?.name || customer?.name || ""}`
    );
    onSelect({
      type: "vehicle",
      vehicle,
      customer: vehicle.owner || customer,
    });
  };

  const clearSelection = () => {
    setQuery("");
    setPendingCustomer(null);
    setOwnerVehicles([]);
    setShowSuggestions(false);
    onClear();
  };

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Find existing customer / vehicle</p>
          <p className="text-xs text-muted-foreground">
            Search by name, mobile, JMC, registration, or JMV. Leave empty to create new.
          </p>
        </div>
        {(selectedCustomerCode || selectedVehicleCode || query) && (
          <Button type="button" variant="outline" size="sm" onClick={clearSelection}>
            Clear / New
          </Button>
        )}
      </div>

      <div className="relative">
        <Input
          value={query}
          placeholder="Type to search customer or vehicle..."
          onChange={(event) => {
            setQuery(event.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />

        {showSuggestions && query.trim().length >= 2 && (
          <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-card shadow-lg">
            {customerMatches.length > 0 && (
              <div className="border-b p-2">
                <p className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">
                  Customers
                </p>
                {customerMatches.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    className="block w-full rounded px-2 py-2 text-left text-sm hover:bg-muted"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => pickCustomer(customer)}
                  >
                    <span className="font-medium">{customer.name}</span>
                    <span className="ml-2 text-muted-foreground">{customer.mobile}</span>
                    {customer.customerCode && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {customer.customerCode}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {vehicleMatches.length > 0 && (
              <div className="p-2">
                <p className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">
                  Vehicles
                </p>
                {vehicleMatches.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    type="button"
                    className="block w-full rounded px-2 py-2 text-left text-sm hover:bg-muted"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => pickVehicle(vehicle)}
                  >
                    <span className="font-medium">
                      {vehicle.registrationNumber}
                    </span>
                    <span className="ml-2 text-muted-foreground">
                      {[vehicle.brand, vehicle.model].filter(Boolean).join(" ")}
                    </span>
                    {vehicle.vehicleCode && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {vehicle.vehicleCode}
                      </span>
                    )}
                    {vehicle.owner?.name && (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Owner: {vehicle.owner.name} ({vehicle.owner.mobile})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {customerMatches.length === 0 &&
              vehicleMatches.length === 0 &&
              !vehiclesQuery.isFetching && (
                <p className="p-3 text-sm text-muted-foreground">
                  No matches. Continue typing new details below.
                </p>
              )}
          </div>
        )}
      </div>

      {(selectedCustomerCode || selectedVehicleCode) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {selectedCustomerCode && (
            <span className="rounded-full bg-muted px-3 py-1 font-medium">
              Customer ID: {selectedCustomerCode}
            </span>
          )}
          {selectedVehicleCode && (
            <span className="rounded-full bg-muted px-3 py-1 font-medium">
              Vehicle ID: {selectedVehicleCode}
            </span>
          )}
        </div>
      )}

      {pendingCustomer && ownerVehicles.length > 1 && (
        <div className="rounded-md border bg-muted p-3">
          <p className="mb-2 text-sm font-medium">
            Select a vehicle for {pendingCustomer.name}
          </p>
          <div className="grid gap-2">
            {ownerVehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                className="rounded-md border border-border bg-card px-3 py-2 text-left text-sm hover:border-primary/40"
                onClick={() => pickVehicle(vehicle, pendingCustomer)}
              >
                <span className="font-medium">{vehicle.registrationNumber}</span>
                <span className="ml-2 text-muted-foreground">
                  {[vehicle.brand, vehicle.model].filter(Boolean).join(" ")}
                </span>
                {vehicle.vehicleCode && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {vehicle.vehicleCode}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
