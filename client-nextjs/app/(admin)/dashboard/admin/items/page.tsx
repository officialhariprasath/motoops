"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/job-card-items";

type CatalogItem = {
  id: string;
  name: string;
  rate: number;
  isActive?: boolean;
};

async function apiGetItems() {
  const res = await fetch("/api/catalog/items?all=true", { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to load items");
  return (json.data ?? json) as CatalogItem[];
}

async function apiCreateItem(body: { name: string; rate: number }) {
  const res = await fetch("/api/catalog/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to create item");
  return json;
}

async function apiUpdateItem(
  id: string,
  body: { name?: string; rate?: number }
) {
  const res = await fetch(`/api/catalog/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to update item");
  return json;
}

async function apiDeleteItem(id: string) {
  const res = await fetch(`/api/catalog/items/${id}`, { method: "DELETE" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || "Failed to remove item");
  return json;
}

export default function ItemsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [name, setName] = useState("");
  const [rate, setRate] = useState("0");
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const itemsQuery = useQuery({
    queryKey: ["catalog-items"],
    queryFn: apiGetItems,
  });

  const items = useMemo(
    () => (itemsQuery.data ?? []).filter((item) => item.isActive !== false),
    [itemsQuery.data]
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        rate: Number(rate || 0),
      };
      if (!payload.name) throw new Error("Item description is required");
      if (Number.isNaN(payload.rate) || payload.rate < 0) {
        throw new Error("Valid rate is required");
      }
      if (editing) return apiUpdateItem(editing.id, payload);
      return apiCreateItem(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-items"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-items-active"] });
      setOpen(false);
      setEditing(null);
      setName("");
      setRate("0");
      setError("");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to save item");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: apiDeleteItem,
    onSuccess: () => {
      setDeleteError("");
      queryClient.invalidateQueries({ queryKey: ["catalog-items"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-items-active"] });
    },
    onError: (err) => {
      setDeleteError(err instanceof Error ? err.message : "Failed to remove item");
    },
  });

  const openCreate = () => {
    setEditing(null);
    setName("");
    setRate("0");
    setError("");
    setOpen(true);
  };

  const openEdit = (item: CatalogItem) => {
    setEditing(item);
    setName(item.name);
    setRate(String(item.rate));
    setError("");
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-end gap-3">
        <Button type="button" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead className="bg-slate-50">
                <tr className="border-b text-left text-sm">
                  <th className="p-3">S.No</th>
                  <th className="p-3">Item Description</th>
                  <th className="p-3">Rate</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="border-b text-sm">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3 font-medium">{item.name}</td>
                    <td className="p-3">{formatMoney(Number(item.rate))}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={deleteMutation.isPending}
                          title="Remove item"
                          onClick={() => {
                            if (confirm(`Remove "${item.name}"?`)) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-sm text-gray-500">
                      {itemsQuery.isLoading ? "Loading items..." : "No items yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Item" : "Add Item"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Item Description
              </label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Engine Oil (1L)"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Rate</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? "Saving..." : editing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
