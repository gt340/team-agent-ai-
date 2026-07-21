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
};

/** Returns Claude-ready tool schemas (name/description/input_schema only) for a given tool name list. */
export function getToolSchemas(names: string[]) {
  return names.map((n) => {
    const t = TOOLS[n];
    if (!t) throw new Error(`Unknown tool: ${n}`);
    const { name, description, input_schema } = t;
    return { name, description, input_schema };
  });
}
