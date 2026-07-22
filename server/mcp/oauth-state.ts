import { kv } from "@vercel/kv";

interface PendingAuth {
  tenantId: string;
  codeVerifier: string;
}

const PENDING_TTL_SECONDS = 10 * 60;
const keyFor = (state: string) => `oauth:pending:${state}`;

export async function savePendingAuth(state: string, data: PendingAuth): Promise<void> {
  await kv.set(keyFor(state), data, { ex: PENDING_TTL_SECONDS });
}

export async function consumePendingAuth(state: string): Promise<PendingAuth | null> {
  const entry = await kv.get<PendingAuth>(keyFor(state));
  await kv.del(keyFor(state));
  return entry ?? null;
}
