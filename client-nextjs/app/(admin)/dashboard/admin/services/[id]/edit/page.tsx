// File: app/dashboard/admin/services/[id]/edit/page.tsx

"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import ServiceForm from "../../ServiceForm";

async function getService(id: string) {
  const res = await fetch(`/api/services/${id}`, {
    cache: "no-store",
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(
      json?.message || "Failed to load service"
    );
  }

  const rows = json.data ?? json;

  // API returning tasks[]
  if (Array.isArray(rows) && rows.length > 0) {
    return {
      ...rows[0].service,
      tasks: rows,
    };
  }

  return rows;
}

export default function EditServicePage() {
  const params = useParams();
  const id = params.id as string;

  const serviceQuery = useQuery({
    queryKey: ["service", id],
    queryFn: () => getService(id),
    enabled: !!id,
  });

  if (serviceQuery.isLoading) {
    return <p>Loading service...</p>;
  }

  if (serviceQuery.isError) {
    return <p className="text-red-600">Failed to load service.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Service</h1>

      <ServiceForm key={serviceQuery.data.id} editingService={serviceQuery.data} />
    </div>
  );
}