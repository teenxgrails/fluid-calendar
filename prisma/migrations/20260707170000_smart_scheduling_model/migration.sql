-- Add smart scheduling enums.
CREATE TYPE "SchedulingEnergyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "SchedulingTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- Extend tasks with ADHD and energy-aware scheduling metadata.
ALTER TABLE "Task"
  ADD COLUMN "energyRequired" "SchedulingEnergyLevel" NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN "estimatedMinutes" INTEGER,
  ADD COLUMN "minChunkMinutes" INTEGER,
  ADD COLUMN "maxChunkMinutes" INTEGER,
  ADD COLUMN "deadline" TIMESTAMP(3),
  ADD COLUMN "priorityLevel" "SchedulingTaskPriority" NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN "contextTag" TEXT,
  ADD COLUMN "isFrozen" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "dependsOnId" TEXT,
  ADD COLUMN "autoScheduled" BOOLEAN NOT NULL DEFAULT false;

-- Seed smart-scheduling estimates from the legacy duration/dueDate fields.
UPDATE "Task"
SET
  "estimatedMinutes" = COALESCE("duration", 30),
  "deadline" = "dueDate"
WHERE "estimatedMinutes" IS NULL;

-- Map existing string priority values into the new priority enum where possible.
UPDATE "Task"
SET "priorityLevel" = CASE
  WHEN lower(COALESCE("priority", '')) = 'high' THEN 'HIGH'::"SchedulingTaskPriority"
  WHEN lower(COALESCE("priority", '')) = 'low' THEN 'LOW'::"SchedulingTaskPriority"
  WHEN lower(COALESCE("priority", '')) = 'medium' THEN 'MEDIUM'::"SchedulingTaskPriority"
  ELSE 'MEDIUM'::"SchedulingTaskPriority"
END;

-- Map existing string energy values into the new energy enum where possible.
UPDATE "Task"
SET "energyRequired" = CASE
  WHEN lower(COALESCE("energyLevel", '')) = 'high' THEN 'HIGH'::"SchedulingEnergyLevel"
  WHEN lower(COALESCE("energyLevel", '')) = 'low' THEN 'LOW'::"SchedulingEnergyLevel"
  WHEN lower(COALESCE("energyLevel", '')) = 'medium' THEN 'MEDIUM'::"SchedulingEnergyLevel"
  ELSE 'MEDIUM'::"SchedulingEnergyLevel"
END;

CREATE TABLE "EnergyProfileWindow" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "energyLevel" "SchedulingEnergyLevel" NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EnergyProfileWindow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SchedulingPreferences" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "workHours" JSONB,
  "bufferMinutes" INTEGER NOT NULL DEFAULT 15,
  "maxDeepWorkPerDay" INTEGER NOT NULL DEFAULT 180,
  "minBreakMinutes" INTEGER NOT NULL DEFAULT 15,
  "autoRescheduleOnMiss" BOOLEAN NOT NULL DEFAULT true,
  "enableBodyDoubling" BOOLEAN NOT NULL DEFAULT false,
  "enableTaskBatching" BOOLEAN NOT NULL DEFAULT true,
  "hardStopTime" TEXT NOT NULL DEFAULT '18:00',
  "bufferMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.3,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SchedulingPreferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EnergyProfileWindow_userId_dayOfWeek_startTime_endTime_key"
  ON "EnergyProfileWindow"("userId", "dayOfWeek", "startTime", "endTime");
CREATE INDEX "EnergyProfileWindow_userId_dayOfWeek_sortOrder_idx"
  ON "EnergyProfileWindow"("userId", "dayOfWeek", "sortOrder");
CREATE INDEX "EnergyProfileWindow_energyLevel_idx"
  ON "EnergyProfileWindow"("energyLevel");
CREATE UNIQUE INDEX "SchedulingPreferences_userId_key"
  ON "SchedulingPreferences"("userId");
CREATE INDEX "SchedulingPreferences_userId_idx"
  ON "SchedulingPreferences"("userId");

CREATE INDEX "Task_deadline_idx" ON "Task"("deadline");
CREATE INDEX "Task_energyRequired_idx" ON "Task"("energyRequired");
CREATE INDEX "Task_priorityLevel_idx" ON "Task"("priorityLevel");
CREATE INDEX "Task_contextTag_idx" ON "Task"("contextTag");
CREATE INDEX "Task_isFrozen_idx" ON "Task"("isFrozen");
CREATE INDEX "Task_dependsOnId_idx" ON "Task"("dependsOnId");
CREATE INDEX "Task_autoScheduled_idx" ON "Task"("autoScheduled");

ALTER TABLE "Task"
  ADD CONSTRAINT "Task_dependsOnId_fkey"
  FOREIGN KEY ("dependsOnId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EnergyProfileWindow"
  ADD CONSTRAINT "EnergyProfileWindow_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SchedulingPreferences"
  ADD CONSTRAINT "SchedulingPreferences_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed sensible default energy curves and preferences for existing users.
INSERT INTO "SchedulingPreferences" (
  "id",
  "userId",
  "workHours",
  "bufferMinutes",
  "maxDeepWorkPerDay",
  "minBreakMinutes",
  "autoRescheduleOnMiss",
  "enableBodyDoubling",
  "enableTaskBatching",
  "hardStopTime",
  "bufferMultiplier",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  "id",
  '{"1":{"start":"09:00","end":"17:00"},"2":{"start":"09:00","end":"17:00"},"3":{"start":"09:00","end":"17:00"},"4":{"start":"09:00","end":"17:00"},"5":{"start":"09:00","end":"17:00"}}'::jsonb,
  15,
  180,
  15,
  true,
  false,
  true,
  '18:00',
  1.3,
  CURRENT_TIMESTAMP
FROM "User"
ON CONFLICT ("userId") DO NOTHING;

INSERT INTO "EnergyProfileWindow" (
  "id",
  "userId",
  "dayOfWeek",
  "startTime",
  "endTime",
  "energyLevel",
  "sortOrder",
  "updatedAt"
)
SELECT gen_random_uuid()::text, u."id", d.day, w.start_time, w.end_time, w.energy, w.sort_order, CURRENT_TIMESTAMP
FROM "User" u
CROSS JOIN (VALUES (1), (2), (3), (4), (5)) AS d(day)
CROSS JOIN (
  VALUES
    ('09:00', '12:00', 'HIGH'::"SchedulingEnergyLevel", 0),
    ('13:00', '14:30', 'LOW'::"SchedulingEnergyLevel", 1),
    ('15:00', '18:00', 'MEDIUM'::"SchedulingEnergyLevel", 2)
) AS w(start_time, end_time, energy, sort_order)
ON CONFLICT ("userId", "dayOfWeek", "startTime", "endTime") DO NOTHING;
