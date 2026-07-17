import {
  listCalendarWebhooks,
  listPushEnabledCalendarFeeds,
} from "@/lib/calendar-db";
import { registerGoogleWatch } from "@/lib/calendar-webhooks/google";
import {
  registerOutlookSubscription,
  renewOutlookSubscription,
} from "@/lib/calendar-webhooks/outlook";
import { addMinutes, isBefore, newDate } from "@/lib/date-utils";
import { logger } from "@/lib/logger";
import { CalendarWebhookProvider } from "@/lib/queue/types";

const LOG_SOURCE = "CalendarWebhookRenewal";
const RENEWAL_WINDOW_MINUTES = 12 * 60;

export async function renewCalendarWebhooks(options?: {
  provider?: CalendarWebhookProvider;
  feedId?: string;
}) {
  const webhooks = await listCalendarWebhooks(options);
  const renewalDeadline = addMinutes(newDate(), RENEWAL_WINDOW_MINUTES);
  const results: Array<{ feedId: string; provider: string; renewed: boolean }> =
    [];

  for (const webhook of webhooks) {
    const forced = Boolean(options?.feedId);
    if (!forced && !isBefore(webhook.expiration, renewalDeadline)) {
      results.push({
        feedId: webhook.feedId,
        provider: webhook.provider,
        renewed: false,
      });
      continue;
    }

    try {
      if (webhook.provider === "GOOGLE") {
        await registerGoogleWatch(webhook.feedId);
      } else if (webhook.provider === "OUTLOOK") {
        await renewOutlookSubscription(webhook.feedId);
      }
      results.push({
        feedId: webhook.feedId,
        provider: webhook.provider,
        renewed: true,
      });
    } catch (error) {
      await logger.error(
        "Calendar webhook renewal failed",
        {
          feedId: webhook.feedId,
          provider: webhook.provider,
          error: error instanceof Error ? error.message : String(error),
        },
        LOG_SOURCE
      );
      throw error;
    }
  }

  if (options?.feedId && webhooks.length === 0) {
    if (options.provider === "GOOGLE") {
      await registerGoogleWatch(options.feedId);
    } else if (options.provider === "OUTLOOK") {
      await registerOutlookSubscription(options.feedId);
    }
  }

  if (!options?.feedId) {
    const feeds = await listPushEnabledCalendarFeeds();
    for (const feed of feeds.filter(
      (candidate) => candidate.webhooks.length === 0
    )) {
      if (options?.provider && feed.type !== options.provider) continue;
      if (feed.type === "GOOGLE") {
        await registerGoogleWatch(feed.id);
      } else if (feed.type === "OUTLOOK") {
        await registerOutlookSubscription(feed.id);
      }
      results.push({ feedId: feed.id, provider: feed.type, renewed: true });
    }
  }

  return results;
}
