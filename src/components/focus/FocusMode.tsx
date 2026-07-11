"use client";

import { useEffect, useState } from "react";

import { ActionOverlay } from "@/components/ui/action-overlay";

import { useFocusModeStore } from "@/store/focusMode";

import { FocusTimerPanel } from "./FocusTimerPanel";
import { FocusedTask } from "./FocusedTask";
import { QuickActions } from "./QuickActions";
import { TaskQueue } from "./TaskQueue";

export function FocusMode() {
  const [mounted, setMounted] = useState(false);

  // Add hydration safety
  const {
    getCurrentTask,
    isProcessing,
    actionType,
    actionMessage,
    stopProcessing,
  } = useFocusModeStore();

  // Get current task and queued tasks - do this before any conditional returns
  const currentTask = getCurrentTask();

  // This effect will only run on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  // If not mounted yet, render a simple loading state
  if (!mounted) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading focus mode...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#1A1D1E]">
      {isProcessing && actionType && (
        <ActionOverlay
          type={actionType}
          message={actionMessage || undefined}
          onComplete={stopProcessing}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar with queued tasks */}
        <aside className="hidden h-full w-[244px] border-r border-[#2B2F31] bg-[#1B1D1E] lg:block">
          <TaskQueue />
        </aside>

        {/* Main content area */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full max-w-[860px] flex-col px-5 py-8 sm:px-10">
            <FocusTimerPanel task={currentTask} />
            <FocusedTask task={currentTask} />
          </div>
        </main>

        {/* Right sidebar with quick actions */}
        <aside className="hidden h-full w-[244px] border-l border-[#2B2F31] bg-[#1B1D1E] xl:block">
          <QuickActions />
        </aside>
      </div>
    </div>
  );
}
