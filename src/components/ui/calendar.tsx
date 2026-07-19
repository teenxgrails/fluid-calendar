"use client";

import * as React from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col",
        month: "space-y-2",
        month_caption: "flex h-8 justify-center relative items-center",
        caption_label: "text-[14px] font-semibold",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 border-0 bg-transparent p-0 text-[var(--text-secondary)] opacity-100 shadow-none hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        month_grid: "w-full border-collapse",
        head_row: "flex",
        head_cell: "w-8 text-[var(--text-muted)] font-medium text-[11px]",
        weekdays: "flex",
        weekday: "w-8 text-[var(--text-muted)] font-medium text-[11px]",
        row: "mt-1 flex w-full",
        week: "mt-1 flex w-full",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 rounded-[4px] p-0 text-[13px] font-normal aria-selected:opacity-100"
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-[var(--surface-selected)] text-[var(--text-inverse)] hover:bg-[var(--surface-selected)] hover:text-[var(--text-inverse)] focus:bg-[var(--surface-selected)] focus:text-[var(--text-inverse)]",
        day_today:
          "font-semibold text-[var(--color-accent)] after:absolute after:bottom-0.5 after:left-1/2 after:h-0.5 after:w-0.5 after:-translate-x-1/2 after:rounded-full after:bg-[var(--color-accent)]",
        day_outside:
          "day-outside text-[var(--text-muted)] opacity-45 aria-selected:opacity-100",
        day_disabled: "text-[var(--text-muted)] opacity-40",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        PreviousMonthButton: (props) => (
          <button {...props}>
            <ChevronLeft className="h-4 w-4" />
          </button>
        ),
        NextMonthButton: (props) => (
          <button {...props}>
            <ChevronRight className="h-4 w-4" />
          </button>
        ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
