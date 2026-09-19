"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePasswordEditingEnabled } from "@/lib/profile-settings";

const baseSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  mobile: z.string().min(6, "Mobile is required"),
  address: z.string().min(3, "Address is required"),
  password: z.string().optional(),
});

type ProfileFormData = z.infer<typeof baseSchema>;

export default function ProfilePage() {
  const passwordEditingEnabled = usePasswordEditingEnabled();
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      address: "",
      password: "",
    },
  });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;

    const parsed = JSON.parse(stored);
    setUser(parsed);

    fetch(`/api/user/${parsed.id}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        const latest = json?.data ?? json;
        setUser(latest);
        reset({
          name: latest.name || "",
          email: latest.email || "",
          mobile: latest.mobile || "",
          address: latest.address || "",
          password: "",
        });
      })
      .catch(() => {
        reset({
          name: parsed.name || "",
          email: parsed.email || "",
          mobile: parsed.mobile || "",
          address: parsed.address || "",
          password: "",
        });
      });
  }, [reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user?.id) return;

    setMessage("");
    setErrorMessage("");

    const payload: any = {
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      address: data.address,
    };

    if (passwordEditingEnabled && data.password?.trim()) {
      payload.password = data.password.trim();
    }

    const res = await fetch(`/api/user/${user.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      setErrorMessage(json?.message || "Failed to update profile");
      return;
    }

    const updatedUser = json?.data ?? json;
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const nextUser = {
      ...storedUser,
      id: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      mobile: updatedUser.mobile,
      address: updatedUser.address,
      role: updatedUser.role,
      designation: updatedUser.designation,
    };

    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
    reset({
      name: nextUser.name || "",
      email: nextUser.email || "",
      mobile: nextUser.mobile || "",
      address: nextUser.address || "",
      password: "",
    });
    setMessage("Profile updated successfully.");
  };

  return (
    <div className="max-w-3xl space-y-6">
      {message && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <Input {...register("name")} />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Username</label>
              <Input value={user?.username || ""} disabled />
              <p className="mt-1 text-xs text-gray-500">
                Username cannot be changed from profile.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Designation</label>
              <Input value={user?.designation || "Not assigned"} disabled />
              <p className="mt-1 text-xs text-gray-500">Only admin can update this field.</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <Input type="email" {...register("email")} />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Mobile</label>
              <Input {...register("mobile")} />
              {errors.mobile && (
                <p className="mt-1 text-sm text-red-500">{errors.mobile.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Address</label>
            <Textarea {...register("address")} />
            {errors.address && (
              <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>

          {passwordEditingEnabled ? (
            <div>
              <label className="mb-1 block text-sm font-medium">
                New Password
              </label>
              <Input type="password" {...register("password")} />
              <p className="mt-1 text-xs text-gray-500">
                Leave blank to keep the current password.
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Password editing is currently disabled from Settings.
            </div>
          )}

          <Button type="button" disabled={isSubmitting} onClick={handleSubmit(onSubmit)}>
            {isSubmitting ? "Saving..." : "Update Profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


