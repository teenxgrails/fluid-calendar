-- Mail v1: local-first unified inbox.

CREATE TYPE "MailProvider" AS ENUM ('GMAIL', 'OUTLOOK', 'IMAP');
CREATE TYPE "MailAccountStatus" AS ENUM ('ACTIVE', 'ERROR', 'DISCONNECTED');

CREATE TABLE "MailAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" "MailProvider" NOT NULL,
  "address" TEXT NOT NULL,
  "encryptedCredentials" TEXT,
  "connectionRef" TEXT,
  "status" "MailAccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "syncCursor" TEXT,
  "lastSyncAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MailAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MailMessage" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "threadId" TEXT,
  "fromName" TEXT,
  "fromAddress" TEXT,
  "toAddresses" JSONB NOT NULL,
  "subject" TEXT NOT NULL,
  "snippet" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "labels" JSONB NOT NULL,
  "bodyHtml" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MailMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MailAccount_userId_provider_address_key"
ON "MailAccount"("userId", "provider", "address");
CREATE INDEX "MailAccount_userId_idx" ON "MailAccount"("userId");
CREATE INDEX "MailAccount_connectionRef_idx" ON "MailAccount"("connectionRef");
CREATE INDEX "MailAccount_status_idx" ON "MailAccount"("status");

CREATE UNIQUE INDEX "MailMessage_accountId_externalId_key"
ON "MailMessage"("accountId", "externalId");
CREATE INDEX "MailMessage_accountId_date_idx" ON "MailMessage"("accountId", "date");
CREATE INDEX "MailMessage_accountId_isRead_isArchived_idx"
ON "MailMessage"("accountId", "isRead", "isArchived");

ALTER TABLE "MailAccount"
ADD CONSTRAINT "MailAccount_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MailAccount"
ADD CONSTRAINT "MailAccount_connectionRef_fkey"
FOREIGN KEY ("connectionRef") REFERENCES "ConnectedAccount"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MailMessage"
ADD CONSTRAINT "MailMessage_accountId_fkey"
FOREIGN KEY ("accountId") REFERENCES "MailAccount"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
