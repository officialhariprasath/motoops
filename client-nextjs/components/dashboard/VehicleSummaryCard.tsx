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
      className="block moto-card p-4 transition hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Vehicle
          </p>
          <p className="text-lg font-semibold text-foreground">
            {vehicle.registrationNumber || "-"}
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
          {vehicle.vehicleCode || "-"}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Make / Model</span>
          <span className="font-medium text-right">
            {[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "-"}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Year</span>
          <span className="font-medium text-right">{vehicle.year || "-"}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Owner</span>
          <span className="font-medium text-right">
            {vehicle.owner?.name || "-"}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Mobile</span>
          <span className="font-medium text-right">
            {vehicle.owner?.mobile || "-"}
          </span>
        </div>
        {vehicle.nextServiceAt && (
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Next service</span>
            <span className="font-medium text-right">
              {String(vehicle.nextServiceAt).slice(0, 10)}
              {vehicle.nextServiceOdometer
                ? ` \u00B7 ${vehicle.nextServiceOdometer} km`
                : ""}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
