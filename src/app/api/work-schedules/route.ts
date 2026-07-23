import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  ensureDefaultWorkSchedule,
  sanitizeWorkScheduleInput,
} from "@/lib/work-schedules";

const LOG_SOURCE = "WorkSchedulesAPI";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) return auth.response;

    await ensureDefaultWorkSchedule(prisma, auth.userId);
    const schedules = await prisma.workSchedule.findMany({
      where: { userId: auth.userId },
      include: {
        windows: {
          orderBy: [{ dayOfWeek: "asc" }, { sortOrder: "asc" }],
        },
        _count: { select: { tasks: true } },
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ schedules });
  } catch (error) {
    logger.error(
      "Failed to load work schedules",
      { error: error instanceof Error ? error.message : "Unknown error" },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Failed to load work schedules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) return auth.response;
    const input = sanitizeWorkScheduleInput(await request.json());

    const schedule = await prisma.$transaction(async (tx) => {
      const count = await tx.workSchedule.count({
        where: { userId: auth.userId },
      });
      const makeDefault = input.isDefault || count === 0;
      if (makeDefault) {
        await tx.workSchedule.updateMany({
          where: { userId: auth.userId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.workSchedule.create({
        data: {
          userId: auth.userId,
          name: input.name,
          timeZone: input.timeZone,
          isDefault: makeDefault,
          windows: { create: input.windows },
        },
        include: { windows: true, _count: { select: { tasks: true } } },
      });
    });

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create schedule";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
