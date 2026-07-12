import { resolveCalendarItemId } from "../calendar-item-id";

describe("resolveCalendarItemId", () => {
  it("prefers the explicit task id", () => {
    expect(resolveCalendarItemId({ taskId: "task-1" }, "task-1:2")).toBe(
      "task-1"
    );
  });

  it("reads the original nested task id", () => {
    expect(
      resolveCalendarItemId({ extendedProps: { taskId: "task-2" } }, "task-2:0")
    ).toBe("task-2");
  });

  it("recovers the task id from a generated scheduled-block id", () => {
    expect(resolveCalendarItemId({}, "task-3:1")).toBe("task-3");
  });
});
