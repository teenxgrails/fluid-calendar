import { NextRequest, NextResponse } from "next/server";

import {
  deleteColumn,
  reorderColumn,
  updateColumn,
} from "@/services/boards/boardService";

import { authenticateRequest } from "@/lib/auth/api-auth";

const LOG_SOURCE = "board-column-route";

// PATCH updates a column (name/color) or reorders it when `toIndex` is present.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; columnId: string }> }
) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  const { columnId } = await params;
  const body = await request.json().catch(() => ({}));

  if (typeof body.toIndex === "number") {
    const column = await reorderColumn(auth.userId, columnId, body.toIndex);
    if (!column) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ column });
  }

  const column = await updateColumn(auth.userId, columnId, {
    name: typeof body.name === "string" ? body.name : undefined,
    color:
      body.color === null || typeof body.color === "string"
        ? body.color
        : undefined,
  });
  if (!column) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ column });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; columnId: string }> }
) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  const { columnId } = await params;
  const result = await deleteColumn(auth.userId, columnId);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
