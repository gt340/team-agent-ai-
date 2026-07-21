// Remote MCP server registry — Path A integrations (see ARCHITECTURE.md §2).
// Each entry maps to the `mcp_servers` array in a Messages API request.
//
// STATUS:
//  - github: verified endpoint, PAT auth — works with a static token in .env.
//  - slack:  verified endpoint, but OAuth auth — a static token in .env only
//            works if you've manually completed a one-time OAuth exchange
//            first (see README "Wiring up the next integration"). It is
//            NOT equivalent to GitHub's PAT flow; treat authMethod as the
//            signal for how much more work a given integration needs.
//  - drive/notion/zendesk/gmail: not yet verified at all.

export interface McpServerConfig {
  type: "url";
  url: string;
  name: string;
  /** Set true once the url above has been verified against the provider's own docs. */
  verified: boolean;
  /**
   * "pat"   — a long-lived token pasted into .env is sufficient (GitHub).
   * "oauth" — needs a real OAuth authorization + refresh flow to be usable
   *           beyond a single short-lived manual test token (Slack).
   */
  authMethod: "pat" | "oauth";
}

export const MCP_SERVERS: Record<string, McpServerConfig> = {
  // Verified: https://github.com/github/github-mcp-server/blob/main/docs/remote-server.md
  // `/readonly` is GitHub's own server-side flag — it guarantees no write
  // tools are exposed at all, regardless of what we pass in allowed_tools.
  github: {
    type: "url",
    url: "https://api.githubcopilot.com/mcp/readonly",
    name: "github",
    verified: true,
    authMethod: "pat",
  },

  // Verified: https://docs.slack.dev/ai/slack-mcp-server/connect-to-claude
  // Real endpoint, but Slack's server requires OAuth — a workspace admin
  // must approve the MCP integration, and a proper client needs to run the
  // authorization-code exchange (Slack's own docs show this via the
  // Claude Code plugin: `claude plugin install slack`, or Claude Desktop's
  // Connectors settings — both handle the OAuth dance for you). For this
  // backend to call it directly (outside those two Claude surfaces) you'd
  // register your own Slack app and implement the OAuth flow yourself —
  // that's the real remaining work here, not a config value.
  slack: {
    type: "url",
    url: "https://mcp.slack.com/mcp",
    name: "slack",
    verified: true,
    authMethod: "oauth",
  },

  // Not yet verified — set these up and replace the URL before use.
  drive: { type: "url", url: "REPLACE_ME", name: "drive", verified: false, authMethod: "oauth" },
  notion: { type: "url", url: "REPLACE_ME", name: "notion", verified: false, authMethod: "oauth" },
  zendesk: { type: "url", url: "REPLACE_ME", name: "zendesk", verified: false, authMethod: "oauth" },
  gmail: { type: "url", url: "REPLACE_ME", name: "gmail", verified: false, authMethod: "oauth" },
};

/**
 * Per-service credential lookup.
 *
 *  - "pat" services (GitHub): read a static token from `<SERVICE>_MCP_TOKEN`.
 *    Simple and correct — a PAT doesn't expire on a schedule this code
 *    needs to know about.
 *  - "oauth" services (Slack): read from the real credential store
 *    (server/credentials/store.ts), populated by the actual OAuth flow at
 *    /api/oauth/slack/start → /api/oauth/slack/callback
 *    (server/mcp/slack-oauth.ts). If the stored token is expired and a
 *    refresh token is on file, refresh it automatically and persist the
 *    new one. Falls back to `<SERVICE>_MCP_TOKEN` only as a manual
 *    override for quick local testing — that path never refreshes.
 *
 * TODO: server/credentials/store.ts is in-memory — swap it for a real
 * encrypted table before this serves more than one tenant.
 */
export async function getTenantToken(tenantId: string, serverName: string): Promise<string | null> {
  const server = MCP_SERVERS[serverName];

  if (server?.authMethod === "oauth") {
    const { getCredential, saveCredential, isExpired } = await import("../credentials/store");
    const cred = await getCredential(tenantId, serverName);

    if (cred) {
      if (!isExpired(cred)) return cred.accessToken;

      if (cred.refreshToken) {
        const { refreshAccessToken } = await import("./slack-oauth"); // TODO: generalize once a 2nd oauth service exists
        try {
          const refreshed = await refreshAccessToken(cred.refreshToken);
          const updated = {
            tenantId,
            service: serverName,
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken ?? cred.refreshToken,
            expiresAt: refreshed.expiresInSeconds ? Date.now() + refreshed.expiresInSeconds * 1000 : undefined,
          };
          await saveCredential(updated);
          return updated.accessToken;
        } catch (err) {
          console.warn(`[mcp] Token refresh failed for ${serverName}/${tenantId}:`, err);
          return null; // fall through to env var below
        }
      }
    }
  }

  // Manual override / PAT path.
  const envVar = `${serverName.toUpperCase()}_MCP_TOKEN`;
  return process.env[envVar] ?? null;
}

/**
 * Builds the `mcp_servers` array for a Messages API call, scoped to exactly
 * the servers + tools a given agent is allowed to use. Servers that aren't
 * verified or have no token configured are silently dropped (with a
 * console warning) rather than failing the whole request — an agent
 * should still work with whatever it's actually connected to.
 */
export async function buildMcpServersParam(
  tenantId: string,
  scopes: { name: string; allowedTools: string[] }[]
) {
  const results = await Promise.all(
    scopes.map(async (scope) => {
      const server = MCP_SERVERS[scope.name];
      if (!server) {
        console.warn(`[mcp] Unknown server "${scope.name}" — skipping.`);
        return null;
      }
      if (!server.verified) {
        console.warn(`[mcp] Server "${scope.name}" has an unverified URL — skipping.`);
        return null;
      }
      const token = await getTenantToken(tenantId, scope.name);
      if (!token) {
        console.warn(
          `[mcp] No token configured for "${scope.name}" (set ${scope.name.toUpperCase()}_MCP_TOKEN` +
            `${server.authMethod === "oauth" ? " — this one needs a manual OAuth exchange first, see README" : ""}) — skipping.`
        );
        return null;
      }
      return {
        type: server.type,
        url: server.url,
        name: server.name,
        authorization_token: token,
        // Omit the filter entirely when no allowlist is given, rather than
        // sending an empty list (which would allow nothing). Once you've
        // connected once and inspected the real tool names the server
        // exposes, narrow this down per agent in agents/index.ts.
        ...(scope.allowedTools.length
          ? { tool_configuration: { enabled: true, allowed_tools: scope.allowedTools } }
          : {}),
      };
    })
  );
  return results.filter((r): r is NonNullable<typeof r> => r !== null);
}
