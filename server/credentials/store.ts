import { kv } from "@vercel/kv";

export interface StoredCredential {
  tenantId: string;
  service: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

function key(tenantId: string, service: string) {
  return `credential:${tenantId}:${service}`;
}

export async function getCredential(tenantId: string, service: string): Promise<StoredCredential | null> {
  const entry = await kv.get<StoredCredential>(key(tenantId, service));
  return entry ?? null;
}

export async function saveCredential(cred: StoredCredential): Promise<void> {
  await kv.set(key(cred.tenantId, cred.service), cred);
}

export async function deleteCredential(tenantId: string, service: string): Promise<void> {
  await kv.del(key(tenantId, service));
}

export function isExpired(cred: StoredCredential): boolean {
  if (!cred.expiresAt) return false;
  return Date.now() > cred.expiresAt - 60_000;
}
