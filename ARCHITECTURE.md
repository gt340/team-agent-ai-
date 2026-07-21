# Atlas Backend — Agent Orchestration & Integration Architecture

This is the system design for the part the marketing site was standing in
front of: a real multi-agent backend built on the Claude API, with a
concrete integration approach for Slack, Drive, GitHub, Notion, email, and
internal databases.

---

## 1. Pattern: a supervisor with scoped specialists, not one giant prompt

Two ways to build "one AI team" and they behave very differently at scale:

- **One agent, one huge system prompt, every tool attached.** Simple to
  start, but the model has to hold Slack triage rules, SQL conventions,
  and code-review standards in its head at once, and every tool is
  reachable from every request — hard to reason about, hard to secure.
- **A supervisor that routes to scoped specialist agents.** Each
  specialist (Support, Docs, Code, Flow, Insight, Write) is its own
  Messages API call with its own system prompt and its own tool
  allowlist. The supervisor only decides *who* handles a request and
  hands off; it never touches Slack or your database directly.

Atlas uses the second pattern. It costs one extra model call per request
(the routing decision) but the security and debugging story is far
better: a support ticket literally cannot reach your GitHub write tools,
because the Support agent's Messages API call was never given them.

```
                    ┌─────────────────────┐
   user / event ──▶ │   Supervisor         │
                    │   (claude-opus-4-8)  │
                    └──────────┬───────────┘
                               │ routes + hands off context
             ┌─────────────────┼─────────────────┬───────────────┐
             ▼                 ▼                 ▼               ▼
        ┌─────────┐      ┌──────────┐      ┌──────────┐   ┌───────────┐
        │ Support │      │  Code    │      │  Insight │   │   ...     │
        │ sonnet-5│      │ sonnet-5 │      │ sonnet-5 │   │           │
        └────┬────┘      └────┬─────┘      └────┬─────┘   └───────────┘
             │ tool_use            │ tool_use         │ tool_use
             ▼                     ▼                  ▼
     ┌───────────────┐    ┌───────────────┐   ┌────────────────┐
     │ MCP: Zendesk,  │    │ MCP: GitHub    │   │ Custom tool:    │
     │ Slack          │    │ (remote server)│   │ query_warehouse │
     └───────────────┘    └───────────────┘   └────────────────┘
```

Model assignment: the supervisor uses `claude-opus-4-8` for the routing
and judgment call (which agent, how much autonomy, does this need
approval). Specialists default to `claude-sonnet-5` for the balance of
capability and cost; a high-volume, low-complexity step (e.g. classifying
an inbound ticket's urgency before Support even picks it up) can drop to
`claude-haiku-4-5-20251001`.

---

## 2. Two integration paths — pick per service, not globally

Anthropic's Messages API gives you two genuinely different ways to reach
an external system, and the right choice is per-integration, not
project-wide.

**Path A — MCP connector, for services with a remote MCP server.**
Slack, GitHub, Google Drive, Notion, Jira, and others already have
maintained remote MCP servers. You pass them straight into the API call
via the `mcp_servers` parameter — no client to build, no tool schema to
maintain yourself:

```jsonc
{
  "model": "claude-sonnet-5",
  "max_tokens": 1024,
  "messages": [...],
  "mcp_servers": [
    {
      "type": "url",
      "url": "https://mcp.slack.com/sse",
      "name": "slack",
      "authorization_token": "{{SLACK_OAUTH_TOKEN}}",
      "tool_configuration": {
        "enabled": true,
        "allowed_tools": ["search_messages", "post_message"]
      }
    }
  ]
}
```

Claude only calls a connected tool when the request actually maps to it
— asking "how do Slack threads work" doesn't trigger a call, asking
"post the standup summary to #eng" does. `allowed_tools` is where a
read-only agent (Insight) gets `search_messages` but never
`post_message`.

**Path B — direct tool_use, for anything internal or without a remote
MCP server.** Your production database, your billing system, your
internal REST APIs: you define the tool's JSON schema, Claude returns a
`tool_use` block when it wants to call it, your backend executes it, and
you return a `tool_result`. This is the path for `query_warehouse`,
`create_refund`, `deploy_workflow` — anything specific to your company
that no public MCP server will ever expose.

**When to build your own MCP server instead of a direct tool:** only if
more than one Claude surface needs the same internal capability (the
API-based Atlas backend *and* your team's Claude Code *and* Claude.ai via
a custom connector, say). If it's just this backend calling it, a direct
tool is less to build, deploy, and secure than standing up and hosting
your own MCP server.

---

## 3. Knowledge layer — how "Docs" actually answers with citations

Documents don't get stuffed into a prompt. On connect, a background job
walks Drive/Notion/Confluence (via their MCP servers' read tools),
chunks each document, embeds it, and stores it in a vector index
(pgvector or a managed vector DB) alongside its source URL and last-synced
timestamp. The Docs agent gets one custom tool, `search_knowledge_base`,
which does the retrieval and hands back chunks with source links —
Claude cites them in its answer rather than inventing a source. Re-sync
is incremental: a webhook or polling job re-embeds only what changed.

---

## 4. Guardrails — the part that makes this safe to deploy

- **Tool scoping per agent.** Enforced at the API call level via
  `allowed_tools` (MCP) and by simply not attaching a tool (direct
  tools). An agent cannot call what it was never given.
- **Read vs. write separation.** Every integration exposes its read
  tools freely; write tools (`post_message`, `create_pr`,
  `create_refund`) require an explicit capability flag per agent, set by
  the customer during setup — this is the "How It Works → Set the
  guardrails" step from the marketing site made real.
- **Approval queue for sensitive writes.** A write tool doesn't execute
  immediately — it's inserted into an approval queue with the proposed
  action, the reasoning, and an idempotency key; a human approves or
  rejects before the backend actually calls the underlying API. Low-risk,
  high-volume actions (an internal Slack post) can be configured to
  auto-approve; irreversible or customer-facing ones (a refund, a
  production deploy) default to requiring sign-off.
- **Full audit log.** Every tool call — agent, tool, input, output,
  approval decision, timestamp — is written to an append-only log. This
  is what the Dashboard Preview's "Team activity" feed is reading from
  in a real deployment.

---

## 5. Data flow for one request

1. Inbound event (Slack message, webhook, dashboard chat) hits the API
   gateway.
2. Supervisor call (`claude-opus-4-8`) reads the event + relevant recent
   context, decides which specialist(s) handle it, and drafts a
   handoff brief.
3. Specialist call (`claude-sonnet-5`) runs with its scoped tools. Any
   `tool_use` block is executed by your backend (direct tool) or routed
   through the MCP connector (external service); results come back as
   `tool_result` and the loop continues until Claude produces a final
   response.
4. Write actions pause at the guardrail layer if they require approval;
   read actions and approved writes execute immediately.
5. Result + full tool trace is logged, and the response is delivered
   back to the origin (Slack thread, dashboard, webhook caller).

---

## 6. What's in `/server` in this repo

```
server/
  agents/index.ts          Agent registry: system prompt + model + tool scope per specialist
  mcp/servers.config.ts    Remote MCP server definitions (Slack, GitHub, Drive, Notion...)
  tools/registry.ts        Direct tool_use schemas for internal/custom systems
  knowledge/search.ts      search_knowledge_base tool implementation (RAG)
  guardrails/approval.ts   Write-action approval queue
  orchestrator.ts          Supervisor loop: route → call specialist → handle tool_use → guardrail → log
```

This is a reference implementation, not a deployable service — it's
meant to be the concrete starting point for your actual API layer
(auth, persistence, retries, and per-tenant credential storage are left
as integration points, marked `// TODO` in the code).
