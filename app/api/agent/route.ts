import { NextRequest, NextResponse } from "next/server";
import { handleEvent, InboundEvent } from "@/server/orchestrator";

// The Anthropic SDK and the orchestrator's tool-use loop need the Node.js
// runtime, not the Edge runtime.
export const runtime = "nodejs";

interface AgentRequestBody {
  tenantId?: string;
  channel?: InboundEvent["channel"];
  text: string;
  history?: InboundEvent["history"];
}

export async function POST(req: NextRequest) {
  let body: AgentRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!body.text || typeof body.text !== "string") {
    return NextResponse.json({ error: "`text` is required." }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  const event: InboundEvent = {
    // TODO: derive tenantId from the authenticated session/API key once
    // auth is wired up — never trust a client-supplied tenant id in prod.
    tenantId: body.tenantId ?? "demo-tenant",
    channel: body.channel ?? "dashboard",
    text: body.text,
    history: body.history ?? [],
  };

  try {
    const result = await handleEvent(event);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/agent] orchestrator error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
