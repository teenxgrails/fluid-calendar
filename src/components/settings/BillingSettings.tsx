"use client";

import { useEffect, useState } from "react";

import { Check, Coins } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { SettingsSection } from "./SettingsSection";

interface BillingSummary {
  plan: "FREE" | "LIFETIME";
  status: "ACTIVE" | "PAYMENT_PENDING" | "PAYMENT_FAILED";
}

export function BillingSettings() {
  const [summary, setSummary] = useState<BillingSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/billing")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load billing");
        return (await response.json()) as BillingSummary;
      })
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) {
          setSummary({ plan: "FREE", status: "ACTIVE" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!summary) {
    return (
      <div className="max-w-[896px] space-y-8">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const planName =
    summary.plan === "LIFETIME" ? "Needt Lifetime" : "Needt Free";

  return (
    <div className="max-w-[896px] space-y-10">
      <SettingsSection title="Plan">
        <div className="rounded-[var(--control-radius)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold">{planName}</span>
                <span className="rounded-full bg-[var(--surface-control)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]">
                  {summary.status === "ACTIVE" ? "Active" : "Pending"}
                </span>
              </div>
              <p className="mt-2 max-w-[560px] text-[13px] leading-5 text-[var(--text-secondary)]">
                Calendar, tasks, deterministic auto-scheduling, Focus, and
                personal integrations are included.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => toast.info("Invoices will appear here")}
              >
                Invoices
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast.info("Paid Needt plans are not available yet")
                }
              >
                Manage plan
              </Button>
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Included usage">
        <div className="rounded-[var(--control-radius)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-5">
          <div className="flex items-center gap-3">
            <Coins className="h-5 w-5 text-[var(--text-secondary)]" />
            <div>
              <div className="text-[14px] font-medium">
                Unlimited local planning
              </div>
              <div className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
                AI usage is billed by the provider connected in AI Assistant.
              </div>
            </div>
          </div>
          <div className="mt-5 grid gap-2 border-t border-[var(--border-subtle)] pt-4 sm:grid-cols-2">
            {[
              "Unlimited tasks and projects",
              "Unlimited calendar sync",
              "Deterministic auto-scheduling",
              "Bring your own AI provider",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]"
              >
                <Check className="h-3.5 w-3.5 text-[var(--color-success)]" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
