-- Task: minutes actually spent focused (written from completed focus sessions)
ALTER TABLE "Task" ADD COLUMN "actualFocusedMinutes" INTEGER NOT NULL DEFAULT 0;

-- FocusSession: support a persistent, server-truth ACTIVE session.
-- An active session has endedAt = NULL; pausedTotalSeconds accumulates completed
-- pause spans; pausedAt is set while the session is currently paused.
ALTER TABLE "FocusSession" ALTER COLUMN "elapsedMinutes" SET DEFAULT 0;
ALTER TABLE "FocusSession" ALTER COLUMN "endedAt" DROP NOT NULL;
ALTER TABLE "FocusSession" ADD COLUMN "pausedAt" TIMESTAMP(3);
ALTER TABLE "FocusSession" ADD COLUMN "pausedTotalSeconds" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "FocusSession" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'web';

CREATE INDEX "FocusSession_userId_endedAt_idx" ON "FocusSession"("userId", "endedAt");
