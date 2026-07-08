-- Design Part 2: persist every scheduled task chunk.

CREATE TABLE "ScheduledBlock" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "userId" TEXT,
  "start" TIMESTAMP(3) NOT NULL,
  "end" TIMESTAMP(3) NOT NULL,
  "chunkIndex" INTEGER NOT NULL DEFAULT 0,
  "chunkCount" INTEGER NOT NULL DEFAULT 1,
  "isFrozen" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ScheduledBlock_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ScheduledBlock" (
  "id",
  "taskId",
  "userId",
  "start",
  "end",
  "chunkIndex",
  "chunkCount",
  "isFrozen",
  "createdAt",
  "updatedAt"
)
SELECT
  'legacy_' || "id",
  "id",
  "userId",
  "scheduledStart",
  "scheduledEnd",
  0,
  1,
  "isFrozen" OR "scheduleLocked",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Task"
WHERE "scheduledStart" IS NOT NULL AND "scheduledEnd" IS NOT NULL;

CREATE UNIQUE INDEX "ScheduledBlock_taskId_chunkIndex_key" ON "ScheduledBlock"("taskId", "chunkIndex");
CREATE INDEX "ScheduledBlock_userId_start_idx" ON "ScheduledBlock"("userId", "start");
CREATE INDEX "ScheduledBlock_taskId_idx" ON "ScheduledBlock"("taskId");
CREATE INDEX "ScheduledBlock_start_end_idx" ON "ScheduledBlock"("start", "end");

ALTER TABLE "ScheduledBlock"
  ADD CONSTRAINT "ScheduledBlock_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScheduledBlock"
  ADD CONSTRAINT "ScheduledBlock_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
