"use client";

import { useEffect } from "react";

import { HiMenu } from "react-icons/hi";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

import { DayView } from "@/components/calendar/DayView";
import { FeedManager } from "@/components/calendar/FeedManager";
import { MonthView } from "@/components/calendar/MonthView";
import { MultiMonthView } from "@/components/calendar/MultiMonthView";
import { SmartPlanningPanel } from "@/components/calendar/SmartPlanningPanel";
import { WeekView } from "@/components/calendar/WeekView";
import { AmbientBackdrop } from "@/components/liquid";

import { addDays, formatDate, newDate, subDays } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

import {
  useCalendarStore,
  useCalendarUIStore,
  useViewStore,
} from "@/store/calendar";
import { useTaskStore } from "@/store/task";

import { CalendarEvent, CalendarFeed } from "@/types/calendar";

interface CalendarProps {
  initialFeeds?: CalendarFeed[];
  initialEvents?: CalendarEvent[];
}

export function Calendar({
  initialFeeds = [],
  initialEvents = [],
}: CalendarProps) {
  const { date: currentDate, setDate, view, setView } = useViewStore();
  const { isSidebarOpen, setSidebarOpen, isHydrated } = useCalendarUIStore();
  const { scheduleAllTasks } = useTaskStore();
  const { setFeeds, setEvents } = useCalendarStore();

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

  const handlePrevWeek = () => {
    if (view === "month" || view === "multiMonth") {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setDate(newDate);
    } else {
      const days = view === "day" ? 1 : 7;
      setDate(subDays(currentDate, days));
    }
  };

  const handleNextWeek = () => {
    if (view === "month" || view === "multiMonth") {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setDate(newDate);
    } else {
      const days = view === "day" ? 1 : 7;
      setDate(addDays(currentDate, days));
    }
  };

  const handleAutoSchedule = async () => {
    await scheduleAllTasks();
  };

  return (
    <div className="relative flex h-full w-full gap-3 overflow-hidden bg-transparent p-3">
      <AmbientBackdrop />
      {/* Sidebar */}
      <aside
        className={cn(
          "glass--subtle h-full w-[230px] flex-none",
          "transform transition-transform duration-300 ease-in-out",
          !isHydrated && "opacity-0 duration-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ marginLeft: isSidebarOpen ? 0 : "-230px" }}
      >
        <div className="flex h-full flex-col p-3">
          <div className="mb-4 flex items-center gap-2 px-1">
            <span className="mina-orb h-8 w-8" />
            <div>
              <div className="text-sm font-semibold">Mina</div>
              <div className="text-[11px] text-muted-foreground">
                Private planner
              </div>
            </div>
          </div>
          <button className="mb-3 flex w-full items-center rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2 text-left text-sm text-muted-foreground hover:bg-white/[0.07]">
            Search or command
          </button>
          <nav className="space-y-1 text-sm">
            {["Inbox", "AI Agenda", "Calendar", "Projects & Tasks"].map(
              (item) => (
                <button
                  key={item}
                  className={cn(
                    "flex w-full items-center rounded-xl px-3 py-2 text-left transition-colors",
                    item === "Calendar"
                      ? "bg-white/10 text-foreground shadow-[0_0_28px_-20px_var(--acc-blue)]"
                      : "text-muted-foreground hover:bg-white/[0.07] hover:text-foreground"
                  )}
                >
                  {item}
                </button>
              )
            )}
          </nav>
          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="px-3 text-xs uppercase text-muted-foreground">
              Favorites
            </div>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <div className="rounded-xl px-3 py-2 hover:bg-white/[0.07]">
                Deep work
              </div>
              <div className="rounded-xl px-3 py-2 hover:bg-white/[0.07]">
                Admin
              </div>
            </div>
          </div>
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto border-t border-white/10 pt-4">
            <div className="px-3 text-xs uppercase text-muted-foreground">
              Workspaces
            </div>
            <div className="mt-2">
              <SmartPlanningPanel />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="glass flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-14 flex-none items-center border-b border-white/10 px-3">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="rounded-xl p-2 text-foreground hover:bg-white/[0.07]"
            title="Toggle Sidebar (b)"
          >
            <HiMenu className="h-5 w-5" />
          </button>

          <div className="ml-3 flex items-center gap-2">
            <button
              onClick={() => setDate(newDate())}
              className="motion-button"
              title="Go to Today (t)"
            >
              Today
            </button>

            <button
              onClick={handleAutoSchedule}
              className="motion-button text-primary glow-blue"
            >
              Auto Schedule
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevWeek}
                className="rounded-xl p-1.5 text-foreground hover:bg-white/[0.07]"
                data-testid="calendar-prev-week"
                title="Previous Week (←)"
              >
                <IoChevronBack className="h-5 w-5" />
              </button>
              <button
                onClick={handleNextWeek}
                className="rounded-xl p-1.5 text-foreground hover:bg-white/[0.07]"
                data-testid="calendar-next-week"
                title="Next Week (→)"
              >
                <IoChevronForward className="h-5 w-5" />
              </button>
            </div>

            <h1 className="px-2 text-sm font-medium text-foreground">
              {formatDate(currentDate)}
            </h1>
          </div>

          {/* View Switching Buttons */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setView("day")}
              className={cn(
                "rounded-xl px-2.5 py-1.5 text-sm font-medium transition-all",
                view === "day"
                  ? "bg-white/10 text-white"
                  : "text-muted-foreground hover:bg-white/[0.07] hover:text-foreground"
              )}
            >
              Day
            </button>
            <button
              onClick={() => setView("week")}
              className={cn(
                "rounded-xl px-2.5 py-1.5 text-sm font-medium transition-all",
                view === "week"
                  ? "bg-white/10 text-white"
                  : "text-muted-foreground hover:bg-white/[0.07] hover:text-foreground"
              )}
            >
              Week
            </button>
            <button
              onClick={() => setView("month")}
              className={cn(
                "rounded-xl px-2.5 py-1.5 text-sm font-medium transition-all",
                view === "month"
                  ? "bg-white/10 text-white"
                  : "text-muted-foreground hover:bg-white/[0.07] hover:text-foreground"
              )}
            >
              Month
            </button>
            <button
              onClick={() => setView("multiMonth")}
              className={cn(
                "rounded-xl px-2.5 py-1.5 text-sm font-medium transition-all",
                view === "multiMonth"
                  ? "bg-white/10 text-white"
                  : "text-muted-foreground hover:bg-white/[0.07] hover:text-foreground"
              )}
            >
              Year
            </button>
          </div>
        </header>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-hidden p-3 pt-0">
          {view === "day" ? (
            <DayView currentDate={currentDate} onDateClick={setDate} />
          ) : view === "week" ? (
            <WeekView currentDate={currentDate} onDateClick={setDate} />
          ) : view === "month" ? (
            <MonthView currentDate={currentDate} onDateClick={setDate} />
          ) : (
            <MultiMonthView currentDate={currentDate} onDateClick={setDate} />
          )}
        </div>
      </main>
      <aside className="hidden h-full w-[300px] flex-none lg:block">
        <FeedManager />
      </aside>
    </div>
  );
}
