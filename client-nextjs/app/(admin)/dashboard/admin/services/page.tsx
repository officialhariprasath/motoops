"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useGaragePageSize } from "@/lib/list-settings";
import ListControls from "@/components/dashboard/ListControls";
import JobCardSummaryCard from "@/components/dashboard/JobCardSummaryCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  JOB_CARD_STATUSES,
  normalizeJobCardStatus,
} from "@/lib/job-card-status";

const ACTIVE_JOB_STATUSES = new Set(["PENDING", "ASSIGNED", "IN_PROGRESS"]);

const getServices = async () => {
  const res = await fetch("/api/services");
  if (!res.ok) throw new Error("Failed");
  return res.json();
};

const getMechanics = async () => {
  const res = await fetch("/api/user", { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to load workforce");
  const users = (json.data ?? json ?? []) as any[];
  return users.filter((u) => String(u.role || "").toLowerCase() === "mechanic");
};

async function saveAssignees(serviceId: string, assignedMechanicIds: string[]) {
  const res = await fetch(`/api/services/${serviceId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assignedMechanicIds }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to assign");
  return json.data ?? json;
}

export default function ServicesPage() {
  const pageSize = useGaragePageSize();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [assignServiceId, setAssignServiceId] = useState<string | null>(null);
  const [selectedMechanicId, setSelectedMechanicId] = useState<string>("");
  const [assignError, setAssignError] = useState("");

  const servicesQuery = useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  });
  const mechanicsQuery = useQuery({
    queryKey: ["mechanics"],
    queryFn: getMechanics,
  });

  const services = servicesQuery.data?.data ?? [];
  const mechanics = mechanicsQuery.data ?? [];

  const activeJobCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const service of services) {
      const status = normalizeJobCardStatus(service.status);
      if (!ACTIVE_JOB_STATUSES.has(status)) continue;
      for (const mechanic of service.assignedMechanics ?? []) {
        counts[mechanic.id] = (counts[mechanic.id] || 0) + 1;
      }
    }
    return counts;
  }, [services]);

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return services.filter((service: any) => {
      if (
        statusFilter !== "ALL" &&
        normalizeJobCardStatus(service.status) !== statusFilter
      ) {
        return false;
      }

      if (!query) return true;

      return [
        service.jobCardNumber,
        service.status,
        formatStatusSearch(service.status),
        service.problemDescription,
        service.notes,
        service.vehicle?.registrationNumber,
        service.vehicle?.brand,
        service.vehicle?.model,
        service.vehicle?.vehicleCode,
        service.customer?.name,
        service.customer?.mobile,
        service.customer?.customerCode,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [services, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / pageSize));
  const paginatedServices = filteredServices.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const assignMutation = useMutation({
    mutationFn: () =>
      saveAssignees(assignServiceId!, [selectedMechanicId]),
    onSuccess: () => {
      setAssignError("");
      setAssignServiceId(null);
      setSelectedMechanicId("");
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (error: Error) => setAssignError(error.message),
  });

  const openAssign = (service: any) => {
    setAssignError("");
    setAssignServiceId(service.id);
    setSelectedMechanicId(service.assignedMechanics?.[0]?.id || "");
  };

  if (servicesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        Loading job cards...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ListControls
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by job card no, vehicle, customer, status..."
        page={page}
        totalPages={totalPages}
        totalItems={filteredServices.length}
        pageSize={pageSize}
        onPageChange={setPage}
        filters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="ALL">All Statuses</SelectItem>
              {JOB_CARD_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {paginatedServices.map((service: any) => (
          <JobCardSummaryCard
            key={service.id}
            service={service}
            showAssignButton
            onAssignClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              openAssign(service);
            }}
          />
        ))}

        {paginatedServices.length === 0 && (
          <div className="col-span-full rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No job cards found.
          </div>
        )}
      </div>

      {assignServiceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-xl bg-card p-6 shadow-xl">
            <div>
              <h2 className="text-lg font-semibold">Assign workforce</h2>
              <p className="text-sm text-muted-foreground">
                Select one mechanic for this job card.
              </p>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {mechanics.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No mechanics found. Add employees from Workforce first.
                </p>
              ) : (
                mechanics.map((mechanic: any) => {
                  const selected = selectedMechanicId === mechanic.id;
                  const activeJobs = activeJobCounts[mechanic.id] || 0;
                  return (
                    <button
                      key={mechanic.id}
                      type="button"
                      onClick={() => setSelectedMechanicId(mechanic.id)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground"
                      }`}
                    >
                      <span className="font-medium">{mechanic.name}</span>
                      <span
                        className={
                          selected ? "text-primary-foreground/80" : "text-muted-foreground"
                        }
                      >
                        Active jobs: {activeJobs}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            {assignError && (
              <p className="text-sm text-red-600">{assignError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={assignMutation.isPending}
                onClick={() => {
                  setAssignServiceId(null);
                  setSelectedMechanicId("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={assignMutation.isPending || !selectedMechanicId}
                onClick={() => assignMutation.mutate()}
              >
                {assignMutation.isPending ? "Saving..." : "Save assignment"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatStatusSearch(status?: string) {
  const normalized = normalizeJobCardStatus(status);
  if (normalized === "PENDING") return "unassigned";
  return normalized.replace(/_/g, " ").toLowerCase();
}
