import { NextRequest, NextResponse } from "next/server";
import { generatePkcePair, generateState, buildAuthorizeUrl } from "@/server/mcp/slack-oauth";
import { savePendingAuth } from "@/server/mcp/oauth-state";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // TODO: derive tenantId from the authenticated session once auth exists.
  const tenantId = req.nextUrl.searchParams.get("tenantId") ?? "demo-tenant";

  const redirectUri = process.env.SLACK_REDIRECT_URI;
  if (!redirectUri) {
    return NextResponse.json(
      { error: "SLACK_REDIRECT_URI is not configured on the server." },
      { status: 500 }
    );
  }

  const { verifier, challenge } = generatePkcePair();
  const state = generateState();
  savePendingAuth(state, { tenantId, codeVerifier: verifier });

  const authorizeUrl = buildAuthorizeUrl({ state, codeChallenge: challenge, redirectUri });
  return NextResponse.redirect(authorizeUrl);
}
