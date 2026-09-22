/** Preset font sizes (px) for estimate / bill sheets. */
export const DOCUMENT_FONT_SIZES = [
  { value: 10, label: "Small (10px)" },
  { value: 11.5, label: "Medium (11.5px)" },
  { value: 13, label: "Large (13px)" },
] as const;

export type DocumentFontSize = (typeof DOCUMENT_FONT_SIZES)[number]["value"];

export const DEFAULT_DOCUMENT_FONT_SIZE: DocumentFontSize = 11.5;

export function resolveDocumentFontSize(raw?: unknown): DocumentFontSize {
  const n = Number(raw);
  const match = DOCUMENT_FONT_SIZES.find((item) => item.value === n);
  // Migrate removed "Extra large" (14.5) → Large
  if (!match && n === 14.5) return 13;
  return match ? match.value : DEFAULT_DOCUMENT_FONT_SIZE;
}

/** Relative sizes so layout stays proportional when base font changes. */
export function documentTypeScale(base: number) {
  return {
    sheet: base,
    garageName: Math.round(base * 1.55 * 10) / 10,
    title: Math.round(base * 1.22 * 10) / 10,
    terms: Math.round(base * 0.87 * 10) / 10,
    grandTotal: Math.round(base * 1.2 * 10) / 10,
  };
}
