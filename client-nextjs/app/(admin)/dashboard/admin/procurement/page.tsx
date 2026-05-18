"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

async function apiGet(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Request failed");
  return json?.data ?? json ?? [];
}

async function createItem(data: any) {
  const res = await fetch("/api/procurement/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to add item");
  return json;
}

async function updateRequestStatus({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const res = await fetch(`/api/procurement/requests/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to update request");
  return json;
}

export default function AdminProcurementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    type: "tool",
    sku: "",
    totalQuantity: 1,
    location: "",
    notes: "",
  });

  const itemsQuery = useQuery({
    queryKey: ["procurement", "items"],
    queryFn: () => apiGet("/api/procurement/items"),
  });
  const requestsQuery = useQuery({
    queryKey: ["procurement", "requests"],
    queryFn: () => apiGet("/api/procurement/requests"),
  });

  const createMutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      setForm({
        name: "",
        type: "tool",
        sku: "",
        totalQuantity: 1,
        location: "",
        notes: "",
      });
      queryClient.invalidateQueries({ queryKey: ["procurement"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: updateRequestStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement"] });
    },
  });

  const items = itemsQuery.data ?? [];
  const filteredItems = items.filter((item: any) => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [
      item.name,
      item.sku,
      item.type,
      item.location,
      item.notes,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });
  const requests = requestsQuery.data ?? [];
  const issued = requests.filter((request: any) => request.status === "issued");
  const pending = requests.filter((request: any) => request.status === "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Garage Procurement</h1>
        <p className="text-sm text-gray-500">
          Track parts/tools inventory, mechanic requests, and who currently has
          each item.
        </p>
      </div>

      {(createMutation.error || statusMutation.error) && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {createMutation.error instanceof Error
            ? createMutation.error.message
            : statusMutation.error instanceof Error
              ? statusMutation.error.message
              : "Request failed"}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="font-semibold">Add Part / Tool</h2>
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
            <select
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({ ...current, type: event.target.value }))
              }
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="tool">Tool</option>
              <option value="part">Part</option>
            </select>
            <Input
              placeholder="SKU / code"
              value={form.sku}
              onChange={(event) =>
                setForm((current) => ({ ...current, sku: event.target.value }))
              }
            />
            <Input
              type="number"
              min={0}
              placeholder="Total quantity"
              value={form.totalQuantity}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  totalQuantity: Number(event.target.value),
                }))
              }
            />
            <Input
              placeholder="Location"
              value={form.location}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  location: event.target.value,
                }))
              }
            />
            <Textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
            <Button
              type="button"
              disabled={createMutation.isPending || !form.name.trim()}
              onClick={() => createMutation.mutate(form)}
            >
              Add Inventory Item
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Current Inventory</h2>
                <p className="text-sm text-gray-500">
                  {filteredItems.length} of {items.length} item(s)
                </p>
              </div>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search item, SKU, type, location..."
                className="w-full md:w-80"
              />
            </div>

            <div className="mt-4 max-h-[520px] overflow-auto rounded border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <th className="p-3">Item</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Available</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item: any) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-3">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.sku}</p>
                      </td>
                      <td className="p-3 capitalize">{item.type}</td>
                      <td className="p-3">{item.availableQuantity}</td>
                      <td className="p-3">{item.totalQuantity}</td>
                      <td className="p-3">{item.location || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredItems.length === 0 && (
                <div className="p-6 text-sm text-gray-500">
                  No inventory items matched your search.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold">Pending Mechanic Requests</h2>
            <div className="mt-4 space-y-3">
              {pending.length === 0 && (
                <p className="text-sm text-gray-500">No pending requests.</p>
              )}
              {pending.map((request: any) => (
                <div key={request.id} className="rounded border p-4">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-medium">{request.item?.name}</p>
                      <p className="text-sm text-gray-500">
                        {request.mechanic?.name} requested {request.quantity}
                      </p>
                      <p className="text-sm text-gray-600">
                        {request.reason || "No reason provided"}
                      </p>
                    </div>
                    <div className="space-x-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          statusMutation.mutate({
                            id: request.id,
                            status: "issued",
                          })
                        }
                      >
                        Issue
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          statusMutation.mutate({
                            id: request.id,
                            status: "rejected",
                          })
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold">Currently Held By Mechanics</h2>
            <div className="mt-4 space-y-3">
              {issued.length === 0 && (
                <p className="text-sm text-gray-500">No issued items.</p>
              )}
              {issued.map((request: any) => (
                <div
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded border p-4"
                >
                  <div>
                    <p className="font-medium">{request.item?.name}</p>
                    <p className="text-sm text-gray-500">
                      Held by {request.mechanic?.name} - Qty {request.quantity}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      statusMutation.mutate({
                        id: request.id,
                        status: "returned",
                      })
                    }
                  >
                    Mark Returned
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
