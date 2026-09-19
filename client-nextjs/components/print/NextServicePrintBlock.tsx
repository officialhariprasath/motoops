type NextServicePrintBlockProps = {
  nextServiceOdometer?: string | number | null;
  nextServiceAt?: string | Date | null;
  futureWorksNotes?: string | null;
};

function formatDate(value?: string | Date | null) {
  if (!value) return "-";
  const raw = String(value).slice(0, 10);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Dedicated A4 print block for next-service / future works (invoice only when included). */
export function NextServicePrintBlock({
  nextServiceOdometer,
  nextServiceAt,
  futureWorksNotes,
}: NextServicePrintBlockProps) {
  const hasOdo =
    nextServiceOdometer != null && String(nextServiceOdometer).trim() !== "";
  const hasDate = Boolean(nextServiceAt);
  const hasNotes = Boolean(futureWorksNotes && String(futureWorksNotes).trim());

  if (!hasOdo && !hasDate && !hasNotes) return null;

  return (
    <div className="border-t border-[#1d4f91] p-2.5">
      <p className="mb-1 font-semibold">Next Service / Future Works</p>
      {hasOdo && (
        <p>
          <span className="font-semibold">Next Service Odometer :</span>{" "}
          {String(nextServiceOdometer)} km
        </p>
      )}
      {hasDate && (
        <p>
          <span className="font-semibold">Next Service Date :</span>{" "}
          {formatDate(nextServiceAt)}
        </p>
      )}
      {hasNotes && (
        <p className="whitespace-pre-wrap">
          <span className="font-semibold">Future Works :</span>{" "}
          {String(futureWorksNotes)}
        </p>
      )}
    </div>
  );
}
