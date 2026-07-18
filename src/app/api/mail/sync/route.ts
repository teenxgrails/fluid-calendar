import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/prisma";
import { enqueueMailSync } from "@/lib/queue/enqueue";

const LOG_SOURCE = "MailSyncAPI";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;
  const { accountId } = (await request.json()) as { accountId?: string };
  const accounts = await prisma.mailAccount.findMany({
    where: {
      userId: auth.userId,
      status: "ACTIVE",
      ...(accountId && { id: accountId }),
    },
    select: { id: true },
  });
  await Promise.all(accounts.map((account) => enqueueMailSync(account.id)));
  return NextResponse.json({ queued: accounts.length });
}
