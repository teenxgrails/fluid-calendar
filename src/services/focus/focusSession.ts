import { recomputeTaskActuals } from "@/services/time-tracking/timeEntries";
import { FocusSession, FocusSessionMode, TimeEntrySource } from "@prisma/client";

import { newDate } from "@/lib/date-utils";
import { focusedMinutes, projectedEndsAt } from "@/lib/focus-timer";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

import { TaskStatus } from "@/types/task";

import { recomputeFocusStats } from "./focusStats";

const LOG_SOURCE = "focusSession";

/**
 * The active session is the single FocusSession for a user with endedAt = null.
 * Server-side lifecycle: start -> (pause/resume)* -> stop. The client never
 * owns timing; it renders from these persisted fields via `@/lib/focus-timer`.
 */
export async function getActiveSession(
  userId: string
): Promise<FocusSession | null> {
  return prisma.focusSession.findFirst({
    where: { userId, endedAt: null },
    orderBy: { startedAt: "desc" },
  });
}

export async function startSession(input: {
  userId: string;
  taskId?: string | null;
  mode: FocusSessionMode;
  plannedMinutes?: number | null;
  source?: string;
}): Promise<FocusSession> {
  // Only one active session per user: abandon any lingering active one first.
  const existing = await getActiveSession(input.userId);
  if (existing) {
    await finalizeSession({
      userId: input.userId,
      sessionId: existing.id,
      completed: false,
    });
  }

  const session = await prisma.focusSession.create({
    data: {
      userId: input.userId,
      taskId: input.taskId || null,
      mode: input.mode,
      plannedMinutes: input.plannedMinutes ?? null,
      elapsedMinutes: 0,
      startedAt: newDate(),
      source: input.source || "web",
    },
  });

  logger.info(
    "Started focus session",
    { sessionId: session.id, mode: session.mode },
    LOG_SOURCE
  );
  return session;
}

export async function pauseSession(
  userId: string,
  sessionId: string
): Promise<FocusSession | null> {
  const session = await prisma.focusSession.findFirst({
    where: { id: sessionId, userId, endedAt: null },
  });
  if (!session || session.pausedAt) return session;

  return prisma.focusSession.update({
    where: { id: session.id },
    data: { pausedAt: newDate() },
  });
}

export async function resumeSession(
  userId: string,
  sessionId: string
): Promise<FocusSession | null> {
  const session = await prisma.focusSession.findFirst({
    where: { id: sessionId, userId, endedAt: null },
  });
  if (!session || !session.pausedAt) return session;

  const pausedSeconds = Math.max(
    0,
    Math.floor((newDate().getTime() - session.pausedAt.getTime()) / 1000)
  );

  return prisma.focusSession.update({
    where: { id: session.id },
    data: {
      pausedAt: null,
      pausedTotalSeconds: session.pausedTotalSeconds + pausedSeconds,
    },
  });
}

/**
 * Finalize (stop) a session: write endedAt, the focused minutes, and the
 * completed/abandoned outcome. On a completed, task-bound session we also log a
 * TimeEntry, roll the task's actual minutes, and bump `actualFocusedMinutes`.
 * Optionally marks the bound task done.
 */
export async function finalizeSession(input: {
  userId: string;
  sessionId: string;
  completed: boolean;
  markTaskDone?: boolean;
}): Promise<FocusSession | null> {
  const session = await prisma.focusSession.findFirst({
    where: { id: input.sessionId, userId: input.userId, endedAt: null },
  });
  if (!session) return null;

  const endedAt = newDate();
  // Fold any in-progress pause into the total so focused minutes are accurate.
  const pausedTotalSeconds = session.pausedAt
    ? session.pausedTotalSeconds +
      Math.max(
        0,
        Math.floor((endedAt.getTime() - session.pausedAt.getTime()) / 1000)
      )
    : session.pausedTotalSeconds;

  const minutes = focusedMinutes(
    {
      startedAt: session.startedAt,
      plannedMinutes: session.plannedMinutes,
      pausedTotalSeconds,
      pausedAt: null,
    },
    endedAt
  );

  const finalized = await prisma.focusSession.update({
    where: { id: session.id },
    data: {
      endedAt,
      pausedAt: null,
      pausedTotalSeconds,
      elapsedMinutes: minutes,
      completed: input.completed,
      abandoned: !input.completed,
    },
  });

  if (session.taskId && input.completed && minutes > 0) {
    await prisma.timeEntry.create({
      data: {
        taskId: session.taskId,
        userId: input.userId,
        startedAt: session.startedAt,
        endedAt,
        source: TimeEntrySource.focus,
      },
    });
    await prisma.task.update({
      where: { id: session.taskId },
      data: { actualFocusedMinutes: { increment: minutes } },
    });
    await recomputeTaskActuals(session.taskId);
  }

  if (session.taskId && input.markTaskDone) {
    await prisma.task.update({
      where: { id: session.taskId },
      data: { status: TaskStatus.COMPLETED, completedAt: endedAt },
    });
  }

  await recomputeFocusStats(input.userId);

  logger.info(
    "Finalized focus session",
    { sessionId: session.id, completed: input.completed, minutes },
    LOG_SOURCE
  );
  return finalized;
}

/**
 * Lightweight active-session snapshot.
 *
 * GET /api/focus/active returns this shape ({ active, taskId, endsAt }). A
 * future Chrome extension will poll that endpoint to enforce website/app
 * blocking while a focus session is running, so keep the shape stable and
 * cheap. `endsAt` is null for a free/flow session (no fixed end) or when no
 * session is active.
 */
export function activeSummary(session: FocusSession | null): {
  active: boolean;
  taskId: string | null;
  endsAt: string | null;
} {
  if (!session) return { active: false, taskId: null, endsAt: null };
  const endsAt = projectedEndsAt(
    {
      startedAt: session.startedAt,
      plannedMinutes: session.plannedMinutes,
      pausedTotalSeconds: session.pausedTotalSeconds,
      pausedAt: session.pausedAt,
    },
    newDate()
  );
  return {
    active: true,
    taskId: session.taskId,
    endsAt: endsAt ? endsAt.toISOString() : null,
  };
}
