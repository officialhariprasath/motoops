export const INDIAN_BIKE_MAKERS = [
  "Hero",
  "Honda",
  "Bajaj",
  "TVS",
  "Yamaha",
  "Royal Enfield",
  "Suzuki",
  "KTM",
  "Kawasaki",
  "Harley-Davidson",
  "Triumph",
  "BMW Motorrad",
  "Benelli",
  "Jawa",
  "Yezdi",
  "Mahindra",
  "Aprilia",
  "Vespa",
  "Piaggio",
  "Ather",
  "Ola Electric",
  "Revolt",
  "Ultraviolette",
  "Simple Energy",
  "Bounce Infinity",
  "Matter",
  "Okaya",
  "Ampere",
  "Hero Electric",
  "Other",
] as const;

export type IndianBikeMaker = (typeof INDIAN_BIKE_MAKERS)[number];

const SETTINGS_KEY = "garageSettings";
const DAILY_COUNTER_KEY = "jobCardDailyCounters";

export function getGarageSettings(): Record<string, any> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function getJobCardPrefix() {
  const saved = getGarageSettings();
  return String(saved.jobCardPrefix ?? "JC")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export function dateKeyFromLocal(date: Date | string = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  if (typeof date === "string") {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}${match[2]}${match[3]}`;
  }
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function getDailyCounters(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(DAILY_COUNTER_KEY) || "{}");
  } catch {
    return {};
  }
}

/** Format: {PREFIX}{YYYYMMDD}{NNNN} e.g. JC202609180001 */
export function formatJobCardNumber(prefix: string, dateKey: string, sequence: number) {
  const cleanPrefix = (prefix || "").trim().toUpperCase().replace(/\s+/g, "");
  const padded = String(Math.max(1, sequence)).padStart(4, "0");
  return `${cleanPrefix}${dateKey}${padded}`;
}

/**
 * Instant preview from cached garage prefix + local daily counter.
 * Server still assigns/corrects the real free number on save (Option A).
 */
export function peekNextJobCardNumber(date: Date | string = new Date()) {
  const prefix = getJobCardPrefix();
  const dateKey = dateKeyFromLocal(date);
  const counters = getDailyCounters();
  const next = Math.max(1, Number(counters[dateKey] || 0) + 1);
  return formatJobCardNumber(prefix, dateKey, next);
}

/**
 * After a successful create, advance the local counter using the number
 * the server actually saved (may differ from the preview by 1).
 */
export function consumeNextJobCardNumber(
  usedNumber?: string,
  date: Date | string = new Date(),
) {
  if (typeof window === "undefined") return 0;
  const dateKey = dateKeyFromLocal(date);
  const counters = getDailyCounters();
  let next = Math.max(1, Number(counters[dateKey] || 0) + 1);

  if (usedNumber) {
    const match = String(usedNumber).match(/(\d{4})\s*$/);
    if (match) {
      const usedSeq = Number(match[1]);
      if (!Number.isNaN(usedSeq) && usedSeq >= next) {
        next = usedSeq;
      }
    }
  }

  localStorage.setItem(
    DAILY_COUNTER_KEY,
    JSON.stringify({
      ...counters,
      [dateKey]: next,
    }),
  );

  return next;
}

/**
 * Soft-align local counter from the server's *next free* candidate
 * (e.g. RM…0004 means max used today is 0003). Never blocks the UI.
 */
export function alignLocalCounterFromServerNext(nextJobCardNumber: string) {
  if (typeof window === "undefined") return;
  const match = String(nextJobCardNumber || "").match(/(\d{8})(\d{4})$/);
  if (!match) return;
  const dateKey = match[1];
  const nextSeq = Number(match[2]);
  if (!Number.isFinite(nextSeq) || nextSeq < 1) return;

  const maxUsed = nextSeq - 1;
  const counters = getDailyCounters();
  const current = Number(counters[dateKey] || 0);
  if (maxUsed <= current) return;

  localStorage.setItem(
    DAILY_COUNTER_KEY,
    JSON.stringify({
      ...counters,
      [dateKey]: maxUsed,
    }),
  );
}

export function previewJobCardNumber(prefix: string, date: Date | string = new Date()) {
  const cleanPrefix = (prefix || "").trim().toUpperCase().replace(/\s+/g, "");
  const dateKey = dateKeyFromLocal(date);
  const counters = getDailyCounters();
  const next = Math.max(1, Number(counters[dateKey] || 0) + 1);
  return formatJobCardNumber(cleanPrefix, dateKey, next);
}

export function toDateTimeLocalValue(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
