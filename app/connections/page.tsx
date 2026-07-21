"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";

interface SlackStatus {
  connected: boolean;
  expired?: boolean;
  hasRefreshToken?: boolean;
  expiresAt?: number | null;
}

const INTEGRATIONS = [
  { id: "slack", label: "Slack", wired: true, color: "#3DD9EB" },
  { id: "github", label: "GitHub", wired: true, color: "#3DD9EB", note: "Read-only, token-based — no connect flow needed yet." },
  { id: "drive", label: "Google Drive", wired: false, color: "#FA5D19" },
  { id: "notion", label: "Notion", wired: false, color: "#FA5D19" },
  { id: "zendesk", label: "Zendesk", wired: false, color: "#FA5D19" },
  { id: "gmail", label: "Gmail", wired: false, color: "#FA5D19" },
] as const;

function ConnectionsContent() {
  const params = useSearchParams();
  const [slack, setSlack] = useState<SlackStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const justConnected = params.get("connected") === "slack";
  const oauthError = params.get("error");

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/oauth/slack/status?tenantId=demo-tenant");
      setSlack(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function disconnect() {
    setBusy(true);
    try {
      await fetch("/api/oauth/slack/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: "demo-tenant" }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-base-950">
      <Nav />
      <div className="mx-auto max-w-3xl px-6 pb-24 pt-32">
        <span className="font-mono text-xs uppercase tracking-widest text-heat">Settings</span>
        <h1 className="mt-3 font-display text-4xl font-semibold text-ink">Connections</h1>
        <p className="mt-3 text-ink-muted">
          What Atlas can currently reach on this workspace's behalf.
        </p>

        {oauthError && (
          <div className="mt-6 rounded-xl border border-heat/40 bg-heat/10 px-4 py-3 text-sm text-heat">
            Connection failed: {oauthError}
          </div>
        )}
        {justConnected && !oauthError && (
          <div className="mt-6 rounded-xl border border-signal/40 bg-signal/10 px-4 py-3 text-sm text-signal">
            Slack connected successfully.
          </div>
        )}

        <div className="mt-10 flex flex-col gap-4">
          {INTEGRATIONS.map((integration) => {
            const isSlack = integration.id === "slack";
            const connected = isSlack ? Boolean(slack?.connected) : integration.wired === true && integration.id === "github";

            return (
              <div
                key={integration.id}
                className="flex items-center justify-between rounded-2xl border border-base-border bg-base-800/50 px-6 py-5"
              >
                <div className="flex items-center gap-4">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
                    style={{ boxShadow: `0 0 20px ${integration.color}40` }}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: integration.color }} />
                  </span>
                  <div>
                    <p className="font-display text-lg font-semibold text-ink">{integration.label}</p>
                    {isSlack && slack?.connected && (
                      <p className="mt-0.5 font-mono text-xs text-ink-faint">
                        {slack.expired ? "Token expired — will refresh automatically on next use" : "Token active"}
                        {slack.hasRefreshToken ? " · auto-refresh enabled" : " · no refresh token on file"}
                      </p>
                    )}
                    {"note" in integration && integration.note && (
                      <p className="mt-0.5 text-xs text-ink-faint">{integration.note}</p>
                    )}
                    {!integration.wired && (
                      <p className="mt-0.5 text-xs text-ink-faint">Not wired up yet — no verified endpoint</p>
                    )}
                  </div>
                </div>

                {isSlack ? (
                  loading ? (
                    <span className="font-mono text-xs text-ink-faint">Checking…</span>
                  ) : slack?.connected ? (
                    <button
                      onClick={disconnect}
                      disabled={busy}
                      className="rounded-lg border border-white/15 px-4 py-2 text-sm text-ink-muted transition-colors hover:border-heat/50 hover:text-heat disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <a
                      href="/api/oauth/slack/start?tenantId=demo-tenant"
                      className="rounded-lg bg-heat px-4 py-2 text-sm font-semibold text-base-950 transition-transform hover:-translate-y-0.5"
                    >
                      Connect
                    </a>
                  )
                ) : connected ? (
                  <span className="rounded-full border border-signal/30 px-3 py-1 font-mono text-xs text-signal">
                    Active
                  </span>
                ) : (
                  <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-ink-faint">
                    Not connected
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={null}>
      <ConnectionsContent />
    </Suspense>
  );
}
