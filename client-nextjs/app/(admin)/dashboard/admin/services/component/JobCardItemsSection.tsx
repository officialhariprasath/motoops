"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  calcLineAmounts,
  calcLineItemsTotal,
  formatMoney,
  type JobCardLineItem,
} from "@/lib/job-card-items";

type CatalogItem = {
  id: string;
  name: string;
  rate: number;
};

type Props = {
  items: JobCardLineItem[];
  onChange: (items: JobCardLineItem[]) => void;
  readOnly?: boolean;
  saving?: boolean;
};

async function getCatalogItems() {
  const res = await fetch("/api/catalog/items", { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to load catalog");
  return (json.data ?? json) as CatalogItem[];
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export default function JobCardItemsSection({
  items,
  onChange,
  readOnly = false,
  saving = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState("0");
  const [quantity, setQuantity] = useState("1");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState("");

  const catalogQuery = useQuery({
    queryKey: ["catalog-items-active"],
    queryFn: getCatalogItems,
    enabled: !readOnly,
  });

  const catalog = catalogQuery.data ?? [];
  const total = useMemo(() => calcLineItemsTotal(items), [items]);

  const lineAmount = useMemo(() => {
    return round2(Number(rate || 0) * Number(quantity || 0));
  }, [rate, quantity]);

  const suggestions = useMemo(() => {
    const query = description.trim().toUpperCase();
    if (!query) return [];
    return catalog
      .filter((item) => item.name.toUpperCase().includes(query))
      .slice(0, 8);
  }, [catalog, description]);

  const resetDialog = () => {
    setDescription("");
    setRate("0");
    setQuantity("1");
    setDiscountPercent("0");
    setDiscountAmount("0");
    setShowSuggestions(false);
    setError("");
  };

  const syncDiscountFromPercent = (percentValue: string, amountBase = lineAmount) => {
    const percent = Number(percentValue || 0);
    const nextAmount = round2((amountBase * percent) / 100);
    setDiscountPercent(percentValue);
    setDiscountAmount(String(nextAmount));
  };

  const syncPercentFromAmount = (amountValue: string, amountBase = lineAmount) => {
    const amount = Number(amountValue || 0);
    const percent =
      amountBase > 0 ? round2((amount / amountBase) * 100) : 0;
    setDiscountAmount(amountValue);
    setDiscountPercent(String(percent));
  };

  const handleDescriptionChange = (value: string) => {
    const upper = value.toUpperCase();
    setDescription(upper);
    setShowSuggestions(true);
  };

  const pickSuggestion = (item: CatalogItem) => {
    setDescription(item.name.toUpperCase());
    setRate(String(item.rate));
    setShowSuggestions(false);
    // keep current qty; recompute discount amount from current %
    const amountBase = round2(Number(item.rate || 0) * Number(quantity || 0));
    syncDiscountFromPercent(discountPercent, amountBase);
  };

  const handleRateChange = (value: string) => {
    setRate(value);
    const amountBase = round2(Number(value || 0) * Number(quantity || 0));
    syncDiscountFromPercent(discountPercent, amountBase);
  };

  const handleQuantityChange = (value: string) => {
    setQuantity(value);
    const amountBase = round2(Number(rate || 0) * Number(value || 0));
    syncDiscountFromPercent(discountPercent, amountBase);
  };

  const addItem = () => {
    const next: JobCardLineItem = {
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      description: description.trim().toUpperCase(),
      rate: Number(rate || 0),
      quantity: Number(quantity || 0),
      discountPercent: Number(discountPercent || 0),
    };

    if (!next.description) {
      setError("Item description is required");
      return;
    }
    if (next.quantity <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    if (next.rate < 0) {
      setError("Rate cannot be negative");
      return;
    }
    if (next.discountPercent < 0 || next.discountPercent > 100) {
      setError("Discount % must be between 0 and 100");
      return;
    }
    const amount = next.rate * next.quantity;
    const disAmt = Number(discountAmount || 0);
    if (disAmt < 0 || disAmt > amount) {
      setError("Discount amount cannot exceed line amount");
      return;
    }

    onChange([...items, next]);
    setOpen(false);
    resetDialog();
  };

  return (
    <section className="space-y-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Items</h3>
        {!readOnly && (
          <Button
            type="button"
            disabled={saving}
            onClick={() => {
              resetDialog();
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-muted">
            <tr className="border-b text-left">
              <th className="p-2">S.No</th>
              <th className="p-2">Item Description</th>
              <th className="p-2">Rate</th>
              <th className="p-2">Quantity</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Dis %</th>
              <th className="p-2">Dis-Amt</th>
              <th className="p-2">Net-Amt</th>
              {!readOnly && <th className="p-2"> </th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const { amount, discountAmount: disAmt, netAmount } =
                calcLineAmounts(item);
              return (
                <tr key={item.id} className="border-b">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2 uppercase">{item.description}</td>
                  <td className="p-2">{formatMoney(item.rate)}</td>
                  <td className="p-2">{item.quantity}</td>
                  <td className="p-2">{formatMoney(amount)}</td>
                  <td className="p-2">{formatMoney(item.discountPercent)}</td>
                  <td className="p-2">{formatMoney(disAmt)}</td>
                  <td className="p-2 font-medium">{formatMoney(netAmount)}</td>
                  {!readOnly && (
                    <td className="p-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={saving}
                        onClick={() =>
                          onChange(items.filter((row) => row.id !== item.id))
                        }
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={readOnly ? 8 : 9}
                  className="p-6 text-center text-muted-foreground"
                >
                  No items added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="rounded-md border bg-muted px-4 py-3 text-sm">
          <span className="text-muted-foreground">Total Net Amount: </span>
          <span className="font-semibold text-foreground">
            {formatMoney(total)}
          </span>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetDialog();
        }}
      >
        <DialogContent className="bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Item</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="relative">
              <label className="mb-1 block text-sm font-medium">
                Item Description
              </label>
              <Input
                value={description}
                onChange={(event) =>
                  handleDescriptionChange(event.target.value)
                }
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  // allow click on suggestion before closing
                  window.setTimeout(() => setShowSuggestions(false), 150);
                }}
                placeholder="TYPE ITEM NAME"
                style={{ textTransform: "uppercase" }}
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-card shadow-md">
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => pickSuggestion(item)}
                    >
                      <span className="uppercase">{item.name}</span>
                      <span className="text-muted-foreground">
                        {formatMoney(Number(item.rate))}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Rate</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={rate}
                  onChange={(event) => handleRateChange(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  min={1}
                  step="1"
                  value={quantity}
                  onChange={(event) => handleQuantityChange(event.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border bg-muted px-3 py-2 text-sm">
              <span className="text-muted-foreground">Amount: </span>
              <span className="font-medium">{formatMoney(lineAmount)}</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Dis %</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={discountPercent}
                  onChange={(event) =>
                    syncDiscountFromPercent(event.target.value)
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Dis-Amt</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={discountAmount}
                  onChange={(event) =>
                    syncPercentFromAmount(event.target.value)
                  }
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetDialog();
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={addItem}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
