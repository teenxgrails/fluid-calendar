import { Prisma, PrismaClient } from "@prisma/client";

export interface WorkScheduleWindowInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  sortOrder?: number;
}

export interface EditableScheduleWindow extends Omit<
  WorkScheduleWindowInput,
  "sortOrder"
> {
  id: string;
  sortOrder: number;
}

export interface WorkScheduleInput {
  name: string;
  timeZone: string;
  isDefault?: boolean;
  windows: WorkScheduleWindowInput[];
}

const DEFAULT_WINDOWS: WorkScheduleWindowInput[] = [1, 2, 3, 4, 5].map(
  (dayOfWeek) => ({
    dayOfWeek,
    startTime: "09:00",
    endTime: "17:00",
  })
);

function isTime(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return false;
  const [hours, minutes] = value.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export function sanitizeScheduleWindows(
  value: unknown
): WorkScheduleWindowInput[] {
  if (!Array.isArray(value)) throw new Error("Schedule windows are required");

  const windows = value.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error("Invalid schedule window");
    }
    const candidate = item as Record<string, unknown>;
    const dayOfWeek = Number(candidate.dayOfWeek);
    if (
      !Number.isInteger(dayOfWeek) ||
      dayOfWeek < 0 ||
      dayOfWeek > 6 ||
      !isTime(candidate.startTime) ||
      !isTime(candidate.endTime) ||
      candidate.startTime >= candidate.endTime
    ) {
      throw new Error("Each schedule window needs a valid day and time range");
    }
    return {
      dayOfWeek,
      startTime: candidate.startTime,
      endTime: candidate.endTime,
      sortOrder: Number.isInteger(candidate.sortOrder)
        ? Number(candidate.sortOrder)
        : index,
    };
  });

  windows.sort(
    (a, b) =>
      a.dayOfWeek - b.dayOfWeek ||
      a.startTime.localeCompare(b.startTime) ||
      a.endTime.localeCompare(b.endTime)
  );

  windows.forEach((window, index) => {
    const previous = windows[index - 1];
    if (
      previous?.dayOfWeek === window.dayOfWeek &&
      previous.endTime > window.startTime
    ) {
      throw new Error("Schedule windows cannot overlap");
    }
  });

  return windows.map((window, index) => ({ ...window, sortOrder: index }));
}

export function sanitizeWorkScheduleInput(value: unknown): WorkScheduleInput {
  if (!value || typeof value !== "object") {
    throw new Error("Schedule details are required");
  }
  const input = value as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const timeZone =
    typeof input.timeZone === "string" ? input.timeZone.trim() : "";
  if (!name || name.length > 80) throw new Error("Enter a schedule name");
  if (!timeZone || timeZone.length > 100) throw new Error("Choose a timezone");

  return {
    name,
    timeZone,
    isDefault: input.isDefault === true,
    windows: sanitizeScheduleWindows(input.windows),
  };
}

export function copyScheduleDayWindows(
  windows: EditableScheduleWindow[],
  sourceDay: number,
  targetDays: number[],
  createId: () => string
): EditableScheduleWindow[] {
  const targets = new Set(targetDays.filter((day) => day !== sourceDay));
  const source = windows.filter((window) => window.dayOfWeek === sourceDay);

  return [
    ...windows.filter((window) => !targets.has(window.dayOfWeek)),
    ...[...targets].flatMap((dayOfWeek) =>
      source.map((window, sortOrder) => ({
        ...window,
        id: createId(),
        dayOfWeek,
        sortOrder,
      }))
    ),
  ];
}

export function adjustScheduleWindow(
  window: EditableScheduleWindow,
  mode: "move" | "resize-start" | "resize-end",
  deltaMinutes: number,
  minMinutes: number,
  maxMinutes: number
): EditableScheduleWindow {
  const start = timeToMinutes(window.startTime);
  const end = timeToMinutes(window.endTime);

  if (mode === "move") {
    const duration = end - start;
    const nextStart = Math.max(
      minMinutes,
      Math.min(maxMinutes - duration, start + deltaMinutes)
    );
    return {
      ...window,
      startTime: minutesToTime(nextStart),
      endTime: minutesToTime(nextStart + duration),
    };
  }

  if (mode === "resize-start") {
    return {
      ...window,
      startTime: minutesToTime(
        Math.max(minMinutes, Math.min(end - 15, start + deltaMinutes))
      ),
    };
  }

  return {
    ...window,
    endTime: minutesToTime(
      Math.max(start + 15, Math.min(maxMinutes, end + deltaMinutes))
    ),
  };
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60
  ).padStart(2, "0")}`;
}

type ScheduleClient = Pick<
  PrismaClient,
  "workSchedule" | "userSettings" | "schedulingPreferences"
>;

function legacyWindows(
  value: Prisma.JsonValue | null
): WorkScheduleWindowInput[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_WINDOWS;
  }

  const windows = Object.entries(value).flatMap(([day, raw]) => {
    const dayOfWeek = Number(day);
    const ranges = Array.isArray(raw) ? raw : [raw];
    return ranges.flatMap((range) => {
      if (!range || typeof range !== "object" || Array.isArray(range))
        return [];
      const startTime = "start" in range ? range.start : undefined;
      const endTime = "end" in range ? range.end : undefined;
      return Number.isInteger(dayOfWeek) &&
        isTime(startTime) &&
        isTime(endTime) &&
        startTime < endTime
        ? [{ dayOfWeek, startTime, endTime }]
        : [];
    });
  });

  return windows.length > 0
    ? sanitizeScheduleWindows(windows)
    : DEFAULT_WINDOWS;
}

export async function ensureDefaultWorkSchedule(
  prismaClient: ScheduleClient,
  userId: string
) {
  const existing = await prismaClient.workSchedule.findFirst({
    where: { userId },
    include: { windows: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  if (existing) return existing;

  const [settings, preferences] = await Promise.all([
    prismaClient.userSettings.findUnique({ where: { userId } }),
    prismaClient.schedulingPreferences.findUnique({ where: { userId } }),
  ]);

  return prismaClient.workSchedule.create({
    data: {
      userId,
      name: "Work Hours",
      timeZone: settings?.timeZone || "UTC",
      isDefault: true,
      windows: {
        create: legacyWindows(preferences?.workHours ?? null),
      },
    },
    include: { windows: true },
  });
}
