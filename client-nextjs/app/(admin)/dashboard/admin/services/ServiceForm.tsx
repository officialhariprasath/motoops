// File: ServiceForm.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { Field } from "./component/form-shared";
import CustomerVehicleLookup from "./component/CustomerVehicleLookup";
import { addNotification } from "@/lib/notifications";
import {
  INDIAN_BIKE_MAKERS,
  consumeNextJobCardNumber,
  peekNextJobCardNumber,
  toDateTimeLocalValue,
} from "@/lib/job-card-settings";
import {
  JOB_CARD_STATUSES,
  normalizeJobCardStatus,
} from "@/lib/job-card-status";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  editingService?: any;
};

const optionalText = z.string().optional().or(z.literal(""));

const statusEnum = z.enum([
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

const jobCardSchema = z.object({
  status: statusEnum,
  problemDescription: optionalText,
  notes: optionalText,
  jobCardNumber: z.string().min(1, "Job card number is required"),
  jobCardAt: z.string().min(1, "Job card date and time is required"),
  customerName: z.string().min(2, "Customer name is required"),
  customerMobile: z.string().min(8, "Mobile number is required"),
  customerAddress: optionalText,
  registrationNumber: z.string().min(2, "Registration number is required"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  modelYear: optionalText,
  engineNumber: optionalText,
  chassisNumber: optionalText,
  odometerReading: optionalText,
  petrolLevel: z.coerce.number().min(0).max(10),
  vehicleId: optionalText,
  customerId: optionalText,
});

type JobCardFormData = z.output<typeof jobCardSchema>;

function getErrorMessages(errors: unknown): string[] {
  if (!errors || typeof errors !== "object") return [];
  if (Array.isArray(errors)) return errors.flatMap(getErrorMessages);

  const record = errors as Record<string, unknown>;
  const ownMessage =
    typeof record.message === "string" ? [record.message] : [];

  const childMessages = Object.entries(record)
    .filter(([key]) => key !== "ref" && key !== "message" && key !== "type")
    .flatMap(([, value]) => getErrorMessages(value));

  return [...ownMessage, ...childMessages];
}

function toJobCardAtLocal(value?: string | Date | null) {
  if (!value) return toDateTimeLocalValue();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return toDateTimeLocalValue();
  return toDateTimeLocalValue(date);
}

function petrolLabel(level: number) {
  if (level <= 0) return "Empty";
  if (level <= 3) return "Low";
  if (level <= 6) return "Half";
  if (level < 10) return "High";
  return "Full";
}

function PetrolLevelBar({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const raw = Number(value);
  const level = Number.isFinite(raw) ? Math.min(10, Math.max(0, raw)) : 0;

  return (
    <div className="space-y-3 rounded-lg border bg-muted p-4">
      <div className="flex items-end justify-between gap-4">
        <div className="relative h-28 w-16 overflow-hidden rounded-md border-2 border-border bg-card">
          <div className="absolute inset-x-0 top-0 h-2 bg-primary" />
          <div
            className="absolute inset-x-1 bottom-1 rounded-sm bg-amber-400 transition-all"
            style={{ height: `${(level / 10) * 100}%` }}
          />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground/80">Petrol level</span>
            <span className="font-semibold text-foreground">
              {level}/10 - {petrolLabel(level)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={level}
            onChange={(event) => onChange(Number(event.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Empty</span>
            <span>Full</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function normalizeService(service: any): JobCardFormData {
  return {
    status: normalizeJobCardStatus(service?.status),
    problemDescription: service?.problemDescription ?? "",
    notes: service?.notes ?? "",
    jobCardNumber: service?.jobCardNumber ?? "",
    jobCardAt: toJobCardAtLocal(service?.jobCardAt ?? service?.serviceDate),
    customerName: service?.customer?.name ?? "",
    customerMobile: service?.customer?.mobile ?? "",
    customerAddress: service?.customer?.address ?? "",
    registrationNumber: service?.vehicle?.registrationNumber ?? "",
    make: service?.vehicle?.brand ?? "",
    model: service?.vehicle?.model ?? "",
    modelYear: service?.vehicle?.year ?? String(new Date().getFullYear()),
    engineNumber: service?.vehicle?.engineNumber ?? "",
    chassisNumber: service?.vehicle?.chassisNumber ?? "",
    odometerReading: service?.vehicle?.mileage ?? "",
    petrolLevel: Number(service?.petrolLevel ?? 0),
    vehicleId: service?.vehicle?.id ?? service?.vehicleId ?? "",
    customerId: service?.customer?.id ?? service?.customerId ?? "",
  };
}

async function saveService({
  data,
  editingService,
}: {
  data: JobCardFormData;
  editingService?: any;
}) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const jobCardAtIso = new Date(data.jobCardAt).toISOString();
  if (Number.isNaN(new Date(data.jobCardAt).getTime())) {
    throw new Error("Job card date and time is invalid");
  }

  const payload = {
    status: data.status,
    problemDescription: data.problemDescription,
    notes: data.notes,
    jobCardNumber: data.jobCardNumber,
    jobCardAt: jobCardAtIso,
    petrolLevel: data.petrolLevel,
    // Full ISO timestamps — Nest @IsDateString rejects bare YYYY-MM-DD after transform
    serviceDate: jobCardAtIso,
    deliveryDate: jobCardAtIso,
    customerName: data.customerName,
    customerMobile: data.customerMobile,
    customerAddress: data.customerAddress,
    registrationNumber: data.registrationNumber.toUpperCase(),
    make: data.make,
    model: data.model,
    modelYear: data.modelYear,
    engineNumber: data.engineNumber,
    chassisNumber: data.chassisNumber,
    odometerReading: data.odometerReading,
    // Keep existing items when editing job-card fields (items managed on details page)
    lineItems: editingService?.lineItems ?? [],
    vehicleId: data.vehicleId || undefined,
    customerId: data.customerId || undefined,
    createdById: user.id,
    discount: 0,
    tax: 0,
    damagePhotoUrls: [],
    repairProofPhotoUrls: [],
    tasks: [],
  };

  const res = await fetch(
    editingService ? `/api/services/${editingService.id}` : "/api/services",
    {
      method: editingService ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to save job card");
  return json;
}

export default function ServiceForm({ editingService }: Props) {
  const isEdit = Boolean(editingService);
  const queryClient = useQueryClient();
  const router = useRouter();
  const [selectedCustomerCode, setSelectedCustomerCode] = useState(
    editingService?.customer?.customerCode || ""
  );
  const [selectedVehicleCode, setSelectedVehicleCode] = useState(
    editingService?.vehicle?.vehicleCode || ""
  );

  const form = useForm<any>({
    resolver: zodResolver(jobCardSchema),
    defaultValues: isEdit
      ? normalizeService(editingService)
      : {
          status: "PENDING",
          problemDescription: "",
          notes: "",
          jobCardNumber: peekNextJobCardNumber(),
          jobCardAt: toDateTimeLocalValue(),
          customerName: "",
          customerMobile: "",
          customerAddress: "",
          registrationNumber: "",
          make: "",
          model: "",
          modelYear: String(new Date().getFullYear()),
          engineNumber: "",
          chassisNumber: "",
          odometerReading: "",
          petrolLevel: 0,
          vehicleId: "",
          customerId: "",
        },
  });

  const { control, register, handleSubmit, reset, setValue, formState } = form;
  const watchedCustomerId = useWatch({ control, name: "customerId" });
  const watchedVehicleId = useWatch({ control, name: "vehicleId" });

  useEffect(() => {
    if (!editingService) {
      setValue("jobCardNumber", peekNextJobCardNumber());
      setValue("jobCardAt", toDateTimeLocalValue());
      return;
    }
    reset(normalizeService(editingService), { keepDefaultValues: false });
    setSelectedCustomerCode(editingService?.customer?.customerCode || "");
    setSelectedVehicleCode(editingService?.vehicle?.vehicleCode || "");
  }, [editingService, reset, setValue]);

  const applyCustomer = (customer: any) => {
    if (!customer) return;
    setValue("customerId", customer.id || "");
    setValue("customerName", customer.name || "");
    setValue("customerMobile", customer.mobile || "");
    setValue("customerAddress", customer.address || "");
    setSelectedCustomerCode(customer.customerCode || "");
  };

  const applyVehicle = (vehicle: any) => {
    if (!vehicle) return;
    setValue("vehicleId", vehicle.id || "");
    setValue(
      "registrationNumber",
      String(vehicle.registrationNumber || "").toUpperCase()
    );
    setValue("make", vehicle.brand || "");
    setValue("model", vehicle.model || "");
    setValue("modelYear", vehicle.year || String(new Date().getFullYear()));
    setValue("engineNumber", vehicle.engineNumber || "");
    setValue("chassisNumber", vehicle.chassisNumber || "");
    setValue("odometerReading", vehicle.mileage || "");
    setSelectedVehicleCode(vehicle.vehicleCode || "");
  };

  const clearLookup = () => {
    setValue("customerId", "");
    setValue("vehicleId", "");
    setSelectedCustomerCode("");
    setSelectedVehicleCode("");
  };

  const mutation = useMutation({
    mutationFn: saveService,
    onSuccess: (updatedService, variables) => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["usersList"] });
      queryClient.invalidateQueries({ queryKey: ["users-for-lookup"] });

      if (editingService?.id) {
        queryClient.invalidateQueries({
          queryKey: ["service", editingService.id],
        });
        addNotification({
          title: "Job card updated",
          message: "Job card saved successfully.",
          category: "service",
        });
        router.push(`/dashboard/admin/services/${editingService.id}`);
        return;
      }

      consumeNextJobCardNumber(variables.data.jobCardNumber);

      const createdService = updatedService?.data ?? updatedService;
      const createdId = createdService?.id;

      if (createdId) {
        addNotification({
          title: "Job card created",
          message: `Job card ${variables.data.jobCardNumber} was created.`,
          category: "service",
        });
        router.push(`/dashboard/admin/services/${createdId}`);
        return;
      }

      alert("Job card created, but the detail page id was not returned.");
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate({ data, editingService });
  };

  const validationMessages = Array.from(
    new Set(getErrorMessages(formState.errors))
  );

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(
    () => Array.from({ length: 40 }, (_, i) => String(currentYear - i)),
    [currentYear]
  );

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {!isEdit && (
          <CustomerVehicleLookup
            selectedCustomerCode={selectedCustomerCode}
            selectedVehicleCode={selectedVehicleCode}
            onClear={clearLookup}
            onSelect={(result) => {
              if (result.type === "customer") {
                applyCustomer(result.customer);
                setValue("vehicleId", "");
                setSelectedVehicleCode("");
                return;
              }
              applyCustomer(result.customer);
              applyVehicle(result.vehicle);
            }}
          />
        )}

        {(watchedCustomerId || watchedVehicleId) && isEdit && (
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Status">
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  value={normalizeJobCardStatus(field.value)}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {JOB_CARD_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

        <section className="space-y-4 rounded-lg border p-4">
          <h3 className="text-base font-semibold">Customer Details</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Customer Name">
              <Input placeholder="Customer name" {...register("customerName")} />
            </Field>
            <Field label="Mobile Number">
              <Input
                placeholder="10-digit mobile"
                {...register("customerMobile")}
              />
            </Field>
          </div>
          <Field label="Address">
            <Textarea
              placeholder="Customer address / location notes"
              {...register("customerAddress")}
            />
          </Field>
        </section>

        <section className="space-y-4 rounded-lg border p-4">
          <h3 className="text-base font-semibold">Vehicle Details</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Job Card No">
              <Input
                {...register("jobCardNumber")}
                readOnly
                className="bg-muted text-foreground/80"
              />
            </Field>
            <Field label="Job Card Date & Time">
              <Input type="datetime-local" {...register("jobCardAt")} />
            </Field>
            <Field label="Registration Number">
              <Controller
                control={control}
                name="registrationNumber"
                render={({ field }) => (
                  <Input
                    placeholder="TN 38 AB 1234"
                    value={field.value || ""}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    style={{ textTransform: "uppercase" }}
                    onChange={(event) =>
                      field.onChange(event.target.value.toUpperCase())
                    }
                  />
                )}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Make">
              <Controller
                control={control}
                name="make"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select make" />
                    </SelectTrigger>
                    <SelectContent className="bg-card max-h-72">
                      {INDIAN_BIKE_MAKERS.map((maker) => (
                        <SelectItem key={maker} value={maker}>
                          {maker}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Model">
              <Input placeholder="e.g. Splendor Plus" {...register("model")} />
            </Field>
            <Field label="Model Year">
              <Controller
                control={control}
                name="modelYear"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="bg-card max-h-72">
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Engine No">
              <Input {...register("engineNumber")} />
            </Field>
            <Field label="Chassis No">
              <Input {...register("chassisNumber")} />
            </Field>
            <Field label="Odometer Reading">
              <Input
                placeholder="e.g. 24500"
                {...register("odometerReading")}
              />
            </Field>
          </div>

          <Controller
            control={control}
            name="petrolLevel"
            render={({ field }) => (
              <PetrolLevelBar
                value={field.value}
                onChange={(next) => field.onChange(next)}
              />
            )}
          />
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Problem Description">
            <Textarea
              placeholder="What is the customer reporting?"
              {...register("problemDescription")}
            />
          </Field>
          <Field label="Notes">
            <Textarea
              placeholder="Internal notes for the workshop"
              {...register("notes")}
            />
          </Field>
        </div>

        {mutation.error && (
          <p className="text-sm text-red-600">
            {(mutation.error as Error).message}
          </p>
        )}

        {validationMessages.length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p className="font-medium">Please fix these fields:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {validationMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending
            ? "Saving..."
            : isEdit
              ? "Save Job Card"
              : "Create Job Card"}
        </Button>
      </form>
    </Card>
  );
}
