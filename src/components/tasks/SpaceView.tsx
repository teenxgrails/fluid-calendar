"use client";

import {
  CSSProperties,
  DragEvent,
  PointerEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import { Box, Check, Minus, Plus, RotateCcw, Sparkles } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { addDays, addMinutes, newDate, startOfDay } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

import { Project } from "@/types/project";
import { Priority, Task, TaskStatus } from "@/types/task";

interface SpaceViewProps {
  projects: Project[];
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onRescheduleTask: (task: Task, start: Date, end: Date) => void;
}

interface SpacePoint {
  x: number;
  y: number;
}

interface SpaceCluster extends SpacePoint {
  id: string;
  name: string;
  color: string;
  tasks: Array<{ task: Task } & SpacePoint>;
}

const CLUSTER_POSITIONS: SpacePoint[] = [
  { x: 24, y: 30 },
  { x: 57, y: 25 },
  { x: 78, y: 48 },
  { x: 53, y: 68 },
  { x: 20, y: 70 },
  { x: 40, y: 47 },
];

const PROJECT_COLORS = [
  "#4A7BFF",
  "#8B5CF6",
  "#2DD4BF",
  "#E64BD0",
  "#F5C451",
  "#3CC487",
];

function hashString(value: string) {
  return Array.from(value).reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
    2166136261
  );
}

function taskColor(task: Task) {
  const deadline = task.deadline ?? task.dueDate;
  if (deadline && newDate(deadline).getTime() < newDate().getTime()) {
    return "var(--color-danger)";
  }
  if (task.priority === Priority.HIGH) return "var(--primitive-gold-400)";
  if (task.status === TaskStatus.IN_PROGRESS)
    return "var(--primitive-teal-400)";
  if (task.status === TaskStatus.COMPLETED) return "var(--text-muted)";
  return "var(--primitive-neutral-250)";
}

function formatTaskDate(task: Task) {
  const date = task.deadline ?? task.dueDate ?? task.scheduledStart;
  if (!date) return "No deadline";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(newDate(date));
}

export function SpaceView({
  projects,
  tasks,
  onOpenTask,
  onRescheduleTask,
}: SpaceViewProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panStart = useRef<{
    pointerX: number;
    pointerY: number;
    panX: number;
    panY: number;
  } | null>(null);

  const clusters = useMemo<SpaceCluster[]>(() => {
    const visibleTasks = tasks
      .filter((task) => showCompleted || task.status !== TaskStatus.COMPLETED)
      .slice(0, 120);
    const groupIds = new Set(
      visibleTasks.map((task) => task.projectId ?? "none")
    );
    const projectLookup = new Map(
      projects.map((project) => [project.id, project])
    );

    return Array.from(groupIds).map((id, clusterIndex) => {
      const project = id === "none" ? undefined : projectLookup.get(id);
      const center = CLUSTER_POSITIONS[clusterIndex % CLUSTER_POSITIONS.length];
      const color =
        project?.color ?? PROJECT_COLORS[clusterIndex % PROJECT_COLORS.length];
      const clusterTasks = visibleTasks.filter(
        (task) => (task.projectId ?? "none") === id
      );

      return {
        id,
        name: project?.name ?? "No project",
        color,
        ...center,
        tasks: clusterTasks.map((task, taskIndex) => {
          const hash = hashString(task.id);
          const scheduledDate =
            task.scheduledStart ??
            task.startDate ??
            task.deadline ??
            task.dueDate;
          const dayOffset = scheduledDate
            ? Math.max(
                0,
                Math.min(
                  13,
                  Math.round(
                    (startOfDay(newDate(scheduledDate)).getTime() -
                      startOfDay(newDate()).getTime()) /
                      86_400_000
                  )
                )
              )
            : hash % 14;
          const minutes = scheduledDate
            ? newDate(scheduledDate).getHours() * 60 +
              newDate(scheduledDate).getMinutes()
            : hash % 1440;
          const angle =
            (dayOffset / 14) * Math.PI * 2 +
            (taskIndex % 3) * 0.12 +
            (hash % 7) * 0.015;
          const radius =
            8 + (minutes / 1440) * 9 + Math.floor(taskIndex / 14) * 2;
          return {
            task,
            x: Math.min(94, Math.max(6, center.x + Math.cos(angle) * radius)),
            y: Math.min(90, Math.max(10, center.y + Math.sin(angle) * radius)),
          };
        }),
      };
    });
  }, [projects, showCompleted, tasks]);

  const resetSpace = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handleCanvasPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    panStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleCanvasPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!panStart.current) return;
    setPan({
      x: panStart.current.panX + event.clientX - panStart.current.pointerX,
      y: panStart.current.panY + event.clientY - panStart.current.pointerY,
    });
  };

  const handleCanvasPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!panStart.current) return;
    panStart.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleTaskDragEnd = (
    event: DragEvent<HTMLButtonElement>,
    task: Task
  ) => {
    const canvas = event.currentTarget.closest<HTMLElement>(
      "[data-space-canvas]"
    );
    if (!canvas || event.clientX === 0 || event.clientY === 0) return;
    const bounds = canvas.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(
        1,
        (event.clientX - bounds.left - pan.x) / (bounds.width * scale)
      )
    );
    const y = Math.max(
      0,
      Math.min(
        1,
        (event.clientY - bounds.top - pan.y) / (bounds.height * scale)
      )
    );
    const dayOffset = Math.round(x * 13);
    const minutes = Math.min(1425, Math.round((y * 1440) / 15) * 15);
    const start = addDays(startOfDay(newDate()), dayOffset);
    start.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    const end = addMinutes(start, task.duration ?? task.estimatedMinutes ?? 30);
    onRescheduleTask(task, start, end);
  };

  return (
    <section className="relative h-full min-h-[520px] overflow-hidden bg-[var(--surface-canvas)]">
      <div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-[var(--control-radius)] border border-[var(--control-border)] bg-[var(--surface-panel)] p-1.5">
        <Sparkles className="ml-1 h-3.5 w-3.5 text-[var(--text-secondary)]" />
        <span className="text-[12px] font-medium text-[var(--text-primary)]">
          Task space
        </span>
        <span className="text-[11px] text-[var(--text-muted)]">
          {clusters.reduce((total, cluster) => total + cluster.tasks.length, 0)}{" "}
          tasks
        </span>
      </div>

      <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
        <label className="flex h-8 items-center gap-2 rounded-[var(--control-radius)] border border-[var(--control-border)] bg-[var(--surface-panel)] px-2.5 text-[12px] text-[var(--text-secondary)]">
          Show completed
          <Switch
            checked={showCompleted}
            onCheckedChange={setShowCompleted}
            className="scale-75"
          />
        </label>
        <div className="flex h-8 items-center rounded-[var(--control-radius)] border border-[var(--control-border)] bg-[var(--surface-panel)] p-0.5">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setScale((value) => Math.max(0.75, value - 0.1))}
            className="grid h-7 w-7 place-items-center rounded text-[var(--text-secondary)] hover:bg-[var(--menu-item-hover)] hover:text-[var(--text-primary)]"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Reset zoom"
            onClick={resetSpace}
            className="grid h-7 min-w-10 place-items-center rounded px-1 text-[11px] text-[var(--text-secondary)] hover:bg-[var(--menu-item-hover)] hover:text-[var(--text-primary)]"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setScale((value) => Math.min(1.35, value + 0.1))}
            className="grid h-7 w-7 place-items-center rounded text-[var(--text-secondary)] hover:bg-[var(--menu-item-hover)] hover:text-[var(--text-primary)]"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Reset space"
            onClick={resetSpace}
            className="grid h-7 w-7 place-items-center rounded text-[var(--text-secondary)] hover:bg-[var(--menu-item-hover)] hover:text-[var(--text-primary)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div
        data-space-canvas
        className="workspace-space-canvas absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
      >
        {clusters.length === 0 ? (
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <Sparkles className="mx-auto mb-3 h-5 w-5 text-[var(--text-muted)]" />
              <p className="text-[13px] text-[var(--text-secondary)]">
                Your task space is empty.
              </p>
              <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                Create a task to start a constellation.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="absolute inset-0 origin-center transition-transform duration-200 motion-reduce:transition-none"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
            }}
          >
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              {clusters.flatMap((cluster) =>
                cluster.tasks.map(({ task, x, y }) => (
                  <line
                    key={`${cluster.id}-${task.id}`}
                    x1={`${cluster.x}%`}
                    y1={`${cluster.y}%`}
                    x2={`${x}%`}
                    y2={`${y}%`}
                    stroke={cluster.color}
                    strokeOpacity="0.12"
                    strokeWidth="1"
                  />
                ))
              )}
            </svg>

            {clusters.map((cluster) => (
              <div key={cluster.id} className="contents">
                <div
                  className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border bg-[var(--surface-panel)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-primary)]"
                  style={{
                    left: `${cluster.x}%`,
                    top: `${cluster.y}%`,
                    borderColor: `color-mix(in srgb, ${cluster.color} 48%, var(--border-subtle))`,
                  }}
                >
                  <Box
                    className="h-3.5 w-3.5"
                    style={{ color: cluster.color }}
                  />
                  <span className="max-w-32 truncate">{cluster.name}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {cluster.tasks.length}
                  </span>
                </div>

                {cluster.tasks.map(({ task, x, y }, taskIndex) => {
                  const style = {
                    left: `${x}%`,
                    top: `${y}%`,
                    "--space-delay": `${-(hashString(task.id) % 4000)}ms`,
                    "--space-distance": `${2 + (hashString(task.id) % 3)}px`,
                  } as CSSProperties;

                  return (
                    <Tooltip key={task.id} delayDuration={250}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          draggable={task.status !== TaskStatus.COMPLETED}
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", task.id);
                          }}
                          onDragEnd={(event) => handleTaskDragEnd(event, task)}
                          onClick={() => onOpenTask(task)}
                          aria-label={`Open task ${task.title}`}
                          className={cn(
                            "workspace-space-node group absolute z-10 grid h-5 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[var(--surface-canvas)] transition-[width,height,background-color] duration-150 hover:h-7 hover:w-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)] motion-reduce:animate-none",
                            task.status === TaskStatus.COMPLETED && "opacity-60"
                          )}
                          style={{
                            ...style,
                            background: taskColor(task),
                            animationDelay: `calc(var(--space-delay) + ${taskIndex * 35}ms)`,
                          }}
                        >
                          {task.status === TaskStatus.COMPLETED && (
                            <Check className="h-3 w-3 text-[var(--surface-canvas)]" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="max-w-64 border-[var(--menu-border)] bg-[var(--menu-bg)] p-2 text-[var(--text-primary)]"
                      >
                        <p className="truncate text-[12px] font-medium">
                          {task.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                          {cluster.name} · {formatTaskDate(task)} · Drag to
                          reschedule
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-[var(--control-radius)] border border-[var(--control-border)] bg-[var(--surface-panel)] px-3 py-1.5 text-[10px] text-[var(--text-muted)]">
        Drag space to explore · Drag a task to reschedule across the next 14
        days
      </div>
    </section>
  );
}
