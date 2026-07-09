import { NextRequest, NextResponse } from "next/server";

import { scheduleAllTasksForUser } from "@/services/scheduling/TaskSchedulingService";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import {
  getConfiguredSchedulerAI,
  getEncryptedKeyForProvider,
} from "@/services/ai/settings";

const LOG_SOURCE = "ai-chat";

function titleFromMessage(message: string) {
  return message.trim().slice(0, 42) || "New chat";
}

function isDestructive(message: string) {
  return /\b(delete|remove|wipe|clear|reschedule all|replan all)\b/i.test(
    message
  );
}

async function runTool(message: string, userId: string, confirmed: boolean) {
  const lower = message.toLowerCase();

  if (isDestructive(message) && !confirmed) {
    return {
      text:
        "This may change or delete existing planner data. Confirm the action to continue.",
      toolName: "confirmation_required",
      toolPayload: { message },
      requiresConfirm: true,
    };
  }

  if (lower.includes("schedule") || lower.includes("reschedule")) {
    const tasks = await scheduleAllTasksForUser(userId);
    return {
      text: `I triggered the deterministic auto-scheduler. ${tasks.length} tasks were returned from the scheduling run.`,
      toolName: "auto_schedule",
      toolPayload: { taskCount: tasks.length },
      requiresConfirm: false,
    };
  }

  const createMatch = message.match(/create (?:a )?task(?: called| named)? (.+)/i);
  if (createMatch?.[1]) {
    const title = createMatch[1].replace(/[.!?]$/, "").slice(0, 160);
    const task = await prisma.task.create({
      data: {
        userId,
        title,
        status: "todo",
        isAutoScheduled: true,
        scheduleLocked: false,
      },
    });
    return {
      text: `Created task: ${task.title}`,
      toolName: "create_task",
      toolPayload: { taskId: task.id, title: task.title },
      requiresConfirm: false,
    };
  }

  if (lower.includes("what should i work on") || lower.includes("next")) {
    const tasks = await prisma.task.findMany({
      where: { userId, status: { not: "completed" } },
      orderBy: [{ scheduledStart: "asc" }, { dueDate: "asc" }],
      take: 5,
    });
    return {
      text: tasks.length
        ? `Next up: ${tasks.map((task) => task.title).join(", ")}.`
        : "You have no open tasks with schedule or due-date priority.",
      toolName: "query_schedule",
      toolPayload: { taskIds: tasks.map((task) => task.id) },
      requiresConfirm: false,
    };
  }

  return {
    text:
      "I can help with tasks, projects, calendar questions, and deterministic auto-scheduling. Try: “create task called Review plan” or “reschedule my day.”",
    toolName: null,
    toolPayload: null,
    requiresConfirm: false,
  };
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  const { settings } = await getConfiguredSchedulerAI(auth.userId);
  if (
    settings.provider === "NONE" ||
    !getEncryptedKeyForProvider(settings, settings.provider)
  ) {
    return NextResponse.json(
      { error: "Connect an AI provider key before using chat." },
      { status: 409 }
    );
  }

  const body = await request.json();
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const confirmed = Boolean(body.confirmed);
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const conversation =
    typeof body.conversationId === "string" && body.conversationId
      ? await prisma.aiConversation.findFirst({
          where: { id: body.conversationId, userId: auth.userId },
        })
      : await prisma.aiConversation.create({
          data: { userId: auth.userId, title: titleFromMessage(message) },
        });

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  await prisma.aiMessage.create({
    data: {
      conversationId: conversation.id,
      userId: auth.userId,
      role: "user",
      content: message,
    },
  });

  const result = await runTool(message, auth.userId, confirmed);
  await prisma.aiMessage.create({
    data: {
      conversationId: conversation.id,
      userId: auth.userId,
      role: "assistant",
      content: result.text,
      toolName: result.toolName,
      toolPayload: result.toolPayload || undefined,
      requiresConfirm: result.requiresConfirm,
    },
  });
  await prisma.aiConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  const encoder = new TextEncoder();
  const words = result.text.split(/(\s+)/);
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(
          JSON.stringify({
            type: "meta",
            conversationId: conversation.id,
            requiresConfirm: result.requiresConfirm,
            toolName: result.toolName,
            toolPayload: result.toolPayload,
          }) + "\n"
        )
      );
      for (const word of words) {
        controller.enqueue(
          encoder.encode(JSON.stringify({ type: "token", value: word }) + "\n")
        );
        await new Promise((resolve) => setTimeout(resolve, 12));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
