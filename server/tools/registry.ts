// Direct tools — Path B integrations (see ARCHITECTURE.md §2). Each tool
// has a JSON schema Claude sees, and an `execute` function your backend
// runs when Claude returns a matching tool_use block. Keep schemas narrow
// and outputs compact — a tool that returns your whole database is hard
// for both Claude and a human reviewer to use safely.

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  execute: (input: any, ctx: { tenantId: string }) => Promise<unknown>;
}

export const TOOLS: Record<string, ToolDefinition> = {
  search_knowledge_base: {
    name: "search_knowledge_base",
    description:
      "Search the tenant's indexed documents (Drive, Notion, uploaded files) and return the most relevant chunks with their source URLs.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural-language search query" },
        top_k: { type: "integer", description: "Number of chunks to return", default: 5 },
      },
      required: ["query"],
    },
    execute: async (input, ctx) => {
      // See server/knowledge/search.ts for the implementation.
      const { searchKnowledgeBase } = await import("../knowledge/search");
      return searchKnowledgeBase(ctx.tenantId, input.query, input.top_k ?? 5);
    },
  },

  query_warehouse: {
    name: "query_warehouse",
    description:
      "Run a read-only analytics query against the tenant's connected warehouse (Postgres/Snowflake) and return rows. Only SELECT statements are permitted.",
    input_schema: {
      type: "object",
      properties: {
        sql: { type: "string", description: "A single read-only SELECT statement" },
      },
      required: ["sql"],
    },
    execute: async (input, ctx) => {
      // TODO: connect to your warehouse client. Enforce read-only at the
      // DB-role level, not just by inspecting the SQL string.
      throw new Error(`query_warehouse not implemented (tenant=${ctx.tenantId})`);
    },
  },

  generate_chart: {
    name: "generate_chart",
    description: "Render a chart (line, bar, or scatter) from a set of data points for display in the dashboard.",
    input_schema: {
      type: "object",
      properties: {
        style: { type: "string", enum: ["line", "bar", "scatter"] },
        title: { type: "string" },
        series: { type: "array", items: { type: "object" } },
      },
      required: ["style", "series"],
    },
    execute: async (input) => ({ renderedChartId: crypto.randomUUID(), spec: input }),
  },

  run_test_suite: {
    name: "run_test_suite",
    description: "Run the repository's test suite against a given branch or PR and return pass/fail results.",
    input_schema: {
      type: "object",
      properties: {
        repo: { type: "string" },
        ref: { type: "string", description: "Branch name or commit SHA" },
      },
      required: ["repo", "ref"],
    },
    execute: async (input, ctx) => {
      // TODO: trigger your CI provider's API and poll for results.
      throw new Error(`run_test_suite not implemented (tenant=${ctx.tenantId})`);
    },
  },

  run_workflow: {
    name: "run_workflow",
    description: "Execute a customer-defined automation (a named sequence of steps configured in the Flow builder).",
    input_schema: {
      type: "object",
      properties: {
        workflow_id: { type: "string" },
        input: { type: "object" },
      },
      required: ["workflow_id"],
    },
    execute: async (input, ctx) => {
      // TODO: look up the workflow definition and execute its steps,
      // writing each step's result to the audit log as it runs.
      throw new Error(`run_workflow not implemented (tenant=${ctx.tenantId})`);
    },
  },

  query_crm: {
    name: "query_crm",
    description: "Look up records (contacts, deals, accounts) in the tenant's connected CRM.",
    input_schema: {
      type: "object",
      properties: {
        object_type: { type: "string", enum: ["contact", "deal", "account"] },
        filter: { type: "object" },
      },
      required: ["object_type"],
    },
    execute: async (input, ctx) => {
      // TODO: route to the tenant's configured CRM adapter (Salesforce,
      // HubSpot, etc.) — this is intentionally provider-agnostic here.
      throw new Error(`query_crm not implemented (tenant=${ctx.tenantId})`);
    },
  },

  // --- GitHub write actions -------------------------------------------
  //
  // WHY THESE ARE DIRECT TOOLS, NOT MCP ALLOWED_TOOLS:
  // MCP-connected tool calls execute inside the same Messages API turn
  // Claude calls them in — our backend never sees a pre-execution moment
  // to intercept. requiresApproval only works for direct tools, whose
  // execute() we control. These call GitHub's REST API directly with a
  // separate write-scoped token (GITHUB_WRITE_TOKEN), so approval is real.

  github_create_pull_request: {
    name: "github_create_pull_request",
    description:
      "Open a pull request on the connected GitHub repository. Requires human approval before it actually runs.",
    input_schema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner (user or org)" },
        repo: { type: "string" },
        title: { type: "string" },
        head: { type: "string", description: "Branch containing the changes" },
        base: { type: "string", description: "Branch to merge into, e.g. main" },
        body: { type: "string", description: "PR description" },
        draft: { type: "boolean", default: false },
      },
      required: ["owner", "repo", "title", "head", "base"],
    },
    execute: async (input) => {
      const token = requireGithubWriteToken();
      const res = await fetch(`https://api.github.com/repos/${input.owner}/${input.repo}/pulls`, {
        method: "POST",
        headers: githubWriteHeaders(token),
        body: JSON.stringify({
          title: input.title,
          head: input.head,
          base: input.base,
          body: input.body,
          draft: input.draft ?? false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`GitHub create_pull_request failed (${res.status}): ${JSON.stringify(data)}`);
      return { number: data.number, url: data.html_url, state: data.state };
    },
  },

  github_add_issue_comment: {
    name: "github_add_issue_comment",
    description:
      "Add a comment to a GitHub issue or pull request. Requires human approval before it actually runs.",
    input_schema: {
      type: "object",
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        issue_number: { type: "integer", description: "Issue or PR number" },
        body: { type: "string" },
      },
      required: ["owner", "repo", "issue_number", "body"],
    },
    execute: async (input) => {
      const token = requireGithubWriteToken();
      const res = await fetch(
        `https://api.github.com/repos/${input.owner}/${input.repo}/issues/${input.issue_number}/comments`,
        { method: "POST", headers: githubWriteHeaders(token), body: JSON.stringify({ body: input.body }) }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(`GitHub add_issue_comment failed (${res.status}): ${JSON.stringify(data)}`);
      return { id: data.id, url: data.html_url };
    },
  },

  // --- Slack write action ----------------------------------------------
  // Same reasoning as above. Uses SLACK_WRITE_TOKEN — a separate bot
  // token from the read-only OAuth token behind the MCP connection.

  slack_post_message: {
    name: "slack_post_message",
    description:
      "Post a message to a Slack channel or thread. Requires human approval before it actually runs.",
    input_schema: {
      type: "object",
      properties: {
        channel: { type: "string", description: "Channel ID (e.g. C0123456) — not a #name" },
        text: { type: "string" },
        thread_ts: { type: "string", description: "Optional — reply within this thread" },
      },
      required: ["channel", "text"],
    },
    execute: async (input) => {
      const token = process.env.SLACK_WRITE_TOKEN;
      if (!token) throw new Error("SLACK_WRITE_TOKEN is not configured — see .env.example.");
      const res = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({ channel: input.channel, text: input.text, thread_ts: input.thread_ts }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(`Slack chat.postMessage failed: ${JSON.stringify(data)}`);
      return { channel: data.channel, ts: data.ts };
    },
  },

  send_email: {
    name: "send_email",
    description: "Send an email on the tenant's behalf. Requires human approval before it actually runs.",
    input_schema: {
      type: "object",
      properties: {
        to: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
      },
      required: ["to", "subject", "body"],
    },
    execute: async (input, ctx) => {
      throw new Error(`send_email not implemented (tenant=${ctx.tenantId})`);
    },
  },
};


function requireGithubWriteToken(): string {
  const token = process.env.GITHUB_WRITE_TOKEN;
  if (!token) throw new Error("GITHUB_WRITE_TOKEN is not configured — see .env.example.");
  return token;
}

function githubWriteHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}
/** Returns Claude-ready tool schemas (name/description/input_schema only) for a given tool name list. */
export function getToolSchemas(names: string[]) {
  return names.map((n) => {
    const t = TOOLS[n];
    if (!t) throw new Error(`Unknown tool: ${n}`);
    const { name, description, input_schema } = t;
    return { name, description, input_schema };
  });
}
