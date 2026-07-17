-- CreateTable
CREATE TABLE "CalendarWebhook" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "channelId" TEXT,
    "subscriptionId" TEXT,
    "resourceId" TEXT,
    "expiration" TIMESTAMP(3) NOT NULL,
    "clientState" TEXT,
    "channelToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarWebhook_provider_feedId_key"
ON "CalendarWebhook"("provider", "feedId");

-- CreateIndex
CREATE INDEX "CalendarWebhook_channelId_idx"
ON "CalendarWebhook"("channelId");

-- CreateIndex
CREATE INDEX "CalendarWebhook_subscriptionId_idx"
ON "CalendarWebhook"("subscriptionId");

-- AddForeignKey
ALTER TABLE "CalendarWebhook"
ADD CONSTRAINT "CalendarWebhook_feedId_fkey"
FOREIGN KEY ("feedId") REFERENCES "CalendarFeed"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
