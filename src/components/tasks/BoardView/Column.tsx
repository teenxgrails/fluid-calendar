"use client";

import { useDroppable } from "@dnd-kit/core";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import NumberFlow from "@number-flow/react";

import { cn } from "@/lib/utils";

import { Task, TaskStatus } from "@/types/task";

import { BoardTask } from "./BoardTask";

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const statusColors = {
  [TaskStatus.TODO]: "border-[var(--border-subtle)]",
  [TaskStatus.IN_PROGRESS]: "border-[var(--border-subtle)]",
  [TaskStatus.COMPLETED]: "border-[var(--border-subtle)]",
};

const statusHeaderColors = {
  [TaskStatus.TODO]: "text-[var(--primitive-gold-400)]",
  [TaskStatus.IN_PROGRESS]: "text-[var(--primitive-blue-500)]",
  [TaskStatus.COMPLETED]: "text-[var(--color-success)]",
};

// Helper function to format enum values for display
const formatEnumValue = (value: string) => {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function Column({ status, tasks, onEdit, onDelete }: ColumnProps) {
  const [taskListRef] = useAutoAnimate<HTMLDivElement>({ duration: 180 });
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 flex-shrink-0 flex-col rounded-[var(--control-radius)] border bg-[var(--surface-panel)]",
        statusColors[status],
        isOver && "border-[var(--text-secondary)] bg-[var(--surface-raised)]"
      )}
    >
      <div className="border-b border-[var(--border-subtle)] p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "px-1 text-[12px] font-medium",
                statusHeaderColors[status]
              )}
            >
              {formatEnumValue(status)}
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              <NumberFlow
                value={tasks.length}
                transformTiming={{ duration: 180, easing: "ease-out" }}
                respectMotionPreference
              />
            </span>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        <div ref={taskListRef} className="space-y-1.5">
          {tasks.map((task) => (
            <BoardTask
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
