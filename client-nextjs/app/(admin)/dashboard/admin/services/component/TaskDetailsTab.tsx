"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, MultiUserCheckboxes, UserSelect } from "./form-shared";

export function TaskDetailsTab({
  taskIndex,
  control,
  register,
  setValue,
  watch,
  mechanics,
}: any) {
  const parts = watch(`tasks.${taskIndex}.parts`) ?? [];
  const laborCost = Number(watch(`tasks.${taskIndex}.laborCost`) || 0);
  const additionalCost = Number(watch(`tasks.${taskIndex}.additionalCost`) || 0);

  const partsTotal = parts.reduce(
    (sum: number, part: any) =>
      sum + Number(part.quantity || 0) * Number(part.unitPrice || 0),
    0
  );

  const taskTotal = laborCost + additionalCost + partsTotal;

  return (
    <div className="space-y-5 pt-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Task Title">
          <Input
            placeholder="Example: Engine diagnosis"
            {...register(`tasks.${taskIndex}.title`)}
          />
        </Field>

        <Field label="Task Owner">
          <UserSelect
            control={control}
            name={`tasks.${taskIndex}.ownerId`}
            users={mechanics}
            placeholder="Select owner"
          />
        </Field>
      </div>

      <Field label="Task Description">
        <Textarea
          placeholder="What needs to be done?"
          {...register(`tasks.${taskIndex}.description`)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Accountable Technician">
          <UserSelect
            control={control}
            name={`tasks.${taskIndex}.accountableTechnicianId`}
            users={mechanics}
            placeholder="Who is accountable?"
          />
        </Field>

        <Field label="Technician Assignees">
          <MultiUserCheckboxes
            value={watch(`tasks.${taskIndex}.mechanicIds`) ?? []}
            users={mechanics}
            onChange={(ids) =>
              setValue(`tasks.${taskIndex}.mechanicIds`, ids, {
                shouldValidate: true,
              })
            }
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label="Labor Cost">
          <Input
            type="number"
            step="0.01"
            {...register(`tasks.${taskIndex}.laborCost`)}
          />
        </Field>

        <Field label="Additional Cost">
          <Input
            type="number"
            step="0.01"
            {...register(`tasks.${taskIndex}.additionalCost`)}
          />
        </Field>

        <div className="rounded-md border p-3 text-sm">
          <p className="font-medium">Task Total</p>
          <p>{taskTotal.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}