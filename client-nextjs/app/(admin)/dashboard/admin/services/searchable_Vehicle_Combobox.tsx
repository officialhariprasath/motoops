"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Controller } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

type Vehicle = {
  id: string;
  registrationNumber: string;
  brand?: string;
  model?: string;
  vinNumber?: string;
  owner?: {
    id: string;
    name: string;
    phone?: string;
  };
};

export function VehicleSearchField({
  control,
  setValue,
}: {
  control: any;
  setValue: any;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
  if (query.length < 2) {
    setVehicles([]);
    return;
  }

  const timeout = setTimeout(async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/vehicles/search?q=${encodeURIComponent(query)}`
      );

      const data = await res.json();
      setVehicles(data.data || []);
    } catch (error) {
      console.error(error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, 400);

  return () => clearTimeout(timeout);
}, [query]);


  return (
    <Controller
      control={control}
      name="vehicleId"
      render={({ field }) => {
        

        return (
          <div className="space-y-2">
            <Label>Vehicle</Label>

            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {selectedVehicle ? (
                    <span>
                      {selectedVehicle.registrationNumber} -{" "}
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Search vehicle by plate, VIN, customer name or phone
                    </span>
                  )}

                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-[420px] p-3 bg-card">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Type registration, VIN, customer name..."
                    className="pl-9"
                  />
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1">
                  {loading && (
                    <p className="text-sm text-muted-foreground p-2">
                      Searching...
                    </p>
                  )}

                  {!loading && query.length >= 2 && vehicles.length === 0 && (
                    <p className="text-sm text-muted-foreground p-2">
                      No vehicle found.
                    </p>
                  )}

                  {vehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      type="button"
                      className={cn(
                        "w-full text-left rounded-md px-3 py-2 hover:bg-muted",
                        field.value === vehicle.id && "bg-muted"
                      )}
                      onClick={() => {
                        field.onChange(vehicle.id);

                        setSelectedVehicle(vehicle);

                        setValue("customerId", vehicle.owner?.id || "");

                        setQuery(
                          `${vehicle.registrationNumber} - ${vehicle.owner?.name || ""}`
                        );

                        setVehicles([]);

                        setOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {vehicle.registrationNumber}
                          </p>

                          <p className="text-sm text-muted-foreground">
                            {vehicle.brand} {vehicle.model}
                            {vehicle.vinNumber ? ` • VIN: ${vehicle.vinNumber}` : ""}
                          </p>

                          <p className="text-sm text-muted-foreground">
                            Owner: {vehicle.owner?.name}
                            {vehicle.owner?.phone
                              ? ` • ${vehicle.owner.phone}`
                              : ""}
                          </p>
                        </div>

                        {field.value === vehicle.id && (
                          <Check className="h-4 w-4" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            {selectedVehicle ? (
                    <span>
                      {selectedVehicle.registrationNumber} -{" "}
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </span>
            ):''}

          </div>
        );
      }}
    />
  );
}