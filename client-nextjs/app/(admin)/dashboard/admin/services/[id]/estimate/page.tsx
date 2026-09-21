"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { OtherDetailsBlock } from "@/components/print/OtherDetailsBlock";
import {
  calcLineAmounts,
  calcLineItemsTotal,
  formatMoney,
  type JobCardLineItem,
} from "@/lib/job-card-items";
import { numberToWordsIndian } from "@/lib/job-card-status";
import { addNotification } from "@/lib/notifications";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
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
  const [scale, setScale] = useState(1);
  const [savedEstimateId, setSavedEstimateId] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState("");
  const savedOnce = useRef(false);

  useEffect(() => {
    setSettings(readGarageSettings());
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
  const totalNet = calcLineItemsTotal(items);
  const totalAmount = items.reduce(
    (sum, item) => sum + calcLineAmounts(item).amount,
    0
  );

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

  const garageName = settings.garageName || "MotoOps";
  const garageAddress = settings.address || "";
  const garagePhone = settings.phone || "";
  const garageEmail = settings.email || "";
  const invoiceLogoUrl =
    settings.invoiceLogoUrl?.trim() || "/motoops-logo.png";
  const estimateNo =
    String(service.jobCardNumber || service.id || "")
      .replace(/\D/g, "")
      .slice(-6) || "000001";

  const pageWidthPx = A4_WIDTH_MM * MM_TO_PX;
  const pageHeightPx = A4_HEIGHT_MM * MM_TO_PX;

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
        <Button type="button" onClick={() => window.print()}>
          Download PDF
        </Button>
      </div>
      {saveMsg && (
        <p className="text-sm text-muted-foreground print:hidden">{saveMsg}</p>
      )}

      <div
        ref={wrapRef}
        className="estimate-preview-wrap w-full print:block"
        style={{ height: pageHeightPx * scale }}
      >
        <div
          className="estimate-scale-layer mx-auto"
          style={{
            width: pageWidthPx * scale,
            height: pageHeightPx * scale,
          }}
        >
          <div
            className="estimate-sheet bg-card text-[9.5px] text-foreground shadow-md print:shadow-none"
            style={{
              width: `${A4_WIDTH_MM}mm`,
              minHeight: `${A4_HEIGHT_MM}mm`,
              maxWidth: `${A4_WIDTH_MM}mm`,
              boxSizing: "border-box",
              padding: "8mm",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <div className="flex h-full min-h-[calc(297mm-16mm)] flex-col border border-[#1d4f91]">
              <div className="relative border-b border-[#1d4f91] px-3 py-2.5 text-center">
                <img
                  src={invoiceLogoUrl}
                  alt=""
                  className="pointer-events-none absolute left-2 top-2 h-11 w-auto max-w-[72px] object-contain"
                />
                <h2 className="text-[16px] font-bold tracking-wide text-[#1d4f91]">
                  {garageName.toUpperCase()}
                </h2>
                {garageAddress && (
                  <p className="mt-1 leading-snug">{garageAddress}</p>
                )}
                <p className="mt-0.5">
                  {[
                    garagePhone ? `Mobile: ${garagePhone}` : null,
                    garageEmail ? `Email: ${garageEmail}` : null,
                  ]
                    .filter(Boolean)
                    .join(" | ")}
                </p>
                {settings.gstin && (
                  <p className="mt-0.5 font-medium">GSTIN : {settings.gstin}</p>
                )}
              </div>

              <div className="grid grid-cols-2 border-b border-[#1d4f91]">
                <div className="border-r border-[#1d4f91] p-2.5">
                  <p className="mb-1.5 font-semibold">To</p>
                  <div className="space-y-0.5">
                    <p>
                      <span className="inline-block w-14">Mr.</span>
                      {service.customer?.name || "-"}
                    </p>
                    <p>
                      <span className="inline-block w-14">Mobile</span>
                      {service.customer?.mobile || "-"}
                    </p>
                    {service.customer?.address && (
                      <p className="break-words whitespace-pre-wrap pl-14">
                        {service.customer.address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="mb-2 text-center text-[12px] font-bold tracking-[0.18em]">
                    ESTIMATE
                  </p>
                  <div className="space-y-0.5">
                    <p>
                      <span className="inline-block w-20 font-semibold">NO</span>
                      {estimateNo}
                    </p>
                    <p>
                      <span className="inline-block w-20 font-semibold">DATE</span>
                      {formatEstimateDate(
                        service.jobCardAt || service.serviceDate
                      )}
                    </p>
                    <p>
                      <span className="inline-block w-20 font-semibold">
                        VEHICLE NO
                      </span>
                      {service.vehicle?.registrationNumber || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col style={{ width: "7%" }} />
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "13%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "10%" }} />
                  </colgroup>
                  <thead>
                    <tr className="text-left">
                      {[
                        "SNo",
                        "Item Description",
                        "Quantity",
                        "Rate",
                        "Amount",
                        "Dis%",
                        "Dis-Amt",
                        "Net-Amt",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="border border-[#1d4f91] px-1 py-1 font-semibold"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const { amount, discountAmount, netAmount } =
                        calcLineAmounts(item);
                      return (
                        <tr key={item.id}>
                          <td className="border border-[#1d4f91] px-1 py-0.5 text-center">
                            {index + 1}
                          </td>
                          <td className="border border-[#1d4f91] px-1 py-0.5 break-words uppercase">
                            {item.description}
                          </td>
                          <td className="border border-[#1d4f91] px-1 py-0.5 text-right whitespace-nowrap">
                            {Number(item.quantity).toFixed(3)} NOS
                          </td>
                          <td className="border border-[#1d4f91] px-1 py-0.5 text-right">
                            {formatMoney(item.rate)}
                          </td>
                          <td className="border border-[#1d4f91] px-1 py-0.5 text-right">
                            {formatMoney(amount)}
                          </td>
                          <td className="border border-[#1d4f91] px-1 py-0.5 text-right">
                            {item.discountPercent
                              ? formatMoney(item.discountPercent)
                              : ""}
                          </td>
                          <td className="border border-[#1d4f91] px-1 py-0.5 text-right">
                            {discountAmount ? formatMoney(discountAmount) : ""}
                          </td>
                          <td className="border border-[#1d4f91] px-1 py-0.5 text-right">
                            {formatMoney(netAmount)}
                          </td>
                        </tr>
                      );
                    })}
                    {items.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="border border-[#1d4f91] px-2 py-5 text-center text-muted-foreground"
                        >
                          No items added on this job card.
                        </td>
                      </tr>
                    )}
                    <tr className="font-semibold">
                      <td
                        className="border border-[#1d4f91] px-1 py-1 text-right"
                        colSpan={4}
                      >
                        TOTAL
                      </td>
                      <td className="border border-[#1d4f91] px-1 py-1 text-right">
                        {formatMoney(totalAmount)}
                      </td>
                      <td className="border border-[#1d4f91] px-1 py-1" />
                      <td className="border border-[#1d4f91] px-1 py-1" />
                      <td className="border border-[#1d4f91] px-1 py-1 text-right">
                        {formatMoney(totalNet)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-auto grid grid-cols-[1fr_120px] border-t border-[#1d4f91]">
                <OtherDetailsBlock
                  notes={service.notes}
                  invoiceNote={settings.invoiceNote}
                  amountInWords={numberToWordsIndian(totalNet)}
                  currentOdometer={service.vehicle?.mileage}
                />
                <div className="flex flex-col items-center justify-center gap-1 p-2 text-center">
                  <span className="font-bold">GRAND TOTAL</span>
                  <span className="text-sm font-bold">
                    {formatMoney(totalNet)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-[#1d4f91]">
                <div className="border-r border-[#1d4f91] p-2.5">
                  <p className="mb-1.5 font-semibold underline">
                    Terms & Conditions
                  </p>
                  <ol className="list-decimal space-y-0.5 pl-3 text-[8.5px] leading-snug">
                    <li>Subject to local jurisdiction only.</li>
                    <li>
                      Our responsibility ceases as soon as the goods leave our
                      premises.
                    </li>
                    <li>
                      Goods once sold will not be taken back or exchanged.
                    </li>
                  </ol>
                </div>
                <div className="border-r border-[#1d4f91] p-2.5">
                  <p className="mb-8 font-semibold">
                    Received the goods in good condition
                  </p>
                  <p>Signature Receiving Authority</p>
                </div>
                <div className="p-2.5 text-right">
                  <p className="mb-8 font-semibold">
                    For {garageName.toUpperCase()}
                  </p>
                  <p>Authorised Signatory</p>
                </div>
              </div>
            </div>
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
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .estimate-preview-wrap,
          .estimate-scale-layer,
          .estimate-sheet,
          .estimate-sheet * {
            visibility: visible !important;
          }

          .estimate-preview-wrap,
          .estimate-scale-layer {
            width: 210mm !important;
            height: auto !important;
            margin: 0 !important;
          }

          .estimate-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            max-width: 210mm !important;
            margin: 0 !important;
            padding: 8mm !important;
            box-shadow: none !important;
            transform: none !important;
          }

          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
