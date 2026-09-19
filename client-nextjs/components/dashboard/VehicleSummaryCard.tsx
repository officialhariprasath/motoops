import Link from "next/link";

type VehicleSummaryCardProps = {
  vehicle: any;
  href?: string;
};

export default function VehicleSummaryCard({
  vehicle,
  href,
}: VehicleSummaryCardProps) {
  const target = href || `/dashboard/admin/vehicles/${vehicle.id}`;

  return (
    <Link
      href={target}
      className="block rounded-xl border bg-white p-4 shadow-sm transition hover:border-slate-400 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Vehicle
          </p>
          <p className="text-lg font-semibold text-slate-900">
            {vehicle.registrationNumber || "—"}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
          {vehicle.vehicleCode || "—"}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Make / Model</span>
          <span className="font-medium text-right">
            {[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "—"}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Year</span>
          <span className="font-medium text-right">{vehicle.year || "—"}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Owner</span>
          <span className="font-medium text-right">
            {vehicle.owner?.name || "—"}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Mobile</span>
          <span className="font-medium text-right">
            {vehicle.owner?.mobile || "—"}
          </span>
        </div>
      </div>
    </Link>
  );
}
