"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { OtherDetailsBlock } from "@/components/print/OtherDetailsBlock";
import { NextServicePrintBlock } from "@/components/print/NextServicePrintBlock";
import {
  calcLineAmounts,
  calcLineItemsTotal,
  formatMoney,
  type JobCardLineItem,
} from "@/lib/job-card-items";
import { numberToWordsIndian } from "@/lib/job-card-status";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MM_TO_PX = 96 / 25.4;

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
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    setSettings(readGarageSettings());
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
  const totalNet = calcLineItemsTotal(items);
  const totalAmount = items.reduce(
    (sum, item) => sum + calcLineAmounts(item).amount,
    0
  );

  if (errorMessage) {
    return <p className="p-6 text-red-600">{errorMessage}</p>;
  }

  if (!invoice) {
    return <p className="p-6">Loading invoice...</p>;
  }

  const docType = invoice.documentType || "BILL";
  const isEstimate = docType === "ESTIMATE";
  const title = isEstimate ? "ESTIMATE" : "INVOICE";
  const docNo =
    invoice.invoiceNumber ||
    String(service?.jobCardNumber || invoice.id || "")
      .replace(/\D/g, "")
      .slice(-6) ||
    "000001";

  const garageName = settings.garageName || "MotoOps";
  const garageAddress = settings.address || "";
  const garagePhone = settings.phone || "";
  const garageEmail = settings.email || "";
  const invoiceLogoUrl =
    settings.invoiceLogoUrl?.trim() || "/motoops-logo.png";

  const pageWidthPx = A4_WIDTH_MM * MM_TO_PX;
  const pageHeightPx = A4_HEIGHT_MM * MM_TO_PX;

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
        {!isEstimate && (
          <Link href={`/dashboard/admin/invoices/${invoiceId}/payment`}>
            <Button type="button" variant="outline">
              Update Payment
            </Button>
          </Link>
        )}
        <Button type="button" onClick={() => window.print()}>
          Download PDF
        </Button>
      </div>

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
                      {service?.customer?.name || "-"}
                    </p>
                    <p>
                      <span className="inline-block w-14">Mobile</span>
                      {service?.customer?.mobile || "-"}
                    </p>
                    {service?.customer?.address && (
                      <p className="break-words whitespace-pre-wrap pl-14">
                        {service.customer.address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="mb-2 text-center text-[12px] font-bold tracking-[0.18em]">
                    {title}
                  </p>
                  <div className="space-y-0.5">
                    <p>
                      <span className="inline-block w-20 font-semibold">NO</span>
                      {docNo}
                    </p>
                    <p>
                      <span className="inline-block w-20 font-semibold">DATE</span>
                      {formatDocDate(
                        invoice.createdAt ||
                          service?.jobCardAt ||
                          service?.serviceDate
                      )}
                    </p>
                    <p>
                      <span className="inline-block w-20 font-semibold">
                        VEHICLE NO
                      </span>
                      {service?.vehicle?.registrationNumber || "-"}
                    </p>
                    {!isEstimate && (
                      <p>
                        <span className="inline-block w-20 font-semibold">
                          STATUS
                        </span>
                        <span className="capitalize">
                          {invoice.paymentStatus || "unpaid"}
                        </span>
                      </p>
                    )}
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
                        <tr key={item.id || index}>
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
                  notes={service?.notes}
                  invoiceNote={settings.invoiceNote}
                  amountInWords={numberToWordsIndian(totalNet)}
                  paidAmountLabel={
                    !isEstimate ? formatMoney(invoice.paidAmount) : null
                  }
                  dueAmountLabel={
                    !isEstimate ? formatMoney(invoice.dueAmount) : null
                  }
                  currentOdometer={service?.vehicle?.mileage}
                />
                <div className="flex flex-col items-center justify-center gap-1 p-2 text-center">
                  <span className="font-bold">GRAND TOTAL</span>
                  <span className="text-sm font-bold">
                    {formatMoney(totalNet)}
                  </span>
                </div>
              </div>

              {!isEstimate &&
                Boolean(
                  invoice?.billExtras?.includeNextServiceOnBill ||
                    service?.includeNextServiceOnBill
                ) && (
                  <NextServicePrintBlock
                    nextServiceOdometer={
                      invoice?.billExtras?.nextServiceOdometer ??
                      service?.nextServiceOdometer
                    }
                    nextServiceAt={
                      invoice?.billExtras?.nextServiceAt ??
                      service?.nextServiceAt
                    }
                    futureWorksNotes={
                      invoice?.billExtras?.futureWorksNotes ??
                      service?.futureWorksNotes
                    }
                  />
                )}

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
