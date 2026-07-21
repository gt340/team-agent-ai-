"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const activity = [
  { agent: "Atlas Support", action: "Resolved 14 tickets", time: "2m ago", tone: "signal" },
  { agent: "Atlas Code", action: "Opened PR #482 with test coverage", time: "6m ago", tone: "volt" },
  { agent: "Atlas Insight", action: "Flagged churn anomaly in EU region", time: "11m ago", tone: "heat" },
  { agent: "Atlas Flow", action: "Ran onboarding sequence x3", time: "18m ago", tone: "volt" },
];

export default function DashboardPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 20 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 20 });

  const handleMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const reset = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <section className="relative bg-base-950 px-6 py-28 md:py-36">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 max-w-2xl">
          <span className="font-mono text-xs uppercase tracking-widest text-heat">
            Command center
          </span>
          <h2 className="mt-4 text-balance font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">
            Watch the whole team work, in real time.
          </h2>
        </div>

        <motion.div
          ref={ref}
          onMouseMove={handleMove}
          onMouseLeave={reset}
          style={{ rotateX: rx, rotateY: ry, transformPerspective: 1200 }}
          className="glass-panel relative overflow-hidden rounded-3xl border border-white/10 p-2 shadow-[0_40px_120px_-40px_rgba(250,93,25,0.25)]"
        >
          <div className="rounded-2xl bg-base-900/80 p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
                <span className="ml-4 font-mono text-xs text-ink-faint">atlas.ai/console</span>
              </div>
              <span className="flex items-center gap-2 font-mono text-xs text-signal">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
                Live
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-base-border bg-base-800/60 p-5 md:col-span-1">
                <p className="font-mono text-xs text-ink-faint">Actions today</p>
                <p className="mt-2 font-display text-4xl font-semibold text-ink">3,214</p>
                <p className="mt-1 text-xs text-signal">↑ 18% vs yesterday</p>
              </div>
              <div className="rounded-xl border border-base-border bg-base-800/60 p-5 md:col-span-1">
                <p className="font-mono text-xs text-ink-faint">Avg. resolution</p>
                <p className="mt-2 font-display text-4xl font-semibold text-ink">41s</p>
                <p className="mt-1 text-xs text-ink-muted">Across all agents</p>
              </div>
              <div className="rounded-xl border border-base-border bg-base-800/60 p-5 md:col-span-1">
                <p className="font-mono text-xs text-ink-faint">Connected apps</p>
                <p className="mt-2 font-display text-4xl font-semibold text-ink">16</p>
                <p className="mt-1 text-xs text-ink-muted">All systems synced</p>
              </div>

              <div className="rounded-xl border border-base-border bg-base-800/60 p-5 md:col-span-3">
                <p className="mb-4 font-mono text-xs text-ink-faint">Team activity</p>
                <ul className="flex flex-col divide-y divide-base-border">
                  {activity.map((a) => (
                    <li key={a.action} className="flex items-center justify-between gap-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            a.tone === "signal" ? "bg-signal" : a.tone === "volt" ? "bg-volt" : "bg-heat"
                          }`}
                        />
                        <span className="text-sm text-ink">
                          <span className="font-medium">{a.agent}</span>{" "}
                          <span className="text-ink-muted">— {a.action}</span>
                        </span>
                      </div>
                      <span className="shrink-0 font-mono text-xs text-ink-faint">{a.time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
