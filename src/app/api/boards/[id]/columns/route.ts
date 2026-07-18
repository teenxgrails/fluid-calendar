import { NextRequest, NextResponse } from "next/server";

import { createColumn } from "@/services/boards/boardService";

import { authenticateRequest } from "@/lib/auth/api-auth";

const LOG_SOURCE = "board-columns-route";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const column = await createColumn(auth.userId, id, {
    name: typeof body.name === "string" ? body.name : "New column",
    color: typeof body.color === "string" ? body.color : null,
  });
  if (!column) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ column });
}
