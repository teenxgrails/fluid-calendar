"use client";

import { CheckSquare2, Code2, Mail, Webhook } from "lucide-react";
import { FaApple, FaMicrosoft } from "react-icons/fa";
import { SiGooglecalendar } from "react-icons/si";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { useSettingsStore } from "@/store/settings";

interface IntegrationCard {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  onClick: () => void;
  status: "Connected" | "Not configured" | "Unavailable";
  disabled?: boolean;
}

export function IntegrationSettings() {
  const { accounts } = useSettingsStore();
  const hasGoogle = accounts.some((account) => account.provider === "GOOGLE");
  const hasOutlook = accounts.some((account) => account.provider === "OUTLOOK");
  const hasApple = accounts.some((account) => account.provider === "CALDAV");

  const goTo = (hash: string) => {
    window.location.hash = hash;
  };

  const integrations: IntegrationCard[] = [
    {
      id: "google-calendar",
      name: "Google Calendar",
      description: "Sync events and scheduled task blocks.",
      icon: <SiGooglecalendar className="h-8 w-8" />,
      action: hasGoogle ? "Manage" : "Connect",
      status: hasGoogle ? "Connected" : "Not configured",
      onClick: () => goTo("calendars"),
    },
    {
      id: "outlook-calendar",
      name: "Outlook Calendar",
      description: "Keep Microsoft calendars in sync with Needt.",
      icon: <FaMicrosoft className="h-8 w-8 text-[#6CA9FF]" />,
      action: hasOutlook ? "Manage" : "Connect",
      status: hasOutlook ? "Connected" : "Not configured",
      onClick: () => goTo("calendars"),
    },
    {
      id: "icloud-calendar",
      name: "iCloud Calendar",
      description: "Connect Apple Calendar with an app-specific password.",
      icon: <FaApple className="h-8 w-8 text-[var(--text-secondary)]" />,
      action: hasApple ? "Manage" : "Connect",
      status: hasApple ? "Connected" : "Not configured",
      onClick: () => goTo("calendars"),
    },
    {
      id: "task-providers",
      name: "External Tasks",
      description: "Import Google Tasks, Microsoft To Do, and CalDAV tasks.",
      icon: <CheckSquare2 className="h-8 w-8 text-[var(--text-secondary)]" />,
      action: "Configure",
      status: "Not configured",
      onClick: () =>
        toast.info(
          "Connect a calendar account first, then choose its task lists"
        ),
    },
    {
      id: "zapier",
      name: "Zapier",
      description: "Connect Needt with thousands of other apps.",
      icon: (
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#FF4F00] text-sm font-bold text-white">
          zap
        </span>
      ),
      action: "Coming soon",
      status: "Unavailable",
      disabled: true,
      onClick: () => undefined,
    },
    {
      id: "email",
      name: "Email",
      description: "Turn an email into a task in your Needt inbox.",
      icon: <Mail className="h-8 w-8 text-[var(--text-secondary)]" />,
      action: "See how",
      status: "Unavailable",
      disabled: true,
      onClick: () => undefined,
    },
    {
      id: "api",
      name: "Needt API",
      description: "Create tasks and read your schedule from local tools.",
      icon: <Code2 className="h-8 w-8 text-[var(--text-secondary)]" />,
      action: "Configure",
      status: "Not configured",
      onClick: () => goTo("api"),
    },
    {
      id: "webhooks",
      name: "Webhooks",
      description: "Notify automations when schedules or tasks change.",
      icon: <Webhook className="h-8 w-8 text-[var(--text-secondary)]" />,
      action: "Configure",
      status: "Not configured",
      onClick: () => goTo("api"),
    },
  ];

  return (
    <div className="grid max-w-[1100px] gap-4 md:grid-cols-2">
      {integrations.map((integration) => (
        <article
          key={integration.id}
          className="flex min-h-[180px] flex-col rounded-[var(--control-radius)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-4"
        >
          <div className="flex items-start justify-between gap-4">
            {integration.icon}
            <span
              className={cn(
                "rounded-full bg-[var(--surface-control)] px-2 py-0.5 text-[11px]",
                integration.status === "Connected"
                  ? "text-[var(--color-success)]"
                  : "text-[var(--text-muted)]"
              )}
            >
              {integration.status}
            </span>
          </div>
          <h2 className="mt-4 text-[15px] font-semibold">{integration.name}</h2>
          <p className="mt-1 flex-1 text-[13px] leading-5 text-[var(--text-secondary)]">
            {integration.description}
          </p>
          <Button
            variant="outline"
            onClick={integration.onClick}
            disabled={integration.disabled}
            className="mt-4 w-full"
          >
            {integration.action}
          </Button>
        </article>
      ))}
    </div>
  );
}
