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

function getDateKey(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
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
  const padded = String(sequence).padStart(4, "0");
  return `${cleanPrefix}${dateKey}${padded}`;
}

export function peekNextJobCardNumber(date = new Date()) {
  const prefix = getJobCardPrefix();
  const dateKey = getDateKey(date);
  const counters = getDailyCounters();
  const next = Math.max(1, Number(counters[dateKey] || 0) + 1);
  return formatJobCardNumber(prefix, dateKey, next);
}

export function consumeNextJobCardNumber(usedNumber?: string, date = new Date()) {
  const dateKey = getDateKey(date);
  const counters = getDailyCounters();
  let next = Math.max(1, Number(counters[dateKey] || 0) + 1);

  if (usedNumber) {
    const match = usedNumber.match(/(\d{4})\s*$/);
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
    })
  );

  return next;
}

export function previewJobCardNumber(prefix: string, date = new Date()) {
  const cleanPrefix = (prefix || "").trim().toUpperCase().replace(/\s+/g, "");
  const dateKey = getDateKey(date);
  const counters = getDailyCounters();
  const next = Math.max(1, Number(counters[dateKey] || 0) + 1);
  return formatJobCardNumber(cleanPrefix, dateKey, next);
}

export function toDateTimeLocalValue(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
