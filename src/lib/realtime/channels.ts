export type RealtimeEventType = "calendar-updated" | "tasks-updated";

export interface RealtimeEvent {
  type: RealtimeEventType;
  occurredAt: string;
  feedId?: string;
}

export function getUserRealtimeChannel(userId: string): string {
  return `needt:realtime:user:${userId}`;
}
