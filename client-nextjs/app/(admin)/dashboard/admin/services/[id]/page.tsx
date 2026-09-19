"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  nextServiceOdometer?: string;
  nextServiceAt?: string;
  futureWorksNotes?: string;
  includeNextServiceOnBill?: boolean;
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
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium text-foreground whitespace-pre-wrap">
        {value === 0 || value ? String(value) : "-"}
      </p>
    </div>
  );
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export default function ServiceViewPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const id = params.id as string;
  const isMechanicView = pathname.includes("/dashboard/mechanic");
  const queryClient = useQueryClient();
  const [saveError, setSaveError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [assignError, setAssignError] = useState("");
  const [billError, setBillError] = useState("");
  const [showBillModal, setShowBillModal] = useState(false);
  const [nextOdometer, setNextOdometer] = useState("");
  const [nextServiceDate, setNextServiceDate] = useState("");
  const [futureWorks, setFutureWorks] = useState("");
  const [includeOnBill, setIncludeOnBill] = useState(true);

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
    mutationFn: async (payload: {
      nextServiceOdometer: string;
      nextServiceAt?: string;
      futureWorksNotes: string;
      includeNextServiceOnBill: boolean;
    }) => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user.id) throw new Error("Please log in again");
      return createInvoiceDoc({
        serviceId: id,
        generatedById: user.id,
        documentType: "BILL",
        completeJob: true,
        nextServiceOdometer: payload.nextServiceOdometer || undefined,
        nextServiceAt: payload.nextServiceAt || undefined,
        futureWorksNotes: payload.futureWorksNotes || undefined,
        includeNextServiceOnBill: payload.includeNextServiceOnBill,
      });
    },
    onSuccess: (invoice) => {
      setBillError("");
      setShowBillModal(false);
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

  const openBillModal = () => {
    setBillError("");
    setNextOdometer(serviceQuery.data?.nextServiceOdometer || "");
    const rawDate = serviceQuery.data?.nextServiceAt;
    setNextServiceDate(
      rawDate ? String(rawDate).slice(0, 10) : ""
    );
    setFutureWorks(serviceQuery.data?.futureWorksNotes || "");
    setIncludeOnBill(
      serviceQuery.data?.includeNextServiceOnBill !== false
    );
    setShowBillModal(true);
  };

  const submitBill = () => {
    setBillError("");
    billMutation.mutate({
      nextServiceOdometer: nextOdometer.trim(),
      nextServiceAt: nextServiceDate || undefined,
      futureWorksNotes: futureWorks.trim(),
      includeNextServiceOnBill: includeOnBill,
    } as any);
  };

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
    // Single assignee: click selected again to clear, otherwise replace
    if (assignedIds.includes(mechanicId)) {
      assignMutation.mutate([]);
      return;
    }
    assignMutation.mutate([mechanicId]);
  };

  return (
    <div className="space-y-6">
      {!isMechanicView && (
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
              onClick={openBillModal}
            >
              Generate Bill
            </Button>
            <Link href={`/dashboard/admin/services/${id}/edit`}>
              <Button variant="outline">Edit Job Card</Button>
            </Link>
          </div>
        </div>
      )}

      {!isMechanicView && showBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-xl bg-card p-6 shadow-xl">
            <div>
              <h2 className="text-lg font-semibold">Generate Bill</h2>
              <p className="text-sm text-muted-foreground">
                Optional next-service details are saved on the vehicle. Check
                the box to print them on this invoice.
              </p>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">
                Next service odometer
              </span>
              <Input
                value={nextOdometer}
                onChange={(e) => setNextOdometer(e.target.value)}
                placeholder="e.g. 45200"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Next service date</span>
              <Input
                type="date"
                value={nextServiceDate}
                onChange={(e) => setNextServiceDate(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Future works</span>
              <textarea
                className="min-h-[80px] w-full rounded-lg border px-2.5 py-2 text-sm"
                value={futureWorks}
                onChange={(e) => setFutureWorks(e.target.value)}
                placeholder="Recommended follow-up work..."
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeOnBill}
                onChange={(e) => setIncludeOnBill(e.target.checked)}
              />
              Include these details on the bill
            </label>
            {billError && <p className="text-sm text-red-600">{billError}</p>}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={billMutation.isPending}
                onClick={() => setShowBillModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={billMutation.isPending}
                onClick={submitBill}
              >
                {billMutation.isPending ? "Generating..." : "Create bill"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!isMechanicView && (estimateDoc || billDoc) && (
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
              Bill {billDoc.invoiceNumber || ""} Â· {billDoc.paymentStatus}
            </Link>
          )}
        </div>
      )}

      <Card className="space-y-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Job Card No
            </p>
            <p className="text-xl font-semibold">
              {service?.jobCardNumber || "-"}
            </p>
          </div>

          <div className="w-full max-w-xs space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Work Status
            </label>
            {isMechanicView ? (
              <div className="space-y-2">
                <p className="rounded-md border bg-muted px-3 py-2 text-sm font-medium">
                  {formatJobCardStatus(service?.status)}
                </p>
                {normalizeJobCardStatus(service?.status) === "ASSIGNED" && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate("IN_PROGRESS")}
                  >
                    {statusMutation.isPending ? "Starting..." : "Start work"}
                  </Button>
                )}
                {statusError && (
                  <p className="text-xs text-red-600">{statusError}</p>
                )}
              </div>
            ) : (
              <>
                <Select
                  value={normalizeJobCardStatus(service?.status)}
                  onValueChange={(value) => statusMutation.mutate(value)}
                  disabled={statusMutation.isPending}
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
                {statusMutation.isPending && (
                  <p className="text-xs text-muted-foreground">Updating status...</p>
                )}
                {statusError && (
                  <p className="text-xs text-red-600">{statusError}</p>
                )}
              </>
            )}
          </div>
        </div>

        {!isMechanicView && (
          <section className="space-y-3">
            <h2 className="text-base font-semibold border-b pb-2">
              Assign Workforce
            </h2>
            <p className="text-sm text-muted-foreground">
              Select one mechanic for this job card.
            </p>
            {mechanicsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading mechanics...</p>
            ) : mechanics.length === 0 ? (
              <p className="text-sm text-muted-foreground">
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
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground/80"
                      }`}
                    >
                      {mechanic.name}
                      {mechanic.designation
                        ? ` Â· ${mechanic.designation}`
                        : ""}
                    </button>
                  );
                })}
              </div>
            )}
            {assignError && (
              <p className="text-xs text-red-600">{assignError}</p>
            )}
          </section>
        )}

        {isMechanicView && assignedIds.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-base font-semibold border-b pb-2">
              Assigned workforce
            </h2>
            <p className="text-sm text-foreground/80">
              {(service?.assignedMechanics ?? [])
                .map((m: any) => m.name)
                .filter(Boolean)
                .join(", ") || "-"}
            </p>
          </section>
        )}

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
          <p className="text-sm text-muted-foreground">Saving items...</p>
        )}
      </Card>
    </div>
  );
}
