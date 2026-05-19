import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const getVehicle = async (id: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/vehicles/${id}`, {
    cache: "no-store",
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || "Failed to load vehicle");
  }

  return json?.data ?? json;
};

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md border bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
      <p className="mt-1 break-all text-sm font-semibold text-gray-900">
        {value || "Not recorded"}
      </p>
    </div>
  );
}

export default async function VehicleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = await getVehicle(id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Vehicle Details</h1>
          <p className="text-sm text-gray-500">
            Registration, owner, and workshop reference information.
          </p>
        </div>

        <Link href="/dashboard/admin/vehicles">
          <Button variant="outline">Back to Vehicles</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-5">
            <div>
              <p className="text-sm text-gray-500">Registration Number</p>
              <h2 className="text-2xl font-bold">
                {vehicle.registrationNumber}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {vehicle.brand} {vehicle.model} {vehicle.year}
              </p>
            </div>

            <div className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
              {vehicle.color || "Color N/A"}
            </div>
          </div>

          <section>
            <h3 className="mb-3 font-semibold">Owner Information</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <DetailItem label="Owner" value={vehicle.owner?.name} />
              <DetailItem label="Email" value={vehicle.owner?.email} />
              <DetailItem label="Mobile" value={vehicle.owner?.mobile} />
              <DetailItem label="Address" value={vehicle.owner?.address} />
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-semibold">Vehicle Information</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <DetailItem label="Brand" value={vehicle.brand} />
              <DetailItem label="Model" value={vehicle.model} />
              <DetailItem label="Year" value={vehicle.year} />
              <DetailItem label="Color" value={vehicle.color} />
              <DetailItem label="Mileage" value={vehicle.mileage} />
              <DetailItem label="VIN Number" value={vehicle.vinNumber} />
              <DetailItem label="Engine Number" value={vehicle.engineNumber} />
              <DetailItem label="Chassis Number" value={vehicle.chassisNumber} />
              <DetailItem
                label="Created"
                value={
                  vehicle.createdAt
                    ? new Date(vehicle.createdAt).toLocaleDateString()
                    : undefined
                }
              />
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

