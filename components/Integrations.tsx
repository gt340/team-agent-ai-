"use client";

import { integrations } from "@/lib/data";

export default function Integrations() {
  const row1 = integrations.slice(0, 8);
  const row2 = integrations.slice(8);

  return (
    <section id="integrations" className="relative overflow-hidden bg-base-950 py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 max-w-2xl">
          <span className="font-mono text-xs uppercase tracking-widest text-heat">
            Integrations
          </span>
          <h2 className="mt-4 text-balance font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">
            Plugs into what you already run.
          </h2>
          <p className="mt-5 text-lg text-ink-muted">
            16 integrations live today, with a public API for everything else.
          </p>
        </div>
      </div>

      <div className="relative flex flex-col gap-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-base-950 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-base-950 to-transparent" />

        <div className="flex w-max animate-marquee gap-5">
          {[...row1, ...row1].map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="flex h-24 w-56 shrink-0 items-center justify-center rounded-2xl border border-base-border bg-base-800/50 font-display text-lg text-ink-muted transition-colors hover:border-heat/50 hover:text-ink"
            >
              {name}
            </div>
          ))}
        </div>

        <div className="flex w-max animate-marquee gap-5" style={{ animationDirection: "reverse" }}>
          {[...row2, ...row2].map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="flex h-24 w-56 shrink-0 items-center justify-center rounded-2xl border border-base-border bg-base-800/50 font-display text-lg text-ink-muted transition-colors hover:border-volt/50 hover:text-ink"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
