import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { listMailMessages } from "@/lib/mail-db";

const LOG_SOURCE = "MailMessagesAPI";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;
  const accountId = request.nextUrl.searchParams.get("accountId");
  const cursor = request.nextUrl.searchParams.get("cursor");
  const result = await listMailMessages({
    userId: auth.userId,
    accountId,
    cursor,
  });
  const hasMore = result.length > 60;
  const messages = hasMore ? result.slice(0, 60) : result;
  return NextResponse.json({
    messages,
    nextCursor: hasMore ? messages.at(-1)?.id : null,
  });
}
