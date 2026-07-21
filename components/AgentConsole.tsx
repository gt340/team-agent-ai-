"use client";

import { useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string; agentId?: string };

export default function AgentConsole() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          history: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Request failed");

      setMessages((m) => [...m, { role: "assistant", content: data.response, agentId: data.agentId }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="glass-panel mb-3 flex h-[28rem] w-[22rem] flex-col overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between border-b border-base-border px-4 py-3">
            <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-heat" />
              Atlas console
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close console"
              className="text-ink-faint hover:text-ink"
            >
              ×
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <p className="text-sm text-ink-faint">
                Ask something like "what's blocking release?" or "summarize open support tickets." This
                calls the live orchestrator at /api/agent.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={`inline-block max-w-[85%] rounded-xl px-3.5 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-heat text-base-950"
                      : "border border-base-border bg-base-800/80 text-ink"
                  }`}
                >
                  {m.role === "assistant" && m.agentId && (
                    <div className="mb-1 font-mono text-[10px] uppercase tracking-wide text-volt">
                      {m.agentId}
                    </div>
                  )}
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <p className="font-mono text-xs text-ink-faint">Routing to a specialist…</p>}
            {error && <p className="text-xs text-heat">{error}</p>}
          </div>

          <div className="flex items-center gap-2 border-t border-base-border p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Message the team…"
              className="flex-1 rounded-lg border border-base-border bg-base-900 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-heat/50"
            />
            <button
              onClick={send}
              disabled={loading}
              className="rounded-lg bg-heat px-3.5 py-2 text-sm font-semibold text-base-950 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle Atlas console"
        className="edge-accent flex h-14 w-14 items-center justify-center rounded-full bg-heat text-base-950 transition-transform hover:-translate-y-0.5"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-base-950" />
      </button>
    </div>
  );
}
