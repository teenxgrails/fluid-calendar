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
      className={cn("p-0", className)}
      classNames={{
        months: "flex flex-col",
        month: "space-y-0",
        month_caption:
          "relative flex h-[33px] items-start justify-center pb-2",
        caption_label: "text-[14px] font-semibold leading-[21px]",
        nav: "space-x-1 flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "absolute left-0 top-0 h-[25px] w-[25px] border-transparent bg-transparent p-0 text-[var(--text-secondary)] opacity-100 shadow-none hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "absolute right-0 top-0 h-[25px] w-[25px] border-transparent bg-transparent p-0 text-[var(--text-secondary)] opacity-100 shadow-none hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
        ),
        month_grid: "w-[252px] border-collapse",
        head_row: "flex",
        head_cell:
          "w-9 text-center text-[13px] font-normal leading-[17px] text-[var(--text-muted)]",
        weekdays: "flex h-[18px]",
        weekday:
          "w-9 text-center text-[13px] font-normal leading-[17px] text-[var(--text-muted)]",
        row: "my-0.5 flex h-8 w-full",
        week: "my-0.5 flex h-8 w-full",
        day: cn(
          "relative h-8 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "relative mx-0.5 h-8 w-8 rounded-[4px] border border-transparent p-0 text-[14px] font-medium leading-[18px] aria-selected:opacity-100 hover:border-[var(--control-border)] hover:bg-transparent"
        ),
        range_start: "day-range-start",
        range_end: "day-range-end",
        selected:
          "[&>button]:bg-[var(--surface-inverse)] [&>button]:font-extrabold [&>button]:text-[var(--text-inverse)] [&>button:hover]:border-transparent [&>button:hover]:bg-[var(--surface-inverse)] [&>button:hover]:text-[var(--text-inverse)]",
        today:
          "[&>button]:pt-2 [&>button]:font-extrabold [&>button]:text-[var(--color-accent)] [&>button]:before:absolute [&>button]:before:left-1/2 [&>button]:before:top-1 [&>button]:before:-translate-x-1/2 [&>button]:before:text-[6px] [&>button]:before:font-extrabold [&>button]:before:leading-none [&>button]:before:tracking-[0.02em] [&>button]:before:content-['TODAY'] [&.rdp-selected>button]:before:text-[var(--text-inverse)]",
        outside:
          "day-outside [&>button]:font-thin [&>button]:text-[var(--text-muted)] [&>button]:opacity-55 aria-selected:opacity-100",
        disabled: "[&>button]:text-[var(--text-muted)] [&>button]:opacity-40",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
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
