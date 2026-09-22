"use client";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

function isIosLike() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOs =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOS || iPadOs;
}

async function savePdfBlob(blob: Blob, fileName: string) {
  const file = new File([blob], fileName, { type: "application/pdf" });

  if (isIosLike() && typeof navigator.share === "function") {
    try {
      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName });
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(blob);
  try {
    if (isIosLike()) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}

/**
 * Clone bill/estimate pages off-screen so capture is not affected by preview scale.
 * Supports a multi-page stack (`.estimate-sheet-stack` with several `.estimate-sheet`).
 */
function mountCaptureClone(sheet: HTMLElement): {
  host: HTMLDivElement;
  clone: HTMLElement;
} {
  const host = document.createElement("div");
  host.setAttribute("data-pdf-capture-host", "true");
  host.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    "width:210mm",
    "z-index:-1",
    "pointer-events:none",
    "opacity:1",
    "background:#ffffff",
  ].join(";");

  const clone = sheet.cloneNode(true) as HTMLElement;
  clone.style.transform = "none";
  clone.style.transformOrigin = "top left";
  clone.style.width = `${A4_WIDTH_MM}mm`;
  clone.style.maxWidth = `${A4_WIDTH_MM}mm`;
  clone.style.margin = "0";
  clone.style.boxShadow = "none";
  clone.style.backgroundColor = "#ffffff";

  clone.querySelectorAll(".estimate-sheet").forEach((node) => {
    const page = node as HTMLElement;
    page.style.transform = "none";
    page.style.minHeight = `${A4_HEIGHT_MM}mm`;
    page.style.width = `${A4_WIDTH_MM}mm`;
    page.style.maxWidth = `${A4_WIDTH_MM}mm`;
    page.style.boxShadow = "none";
    page.style.backgroundColor = "#ffffff";
  });

  clone.querySelectorAll("table").forEach((table) => {
    const el = table as HTMLElement;
    el.style.height = "auto";
    el.style.minHeight = "0";
  });
  clone.querySelectorAll("td, th").forEach((node) => {
    const cell = node as HTMLElement;
    cell.style.verticalAlign = "middle";
    cell.style.height = "auto";
  });
  clone.querySelectorAll(".doc-cell-inner").forEach((node) => {
    const inner = node as HTMLElement;
    inner.style.display = "block";
    inner.style.minHeight = "0";
    inner.style.height = "auto";
    inner.style.paddingTop = "6px";
    inner.style.paddingBottom = "6px";
    inner.style.paddingLeft = "4px";
    inner.style.paddingRight = "4px";
    inner.style.lineHeight = "1.25";
    inner.style.boxSizing = "border-box";
  });

  clone.querySelectorAll("[data-doc-align='bottom']").forEach((node) => {
    const el = node as HTMLElement;
    el.style.display = "flex";
    el.style.flexDirection = "column";
    el.style.justifyContent = "flex-end";
    el.style.height = "100%";
  });
  clone.querySelectorAll("[data-doc-align='spread']").forEach((node) => {
    const el = node as HTMLElement;
    el.style.display = "flex";
    el.style.flexDirection = "column";
    el.style.justifyContent = "space-between";
    el.style.height = "100%";
    el.style.minHeight = "5.75rem";
  });

  host.appendChild(clone);
  document.body.appendChild(host);
  return { host, clone };
}

/**
 * Capture A4 estimate/bill sheet(s) and save a real PDF (one PDF page per A4 sheet).
 */
export async function downloadSheetAsPdf(
  sheet: HTMLElement,
  fileName: string
): Promise<void> {
  const [{ domToJpeg }, { jsPDF }] = await Promise.all([
    import("modern-screenshot"),
    import("jspdf"),
  ]);

  const { host, clone } = mountCaptureClone(sheet);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  try {
    const pages = Array.from(
      clone.querySelectorAll(".estimate-sheet")
    ) as HTMLElement[];
    const targets = pages.length > 0 ? pages : [clone];

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    for (let i = 0; i < targets.length; i += 1) {
      const dataUrl = await domToJpeg(targets[i], {
        scale: 2,
        quality: 0.92,
        backgroundColor: "#ffffff",
      });

      if (i > 0) pdf.addPage();
      pdf.addImage(
        dataUrl,
        "JPEG",
        0,
        0,
        A4_WIDTH_MM,
        A4_HEIGHT_MM,
        undefined,
        "FAST"
      );
    }

    const blob = pdf.output("blob");
    await savePdfBlob(
      blob,
      fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`
    );
  } finally {
    host.remove();
  }
}
