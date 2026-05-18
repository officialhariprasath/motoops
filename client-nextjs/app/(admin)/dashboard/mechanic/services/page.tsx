import ServiceWorkList from "@/components/dashboard/ServiceWorkList";

export default function MechanicServicesPage() {
  return (
    <ServiceWorkList
      mode="mechanic"
      title="Assigned Services"
      description="View assigned service work, task details, checklist progress, and add work comments."
    />
  );
}
