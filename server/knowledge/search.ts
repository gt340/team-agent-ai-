// Knowledge layer (ARCHITECTURE.md §3). Two responsibilities live here:
// ingestion (keeping the vector index in sync with Drive/Notion/uploads)
// and retrieval (what the search_knowledge_base tool actually calls).
//
// This file sketches the interface; swap the TODOs for a real embedding
// model call and vector store client (pgvector, or a managed vector DB).

export interface KnowledgeChunk {
  id: string;
  text: string;
  sourceUrl: string;
  sourceTitle: string;
  score: number;
}

/**
 * Retrieval used by the search_knowledge_base tool. Embeds the query,
 * runs a nearest-neighbor search scoped to the tenant, and returns chunks
 * with enough source metadata for the agent to cite properly.
 */
export async function searchKnowledgeBase(
  tenantId: string,
  query: string,
  topK = 5
): Promise<KnowledgeChunk[]> {
  // TODO:
  // 1. const embedding = await embed(query)
  // 2. const rows = await vectorStore.query({ tenantId, embedding, topK })
  // 3. map rows to KnowledgeChunk[]
  throw new Error(`searchKnowledgeBase not implemented (tenant=${tenantId}, query="${query}")`);
}

/**
 * Ingestion job — run on a schedule or triggered by a webhook from the
 * source system (Drive change notification, Notion webhook, etc).
 * Docs/Drive/Notion are read through their MCP servers' read-only tools
 * (server/mcp/servers.config.ts), so ingestion respects the same
 * per-tenant OAuth scopes the live agents use.
 */
export async function syncSource(tenantId: string, source: "drive" | "notion" | "uploads") {
  // TODO:
  // 1. list changed/new documents since last sync (store a cursor per tenant+source)
  // 2. fetch full text for each
  // 3. chunk (e.g. ~500 tokens, with overlap) and embed each chunk
  // 4. upsert into the vector store keyed by (tenantId, chunkId), storing
  //    sourceUrl + sourceTitle + lastSyncedAt for citation and staleness checks
  throw new Error(`syncSource not implemented (tenant=${tenantId}, source=${source})`);
}
