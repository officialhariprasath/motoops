"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";

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
  calcJobCardTotals,
  calcLineAmounts,
  calcOverallDiscount,
  formatMoney,
  formatPercent,
  percentFromDiscountAmount,
  roundMoney,
  type JobCardLineItem,
} from "@/lib/job-card-items";
import { fetchCatalogItems } from "@/lib/query-fetchers";
import { queryKeys, STALE } from "@/lib/query-keys";

type CatalogItem = {
  id: string;
  name: string;
  rate: number;
  itemKind?: "GENERAL" | "PROFIT";
};

type Props = {
  items: JobCardLineItem[];
  onChange: (items: JobCardLineItem[]) => void;
  discountPercent?: number;
  onDiscountPercentChange?: (discountPercent: number) => void;
  readOnly?: boolean;
  saving?: boolean;
};

export default function JobCardItemsSection({
  items,
  onChange,
  discountPercent = 0,
  onDiscountPercentChange,
  readOnly = false,
  saving = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState("0");
  const [quantity, setQuantity] = useState("1");
  const [lineDiscountPercent, setLineDiscountPercent] = useState("0");
  const [lineDiscountAmount, setLineDiscountAmount] = useState("0");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState("");
  const [pendingItemKind, setPendingItemKind] = useState<"GENERAL" | "PROFIT">(
    "GENERAL"
  );

  const [totalDisPercent, setTotalDisPercent] = useState(
    String(Number(discountPercent || 0))
  );
  const [totalDisAmount, setTotalDisAmount] = useState("0");

  const catalogQuery = useQuery({
    queryKey: queryKeys.catalogItemsActive,
    queryFn: async (): Promise<CatalogItem[]> => {
      const rows = (await fetchCatalogItems(false)) as CatalogItem[];
      return rows.map((item) => ({
        ...item,
        rate: Number(item.rate || 0),
        name: String(item.name || ""),
        itemKind:
          item.itemKind === "PROFIT"
            ? ("PROFIT" as const)
            : ("GENERAL" as const),
      }));
    },
    staleTime: STALE.referenceMs,
    enabled: !readOnly,
  });

  const catalog = catalogQuery.data ?? [];
  const totals = useMemo(
    () => calcJobCardTotals(items, Number(discountPercent || 0)),
    [items, discountPercent]
  );

  const lineAmount = useMemo(() => {
    return roundMoney(Number(rate || 0) * Number(quantity || 0));
  }, [rate, quantity]);

  const suggestions = useMemo(() => {
    const query = description.trim().toUpperCase();
    if (!query) return [];
    return catalog
      .filter((item) => item.name.toUpperCase().includes(query))
      .slice(0, 8);
  }, [catalog, description]);

  // Keep total discount fields in sync with saved percent + current items subtotal
  useEffect(() => {
    const percent = Number(discountPercent || 0);
    setTotalDisPercent(String(percent));
    setTotalDisAmount(String(totals.discountAmount));
  }, [discountPercent, totals.discountAmount, totals.itemsSubtotal]);

  const resetForm = () => {
    setEditingId(null);
    setDescription("");
    setRate("0");
    setQuantity("1");
    setLineDiscountPercent("0");
    setLineDiscountAmount("0");
    setPendingItemKind("GENERAL");
    setShowSuggestions(false);
    setError("");
  };

  const syncLineDiscountFromPercent = (
    percentValue: string,
    amountBase = lineAmount
  ) => {
    const percent = Number(percentValue || 0);
    const nextAmount = roundMoney((amountBase * percent) / 100);
    setLineDiscountPercent(percentValue);
    setLineDiscountAmount(String(nextAmount));
  };

  const syncLinePercentFromAmount = (
    amountValue: string,
    amountBase = lineAmount
  ) => {
    const amount = Number(amountValue || 0);
    const percent = percentFromDiscountAmount(amount, amountBase);
    setLineDiscountAmount(amountValue);
    setLineDiscountPercent(String(percent));
  };

  const openAddDialog = () => {
    resetForm();
    setOpen(true);
  };

  const openEditDialog = (item: JobCardLineItem) => {
    const { amount, discountAmount } = calcLineAmounts(item);
    setEditingId(item.id);
    setDescription(item.description);
    setRate(String(item.rate));
    setQuantity(String(item.quantity));
    setLineDiscountPercent(String(item.discountPercent || 0));
    setLineDiscountAmount(String(discountAmount));
    setPendingItemKind(item.itemKind === "PROFIT" ? "PROFIT" : "GENERAL");
    setShowSuggestions(false);
    setError("");
    setOpen(true);
    void amount;
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value.toUpperCase());
    setShowSuggestions(true);
  };

  const pickSuggestion = (item: CatalogItem) => {
    setDescription(item.name.toUpperCase());
    setRate(String(item.rate));
    setPendingItemKind(item.itemKind === "PROFIT" ? "PROFIT" : "GENERAL");
    setShowSuggestions(false);
    const amountBase = roundMoney(
      Number(item.rate || 0) * Number(quantity || 0)
    );
    syncLineDiscountFromPercent(lineDiscountPercent, amountBase);
  };

  const handleRateChange = (value: string) => {
    setRate(value);
    const amountBase = roundMoney(Number(value || 0) * Number(quantity || 0));
    syncLineDiscountFromPercent(lineDiscountPercent, amountBase);
  };

  const handleQuantityChange = (value: string) => {
    setQuantity(value);
    const amountBase = roundMoney(Number(rate || 0) * Number(value || 0));
    syncLineDiscountFromPercent(lineDiscountPercent, amountBase);
  };

  const removeItem = (itemId: string) => {
    onChange(items.filter((row) => row.id !== itemId));
  };

  const saveItem = () => {
    const matched = catalog.find(
      (row) =>
        row.name.trim().toUpperCase() === description.trim().toUpperCase()
    );
    const next: JobCardLineItem = {
      id: editingId ?? crypto.randomUUID?.() ?? `${Date.now()}`,
      description: description.trim().toUpperCase(),
      rate: Number(rate || 0),
      quantity: Number(quantity || 0),
      discountPercent: Number(lineDiscountPercent || 0),
      itemKind:
        matched?.itemKind === "PROFIT"
          ? "PROFIT"
          : pendingItemKind === "PROFIT"
            ? "PROFIT"
            : "GENERAL",
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
    const { amount } = calcLineAmounts(next);
    const disAmt = Number(lineDiscountAmount || 0);
    if (disAmt < 0 || disAmt > amount + 0.01) {
      setError("Discount amount cannot exceed line amount");
      return;
    }
    // Prefer % snapped from amount when user typed amount
    next.discountPercent = percentFromDiscountAmount(disAmt, amount);

    if (editingId) {
      onChange(items.map((row) => (row.id === editingId ? next : row)));
      resetForm();
      setOpen(false);
      return;
    }

    onChange([...items, next]);
    resetForm();
    setOpen(true);
  };

  const commitTotalDiscountPercent = (percentValue: string) => {
    const percent = Math.min(100, Math.max(0, Number(percentValue || 0)));
    const { discountAmount } = calcOverallDiscount(
      totals.itemsSubtotal,
      percent
    );
    setTotalDisPercent(String(percent));
    setTotalDisAmount(String(discountAmount));
    onDiscountPercentChange?.(percent);
  };

  const commitTotalDiscountAmount = (amountValue: string) => {
    const amount = Math.max(0, Number(amountValue || 0));
    const capped =
      totals.itemsSubtotal > 0
        ? Math.min(amount, totals.itemsSubtotal)
        : 0;
    const percent = percentFromDiscountAmount(capped, totals.itemsSubtotal);
    const { discountAmount } = calcOverallDiscount(
      totals.itemsSubtotal,
      percent
    );
    setTotalDisAmount(String(discountAmount));
    setTotalDisPercent(formatPercent(percent));
    onDiscountPercentChange?.(percent);
  };

  const isEditing = Boolean(editingId);

  return (
    <section className="space-y-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Items</h3>
        {!readOnly && (
          <Button type="button" disabled={saving} onClick={openAddDialog}>
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
                  <td className="p-2">{formatPercent(item.discountPercent)}</td>
                  <td className="p-2">{formatMoney(disAmt)}</td>
                  <td className="p-2 font-medium">{formatMoney(netAmount)}</td>
                  {!readOnly && (
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={saving}
                          title="Edit item"
                          onClick={() => openEditDialog(item)}
                        >
                          <Pencil className="h-4 w-4 text-foreground" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={saving}
                          title="Delete item"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
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
            {items.length > 0 && (
              <tr className="border-t bg-muted/40 font-medium">
                <td className="p-2" colSpan={4}>
                  TOTAL
                </td>
                <td className="p-2">{formatMoney(totals.grossTotal)}</td>
                <td className="p-2">
                  {readOnly || !onDiscountPercentChange ? (
                    formatPercent(totals.discountPercent)
                  ) : (
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      className="h-8 w-20 bg-card"
                      value={totalDisPercent}
                      disabled={saving}
                      onChange={(event) => {
                        const value = event.target.value;
                        setTotalDisPercent(value);
                        const percent = Number(value || 0);
                        setTotalDisAmount(
                          String(
                            calcOverallDiscount(totals.itemsSubtotal, percent)
                              .discountAmount
                          )
                        );
                      }}
                      onBlur={() =>
                        commitTotalDiscountPercent(totalDisPercent)
                      }
                      aria-label="Total discount percent"
                    />
                  )}
                </td>
                <td className="p-2">
                  {readOnly || !onDiscountPercentChange ? (
                    formatMoney(totals.discountAmount)
                  ) : (
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      className="h-8 w-24 bg-card"
                      value={totalDisAmount}
                      disabled={saving}
                      onChange={(event) => {
                        const value = event.target.value;
                        setTotalDisAmount(value);
                        const amount = Number(value || 0);
                        setTotalDisPercent(
                          String(
                            percentFromDiscountAmount(
                              amount,
                              totals.itemsSubtotal
                            )
                          )
                        );
                      }}
                      onBlur={() => commitTotalDiscountAmount(totalDisAmount)}
                      aria-label="Total discount amount"
                    />
                  )}
                </td>
                <td className="p-2 font-semibold">
                  {formatMoney(totals.grandTotal)}
                </td>
                {!readOnly && <td className="p-2" />}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <div className="rounded-md border bg-muted px-4 py-3 text-sm">
          <span className="text-muted-foreground">Items subtotal: </span>
          <span className="font-medium">{formatMoney(totals.itemsSubtotal)}</span>
        </div>
        <div className="rounded-md border bg-muted px-4 py-3 text-sm">
          <span className="text-muted-foreground">Total discount: </span>
          <span className="font-medium">
            {formatMoney(totals.discountAmount)}
            {totals.discountPercent
              ? ` (${formatMoney(totals.discountPercent)}%)`
              : ""}
          </span>
        </div>
        <div className="rounded-md border bg-muted px-4 py-3 text-sm">
          <span className="text-muted-foreground">Grand total: </span>
          <span className="font-semibold text-foreground">
            {formatMoney(totals.grandTotal)}
          </span>
          {saving && (
            <span className="ml-2 text-muted-foreground">Saving…</span>
          )}
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetForm();
        }}
      >
        <DialogContent className="bg-card max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Item" : "Add Item"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {!isEditing && items.length > 0 && (
              <div className="rounded-md border bg-muted/40 p-3">
                <p className="mb-2 text-sm font-medium">
                  Items so far ({items.length})
                </p>
                <ul className="max-h-36 space-y-2 overflow-y-auto text-sm">
                  {items.map((item) => {
                    const { netAmount } = calcLineAmounts(item);
                    return (
                      <li
                        key={item.id}
                        className="flex items-start justify-between gap-2 rounded border bg-card px-2 py-1.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium uppercase">
                            {item.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Qty {item.quantity}
                            {" \u00B7 "}Rate {formatMoney(item.rate)}
                            {" \u00B7 "}Net {formatMoney(netAmount)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={saving}
                            onClick={() => openEditDialog(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={saving}
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

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
                  value={lineDiscountPercent}
                  onChange={(event) =>
                    syncLineDiscountFromPercent(event.target.value)
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Dis-Amt</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={lineDiscountAmount}
                  onChange={(event) =>
                    syncLinePercentFromAmount(event.target.value)
                  }
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {saving && (
              <p className="text-sm text-muted-foreground">Saving items…</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={saveItem} disabled={saving}>
              {isEditing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
