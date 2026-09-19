import Link from "next/link";
import type { MouseEventHandler } from "react";

import { Button } from "@/components/ui/button";
import {
  formatJobCardStatus,
  normalizeJobCardStatus,
} from "@/lib/job-card-status";

function formatDateTime(value?: string | Date | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

type JobCardSummaryCardProps = {
  service: any;
  href?: string;
  showAssignButton?: boolean;
  onAssignClick?: MouseEventHandler<HTMLButtonElement>;
};

export default function JobCardSummaryCard({
  service,
  href,
  showAssignButton,
  onAssignClick,
}: JobCardSummaryCardProps) {
  const status = normalizeJobCardStatus(service.status);
  const target = href || `/dashboard/admin/services/${service.id}`;
  const assignees = (service.assignedMechanics ?? []) as Array<{
    id: string;
    name?: string;
  }>;
  const isUnassigned = status === "PENDING";
  const assignedLabel = assignees[0]?.name || "Unassigned";

  return (
    <div className="moto-card p-4 transition hover:border-primary/40 hover:shadow-md">
      <Link href={target} className="block">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Job Card
            </p>
            <p className="text-lg font-semibold text-foreground">
              {service.jobCardNumber || "-"}
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
            {formatJobCardStatus(service.status)}
          </span>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Vehicle</span>
            <span className="font-medium text-right">
              {service.vehicle?.registrationNumber || "-"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Make / Model</span>
            <span className="font-medium text-right">
              {[service.vehicle?.brand, service.vehicle?.model]
                .filter(Boolean)
                .join(" ") || "-"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Customer</span>
            <span className="font-medium text-right">
              {service.customer?.name || "-"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Mobile</span>
            <span className="font-medium text-right">
              {service.customer?.mobile || "-"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium text-right">
              {formatDateTime(service.jobCardAt || service.serviceDate)}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Assigned</span>
            <span className="font-medium text-right">
              {assignees.length ? assignedLabel : "Unassigned"}
            </span>
          </div>
        </div>
      </Link>

      {showAssignButton && isUnassigned && onAssignClick && (
        <div className="mt-4 border-t pt-3">
          <Button
            type="button"
            size="sm"
            className="w-full"
            onClick={onAssignClick}
          >
            Assign
          </Button>
        </div>
      )}
    </div>
  );
}
