-- Phase 11: PWA/offline push settings.

ALTER TABLE "NotificationSettings"
  ADD COLUMN "webPushEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "webPushSubscription" JSONB;
