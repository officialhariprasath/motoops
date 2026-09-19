type OtherDetailsBlockProps = {
  notes?: string | null;
  invoiceNote?: string | null;
  amountInWords: string;
  /** Invoice-only payment line */
  paidAmountLabel?: string | null;
  dueAmountLabel?: string | null;
  /** Current odometer from vehicle */
  currentOdometer?: string | number | null;
};

/** Shared A4 print "Other Details" block for estimate + invoice. */
export function OtherDetailsBlock({
  notes,
  invoiceNote,
  amountInWords,
  paidAmountLabel,
  dueAmountLabel,
  currentOdometer,
}: OtherDetailsBlockProps) {
  return (
    <div className="space-y-1 border-r border-[#1d4f91] p-2.5">
      <p className="font-semibold">Other Details</p>
      <p>
        <span className="font-semibold">Payment Terms :</span> IMMEDIATE
      </p>
      {paidAmountLabel != null && dueAmountLabel != null && (
        <p>
          <span className="font-semibold">Paid / Due :</span> ₹{paidAmountLabel}{" "}
          / ₹{dueAmountLabel}
        </p>
      )}
      {currentOdometer != null && currentOdometer !== "" && (
        <p>
          <span className="font-semibold">Current Odometer :</span>{" "}
          {String(currentOdometer)}
        </p>
      )}
      <p>
        <span className="font-semibold">Notes :</span>{" "}
        {notes || invoiceNote || ""}
      </p>
      <p className="pt-1 font-medium">{amountInWords}</p>
    </div>
  );
}
