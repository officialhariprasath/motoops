export const JOB_CARD_STATUSES = [
  { value: "PENDING", label: "Unassigned" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export type JobCardStatus = (typeof JOB_CARD_STATUSES)[number]["value"];

const LEGACY_STATUS_MAP: Record<string, JobCardStatus> = {
  INSPECTION: "IN_PROGRESS",
  CONFIRMED: "IN_PROGRESS",
};

export function normalizeJobCardStatus(status?: string | null): JobCardStatus {
  if (!status) return "PENDING";
  if (status in LEGACY_STATUS_MAP) return LEGACY_STATUS_MAP[status];
  if (JOB_CARD_STATUSES.some((item) => item.value === status)) {
    return status as JobCardStatus;
  }
  return "PENDING";
}

export function formatJobCardStatus(status?: string | null) {
  const normalized = normalizeJobCardStatus(status);
  const match = JOB_CARD_STATUSES.find((item) => item.value === normalized);
  return match?.label ?? normalized.replace(/_/g, " ");
}

export function numberToWordsIndian(amount: number) {
  const ones = [
    "",
    "ONE",
    "TWO",
    "THREE",
    "FOUR",
    "FIVE",
    "SIX",
    "SEVEN",
    "EIGHT",
    "NINE",
    "TEN",
    "ELEVEN",
    "TWELVE",
    "THIRTEEN",
    "FOURTEEN",
    "FIFTEEN",
    "SIXTEEN",
    "SEVENTEEN",
    "EIGHTEEN",
    "NINETEEN",
  ];
  const tens = [
    "",
    "",
    "TWENTY",
    "THIRTY",
    "FORTY",
    "FIFTY",
    "SIXTY",
    "SEVENTY",
    "EIGHTY",
    "NINETY",
  ];

  const twoDigits = (n: number) => {
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return `${tens[t]}${o ? ` ${ones[o]}` : ""}`.trim();
  };

  const threeDigits = (n: number) => {
    const h = Math.floor(n / 100);
    const r = n % 100;
    if (h && r) return `${ones[h]} HUNDRED ${twoDigits(r)}`;
    if (h) return `${ones[h]} HUNDRED`;
    return twoDigits(r);
  };

  const whole = Math.floor(Math.abs(amount));
  if (whole === 0) return "RUPEES ZERO ONLY";

  const crore = Math.floor(whole / 10000000);
  const lakh = Math.floor((whole % 10000000) / 100000);
  const thousand = Math.floor((whole % 100000) / 1000);
  const hundred = whole % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${twoDigits(crore)} CRORE`);
  if (lakh) parts.push(`${twoDigits(lakh)} LAKH`);
  if (thousand) parts.push(`${twoDigits(thousand)} THOUSAND`);
  if (hundred) parts.push(threeDigits(hundred));

  return `RUPEES ${parts.join(" ")} ONLY`;
}
