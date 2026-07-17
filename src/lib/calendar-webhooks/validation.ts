import type { CalendarWebhook } from "@prisma/client";

export interface OutlookChangeNotification {
  subscriptionId?: string;
  clientState?: string;
  changeType?: string;
  resource?: string;
}

export function validateGoogleWebhookHeaders(
  headers: Headers,
  webhook: Pick<CalendarWebhook, "channelId" | "resourceId" | "channelToken">
): boolean {
  return (
    Boolean(webhook.channelId) &&
    Boolean(webhook.resourceId) &&
    Boolean(webhook.channelToken) &&
    headers.get("x-goog-channel-id") === webhook.channelId &&
    headers.get("x-goog-resource-id") === webhook.resourceId &&
    headers.get("x-goog-channel-token") === webhook.channelToken
  );
}

export function validateOutlookNotification(
  notification: OutlookChangeNotification,
  webhook: Pick<CalendarWebhook, "subscriptionId" | "clientState">
): boolean {
  return (
    Boolean(webhook.subscriptionId) &&
    Boolean(webhook.clientState) &&
    notification.subscriptionId === webhook.subscriptionId &&
    notification.clientState === webhook.clientState
  );
}
