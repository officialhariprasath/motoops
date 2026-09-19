"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import JobCardItemsSection from "../component/JobCardItemsSection";
import type { JobCardLineItem } from "@/lib/job-card-items";
import { addNotification } from "@/lib/notifications";
import {
  JOB_CARD_STATUSES,
  formatJobCardStatus,
  normalizeJobCardStatus,
} from "@/lib/job-card-status";

const getService = async (id: string) => {
  const res = await fetch(`/api/services/${id}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to load job card");
  return json.data ?? json;
};

async function getMechanics() {
  const res = await fetch("/api/user", { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to load workforce");
  const users = (json.data ?? json ?? []) as any[];
  return users.filter((u) => String(u.role || "").toLowerCase() === "mechanic");
}

async function getServiceInvoices(serviceId: string) {
  const res = await fetch(`/api/invoices?serviceId=${serviceId}`, {
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to load invoices");
  return (json.data ?? json ?? []) as any[];
}

async function saveLineItems(id: string, lineItems: JobCardLineItem[]) {
  const res = await fetch(`/api/services/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lineItems }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to save items");
  return json.data ?? json;
}

async function updateStatus(id: string, status: string) {
  const res = await fetch(`/api/services/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to update status");
  return json.data ?? json;
}

async function saveAssignees(id: string, assignedMechanicIds: string[]) {
  const res = await fetch(`/api/services/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assignedMechanicIds }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to assign workforce");
  return json.data ?? json;
}

async function createInvoiceDoc(body: {
  serviceId: string;
  generatedById: string;
  documentType: "ESTIMATE" | "BILL";
  completeJob?: boolean;
}) {
  const res = await fetch("/api/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to create document");
  return json.data ?? json;
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-900 whitespace-pre-wrap">
        {value === 0 || value ? String(value) : "—"}
      </p>
    </div>
  );
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export default function ServiceViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [saveError, setSaveError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [assignError, setAssignError] = useState("");
  const [billError, setBillError] = useState("");

  const serviceQuery = useQuery({
    queryKey: ["service", id],
    queryFn: () => getService(id),
    enabled: !!id,
  });

  const mechanicsQuery = useQuery({
    queryKey: ["mechanics"],
    queryFn: getMechanics,
  });

  const invoicesQuery = useQuery({
    queryKey: ["invoices", "service", id],
    queryFn: () => getServiceInvoices(id),
    enabled: !!id,
  });

  const items = useMemo(
    () => (serviceQuery.data?.lineItems ?? []) as JobCardLineItem[],
    [serviceQuery.data]
  );

  const estimateDoc = (invoicesQuery.data ?? []).find(
    (inv) => inv.documentType === "ESTIMATE"
  );
  const billDoc = (invoicesQuery.data ?? []).find(
    (inv) => inv.documentType === "BILL"
  );

  const assignedIds = useMemo(
    () =>
      (serviceQuery.data?.assignedMechanics ?? []).map((m: any) => m.id) as string[],
    [serviceQuery.data]
  );

  const saveMutation = useMutation({
    mutationFn: (lineItems: JobCardLineItem[]) => saveLineItems(id, lineItems),
    onSuccess: () => {
      setSaveError("");
      queryClient.invalidateQueries({ queryKey: ["service", id] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      addNotification({
        title: "Items updated",
        message: "Job card items saved successfully.",
        category: "service",
      });
    },
    onError: (error) => {
      setSaveError(error instanceof Error ? error.message : "Failed to save items");
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateStatus(id, status),
    onSuccess: (_data, status) => {
      setStatusError("");
      queryClient.invalidateQueries({ queryKey: ["service", id] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      addNotification({
        title: "Status updated",
        message: `Job card moved to ${formatJobCardStatus(status)}.`,
        category: "service",
      });
    },
    onError: (error) => {
      setStatusError(
        error instanceof Error ? error.message : "Failed to update status"
      );
    },
  });

  const assignMutation = useMutation({
    mutationFn: (ids: string[]) => saveAssignees(id, ids),
    onSuccess: () => {
      setAssignError("");
      queryClient.invalidateQueries({ queryKey: ["service", id] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      addNotification({
        title: "Workforce updated",
        message: "Assigned mechanics saved.",
        category: "service",
      });
    },
    onError: (error) => {
      setAssignError(
        error instanceof Error ? error.message : "Failed to assign workforce"
      );
    },
  });

  const billMutation = useMutation({
    mutationFn: async () => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user.id) throw new Error("Please log in again");
      return createInvoiceDoc({
        serviceId: id,
        generatedById: user.id,
        documentType: "BILL",
        completeJob: true,
      });
    },
    onSuccess: (invoice) => {
      setBillError("");
      queryClient.invalidateQueries({ queryKey: ["service", id] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      addNotification({
        title: "Bill generated",
        message: `${invoice.invoiceNumber || "Bill"} created.`,
        category: "invoice",
      });
      router.push(`/dashboard/admin/invoices/${invoice.id}`);
    },
    onError: (error) => {
      setBillError(
        error instanceof Error ? error.message : "Failed to generate bill"
      );
    },
  });

  if (serviceQuery.isLoading) {
    return <p className="p-6">Loading job card...</p>;
  }

  if (serviceQuery.isError) {
    return (
      <p className="p-6 text-red-600">
        {(serviceQuery.error as Error).message || "Failed to load job card."}
      </p>
    );
  }

  const service = serviceQuery.data;
  const petrol = Number(service?.petrolLevel ?? 0);
  const mechanics = mechanicsQuery.data ?? [];

  const toggleMechanic = (mechanicId: string) => {
    const next = assignedIds.includes(mechanicId)
      ? assignedIds.filter((idValue) => idValue !== mechanicId)
      : [...assignedIds, mechanicId];
    assignMutation.mutate(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-end gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/admin/services/${id}/estimate`)
            }
          >
            Generate Estimate
          </Button>
          <Button
            type="button"
            disabled={items.length === 0 || billMutation.isPending}
            onClick={() => billMutation.mutate()}
          >
            {billMutation.isPending ? "Generating..." : "Generate Bill"}
          </Button>
          <Link href={`/dashboard/admin/services/${id}/edit`}>
            <Button variant="outline">Edit Job Card</Button>
          </Link>
        </div>
      </div>

      {billError && <p className="text-sm text-red-600">{billError}</p>}

      {(estimateDoc || billDoc) && (
        <div className="flex flex-wrap gap-2">
          {estimateDoc && (
            <Link
              href={`/dashboard/admin/invoices/${estimateDoc.id}`}
              className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800"
            >
              Estimate {estimateDoc.invoiceNumber || ""}
            </Link>
          )}
          {billDoc && (
            <Link
              href={`/dashboard/admin/invoices/${billDoc.id}`}
              className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800"
            >
              Bill {billDoc.invoiceNumber || ""} · {billDoc.paymentStatus}
            </Link>
          )}
        </div>
      )}

      <Card className="space-y-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Job Card No
            </p>
            <p className="text-xl font-semibold">
              {service?.jobCardNumber || "—"}
            </p>
          </div>

          <div className="w-full max-w-xs space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Work Status
            </label>
            <Select
              value={normalizeJobCardStatus(service?.status)}
              onValueChange={(value) => statusMutation.mutate(value)}
              disabled={statusMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {JOB_CARD_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {statusMutation.isPending && (
              <p className="text-xs text-slate-500">Updating status...</p>
            )}
            {statusError && <p className="text-xs text-red-600">{statusError}</p>}
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-semibold border-b pb-2">
            Assign Workforce
          </h2>
          {mechanicsQuery.isLoading ? (
            <p className="text-sm text-slate-500">Loading mechanics...</p>
          ) : mechanics.length === 0 ? (
            <p className="text-sm text-slate-500">
              No mechanics found. Create users with mechanic role first.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {mechanics.map((mechanic: any) => {
                const selected = assignedIds.includes(mechanic.id);
                return (
                  <button
                    key={mechanic.id}
                    type="button"
                    disabled={assignMutation.isPending}
                    onClick={() => toggleMechanic(mechanic.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      selected
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {mechanic.name}
                    {mechanic.designation ? ` · ${mechanic.designation}` : ""}
                  </button>
                );
              })}
            </div>
          )}
          {assignError && <p className="text-xs text-red-600">{assignError}</p>}
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-semibold border-b pb-2">
            Customer Details
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <DetailItem label="Customer Name" value={service?.customer?.name} />
            <DetailItem label="Mobile Number" value={service?.customer?.mobile} />
            <div className="md:col-span-2">
              <DetailItem label="Address" value={service?.customer?.address} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-semibold border-b pb-2">
            Vehicle Details
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <DetailItem
              label="Job Card Date & Time"
              value={formatDateTime(service?.jobCardAt || service?.serviceDate)}
            />
            <DetailItem
              label="Registration Number"
              value={service?.vehicle?.registrationNumber}
            />
            <DetailItem label="Make" value={service?.vehicle?.brand} />
            <DetailItem label="Model" value={service?.vehicle?.model} />
            <DetailItem label="Model Year" value={service?.vehicle?.year} />
            <DetailItem
              label="Engine No"
              value={service?.vehicle?.engineNumber}
            />
            <DetailItem
              label="Chassis No"
              value={service?.vehicle?.chassisNumber}
            />
            <DetailItem
              label="Odometer Reading"
              value={service?.vehicle?.mileage}
            />
            <DetailItem
              label="Petrol Level"
              value={`${petrol}/10${petrol === 0 ? " (Empty)" : petrol === 10 ? " (Full)" : ""}`}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-semibold border-b pb-2">
            Problem & Notes
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <DetailItem
              label="Problem Description"
              value={service?.problemDescription}
            />
            <DetailItem label="Notes" value={service?.notes} />
          </div>
        </section>

        <JobCardItemsSection
          items={items}
          saving={saveMutation.isPending}
          onChange={(next) => saveMutation.mutate(next)}
        />

        {saveError && <p className="text-sm text-red-600">{saveError}</p>}
        {saveMutation.isPending && (
          <p className="text-sm text-slate-500">Saving items...</p>
        )}
      </Card>
    </div>
  );
}
