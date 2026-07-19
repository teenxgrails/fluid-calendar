"use client";

import { useState } from "react";

import { DatePicker } from "@/components/ui/date-picker";

import { newDate } from "@/lib/date-utils";

export function StyleDatePickerPreview() {
  const [date, setDate] = useState<Date | null>(() => newDate());

  return (
    <DatePicker
      value={date}
      onChange={setDate}
      ariaLabel="Preview the shared date picker"
      className="w-full border border-[var(--control-border)] bg-[var(--surface-input)]"
    />
  );
}
