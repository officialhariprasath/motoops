"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(2, "Name required"),
  username: z.string().min(3, "Username required"),
  email: z.string().email("Valid email required"),
  mobile: z.string().min(8, "Valid mobile required"),
  address: z.string().min(3, "Address required"),
  designation: z.string().optional(),
  password: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  editingUser?: any;
  onSuccess: () => void;
};

export default function WorkforceEmployeeForm({
  editingUser,
  onSuccess,
}: Props) {
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
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
        password: "",
      });
    } else {
      reset({
        name: "",
        username: "",
        email: "",
        mobile: "",
        address: "",
        designation: "",
        password: "ChangeMe123",
      });
    }
  }, [editingUser, reset]);

  async function onSubmit(data: FormData) {
    setErrorMessage("");
    setSaving(true);

    const payload: any = {
      ...data,
      role: "mechanic",
    };

    if (editingUser) {
      if (!payload.password?.trim()) delete payload.password;
    } else {
      payload.password = payload.password?.trim() || "ChangeMe123";
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
          body: JSON.stringify(payload),
        });

    const json = await response.json();
    setSaving(false);

    if (!response.ok) {
      setErrorMessage(
        json?.message ||
          (Array.isArray(json?.message)
            ? json.message.join(", ")
            : "Failed to save employee")
      );
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Full name</span>
          <Input {...register("name")} />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Username (login)</span>
          <Input {...register("username")} />
          {errors.username && (
            <p className="mt-1 text-xs text-red-600">
              {errors.username.message}
            </p>
          )}
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Email</span>
          <Input type="email" {...register("email")} />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Mobile</span>
          <Input {...register("mobile")} />
          {errors.mobile && (
            <p className="mt-1 text-xs text-red-600">{errors.mobile.message}</p>
          )}
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="mb-1 block font-medium">Address</span>
          <Input {...register("address")} />
          {errors.address && (
            <p className="mt-1 text-xs text-red-600">
              {errors.address.message}
            </p>
          )}
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Designation</span>
          <Input
            placeholder="Senior Mechanic"
            {...register("designation")}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">
            {editingUser ? "New password (optional)" : "Temporary password"}
          </span>
          <Input type="text" {...register("password")} />
          <p className="mt-1 text-xs text-muted-foreground">
            {editingUser
              ? "Leave blank to keep current password."
              : "Default ChangeMe123 - share with the employee."}
          </p>
        </label>
      </div>

      {errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}

      <Button type="submit" disabled={saving}>
        {saving
          ? "Saving..."
          : editingUser
            ? "Update employee"
            : "Create employee login"}
      </Button>
    </form>
  );
}
