"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { OtherDetailsBlock } from "@/components/print/OtherDetailsBlock";
import { NextServicePrintBlock } from "@/components/print/NextServicePrintBlock";
import { DocumentGarageHeader } from "@/components/print/DocumentGarageHeader";
import { DocumentTableCell } from "@/components/print/DocumentTableCell";
import {
  calcLineAmounts,
  calcLineItemsTotal,
  formatMoney,
  type JobCardLineItem,
} from "@/lib/job-card-items";
import { numberToWordsIndian } from "@/lib/job-card-status";
import { syncGarageSettingsCache } from "@/lib/garage-settings-api";
import { downloadSheetAsPdf } from "@/lib/download-sheet-pdf";
import {
  documentTypeScale,
  resolveDocumentFontSize,
} from "@/lib/document-font";
import InvoicePaymentDialog from "@/components/dashboard/InvoicePaymentDialog";

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
  const typeScale = documentTypeScale(
    resolveDocumentFontSize(settings.documentFontSize)
  );

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
          <Button
            type="button"
            variant="outline"
            onClick={() => setPaymentOpen(true)}
          >
            Update Payment
          </Button>
        )}
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
            ref={sheetRef}
            className="estimate-sheet bg-card leading-snug text-foreground shadow-md print:shadow-none"
            style={{
              width: `${A4_WIDTH_MM}mm`,
              minHeight: `${A4_HEIGHT_MM}mm`,
              maxWidth: `${A4_WIDTH_MM}mm`,
              boxSizing: "border-box",
              padding: "8mm",
              fontSize: `${typeScale.sheet}px`,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <div className="flex h-full min-h-[calc(297mm-16mm)] flex-col border border-[#1d4f91]">
              <DocumentGarageHeader
                garageName={garageName}
                garageAddress={garageAddress}
                garagePhone={garagePhone}
                garageEmail={garageEmail}
                gstin={settings.gstin}
                logoUrl={invoiceLogoUrl}
                nameFontSizePx={typeScale.garageName}
              />

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
                  <p
                    className="mb-2 text-center font-bold tracking-[0.18em]"
                    style={{ fontSize: `${typeScale.title}px` }}
                  >
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
                    <tr>
                      {(
                        [
                          ["SNo", "center"],
                          ["Item Description", "left"],
                          ["Quantity", "center"],
                          ["Rate", "center"],
                          ["Amount", "center"],
                          ["Dis%", "center"],
                          ["Dis-Amt", "center"],
                          ["Net-Amt", "center"],
                        ] as const
                      ).map(([heading, align]) => (
                        <DocumentTableCell
                          key={heading}
                          as="th"
                          align={align}
                          className="font-semibold"
                        >
                          {heading}
                        </DocumentTableCell>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const { amount, discountAmount, netAmount } =
                        calcLineAmounts(item);
                      return (
                        <tr key={item.id || index}>
                          <DocumentTableCell align="center">
                            {index + 1}
                          </DocumentTableCell>
                          <DocumentTableCell
                            align="left"
                            innerClassName="break-words uppercase"
                          >
                            {item.description}
                          </DocumentTableCell>
                          <DocumentTableCell
                            align="right"
                            innerClassName="whitespace-nowrap"
                          >
                            {Number(item.quantity).toFixed(3)} NOS
                          </DocumentTableCell>
                          <DocumentTableCell align="right">
                            {formatMoney(item.rate)}
                          </DocumentTableCell>
                          <DocumentTableCell align="right">
                            {formatMoney(amount)}
                          </DocumentTableCell>
                          <DocumentTableCell align="right">
                            {item.discountPercent
                              ? formatMoney(item.discountPercent)
                              : ""}
                          </DocumentTableCell>
                          <DocumentTableCell align="right">
                            {discountAmount ? formatMoney(discountAmount) : ""}
                          </DocumentTableCell>
                          <DocumentTableCell align="right">
                            {formatMoney(netAmount)}
                          </DocumentTableCell>
                        </tr>
                      );
                    })}
                    {items.length === 0 && (
                      <tr>
                        <DocumentTableCell
                          colSpan={8}
                          align="center"
                          className="text-muted-foreground"
                          innerClassName="py-5"
                        >
                          No items added on this job card.
                        </DocumentTableCell>
                      </tr>
                    )}
                    <tr className="font-semibold">
                      <DocumentTableCell align="right" colSpan={4}>
                        TOTAL
                      </DocumentTableCell>
                      <DocumentTableCell align="right">
                        {formatMoney(totalAmount)}
                      </DocumentTableCell>
                      <DocumentTableCell align="right" />
                      <DocumentTableCell align="right" />
                      <DocumentTableCell align="right">
                        {formatMoney(totalNet)}
                      </DocumentTableCell>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-auto grid grid-cols-[1fr_120px] items-stretch border-t border-[#1d4f91]">
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
                <div
                  data-doc-align="bottom"
                  className="flex h-full min-h-full flex-col items-center justify-end gap-2 border-l-0 p-2.5 text-center"
                >
                  <span className="font-bold leading-tight">GRAND TOTAL</span>
                  <span
                    className="font-bold leading-tight"
                    style={{ fontSize: `${typeScale.grandTotal}px` }}
                  >
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

              <div className="grid grid-cols-3 items-stretch border-t border-[#1d4f91]">
                <div className="border-r border-[#1d4f91] p-2.5">
                  <p className="mb-1.5 font-semibold underline">
                    Terms & Conditions
                  </p>
                  <ol
                    className="list-decimal space-y-0.5 pl-3 leading-snug"
                    style={{ fontSize: `${typeScale.terms}px` }}
                  >
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
                <div
                  data-doc-align="spread"
                  className="flex min-h-[5.75rem] flex-col justify-between border-r border-[#1d4f91] p-2.5"
                >
                  <p className="font-semibold">
                    Received the goods in good condition
                  </p>
                  <p className="pt-6">Signature Receiving Authority</p>
                </div>
                <div
                  data-doc-align="spread"
                  className="flex min-h-[5.75rem] flex-col justify-between p-2.5 text-right"
                >
                  <p className="font-semibold">
                    For {garageName.toUpperCase()}
                  </p>
                  <p className="pt-6">Authorised Signatory</p>
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
