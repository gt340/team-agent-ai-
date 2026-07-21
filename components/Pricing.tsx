"use client";

import { motion } from "framer-motion";
import { pricing } from "@/lib/data";

export default function Pricing() {
  return (
    <section id="pricing" className="relative bg-base-950 px-6 py-28 md:py-36">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 max-w-2xl">
          <span className="font-mono text-xs uppercase tracking-widest text-heat">Pricing</span>
          <h2 className="mt-4 text-balance font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">
            Start free. Scale when it's paying for itself.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {pricing.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`relative flex flex-col rounded-2xl p-8 ${
                p.highlighted
                  ? "border-2 border-heat bg-base-800 shadow-[0_30px_80px_-30px_rgba(250,93,25,0.35)]"
                  : "border border-base-border bg-base-800/50"
              }`}
            >
              {p.highlighted && (
                <span className="absolute -top-3 left-8 rounded-full bg-heat px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-base-950">
                  Most deployed
                </span>
              )}
              <h3 className="font-display text-xl font-semibold text-ink">{p.name}</h3>
              <p className="mt-1 text-sm text-ink-muted">{p.blurb}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold text-ink">{p.price}</span>
                <span className="text-sm text-ink-faint">{p.period}</span>
              </div>

              <ul className="mt-8 flex flex-1 flex-col gap-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-ink-muted">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-volt" />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#"
                className={`mt-8 rounded-lg px-5 py-3 text-center text-sm font-semibold transition-transform hover:-translate-y-0.5 ${
                  p.highlighted
                    ? "bg-heat text-base-950"
                    : "border border-white/15 text-ink hover:border-white/30"
                }`}
              >
                {p.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
