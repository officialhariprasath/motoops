// File: app/dashboard/users/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import UserForm from "./UserForm";
import { columns } from "./columns";
import { useDeleteActionsEnabled } from "@/lib/delete-settings";
import { useGaragePageSize } from "@/lib/list-settings";
import ListControls from "@/components/dashboard/ListControls";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const getUsers = async () => {
  try {
    const res = await fetch("/api/user");

    if (!res.ok) {
      throw new Error("Failed to fetch users");
    }

    return res.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

async function deleteUser(id: string) {
  const res = await fetch(`/api/user/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete user");
  }

  return res.json();
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const deleteActionsEnabled = useDeleteActionsEnabled();
  const pageSize = useGaragePageSize();
  const [editingUser, setEditingUser] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const usersQuery = useQuery({
    queryKey: ["usersList"],
    queryFn: getUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usersList"] });
    },
  });

  const users = usersQuery.data?.data || [];
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user: any) =>
      [user.name, user.username, user.email, user.mobile, user.designation, user.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const columnsList = columns(
    setEditingUser,
    deleteMutation.mutate,
    deleteActionsEnabled
  );

  const table = useReactTable({
    data: paginatedUsers,
    columns: columnsList,
    getCoreRowModel: getCoreRowModel(),
  });

  if (usersQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (usersQuery.error instanceof Error) {
    return <div>{usersQuery.error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <UserForm
        editingUser={editingUser}
        onSuccess={() => {
          setEditingUser(null);
          queryClient.invalidateQueries({ queryKey: ["usersList"] });
        }}
      />

      <ListControls
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users by name, username, email, mobile, designation, or role"
        page={page}
        totalPages={totalPages}
        totalItems={filteredUsers.length}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columnsList.length} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


