import { MailAccount, MailMessage, MailProvider, Prisma } from "@prisma/client";

export interface MailAddress {
  name?: string;
  address: string;
}

export interface MailMessageSyncInput {
  externalId: string;
  threadId?: string | null;
  fromName?: string | null;
  fromAddress?: string | null;
  toAddresses: Prisma.InputJsonValue;
  subject: string;
  snippet: string;
  date: Date;
  isRead: boolean;
  isArchived: boolean;
  labels: Prisma.InputJsonValue;
  bodyHtml?: string | null;
}

export interface MailAccountWithConnection extends MailAccount {
  connection: {
    id: string;
    provider: string;
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date;
    userId: string | null;
  } | null;
}

export interface MailListItem extends MailMessage {
  account: Pick<MailAccount, "id" | "provider" | "address" | "status">;
}

export interface MailSyncResult {
  cursor?: string | null;
  messages: MailMessageSyncInput[];
  deletedExternalIds?: string[];
}

export interface ImapCredentials {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export interface GmailHeader {
  name?: string | null;
  value?: string | null;
}

export interface GmailMessagePayload {
  mimeType?: string | null;
  body?: { data?: string | null };
  headers?: GmailHeader[];
  parts?: GmailMessagePayload[];
}

export interface GmailMessageResource {
  id?: string | null;
  threadId?: string | null;
  historyId?: string | null;
  internalDate?: string | null;
  labelIds?: string[] | null;
  snippet?: string | null;
  payload?: GmailMessagePayload | null;
}

export interface GraphMailAddress {
  name?: string | null;
  address?: string | null;
}

export interface GraphMailMessage {
  id?: string | null;
  conversationId?: string | null;
  subject?: string | null;
  bodyPreview?: string | null;
  receivedDateTime?: string | null;
  isRead?: boolean | null;
  categories?: string[] | null;
  parentFolderId?: string | null;
  from?: { emailAddress?: GraphMailAddress | null } | null;
  toRecipients?: Array<{ emailAddress?: GraphMailAddress | null }> | null;
  body?: { contentType?: string | null; content?: string | null } | null;
  "@removed"?: { reason?: string };
}

export type SupportedMailProvider = Extract<
  MailProvider,
  "GMAIL" | "OUTLOOK" | "IMAP"
>;
