// File: admin/services/page.tsx

"use client";

import Link from "next/link";
import { useState } from "react";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useDeleteActionsEnabled } from "@/lib/delete-settings";

const getServices = async () => {
  const res = await fetch("/api/services");

  if (!res.ok) {
    throw new Error("Failed");
  }

  return res.json();
};

const deleteService = async (
  id: string
) => {
  const res = await fetch(
    `/api/services/${id}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    throw new Error("Delete failed");
  }

  return res.json();
};

const generateInvoice = async (serviceId: string) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const res = await fetch("/api/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      serviceId,
      generatedById: user.id,
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || "Failed to generate invoice");
  }

  return json;
};

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const deleteActionsEnabled = useDeleteActionsEnabled();
  const [invoiceMessage, setInvoiceMessage] = useState("");

  const servicesQuery = useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteService,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["services"],
      });
    },
  });

  const invoiceMutation = useMutation({
    mutationFn: generateInvoice,
    onSuccess: () => {
      setInvoiceMessage("Invoice generated successfully.");
    },
    onError: (error) => {
      setInvoiceMessage(
        error instanceof Error ? error.message : "Failed to generate invoice."
      );
    },
  });

  if (servicesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        Loading services...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invoiceMessage && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {invoiceMessage}
        </div>
      )}

    <div className="overflow-hidden rounded-xl border bg-white">
  <table className="w-full">
    <thead className="bg-slate-50">
      <tr className="border-b">
        <th className="p-3 text-left">Vehicle</th>
        <th className="p-3 text-left">Customer</th>
        <th className="p-3 text-left">Status</th>
        <th className="p-3 text-left">Tasks</th>
        <th className="p-3 text-left">Total Cost</th>
        <th className="p-3 text-left">Actions</th>
      </tr>
    </thead>

    <tbody>
      {servicesQuery.data?.data?.map((service: any) => (
        <tr key={service.id} className="border-b hover:bg-slate-50">
          <td className="p-3">
            <div className="font-medium">
              {service.vehicle?.registrationNumber || "No vehicle"}
            </div>

            <div className="text-xs text-muted-foreground">
              {service.vehicle?.brand} {service.vehicle?.model}
            </div>
          </td>

          <td className="p-3">
            <div className="font-medium">
              {service.customer?.name || "No customer"}
            </div>

            <div className="text-xs text-muted-foreground">
              {service.customer?.email}
            </div>
          </td>

          <td className="p-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize">
              {service.status?.replaceAll("_", " ").toLowerCase()}
            </span>
          </td>

          <td className="p-3">
            <div className="text-sm font-medium">
              {service.tasks?.length ?? 0} task(s)
            </div>

            <div className="text-xs text-muted-foreground">
              {service.tasks?.reduce(
                (sum: number, task: any) =>
                  sum + (task.subtasks?.length ?? 0),
                0
              ) ?? 0}{" "}
              subtask(s)
            </div>
          </td>

          <td className="p-3 font-medium">
            {Number(service.totalCost ?? 0).toFixed(2)}
          </td>

          <td className="p-3">
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/admin/services/${service.id}`}>
                <Button size="sm" variant="outline">
                  View
                </Button>
              </Link>

              <Link href={`/dashboard/admin/services/${service.id}/edit`}>
                <Button size="sm">Edit</Button>
              </Link>

              <Button
                size="sm"
                variant="outline"
                disabled={invoiceMutation.isPending}
                onClick={() => invoiceMutation.mutate(service.id)}
              >
                Generate Invoice
              </Button>

              <Button
                size="sm"
                variant="destructive"
                disabled={!deleteActionsEnabled || deleteMutation.isPending}
                title={deleteActionsEnabled ? "Delete service" : "Enable delete actions in Settings first"}
                onClick={() => {
                  if (!deleteActionsEnabled) return;
                  if (confirm("Delete this service?")) {
                    deleteMutation.mutate(service.id);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
    </div>
  );
}


