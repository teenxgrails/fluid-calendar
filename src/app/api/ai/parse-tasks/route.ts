import { NextRequest, NextResponse } from "next/server";

import { parseTasksFallback } from "@/services/ai/fallback-parser";
import { getConfiguredSchedulerAI } from "@/services/ai/settings";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { logger } from "@/lib/logger";

const LOG_SOURCE = "ai-parse-tasks-api";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, LOG_SOURCE);
    if ("response" in auth) return auth.response;

    const body = await request.json();
    const text = typeof body.text === "string" ? body.text : "";
    const { settings, ai } = await getConfiguredSchedulerAI(auth.userId);

    if (!settings.allowParseTasks || !text.trim()) {
      return NextResponse.json({
        tasks: parseTasksFallback(text),
        fallback: true,
      });
    }

    try {
      const tasks = await ai.parseTasks(text);
      return NextResponse.json({
        tasks,
        fallback: settings.provider === "NONE",
      });
    } catch (error) {
      logger.warn(
        "AI parse failed, falling back",
        { error: error instanceof Error ? error.message : String(error) },
        LOG_SOURCE
      );
      return NextResponse.json({
        tasks: parseTasksFallback(text),
        fallback: true,
      });
    }
  } catch (error) {
    logger.error(
      "Failed to parse tasks",
      { error: error instanceof Error ? error.message : String(error) },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Failed to parse tasks" },
      { status: 500 }
    );
  }
}
