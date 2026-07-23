import {
  adjustScheduleWindow,
  copyScheduleDayWindows,
  sanitizeScheduleWindows,
} from "@/lib/work-schedules";

describe("work schedule windows", () => {
  it("keeps multiple intervals ordered at exact minute precision", () => {
    expect(
      sanitizeScheduleWindows([
        { dayOfWeek: 1, startTime: "13:15", endTime: "17:45" },
        { dayOfWeek: 1, startTime: "08:30", endTime: "12:00" },
      ])
    ).toEqual([
      {
        dayOfWeek: 1,
        startTime: "08:30",
        endTime: "12:00",
        sortOrder: 0,
      },
      {
        dayOfWeek: 1,
        startTime: "13:15",
        endTime: "17:45",
        sortOrder: 1,
      },
    ]);
  });

  it("rejects overlapping intervals", () => {
    expect(() =>
      sanitizeScheduleWindows([
        { dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
        { dayOfWeek: 1, startTime: "11:45", endTime: "14:00" },
      ])
    ).toThrow("Schedule windows cannot overlap");
  });

  it("copies every source interval only to selected days", () => {
    const ids = ["copy-1", "copy-2", "copy-3", "copy-4"];
    const result = copyScheduleDayWindows(
      [
        {
          id: "mon-am",
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "12:00",
          sortOrder: 0,
        },
        {
          id: "mon-pm",
          dayOfWeek: 1,
          startTime: "13:00",
          endTime: "17:00",
          sortOrder: 1,
        },
        {
          id: "wed",
          dayOfWeek: 3,
          startTime: "10:00",
          endTime: "18:00",
          sortOrder: 2,
        },
      ],
      1,
      [2, 4],
      () => ids.shift()!
    );

    expect(result.filter((window) => window.dayOfWeek === 3)).toHaveLength(1);
    expect(
      result
        .filter((window) => [2, 4].includes(window.dayOfWeek))
        .map(({ dayOfWeek, startTime, endTime }) => ({
          dayOfWeek,
          startTime,
          endTime,
        }))
    ).toEqual([
      { dayOfWeek: 2, startTime: "09:00", endTime: "12:00" },
      { dayOfWeek: 2, startTime: "13:00", endTime: "17:00" },
      { dayOfWeek: 4, startTime: "09:00", endTime: "12:00" },
      { dayOfWeek: 4, startTime: "13:00", endTime: "17:00" },
    ]);
  });

  it("moves and resizes in 15-minute increments within the editor grid", () => {
    const window = {
      id: "window",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
      sortOrder: 0,
    };

    expect(
      adjustScheduleWindow(window, "move", 15, 6 * 60, 22 * 60)
    ).toMatchObject({ startTime: "09:15", endTime: "17:15" });
    expect(
      adjustScheduleWindow(window, "resize-start", 30, 6 * 60, 22 * 60)
    ).toMatchObject({ startTime: "09:30", endTime: "17:00" });
    expect(
      adjustScheduleWindow(window, "resize-end", -45, 6 * 60, 22 * 60)
    ).toMatchObject({ startTime: "09:00", endTime: "16:15" });
  });
});
