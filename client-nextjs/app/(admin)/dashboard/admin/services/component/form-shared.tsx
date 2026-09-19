"use client";

import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type OptionUser = {
  id: string;
  name?: string;
  email?: string;
};

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function UserSelect({
  control,
  name,
  users,
  placeholder,
}: {
  control: any;
  name: string;
  users: OptionUser[];
  placeholder: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={field.value || ""} onValueChange={field.onChange}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>

          <SelectContent className="bg-card">
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name || user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}

export function MultiUserCheckboxes({
  value,
  users,
  onChange,
}: {
  value: string[];
  users: OptionUser[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) => {
    onChange(
      value.includes(id)
        ? value.filter((item) => item !== id)
        : [...value, id]
    );
  };

  return (
    <div className="grid max-h-40 gap-2 overflow-y-auto rounded-md border p-3">
      {users.map((user) => (
        <label key={user.id} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.includes(user.id)}
            onChange={() => toggle(user.id)}
          />
          {user.name || user.email}
        </label>
      ))}
    </div>
  );
}