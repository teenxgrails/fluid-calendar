"use client";

import * as React from "react";

import {
  Select,
  SelectContent,
  SelectHeader,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";

export interface OptionPickerOption {
  value: string;
  label: string;
  /** Optional leading icon rendered in the trigger and the menu item. */
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface OptionPickerProps {
  options: OptionPickerOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  /** Motion-style header label shown above the options (with a divider). */
  header?: React.ReactNode;
  headerIcon?: React.ReactNode;
  /** Trigger classes. Pass an inline/borderless variant for compact rows. */
  className?: string;
  contentClassName?: string;
  align?: "start" | "center" | "end";
}

/**
 * Canonical single-select picker. Wraps the shared Select primitives so
 * screens reuse one token-based component instead of re-assembling
 * Select/Trigger/Content/Item boilerplate. Defaults to the Settings-style
 * bordered field; pass `className` to get the compact inline trigger used in
 * the task modal rows.
 */
export function OptionPicker({
  options,
  value,
  defaultValue,
  onChange,
  placeholder = "Select…",
  ariaLabel,
  disabled,
  header,
  headerIcon,
  className,
  contentClassName,
  align = "start",
}: OptionPickerProps) {
  const selected = options.find((option) => option.value === value);

  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger aria-label={ariaLabel} className={className}>
        <SelectValue placeholder={placeholder}>
          {selected ? (
            <span className="flex min-w-0 items-center gap-2 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:flex-none">
              {selected.icon}
              <span className="truncate">{selected.label}</span>
            </span>
          ) : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        align={align}
        className={cn("min-w-[var(--radix-select-trigger-width)]", contentClassName)}
        header={
          header != null ? (
            <SelectHeader icon={headerIcon}>{header}</SelectHeader>
          ) : undefined
        }
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            icon={option.icon}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
