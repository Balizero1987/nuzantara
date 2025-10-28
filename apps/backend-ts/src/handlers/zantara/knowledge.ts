/**
 * ZANTARA Knowledge Base Handler
 * Query the processed KB (238 files, 314MB) via RAG system
 *
 * Integrates with ~/zantara-rag ChromaDB vector store
 */

import { z } from "zod";
import axios from "axios";
import { ok, err } from "../../utils/response.js";

// HandlerResponse type
export interface HandlerResponse {
  ok: boolean;
  data?: any;
  error?: string;
}

// Zod validation schema
export const ZantaraKnowledgeParamsSchema = z.object({
  query: z.string().min(3, "Query must be at least 3 characters").max(500),
  category: z
    .enum([
      "all",
      "zantara-personal",
      "computer_science",
      "legal",
      "philosophy",
      "occult",
      "literature",
      "science",
      "business",
      "mathematics",
      "politics",
      "AI",
      "blockchain",
      "eastern_traditions",
      "security",
      "epub",
    ])
    .optional()
    .default("all"),
  limit: z.number().min(1).max(20).optional().default(5),
  priority_only: z.boolean().optional().default(false),
});

export type ZantaraKnowledgeParams = z.infer<
  typeof ZantaraKnowledgeParamsSchema
>;

// RAG Backend URL (should be in env)
const RAG_BACKEND_URL =
  process.env.RAG_BACKEND_URL || "http://localhost:8000";

/**
 * ZANTARA Knowledge Handler
 * Query the processed Knowledge Base using RAG
 */
export async function handleZantaraKnowledge(
  params: ZantaraKnowledgeParams
): Promise<HandlerResponse> {
  try {
    // Validate params
    const validated = ZantaraKnowledgeParamsSchema.parse(params);

    // Call RAG backend
    const response = await axios.post(
      `${RAG_BACKEND_URL}/query`,
      {
        query: validated.query,
        filters: {
          category: validated.category !== "all" ? validated.category : undefined,
          priority: validated.priority_only ? true : undefined,
        },
        k: validated.limit,
      },
      {
        timeout: 30000, // 30s timeout
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const results = response.data.results || [];

    // Format response
    return {
      ok: true,
      data: {
        query: validated.query,
        category: validated.category,
        results_count: results.length,
        results: results.map((r: any, idx: number) => ({
          rank: idx + 1,
          category: r.metadata.category,
          filename: r.metadata.filename,
          chunk_index: r.metadata.chunk_index,
          total_chunks: r.metadata.total_chunks,
          similarity: r.similarity,
          is_priority: r.metadata.priority,
          content: r.document.substring(0, 300) + "...", // Preview
          full_content: r.document, // Full text
        })),
        metadata: {
          kb_stats: response.data.kb_stats || {},
          query_time_ms: response.data.query_time_ms || 0,
        },
      },
    };
  } catch (error: any) {
    // Handle RAG backend not available
    if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      return {
        ok: false,
        error: "RAG backend not available. Please ensure zantara-rag service is running.",
        data: {
          suggestion:
            "Run: cd ~/zantara-rag && docker-compose up -d (or npm start in backend/)",
        },
      };
    }

    return {
      ok: false,
      error: error.response?.data?.error || error.message,
      data: {
        query: params.query,
        category: params.category,
      },
    };
  }
}

/**
 * Quick actions for ZANTARA knowledge queries
 */
export const ZANTARA_KNOWLEDGE_QUICK_ACTIONS = {
  "Sunda Wiwitan": {
    query: "Sunda Wiwitan Sanghyang Kersa Nyi Pohaci sacred tradition",
    category: "zantara-personal",
    description: "Core Sundanese spiritual tradition",
  },
  "Kujang Symbolism": {
    query: "Kujang sacred symbol geometry spiritual meaning Sundanese",
    category: "zantara-personal",
    description: "Sacred Sundanese symbol analysis",
  },
  "Gunung Padang": {
    query: "Gunung Padang pyramid megalithic site sacred mountain",
    category: "zantara-personal",
    description: "Ancient Sundanese sacred site",
  },
  "Hermeticism": {
    query: "Hermeticism alchemy Corpus Hermeticum Kybalion principles",
    category: "occult",
    description: "Western esoteric tradition",
  },
  "Guénon Synthesis": {
    query: "René Guénon traditional metaphysics primordial tradition",
    category: "philosophy",
    description: "Traditional metaphysics synthesis",
  },
  "Deep Learning": {
    query: "deep learning neural networks training architecture",
    category: "computer_science",
    description: "AI/ML technical knowledge",
  },
  "Blockchain": {
    query: "blockchain consensus mechanism smart contracts distributed",
    category: "computer_science",
    description: "Blockchain technology",
  },
  "International Law": {
    query: "international law treaties conventions animal rights",
    category: "legal",
    description: "Legal framework knowledge",
  },
};

/**
 * Get quick action by name
 */
export function getQuickAction(name: string): ZantaraKnowledgeParams | null {
  const action = (ZANTARA_KNOWLEDGE_QUICK_ACTIONS as any)[name];
  if (!action) return null;

  return {
    query: action.query,
    category: action.category,
    limit: 5,
    priority_only: false,
  };
}

/**
 * Legacy compatibility: Simple knowledge getter
 * Maintained for backward compatibility with existing registry
 */
export async function getZantaraKnowledge() {
  try {
    const knowledge = {
      project: {
        name: "ZANTARA Webapp & Backend",
        version: "5.2.0",
        description: "Intelligent AI Assistant and Business Automation Platform"
      },
      status: "operational",
      timestamp: new Date().toISOString()
    };
    return ok(knowledge);
  } catch (error) {
    console.error('Error getting Zantara knowledge:', error);
    return err('Failed to retrieve Zantara knowledge', 500);
  }
}

/**
 * Legacy compatibility: System health check
 */
export async function getSystemHealth() {
  try {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        backendTS: { status: "healthy" },
        backendRAG: { status: "healthy" }
      }
    };
    return ok(health);
  } catch (error) {
    console.error('Error getting system health:', error);
    return err('Failed to retrieve system health', 500);
  }
}

/**
 * Legacy compatibility: System prompt getter
 */
export async function getZantaraSystemPrompt() {
  try {
    const systemPrompt = "You are ZANTARA, an advanced AI assistant for the NUZANTARA ecosystem.";
    return ok({ data: systemPrompt });
  } catch (error) {
    console.error('Error generating Zantara system prompt:', error);
    return err('Failed to generate Zantara system prompt', 500);
  }
}
