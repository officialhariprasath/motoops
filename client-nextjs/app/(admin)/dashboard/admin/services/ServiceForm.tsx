// File: ServiceForm.tsx

"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {VehicleSearchField} from "./searchable_Vehicle_Combobox"
import { TaskCard } from "./component/TaskCard";
import { Field } from "./component/form-shared";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OptionUser = { id: string; name?: string; email?: string };
type OptionVehicle = {
  id: string;
  registrationNumber?: string;
  brand?: string;
  model?: string;
  owner?: { id: string; name?: string };
};

type Props = {
  editingService?: any;
};

const optionalId = z.string().optional().or(z.literal(""));

const commentSchema = z.object({
  id: optionalId,
  message: z.string().min(1, "Comment is required"),
  internal: z.coerce.boolean().default(false),
  status: optionalId,
});

const subTaskSchema = z.object({
  id: optionalId,

  title: z.string().min(1, "Subtask title is required"),

  assignedToId: optionalId,

  status: z.enum([
    "PENDING",
    "IN_PROGRESS",
    "ON_HOLD",
    "COMPLETED",
  ]).default("PENDING"),

  estimatedDuration: z.coerce.number().min(0).default(0),

  progress: z.coerce.number().min(0).max(100).default(0),
});

const partSchema = z.object({
  id: optionalId,
  name: z.string().min(1, "Part name is required"),
  partNumber: optionalId,
  quantity: z.coerce.number().min(0),
  unitPrice: z.coerce.number().min(0),
});

const taskSchema = z.object({
  id: optionalId,
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  ownerId: optionalId,
  accountableTechnicianId: optionalId,
  mechanicIds: z.array(z.string()).default([]),
  laborCost: z.coerce.number().min(0),
  additionalCost: z.coerce.number().min(0),
  parts: z.array(partSchema).default([]),
  subtasks: z.array(subTaskSchema).default([]),
  comments: z.array(commentSchema).default([]),
});

const schema = z.object({
  status: z.enum(["PENDING","INSPECTION", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  problemDescription: z.string().optional(),
  notes: z.string().optional(),
  serviceDate: z.string().min(1, "Service date is required"),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  vehicleId: z.string().min(1, "Vehicle is required"),
  customerId: z.string().min(1, "Customer is required"),
  discount: z.coerce.number().min(0),
  tax: z.coerce.number().min(0),
  tasks: z.array(taskSchema).min(1, "Add at least one task"),
});

type ServiceFormInput = z.input<typeof schema>;
type ServiceFormData = z.output<typeof schema>;

const emptyTask = (): ServiceFormData["tasks"][number] => ({
  title: "",
  description: "",
  ownerId: "",
  accountableTechnicianId: "",
  mechanicIds: [],
  laborCost: 0,
  additionalCost: 0,
  parts: [],
  subtasks: [],
  comments: [],
});

function getErrorMessages(errors: unknown): string[] {
  if (!errors || typeof errors !== "object") {
    return [];
  }

  if (Array.isArray(errors)) {
    return errors.flatMap(getErrorMessages);
  }

  const record = errors as Record<string, unknown>;
  const ownMessage =
    typeof record.message === "string" ? [record.message] : [];

  const childMessages = Object.entries(record)
    .filter(([key]) => key !== "ref" && key !== "message" && key !== "type")
    .flatMap(([, value]) => getErrorMessages(value));

  return [...ownMessage, ...childMessages];
}

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Request failed");
  return json.data ?? json;
}

const getVehicles = () => apiGet<OptionVehicle[]>("/api/vehicles");
const getMechanics = () => apiGet<OptionUser[]>("/api/user");

function normalizeService(service: any): ServiceFormData {
  return {
    status: service?.status ?? "PENDING",
    problemDescription: service?.problemDescription ?? "",
    notes: service?.notes ?? "",
    serviceDate: service?.serviceDate?.slice?.(0, 10) ?? "",
    deliveryDate: service?.deliveryDate?.slice?.(0, 10) ?? "",
    vehicleId: service?.vehicle?.id ?? service?.vehicleId ?? "",
    customerId: service?.customer?.id ?? service?.customerId ?? service?.vehicle?.owner?.id ?? "",
    discount: Number(service?.discount ?? 0),
    tax: Number(service?.tax ?? 0),
    tasks: (service?.tasks ?? []).map((task: any) => ({
      id: task.id ?? "",
      title: task.title ?? "",
      description: task.description ?? "",
      ownerId: task.owner?.id ?? task.ownerId ?? task.createdBy?.id ?? "",
      accountableTechnicianId: task.accountableTechnician?.id ?? task.accountableTechnicianId ?? "",
      mechanicIds: task.mechanics?.map((mechanic: any) => mechanic.id) ?? task.mechanicIds ?? [],
      laborCost: Number(task.laborCost ?? 0),
      additionalCost: Number(task.additionalCost ?? 0),
      parts: (task.parts ?? []).map((part: any) => ({
        id: part.id ?? "",
        name: part.name ?? "",
        partNumber: part.partNumber ?? "",
        quantity: Number(part.quantity ?? 1),
        unitPrice: Number(part.unitPrice ?? 0),
      })),
      subtasks: (task.subtasks ?? []).map((subtask: any) => ({
        id: subtask.id ?? "",
        title: subtask.title ?? "",
        assignedToId: subtask.assignedTo?.id ?? subtask.assignedToId ?? "",
        status: subtask.status ?? "PENDING",
        estimatedDuration: Number(subtask.estimatedDuration ?? 0),
        progress: Number(subtask.progress ?? 0),
        })),
      comments: (task.comments ?? []).map((comment: any) => ({
        id: comment.id ?? "",
        message: comment.message ?? "",
        internal: Boolean(comment.internal),
        status: comment.status ?? "",
      })),
    })),
  };
}

async function saveService({
  data,
  editingService,
}: {
  data: ServiceFormData;
  editingService?: any;
}) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const payload = {
    ...data,
    createdById: user.id,
    tasks: data.tasks.map((task) => ({
      ...task,
      ownerId: task.ownerId || user.id,
      accountableTechnicianId: task.accountableTechnicianId || null,
      mechanicIds: task.mechanicIds ?? [],
      subtasks: task.subtasks.map((subtask) => ({
        ...subtask,
        assignedToId: subtask.assignedToId || null,
      })),
    })),
  };

  console.log("PATCH payload", payload);
  const res = await fetch(editingService ? `/api/services/${editingService.id}` : "/api/services", {
    method: editingService ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Failed to save service");
  return json;
}

export default function ServiceForm({ editingService }: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const form = useForm<ServiceFormInput, unknown, ServiceFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "PENDING",
      problemDescription: "",
      notes: "",
      serviceDate: "",
      deliveryDate: "",
      vehicleId: "",
      customerId: "",
      discount: 0,
      tax: 0,
      tasks: [emptyTask()],
    },
  });

  const { control, register, handleSubmit, reset, setValue, watch, formState } = form;

  const tasksArray = useFieldArray({ control, name: "tasks", keyName: "fieldId" });

  const usersQuery = useQuery({ queryKey: ["mechanics"], queryFn: getMechanics });

  const mechanics = useMemo(
    () => (usersQuery.data ?? []).filter((user: any) => !user.role || user.role === "mechanic"),
    [usersQuery.data]
  );

  useEffect(() => {
    if (!editingService) return;

    const normalized = normalizeService(editingService);

    //console.log("editingService", editingService);
    //console.log("normalized", normalized);

    reset(normalized, {keepDefaultValues: false,});
  }, [editingService, reset]);

  const mutation = useMutation({
  mutationFn: saveService,
  onSuccess: (updatedService) => {
    queryClient.invalidateQueries({ queryKey: ["services"] });

    if (editingService?.id) {
      queryClient.invalidateQueries({
        queryKey: ["service", editingService.id],
      });

      alert("Service updated successfully");
      return;
    }

    const createdService = updatedService?.data ?? updatedService;
    const createdId = createdService?.id;

    if (createdId) {
      router.push(`/dashboard/admin/services/${createdId}/edit`);
      return;
    }

    alert("Service created, but the edit page id was not returned.");
  },
});

  const onSubmit = (data: ServiceFormData) => {
    mutation.mutate({ data, editingService });
  };

  const onInvalid = (errors: typeof formState.errors) => {
    console.log("Service form validation errors", errors);
  };

  const validationMessages = Array.from(
    new Set(getErrorMessages(formState.errors))
  );

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Status">
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="INSPECTION">Inspection</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Service Date">
            <Input type="date" {...register("serviceDate")} />
          </Field>

          <Field label="Delivery Date">
            <Input type="date" {...register("deliveryDate")} />
          </Field>
        </div>

       <VehicleSearchField control={control} setValue={setValue} />

        <input type="hidden" {...register("customerId")} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Problem Description">
            <Textarea {...register("problemDescription")} />
          </Field>
          <Field label="Notes">
            <Textarea {...register("notes")} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Discount">
            <Input type="number" step="0.01" {...register("discount")} />
          </Field>
          <Field label="Tax">
            <Input type="number" step="0.01" {...register("tax")} />
          </Field>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Service Tasks</h2>
            <Button type="button" onClick={() => tasksArray.append(emptyTask())}>
              + Add Task
            </Button>
          </div>

          {tasksArray.fields.map((task, taskIndex) => (
            <TaskCard
                key={task.fieldId}
                taskIndex={taskIndex}
                control={control}
                register={register}
                setValue={setValue}
                watch={watch}
                removeTask={tasksArray.remove}
                mechanics={mechanics}
            />
            ))}
        </section>

        {mutation.error && (
            <p className="text-sm text-red-600">
              {(mutation.error as Error).message}
            </p>
          )}

        {validationMessages.length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p className="font-medium">Please fix these fields:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {validationMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending
            ? "Saving..."
            : editingService
              ? "Update Service"
              : "Create Service"}
        </Button>
      </form>
    </Card>
  );
}







