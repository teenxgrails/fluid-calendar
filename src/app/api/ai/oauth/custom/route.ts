import { NextRequest, NextResponse } from "next/server";

import { AIProvider } from "@prisma/client";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";

const LOG_SOURCE = "ai-oauth";

export async function DELETE(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  await prisma.aIOAuthConnection.deleteMany({
    where: { userId: auth.userId, provider: AIProvider.CUSTOM },
  });
  return NextResponse.json({ connected: false });
}
