"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type ServiceWorkListProps = {
  mode: "mechanic" | "user";
  title: string;
  description: string;
};

async function getServices(mode: ServiceWorkListProps["mode"]) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const query =
    mode === "mechanic"
      ? `technicianId=${user.id}`
      : `customerId=${user.id}`;

  const res = await fetch(`/api/services?${query}`, {
    cache: "no-store",
  });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || "Failed to load services");
  }

  return json?.data ?? json ?? [];
}

async function addComment({
  taskId,
  message,
}: {
  taskId: string;
  message: string;
}) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const res = await fetch(`/api/tasks/${taskId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      createdById: user.id,
      internal: false,
      status: "update",
    }),
  });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || "Failed to add comment");
  }

  return json;
}

async function updateSubtask({
  subtaskId,
  progress,
  status,
}: {
  subtaskId: string;
  progress: number;
  status: string;
}) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const res = await fetch(`/api/subtasks/${subtaskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      progress,
      status,
      mechanicId: user.id,
    }),
  });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || "Failed to update progress");
  }

  return json;
}

export default function ServiceWorkList({
  mode,
  title,
  description,
}: ServiceWorkListProps) {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [taskFilter, setTaskFilter] = useState<"active" | "previous">(
    "active"
  );
  const [subtaskDrafts, setSubtaskDrafts] = useState<
    Record<string, { progress: number; status: string }>
  >({});

  const query = useQuery({
    queryKey: [mode, "services"],
    queryFn: () => getServices(mode),
  });

  const mutation = useMutation({
    mutationFn: addComment,
    onSuccess: () => {
      setDrafts({});
      queryClient.invalidateQueries({ queryKey: [mode, "services"] });
    },
  });

  const progressMutation = useMutation({
    mutationFn: updateSubtask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [mode, "services"] });
    },
  });

  const services = useMemo(() => {
    const rows = query.data ?? [];

    if (mode !== "mechanic") {
      return rows;
    }

    return rows
      .map((service: any) => ({
        ...service,
        tasks: (service.tasks ?? []).filter((task: any) => {
          const subtasks = task.subtasks ?? [];
          const completedByStatus =
            task.status === "completed" || task.status === "COMPLETED";
          const completedBySubtasks =
            subtasks.length > 0 &&
            subtasks.every(
              (subtask: any) =>
                subtask.completed ||
                subtask.status === "COMPLETED" ||
                Number(subtask.progress ?? 0) >= 100
            );
          const isCompleted = completedByStatus || completedBySubtasks;

          return taskFilter === "previous" ? isCompleted : !isCompleted;
        }),
      }))
      .filter((service: any) => service.tasks.length > 0);
  }, [mode, query.data, taskFilter]);

  if (query.isLoading) {
    return <p>Loading services...</p>;
  }

  if (query.error instanceof Error) {
    return <p className="text-sm text-red-600">{query.error.message}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      {mode === "mechanic" && (
        <div className="inline-flex rounded-md border bg-white p-1">
          <button
            type="button"
            onClick={() => setTaskFilter("active")}
            className={`rounded px-4 py-2 text-sm font-medium ${
              taskFilter === "active"
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Active Tasks
          </button>
          <button
            type="button"
            onClick={() => setTaskFilter("previous")}
            className={`rounded px-4 py-2 text-sm font-medium ${
              taskFilter === "previous"
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Previous Tasks
          </button>
        </div>
      )}

      {services.length === 0 && (
        <div className="rounded-md border bg-white p-6 text-sm text-gray-500">
          No services found.
        </div>
      )}

      <div className="space-y-4">
        {services.map((service: any) => (
          <Card key={service.id}>
            <CardContent className="space-y-5 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    {service.vehicle?.registrationNumber || "No vehicle"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {service.vehicle?.brand} {service.vehicle?.model}
                  </p>
                  <p className="mt-2 text-sm">{service.problemDescription}</p>
                </div>

                <div className="text-right text-sm">
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">
                    {service.status?.replaceAll("_", " ").toLowerCase()}
                  </span>
                  <p className="mt-2 font-semibold">
                    Total: {Number(service.totalCost ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {service.tasks?.map((task: any) => (
                  <div key={task.id} className="rounded-md border p-4">
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{task.title}</h3>
                        <p className="text-sm text-gray-600">
                          {task.description || "No task description"}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        Task total: {Number(task.totalCost ?? 0).toFixed(2)}
                      </p>
                    </div>

                    {task.subtasks?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium">Work checklist</p>
                        <div className="mt-2 space-y-3 text-sm text-gray-600">
                          {task.subtasks.map((subtask: any) => (
                            <div
                              key={subtask.id}
                              className="rounded border bg-white p-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="font-medium text-gray-800">
                                    {subtask.title}
                                  </p>
                                  <p>
                                    {subtask.status} - {subtask.progress ?? 0}%
                                  </p>
                                </div>
                                {subtask.assignedTo?.name && (
                                  <p className="text-xs text-gray-500">
                                    Assigned to {subtask.assignedTo.name}
                                  </p>
                                )}
                              </div>

                              {mode === "mechanic" && (
                                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_160px_auto]">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={
                                      subtaskDrafts[subtask.id]?.progress ??
                                      Number(subtask.progress ?? 0)
                                    }
                                    onChange={(event) => {
                                      const progress = Number(
                                        event.target.value
                                      );
                                      setSubtaskDrafts((current) => ({
                                        ...current,
                                        [subtask.id]: {
                                          progress,
                                          status:
                                            progress >= 100
                                              ? "COMPLETED"
                                              : current[subtask.id]?.status ??
                                                subtask.status ??
                                                "IN_PROGRESS",
                                        },
                                      }));
                                    }}
                                    className="rounded-md border px-3 py-2"
                                  />

                                  <select
                                    value={
                                      subtaskDrafts[subtask.id]?.status ??
                                      subtask.status ??
                                      "PENDING"
                                    }
                                    onChange={(event) => {
                                      const status = event.target.value;
                                      setSubtaskDrafts((current) => ({
                                        ...current,
                                        [subtask.id]: {
                                          progress:
                                            status === "COMPLETED"
                                              ? 100
                                              : current[subtask.id]?.progress ??
                                                Number(subtask.progress ?? 0),
                                          status,
                                        },
                                      }));
                                    }}
                                    className="rounded-md border px-3 py-2"
                                  >
                                    <option value="PENDING">Pending</option>
                                    <option value="IN_PROGRESS">
                                      In Progress
                                    </option>
                                    <option value="ON_HOLD">On Hold</option>
                                    <option value="COMPLETED">Completed</option>
                                  </select>

                                  <Button
                                    type="button"
                                    disabled={progressMutation.isPending}
                                    onClick={() => {
                                      const draft = subtaskDrafts[
                                        subtask.id
                                      ] ?? {
                                        progress: Number(
                                          subtask.progress ?? 0
                                        ),
                                        status:
                                          subtask.status ?? "IN_PROGRESS",
                                      };
                                      progressMutation.mutate({
                                        subtaskId: subtask.id,
                                        progress: draft.progress,
                                        status: draft.status,
                                      });
                                    }}
                                  >
                                    Update
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {progressMutation.error instanceof Error && (
                      <p className="mt-2 text-sm text-red-600">
                        {progressMutation.error.message}
                      </p>
                    )}

                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">Comments</p>
                      {task.comments?.length ? (
                        <div className="space-y-2">
                          {task.comments.map((comment: any) => (
                            <div
                              key={comment.id}
                              className="rounded bg-slate-50 p-3 text-sm"
                            >
                              <p>{comment.message}</p>
                              <p className="mt-1 text-xs text-gray-500">
                                {comment.createdBy?.name || "User"} -{" "}
                                {comment.status || "comment"}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No comments yet.
                        </p>
                      )}
                    </div>

                    <div className="mt-4 space-y-2">
                      <Textarea
                        value={drafts[task.id] ?? ""}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [task.id]: event.target.value,
                          }))
                        }
                        placeholder={
                          mode === "mechanic"
                            ? "Add a work update..."
                            : "Add a comment or question..."
                        }
                      />
                      <Button
                        type="button"
                        disabled={
                          mutation.isPending || !drafts[task.id]?.trim()
                        }
                        onClick={() =>
                          mutation.mutate({
                            taskId: task.id,
                            message: drafts[task.id],
                          })
                        }
                      >
                        Add Comment
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
