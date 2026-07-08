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
    <div className="flex h-full flex-col bg-transparent p-3">
      {isProcessing && actionType && (
        <ActionOverlay
          type={actionType}
          message={actionMessage || undefined}
          onComplete={stopProcessing}
        />
      )}

      <div className="flex flex-1 gap-3 overflow-hidden">
        {/* Left sidebar with queued tasks */}
        <aside className="glass hidden h-full w-80 lg:block">
          <TaskQueue />
        </aside>

        {/* Main content area */}
        <main className="min-w-0 flex-1 space-y-6 overflow-y-auto p-1 sm:p-4">
          <FocusTimerPanel task={currentTask} />
          <FocusedTask task={currentTask} />
        </main>

        {/* Right sidebar with quick actions */}
        <aside className="glass hidden h-full w-64 xl:block">
          <QuickActions />
        </aside>
      </div>
    </div>
  );
}
