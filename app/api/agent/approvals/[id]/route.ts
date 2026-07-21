import { NextRequest, NextResponse } from "next/server";
import { resolveApproval, getApproval } from "@/server/guardrails/approval";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const approval = await getApproval(id);
  if (!approval) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(approval);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const decision = body.decision;

  if (decision !== "approved" && decision !== "rejected") {
    return NextResponse.json(
      { error: "`decision` must be \"approved\" or \"rejected\"." },
      { status: 400 }
    );
  }

  // TODO: resolvedBy should come from the authenticated session, not the body.
  const resolvedBy = body.resolvedBy ?? "unknown";

  try {
    const updated = await resolveApproval(id, decision, resolvedBy);
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
