import Anthropic from "@anthropic-ai/sdk";
import { AGENTS, AgentId, TRIAGE_MODEL } from "./agents";
import { buildMcpServersParam } from "./mcp/servers.config";
import { getToolSchemas, TOOLS } from "./tools/registry";
import { requestApproval, isAutoApproved } from "./guardrails/approval";

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env

export interface InboundEvent {
  tenantId: string;
  channel: "slack" | "email" | "dashboard" | "webhook";
  text: string;
  /** Prior turns for this thread/conversation, oldest first. */
  history?: { role: "user" | "assistant"; content: string }[];
}

export interface AuditEntry {
  tenantId: string;
  agentId: AgentId;
  toolName?: string;
  input?: unknown;
  output?: unknown;
  approvalStatus?: string;
  timestamp: string;
}

// TODO: replace with a real sink (append-only table, log pipeline).
// This is what the Dashboard Preview's "Team activity" feed reads from.
async function logAudit(entry: AuditEntry) {
  console.log("[audit]", JSON.stringify(entry));
}

/**
 * Step 1 — Supervisor: decide which specialist should handle this event.
 * Runs on claude-opus-4-8 for the judgment call; cheap enough since it's
 * one short call per inbound event, not per tool call.
 */
async function route(event: InboundEvent): Promise<AgentId> {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 50,
    system: `You route inbound requests to the correct Atlas specialist.
Reply with exactly one agent id and nothing else: support, docs, code, flow, insight, or write.`,
    messages: [{ role: "user", content: event.text }],
  });

  const text = response.content.find((b) => b.type === "text");
  const id = (text && "text" in text ? text.text.trim().toLowerCase() : "") as AgentId;
  return id in AGENTS ? id : "support"; // safe default
}

/**
 * Step 2 — Specialist run: the actual tool_use loop for one agent. Keeps
 * calling Claude and executing tools until it returns a final text
 * response (or an unresolved approval blocks further progress).
 */
async function runSpecialist(agentId: AgentId, event: InboundEvent): Promise<string> {
  const agent = AGENTS[agentId];

  const mcpServers = await buildMcpServersParam(event.tenantId, agent.mcpServers);
  const tools = getToolSchemas(agent.directTools);

  const messages: Anthropic.MessageParam[] = [
    ...(event.history ?? []).map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: event.text },
  ];

  // Bounded loop — never let a misbehaving tool chain run forever.
  for (let turn = 0; turn < 8; turn++) {
    const response = await anthropic.messages.create({
      model: agent.model,
      max_tokens: 2048,
      system: agent.systemPrompt,
      tools: tools.length ? tools : undefined,
      mcp_servers: mcpServers.length ? mcpServers : undefined,
      messages,
    } as any, { headers: { "anthropic-beta": "mcp-client-2025-04-04" } });

    const mcpCalls = response.content.filter((b: any) => b.type === "mcp_tool_use");
    if (mcpCalls.length) {
      console.log(`[mcp] agent=${agent.id} tools_called=${mcpCalls.map((b: any) => `${b.server_name}:${b.name}`).join(", ")}`);
    }

    const toolUse = response.content.find((b) => b.type === "tool_use");

    if (!toolUse || response.stop_reason !== "tool_use") {
      // Final answer — collect all text blocks.
      return response.content
        .filter((b) => b.type === "text")
        .map((b: any) => b.text)
        .join("\n");
    }


    const { name, input, id: toolUseId } = toolUse as { name: string; input: unknown; id: string };
    let result: unknown;

    if (agent.requiresApproval.includes(name) && !isAutoApproved(event.tenantId, name)) {
      const approval = await requestApproval({
        tenantId: event.tenantId,
        agentId,
        toolName: name,
        input,
        reasoning: `Requested during: "${event.text.slice(0, 140)}"`,
      });
      result = {
        status: "pending_approval",
        approvalId: approval.id,
        message: "This action needs human sign-off before it runs. I'll follow up once it's approved.",
      };
      await logAudit({ tenantId: event.tenantId, agentId, toolName: name, input, approvalStatus: "pending", timestamp: new Date().toISOString() });
    } else if (TOOLS[name]) {
      result = await TOOLS[name].execute(input, { tenantId: event.tenantId });
      await logAudit({ tenantId: event.tenantId, agentId, toolName: name, input, output: result, timestamp: new Date().toISOString() });
    } else {
      // Tool wasn't a direct tool — it was handled server-side by the MCP
      // connector already, and Claude's response will include the
      // mcp_tool_result block automatically. Nothing to execute here.
      messages.push({ role: "assistant", content: response.content });
      continue;
    }

    messages.push({ role: "assistant", content: response.content });
    messages.push({
      role: "user",
      content: [{ type: "tool_result", tool_use_id: toolUseId, content: JSON.stringify(result) }],
    });
  }

  return "I wasn't able to finish this within the expected number of steps — flagging for review.";
}

/** Entry point: route + run + log, for one inbound event. */
export async function handleEvent(event: InboundEvent): Promise<{ agentId: AgentId; response: string }> {
  const agentId = await route(event);
  const response = await runSpecialist(agentId, event);
  return { agentId, response };
}

/** Optional pre-routing triage for high-volume channels (e.g. tag urgency before Support picks it up). */
export async function triage(event: InboundEvent): Promise<{ urgency: "low" | "normal" | "high" }> {
  const response = await anthropic.messages.create({
    model: TRIAGE_MODEL,
    max_tokens: 10,
    system: `Classify urgency as exactly one word: low, normal, or high.`,
    messages: [{ role: "user", content: event.text }],
  });
  const text = response.content.find((b) => b.type === "text");
  const urgency = (text && "text" in text ? text.text.trim().toLowerCase() : "normal") as "low" | "normal" | "high";
  return { urgency: ["low", "normal", "high"].includes(urgency) ? urgency : "normal" };
}
