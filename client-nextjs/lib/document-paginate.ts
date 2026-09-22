import type { JobCardLineItem } from "@/lib/job-card-items";

/**
 * Split line items across A4 pages so the footer (other details / terms /
 * signatures) always sits on the last page bottom instead of overflowing.
 */
export function paginateLineItems(
  items: JobCardLineItem[],
  fontSizePx = 11.5
): JobCardLineItem[][] {
  const withFooter =
    fontSizePx <= 10 ? 14 : fontSizePx <= 11.5 ? 11 : 8;
  const fullPage =
    fontSizePx <= 10 ? 28 : fontSizePx <= 11.5 ? 24 : 18;

  if (items.length === 0) return [[]];
  if (items.length <= withFooter) return [items];

  const pages: JobCardLineItem[][] = [];
  const firstChunkTotal = items.length - withFooter;
  let start = 0;

  while (start < firstChunkTotal) {
    const end = Math.min(start + fullPage, firstChunkTotal);
    pages.push(items.slice(start, end));
    start = end;
  }

  pages.push(items.slice(start));
  return pages;
}
