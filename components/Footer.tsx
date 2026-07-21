const COLUMNS = [
  {
    title: "Product",
    links: ["Team", "Capabilities", "Integrations", "Pricing", "Changelog"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Blog", "Contact"],
  },
  {
    title: "Resources",
    links: ["Docs", "API reference", "Status", "Security"],
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-base-border bg-base-950 px-6 pb-10 pt-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <a href="#" className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
              <span className="relative flex h-6 w-6 items-center justify-center rounded-md bg-heat">
                <span className="h-2 w-2 rounded-full bg-base-950" />
              </span>
              Atlas
            </a>
            <p className="mt-4 max-w-xs text-sm text-ink-muted">
              One AI team, connected to everything your company runs on.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="font-mono text-xs uppercase tracking-widest text-ink-faint">
                {col.title}
              </h4>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-ink-muted transition-colors hover:text-ink">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-base-border pt-8 sm:flex-row">
          <p className="font-mono text-xs text-ink-faint">© 2026 Atlas AI, Inc.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-ink-muted hover:text-ink">Privacy</a>
            <a href="#" className="text-xs text-ink-muted hover:text-ink">Terms</a>
            <a href="#" className="text-xs text-ink-muted hover:text-ink">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
