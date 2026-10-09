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
import { fetchCatalogItems } from "@/lib/query-fetchers";
import { queryKeys, STALE } from "@/lib/query-keys";

type ItemKind = "GENERAL" | "PROFIT";

type CatalogItem = {
  id: string;
  name: string;
  rate: number;
  itemKind?: ItemKind;
  isActive?: boolean;
};

function apiErrorMessage(json: any, fallback: string) {
  const raw = json?.message;
  if (Array.isArray(raw) && raw.length) return String(raw[0]);
  if (typeof raw === "string" && raw.trim()) return raw;
  return fallback;
}

async function apiCreateItem(body: {
  name: string;
  rate: number;
  itemKind: ItemKind;
}) {
  const res = await fetch("/api/catalog/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(apiErrorMessage(json, "Failed to create item"));
  return json;
}

async function apiUpdateItem(
  id: string,
  body: { name?: string; rate?: number; itemKind?: ItemKind }
) {
  const res = await fetch(`/api/catalog/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(apiErrorMessage(json, "Failed to update item"));
  return json;
}

async function apiDeleteItem(id: string) {
  const res = await fetch(`/api/catalog/items/${id}`, { method: "DELETE" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(apiErrorMessage(json, "Failed to remove item"));
  return json;
}

export default function ItemsPage() {
  const queryClient = useQueryClient();
  const [kindTab, setKindTab] = useState<ItemKind>("GENERAL");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [name, setName] = useState("");
  const [rate, setRate] = useState("0");
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const itemsQuery = useQuery({
    queryKey: queryKeys.catalogItems,
    queryFn: () => fetchCatalogItems(true),
    staleTime: STALE.referenceMs,
  });

  const items = useMemo(() => {
    return ((itemsQuery.data ?? []) as CatalogItem[])
      .filter((item) => item.isActive !== false)
      .filter((item) => {
        const kind = item.itemKind === "PROFIT" ? "PROFIT" : "GENERAL";
        return kind === kindTab;
      });
  }, [itemsQuery.data, kindTab]);

  const invalidateCatalog = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.catalogItems });
    queryClient.invalidateQueries({ queryKey: queryKeys.catalogItemsActive });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        rate: Number(rate || 0),
        itemKind: kindTab,
      };
      if (!payload.name) throw new Error("Item description is required");
      if (Number.isNaN(payload.rate) || payload.rate < 0) {
        throw new Error("Valid rate is required");
      }
      if (editing) {
        return apiUpdateItem(editing.id, {
          name: payload.name,
          rate: payload.rate,
          itemKind: kindTab,
        });
      }
      return apiCreateItem(payload);
    },
    onSuccess: () => {
      invalidateCatalog();
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
      invalidateCatalog();
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

  const tabLabel =
    kindTab === "PROFIT" ? "Profit items" : "General items";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border p-1">
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              kindTab === "GENERAL"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setKindTab("GENERAL")}
          >
            General items
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              kindTab === "PROFIT"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setKindTab("PROFIT")}
          >
            Profit items
          </button>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add {kindTab === "PROFIT" ? "Profit" : "General"} Item
        </Button>
      </div>

      {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead className="bg-muted">
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
                    <td
                      colSpan={4}
                      className="p-8 text-center text-sm text-muted-foreground"
                    >
                      {itemsQuery.isLoading
                        ? "Loading items..."
                        : `No ${tabLabel.toLowerCase()} yet.`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${tabLabel.slice(0, -1)}` : `Add ${tabLabel.slice(0, -1)}`}
            </DialogTitle>
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
            <p className="text-xs text-muted-foreground">
              Saved under {tabLabel}. Names must be unique across General and
              Profit.
            </p>
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
