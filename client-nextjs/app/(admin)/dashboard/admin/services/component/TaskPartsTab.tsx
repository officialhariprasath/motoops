"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TaskPartsTab({ taskIndex, register, partsArray }: any) {
  return (
    <div className="space-y-3 pt-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            partsArray.append({
              name: "",
              partNumber: "",
              quantity: 1,
              unitPrice: 0,
            })
          }
        >
          + Add Part
        </Button>
      </div>

      {partsArray.fields.map((part: any, partIndex: number) => (
        <div key={part.partsId} className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <Input
            placeholder="Part name"
            {...register(`tasks.${taskIndex}.parts.${partIndex}.name`)}
          />

          <Input
            placeholder="Part number"
            {...register(`tasks.${taskIndex}.parts.${partIndex}.partNumber`)}
          />

          <Input
            type="number"
            placeholder="Qty"
            {...register(`tasks.${taskIndex}.parts.${partIndex}.quantity`)}
          />

          <Input
            type="number"
            step="0.01"
            placeholder="Unit price"
            {...register(`tasks.${taskIndex}.parts.${partIndex}.unitPrice`)}
          />

          <Button
            type="button"
            variant="destructive"
            onClick={() => partsArray.remove(partIndex)}
          >
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
}