"use client";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

function isIosLike() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOS || iPadOs;
}

async function savePdfBlob(blob: Blob, fileName: string) {
  const file = new File([blob], fileName, { type: "application/pdf" });

  // iOS PWA / Safari: share sheet lets the user Save to Files without print chrome
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
      // Safari often ignores <a download> for blobs — open the PDF so user can share/save
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
 * Capture an on-screen A4 estimate/bill sheet and save a real PDF.
 * Avoids browser print chrome (URL, date/time, page numbers) that appears on iOS.
 */
export async function downloadSheetAsPdf(
  sheet: HTMLElement,
  fileName: string
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const previousTransform = sheet.style.transform;
  const previousOrigin = sheet.style.transformOrigin;
  sheet.style.transform = "none";
  sheet.style.transformOrigin = "top left";

  // Let layout settle after removing preview scale
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  try {
    const canvas = await html2canvas(sheet, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: sheet.scrollWidth,
      windowHeight: sheet.scrollHeight,
      onclone: (_doc, cloned) => {
        // Ensure cloned sheet is unscaled and opaque for capture
        const cloneSheet = cloned.classList?.contains("estimate-sheet")
          ? cloned
          : cloned.querySelector?.(".estimate-sheet");
        if (cloneSheet instanceof HTMLElement) {
          cloneSheet.style.transform = "none";
          cloneSheet.style.backgroundColor = "#ffffff";
        }
      },
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = A4_WIDTH_MM;
    const pageHeight = A4_HEIGHT_MM;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL("image/jpeg", 0.92);

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight;

    while (heightLeft > 1) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;
    }

    const blob = pdf.output("blob");
    await savePdfBlob(blob, fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
  } finally {
    sheet.style.transform = previousTransform;
    sheet.style.transformOrigin = previousOrigin;
  }
}
