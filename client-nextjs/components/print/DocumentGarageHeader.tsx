type DocumentGarageHeaderProps = {
  garageName: string;
  garageAddress?: string;
  garagePhone?: string;
  garageEmail?: string;
  gstin?: string;
  logoUrl: string;
};

/**
 * A4 estimate/bill header: centered garage details with corner logo
 * that scales with how tall the header is (more contact lines → larger logo).
 */
export function DocumentGarageHeader({
  garageName,
  garageAddress,
  garagePhone,
  garageEmail,
  gstin,
  logoUrl,
}: DocumentGarageHeaderProps) {
  const contactLine = [garagePhone ? `Mobile: ${garagePhone}` : null, garageEmail ? `Email: ${garageEmail}` : null]
    .filter(Boolean)
    .join(" | ");

  const extraLines =
    (garageAddress ? 1 : 0) + (contactLine ? 1 : 0) + (gstin ? 1 : 0);

  // Taller header (more fields) → larger corner logo; still capped for print.
  const logoSizeClass =
    extraLines >= 3
      ? "h-[4.25rem] max-w-[7.5rem]"
      : extraLines === 2
        ? "h-[3.5rem] max-w-[6.5rem]"
        : extraLines === 1
          ? "h-12 max-w-[5.5rem]"
          : "h-10 max-w-[4.75rem]";

  return (
    <div className="relative border-b border-[#1d4f91] px-3 py-2.5 text-center">
      <img
        src={logoUrl}
        alt=""
        crossOrigin="anonymous"
        className={`pointer-events-none absolute left-2 top-1/2 z-10 w-auto -translate-y-1/2 object-contain object-left ${logoSizeClass}`}
      />
      <h2 className="text-[18px] font-bold tracking-wide text-[#1d4f91]">
        {garageName.toUpperCase()}
      </h2>
      {garageAddress ? (
        <p className="mt-1 leading-snug">{garageAddress}</p>
      ) : null}
      {contactLine ? <p className="mt-0.5">{contactLine}</p> : null}
      {gstin ? (
        <p className="mt-0.5 font-medium">GSTIN : {gstin}</p>
      ) : null}
    </div>
  );
}
