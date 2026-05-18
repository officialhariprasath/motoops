import ServiceWorkList from "@/components/dashboard/ServiceWorkList";

export default function MechanicPage() {
  return (
    <ServiceWorkList
      mode="mechanic"
      title="My Task List"
      description="Services assigned to you as accountable technician or mechanic."
    />
  );
}
