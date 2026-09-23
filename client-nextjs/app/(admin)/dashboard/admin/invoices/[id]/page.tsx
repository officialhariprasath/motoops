"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import InvoicePaymentDialog from "@/components/dashboard/InvoicePaymentDialog";
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  countDocumentPages,
  ServiceDocumentPages,
} from "@/components/print/ServiceDocumentPages";
import type { JobCardLineItem } from "@/lib/job-card-items";
import { syncGarageSettingsCache } from "@/lib/garage-settings-api";
import { downloadSheetAsPdf } from "@/lib/download-sheet-pdf";
import { resolveDocumentFontSize } from "@/lib/document-font";

const MM_TO_PX = 96 / 25.4;

type GarageSettings = {
  garageName?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  invoiceNote?: string;
  invoiceLogoUrl?: string;
  documentFontSize?: number;
};

function readGarageSettings(): GarageSettings {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("garageSettings") || "{}");
  } catch {
    return {};
  }
}

function formatDocDate(value?: string | Date | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export default function InvoiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [settings, setSettings] = useState<GarageSettings>({});
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const remote = await syncGarageSettingsCache();
      if (!cancelled) {
        setSettings(remote || readGarageSettings());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    fetch(`/api/invoices/${invoiceId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success === false) {
          throw new Error(data?.message || "Failed to load invoice");
        }
        const invoiceData = data?.data ?? data;
        if (!invoiceData) throw new Error("Invoice not found");
        setInvoice(invoiceData);
      })
      .catch((error) => {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load invoice"
        );
      });
  }, [invoiceId]);

  useEffect(() => {
    if (!invoice) return;
    const el = wrapRef.current;
    if (!el) return;

    const updateScale = () => {
      const available = el.clientWidth;
      const pageWidthPx = A4_WIDTH_MM * MM_TO_PX;
      setScale(Math.min(1, available / pageWidthPx));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, [invoice]);

  const service = invoice?.service;
  const items = useMemo(
    () => (service?.lineItems ?? []) as JobCardLineItem[],
    [service]
  );
  const fontSizePx = resolveDocumentFontSize(settings.documentFontSize);
  const pageCount = countDocumentPages(items.length, fontSizePx);

  if (errorMessage) {
    return <p className="p-6 text-red-600">{errorMessage}</p>;
  }

  if (!invoice) {
    return <p className="p-6">Loading invoice...</p>;
  }

  const docType = invoice.documentType || "BILL";
  const isEstimate = docType === "ESTIMATE";
  const docNo =
    invoice.invoiceNumber ||
    String(service?.jobCardNumber || invoice.id || "")
      .replace(/\D/g, "")
      .slice(-6) ||
    "000001";

  const pageWidthPx = A4_WIDTH_MM * MM_TO_PX;
  const pageHeightPx = A4_HEIGHT_MM * MM_TO_PX;
  // 10mm gap between pages in the stack
  const stackHeightPx =
    pageCount * pageHeightPx + Math.max(0, pageCount - 1) * (10 * MM_TO_PX);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Back
        </Button>
        {service?.id && (
          <Link href={`/dashboard/admin/services/${service.id}`}>
            <Button type="button" variant="outline">
              Open Job Card
            </Button>
          </Link>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => setPaymentOpen(true)}
        >
          {Number(invoice.paidAmount) > 0
            ? "Update payment"
            : "Record payment"}
        </Button>
        <Button
          type="button"
          disabled={downloading}
          onClick={async () => {
            if (!sheetRef.current || downloading) return;
            setDownloading(true);
            try {
              const name =
                invoice.invoiceNumber ||
                String(invoice.id || "invoice").slice(0, 8);
              await downloadSheetAsPdf(
                sheetRef.current,
                `${isEstimate ? "estimate" : "invoice"}-${name}.pdf`
              );
            } catch (err) {
              setErrorMessage(
                err instanceof Error
                  ? err.message
                  : "Failed to download PDF"
              );
            } finally {
              setDownloading(false);
            }
          }}
        >
          {downloading ? "Preparing PDF…" : "Download PDF"}
        </Button>
      </div>

      <InvoicePaymentDialog
        invoice={
          invoice
            ? {
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                documentType: invoice.documentType,
                totalAmount: Number(invoice.totalAmount || 0),
                paidAmount: Number(invoice.paidAmount || 0),
                dueAmount: Number(invoice.dueAmount || 0),
                paymentStatus: invoice.paymentStatus || "unpaid",
              }
            : null
        }
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        onSaved={(saved) => {
          setInvoice((prev: any) =>
            prev
              ? {
                  ...prev,
                  paidAmount: saved.paidAmount,
                  dueAmount: saved.dueAmount,
                  paymentStatus: saved.paymentStatus,
                }
              : prev
          );
        }}
      />

      <div
        ref={wrapRef}
        className="estimate-preview-wrap w-full print:block"
        style={{ height: stackHeightPx * scale }}
      >
        <div
          className="estimate-scale-layer mx-auto"
          style={{
            width: pageWidthPx * scale,
            height: stackHeightPx * scale,
          }}
        >
          <div
            ref={sheetRef}
            className="estimate-sheet-stack"
            style={{
              width: `${A4_WIDTH_MM}mm`,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <ServiceDocumentPages
              model={{
                title: isEstimate ? "ESTIMATE" : "INVOICE",
                docNo,
                docDateLabel: formatDocDate(
                  invoice.createdAt ||
                    service?.jobCardAt ||
                    service?.serviceDate
                ),
                paymentStatus: invoice.paymentStatus,
                garageName: settings.garageName || "MotoOps",
                garageAddress: settings.address || "",
                garagePhone: settings.phone || "",
                garageEmail: settings.email || "",
                gstin: settings.gstin,
                logoUrl:
                  settings.invoiceLogoUrl?.trim() || "/motoops-logo.png",
                invoiceNote: settings.invoiceNote,
                customer: service?.customer,
                vehicle: service?.vehicle,
                notes: service?.notes,
                items,
                paidAmount: invoice.paidAmount,
                dueAmount: invoice.dueAmount,
                showPaymentOnSheet: true,
                includeNextService: Boolean(
                  !isEstimate &&
                    (invoice?.billExtras?.includeNextServiceOnBill ||
                      service?.includeNextServiceOnBill)
                ),
                billExtras: invoice?.billExtras,
                nextServiceOdometer: service?.nextServiceOdometer,
                nextServiceAt: service?.nextServiceAt,
                futureWorksNotes: service?.futureWorksNotes,
                fontSizePx,
              }}
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .estimate-preview-wrap,
          .estimate-scale-layer,
          .estimate-sheet-stack,
          .estimate-sheet-stack * {
            visibility: visible !important;
          }

          .estimate-sheet-stack {
            transform: none !important;
          }

          .estimate-sheet {
            box-shadow: none !important;
            page-break-after: always;
          }

          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
