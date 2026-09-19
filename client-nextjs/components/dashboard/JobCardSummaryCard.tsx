import Link from "next/link";

import { formatJobCardStatus } from "@/lib/job-card-status";

function formatDateTime(value?: string | Date | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

type JobCardSummaryCardProps = {
  service: any;
  href?: string;
};

export default function JobCardSummaryCard({
  service,
  href,
}: JobCardSummaryCardProps) {
  const target = href || `/dashboard/admin/services/${service.id}`;

  return (
    <Link
      href={target}
      className="block rounded-xl border bg-white p-4 shadow-sm transition hover:border-slate-400 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Job Card
          </p>
          <p className="text-lg font-semibold text-slate-900">
            {service.jobCardNumber || "—"}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize">
          {formatJobCardStatus(service.status)}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Vehicle</span>
          <span className="font-medium text-right">
            {service.vehicle?.registrationNumber || "—"}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Make / Model</span>
          <span className="font-medium text-right">
            {[service.vehicle?.brand, service.vehicle?.model]
              .filter(Boolean)
              .join(" ") || "—"}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Customer</span>
          <span className="font-medium text-right">
            {service.customer?.name || "—"}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Mobile</span>
          <span className="font-medium text-right">
            {service.customer?.mobile || "—"}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Date</span>
          <span className="font-medium text-right">
            {formatDateTime(service.jobCardAt || service.serviceDate)}
          </span>
        </div>
      </div>

      {service.problemDescription && (
        <p className="mt-4 line-clamp-2 text-sm text-slate-600">
          {service.problemDescription}
        </p>
      )}
    </Link>
  );
}
