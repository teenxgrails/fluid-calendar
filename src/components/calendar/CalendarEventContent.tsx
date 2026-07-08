import { memo } from "react";

import type { EventContentArg } from "@fullcalendar/core";
import { IoCheckmarkCircle, IoRepeat, IoTimeOutline } from "react-icons/io5";

import { getMonthEventDisplay } from "@/lib/calendar-event-display";
import { isTaskOverdue } from "@/lib/task-utils";
import { cn } from "@/lib/utils";

import { useSettingsStore } from "@/store/settings";

import { Priority, TaskStatus } from "@/types/task";

const DEFAULT_EVENT_COLOR = "#3b82f6";

interface CalendarEventContentProps {
  eventInfo: EventContentArg;
}

const priorityColors = {
  [Priority.HIGH]:
    "border-rose-300/80 shadow-[0_0_30px_-18px_rgb(251,113,133)]",
  [Priority.MEDIUM]:
    "border-amber-300/80 shadow-[0_0_30px_-18px_rgb(251,191,36)]",
  [Priority.LOW]: "border-sky-300/80 shadow-[0_0_30px_-18px_rgb(56,189,248)]",
  [Priority.NONE]: "border-white/20",
};

export const CalendarEventContent = memo(function CalendarEventContent({
  eventInfo,
}: CalendarEventContentProps) {
  const { user: userSettings } = useSettingsStore();
  const isTask = eventInfo.event.extendedProps.isTask;
  const isRecurring = eventInfo.event.extendedProps.isRecurring;
  const status = eventInfo.event.extendedProps.status;
  const priority = eventInfo.event.extendedProps.priority;
  const energyRequired = eventInfo.event.extendedProps.energyRequired;
  const location = eventInfo.event.extendedProps.location;
  const calendarName = eventInfo.event.extendedProps.calendarName;
  const dueDate = eventInfo.event.extendedProps?.extendedProps?.dueDate;
  const title = eventInfo.event.title;
  const endTime = eventInfo.event.end?.getTime() ?? 0;
  const startTime = eventInfo.event.start?.getTime() ?? 0;
  const duration = endTime - startTime;

  const isOverdue = isTask && isTaskOverdue({ dueDate, status });

  // Issue #95: surface the start time and calendar color for timed events in
  // month/multi-month views so they read as clearly as the colored all-day
  // events. Time-grid (day/week) views are unaffected.
  // Format the chip in the same time zone FullCalendar renders with (its
  // `local` sentinel today) so the chip time always matches the calendar's own
  // display, even if the browser's local zone differs from the configured one.
  const calendarTimeZone =
    (eventInfo.view.calendar.getOption("timeZone") as string | undefined) ??
    "local";
  const { isDayGridTimed, showTimeChip, timeText } = getMonthEventDisplay({
    viewType: eventInfo.view.type,
    allDay: eventInfo.event.allDay,
    isTask: !!isTask,
    start: eventInfo.event.start,
    isStart: eventInfo.isStart,
    timeFormat: userSettings.timeFormat,
    timeZone: calendarTimeZone,
  });
  const eventColor =
    eventInfo.event.backgroundColor ||
    eventInfo.event.borderColor ||
    DEFAULT_EVENT_COLOR;

  return (
    <div
      data-testid={isTask ? "calendar-task" : "calendar-event"}
      className={cn(
        "flex h-full flex-col justify-start gap-1 overflow-hidden rounded-xl border border-white/10 bg-white/[0.055] px-1.5 py-1 text-[11px] text-foreground backdrop-blur-xl",
        isTask && "border-l-4",
        isTask && priority && priorityColors[priority as Priority],
        isTask &&
          energyRequired === "HIGH" &&
          "shadow-[0_0_34px_-18px_var(--acc-violet)]",
        isTask &&
          energyRequired === "LOW" &&
          "shadow-[0_0_34px_-18px_var(--acc-teal)]",
        isTask &&
          !priority && {
            "border-green-500": status === TaskStatus.COMPLETED,
            "border-yellow-500": status === TaskStatus.IN_PROGRESS,
            "border-gray-500": status === TaskStatus.TODO,
          },
        isOverdue && "border-red-400 font-medium text-red-200",
        status === TaskStatus.COMPLETED && "text-muted-foreground line-through"
      )}
    >
      <div className="flex w-full items-center gap-1.5">
        {isTask ? (
          <IoCheckmarkCircle className="h-3.5 w-3.5 flex-shrink-0 text-current opacity-75" />
        ) : showTimeChip ? (
          isRecurring ? (
            <IoRepeat
              className="h-3.5 w-3.5 flex-shrink-0"
              style={{ color: eventColor }}
            />
          ) : (
            <span
              aria-hidden="true"
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: eventColor }}
            />
          )
        ) : isRecurring ? (
          <IoRepeat className="h-3.5 w-3.5 flex-shrink-0 text-current opacity-75" />
        ) : (
          <IoTimeOutline className="h-3.5 w-3.5 flex-shrink-0 text-current opacity-75" />
        )}
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "calendar-event-title font-medium leading-snug text-foreground",
              duration <= 1800000 ? "truncate" : "line-clamp-2 break-words"
            )}
          >
            {isDayGridTimed && calendarName && (
              <span className="sr-only">{calendarName}, </span>
            )}
            {title}
          </div>
          {timeText && (
            <div className="mt-0.5 truncate text-[10px] font-normal tabular-nums text-muted-foreground">
              {timeText}
            </div>
          )}
        </div>
      </div>
      {location && duration > 1800000 && (
        <div className="event-location truncate pl-5 text-[10px] leading-snug opacity-80">
          {location}
        </div>
      )}
    </div>
  );
});
