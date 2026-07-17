export const QUEUE_NAMES = {
  calendarSync: "calendar-sync",
  reschedule: "reschedule",
  webhookRenew: "webhook-renew",
} as const;

export type CalendarWebhookProvider = "GOOGLE" | "OUTLOOK";

export interface CalendarSyncJobData {
  feedId: string;
}

export interface RescheduleJobData {
  userId: string;
}

export interface WebhookRenewJobData {
  provider?: CalendarWebhookProvider;
  feedId?: string;
}
