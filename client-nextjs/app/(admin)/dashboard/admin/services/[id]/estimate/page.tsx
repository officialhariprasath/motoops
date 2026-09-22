"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  countDocumentPages,
  ServiceDocumentPages,
} from "@/components/print/ServiceDocumentPages";
import type { JobCardLineItem } from "@/lib/job-card-items";
import { addNotification } from "@/lib/notifications";
import { syncGarageSettingsCache } from "@/lib/garage-settings-api";
import { downloadSheetAsPdf } from "@/lib/download-sheet-pdf";
import { resolveDocumentFontSize } from "@/lib/document-font";

const MM_TO_PX = 96 / 25.4;

const getService = async (id: string) => {
  const res = await fetch(`/api/services/${id}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to load job card");
  return json.data ?? json;
};

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

function formatEstimateDate(value?: string | Date | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export default function EstimatePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [settings, setSettings] = useState<GarageSettings>({});
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [savedEstimateId, setSavedEstimateId] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState("");
  const [downloading, setDownloading] = useState(false);
  const savedOnce = useRef(false);

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

  const serviceQuery = useQuery({
    queryKey: ["service", id],
    queryFn: () => getService(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (serviceQuery.isLoading || !serviceQuery.data) return;
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
  }, [serviceQuery.isLoading, serviceQuery.data]);

  useEffect(() => {
    if (!serviceQuery.data || savedOnce.current) return;
    const items = (serviceQuery.data.lineItems ?? []) as JobCardLineItem[];
    if (items.length === 0) return;
    savedOnce.current = true;

    (async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user.id) return;
        const res = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId: id,
            generatedById: user.id,
            documentType: "ESTIMATE",
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Failed to save estimate");
        const invoice = json.data ?? json;
        setSavedEstimateId(invoice.id);
        setSaveMsg(`Saved as ${invoice.invoiceNumber || "estimate"}`);
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
        addNotification({
          title: "Estimate saved",
          message: `${invoice.invoiceNumber || "Estimate"} is now in Invoices.`,
          category: "invoice",
        });
      } catch (error) {
        setSaveMsg(
          error instanceof Error ? error.message : "Could not save estimate"
        );
      }
    })();
  }, [serviceQuery.data, id, queryClient]);

  const service = serviceQuery.data;
  const items = (service?.lineItems ?? []) as JobCardLineItem[];
  const fontSizePx = resolveDocumentFontSize(settings.documentFontSize);
  const pageCount = countDocumentPages(items.length, fontSizePx);

  if (serviceQuery.isLoading) {
    return <p className="p-6">Loading estimate...</p>;
  }

  if (serviceQuery.isError || !service) {
    return (
      <p className="p-6 text-red-600">
        {(serviceQuery.error as Error)?.message || "Failed to load estimate."}
      </p>
    );
  }

  const estimateNo =
    String(service.jobCardNumber || service.id || "")
      .replace(/\D/g, "")
      .slice(-6) || "000001";

  const pageWidthPx = A4_WIDTH_MM * MM_TO_PX;
  const pageHeightPx = A4_HEIGHT_MM * MM_TO_PX;
  const stackHeightPx =
    pageCount * pageHeightPx + Math.max(0, pageCount - 1) * (10 * MM_TO_PX);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/dashboard/admin/services/${id}`)}
        >
          Back
        </Button>
        {savedEstimateId && (
          <Link href={`/dashboard/admin/invoices/${savedEstimateId}`}>
            <Button type="button" variant="outline">
              View in Invoices
            </Button>
          </Link>
        )}
        <Button
          type="button"
          disabled={downloading}
          onClick={async () => {
            if (!sheetRef.current || downloading) return;
            setDownloading(true);
            try {
              const name =
                service?.jobCardNumber ||
                String(id || "estimate").slice(0, 8);
              await downloadSheetAsPdf(
                sheetRef.current,
                `estimate-${name}.pdf`
              );
            } catch (err) {
              setSaveMsg(
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
      {saveMsg && (
        <p className="text-sm text-muted-foreground print:hidden">{saveMsg}</p>
      )}

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
                title: "ESTIMATE",
                docNo: estimateNo,
                docDateLabel: formatEstimateDate(
                  service.jobCardAt || service.serviceDate
                ),
                garageName: settings.garageName || "MotoOps",
                garageAddress: settings.address || "",
                garagePhone: settings.phone || "",
                garageEmail: settings.email || "",
                gstin: settings.gstin,
                logoUrl:
                  settings.invoiceLogoUrl?.trim() || "/motoops-logo.png",
                invoiceNote: settings.invoiceNote,
                customer: service.customer,
                vehicle: service.vehicle,
                notes: service.notes,
                items,
                showPaymentOnSheet: false,
                includeNextService: false,
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
