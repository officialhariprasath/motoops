// File: app/dashboard/users/UserForm.tsx

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePasswordEditingEnabled } from "@/lib/profile-settings";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  name: z.string().min(2, "Name required"),
  username: z.string().min(3, "Username required"),
  email: z.string().email("Valid email required"),
  mobile: z.string().min(6, "Valid mobile required"),
  address: z.string().min(3, "Address required"),
  designation: z.string().optional(),
  role: z.enum(["admin", "mechanic", "user"]),
  password: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  editingUser?: any;
  onSuccess: () => void;
};

export default function UserForm({ editingUser, onSuccess }: Props) {
  const passwordEditingEnabled = usePasswordEditingEnabled();
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      mobile: "",
      address: "",
      designation: "",
      role: "user",
      password: "",
    },
  });

  useEffect(() => {
    if (editingUser) {
      reset({
        name: editingUser.name || "",
        username: editingUser.username || "",
        email: editingUser.email || "",
        mobile: editingUser.mobile || "",
        address: editingUser.address || "",
        designation: editingUser.designation || "",
        role: editingUser.role || "user",
        password: "",
      });
    }
  }, [editingUser, reset]);

  async function onSubmit(data: FormData) {
    setErrorMessage("");

    const payload: any = { ...data };

    if (!passwordEditingEnabled || !payload.password?.trim()) {
      delete payload.password;
    }

    const response = editingUser
      ? await fetch(`/api/user/${editingUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, password: payload.password || "123456" }),
        });

    const json = await response.json();

    if (!response.ok) {
      setErrorMessage(json?.message || "Failed to save user");
      return;
    }

    reset({
      name: "",
      username: "",
      email: "",
      mobile: "",
      address: "",
      designation: "",
      role: "user",
      password: "",
    });
    onSuccess();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-6 md:grid-cols-3"
    >
      {errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-3">
          {errorMessage}
        </div>
      )}

      <div>
        <Input placeholder="Name" {...register("name")} />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Input placeholder="Username" {...register("username")} />
        {errors.username && (
          <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
        )}
      </div>

      <div>
        <Input placeholder="Email" {...register("email")} />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Input placeholder="Mobile" {...register("mobile")} />
        {errors.mobile && (
          <p className="mt-1 text-sm text-red-500">{errors.mobile.message}</p>
        )}
      </div>

      <div>
        <Input placeholder="Address" {...register("address")} />
        {errors.address && (
          <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>
        )}
      </div>

      <div>
        <Input placeholder="Designation (mechanics only)" {...register("designation")} />
        <p className="mt-1 text-xs text-muted-foreground">Admin-managed field for seniority or lead role.</p>
      </div>

      {passwordEditingEnabled && (
        <div>
          <Input
            type="password"
            placeholder={editingUser ? "New Password (optional)" : "Password"}
            {...register("password")}
          />
        </div>
      )}

      <div className="z-100">
        <Select
          value={watch("role")}
          onValueChange={(value) => setValue("role", value as FormData["role"])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Role" />
          </SelectTrigger>
          <SelectContent className="bg-card">
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="mechanic">Mechanic</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>
        )}
      </div>

      <Button type="submit" className="md:col-span-3">
        {editingUser ? "Update User" : "Create User"}
      </Button>
    </form>
  );
}


