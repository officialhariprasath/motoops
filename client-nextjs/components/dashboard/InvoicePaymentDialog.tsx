"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/job-card-items";
import { addNotification } from "@/lib/notifications";
import { paymentStatusTone } from "@/lib/job-card-status";

export type PaymentInvoice = {
  id: string;
  invoiceNumber?: string;
  documentType?: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: "paid" | "unpaid" | "partial";
};

type Props = {
  invoice: PaymentInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (invoice: PaymentInvoice) => void;
};

export default function InvoicePaymentDialog({
  invoice,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const [paidAmount, setPaidAmount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (open && invoice) {
      setPaidAmount(Number(invoice.paidAmount || 0));
      setErrorMessage("");
      setSaving(false);
    }
  }, [open, invoice]);

  if (!invoice) return null;

  const total = Number(invoice.totalAmount || 0);
  const dueAmount = Math.max(total - Number(paidAmount || 0), 0);
  const previewStatus =
    paidAmount <= 0 ? "unpaid" : paidAmount >= total ? "paid" : "partial";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");

    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmount: Number(paidAmount || 0) }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update payment");
      }

      const saved = (data?.data ?? data) as PaymentInvoice;
      addNotification({
        title: "Payment updated",
        message: `Paid amount set to ${formatCurrency(Number(paidAmount))}.`,
        category: "invoice",
      });
      onSaved({
        ...invoice,
        ...saved,
        paidAmount: Number(saved.paidAmount ?? paidAmount),
        dueAmount: Number(
          saved.dueAmount ?? Math.max(total - Number(paidAmount || 0), 0)
        ),
        paymentStatus:
          (saved.paymentStatus as PaymentInvoice["paymentStatus"]) ||
          previewStatus,
      });
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update payment"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {invoice.documentType === "ESTIMATE" ? "Estimate" : "Bill"}
            </p>
            <p className="font-semibold text-foreground">
              {invoice.invoiceNumber || `#${invoice.id.slice(0, 8)}`}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-xl font-bold">{formatCurrency(total)}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Total amount paid (cumulative)
            </label>
            <Input
              type="number"
              min={0}
              max={total}
              step="0.01"
              value={paidAmount}
              onChange={(event) => setPaidAmount(Number(event.target.value))}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Enter the full amount paid so far. Status updates automatically.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">Due</p>
              <p className="text-lg font-bold">{formatCurrency(dueAmount)}</p>
            </div>
            <div
              className={`rounded-lg border p-4 ${paymentStatusTone(previewStatus)}`}
            >
              <p className="text-sm opacity-80">Status</p>
              <p className="text-lg font-bold capitalize">{previewStatus}</p>
            </div>
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setPaidAmount(total)}
            >
              Mark fully paid
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? "Saving…" : "Save payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
