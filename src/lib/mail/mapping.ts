import { Prisma } from "@prisma/client";
import PostalMime from "postal-mime";

import { newDate } from "@/lib/date-utils";
import {
  GmailHeader,
  GmailMessagePayload,
  GmailMessageResource,
  GraphMailMessage,
  MailAddress,
  MailMessageSyncInput,
} from "@/lib/mail/types";

function headerValue(headers: GmailHeader[] | undefined, name: string) {
  return headers?.find(
    (header) => header.name?.toLowerCase() === name.toLowerCase()
  )?.value;
}

export function parseAddress(value?: string | null): MailAddress | null {
  if (!value) return null;
  const match = value.match(/^\s*(?:"?([^"]*)"?\s*)?<([^>]+)>\s*$/);
  if (match) {
    return {
      name: match[1]?.trim() || undefined,
      address: match[2].trim(),
    };
  }
  return { address: value.trim() };
}

export function parseAddressList(value?: string | null): MailAddress[] {
  if (!value) return [];
  return value
    .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map(parseAddress)
    .filter((address): address is MailAddress => address !== null);
}

export function mapGmailMessage(
  message: GmailMessageResource
): MailMessageSyncInput | null {
  if (!message.id) return null;
  const headers = message.payload?.headers ?? [];
  const from = parseAddress(headerValue(headers, "From"));
  const labels = message.labelIds ?? [];
  return {
    externalId: message.id,
    threadId: message.threadId ?? null,
    fromName: from?.name ?? null,
    fromAddress: from?.address ?? null,
    toAddresses: parseAddressList(headerValue(headers, "To")).map(
      ({ name, address }) => ({ name: name ?? null, address })
    ) as Prisma.InputJsonValue,
    subject: headerValue(headers, "Subject") || "(no subject)",
    snippet: message.snippet || "",
    date: newDate(
      Number(message.internalDate) || headerValue(headers, "Date") || undefined
    ),
    isRead: !labels.includes("UNREAD"),
    isArchived: !labels.includes("INBOX"),
    labels,
  };
}

export function mapGraphMessage(
  message: GraphMailMessage
): MailMessageSyncInput | null {
  if (!message.id || message["@removed"]) return null;
  const from = message.from?.emailAddress;
  return {
    externalId: message.id,
    threadId: message.conversationId ?? null,
    fromName: from?.name ?? null,
    fromAddress: from?.address ?? null,
    toAddresses: (message.toRecipients ?? []).flatMap((recipient) => {
      const address = recipient.emailAddress?.address;
      return address
        ? [{ name: recipient.emailAddress?.name ?? undefined, address }]
        : [];
    }),
    subject: message.subject || "(no subject)",
    snippet: message.bodyPreview || "",
    date: newDate(message.receivedDateTime || undefined),
    isRead: Boolean(message.isRead),
    isArchived: false,
    labels: message.categories ?? [],
  };
}

export function decodeGmailBody(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64")
    .toString("utf8")
    .trim();
}

function findGmailPart(
  payload: GmailMessagePayload | null | undefined,
  mimeType: string
): string | null {
  if (!payload) return null;
  if (payload.mimeType === mimeType && payload.body?.data) {
    return decodeGmailBody(payload.body.data);
  }
  for (const part of payload.parts ?? []) {
    const value = findGmailPart(part, mimeType);
    if (value) return value;
  }
  return null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function gmailBodyHtml(payload?: GmailMessagePayload | null): string {
  const html = findGmailPart(payload, "text/html");
  if (html) return html;
  const text =
    findGmailPart(payload, "text/plain") ||
    (payload?.body?.data ? decodeGmailBody(payload.body.data) : "");
  return `<p>${escapeHtml(text).replaceAll("\n", "<br>")}</p>`;
}

export async function mapRawMimeMessage(options: {
  externalId: string;
  raw: Uint8Array | ArrayBuffer | string;
  flags?: string[];
  threadId?: string;
  includeBody?: boolean;
}): Promise<MailMessageSyncInput> {
  const parsed = await PostalMime.parse(options.raw);
  const from = parsed.from;
  const text = parsed.text || "";
  const snippet = text.replace(/\s+/g, " ").trim().slice(0, 280);
  return {
    externalId: options.externalId,
    threadId: options.threadId ?? parsed.messageId ?? null,
    fromName: from?.name ?? null,
    fromAddress: from?.address ?? null,
    toAddresses: (parsed.to ?? []).map((address) => ({
      name: address.name || undefined,
      address: address.address,
    })),
    subject: parsed.subject || "(no subject)",
    snippet,
    date: newDate(parsed.date || undefined),
    isRead: options.flags?.includes("\\Seen") ?? false,
    isArchived: false,
    labels: options.flags ?? [],
    bodyHtml: options.includeBody
      ? parsed.html || `<p>${escapeHtml(text).replaceAll("\n", "<br>")}</p>`
      : null,
  };
}
