import { newDate } from "@/lib/date-utils";
import { getRedisConnection } from "@/lib/queue/connection";
import {
  RealtimeEvent,
  RealtimeEventType,
  getUserRealtimeChannel,
} from "@/lib/realtime/channels";

export async function publishRealtimeEvent(
  userId: string,
  type: RealtimeEventType,
  details?: Pick<RealtimeEvent, "feedId">
): Promise<void> {
  const event: RealtimeEvent = {
    type,
    occurredAt: newDate().toISOString(),
    ...details,
  };
  await getRedisConnection().publish(
    getUserRealtimeChannel(userId),
    JSON.stringify(event)
  );
}
