import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("work schedules migration", () => {
  const sql = readFileSync(
    join(
      process.cwd(),
      "prisma/migrations/20260723220000_work_schedules_flexible_hours/migration.sql"
    ),
    "utf8"
  );

  it("preserves legacy events while migrating day blocks to overrides", () => {
    expect(sql).toContain("[NEEDT_DAY_BLOCK]");
    expect(sql).toContain('INSERT INTO "FlexibleHoursOverride"');
    expect(sql).not.toMatch(/DELETE\s+FROM\s+"CalendarEvent"/i);
    expect(sql).not.toMatch(/DROP\s+TABLE\s+"CalendarEvent"/i);
  });

  it("backfills a default Work Hours schedule without rewriting preferences", () => {
    expect(sql).toContain('INSERT INTO "WorkSchedule"');
    expect(sql).toContain("Work Hours");
    expect(sql).toContain('INSERT INTO "WorkScheduleWindow"');
    expect(sql).not.toMatch(/UPDATE\s+"SchedulingPreferences"/i);
  });
});
