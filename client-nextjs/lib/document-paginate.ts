import type { JobCardLineItem } from "@/lib/job-card-items";

/** How many line-item rows fit on one A4 page (no footer). */
function rowsOnFullPage(fontSizePx: number) {
  if (fontSizePx <= 10) return 34;
  if (fontSizePx <= 11.5) return 28;
  return 24;
}

/** How many line-item rows fit on the last A4 page together with the footer. */
function rowsWithFooter(fontSizePx: number) {
  if (fontSizePx <= 10) return 20;
  if (fontSizePx <= 11.5) return 16;
  return 13;
}

/**
 * Split line items across A4 pages, filling each page as much as possible.
 * Footer (other details / terms / signatures) only appears on the last page.
 */
export function paginateLineItems(
  items: JobCardLineItem[],
  fontSizePx = 11.5
): JobCardLineItem[][] {
  const fullPage = rowsOnFullPage(fontSizePx);
  const withFooter = rowsWithFooter(fontSizePx);

  if (items.length === 0) return [[]];
  if (items.length <= withFooter) return [items];

  const pages: JobCardLineItem[][] = [];
  let remaining = items;

  while (remaining.length > 0) {
    // Remainder fits on a final page with footer
    if (remaining.length <= withFooter) {
      pages.push(remaining);
      break;
    }

    // Remainder fits on one content page but not with footer →
    // fill this page as much as possible; leave the rest for the footer page
    if (remaining.length <= fullPage) {
      const nowCount = Math.min(fullPage, remaining.length - 1);
      pages.push(remaining.slice(0, nowCount));
      pages.push(remaining.slice(nowCount));
      break;
    }

    // Fill a full continuation page
    pages.push(remaining.slice(0, fullPage));
    remaining = remaining.slice(fullPage);
  }

  return pages;
}
