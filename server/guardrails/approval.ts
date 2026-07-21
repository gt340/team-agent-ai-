// Guardrails (ARCHITECTURE.md §4). A write tool listed in an agent's
// `requiresApproval` never executes immediately — it's queued here, and
// the orchestrator returns a "pending approval" result to Claude instead
// of the real tool output. A human (or an auto-approve rule the tenant
// configured) resolves it, and only then does the underlying tool run.

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalRequest {
  id: string;
  tenantId: string;
  agentId: string;
  toolName: string;
  input: unknown;
  reasoning: string; // Claude's stated reason for wanting to take the action
  status: ApprovalStatus;
  idempotencyKey: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// TODO: back this with real persistence (a table, not memory) — a
// pending approval must survive a process restart.
const queue = new Map<string, ApprovalRequest>();

export async function requestApproval(params: {
  tenantId: string;
  agentId: string;
  toolName: string;
  input: unknown;
  reasoning: string;
}): Promise<ApprovalRequest> {
  const id = crypto.randomUUID();
  const request: ApprovalRequest = {
    id,
    idempotencyKey: crypto.randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
    ...params,
  };
  queue.set(id, request);

  // TODO: notify a human — Slack DM, dashboard badge, email — with enough
  // context (tenant, agent, tool, input, reasoning) to decide quickly.

  return request;
}

export async function resolveApproval(
  id: string,
  decision: "approved" | "rejected",
  resolvedBy: string
): Promise<ApprovalRequest> {
  const request = queue.get(id);
  if (!request) throw new Error(`Unknown approval request: ${id}`);
  request.status = decision;
  request.resolvedAt = new Date().toISOString();
  request.resolvedBy = resolvedBy;
  return request;
}

export async function getApproval(id: string): Promise<ApprovalRequest | undefined> {
  return queue.get(id);
}

/**
 * Auto-approval rules, configured per tenant during "Set the guardrails"
 * onboarding. Keep this allowlist narrow and reversible-actions-only —
 * e.g. an internal Slack post can auto-approve; a refund or a merge
 * should not.
 */
export function isAutoApproved(tenantId: string, toolName: string): boolean {
  // TODO: look up the tenant's configured auto-approve list.
  const AUTO_APPROVE_DEFAULTS = new Set<string>([]); // empty by default — opt-in only
  return AUTO_APPROVE_DEFAULTS.has(toolName);
}
