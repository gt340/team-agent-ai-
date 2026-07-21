import { NextRequest, NextResponse } from "next/server";
import { deleteCredential } from "@/server/credentials/store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const tenantId = body.tenantId ?? "demo-tenant";
  await deleteCredential(tenantId, "slack");
  return NextResponse.json({ disconnected: true });
}
