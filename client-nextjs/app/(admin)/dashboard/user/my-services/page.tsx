import ServiceWorkList from "@/components/dashboard/ServiceWorkList";

export default function MyServicePage() {
  return (
    <ServiceWorkList
      mode="user"
      title="My Services"
      description="Track your service progress, view mechanic comments, and add comments or questions."
    />
  );
}
