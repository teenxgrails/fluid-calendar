import { NextRequest, NextResponse } from "next/server";

import { createBoard, listBoards } from "@/services/boards/boardService";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { canCreateBoard } from "@/lib/boards/can-create-board";
import { logger } from "@/lib/logger";

const LOG_SOURCE = "boards-route";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  const boards = await listBoards(auth.userId);
  return NextResponse.json({ boards });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  if (!(await canCreateBoard(auth.userId))) {
    return NextResponse.json(
      { error: "Board limit reached" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  if (typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const board = await createBoard(auth.userId, {
      name: body.name,
      icon: typeof body.icon === "string" ? body.icon : null,
      columns: Array.isArray(body.columns)
        ? body.columns.filter((c: unknown): c is string => typeof c === "string")
        : undefined,
    });
    return NextResponse.json({ board });
  } catch (error) {
    logger.error(
      "Failed to create board",
      { error: error instanceof Error ? error.message : String(error) },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Failed to create board" },
      { status: 500 }
    );
  }
}
