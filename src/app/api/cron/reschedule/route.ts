import { NextRequest, NextResponse } from "next/server";

import { scheduleAllTasksForUser } from "@/services/scheduling/TaskSchedulingService";

import { requireCronSecret } from "@/lib/cron/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;

  const users = await prisma.user.findMany({ select: { id: true } });
  const results = [];

  for (const user of users) {
    try {
      const tasks = await scheduleAllTasksForUser(user.id);
      results.push({ userId: user.id, taskCount: tasks.length, ok: true });
    } catch (error) {
      results.push({
        userId: user.id,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return NextResponse.json({ ok: true, results });
}
