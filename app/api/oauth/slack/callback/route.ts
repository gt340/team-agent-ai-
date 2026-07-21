import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/server/mcp/slack-oauth";
import { consumePendingAuth } from "@/server/mcp/oauth-state";
import { saveCredential } from "@/server/credentials/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.json({ error: `Slack denied the request: ${error}` }, { status: 400 });
  }
  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state." }, { status: 400 });
  }

  const pending = consumePendingAuth(state);
  if (!pending) {
    return NextResponse.json({ error: "Unknown or expired OAuth state — start the flow again." }, { status: 400 });
  }

  const redirectUri = process.env.SLACK_REDIRECT_URI;
  if (!redirectUri) {
    return NextResponse.json({ error: "SLACK_REDIRECT_URI is not configured." }, { status: 500 });
  }

  try {
    const token = await exchangeCodeForToken(code, pending.codeVerifier, redirectUri);

    await saveCredential({
      tenantId: pending.tenantId,
      service: "slack",
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt: token.expiresInSeconds ? Date.now() + token.expiresInSeconds * 1000 : undefined,
    });

    // Redirect into the connections page rather than returning raw JSON —
    // see app/connections/page.tsx.
    return NextResponse.redirect(new URL("/connections?connected=slack", req.url));
  } catch (err) {
    console.error("[oauth/slack/callback] token exchange failed:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      new URL(`/connections?error=${encodeURIComponent(message)}`, req.url)
    );
  }
}
