"use client";

import { motion } from "framer-motion";
import { steps } from "@/lib/data";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-base-900 px-6 py-28 md:py-36">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 max-w-2xl">
          <span className="font-mono text-xs uppercase tracking-widest text-volt">
            How it works
          </span>
          <h2 className="mt-4 text-balance font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">
            Live in an afternoon, not a quarter.
          </h2>
        </div>

        <div className="relative">
          <div className="absolute left-[27px] top-2 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-heat via-volt to-transparent md:block" />

          <div className="flex flex-col gap-12 md:gap-16">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.55, delay: i * 0.05 }}
                className="relative flex flex-col gap-4 md:flex-row md:items-start md:gap-10"
              >
                <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-heat/40 bg-base-950 font-mono text-sm text-heat">
                  {s.n}
                </div>
                <div className="max-w-xl">
                  <h3 className="font-display text-2xl font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-ink-muted">{s.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
