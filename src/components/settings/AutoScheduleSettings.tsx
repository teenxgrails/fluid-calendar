"use client";

import { useEffect } from "react";

import { MotionRadioOption } from "@/components/settings/MotionSettingsControls";
import { SettingsSection } from "@/components/settings/SettingsSection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { useCalendarStore } from "@/store/calendar";
import {
  ExternalTaskCalendarMode,
  useCalendarVisibilityStore,
} from "@/store/calendar-visibility";
import { useSettingsStore } from "@/store/settings";

export function AutoScheduleSettings() {
  const { autoSchedule, updateAutoScheduleSettings } = useSettingsStore();
  const { feeds, loadFromDatabase } = useCalendarStore();
  const {
    showTasksOnCalendar,
    externalTaskMode,
    breaksEnabled,
    breakEveryHours,
    setShowTasksOnCalendar,
    setExternalTaskMode,
    setBreaksEnabled,
    setBreakEveryHours,
  } = useCalendarVisibilityStore();

  useEffect(() => {
    void loadFromDatabase();
  }, [loadFromDatabase]);

  const updateExternalMode = (mode: ExternalTaskCalendarMode) => {
    setExternalTaskMode(mode);
    updateAutoScheduleSettings({
      pushTasksToCalendar: mode !== "hidden",
      pushTasksFeedId:
        mode === "hidden"
          ? autoSchedule.pushTasksFeedId
          : autoSchedule.pushTasksFeedId ||
            feeds.find((feed) => feed.type === "GOOGLE")?.id ||
            null,
    });
  };

  const googleFeeds = feeds.filter((feed) => feed.type === "GOOGLE");

  return (
    <SettingsSection>
      <p className="mb-6 text-[13px] leading-5 text-[var(--text-secondary)]">
        Needt checks for conflicts from your &quot;My Calendars&quot; group. To
        modify this group, go to the{" "}
        <a
          href="#calendars"
          className="text-[var(--text-primary)] underline underline-offset-2"
        >
          Calendars
        </a>{" "}
        page in settings.
      </p>

      <div className="space-y-7">
        <div>
          <h2 className="mb-2 text-[15px] font-semibold">
            Show tasks on Needt Calendar?
          </h2>
          <div role="radiogroup" className="space-y-0.5">
            <MotionRadioOption
              checked={showTasksOnCalendar}
              onClick={() => setShowTasksOnCalendar(true)}
            >
              Show tasks on Needt Calendar
            </MotionRadioOption>
            <MotionRadioOption
              checked={!showTasksOnCalendar}
              onClick={() => setShowTasksOnCalendar(false)}
            >
              Don&apos;t show tasks on Needt Calendar
            </MotionRadioOption>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-[15px] font-semibold">
            Show tasks on Google &amp; Outlook calendars?
          </h2>
          <div role="radiogroup" className="space-y-0.5">
            <MotionRadioOption
              checked={externalTaskMode === "free"}
              onClick={() => updateExternalMode("free")}
            >
              Show task blocks on the connected calendar and keep them as free
            </MotionRadioOption>
            <MotionRadioOption
              checked={externalTaskMode === "busy-at-risk"}
              onClick={() => updateExternalMode("busy-at-risk")}
            >
              Show task blocks; tasks at risk of missing a deadline are busy
            </MotionRadioOption>
            <MotionRadioOption
              checked={externalTaskMode === "hidden"}
              onClick={() => updateExternalMode("hidden")}
            >
              Don&apos;t show tasks on Google &amp; Outlook Calendars
            </MotionRadioOption>
          </div>

          {externalTaskMode !== "hidden" && (
            <div className="mt-3 flex max-w-[520px] items-center gap-3 pl-6">
              <span className="text-[13px] text-[var(--text-secondary)]">
                Calendar
              </span>
              <Select
                value={autoSchedule.pushTasksFeedId || ""}
                onValueChange={(pushTasksFeedId) =>
                  updateAutoScheduleSettings({ pushTasksFeedId })
                }
              >
                <SelectTrigger className="h-8 w-[260px]">
                  <SelectValue placeholder="Choose Google calendar" />
                </SelectTrigger>
                <SelectContent>
                  {googleFeeds.map((feed) => (
                    <SelectItem key={feed.id} value={feed.id}>
                      {feed.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-[15px] font-semibold">
            Break between tasks
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-[14px]">
            <Switch
              checked={breaksEnabled}
              onCheckedChange={setBreaksEnabled}
              className="h-[18px] w-[32px] [&>span]:h-3.5 [&>span]:w-3.5 [&>span]:data-[state=checked]:translate-x-3.5"
            />
            <span>Schedule a</span>
            <Select
              value={String(autoSchedule.bufferMinutes)}
              onValueChange={(bufferMinutes) =>
                updateAutoScheduleSettings({
                  bufferMinutes: Number(bufferMinutes),
                })
              }
              disabled={!breaksEnabled}
            >
              <SelectTrigger className="h-8 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 15, 20, 30, 45, 60].map((minutes) => (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {minutes}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>min break every</span>
            <Select
              value={String(breakEveryHours)}
              onValueChange={(hours) => setBreakEveryHours(Number(hours))}
              disabled={!breaksEnabled}
            >
              <SelectTrigger className="h-8 w-[64px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((hours) => (
                  <SelectItem key={hours} value={String(hours)}>
                    {hours}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>hour(s)</span>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
