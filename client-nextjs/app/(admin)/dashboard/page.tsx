"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";

async function apiGet(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || "Request failed");
  }

  return json?.data ?? json ?? [];
}

function isSameDay(date: Date, now: Date) {
  return date.toDateString() === now.toDateString();
}

function isSameWeek(date: Date, now: Date) {
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return date >= start && date < end;
}

function isSameMonth(date: Date, now: Date) {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

export default function DashboardPage() {
  const usersQuery = useQuery({
    queryKey: ["dashboard", "users"],
    queryFn: () => apiGet("/api/user"),
  });
  const vehiclesQuery = useQuery({
    queryKey: ["dashboard", "vehicles"],
    queryFn: () => apiGet("/api/vehicles"),
  });
  const servicesQuery = useQuery({
    queryKey: ["dashboard", "services"],
    queryFn: () => apiGet("/api/services"),
  });
  const invoicesQuery = useQuery({
    queryKey: ["dashboard", "invoices"],
    queryFn: () => apiGet("/api/invoices"),
  });

  const revenue = useMemo(() => {
    const now = new Date();
    const invoices = invoicesQuery.data ?? [];

    return invoices.reduce(
      (acc: any, invoice: any) => {
        const date = new Date(invoice.createdAt);
        const amount = Number(invoice.paidAmount || invoice.totalAmount || 0);

        if (isSameDay(date, now)) acc.daily += amount;
        if (isSameWeek(date, now)) acc.weekly += amount;
        if (isSameMonth(date, now)) acc.monthly += amount;

        return acc;
      },
      { daily: 0, weekly: 0, monthly: 0 }
    );
  }, [invoicesQuery.data]);

  const serviceStats = useMemo(() => {
    const services = servicesQuery.data ?? [];
    return {
      total: services.length,
      inProgress: services.filter((service: any) =>
        ["INSPECTION", "CONFIRMED", "IN_PROGRESS"].includes(service.status)
      ).length,
      completed: services.filter((service: any) => service.status === "COMPLETED")
        .length,
    };
  }, [servicesQuery.data]);

  if (
    usersQuery.isLoading ||
    vehiclesQuery.isLoading ||
    servicesQuery.isLoading ||
    invoicesQuery.isLoading
  ) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">
          Live overview of users, vehicles, services, invoices, and revenue.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-medium text-gray-500">Total Users</h2>
            <p className="mt-2 text-3xl font-bold">
              {(usersQuery.data ?? []).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-medium text-gray-500">Vehicles</h2>
            <p className="mt-2 text-3xl font-bold">
              {(vehiclesQuery.data ?? []).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-medium text-gray-500">Active Services</h2>
            <p className="mt-2 text-3xl font-bold">{serviceStats.inProgress}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-medium text-gray-500">Completed</h2>
            <p className="mt-2 text-3xl font-bold">{serviceStats.completed}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-medium text-gray-500">Daily Revenue</h2>
            <p className="mt-2 text-3xl font-bold">{revenue.daily.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-medium text-gray-500">Weekly Revenue</h2>
            <p className="mt-2 text-3xl font-bold">{revenue.weekly.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-medium text-gray-500">Monthly Revenue</h2>
            <p className="mt-2 text-3xl font-bold">
              {revenue.monthly.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
