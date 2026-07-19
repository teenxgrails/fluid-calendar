"use client";

import { HiCheck, HiPencil, HiTrash } from "react-icons/hi";
import {
  IoCalendarOutline,
  IoFlagOutline,
  IoFolderOutline,
  IoLocationOutline,
  IoLockClosedOutline,
  IoPeopleOutline,
  IoRepeat,
  IoTimeOutline,
} from "react-icons/io5";

import { TaskDescription } from "@/components/tasks/TaskDescription";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";

import { format, isFutureDate, newDate } from "@/lib/date-utils";
import { isTaskOverdue } from "@/lib/task-utils";
import { cn } from "@/lib/utils";

import { useIsMobile } from "@/hooks/use-is-mobile";

import { AttendeeStatus, CalendarEvent } from "@/types/calendar";
import { Priority, Task, TaskStatus } from "@/types/task";

interface Attendee {
  name?: string;
  email: string;
  status?: AttendeeStatus;
}

interface EventQuickViewProps {
  isOpen: boolean;
  onClose: () => void;
  item:
    | (CalendarEvent & {
        attendees?: Attendee[];
        extendedProps?: { isTask?: boolean };
      })
    | (Task & { project?: { name: string; color?: string | null } | null });
  onEdit: () => void;
  onDelete: () => void;
  isTask: boolean;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  referenceElement: HTMLElement | null;
}

//TODO: move to utils
const priorityColors = {
  [Priority.HIGH]: "text-[var(--color-danger)]",
  [Priority.MEDIUM]: "text-[var(--color-warning)]",
  [Priority.LOW]: "text-[var(--primitive-blue-500)]",
  [Priority.NONE]: "text-[var(--text-muted)]",
};

export function EventQuickView({
  isOpen,
  onClose,
  item,
  onEdit,
  onDelete,
  isTask,
  onStatusChange,
  referenceElement,
}: EventQuickViewProps) {
  const isMobile = useIsMobile(640);
  const getStatusColor = (status: string | undefined) => {
    switch (status?.toUpperCase()) {
      case "ACCEPTED":
      case TaskStatus.COMPLETED:
        return "text-[var(--color-success)]";
      case "TENTATIVE":
      case TaskStatus.IN_PROGRESS:
        return "text-[var(--color-warning)]";
      case "DECLINED":
        return "text-[var(--color-danger)]";
      default:
        return "text-[var(--text-muted)]";
    }
  };

  // Cast item to the appropriate type based on isTask
  const taskItem = isTask ? (item as Task) : null;
  const eventItem = !isTask
    ? (item as CalendarEvent & { attendees?: Attendee[] })
    : null;

  const isOverdue = taskItem && isTaskOverdue(taskItem);

  const details = (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="event-title flex items-center gap-2 font-medium text-[var(--text-primary)]">
          {item.title}
          {isTask ? (
            <>
              {taskItem?.isRecurring && (
                <IoRepeat
                  className="h-4 w-4 text-[var(--color-accent)]"
                  title="Recurring task"
                />
              )}
              {taskItem?.scheduleLocked && (
                <IoLockClosedOutline
                  className="h-4 w-4 text-[var(--color-warning)]"
                  title="Schedule locked"
                />
              )}
            </>
          ) : (
            eventItem?.isRecurring && (
              <IoRepeat
                className="h-4 w-4 text-[var(--color-accent)]"
                title="Recurring event"
              />
            )
          )}
        </h3>
        <div className="flex items-center gap-1">
          {isTask && taskItem && onStatusChange && (
            <button
              onClick={() =>
                onStatusChange(
                  taskItem.id,
                  taskItem.status === TaskStatus.COMPLETED
                    ? TaskStatus.TODO
                    : TaskStatus.COMPLETED
                )
              }
              className={cn(
                "grid h-9 w-9 place-items-center rounded-md transition-colors sm:h-8 sm:w-8",
                taskItem.status === TaskStatus.COMPLETED
                  ? "bg-[color-mix(in_srgb,var(--color-success)_14%,transparent)] text-[var(--color-success)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--color-success)]"
              )}
              title={
                taskItem.status === TaskStatus.COMPLETED
                  ? "Mark as todo"
                  : "Mark as completed"
              }
            >
              <HiCheck className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="grid h-9 w-9 place-items-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] sm:h-8 sm:w-8"
            aria-label="Edit"
            title="Edit"
          >
            <HiPencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="grid h-9 w-9 place-items-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--color-danger)] sm:h-8 sm:w-8"
            aria-label="Delete"
            title="Delete"
          >
            <HiTrash className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isTask && eventItem && (
        <div className="space-y-2 text-sm text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <IoTimeOutline className="h-4 w-4 flex-shrink-0" />
            <span>
              {format(newDate(eventItem.start), "PPp")} -{" "}
              {format(newDate(eventItem.end), eventItem.allDay ? "PP" : "p")}
            </span>
          </div>
          {eventItem.location && (
            <div className="flex items-center gap-2">
              <IoLocationOutline className="h-4 w-4 flex-shrink-0" />
              <span className="event-location line-clamp-2">
                {eventItem.location}
              </span>
            </div>
          )}
          {eventItem.attendees && eventItem.attendees.length > 0 && (
            <div className="flex items-start gap-2">
              <IoPeopleOutline className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div className="flex-1">
                {eventItem.attendees.map((attendee) => (
                  <div
                    key={attendee.email}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="event-attendees flex-1 truncate">
                      {attendee.name || attendee.email}
                    </span>
                    <span
                      className={cn(
                        "ml-2 flex-shrink-0",
                        getStatusColor(attendee.status)
                      )}
                    >
                      {attendee.status?.toLowerCase() || "pending"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {eventItem.description && (
            <div className="event-description mt-2 line-clamp-2 text-xs text-[var(--text-muted)]">
              {eventItem.description}
            </div>
          )}
        </div>
      )}

      {isTask && taskItem && (
        <div className="space-y-2 text-sm text-[var(--text-secondary)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IoTimeOutline className="h-4 w-4 flex-shrink-0" />
              {taskItem.dueDate ? (
                <span
                  className={cn(
                    isOverdue && "font-medium text-[var(--color-danger)]",
                    isFutureDate(taskItem.dueDate) &&
                      "font-medium text-[var(--text-primary)]"
                  )}
                >
                  Due {format(newDate(taskItem.dueDate), "PPp")}
                  {isOverdue && " (OVERDUE)"}
                  {isFutureDate(taskItem.dueDate) && " (UPCOMING)"}
                </span>
              ) : (
                <span>No due date</span>
              )}
            </div>
            <span
              className={cn("rounded-full px-2 py-0.5 text-xs", {
                "bg-[color-mix(in_srgb,var(--color-success)_14%,transparent)] text-[var(--color-success)]":
                  taskItem.status === TaskStatus.COMPLETED,
                "bg-[color-mix(in_srgb,var(--color-warning)_12%,transparent)] text-[var(--color-warning)]":
                  taskItem.status === TaskStatus.IN_PROGRESS,
                "bg-[var(--surface-control)] text-[var(--text-secondary)]":
                  taskItem.status === TaskStatus.TODO,
              })}
            >
              {taskItem.status.toLowerCase().replace("_", " ")}
            </span>
          </div>

          {taskItem.startDate && (
            <div className="flex items-center gap-2">
              <IoCalendarOutline className="h-4 w-4 flex-shrink-0" />
              <span
                className={cn(
                  isFutureDate(taskItem.startDate) &&
                    "font-medium text-[var(--text-primary)]"
                )}
              >
                Starts {format(newDate(taskItem.startDate), "PPp")}
                {isFutureDate(taskItem.startDate) && " (UPCOMING)"}
              </span>
            </div>
          )}

          {taskItem.priority && (
            <div className="flex items-center gap-2">
              <IoFlagOutline className="h-4 w-4 flex-shrink-0" />
              <span
                className={cn("text-sm", priorityColors[taskItem.priority])}
              >
                {taskItem.priority.charAt(0).toUpperCase() +
                  taskItem.priority.slice(1)}{" "}
                Priority
              </span>
            </div>
          )}

          {taskItem.isAutoScheduled &&
            taskItem.scheduledStart &&
            taskItem.scheduledEnd && (
              <div className="flex items-center gap-2">
                <IoCalendarOutline className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1">
                  <div>
                    Scheduled: {format(newDate(taskItem.scheduledStart), "PPp")}{" "}
                    - {format(newDate(taskItem.scheduledEnd), "p")}
                  </div>
                  {taskItem.scheduleScore !== undefined && (
                    <div className="text-xs text-[var(--text-muted)]">
                      Confidence:{" "}
                      {Math.round((taskItem.scheduleScore ?? 0) * 100)}%
                    </div>
                  )}
                </div>
              </div>
            )}

          {taskItem.project && (
            <div className="flex items-center gap-2">
              <IoFolderOutline className="h-4 w-4 flex-shrink-0" />
              <span
                className="rounded px-2 py-0.5 text-xs"
                style={{
                  backgroundColor:
                    (taskItem.project.color || "hsl(var(--primary))") + "20",
                  color: taskItem.project.color || "hsl(var(--primary))",
                }}
              >
                {taskItem.project.name}
              </span>
            </div>
          )}

          {taskItem.duration && (
            <div className="flex items-center gap-2">
              <IoTimeOutline className="h-4 w-4 flex-shrink-0" />
              <span>Duration: {taskItem.duration} minutes</span>
            </div>
          )}

          {taskItem.tags && taskItem.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {taskItem.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
                  style={{
                    backgroundColor:
                      (tag.color || "hsl(var(--primary))") + "20",
                    color: tag.color || "hsl(var(--primary))",
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {taskItem.description && (
            <TaskDescription
              value={taskItem.description}
              compact
              className="task-description mt-2 text-xs text-[var(--text-muted)]"
            />
          )}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <BottomSheetContent
          aria-describedby={undefined}
          className="max-h-[78dvh] px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <BottomSheetTitle className="sr-only">
            {isTask ? "Task details" : "Event details"}
          </BottomSheetTitle>
          {details}
        </BottomSheetContent>
      </BottomSheet>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <PopoverAnchor asChild>
        <div
          aria-hidden="true"
          className="pointer-events-none fixed h-px w-px"
          style={{
            left: referenceElement
              ? referenceElement.getBoundingClientRect().left
              : 0,
            top: referenceElement
              ? referenceElement.getBoundingClientRect().top
              : 0,
          }}
        />
      </PopoverAnchor>
      <PopoverContent
        className="z-[10000] w-[min(340px,calc(100vw-24px))] border-[var(--popover-border)] bg-[var(--popover-bg)] p-4 text-[var(--text-primary)] shadow-lg"
        align="start"
        sideOffset={24}
        onOpenAutoFocus={(event) => event.preventDefault()}
        forceMount
      >
        {details}
      </PopoverContent>
    </Popover>
  );
}
