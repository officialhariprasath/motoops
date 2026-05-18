import ServiceWorkList from "@/components/dashboard/ServiceWorkList";

export default function UserDashboardPage() {
  return (
    <ServiceWorkList
      mode="user"
      title="Dashboard"
      description="Your current vehicle services and recent task comments."
    />
  );
}
