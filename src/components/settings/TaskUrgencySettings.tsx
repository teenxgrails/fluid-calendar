"use client";

import {
  SettingRow,
  SettingsSection,
} from "@/components/settings/SettingsSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useTaskUrgencyStore } from "@/store/taskUrgency";

export function TaskUrgencySettings() {
  const redThresholdHours = useTaskUrgencyStore(
    (state) => state.redThresholdHours
  );
  const yellowThresholdHours = useTaskUrgencyStore(
    (state) => state.yellowThresholdHours
  );
  const setRedThresholdHours = useTaskUrgencyStore(
    (state) => state.setRedThresholdHours
  );
  const setYellowThresholdHours = useTaskUrgencyStore(
    (state) => state.setYellowThresholdHours
  );
  const reset = useTaskUrgencyStore((state) => state.reset);

  return (
    <details className="group max-w-[896px] border-t border-[var(--border-subtle)] pt-4">
      <summary className="cursor-pointer list-none text-[14px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
        Advanced task urgency
      </summary>
      <SettingsSection
        title="Deadline colors"
        description="Control the urgency circles used in Today. Overdue tasks and tasks inside the red window rise first."
      >
        <SettingRow
          label="Red threshold (hours)"
          description="A task due within this many hours — or already overdue — shows a red circle and is pinned to the top."
        >
          <Input
            type="number"
            min={0}
            value={redThresholdHours}
            onChange={(event) =>
              setRedThresholdHours(Number(event.target.value) || 0)
            }
            className="max-w-[120px]"
          />
        </SettingRow>

        <SettingRow
          label="Yellow threshold (hours)"
          description="A task due within this many hours (but beyond the red window) shows a yellow circle. Tasks further out show green."
        >
          <Input
            type="number"
            min={0}
            value={yellowThresholdHours}
            onChange={(event) =>
              setYellowThresholdHours(Number(event.target.value) || 0)
            }
            className="max-w-[120px]"
          />
        </SettingRow>

        <SettingRow
          label="Reset to defaults"
          description="Restore the default thresholds (red ≤ 2h or overdue, yellow ≤ 24h)."
        >
          <Button variant="outline" onClick={reset}>
            Reset
          </Button>
        </SettingRow>
      </SettingsSection>
    </details>
  );
}
