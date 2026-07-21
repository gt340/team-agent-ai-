// Short-lived state for an in-progress OAuth handshake — the PKCE verifier
// has to survive the redirect out to Slack and back, but only for the
// few minutes the user takes to approve. Separate from the long-term
// credential store in server/credentials/store.ts on purpose: this is
// disposable, that isn't.

interface PendingAuth {
  tenantId: string;
  codeVerifier: string;
  createdAt: number;
}

const PENDING_TTL_MS = 10 * 60 * 1000; // 10 minutes to complete the flow

const pending = new Map<string, PendingAuth>();

export function savePendingAuth(state: string, data: Omit<PendingAuth, "createdAt">) {
  pending.set(state, { ...data, createdAt: Date.now() });
}

export function consumePendingAuth(state: string): PendingAuth | null {
  const entry = pending.get(state);
  pending.delete(state); // single use regardless of outcome
  if (!entry) return null;
  if (Date.now() - entry.createdAt > PENDING_TTL_MS) return null;
  return entry;
}
