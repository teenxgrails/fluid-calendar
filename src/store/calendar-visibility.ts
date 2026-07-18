import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ExternalTaskCalendarMode = "free" | "busy-at-risk" | "hidden";

interface CalendarVisibilityState {
  showTasksOnCalendar: boolean;
  externalTaskMode: ExternalTaskCalendarMode;
  breaksEnabled: boolean;
  breakEveryHours: number;
  setShowTasksOnCalendar: (show: boolean) => void;
  setExternalTaskMode: (mode: ExternalTaskCalendarMode) => void;
  setBreaksEnabled: (enabled: boolean) => void;
  setBreakEveryHours: (hours: number) => void;
}

export const useCalendarVisibilityStore = create<CalendarVisibilityState>()(
  persist(
    (set) => ({
      showTasksOnCalendar: true,
      externalTaskMode: "hidden",
      breaksEnabled: true,
      breakEveryHours: 2,
      setShowTasksOnCalendar: (showTasksOnCalendar) =>
        set({ showTasksOnCalendar }),
      setExternalTaskMode: (externalTaskMode) => set({ externalTaskMode }),
      setBreaksEnabled: (breaksEnabled) => set({ breaksEnabled }),
      setBreakEveryHours: (breakEveryHours) => set({ breakEveryHours }),
    }),
    { name: "needt-calendar-visibility" }
  )
);
