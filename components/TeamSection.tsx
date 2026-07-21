"use client";

import { motion } from "framer-motion";
import { agents } from "@/lib/data";

export default function TeamSection() {
  return (
    <section id="agents" className="relative bg-base-950 px-6 py-28 md:py-36">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 max-w-2xl">
          <span className="font-mono text-xs uppercase tracking-widest text-heat">
            Meet the team
          </span>
          <h2 className="mt-4 text-balance font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">
            Six specialists. One shared brain.
          </h2>
          <p className="mt-5 text-lg text-ink-muted">
            Each agent is built for a specific kind of work and shares full
            context with the rest of the team — nothing gets lost in the
            handoff.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: (i % 3) * 0.08, ease: "easeOut" }}
              className="group relative overflow-hidden rounded-2xl border border-base-border bg-base-800/60 p-6 transition-colors hover:border-white/20"
            >
              <div
                className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-40"
                style={{ background: agent.color }}
              />
              <div className="relative">
                <div
                  className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10"
                  style={{ boxShadow: `0 0 24px ${agent.color}55` }}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: agent.color }} />
                </div>

                <h3 className="font-display text-xl font-semibold text-ink">{agent.name}</h3>
                <p className="mt-1 font-mono text-xs uppercase tracking-wide text-ink-faint">
                  {agent.role}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-ink-muted">{agent.description}</p>

                <ul className="mt-5 flex flex-wrap gap-2">
                  {agent.abilities.map((a) => (
                    <li
                      key={a}
                      className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] text-ink-muted"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
