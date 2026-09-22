"use client";

import { DocumentGarageHeader } from "@/components/print/DocumentGarageHeader";
import { DocumentTableCell } from "@/components/print/DocumentTableCell";
import { NextServicePrintBlock } from "@/components/print/NextServicePrintBlock";
import { OtherDetailsBlock } from "@/components/print/OtherDetailsBlock";
import {
  calcLineAmounts,
  calcLineItemsTotal,
  formatMoney,
  type JobCardLineItem,
} from "@/lib/job-card-items";
import { documentTypeScale } from "@/lib/document-font";
import { paginateLineItems } from "@/lib/document-paginate";
import { numberToWordsIndian } from "@/lib/job-card-status";

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

type Party = {
  name?: string | null;
  mobile?: string | null;
  address?: string | null;
};

type Vehicle = {
  registrationNumber?: string | null;
  mileage?: string | number | null;
};

type BillExtras = {
  includeNextServiceOnBill?: boolean;
  nextServiceOdometer?: string | number | null;
  nextServiceAt?: string | Date | null;
  futureWorksNotes?: string | null;
};

export type ServiceDocumentModel = {
  title: "INVOICE" | "ESTIMATE";
  docNo: string;
  docDateLabel: string;
  paymentStatus?: string | null;
  garageName: string;
  garageAddress?: string;
  garagePhone?: string;
  garageEmail?: string;
  gstin?: string;
  logoUrl: string;
  invoiceNote?: string;
  customer?: Party | null;
  vehicle?: Vehicle | null;
  notes?: string | null;
  items: JobCardLineItem[];
  paidAmount?: number | null;
  dueAmount?: number | null;
  showPaymentOnSheet?: boolean;
  includeNextService?: boolean;
  billExtras?: BillExtras | null;
  nextServiceOdometer?: string | number | null;
  nextServiceAt?: string | Date | null;
  futureWorksNotes?: string | null;
  fontSizePx: number;
};

type Props = {
  model: ServiceDocumentModel;
};

function ItemTable({
  items,
  startIndex,
  showTotal,
  totalAmount,
  totalNet,
}: {
  items: JobCardLineItem[];
  startIndex: number;
  showTotal: boolean;
  totalAmount: number;
  totalNet: number;
}) {
  return (
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
          const { amount, discountAmount, netAmount } = calcLineAmounts(item);
          return (
            <tr key={item.id || `${startIndex}-${index}`}>
              <DocumentTableCell align="center">
                {startIndex + index + 1}
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
        {items.length === 0 && showTotal && (
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
        {showTotal && (
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
        )}
      </tbody>
    </table>
  );
}

function DocumentFooter({
  model,
  typeScale,
  totalNet,
}: {
  model: ServiceDocumentModel;
  typeScale: ReturnType<typeof documentTypeScale>;
  totalNet: number;
}) {
  return (
    <>
      <div className="mt-auto grid grid-cols-[1fr_120px] items-stretch border-t border-[#1d4f91]">
        <OtherDetailsBlock
          notes={model.notes}
          invoiceNote={model.invoiceNote}
          amountInWords={numberToWordsIndian(totalNet)}
          paidAmountLabel={
            model.showPaymentOnSheet
              ? formatMoney(Number(model.paidAmount || 0))
              : null
          }
          dueAmountLabel={
            model.showPaymentOnSheet
              ? formatMoney(Number(model.dueAmount || 0))
              : null
          }
          currentOdometer={model.vehicle?.mileage}
        />
        <div
          data-doc-align="bottom"
          className="flex h-full min-h-full flex-col items-center justify-end gap-2 p-2.5 text-center"
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

      {model.includeNextService && (
        <NextServicePrintBlock
          nextServiceOdometer={
            model.billExtras?.nextServiceOdometer ?? model.nextServiceOdometer
          }
          nextServiceAt={
            model.billExtras?.nextServiceAt ?? model.nextServiceAt
          }
          futureWorksNotes={
            model.billExtras?.futureWorksNotes ?? model.futureWorksNotes
          }
        />
      )}

      <div className="grid grid-cols-3 items-stretch border-t border-[#1d4f91]">
        <div className="border-r border-[#1d4f91] p-2.5">
          <p className="mb-1.5 font-semibold underline">Terms & Conditions</p>
          <ol
            className="list-decimal space-y-0.5 pl-3 leading-snug"
            style={{ fontSize: `${typeScale.terms}px` }}
          >
            <li>Subject to local jurisdiction only.</li>
            <li>
              Our responsibility ceases as soon as the goods leave our premises.
            </li>
            <li>Goods once sold will not be taken back or exchanged.</li>
          </ol>
        </div>
        <div
          data-doc-align="spread"
          className="flex min-h-[5.75rem] flex-col justify-between border-r border-[#1d4f91] p-2.5"
        >
          <p className="font-semibold">Received the goods in good condition</p>
          <p className="pt-6">Signature Receiving Authority</p>
        </div>
        <div
          data-doc-align="spread"
          className="flex min-h-[5.75rem] flex-col justify-between p-2.5 text-right"
        >
          <p className="font-semibold">For {model.garageName.toUpperCase()}</p>
          <p className="pt-6">Authorised Signatory</p>
        </div>
      </div>
    </>
  );
}

/** Multi-page A4 bill/estimate sheets. Footer only on the last page bottom. */
export function ServiceDocumentPages({ model }: Props) {
  const typeScale = documentTypeScale(model.fontSizePx);
  const pages = paginateLineItems(model.items, model.fontSizePx);
  const totalNet = calcLineItemsTotal(model.items);
  const totalAmount = model.items.reduce(
    (sum, item) => sum + calcLineAmounts(item).amount,
    0
  );

  let runningIndex = 0;

  return (
    <>
      {pages.map((pageItems, pageIndex) => {
        const isFirst = pageIndex === 0;
        const isLast = pageIndex === pages.length - 1;
        const startIndex = runningIndex;
        runningIndex += pageItems.length;

        return (
          <div
            key={`doc-page-${pageIndex}`}
            className="estimate-sheet bg-card leading-snug text-foreground shadow-md print:shadow-none"
            style={{
              width: `${A4_WIDTH_MM}mm`,
              minHeight: `${A4_HEIGHT_MM}mm`,
              maxWidth: `${A4_WIDTH_MM}mm`,
              boxSizing: "border-box",
              padding: "8mm",
              fontSize: `${typeScale.sheet}px`,
              marginBottom: isLast ? 0 : "10mm",
              backgroundColor: "#ffffff",
            }}
          >
            <div className="flex h-full min-h-[calc(297mm-16mm)] flex-col border border-[#1d4f91]">
              {isFirst ? (
                <>
                  <DocumentGarageHeader
                    garageName={model.garageName}
                    garageAddress={model.garageAddress}
                    garagePhone={model.garagePhone}
                    garageEmail={model.garageEmail}
                    gstin={model.gstin}
                    logoUrl={model.logoUrl}
                    nameFontSizePx={typeScale.garageName}
                  />

                  <div className="grid grid-cols-2 border-b border-[#1d4f91]">
                    <div className="border-r border-[#1d4f91] p-2.5">
                      <p className="mb-1.5 font-semibold">To</p>
                      <div className="space-y-0.5">
                        <p>
                          <span className="inline-block w-14">Mr.</span>
                          {model.customer?.name || "-"}
                        </p>
                        <p>
                          <span className="inline-block w-14">Mobile</span>
                          {model.customer?.mobile || "-"}
                        </p>
                        {model.customer?.address && (
                          <p className="break-words whitespace-pre-wrap pl-14">
                            {model.customer.address}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p
                        className="mb-2 text-center font-bold tracking-[0.18em]"
                        style={{ fontSize: `${typeScale.title}px` }}
                      >
                        {model.title}
                      </p>
                      <div className="space-y-0.5">
                        <p>
                          <span className="inline-block w-20 font-semibold">
                            NO
                          </span>
                          {model.docNo}
                        </p>
                        <p>
                          <span className="inline-block w-20 font-semibold">
                            DATE
                          </span>
                          {model.docDateLabel}
                        </p>
                        <p>
                          <span className="inline-block w-20 font-semibold">
                            VEHICLE NO
                          </span>
                          {model.vehicle?.registrationNumber || "-"}
                        </p>
                        {model.showPaymentOnSheet && (
                          <p>
                            <span className="inline-block w-20 font-semibold">
                              STATUS
                            </span>
                            <span className="capitalize">
                              {model.paymentStatus || "unpaid"}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between border-b border-[#1d4f91] px-3 py-2">
                  <p className="font-semibold text-[#1d4f91]">
                    {model.garageName.toUpperCase()}
                  </p>
                  <p className="text-center font-bold tracking-wide">
                    {model.title} {model.docNo} (continued)
                  </p>
                  <p className="text-right">
                    Page {pageIndex + 1} of {pages.length}
                  </p>
                </div>
              )}

              <div className={isLast ? "flex-1" : ""}>
                <ItemTable
                  items={pageItems}
                  startIndex={startIndex}
                  showTotal={isLast}
                  totalAmount={totalAmount}
                  totalNet={totalNet}
                />
                {!isLast && (
                  <p className="border border-t-0 border-[#1d4f91] px-2 py-1 text-right text-[0.9em] italic">
                    Continued on next page…
                  </p>
                )}
              </div>

              {isLast && (
                <DocumentFooter
                  model={model}
                  typeScale={typeScale}
                  totalNet={totalNet}
                />
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

export function countDocumentPages(itemCount: number, fontSizePx: number) {
  return paginateLineItems(
    Array.from({ length: itemCount }, (_, i) => ({
      id: String(i),
      description: "x",
      rate: 0,
      quantity: 0,
      discountPercent: 0,
    })),
    fontSizePx
  ).length;
}
