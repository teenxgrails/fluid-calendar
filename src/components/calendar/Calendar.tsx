"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { CheckSquare2, Clock3, Settings } from "lucide-react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  IoAddOutline,
  IoChevronDown,
  IoOptionsOutline,
  IoRefreshOutline,
} from "react-icons/io5";
import { toast } from "sonner";

import { DayView } from "@/components/calendar/DayView";
import { MonthView } from "@/components/calendar/MonthView";
import { MultiMonthView } from "@/components/calendar/MultiMonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { TaskModal } from "@/components/tasks/TaskModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { useEventModalStore } from "@/lib/commands/groups/calendar";
import { newDate } from "@/lib/date-utils";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

import { useTaskMutations } from "@/hooks/useTaskMutations";

import { useCalendarStore, useViewStore } from "@/store/calendar";
import { useSettingsStore } from "@/store/settings";
import { useTaskStore } from "@/store/task";

import { CalendarEvent, CalendarFeed } from "@/types/calendar";

const VIEW_LABELS: Record<string, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  multiMonth: "Year",
};

const VIEW_ORDER: Array<"day" | "week" | "month" | "multiMonth"> = [
  "day",
  "week",
  "month",
  "multiMonth",
];

const LOG_SOURCE = "Calendar";
const TOOLBAR_BUTTON_CLASS =
  "flex h-[25px] items-center gap-1.5 rounded-md border border-[#3A3F42] bg-[#313538] px-1.5 py-[3px] text-[13px] font-medium leading-[17px] text-white transition-colors duration-150 ease-out hover:bg-[#383D40] disabled:cursor-wait disabled:opacity-70";
const TOOLBAR_ICON_BUTTON_CLASS =
  "grid h-[25px] w-[25px] place-items-center rounded-md border border-[#3A3F42] bg-[#313538] text-white transition-colors duration-150 ease-out hover:bg-[#383D40]";

interface CalendarProps {
  initialFeeds?: CalendarFeed[];
  initialEvents?: CalendarEvent[];
}

export function Calendar({
  initialFeeds = [],
  initialEvents = [],
}: CalendarProps) {
  const { date: currentDate, setDate, view, setView } = useViewStore();
  const { scheduleAllTasks, scheduleAnimationRevision, tags } = useTaskStore();
  const { createTask } = useTaskMutations();
  const { setFeeds, setEvents } = useCalendarStore();
  const {
    user: userSettings,
    calendar: calendarSettings,
    updateUserSettings,
    updateCalendarSettings,
  } = useSettingsStore();
  const eventModalStore = useEventModalStore();
  const prefersReducedMotion = useReducedMotion();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isRefreshingTasks, setIsRefreshingTasks] = useState(false);

  // Use initial data from server for hydration
  useEffect(() => {
    if (initialFeeds.length > 0) {
      setFeeds(initialFeeds);
    }

    if (initialEvents.length > 0) {
      setEvents(initialEvents);
    }

    // Only fetch from database if we didn't get initial data
    if (!initialFeeds.length || !initialEvents.length) {
      useCalendarStore.getState().loadFromDatabase();
    }

    // Always fetch tasks since they're not pre-loaded
    useTaskStore.getState().fetchTasks();
  }, [initialFeeds, initialEvents, setFeeds, setEvents]);

  const handleAutoSchedule = async () => {
    if (isRefreshingTasks) return;
    setIsRefreshingTasks(true);
    // Inverse-themed "Recalculating tasks..." toast (white on dark, dark on
    // light), matching the Motion reference.
    const toastId = toast.loading("Recalculating tasks...", {
      className: "recalc-toast",
      closeButton: true,
    });
    try {
      const scheduledCount = await scheduleAllTasks();
      toast.success(
        scheduledCount > 0
          ? `${scheduledCount} tasks refreshed on your calendar.`
          : "All tasks are already up to date."
      );
    } catch (error) {
      toast.error("Couldn't refresh tasks. Please try again.");
      void logger.error(
        "Calendar task refresh failed",
        {
          error: error instanceof Error ? error.message : String(error),
        },
        LOG_SOURCE
      );
    } finally {
      toast.dismiss(toastId);
      setIsRefreshingTasks(false);
    }
  };

  const handleViewChange = (nextView: typeof view) => {
    setView(nextView);
  };

  const handleNewEvent = () => {
    const start = newDate();
    eventModalStore.setDefaultDate(start);
    eventModalStore.setDefaultEndDate(
      new Date(start.getTime() + 30 * 60 * 1000)
    );
    eventModalStore.setOpen(true);
  };

  const handleNewTask = () => {
    setIsTaskModalOpen(true);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#1B1D1E] text-white">
      {/* Main Content */}
      <main className="flex min-w-0 flex-1 flex-col bg-[#1B1D1E]">
        {/* Header */}
        <header className="flex h-12 flex-none items-center px-2">
          {/* Right-side actions */}
          <div className="ml-auto flex items-center gap-1">
            {/* Calendar options panel (Motion-style) */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={TOOLBAR_BUTTON_CLASS}
                  title="Calendar options"
                >
                  <IoOptionsOutline className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendar options</span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={6}
                className="w-[322px] border-[#3A3F42] bg-[#202425] p-4 text-[var(--text-hi)]"
              >
                <h3 className="mb-4 text-[16px] font-semibold">Calendar</h3>

                <div className="space-y-2">
                  <div className="flex h-[34px] items-center justify-between gap-3">
                    <span className="text-[14px] text-[#9BA1A6]">
                      Start week on
                    </span>
                    <Select
                      value={userSettings.weekStartDay}
                      onValueChange={(value) =>
                        updateUserSettings({
                          weekStartDay: value as "monday" | "sunday",
                        })
                      }
                    >
                      <SelectTrigger className="h-[30px] w-[104px] border-[#2B2F31] bg-[#151718] px-3 text-[14px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-[#3A3F42] bg-[#202425] text-[#F2F2F2]">
                        <SelectItem
                          value="monday"
                          className="h-[30px] rounded text-[14px] focus:bg-[#2B2F31] data-[state=checked]:bg-[#202425]"
                        >
                          Monday
                        </SelectItem>
                        <SelectItem
                          value="sunday"
                          className="h-[30px] rounded text-[14px] focus:bg-[#2B2F31] data-[state=checked]:bg-[#202425]"
                        >
                          Sunday
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex h-[30px] items-center justify-between gap-3">
                    <span className="text-[14px] text-[#9BA1A6]">
                      24-hour time
                    </span>
                    <Switch
                      className="h-4 w-[26px] border-[#3A3F42] [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-[12px]"
                      checked={userSettings.timeFormat === "24h"}
                      onCheckedChange={(checked) =>
                        updateUserSettings({
                          timeFormat: checked ? "24h" : "12h",
                        })
                      }
                    />
                  </div>

                  <div className="flex h-[30px] items-center justify-between gap-3">
                    <span className="text-[14px] text-[#9BA1A6]">
                      Highlight working hours
                    </span>
                    <Switch
                      className="h-4 w-[26px] border-[#3A3F42] [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-[12px]"
                      checked={calendarSettings.workingHours.enabled}
                      onCheckedChange={(checked) =>
                        updateCalendarSettings({
                          workingHours: {
                            ...calendarSettings.workingHours,
                            enabled: checked,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="my-3 h-px bg-[#2B2F31]" />

                <Link
                  href="/settings#auto-schedule"
                  className="flex h-7 items-center justify-center gap-2 rounded text-[14px] text-[#9BA1A6] transition-colors hover:bg-[#2B2F31] hover:text-white"
                >
                  Auto-scheduling settings
                  <Settings className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/settings#calendar"
                  className="flex h-7 items-center justify-center gap-2 rounded text-[14px] text-[#9BA1A6] transition-colors hover:bg-[#2B2F31] hover:text-white"
                >
                  Calendar settings
                  <Settings className="h-3.5 w-3.5" />
                </Link>
              </PopoverContent>
            </Popover>

            {/* Refresh all tasks (auto-schedule) */}
            <button
              onClick={handleAutoSchedule}
              disabled={isRefreshingTasks}
              aria-busy={isRefreshingTasks}
              className={TOOLBAR_BUTTON_CLASS}
              title="Refresh all tasks"
              data-testid="refresh-all-tasks"
            >
              <IoRefreshOutline
                className={cn("h-4 w-4", isRefreshingTasks && "animate-spin")}
              />
              <span className="hidden md:inline">Refresh all tasks</span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={TOOLBAR_ICON_BUTTON_CLASS}
                  title="Create"
                  aria-label="Create task or event"
                >
                  <IoAddOutline className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={6}
                className="w-[210px] origin-[var(--radix-dropdown-menu-content-transform-origin)] rounded-lg border-[#3A3F42] bg-[#202425] p-1 text-[#F2F2F2] shadow-none data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1"
              >
                <DropdownMenuItem
                  onClick={handleNewTask}
                  className="group flex h-9 cursor-pointer items-center gap-2 rounded px-2 text-[13px] focus:bg-[#2B2F31]"
                >
                  <CheckSquare2 className="h-4 w-4 text-[#9BA1A6] transition-colors group-data-[highlighted]:text-[#F2F2F2]" />
                  <span className="font-medium">Create task</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleNewEvent}
                  className="group flex h-9 cursor-pointer items-center gap-2 rounded border-t border-[#2B2F31] px-2 text-[13px] focus:bg-[#2B2F31]"
                >
                  <Clock3 className="h-4 w-4 text-[#9BA1A6] transition-colors group-data-[highlighted]:text-[#F2F2F2]" />
                  <span className="font-medium">Create event</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={TOOLBAR_BUTTON_CLASS}>
                  {VIEW_LABELS[view]}
                  <IoChevronDown className="h-3.5 w-3.5 text-[#9AA0A6]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {VIEW_ORDER.map((v) => (
                  <DropdownMenuItem
                    key={v}
                    onClick={() => handleViewChange(v)}
                    className={cn(view === v && "text-[var(--accent)]")}
                  >
                    {VIEW_LABELS[v]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Calendar Grid */}
        <div
          className="flex-1 overflow-hidden"
          data-schedule-revision={scheduleAnimationRevision}
        >
          <LayoutGroup id="calendar-schedule">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view}
                className="h-full"
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.15,
                  ease: "easeOut",
                }}
              >
                {view === "day" ? (
                  <DayView currentDate={currentDate} />
                ) : view === "week" ? (
                  <WeekView currentDate={currentDate} />
                ) : view === "month" ? (
                  <MonthView currentDate={currentDate} onDateClick={setDate} />
                ) : (
                  <MultiMonthView
                    currentDate={currentDate}
                    onDateClick={setDate}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </main>
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        tags={tags}
        onSave={async (task) => {
          await createTask(task);
          setIsTaskModalOpen(false);
        }}
        onCreateTag={(name, color) =>
          useTaskStore.getState().createTag({ name, color })
        }
      />
    </div>
  );
}
