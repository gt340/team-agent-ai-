"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { href: "#agents", label: "Team" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#integrations", label: "Integrations" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-panel py-3" : "bg-transparent py-5"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2 font-display text-lg font-semibold">
          <span className="relative flex h-6 w-6 items-center justify-center rounded-md bg-heat">
            <span className="h-2 w-2 rounded-full bg-base-950" />
          </span>
          Atlas
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="link-underline pb-1 text-sm text-ink-muted transition-colors hover:text-ink"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-4 md:flex">
          <a href="/connections" className="text-sm text-ink-muted transition-colors hover:text-ink">
            Connections
          </a>
          <a href="#" className="text-sm text-ink-muted transition-colors hover:text-ink">
            Sign in
          </a>
          <a
            href="#pricing"
            className="rounded-lg bg-heat px-4 py-2 text-sm font-semibold text-base-950 transition-transform hover:-translate-y-0.5"
          >
            Deploy your team
          </a>
        </div>

        <button
          aria-label="Toggle menu"
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
          onClick={() => setOpen((o) => !o)}
        >
          <span className={`h-px w-5 bg-ink transition-transform ${open ? "translate-y-[3px] rotate-45" : ""}`} />
          <span className={`h-px w-5 bg-ink transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-px w-5 bg-ink transition-transform ${open ? "-translate-y-[3px] -rotate-45" : ""}`} />
        </button>
      </nav>

      {open && (
        <div className="glass-panel mt-3 flex flex-col gap-1 px-6 py-4 md:hidden">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-2.5 text-sm text-ink-muted hover:text-ink"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#pricing"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-lg bg-heat px-4 py-2.5 text-center text-sm font-semibold text-base-950"
          >
            Deploy your team
          </a>
        </div>
      )}
    </header>
  );
}
