import Link from "next/link";

type CustomerSummaryCardProps = {
  customer: any;
  href?: string;
};

export default function CustomerSummaryCard({
  customer,
  href,
}: CustomerSummaryCardProps) {
  const target = href || `/dashboard/admin/users/${customer.id}`;

  return (
    <Link
      href={target}
      className="block moto-card p-4 transition hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Customer
          </p>
          <p className="text-lg font-semibold text-foreground">
            {customer.name || "-"}
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
          {customer.customerCode || "-"}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Mobile</span>
          <span className="font-medium text-right">
            {customer.mobile || "-"}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Address</span>
          <span className="line-clamp-2 max-w-[60%] font-medium text-right">
            {customer.address || "-"}
          </span>
        </div>
      </div>
    </Link>
  );
}
