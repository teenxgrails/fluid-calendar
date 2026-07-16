"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  CalendarDays,
  CheckSquare2,
  Clock3,
  CornerDownLeft,
} from "lucide-react";

import { Input } from "@/components/ui/input";

import { cn } from "@/lib/utils";

import { useTaskMutations } from "@/hooks/useTaskMutations";

import {
  SchedulingEnergyLevel,
  SchedulingTaskPriority,
  TaskStatus,
} from "@/types/task";

export interface QuickCreateSelection {
  start: Date;
  end: Date;
  allDay: boolean;
  point?: { x: number; y: number };
}

interface CalendarQuickCreateProps {
  selection?: QuickCreateSelection;
  onClose: () => void;
  onOpenTaskEditor: () => void;
  onOpenEventEditor: () => void;
}

export function CalendarQuickCreate({
  selection,
  onClose,
  onOpenTaskEditor,
  onOpenEventEditor,
}: CalendarQuickCreateProps) {
  const { createTask } = useTaskMutations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const close = useCallback(() => {
    setTitle("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!selection) {
      setTitle("");
      return;
    }

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selection, close]);

  const create = async () => {
    if (!selection || !title.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const duration = Math.max(
        15,
        Math.round(
          (selection.end.getTime() - selection.start.getTime()) / 60000
        )
      );
      await createTask({
        title: title.trim(),
        status: TaskStatus.TODO,
        startDate: selection.start,
        deadline: selection.end,
        duration,
        estimatedMinutes: duration,
        estLikely: duration,
        energyRequired: SchedulingEnergyLevel.MEDIUM,
        priorityLevel: SchedulingTaskPriority.MEDIUM,
        tagIds: [],
        projectId: null,
        isRecurring: false,
        isAutoScheduled: true,
        autoScheduled: true,
        scheduleLocked: false,
        isFrozen: false,
      });
      close();
    } finally {
      setIsCreating(false);
    }
  };

  if (!selection) return null;

  const top = Math.min(
    Math.max(selection.point?.y ?? 220, 84),
    window.innerHeight - 184
  );
  const left = Math.min(
    Math.max(selection.point?.x ?? 320, 16),
    window.innerWidth - 336
  );

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[69] cursor-default bg-transparent"
        onPointerDown={close}
      />
      <div
        role="dialog"
        aria-modal="false"
        aria-label="Create task or event"
        className="fixed z-[70] w-[320px] animate-in rounded-[var(--popover-radius)] border border-[var(--popover-border)] bg-[var(--popover-bg)] p-1.5 text-[var(--text-primary)] shadow-lg fade-in-0 slide-in-from-top-1 duration-150 motion-reduce:animate-none"
        style={{ left, top }}
      >
        <div className="flex h-7 items-center gap-2 px-2 text-[12px] text-[var(--text-secondary)]">
          <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.8} />
          <span>{selection.allDay ? "All day" : "Selected time"}</span>
        </div>
        <Input
          ref={inputRef}
          aria-label="Task title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void create();
            }
          }}
          placeholder="What needs to happen?"
          className="h-9 px-3 text-[13px]"
        />
        <div className="mt-1.5 grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => void create()}
            disabled={!title.trim() || isCreating}
            className={cn(
              "flex h-9 items-center gap-2 rounded-md border px-2.5 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--control-border)]",
              title.trim()
                ? "border-[var(--control-border)] bg-[var(--control-bg)] text-[var(--text-primary)] hover:bg-[var(--control-bg-hover)]"
                : "cursor-not-allowed border-[var(--border-subtle)] bg-[var(--surface-hover)] text-[var(--text-muted)]"
            )}
          >
            <CheckSquare2 className="h-3.5 w-3.5" strokeWidth={1.8} />
            {isCreating ? "Creating…" : "Create task"}
          </button>
          <button
            type="button"
            onClick={() => {
              setTitle("");
              onOpenEventEditor();
            }}
            className="flex h-9 items-center gap-2 rounded-md px-2.5 text-left text-[13px] text-[var(--text-primary)] transition-colors hover:bg-[var(--menu-item-hover)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--control-border)]"
          >
            <Clock3
              className="h-3.5 w-3.5 text-[var(--text-secondary)]"
              strokeWidth={1.8}
            />
            Create event
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setTitle("");
            onOpenTaskEditor();
          }}
          className="mt-1 flex h-9 w-full items-center justify-between rounded-md border-t border-[var(--border-subtle)] px-2.5 text-left text-[13px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--menu-item-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--control-border)]"
        >
          <span>More task options</span>
          <CornerDownLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      </div>
    </>
  );
}
