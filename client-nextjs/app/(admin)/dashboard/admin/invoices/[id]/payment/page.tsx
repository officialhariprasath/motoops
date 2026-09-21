"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Payment is now a dialog on the invoices list / detail pages. */
export default function UpdateInvoicePaymentPageRedirect() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  useEffect(() => {
    router.replace(`/dashboard/admin/invoices/${invoiceId}`);
  }, [invoiceId, router]);

  return <p className="p-6 text-sm text-muted-foreground">Opening invoice…</p>;
}
