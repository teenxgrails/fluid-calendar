import { useSettingsStore } from "@/store/settings";

import { SettingRow, SettingsSection } from "./SettingsSection";

export function NotificationSettings() {
  const { notifications, updateNotificationSettings } = useSettingsStore();

  const enablePush = async (enabled: boolean) => {
    if (!enabled) {
      updateNotificationSettings({
        webPushEnabled: false,
        webPushSubscription: null,
      });
      return;
    }

    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator)
    ) {
      updateNotificationSettings({ webPushEnabled: false });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      updateNotificationSettings({ webPushEnabled: false });
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    let subscription: PushSubscriptionJSON | null = null;

    if (vapidKey) {
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      subscription = pushSubscription.toJSON();
    }

    updateNotificationSettings({
      webPushEnabled: true,
      webPushSubscription: subscription,
    });
  };

  return (
    <SettingsSection
      title="Notification Settings"
      description="Configure your notification preferences."
    >
      <SettingRow
        label="Daily Email Updates"
        description="Receive a daily email with your upcoming meetings and tasks"
      >
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={notifications.dailyEmailEnabled}
              onChange={(e) =>
                updateNotificationSettings({
                  dailyEmailEnabled: e.target.checked,
                })
              }
              className="h-4 w-4 rounded border-[var(--line-strong)] text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            <span className="ml-2 text-sm">Enable daily email updates</span>
          </label>
        </div>
      </SettingRow>

      <SettingRow
        label="Web Push"
        description="Focus endings, upcoming tasks, and gentle streak reminders. Off by default."
      >
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={notifications.webPushEnabled}
            onChange={(event) => enablePush(event.target.checked)}
            className="h-4 w-4 rounded border-[var(--line-strong)] text-[var(--accent)] focus:ring-[var(--accent)]"
          />
          <span className="ml-2 text-sm">Enable web push</span>
        </label>
      </SettingRow>
    </SettingsSection>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
