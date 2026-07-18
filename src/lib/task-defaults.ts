import { addDays, format, newDate } from "@/lib/date-utils";

import { Priority, TaskStatus } from "@/types/task";

export const TASK_DEFAULTS_STORAGE_KEY = "needt-task-defaults";

export type TaskStartPreset = "today" | "tomorrow" | "none";
export type TaskDeadlinePreset =
  | "today"
  | "tomorrow"
  | "this-week"
  | "7-days"
  | "next-week"
  | "2-weeks"
  | "one-month"
  | "none";

export interface TaskDefaults {
  projectId: string;
  status: TaskStatus;
  priority: Priority | "none";
  autoScheduled: boolean;
  durationMinutes: number;
  minChunkMinutes: number;
  startPreset: TaskStartPreset;
  deadlinePreset: TaskDeadlinePreset;
  hardDeadline: boolean;
  scheduleName: string;
}

export const DEFAULT_TASK_DEFAULTS: TaskDefaults = {
  projectId: "none",
  status: TaskStatus.TODO,
  priority: Priority.MEDIUM,
  autoScheduled: true,
  durationMinutes: 30,
  minChunkMinutes: 0,
  startPreset: "today",
  deadlinePreset: "7-days",
  hardDeadline: false,
  scheduleName: "Work hours",
};

export function readTaskDefaults(): TaskDefaults {
  if (typeof window === "undefined") return DEFAULT_TASK_DEFAULTS;
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(TASK_DEFAULTS_STORAGE_KEY) ?? "{}"
    ) as Partial<TaskDefaults>;
    return { ...DEFAULT_TASK_DEFAULTS, ...stored };
  } catch {
    return DEFAULT_TASK_DEFAULTS;
  }
}

export function writeTaskDefaults(defaults: TaskDefaults) {
  window.localStorage.setItem(
    TASK_DEFAULTS_STORAGE_KEY,
    JSON.stringify(defaults)
  );
}

export function resolveTaskDefaultDate(
  preset: TaskStartPreset | TaskDeadlinePreset,
  includeTime = false
) {
  if (preset === "none") return "";
  const now = newDate();
  let target = now;
  switch (preset) {
    case "tomorrow":
      target = addDays(now, 1);
      break;
    case "this-week":
      target = addDays(now, Math.max(0, 5 - now.getDay()));
      break;
    case "7-days":
      target = addDays(now, 7);
      break;
    case "next-week":
      target = addDays(now, 7 + ((1 - now.getDay() + 7) % 7));
      break;
    case "2-weeks":
      target = addDays(now, 14);
      break;
    case "one-month":
      target = addDays(now, 30);
      break;
    default:
      break;
  }
  return format(target, includeTime ? "yyyy-MM-dd'T'17:00" : "yyyy-MM-dd");
}
