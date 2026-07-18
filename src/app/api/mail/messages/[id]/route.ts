import { NextRequest, NextResponse } from "next/server";

import { MailProvider } from "@prisma/client";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { logger } from "@/lib/logger";
import { getMailMessage, updateMailMessage } from "@/lib/mail-db";
import {
  fetchGmailBody,
  fetchImapBody,
  fetchOutlookBody,
  mutateGmailMessage,
  mutateImapMessage,
  mutateOutlookMessage,
} from "@/lib/mail/providers";
import { sanitizeMailHtml } from "@/lib/mail/sanitize";

const LOG_SOURCE = "MailMessageAPI";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  let message = await getMailMessage(auth.userId, id);
  if (!message) {
    return NextResponse.json(
      { error: "Mail message not found." },
      { status: 404 }
    );
  }

  if (!message.bodyHtml) {
    const raw =
      message.account.provider === MailProvider.GMAIL
        ? await fetchGmailBody(message.account, message.externalId)
        : message.account.provider === MailProvider.OUTLOOK
          ? await fetchOutlookBody(message.account, message.externalId)
          : await fetchImapBody(message.account, message.externalId);
    const sanitized = sanitizeMailHtml(raw);
    await updateMailMessage(auth.userId, id, { bodyHtml: sanitized.html });
    message = { ...message, bodyHtml: sanitized.html };
  }

  const sanitized = sanitizeMailHtml(message.bodyHtml || "");
  return NextResponse.json({
    ...message,
    bodyHtml: sanitized.html,
    hasRemoteImages: sanitized.hasRemoteImages,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const message = await getMailMessage(auth.userId, id);
  if (!message) {
    return NextResponse.json(
      { error: "Mail message not found." },
      { status: 404 }
    );
  }
  const body = (await request.json()) as {
    isRead?: boolean;
    archive?: boolean;
  };
  if (body.isRead === undefined && !body.archive) {
    return NextResponse.json(
      { error: "No mail action supplied." },
      { status: 400 }
    );
  }

  try {
    if (message.account.provider === MailProvider.GMAIL) {
      await mutateGmailMessage(message.account, message.externalId, body);
    } else if (message.account.provider === MailProvider.OUTLOOK) {
      await mutateOutlookMessage(message.account, message.externalId, body);
    } else if (body.isRead !== undefined) {
      await mutateImapMessage(message.account, message.externalId, body);
    }
  } catch (error) {
    await logger.error(
      "Mail provider mutation failed",
      {
        messageId: message.id,
        provider: message.account.provider,
        error: error instanceof Error ? error.message : String(error),
      },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Could not update this message at the provider." },
      { status: 502 }
    );
  }

  const updated = await updateMailMessage(auth.userId, id, {
    ...(body.isRead !== undefined && { isRead: body.isRead }),
    ...(body.archive && { isArchived: true }),
  });
  return NextResponse.json(updated);
}
