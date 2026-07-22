"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const Scene = dynamic(() => import("@/components/three/Scene"), { ssr: false });

export default function Hero3D() {
  const pointer = useRef({ x: 0, y: 0 });
  const [reduced, setReduced] = useState(false);
  const [lowPower, setLowPower] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    setLowPower(window.innerWidth < 768);

    const onMove = (e: MouseEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section className="relative flex h-[100svh] w-full items-center justify-center overflow-hidden bg-base-950">
      {/* base gradient wash */}
      <div className="pointer-events-none absolute inset-0 bg-grid-fade" />
      <div className="pointer-events-none absolute inset-0 bg-orb-glow opacity-60" />

      <div className="absolute inset-0">
        <Canvas
          dpr={[1, lowPower ? 1.3 : 2]}
          camera={{ position: [0, 0, 8], fov: 45 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <Suspense fallback={null}>
            <Scene pointer={pointer} reduced={reduced} lowPower={lowPower} />
          </Suspense>
        </Canvas>
      </div>

      {/* overlay copy */}
      <div className="relative z-20 mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-base-900/60 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-volt backdrop-blur-sm"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />
          Six agents. One team. Live now.
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-balance font-display text-5xl font-semibold leading-[1.05] text-ink sm:text-6xl md:text-7xl"
        >
          Your entire company,
          <br />
          powered by <span className="text-heat">one AI team.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.22, ease: "easeOut" }}
          className="mt-6 max-w-xl text-balance text-lg text-ink-muted"
        >
          Atlas connects to every app, document, and workflow you run — and
          hands the work to a coordinated team of specialist agents who
          actually get it done.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.34, ease: "easeOut" }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <a
            href="#pricing"
            className="edge-accent rounded-lg bg-heat px-7 py-3.5 font-semibold text-base-950 transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Deploy your team
          </a>
          <a
            href="#how-it-works"
            className="link-underline rounded-lg px-7 py-3.5 font-semibold text-ink"
          >
            See how it works →
          </a>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2 font-mono text-[11px] uppercase tracking-[0.3em] text-ink-faint">
        Scroll
      </div>

      {/* bottom fade into next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-base-950 to-transparent" />
    </section>
  );
}
