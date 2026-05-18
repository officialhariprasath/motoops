"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import ListControls from "@/components/dashboard/ListControls";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useGaragePageSize } from "@/lib/list-settings";

async function apiGet(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Request failed");
  return json?.data ?? json ?? [];
}

async function createRequest(data: any) {
  const res = await fetch("/api/procurement/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to request item");
  return json;
}

export default function MechanicProcurementPage() {
  const queryClient = useQueryClient();
  const pageSize = useGaragePageSize();
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryPage, setInventoryPage] = useState(1);
  const [requestDrafts, setRequestDrafts] = useState<
    Record<string, { quantity: number; reason: string }>
  >({});

  const itemsQuery = useQuery({
    queryKey: ["mechanic", "procurement", "items"],
    queryFn: () => apiGet("/api/procurement/items"),
  });

  const requestsQuery = useQuery({
    queryKey: ["mechanic", "procurement", "requests"],
    queryFn: () => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return apiGet(`/api/procurement/requests?mechanicId=${user.id}`);
    },
  });

  const mutation = useMutation({
    mutationFn: createRequest,
    onSuccess: () => {
      setRequestDrafts({});
      queryClient.invalidateQueries({
        queryKey: ["mechanic", "procurement"],
      });
    },
  });

  const items = itemsQuery.data ?? [];
  const requests = requestsQuery.data ?? [];
  const heldItems = requests.filter((request: any) => request.status === "issued");

  const filteredItems = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item: any) =>
      [item.name, item.type, item.sku, item.code, item.location, item.notes]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [items, inventorySearch]);

  const inventoryTotalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = filteredItems.slice(
    (inventoryPage - 1) * pageSize,
    inventoryPage * pageSize
  );

  useEffect(() => {
    setInventoryPage((current) => Math.min(current, inventoryTotalPages));
  }, [inventoryTotalPages]);

  if (itemsQuery.isLoading || requestsQuery.isLoading) {
    return <p>Loading procurement...</p>;
  }

  if (itemsQuery.error instanceof Error || requestsQuery.error instanceof Error) {
    return (
      <p className="text-sm text-red-600">
        {itemsQuery.error instanceof Error
          ? itemsQuery.error.message
          : requestsQuery.error instanceof Error
            ? requestsQuery.error.message
            : "Failed to load procurement"}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tool & Parts Requests</h1>
        <p className="text-sm text-gray-500">
          Request tools or parts needed for current work and view what you have
          taken.
        </p>
      </div>

      {mutation.error instanceof Error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {mutation.error.message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold">What I Have Right Now</h2>
            <div className="mt-4 space-y-3">
              {heldItems.length === 0 && (
                <p className="text-sm text-gray-500">No tools or parts issued.</p>
              )}
              {heldItems.map((request: any) => (
                <div key={request.id} className="rounded border p-4">
                  <p className="font-medium">{request.item?.name}</p>
                  <p className="text-sm text-gray-500">
                    Quantity {request.quantity} - {request.item?.type}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold">My Requests</h2>
            <div className="mt-4 space-y-3">
              {requests.length === 0 && (
                <p className="text-sm text-gray-500">No requests yet.</p>
              )}
              {requests.map((request: any) => (
                <div key={request.id} className="rounded border p-4">
                  <p className="font-medium">{request.item?.name}</p>
                  <p className="text-sm text-gray-500">
                    Qty {request.quantity} - Status: {request.status}
                  </p>
                  <p className="text-sm text-gray-600">
                    {request.reason || "No reason provided"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <h2 className="font-semibold">Available Garage Inventory</h2>
            <p className="text-sm text-gray-500">
              Search tools or parts and request only what you need for the job.
            </p>
          </div>

          <ListControls
            search={inventorySearch}
            onSearchChange={setInventorySearch}
            searchPlaceholder="Search inventory by name, type, SKU, location, or notes"
            page={inventoryPage}
            totalPages={inventoryTotalPages}
            totalItems={filteredItems.length}
            pageSize={pageSize}
            onPageChange={setInventoryPage}
          />

          <div className="grid gap-4">
            {paginatedItems.map((item: any) => {
              const draft = requestDrafts[item.id] ?? {
                quantity: 1,
                reason: "",
              };

              return (
                <div key={item.id} className="rounded border p-4">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm capitalize text-gray-500">
                        {item.type} - Available {item.availableQuantity} of{" "}
                        {item.totalQuantity}
                      </p>
                      <p className="text-sm text-gray-500">
                        Location: {item.location || "N/A"}
                      </p>
                    </div>
                    <div className="w-full space-y-2 md:w-80">
                      <input
                        type="number"
                        min={1}
                        max={item.availableQuantity}
                        value={draft.quantity}
                        onChange={(event) =>
                          setRequestDrafts((current) => ({
                            ...current,
                            [item.id]: {
                              ...draft,
                              quantity: Number(event.target.value),
                            },
                          }))
                        }
                        className="w-full rounded-md border px-3 py-2"
                      />
                      <Textarea
                        placeholder="Why do you need this?"
                        value={draft.reason}
                        onChange={(event) =>
                          setRequestDrafts((current) => ({
                            ...current,
                            [item.id]: {
                              ...draft,
                              reason: event.target.value,
                            },
                          }))
                        }
                      />
                      <Button
                        type="button"
                        disabled={
                          mutation.isPending ||
                          item.availableQuantity <= 0 ||
                          draft.quantity <= 0
                        }
                        onClick={() => {
                          const user = JSON.parse(
                            localStorage.getItem("user") || "{}"
                          );
                          mutation.mutate({
                            itemId: item.id,
                            mechanicId: user.id,
                            quantity: draft.quantity,
                            reason: draft.reason,
                          });
                        }}
                      >
                        Request Item
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {paginatedItems.length === 0 && (
              <div className="rounded border p-6 text-center text-sm text-gray-500">
                No inventory items found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
