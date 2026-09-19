export function downloadInvoicePdf(invoice: any, totals: any) {
  const service = invoice?.service ?? {};
  const vehicle = service.vehicle ?? {};
  const customer = service.customer ?? {};
  const lines = [
    "MotoOps Invoice",
    `Invoice: ${invoice.id}`,
    `Date: ${new Date(invoice.createdAt).toLocaleDateString()}`,
    `Customer: ${customer.name ?? "N/A"}`,
    `Vehicle: ${vehicle.registrationNumber ?? "N/A"} ${vehicle.brand ?? ""} ${vehicle.model ?? ""}`,
    `Payment Status: ${invoice.paymentStatus}`,
    "",
    "Totals",
    `Labour Cost: ${Number(totals.labor ?? 0).toFixed(2)}`,
    `Parts Cost: ${Number(totals.parts ?? 0).toFixed(2)}`,
    `Subtotal: ${Number(totals.subtotal ?? 0).toFixed(2)}`,
    `Discount: ${Number(totals.discount ?? 0).toFixed(2)}`,
    `Tax: ${Number(totals.tax ?? 0).toFixed(2)}`,
    `Total: ${Number(totals.total ?? 0).toFixed(2)}`,
    `Paid: ${Number(totals.paid ?? 0).toFixed(2)}`,
    `Due: ${Number(totals.due ?? 0).toFixed(2)}`,
    "",
    "Tasks",
    ...(service.tasks ?? []).map((task: any) => `- ${task.title}: ${Number(task.totalCost ?? 0).toFixed(2)}`),
  ];

  const escaped = lines
    .join("\n")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
  const stream = `BT /F1 12 Tf 50 780 Td 14 TL (${escaped.replace(/\n/g, ") Tj T* (")}) Tj ET`;
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `invoice-${String(invoice.id).slice(0, 8)}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
