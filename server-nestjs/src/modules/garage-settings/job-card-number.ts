/** Shared helpers for {PREFIX}{YYYYMMDD}{NNNN} job card numbers. */

export function normalizeJobCardPrefix(value: unknown, fallback = 'JC') {
  const cleaned = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  return cleaned || fallback;
}

export function dateKeyFromValue(value?: string | Date | null) {
  if (typeof value === 'string') {
    const localMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (localMatch) {
      return `${localMatch[1]}${localMatch[2]}${localMatch[3]}`;
    }
    const compactMatch = value.match(/^(\d{8})$/);
    if (compactMatch) return compactMatch[1];
  }

  const date =
    value instanceof Date
      ? value
      : value
        ? new Date(value)
        : new Date();
  if (Number.isNaN(date.getTime())) {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

export function formatJobCardNumber(
  prefix: string,
  dateKey: string,
  sequence: number,
) {
  const cleanPrefix = normalizeJobCardPrefix(prefix);
  const padded = String(Math.max(1, sequence)).padStart(4, '0');
  return `${cleanPrefix}${dateKey}${padded}`;
}

export function parseJobCardSequence(
  jobCardNumber: string,
  prefix: string,
  dateKey: string,
) {
  const cleanPrefix = normalizeJobCardPrefix(prefix);
  const escaped = cleanPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = String(jobCardNumber || '').match(
    new RegExp(`^${escaped}${dateKey}(\\d{4})$`, 'i'),
  );
  if (!match) return null;
  const sequence = Number(match[1]);
  return Number.isFinite(sequence) ? sequence : null;
}
