import { useEffect } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useCalendarStore } from "@/store/calendar";
import { useSettingsStore } from "@/store/settings";

import { SettingRow, SettingsSection } from "./SettingsSection";

export function CalendarSettings() {
  const { calendar, updateCalendarSettings } = useSettingsStore();
  const { feeds, loadFromDatabase } = useCalendarStore();

  // Load feeds when component mounts
  useEffect(() => {
    loadFromDatabase();
  }, [loadFromDatabase]);

  return (
    <SettingsSection
      title="Calendars"
      description="Choose where new events go and manage connected calendars."
    >
      <SettingRow
        label="Default Calendar"
        description="Choose which calendar new events are added to by default"
      >
        <Select
          value={calendar.defaultCalendarId || "none"}
          onValueChange={(value) =>
            updateCalendarSettings({
              defaultCalendarId: value === "none" ? "" : value,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a default calendar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Select a default calendar</SelectItem>
            {feeds
              .filter((feed) => feed.enabled)
              .map((feed) => (
                <SelectItem key={feed.id} value={feed.id}>
                  {feed.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </SettingRow>
    </SettingsSection>
  );
}
