"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDeleteActionsEnabled } from "@/lib/delete-settings";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "./form-shared";

export function TaskCommentsTab({ taskIndex, register, commentsArray }: any) {
  const deleteActionsEnabled = useDeleteActionsEnabled();

  return (
    <div className="space-y-3 pt-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            commentsArray.append({
              message: "",
              internal: false,
              status: "",
            })
          }
        >
          + Add Comment
        </Button>
      </div>

      {commentsArray.fields.map((comment: any, commentIndex: number) => (
        <Card key={comment.commentId} className="space-y-3 border p-3">
          <Textarea
            placeholder="Write or edit comment"
            {...register(`tasks.${taskIndex}.comments.${commentIndex}.message`)}
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Comment Status">
              <Input
                placeholder="optional status"
                {...register(
                  `tasks.${taskIndex}.comments.${commentIndex}.status`
                )}
              />
            </Field>

            <label className="flex items-center gap-2 pt-6 text-sm">
              <input
                type="checkbox"
                {...register(
                  `tasks.${taskIndex}.comments.${commentIndex}.internal`
                )}
              />
              Internal comment
            </label>

            <Button
              type="button"
              variant="destructive"
              disabled={!deleteActionsEnabled}
              title={deleteActionsEnabled ? "Remove comment" : "Enable delete actions in Settings first"}
              onClick={() => commentsArray.remove(commentIndex)}
            >
              Remove Comment
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
