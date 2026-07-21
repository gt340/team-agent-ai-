import { NextRequest, NextResponse } from "next/server";
import { getCredential, isExpired } from "@/server/credentials/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenantId") ?? "demo-tenant";
  const cred = await getCredential(tenantId, "slack");

  if (!cred) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    expired: isExpired(cred),
    hasRefreshToken: Boolean(cred.refreshToken),
    expiresAt: cred.expiresAt ?? null,
  });
}
