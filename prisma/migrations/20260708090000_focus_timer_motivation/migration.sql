-- Phase 10: focus timer sessions and motivation loop.

CREATE TYPE "FocusSessionMode" AS ENUM ('POMODORO', 'FLOW', 'DEEP_FOCUS');

CREATE TABLE "FocusSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "taskId" TEXT,
  "mode" "FocusSessionMode" NOT NULL,
  "plannedMinutes" INTEGER,
  "elapsedMinutes" INTEGER NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "abandoned" BOOLEAN NOT NULL DEFAULT false,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FocusSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FocusStats" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "focusScore" INTEGER NOT NULL DEFAULT 0,
  "currentStreak" INTEGER NOT NULL DEFAULT 0,
  "longestStreak" INTEGER NOT NULL DEFAULT 0,
  "lifetimeMinutes" INTEGER NOT NULL DEFAULT 0,
  "lastFocusDate" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "FocusStats_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FocusStats_userId_key" ON "FocusStats"("userId");
CREATE INDEX "FocusSession_userId_startedAt_idx" ON "FocusSession"("userId", "startedAt");
CREATE INDEX "FocusSession_taskId_idx" ON "FocusSession"("taskId");
CREATE INDEX "FocusSession_mode_idx" ON "FocusSession"("mode");
CREATE INDEX "FocusSession_completed_idx" ON "FocusSession"("completed");

ALTER TABLE "FocusSession"
  ADD CONSTRAINT "FocusSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FocusSession"
  ADD CONSTRAINT "FocusSession_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FocusStats"
  ADD CONSTRAINT "FocusStats_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
