import { NextRequest, NextResponse } from "next/server";

import {
  getWeeklyFocusReport,
  recomputeFocusStats,
  recordFocusSession,
} from "@/services/focus/focusStats";
import { FocusSessionMode } from "@prisma/client";

import { authenticateRequest } from "@/lib/auth/api-auth";

const LOG_SOURCE = "focus-route";

function parseMode(value: unknown): FocusSessionMode {
  if (value === FocusSessionMode.FLOW) return FocusSessionMode.FLOW;
  if (value === FocusSessionMode.DEEP_FOCUS) return FocusSessionMode.DEEP_FOCUS;
  return FocusSessionMode.POMODORO;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  const stats = await recomputeFocusStats(auth.userId);
  const weeklyReport = await getWeeklyFocusReport(auth.userId);
  return NextResponse.json({ stats, weeklyReport });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  const body = await request.json();
  const elapsedMinutes = Math.max(1, Math.round(Number(body.elapsedMinutes)));
  const endedAt = body.endedAt ? new Date(body.endedAt) : new Date();
  const startedAt = body.startedAt
    ? new Date(body.startedAt)
    : new Date(endedAt.getTime() - elapsedMinutes * 60_000);

  const session = await recordFocusSession({
    userId: auth.userId,
    taskId: typeof body.taskId === "string" ? body.taskId : null,
    mode: parseMode(body.mode),
    plannedMinutes: body.plannedMinutes
      ? Math.round(Number(body.plannedMinutes))
      : null,
    elapsedMinutes,
    completed: Boolean(body.completed),
    abandoned: Boolean(body.abandoned),
    startedAt,
    endedAt,
  });

  const stats = await recomputeFocusStats(auth.userId);
  const weeklyReport = await getWeeklyFocusReport(auth.userId);
  return NextResponse.json({ session, stats, weeklyReport });
}
