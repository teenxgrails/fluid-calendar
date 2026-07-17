import { getUserRealtimeChannel } from "@/lib/realtime/channels";

describe("realtime Redis channels", () => {
  test("isolates updates by user ID", () => {
    expect(getUserRealtimeChannel("user-a")).toBe("needt:realtime:user:user-a");
    expect(getUserRealtimeChannel("user-a")).not.toBe(
      getUserRealtimeChannel("user-b")
    );
  });
});
