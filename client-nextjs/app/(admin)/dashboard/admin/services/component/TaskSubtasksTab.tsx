"use client";

import { Controller } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDeleteActionsEnabled } from "@/lib/delete-settings";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { UserSelect } from "./form-shared";

export function TaskSubtasksTab({
  taskIndex,
  control,
  register,
  watch,
  mechanics,
  subtasksArray,
}: any) {
  const deleteActionsEnabled = useDeleteActionsEnabled();

  return (
    <div className="space-y-3 pt-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            subtasksArray.append({
              title: "",
              assignedToId: "",
              status: "PENDING",
              estimatedDuration: 0,
              progress: 0,
            })
          }
        >
          + Add Subtask
        </Button>
      </div>

      {subtasksArray.fields.map((subtask: any, subtaskIndex: number) => (
        <Card key={subtask.subTaskId} className="space-y-4 border p-4">
          <Textarea
            placeholder="Describe subtask..."
            className="min-h-[90px] resize-none"
            {...register(`tasks.${taskIndex}.subtasks.${subtaskIndex}.title`)}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <UserSelect
              control={control}
              name={`tasks.${taskIndex}.subtasks.${subtaskIndex}.assignedToId`}
              users={mechanics}
              placeholder="Assign technician"
            />

            <Controller
              control={control}
              name={`tasks.${taskIndex}.subtasks.${subtaskIndex}.status`}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>

                  <SelectContent className="bg-card">
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            <div className="space-y-1">
              <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Estimated Duration (Hours)
                  </label>

                  <Input
                    type="number"
                    min={0}
                    step="0.5"
                    placeholder="e.g. 2"
                    {...register(
                      `tasks.${taskIndex}.subtasks.${subtaskIndex}.estimatedDuration`
                    )}
                  />

                  <p className="text-[11px] text-muted-foreground">
                    Estimated working time
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Progress (%)
                  </label>

                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0 - 100"
                    {...register(
                      `tasks.${taskIndex}.subtasks.${subtaskIndex}.progress`
                    )}
                  />

                  <div className="h-2 w-full overflow-hidden rounded bg-gray-200">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{
                        width: `${
                          watch(
                            `tasks.${taskIndex}.subtasks.${subtaskIndex}.progress`
                          ) || 0
                        }%`,
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    Completion percentage
                  </p>
                </div>

            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="destructive"
              disabled={!deleteActionsEnabled}
              title={deleteActionsEnabled ? "Remove subtask" : "Enable delete actions in Settings first"}
              onClick={() => subtasksArray.remove(subtaskIndex)}
            >
              Remove
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
