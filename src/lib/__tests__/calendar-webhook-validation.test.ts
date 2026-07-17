import type { CalendarWebhook } from "@prisma/client";

import {
  validateGoogleWebhookHeaders,
  validateOutlookNotification,
} from "@/lib/calendar-webhooks/validation";

describe("calendar webhook validation", () => {
  test("accepts only an exact Google channel, resource, and token match", () => {
    const webhook = {
      channelId: "channel-1",
      resourceId: "resource-1",
      channelToken: "secret-token",
    } satisfies Pick<
      CalendarWebhook,
      "channelId" | "resourceId" | "channelToken"
    >;
    const headers = new Headers({
      "x-goog-channel-id": "channel-1",
      "x-goog-resource-id": "resource-1",
      "x-goog-channel-token": "secret-token",
    });

    expect(validateGoogleWebhookHeaders(headers, webhook)).toBe(true);
    headers.set("x-goog-channel-token", "spoofed");
    expect(validateGoogleWebhookHeaders(headers, webhook)).toBe(false);
  });

  test("accepts only the persisted Outlook client state", () => {
    const webhook = {
      subscriptionId: "subscription-1",
      clientState: "client-secret",
    } satisfies Pick<CalendarWebhook, "subscriptionId" | "clientState">;

    expect(
      validateOutlookNotification(
        {
          subscriptionId: "subscription-1",
          clientState: "client-secret",
        },
        webhook
      )
    ).toBe(true);
    expect(
      validateOutlookNotification(
        { subscriptionId: "subscription-1", clientState: "wrong" },
        webhook
      )
    ).toBe(false);
  });
});
