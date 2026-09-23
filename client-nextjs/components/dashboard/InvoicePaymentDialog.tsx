"use client";

import { useEffect, useState, type CSSProperties } from "react";

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
import { cn } from "@/lib/utils";

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

/** Keep dialog inside the visible viewport while the mobile keyboard is open. */
function useKeyboardSafeDialogStyle(open: boolean) {
  const [style, setStyle] = useState<CSSProperties | undefined>();

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      setStyle(undefined);
      return;
    }

    const mq = window.matchMedia("(max-width: 639px)");

    const update = () => {
      if (!mq.matches) {
        setStyle(undefined);
        return;
      }

      const vv = window.visualViewport;
      const topInset = vv?.offsetTop ?? 0;
      const height = vv?.height ?? window.innerHeight;
      const pad = 12;

      setStyle({
        top: topInset + pad,
        left: "50%",
        transform: "translateX(-50%)",
        maxHeight: Math.max(220, height - pad * 2),
        width: "min(100% - 1.5rem, 28rem)",
        margin: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      });
    };

    update();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    mq.addEventListener("change", update);

    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      mq.removeEventListener("change", update);
    };
  }, [open]);

  return style;
}

export default function InvoicePaymentDialog({
  invoice,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const [paidAmount, setPaidAmount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const keyboardSafeStyle = useKeyboardSafeDialogStyle(open);

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
      <DialogContent
        className={cn(
          "bg-card gap-0 p-0 sm:max-w-md",
          // Fallback when visualViewport style is not applied yet
          "max-sm:top-3 max-sm:translate-y-0 max-sm:max-h-[min(92dvh,calc(100dvh-1.5rem))]"
        )}
        style={keyboardSafeStyle}
        onOpenAutoFocus={(event) => {
          // Avoid jumping the page; we scroll the field into view on focus.
          event.preventDefault();
          const input = (event.currentTarget as HTMLElement).querySelector<HTMLInputElement>(
            'input[name="paidAmount"]'
          );
          input?.focus({ preventScroll: true });
        }}
      >
        <DialogHeader className="shrink-0 px-4 pt-4 pr-12">
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
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
              <label
                htmlFor="payment-paid-amount"
                className="mb-1 block text-sm font-medium"
              >
                Total amount paid (cumulative)
              </label>
              <Input
                id="payment-paid-amount"
                name="paidAmount"
                type="number"
                inputMode="decimal"
                enterKeyHint="done"
                min={0}
                max={total}
                step="0.01"
                value={paidAmount}
                onChange={(event) => setPaidAmount(Number(event.target.value))}
                onFocus={(event) => {
                  const target = event.currentTarget;
                  // After the keyboard opens, keep the field above it.
                  window.setTimeout(() => {
                    target.scrollIntoView({
                      block: "center",
                      behavior: "smooth",
                    });
                  }, 300);
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Enter the full amount paid so far. Status updates automatically.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted p-3 sm:p-4">
                <p className="text-sm text-muted-foreground">Due</p>
                <p className="text-lg font-bold">{formatCurrency(dueAmount)}</p>
              </div>
              <div
                className={`rounded-lg border p-3 sm:p-4 ${paymentStatusTone(previewStatus)}`}
              >
                <p className="text-sm opacity-80">Status</p>
                <p className="text-lg font-bold capitalize">{previewStatus}</p>
              </div>
            </div>

            {errorMessage && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}
          </div>

          <DialogFooter className="mx-0 mb-0 shrink-0 gap-2 rounded-b-xl sm:gap-2">
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
