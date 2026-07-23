-- Add named work schedules without replacing legacy SchedulingPreferences.
CREATE TYPE "FlexibleHoursOverrideKind" AS ENUM (
  'START_LATER',
  'STOP_EARLY',
  'BLOCK_HOURS',
  'BLOCK_WHOLE_DAY'
);

CREATE TABLE "WorkSchedule" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "timeZone" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkScheduleWindow" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "scheduleId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkScheduleWindow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FlexibleHoursOverride" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "kind" "FlexibleHoursOverrideKind" NOT NULL,
  "startTime" TEXT,
  "endTime" TEXT,
  "sourceLegacyEventId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FlexibleHoursOverride_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Task" ADD COLUMN "scheduleId" TEXT;

CREATE UNIQUE INDEX "WorkSchedule_userId_name_key"
  ON "WorkSchedule"("userId", "name");
CREATE INDEX "WorkSchedule_userId_isDefault_idx"
  ON "WorkSchedule"("userId", "isDefault");
CREATE UNIQUE INDEX "WorkScheduleWindow_scheduleId_dayOfWeek_startTime_endTime_key"
  ON "WorkScheduleWindow"("scheduleId", "dayOfWeek", "startTime", "endTime");
CREATE INDEX "WorkScheduleWindow_scheduleId_dayOfWeek_sortOrder_idx"
  ON "WorkScheduleWindow"("scheduleId", "dayOfWeek", "sortOrder");
CREATE UNIQUE INDEX "FlexibleHoursOverride_sourceLegacyEventId_key"
  ON "FlexibleHoursOverride"("sourceLegacyEventId");
CREATE INDEX "FlexibleHoursOverride_userId_date_idx"
  ON "FlexibleHoursOverride"("userId", "date");
CREATE INDEX "Task_scheduleId_idx" ON "Task"("scheduleId");

ALTER TABLE "WorkSchedule"
  ADD CONSTRAINT "WorkSchedule_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkScheduleWindow"
  ADD CONSTRAINT "WorkScheduleWindow_scheduleId_fkey"
  FOREIGN KEY ("scheduleId") REFERENCES "WorkSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FlexibleHoursOverride"
  ADD CONSTRAINT "FlexibleHoursOverride_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task"
  ADD CONSTRAINT "Task_scheduleId_fkey"
  FOREIGN KEY ("scheduleId") REFERENCES "WorkSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Every existing user receives a real default schedule. Prefer the stored
-- settings timezone, then fall back to UTC.
INSERT INTO "WorkSchedule" (
  "id", "userId", "name", "timeZone", "isDefault", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  u."id",
  'Work Hours',
  COALESCE(us."timeZone", 'UTC'),
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User" u
LEFT JOIN "UserSettings" us ON us."userId" = u."id"
ON CONFLICT ("userId", "name") DO NOTHING;

-- Materialize the current JSON work hours as the first schedule. Invalid or
-- missing values fall back to weekdays 09:00–17:00.
INSERT INTO "WorkScheduleWindow" (
  "id", "scheduleId", "dayOfWeek", "startTime", "endTime", "sortOrder",
  "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  ws."id",
  entry.key::integer,
  entry.value->>'start',
  entry.value->>'end',
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "WorkSchedule" ws
JOIN "SchedulingPreferences" sp ON sp."userId" = ws."userId"
CROSS JOIN LATERAL jsonb_each(COALESCE(sp."workHours"::jsonb, '{}'::jsonb)) entry
WHERE ws."isDefault" = true
  AND entry.key ~ '^[0-6]$'
  AND entry.value->>'start' ~ '^[0-2][0-9]:[0-5][0-9]$'
  AND entry.value->>'end' ~ '^[0-2][0-9]:[0-5][0-9]$'
ON CONFLICT DO NOTHING;

INSERT INTO "WorkScheduleWindow" (
  "id", "scheduleId", "dayOfWeek", "startTime", "endTime", "sortOrder",
  "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  ws."id",
  day_number,
  '09:00',
  '17:00',
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "WorkSchedule" ws
CROSS JOIN (VALUES (1), (2), (3), (4), (5)) AS weekdays(day_number)
WHERE ws."isDefault" = true
  AND NOT EXISTS (
    SELECT 1 FROM "WorkScheduleWindow" existing
    WHERE existing."scheduleId" = ws."id"
  )
ON CONFLICT DO NOTHING;

-- Preserve legacy block events, but also materialize them as availability
-- overrides. Product queries hide these marker events after this migration.
INSERT INTO "FlexibleHoursOverride" (
  "id", "userId", "date", "kind", "startTime", "endTime",
  "sourceLegacyEventId", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  cf."userId",
  ce."start"::date,
  CASE
    WHEN ce."allDay" THEN 'BLOCK_WHOLE_DAY'::"FlexibleHoursOverrideKind"
    ELSE 'BLOCK_HOURS'::"FlexibleHoursOverrideKind"
  END,
  CASE WHEN ce."allDay" THEN NULL ELSE to_char(ce."start", 'HH24:MI') END,
  CASE WHEN ce."allDay" THEN NULL ELSE to_char(ce."end", 'HH24:MI') END,
  ce."id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "CalendarEvent" ce
JOIN "CalendarFeed" cf ON cf."id" = ce."feedId"
WHERE cf."userId" IS NOT NULL
  AND ce."description" LIKE '[NEEDT_DAY_BLOCK]%'
ON CONFLICT ("sourceLegacyEventId") DO NOTHING;
