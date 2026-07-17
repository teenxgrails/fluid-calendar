import { registerGoogleWatch } from "@/lib/calendar-webhooks/google";
import { registerOutlookSubscription } from "@/lib/calendar-webhooks/outlook";
import { logger } from "@/lib/logger";

const LOG_SOURCE = "CalendarWebhookRegistration";

export async function registerCalendarWebhookBestEffort(
  feedId: string,
  provider: string
): Promise<void> {
  if (provider !== "GOOGLE" && provider !== "OUTLOOK") return;

  try {
    if (provider === "GOOGLE") {
      await registerGoogleWatch(feedId);
    } else {
      await registerOutlookSubscription(feedId);
    }
  } catch (error) {
    await logger.warn(
      "Calendar connected without realtime webhook",
      {
        feedId,
        provider,
        error: error instanceof Error ? error.message : String(error),
      },
      LOG_SOURCE
    );
  }
}
