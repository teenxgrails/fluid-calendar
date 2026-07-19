import { useMemo } from "react";

import { motion, useReducedMotion } from "framer-motion";

import { addDays, format, getDay, newDate, startOfDay } from "@/lib/date-utils";

import { Task, TaskStatus } from "@/types/task";

interface TimelineViewProps {
  tasks: Task[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function taskStart(task: Task) {
  return (
    task.scheduledStart ||
    task.startDate ||
    task.createdAt ||
    task.deadline ||
    task.dueDate ||
    null
  );
}

function taskEnd(task: Task) {
  return task.scheduledEnd || task.deadline || task.dueDate || taskStart(task);
}

export function TimelineView({ tasks }: TimelineViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const rows = useMemo(() => {
    const datedTasks = tasks
      .map((task) => {
        const start = taskStart(task);
        const end = taskEnd(task);
        if (!start || !end) return null;
        return {
          task,
          start: startOfDay(newDate(start)),
          end: startOfDay(newDate(end)),
        };
      })
      .filter(Boolean) as Array<{
      task: Task;
      start: Date;
      end: Date;
    }>;

    const minTime =
      datedTasks.reduce(
        (min, item) => Math.min(min, item.start.getTime()),
        Number.POSITIVE_INFINITY
      ) || newDate().getTime();
    const maxTime =
      datedTasks.reduce(
        (max, item) => Math.max(max, item.end.getTime()),
        Number.NEGATIVE_INFINITY
      ) || newDate().getTime();
    const rangeStart = startOfDay(newDate(minTime));
    const dayCount = Math.max(7, Math.ceil((maxTime - minTime) / DAY_MS) + 1);

    const grouped = new Map<
      string,
      { id: string; label: string; tasks: typeof datedTasks }
    >();
    datedTasks.forEach((item) => {
      const id = item.task.projectId || "none";
      const label = item.task.project?.name || "No Project";
      if (!grouped.has(id)) grouped.set(id, { id, label, tasks: [] });
      grouped.get(id)?.tasks.push(item);
    });

    return { rangeStart, dayCount, groups: Array.from(grouped.values()) };
  }, [tasks]);

  if (rows.groups.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-[var(--border-control)] bg-[var(--surface-raised)] p-8 text-center text-sm text-[var(--text-secondary)]">
        No dated tasks yet. Add start, deadline, due, or scheduled dates to show
        a timeline.
      </div>
    );
  }

  return (
    <div className="needt-page-depth h-full overflow-auto rounded-md border border-[var(--border-control)]">
      <div
        className="grid min-w-[760px]"
        style={{
          gridTemplateColumns: `180px repeat(${rows.dayCount}, minmax(42px, 1fr))`,
        }}
      >
        <div className="sticky left-0 z-10 border-b border-r border-[var(--border-subtle)] bg-[var(--surface-canvas)] p-2 text-xs text-[var(--text-secondary)]">
          Project
        </div>
        {Array.from({ length: rows.dayCount }).map((_, index) => {
          const date = addDays(rows.rangeStart, index);
          return (
            <div
              key={format(date, "yyyy-MM-dd")}
              className="border-b border-r border-[var(--border-subtle)] p-2 text-center text-[11px] text-[var(--text-secondary)]"
            >
              {format(date, "MMM d")}
            </div>
          );
        })}

        {rows.groups.map((group) => (
          <div key={group.id} className="contents">
            <div className="sticky left-0 z-10 border-b border-r border-[var(--border-subtle)] bg-[var(--surface-canvas)] p-2 text-sm text-[var(--text-primary)]">
              {group.label}
            </div>
            <div
              className="relative col-span-full border-b border-[var(--border-subtle)] p-2"
              style={{
                gridColumn: `2 / span ${rows.dayCount}`,
                minHeight: Math.max(44, group.tasks.length * 32 + 16),
              }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 grid"
                style={{
                  gridTemplateColumns: `repeat(${rows.dayCount}, minmax(42px, 1fr))`,
                }}
              >
                {Array.from({ length: rows.dayCount }).map((_, index) => {
                  const date = addDays(rows.rangeStart, index);
                  const day = getDay(date);
                  const isWeekend = day === 0 || day === 6;
                  return (
                    <div
                      key={format(date, "yyyy-MM-dd")}
                      className="border-r border-[var(--border-subtle)]"
                      style={
                        isWeekend
                          ? {
                              backgroundImage:
                                "repeating-linear-gradient(135deg, transparent 0, transparent 6px, var(--border-subtle) 6px, var(--border-subtle) 7px)",
                            }
                          : undefined
                      }
                    />
                  );
                })}
              </div>
              <div
                className="relative z-[1] grid gap-y-1"
                style={{
                  gridTemplateColumns: `repeat(${rows.dayCount}, minmax(42px, 1fr))`,
                  gridTemplateRows: `repeat(${Math.max(1, group.tasks.length)}, 28px)`,
                }}
              >
                {group.tasks.map(({ task, start, end }, index) => {
                  const offset =
                    Math.floor(
                      (start.getTime() - rows.rangeStart.getTime()) / DAY_MS
                    ) + 1;
                  const span = Math.min(
                    rows.dayCount - offset + 1,
                    Math.max(
                      1,
                      Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1
                    )
                  );
                  const isCompleted = task.status === TaskStatus.COMPLETED;
                  const color = task.project?.color || "var(--color-accent)";
                  return (
                    <motion.div
                      key={task.id}
                      layout={!prefersReducedMotion}
                      initial={
                        prefersReducedMotion ? false : { opacity: 0, y: 4 }
                      }
                      animate={{ opacity: isCompleted ? 0.68 : 1, y: 0 }}
                      transition={{
                        duration: prefersReducedMotion ? 0 : 0.16,
                      }}
                      className="z-[1] min-w-0 truncate rounded-md border px-2 py-1 text-xs text-white"
                      style={{
                        gridColumn: `${offset} / span ${span}`,
                        gridRow: index + 1,
                        borderColor: isCompleted
                          ? "var(--border-control)"
                          : color,
                        background: isCompleted
                          ? "var(--surface-control)"
                          : color,
                      }}
                      title={task.title}
                    >
                      {task.title}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
