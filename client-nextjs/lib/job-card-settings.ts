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

/** Format: {PREFIX}{YYYYMMDD}{NNNN} e.g. JC202609180001 */
export function formatJobCardNumber(prefix: string, dateKey: string, sequence: number) {
  const cleanPrefix = (prefix || "").trim().toUpperCase().replace(/\s+/g, "");
  const padded = String(sequence).padStart(4, "0");
  return `${cleanPrefix}${dateKey}${padded}`;
}

/**
 * Offline/local preview only. Prefer fetchNextJobCardNumber for create forms
 * so prefix + sequence come from the garage account, not this device.
 */
export function previewJobCardNumber(prefix: string, date = new Date()) {
  const cleanPrefix = (prefix || "").trim().toUpperCase().replace(/\s+/g, "");
  const dateKey = dateKeyFromLocal(date);
  return formatJobCardNumber(cleanPrefix, dateKey, 1);
}

export function toDateTimeLocalValue(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
