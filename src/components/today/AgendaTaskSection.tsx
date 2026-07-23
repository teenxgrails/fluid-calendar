"use client";

import { AgendaTaskRow } from "@/components/today/AgendaTaskRow";

import { cn } from "@/lib/utils";

import type { Task } from "@/types/task";

export interface AgendaGroup {
  id: string;
  title: string;
  tasks: Task[];
  tone?: "danger" | "muted";
}

export function AgendaTaskSection({
  group,
  onOpenTask,
  onComplete,
  onDateChange,
  onDurationChange,
}: {
  group: AgendaGroup;
  onOpenTask: (task: Task) => void;
  onComplete: (task: Task) => Promise<void>;
  onDateChange: (task: Task, date: Date | null) => Promise<void>;
  onDurationChange: (task: Task, duration: number | null) => Promise<void>;
}) {
  return (
    <section>
      <h2
        className={cn(
          "mb-2 text-[17px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]",
          group.tone === "muted" && "text-[var(--text-secondary)]"
        )}
      >
        {group.title}
      </h2>
      <ul className="list-none space-y-0.5">
        {group.tasks.map((task) => (
          <li key={task.id}>
            <AgendaTaskRow
              task={task}
              overdue={group.tone === "danger"}
              onOpen={() => onOpenTask(task)}
              onComplete={() => void onComplete(task)}
              onDateChange={(date) => void onDateChange(task, date)}
              onDurationChange={(duration) =>
                void onDurationChange(task, duration)
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
