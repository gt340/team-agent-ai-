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

async function logAudit(entry: AuditEntry) {
  console.log("[audit]", JSON.stringify(entry));
}

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
  return id in AGENTS ? id : "support";
}

async function runSpecialist(agentId: AgentId, event: InboundEvent): Promise<string> {
  const agent = AGENTS[agentId];

  const mcpServers = await buildMcpServersParam(event.tenantId, agent.mcpServers);
  const tools = getToolSchemas(agent.directTools);

  const messages: Anthropic.MessageParam[] = [
    ...(event.history ?? []).map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: event.text },
  ];

  for (let turn = 0; turn < 8; turn++) {
    const response = await anthropic.messages.create(
      {
        model: agent.model,
        max_tokens: 2048,
        system: agent.systemPrompt,
        tools: tools.length ? tools : undefined,
        mcp_servers: mcpServers.length ? mcpServers : undefined,
        messages,
      } as any,
      { headers: { "anthropic-beta": "mcp-client-2025-04-04" } }
    );

    const mcpCalls = response.content.filter((b: any) => b.type === "mcp_tool_use");
    if (mcpCalls.length) {
      console.log(
        `[mcp] agent=${agent.id} tools_called=${mcpCalls.map((b: any) => `${b.server_name}:${b.name}`).join(", ")}`
      );
    }

    const toolUse = response.content.find((b) => b.type === "tool_use");

    if (!toolUse || response.stop_reason !== "tool_use") {
      return response.content
        .filter((b) => b.type === "text")
        .map((b: any) => b.text)
        .join("\n");
    }

    const { name, input, id: toolUseId } = toolUse as { name: string; input: unknown; id: string };
    let result: unknown;
    let isToolError = false;

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
      try {
        result = await TOOLS[name].execute(input, { tenantId: event.tenantId });
        await logAudit({ tenantId: event.tenantId, agentId, toolName: name, input, output: result, timestamp: new Date().toISOString() });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        isToolError = true;
        result = { error: message };
        await logAudit({ tenantId: event.tenantId, agentId, toolName: name, input, output: { error: message }, timestamp: new Date().toISOString() });
      }
    } else {
      messages.push({ role: "assistant", content: response.content });
      continue;
    }

    messages.push({ role: "assistant", content: response.content });
    messages.push({
      role: "user",
      content: [{ type: "tool_result", tool_use_id: toolUseId, content: JSON.stringify(result), is_error: isToolError }],
    });
  }

  return "I wasn't able to finish this within the expected number of steps — flagging for review.";
}

export async function handleEvent(event: InboundEvent): Promise<{ agentId: AgentId; response: string }> {
  const agentId = await route(event);
  const response = await runSpecialist(agentId, event);
  return { agentId, response };
}

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
