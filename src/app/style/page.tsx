import {
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  CircleMinus,
  Clock3,
  Plus,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StyleDatePickerPreview } from "@/components/ui/style-date-picker-preview";
import { Switch } from "@/components/ui/switch";

import { APP_NAME } from "@/lib/app-config";

export const metadata = {
  title: `${APP_NAME} UI system`,
};

const surfaces = [
  ["Canvas", "--surface-canvas"],
  ["Panel", "--surface-panel"],
  ["Raised", "--surface-raised"],
  ["Control", "--surface-control"],
  ["Hover", "--surface-hover"],
  ["Input", "--surface-input"],
] as const;

const statuses = [
  ["Connected", "--color-success", Check],
  ["Needs attention", "--color-warning", CircleAlert],
  ["Unavailable", "--text-muted", CircleMinus],
  ["Error", "--color-danger", TriangleAlert],
] as const;

export default function StylePage() {
  return (
    <main className="needt-page-depth min-h-screen px-5 py-10 text-[var(--text-primary)] sm:px-8">
      <div className="mx-auto max-w-[1040px]">
        <header className="border-b border-[var(--border-subtle)] pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">
            {APP_NAME} design system
          </p>
          <h1 className="mt-3 text-[36px] font-semibold tracking-[-0.035em] sm:text-[44px]">
            Calm, dense, and deliberate.
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-[var(--text-secondary)]">
            This page is the live reference for product surfaces. Components use
            semantic tokens, compact geometry, subtle borders, and 150–250 ms
            motion. No glow and no backdrop blur.
          </p>
        </header>

        <section className="py-9">
          <SectionTitle
            eyebrow="Foundation"
            title="Surfaces"
            description="Adjacent layers change by a small luminance step so the interface stays readable without looking striped."
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {surfaces.map(([label, token]) => (
              <div
                key={token}
                className="rounded-lg border border-[var(--border-subtle)] p-4"
                style={{ background: `var(${token})` }}
              >
                <div className="text-[13px] font-medium">{label}</div>
                <code className="mt-1 block text-[11px] text-[var(--text-muted)]">
                  {token}
                </code>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-[var(--border-subtle)] py-9">
          <SectionTitle
            eyebrow="Typography"
            title="One system font, clear hierarchy"
            description="Large headings use tighter tracking; product copy stays compact and readable."
          />
          <div className="mt-6 space-y-5">
            <div className="text-[36px] font-semibold tracking-[-0.035em]">
              Today&apos;s plan
            </div>
            <div className="text-[18px] font-semibold">Section heading</div>
            <div className="text-[14px] font-medium">Task or setting label</div>
            <div className="max-w-2xl text-[13px] leading-5 text-[var(--text-secondary)]">
              Secondary copy explains the next decision without competing with
              the primary label.
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Eyebrow label
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--border-subtle)] py-9">
          <SectionTitle
            eyebrow="Controls"
            title="Shared interaction contract"
            description="Primary actions use one blue treatment; secondary controls stay neutral."
          />
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button>
                  <Plus />
                  Primary action
                </Button>
                <Button variant="outline">Secondary</Button>
                <Button variant="ghost">Quiet action</Button>
                <Button disabled>Unavailable</Button>
              </div>
              <Input placeholder="Input text" aria-label="Input example" />
              <div className="grid gap-2 sm:grid-cols-2">
                <Select defaultValue="week">
                  <SelectTrigger aria-label="View example">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                  </SelectContent>
                </Select>
                <StyleDatePickerPreview />
              </div>
              <div className="flex min-h-11 items-center justify-between border-y border-[var(--border-subtle)]">
                <span className="text-[14px]">Shade non-working hours</span>
                <Switch aria-label="Switch example" defaultChecked />
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-panel)]">
              <div className="border-b border-[var(--border-subtle)] px-4 py-3 text-[13px] font-semibold">
                Compact rows
              </div>
              {[
                { icon: CalendarDays, label: "Calendar", meta: "Connected" },
                { icon: Clock3, label: "Working hours", meta: "9 AM – 5 PM" },
                { icon: CircleAlert, label: "Provider", meta: "Unavailable" },
              ].map(({ icon: Icon, label, meta }) => (
                <div
                  key={label}
                  className="flex min-h-12 items-center gap-3 border-t border-[var(--border-subtle)] px-4 first:border-t-0"
                >
                  <Icon className="h-4 w-4 text-[var(--text-secondary)]" />
                  <span className="min-w-0 flex-1 text-[13px]">{label}</span>
                  <span className="text-[12px] text-[var(--text-muted)]">
                    {meta}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--border-subtle)] py-9">
          <SectionTitle
            eyebrow="States"
            title="Consistent provider language"
            description="Every integration uses the same four neutral status patterns."
          />
          <div className="mt-5 flex flex-wrap gap-2">
            {statuses.map(([label, token, Icon]) => (
              <span
                key={label}
                className="inline-flex h-7 items-center gap-2 rounded-full bg-[var(--surface-control)] px-3 text-[12px]"
                style={{ color: `var(${token})` }}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-[20px] font-semibold">{title}</h2>
      <p className="mt-1 max-w-2xl text-[13px] leading-5 text-[var(--text-secondary)]">
        {description}
      </p>
    </div>
  );
}
