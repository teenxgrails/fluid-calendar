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
    <div className="flex h-full w-full gap-2 overflow-hidden bg-[#1A1D1E] p-2 text-white">
      {/* Sidebar */}
      <aside
        className={cn(
          "h-full w-[230px] flex-none rounded-md border border-[#323234] bg-[#1A1D1E]",
          "transform transition-transform duration-300 ease-in-out",
          !isHydrated && "opacity-0 duration-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ marginLeft: isSidebarOpen ? 0 : "-230px" }}
      >
        <div className="flex h-full flex-col p-2">
          <div className="mb-3 flex items-center gap-2 px-1">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-[#262627] text-xs font-semibold">
              M
            </span>
            <div>
              <div className="text-sm font-semibold">Mina</div>
              <div className="text-[11px] text-[#9AA0A6]">Private planner</div>
            </div>
          </div>
          <button className="mb-2 flex w-full items-center rounded-md border border-[#323234] bg-[#262627] px-2.5 py-1.5 text-left text-[13px] text-[#9AA0A6] hover:bg-[#2B2F31] hover:text-white">
            Search or command
          </button>
          <nav className="space-y-0.5 text-[13px]">
            {["Inbox", "AI Agenda", "Calendar", "Projects & Tasks"].map(
              (item) => (
                <button
                  key={item}
                  className={cn(
                    "flex w-full items-center rounded-md px-2.5 py-1.5 text-left transition-colors",
                    item === "Calendar"
                      ? "bg-[#2B2F31] text-white"
                      : "text-[#9AA0A6] hover:bg-[#2B2F31] hover:text-white"
                  )}
                >
                  {item}
                </button>
              )
            )}
          </nav>
          <div className="mt-4 border-t border-[#323234] pt-3">
            <div className="px-2.5 text-[11px] uppercase text-[#9AA0A6]">
              Favorites
            </div>
            <div className="mt-1 space-y-0.5 text-[13px] text-[#9AA0A6]">
              <div className="rounded-md px-2.5 py-1.5 hover:bg-[#2B2F31] hover:text-white">
                Deep work
              </div>
              <div className="rounded-md px-2.5 py-1.5 hover:bg-[#2B2F31] hover:text-white">
                Admin
              </div>
            </div>
          </div>
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto border-t border-[#323234] pt-3">
            <div className="px-2.5 text-[11px] uppercase text-[#9AA0A6]">
              Workspaces
            </div>
            <div className="mt-1">
              <SmartPlanningPanel />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex min-w-0 flex-1 flex-col rounded-md border border-[#323234] bg-[#1A1D1E]">
        {/* Header */}
        <header className="flex h-12 flex-none items-center border-b border-[#323234] px-2">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="rounded-md p-1.5 text-white hover:bg-[#2B2F31]"
            title="Toggle Sidebar (b)"
          >
            <HiMenu className="h-5 w-5" />
          </button>

          <div className="ml-2 flex items-center gap-1.5">
            <button
              onClick={() => setDate(newDate())}
              className="rounded-md border border-[#323234] bg-[#262627] px-2 py-1 text-[13px] font-medium text-white hover:bg-[#2B2F31]"
              title="Go to Today (t)"
            >
              Today
            </button>

            <button
              onClick={handleAutoSchedule}
              className="rounded-md border border-[#323234] bg-[#262627] px-2 py-1 text-[13px] font-medium text-white hover:bg-[#2B2F31]"
            >
              Auto Schedule
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevWeek}
                className="rounded-md p-1.5 text-white hover:bg-[#2B2F31]"
                data-testid="calendar-prev-week"
                title="Previous Week (←)"
              >
                <IoChevronBack className="h-5 w-5" />
              </button>
              <button
                onClick={handleNextWeek}
                className="rounded-md p-1.5 text-white hover:bg-[#2B2F31]"
                data-testid="calendar-next-week"
                title="Next Week (→)"
              >
                <IoChevronForward className="h-5 w-5" />
              </button>
            </div>

            <h1 className="px-1.5 text-sm font-medium text-white">
              {formatDate(currentDate)}
            </h1>
          </div>

          {/* View Switching Buttons */}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setView("day")}
              className={cn(
                "rounded-md px-2 py-1 text-[13px] font-medium transition-all",
                view === "day"
                  ? "bg-[#2B2F31] text-white"
                  : "text-[#9AA0A6] hover:bg-[#2B2F31] hover:text-white"
              )}
            >
              Day
            </button>
            <button
              onClick={() => setView("week")}
              className={cn(
                "rounded-md px-2 py-1 text-[13px] font-medium transition-all",
                view === "week"
                  ? "bg-[#2B2F31] text-white"
                  : "text-[#9AA0A6] hover:bg-[#2B2F31] hover:text-white"
              )}
            >
              Week
            </button>
            <button
              onClick={() => setView("month")}
              className={cn(
                "rounded-md px-2 py-1 text-[13px] font-medium transition-all",
                view === "month"
                  ? "bg-[#2B2F31] text-white"
                  : "text-[#9AA0A6] hover:bg-[#2B2F31] hover:text-white"
              )}
            >
              Month
            </button>
            <button
              onClick={() => setView("multiMonth")}
              className={cn(
                "rounded-md px-2 py-1 text-[13px] font-medium transition-all",
                view === "multiMonth"
                  ? "bg-[#2B2F31] text-white"
                  : "text-[#9AA0A6] hover:bg-[#2B2F31] hover:text-white"
              )}
            >
              Year
            </button>
          </div>
        </header>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-hidden p-2 pt-0">
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
