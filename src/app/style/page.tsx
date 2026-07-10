import { ArrowRight, Sparkles, Timer, Zap } from "lucide-react";

import {
  AmbientBackdrop,
  GlassCard,
  GlassPanel,
  GlowRing,
  PrimaryButton,
  StatBlock,
} from "@/components/liquid";

export const metadata = {
  title: "Liquid Glass System",
};

export default function StylePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--bg-0)] px-5 py-10 text-[var(--text-hi)]">
      <AmbientBackdrop />
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--text-lo)]">
              <Sparkles className="h-3.5 w-3.5" />
              Flowday Design System
            </div>
            <h1 className="max-w-2xl text-5xl font-semibold leading-tight md:text-7xl">
              Liquid Glass primitives.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-7 text-[var(--text-lo)]">
              Deep navy canvas, translucent surfaces, luminous borders, and
              restrained color bloom inspired by the provided reference.
            </p>
          </div>
          <PrimaryButton>
            Primary Action
            <ArrowRight className="h-4 w-4" />
          </PrimaryButton>
        </header>

        <section className="grid gap-5 md:grid-cols-[1.35fr_0.65fr]">
          <GlassPanel tone="strong" className="p-6 md:p-8">
            <div className="flex flex-col gap-8 md:flex-row md:items-center">
              <GlowRing tone="violet" className="h-52 w-52 shrink-0">
                <div className="h-36 w-36 rounded-full border border-white/20 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,.45),transparent_18%),radial-gradient(circle_at_45%_55%,var(--acc-magenta),transparent_28%),radial-gradient(circle_at_62%_42%,var(--acc-blue),transparent_32%),radial-gradient(circle,var(--acc-violet),transparent_68%)] shadow-[inset_0_1px_28px_rgba(255,255,255,.22)]" />
              </GlowRing>
              <div>
                <div className="text-sm uppercase tracking-[0.18em] text-[var(--text-lo)]">
                  Showcase
                </div>
                <h2 className="mt-3 text-4xl font-medium">Focus bloom</h2>
                <p className="mt-3 max-w-md text-[var(--text-lo)]">
                  CSS gradients create Flowday&apos;s own abstract glow. No Opal
                  artwork or trademarked assets are used.
                </p>
              </div>
            </div>
          </GlassPanel>

          <GlassCard tone="default" className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-lo)]">
                <Timer className="h-4 w-4" />
                Timer Surface
              </div>
              <div className="stat-numeral mt-6 text-6xl">77%</div>
              <p className="mt-3 text-sm text-[var(--text-lo)]">
                Large numerals use light weight and tabular alignment.
              </p>
            </div>
            <div className="mt-8 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[var(--acc-blue)] via-[var(--acc-violet)] to-[var(--acc-magenta)]" />
            </div>
          </GlassCard>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <StatBlock label="Focus" value="2h 58m" detail="Today" tone="blue" />
          <StatBlock
            label="Streak"
            value="24"
            detail="Gentle reminder only"
            tone="teal"
          />
          <StatBlock
            label="Fit"
            value="91%"
            detail="Estimate accuracy"
            tone="magenta"
          />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {["glass", "glass--strong", "glass--subtle"].map((name) => (
            <div key={name} className={name}>
              <div className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[var(--acc-gold)]" />
                  <span className="font-medium">{name}</span>
                </div>
                <p className="text-sm leading-6 text-[var(--text-lo)]">
                  Translucent surface with blur, saturated refraction, specular
                  edge, and reduced-transparency fallback.
                </p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
