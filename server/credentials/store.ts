// Credential store — where OAuth tokens actually live once a real flow
// (not a manually-pasted env var) obtains them. In-memory here on purpose:
// it's enough to prove the OAuth mechanics end-to-end locally, but it does
// NOT survive a restart and does NOT scale past one process. Swap Map for
// a real encrypted table (keyed by tenantId + service) before this touches
// a second real tenant.

export interface StoredCredential {
  tenantId: string;
  service: string;
  accessToken: string;
  refreshToken?: string;
  /** epoch ms; undefined means "treat as non-expiring" (e.g. a PAT). */
  expiresAt?: number;
}

// TODO: replace with a real persistence layer. Encrypt at rest — these are
// live bearer tokens for whatever scopes were granted.
const store = new Map<string, StoredCredential>();

function key(tenantId: string, service: string) {
  return `${tenantId}:${service}`;
}

export async function getCredential(tenantId: string, service: string): Promise<StoredCredential | null> {
  return store.get(key(tenantId, service)) ?? null;
}

export async function saveCredential(cred: StoredCredential): Promise<void> {
  store.set(key(cred.tenantId, cred.service), cred);
}

export async function deleteCredential(tenantId: string, service: string): Promise<void> {
  store.delete(key(tenantId, service));
}

export function isExpired(cred: StoredCredential): boolean {
  if (!cred.expiresAt) return false;
  // 60s buffer so we refresh slightly before the token actually dies.
  return Date.now() > cred.expiresAt - 60_000;
}
