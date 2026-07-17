import {
  getCalendarSyncQueue,
  getRescheduleQueue,
  getWebhookRenewQueue,
} from "@/lib/queue/queues";
import { CalendarWebhookProvider } from "@/lib/queue/types";

export async function enqueueCalendarSync(feedId: string) {
  return getCalendarSyncQueue().add(
    "sync-feed",
    { feedId },
    { jobId: `calendar-sync-${feedId}` }
  );
}

export async function enqueueReschedule(userId: string) {
  return getRescheduleQueue().add(
    "reschedule-user",
    { userId },
    { jobId: `reschedule-${userId}` }
  );
}

export async function enqueueWebhookRenew(options?: {
  provider?: CalendarWebhookProvider;
  feedId?: string;
}) {
  const provider = options?.provider ?? "ALL";
  const feedId = options?.feedId ?? "all";
  return getWebhookRenewQueue().add("renew-webhooks", options ?? {}, {
    jobId: `webhook-renew-${provider}-${feedId}`,
  });
}
