"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import ListControls from "@/components/dashboard/ListControls";
import CustomerSummaryCard from "@/components/dashboard/CustomerSummaryCard";
import { useGaragePageSize } from "@/lib/list-settings";

const getUsers = async () => {
  const res = await fetch("/api/user");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
};

export default function UsersPage() {
  const pageSize = useGaragePageSize();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const usersQuery = useQuery({
    queryKey: ["usersList"],
    queryFn: getUsers,
  });

  const customers = useMemo(() => {
    const users = usersQuery.data?.data || [];
    return users.filter(
      (user: any) => String(user.role || "").toLowerCase() === "user"
    );
  }, [usersQuery.data]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((user: any) =>
      [user.name, user.mobile, user.address, user.customerCode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [customers, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / pageSize)
  );
  const paginatedCustomers = filteredCustomers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  if (usersQuery.isLoading) {
    return <div>Loading customers...</div>;
  }

  if (usersQuery.error instanceof Error) {
    return <div className="text-red-600">{usersQuery.error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <ListControls
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, mobile, JMC..."
        page={page}
        totalPages={totalPages}
        totalItems={filteredCustomers.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {paginatedCustomers.map((customer: any) => (
          <CustomerSummaryCard key={customer.id} customer={customer} />
        ))}
        {paginatedCustomers.length === 0 && (
          <div className="col-span-full rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No customers found.
          </div>
        )}
      </div>
    </div>
  );
}
