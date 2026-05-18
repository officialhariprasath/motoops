"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Wrench } from "lucide-react";

function money(value: unknown) {
  return Number(value ?? 0).toFixed(2);
}

export default function InvoiceDetailsPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetch(`/api/invoices/${invoiceId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success === false) {
          throw new Error(data?.message || "Failed to load invoice");
        }

        const invoiceData = data?.data ?? data;

        if (!invoiceData) {
          throw new Error("Invoice not found");
        }

        setInvoice(invoiceData);
      })
      .catch((error) => {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load invoice"
        );
      });
  }, [invoiceId]);

  const totals = useMemo(() => {
    const tasks = invoice?.service?.tasks ?? [];
    const labor = tasks.reduce(
      (sum: number, task: any) =>
        sum + Number(task.laborCost || 0) + Number(task.additionalCost || 0),
      0
    );
    const parts = tasks.reduce(
      (sum: number, task: any) => sum + Number(task.partsCost || 0),
      0
    );

    return {
      labor,
      parts,
      subtotal: Number(invoice?.service?.subtotal ?? labor + parts),
      discount: Number(invoice?.service?.discount ?? 0),
      tax: Number(invoice?.service?.tax ?? 0),
      total: Number(invoice?.totalAmount ?? 0),
      paid: Number(invoice?.paidAmount ?? 0),
      due: Number(invoice?.dueAmount ?? 0),
    };
  }, [invoice]);

  if (errorMessage) {
    return <p className="p-6 text-red-600">{errorMessage}</p>;
  }

  if (!invoice) {
    return <p className="p-6">Loading invoice...</p>;
  }

  const service = invoice.service;
  const tasks = service?.tasks ?? [];

  return (
    <div className="mx-auto max-w-5xl p-6">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }

          #invoice-print,
          #invoice-print * {
            visibility: visible;
          }

          #invoice-print {
            position: absolute;
            inset: 0;
            width: 100%;
            border: 0 !important;
            box-shadow: none !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        id="invoice-print"
        className="space-y-8 rounded-lg border bg-white p-8 shadow-sm"
      >
        <header className="flex flex-wrap items-start justify-between gap-6 border-b pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded bg-black text-white">
              <Wrench size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Auto Garage</h1>
              <p className="text-sm text-gray-500">
                Vehicle service and repair invoice
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold">INVOICE</p>
            <p className="text-sm text-gray-500">#{invoice.id.slice(0, 8)}</p>
            <p className="mt-2 text-sm">
              {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
            <span className="mt-2 inline-block rounded bg-slate-100 px-3 py-1 text-sm font-medium capitalize">
              {invoice.paymentStatus}
            </span>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded border p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">
              Bill To
            </p>
            <p className="mt-2 font-semibold">{service?.customer?.name}</p>
            <p className="text-sm text-gray-600">{service?.customer?.email}</p>
            <p className="text-sm text-gray-600">{service?.customer?.mobile}</p>
          </div>

          <div className="rounded border p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">
              Vehicle
            </p>
            <p className="mt-2 font-semibold">
              {service?.vehicle?.registrationNumber}
            </p>
            <p className="text-sm text-gray-600">
              {service?.vehicle?.brand} {service?.vehicle?.model}
            </p>
            <p className="text-sm text-gray-600">
              VIN: {service?.vehicle?.vinNumber || "N/A"}
            </p>
          </div>

          <div className="rounded border p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">
              Service
            </p>
            <p className="mt-2 text-sm">Status: {service?.status}</p>
            <p className="text-sm">Service Date: {service?.serviceDate}</p>
            <p className="text-sm">Delivery Date: {service?.deliveryDate}</p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Service Breakdown</h2>
          <div className="overflow-hidden rounded border">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3">Task</th>
                  <th className="p-3">Completed / Needed Work</th>
                  <th className="p-3 text-right">Labour Cost</th>
                  <th className="p-3 text-right">Parts</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task: any) => {
                  const labourCost =
                    Number(task.laborCost || 0) +
                    Number(task.additionalCost || 0);

                  return (
                    <tr key={task.id} className="border-t align-top">
                      <td className="p-3">
                        <p className="font-medium">{task.title}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {task.description || "No description"}
                        </p>
                      </td>
                      <td className="p-3">
                        {task.subtasks?.length ? (
                          <ul className="space-y-1">
                            {task.subtasks.map((subtask: any) => (
                              <li key={subtask.id}>
                                {subtask.title} - {subtask.status} (
                                {subtask.progress ?? 0}%)
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-500">No subtasks</span>
                        )}

                        {task.parts?.length > 0 && (
                          <div className="mt-3">
                            <p className="font-medium">Parts needed</p>
                            <ul className="mt-1 space-y-1 text-xs text-gray-600">
                              {task.parts.map((part: any) => (
                                <li key={part.id}>
                                  {part.name} x {part.quantity} @{" "}
                                  {money(part.unitPrice)} ={" "}
                                  {money(part.totalPrice)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right">{money(labourCost)}</td>
                      <td className="p-3 text-right">{money(task.partsCost)}</td>
                      <td className="p-3 text-right font-medium">
                        {money(task.totalCost)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="rounded border p-4">
            <p className="font-semibold">Problem / Notes</p>
            <p className="mt-2 text-sm text-gray-600">
              {service?.problemDescription || "No problem description"}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              {service?.notes || "No notes"}
            </p>
          </div>

          <div className="space-y-2 rounded border p-4 text-sm">
            <div className="flex justify-between">
              <span>Labour Cost</span>
              <span>{money(totals.labor)}</span>
            </div>
            <div className="flex justify-between">
              <span>Parts Cost</span>
              <span>{money(totals.parts)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Subtotal</span>
              <span>{money(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span>-{money(totals.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{money(totals.tax)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total</span>
              <span>{money(totals.total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Paid</span>
              <span>{money(totals.paid)}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Due</span>
              <span>{money(totals.due)}</span>
            </div>
          </div>
        </section>

        <footer className="border-t pt-4 text-center text-xs text-gray-500">
          Thank you for choosing Auto Garage.
        </footer>
      </div>

      <button
        onClick={() => window.print()}
        className="no-print mt-6 rounded bg-black px-4 py-2 text-white"
      >
        Print Invoice
      </button>
    </div>
  );
}
