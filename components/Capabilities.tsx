"use client";

import { motion } from "framer-motion";
import { capabilities } from "@/lib/data";

export default function Capabilities() {
  return (
    <section id="capabilities" className="relative bg-base-900 px-6 py-28 md:py-36">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-volt">
              Capabilities
            </span>
            <h2 className="mt-4 text-balance font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">
              Everything the job needs, nothing you have to babysit.
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-6">
          {capabilities.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className={`rounded-2xl border border-base-border bg-base-800/50 p-7 ${
                i === 0 || i === 3 ? "md:col-span-3" : "md:col-span-3"
              } ${i === 1 ? "md:col-span-4" : ""} ${i === 2 ? "md:col-span-2" : ""}`}
            >
              <span className="font-mono text-xs text-ink-faint">0{i + 1}</span>
              <h3 className="mt-3 font-display text-2xl font-semibold text-ink">{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
