// Slack OAuth flow — implements the actual authorization-code + PKCE +
// refresh-token exchange, against the endpoints Slack's own MCP OAuth
// discovery document reports:
//
//   GET https://mcp.slack.com/.well-known/oauth-authorization-server
//   -> {
//        "issuer": "https://slack.com",
//        "authorization_endpoint": "https://slack.com/oauth/v2_user/authorize",
//        "token_endpoint": "https://slack.com/api/oauth.v2.user.access",
//        "grant_types_supported": ["authorization_code", "refresh_token"],
//        "token_endpoint_auth_methods_supported": ["client_secret_post"],
//        "code_challenge_methods_supported": ["S256"]
//      }
//
// Slack does NOT support Dynamic Client Registration (no
// registration_endpoint) — you need a pre-registered app: create one at
// https://api.slack.com/apps, open "Agents & AI Apps" and enable MCP, then
// under OAuth & Permissions add a redirect URL matching
// SLACK_REDIRECT_URI below and copy the Client ID / Client Secret.
//
// HONESTY NOTE: the authorization + PKCE + refresh mechanics here follow
// Slack's confirmed discovery metadata and standard OAuth 2.1. The exact
// shape of the token endpoint's JSON response is NOT independently
// verified against a live call in this environment (no network access
// here to test it) — Slack's Web API historically wraps responses as
// `{ ok: boolean, ... }` rather than plain OAuth JSON, so
// `parseTokenResponse` below checks for both shapes defensively. Log the
// raw response the first time you run this for real and adjust if needed.

import { randomBytes, createHash } from "crypto";

const AUTHORIZATION_ENDPOINT = "https://slack.com/oauth/v2_user/authorize";
const TOKEN_ENDPOINT = "https://slack.com/api/oauth.v2.user.access";

// Minimal scopes to prove the flow + let Support/Flow post and search.
// Narrow or widen once you've seen what mcp.slack.com actually exposes
// per scope — see README "Wiring up the next integration".
const DEFAULT_SCOPES = ["search:read.public", "chat:write", "channels:history"];

function base64url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generatePkcePair() {
  const verifier = base64url(randomBytes(48)); // 64 chars, within the 43–128 spec range
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export function generateState(): string {
  return base64url(randomBytes(24));
}

export function buildAuthorizeUrl(params: { state: string; codeChallenge: string; redirectUri: string }) {
  const clientId = requireEnv("SLACK_CLIENT_ID");
  const url = new URL(AUTHORIZATION_ENDPOINT);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("user_scope", DEFAULT_SCOPES.join(","));
  url.searchParams.set("scope", DEFAULT_SCOPES.join(" "));
  return url.toString();
}

export interface TokenResult {
  accessToken: string;
  refreshToken?: string;
  expiresInSeconds?: number;
}

async function exchange(body: Record<string, string>): Promise<TokenResult> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("SLACK_CLIENT_ID"),
      client_secret: requireEnv("SLACK_CLIENT_SECRET"),
      ...body,
    }),
  });

  const data = await res.json();
  return parseTokenResponse(data, res.ok);
}

function parseTokenResponse(data: any, httpOk: boolean): TokenResult {
  // Slack Web API shape: { ok: false, error: "..." } on failure.
  if (data?.ok === false) {
    throw new Error(`Slack OAuth error: ${data.error ?? "unknown"}`);
  }
  if (!httpOk && data?.ok !== true) {
    throw new Error(`Slack OAuth token exchange failed: ${JSON.stringify(data)}`);
  }

  // Try the plain-OAuth shape first, then Slack's nested authed_user shape.
  const accessToken = data.access_token ?? data.authed_user?.access_token;
  const refreshToken = data.refresh_token ?? data.authed_user?.refresh_token;
  const expiresIn = data.expires_in ?? data.authed_user?.expires_in;

  if (!accessToken) {
    throw new Error(`Slack OAuth response had no access token: ${JSON.stringify(data)}`);
  }

  return { accessToken, refreshToken, expiresInSeconds: expiresIn };
}

export async function exchangeCodeForToken(code: string, codeVerifier: string, redirectUri: string) {
  return exchange({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });
}

export async function refreshAccessToken(refreshToken: string) {
  return exchange({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}
