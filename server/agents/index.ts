// Agent registry — one entry per specialist. This is the single source of
// truth for what each agent is allowed to touch. The orchestrator reads
// this to build each Messages API call; nothing outside this file should
// decide an agent's tool access.

export type AgentId = "support" | "docs" | "code" | "flow" | "insight" | "write";

export interface AgentDefinition {
  id: AgentId;
  model: "claude-opus-4-8" | "claude-sonnet-5" | "claude-haiku-4-5-20251001";
  systemPrompt: string;
  /** Remote MCP servers this agent may use, and which of each server's tools. */
  mcpServers: {
    name: string; // must match a key in mcp/servers.config.ts
    allowedTools: string[];
  }[];
  /** Direct (non-MCP) tools this agent may call — see tools/registry.ts */
  directTools: string[];
  /** Tools in this list execute only after guardrails/approval.ts clears them. */
  requiresApproval: string[];
}

export const AGENTS: Record<AgentId, AgentDefinition> = {
  support: {
    id: "support",
    model: "claude-sonnet-5",
    systemPrompt: `You are Atlas Support, the customer-support specialist on the Atlas
team. Resolve tickets directly when you have enough information from the
knowledge base and past tickets. Match the company's tone. Escalate to a
human when the customer is angry, the issue involves billing disputes, or
you are not confident in the answer — say so plainly rather than guessing.`,
    mcpServers: [
      { name: "zendesk", allowedTools: ["search_tickets", "reply_to_ticket", "update_ticket_status"] }, // zendesk not yet verified — inert until server config is filled in
      { name: "slack", allowedTools: [] }, // [] = allow whatever mcp.slack.com exposes; narrow once you've inspected real tool names
    ],
    directTools: ["search_knowledge_base"],
    requiresApproval: [], // ticket replies are the product; kept low-friction by design
  },

  docs: {
    id: "docs",
    model: "claude-sonnet-5",
    systemPrompt: `You are Atlas Docs. Answer questions using only what you retrieve from
search_knowledge_base. Always cite the source document. If nothing
relevant is retrieved, say you couldn't find it — never fill the gap
from general knowledge.`,
    mcpServers: [
      { name: "drive", allowedTools: ["search_files", "read_file"] },
      { name: "notion", allowedTools: ["search_pages", "read_page"] },
    ],
    directTools: ["search_knowledge_base"],
    requiresApproval: [],
  },

  code: {
    id: "code",
    model: "claude-sonnet-5",
    // NOTE: currently wired to GitHub's read-only remote MCP server
    // (see server/mcp/servers.config.ts) — repos.readonly at the server
    // level, so this agent can search code, read PRs/issues, and check CI
    // status, but has no write tools available at all right now, no
    // matter what a prompt asks for. To let it open draft PRs or comment,
    // switch the github entry in servers.config.ts to the non-readonly
    // toolset URL, verify the exact write-tool names it exposes, and list
    // them explicitly below — that's also where they'd get added to
    // requiresApproval.
    systemPrompt: `You are Atlas Code. You currently have read-only access to the
connected repository: you can search code, read pull requests and
issues, and check CI status. You cannot open PRs, comment, or push —
say so plainly if asked to take a write action rather than attempting
one.`,
    mcpServers: [
      { name: "github", allowedTools: [] }, // [] = allow whatever the readonly server exposes
    ],
    directTools: ["run_test_suite"],
    requiresApproval: [], // no write tools attached yet — nothing to gate
  },

  flow: {
    id: "flow",
    model: "claude-sonnet-5",
    systemPrompt: `You are Atlas Flow. You execute workflows the customer has already
defined — you do not invent new automations on your own. Log every step
you take and stop immediately if a step fails rather than improvising a
workaround.`,
    mcpServers: [
      { name: "slack", allowedTools: [] }, // [] = allow whatever mcp.slack.com exposes; narrow once verified
      { name: "gmail", allowedTools: ["send_email"] }, // gmail not yet verified — inert until server config is filled in
    ],
    directTools: ["run_workflow", "query_crm"],
    requiresApproval: ["send_email", "run_workflow"],
  },

  insight: {
    id: "insight",
    model: "claude-sonnet-5",
    systemPrompt: `You are Atlas Insight. Answer data questions by querying the
warehouse, never by estimating. Show the query logic in plain language
alongside the answer so it can be checked.`,
    mcpServers: [],
    directTools: ["query_warehouse", "generate_chart"],
    requiresApproval: [], // read-only by construction — no write tools attached
  },

  write: {
    id: "write",
    model: "claude-sonnet-5",
    systemPrompt: `You are Atlas Write. Draft content in the company's established
voice (see the brand-voice examples retrieved from the knowledge base).
You produce drafts for a human to review and publish — you never
publish directly.`,
    mcpServers: [
      { name: "notion", allowedTools: ["search_pages", "read_page"] },
    ],
    directTools: ["search_knowledge_base"],
    requiresApproval: [],
  },
};

/** Fast triage classification, run before routing on high-volume inbound channels. */
export const TRIAGE_MODEL = "claude-haiku-4-5-20251001";
