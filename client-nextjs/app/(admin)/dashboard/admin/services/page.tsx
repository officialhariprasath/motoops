"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useGaragePageSize } from "@/lib/list-settings";
import ListControls from "@/components/dashboard/ListControls";
import JobCardSummaryCard from "@/components/dashboard/JobCardSummaryCard";
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

const getServices = async () => {
  const res = await fetch("/api/services");
  if (!res.ok) throw new Error("Failed");
  return res.json();
};

export default function ServicesPage() {
  const pageSize = useGaragePageSize();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const servicesQuery = useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  });

  const services = servicesQuery.data?.data ?? [];
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
            <SelectContent className="bg-white">
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
          <JobCardSummaryCard key={service.id} service={service} />
        ))}

        {paginatedServices.length === 0 && (
          <div className="col-span-full rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
            No job cards found.
          </div>
        )}
      </div>
    </div>
  );
}
