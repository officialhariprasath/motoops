// File: TaskCard.tsx

"use client";

import { useFieldArray } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TaskDetailsTab } from "./TaskDetailsTab";
import { TaskPartsTab } from "./TaskPartsTab";
import { TaskSubtasksTab } from "./TaskSubtasksTab";
import { TaskCommentsTab } from "./TaskCommentsTab";

export function TaskCard({
  taskIndex,
  control,
  register,
  setValue,
  watch,
  removeTask,
  mechanics,
}: any) {
  const partsArray = useFieldArray({
    control,
    name: `tasks.${taskIndex}.parts`,
    keyName: "partsId",
  });

  const subtasksArray = useFieldArray({
    control,
    name: `tasks.${taskIndex}.subtasks`,
    keyName: "subTaskId",
  });

  const commentsArray = useFieldArray({
    control,
    name: `tasks.${taskIndex}.comments`,
    keyName: "commentId",
  });

  return (
    <Card className="block w-full overflow-hidden space-y-5 border p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Task #{taskIndex + 1}</h3>

        <Button
          type="button"
          variant="destructive"
          onClick={() => removeTask(taskIndex)}
        >
          Remove Task
        </Button>
      </div>

      <div className="w-full">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-xl border bg-muted/80 dark:bg-zinc-900  p-1.5   gap-1   shadow-inner  backdrop-blur">
            <TabsTrigger className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground dark:text-zinc-400 transition-all duration-200 hover:bg-card/70 hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border dark:hover:bg-zinc-800 dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white dark:data-[state=active]:border-zinc-700" value="details">Details</TabsTrigger>
            <TabsTrigger className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground dark:text-zinc-400 transition-all duration-200 hover:bg-card/70 hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border dark:hover:bg-zinc-800 dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white dark:data-[state=active]:border-zinc-700" value="parts">Parts</TabsTrigger>
            <TabsTrigger className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground dark:text-zinc-400 transition-all duration-200 hover:bg-card/70 hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border dark:hover:bg-zinc-800 dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white dark:data-[state=active]:border-zinc-700" value="subtasks">Subtasks</TabsTrigger>
            <TabsTrigger className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground dark:text-zinc-400 transition-all duration-200 hover:bg-card/70 hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border dark:hover:bg-zinc-800 dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white dark:data-[state=active]:border-zinc-700" value="comments">Comments</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="w-full mt-4">
            <TaskDetailsTab
              taskIndex={taskIndex}
              control={control}
              register={register}
              setValue={setValue}
              watch={watch}
              mechanics={mechanics}
            />
          </TabsContent>

          <TabsContent value="parts" className="w-full mt-4">
            <TaskPartsTab
              taskIndex={taskIndex}
              register={register}
              partsArray={partsArray}
            />
          </TabsContent>

          <TabsContent value="subtasks" className="w-full mt-4">
            <TaskSubtasksTab
              taskIndex={taskIndex}
              control={control}
              register={register}
              watch={watch}
              mechanics={mechanics}
              subtasksArray={subtasksArray}
            />
          </TabsContent>

          <TabsContent value="comments" className="w-full mt-4">
            <TaskCommentsTab
              taskIndex={taskIndex}
              register={register}
              commentsArray={commentsArray}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
