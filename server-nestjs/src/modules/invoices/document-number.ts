/** Document numbers: {garagePrefix}E000001 (estimate) / {garagePrefix}I000001 (bill). */

export function normalizeGaragePrefix(value: unknown, fallback = 'JC') {
  const cleaned = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  return cleaned || fallback;
}

export function documentPrefixFor(
  garagePrefix: string,
  documentType: 'ESTIMATE' | 'BILL',
) {
  const base = normalizeGaragePrefix(garagePrefix);
  return documentType === 'ESTIMATE' ? `${base}E` : `${base}I`;
}

export function formatDocumentNumber(prefix: string, sequence: number) {
  const clean = String(prefix || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  return `${clean}${String(Math.max(1, sequence)).padStart(6, '0')}`;
}

export function parseDocumentSequence(invoiceNumber: string, prefix: string) {
  const clean = String(prefix || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  if (!clean) return null;
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = String(invoiceNumber || '').match(
    new RegExp(`^${escaped}(\\d+)$`, 'i'),
  );
  if (!match) return null;
  const sequence = Number(match[1]);
  return Number.isFinite(sequence) ? sequence : null;
}
