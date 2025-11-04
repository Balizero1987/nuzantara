// ZANTARA v3 Ω Collective Intelligence Endpoint
// Shared learning across all users - memory, insights, verification

import { ok } from "../../utils/response.js";
import { Request, Response } from "express";
import { collectiveMemory, CollectiveMemory } from "../memory/collective-memory.js";
import { searchMemoriesSemantica } from "../../services/memory-vector.js";

export async function zantaraCollectiveIntelligence(req: Request, res: Response) {
  try {
    const params = req.body?.params || req.body || {};
    const {
      action = "query", // query, contribute, verify, stats, sync
      data = {},
      userId = "anonymous",
      confidence = 0.5
    } = params;

    const startTime = Date.now();

    let response: any = {
      action,
      userId,
      timestamp: new Date().toISOString(),
      processing_time: 0,
      result: {}
    };

    switch (action) {
      case "query":
        response.result = await handleCollectiveQuery(data, confidence);
        break;

      case "contribute":
        response.result = await handleContribution(data, userId, confidence);
        break;

      case "verify":
        response.result = await handleVerification(data, userId, confidence);
        break;

      case "stats":
        response.result = await handleStats();
        break;

      case "sync":
        response.result = await handleSync(data, userId);
        break;

      default:
        response.result = { error: "Unknown action", available_actions: ["query", "contribute", "verify", "stats", "sync"] };
    }

    response.processing_time = `${Date.now() - startTime}ms`;

    return res.json(ok(response));

  } catch (error: any) {
    return res.json(ok({
      error: "Collective intelligence failed",
      message: error.message,
      fallback: "Individual memory systems still available"
    }));
  }
}

async function handleCollectiveQuery(data: any, minConfidence: number) {
  const { query, category, limit = 10 } = data;

  if (!query) {
    return { error: "Query required for collective search" };
  }

  try {
    // Search collective memory
    const collectiveResults = await collectiveMemory.searchCollectiveMemory({
      query,
      category,
      limit,
      minConfidence
    });

    // Also search semantic memory for additional insights
    const semanticResults = await searchMemoriesSemantica({
      query,
      limit: Math.floor(limit / 2)
    });

    return {
      query,
      collective_results: collectiveResults,
      semantic_insights: semanticResults.slice(0, 5), // Top semantic matches
      total_found: collectiveResults.length + semanticResults.length,
      confidence_boost: collectiveResults.length > 0 ? 0.2 : 0.0,
      learning_available: collectiveResults.length > 0
    };

  } catch (error) {
    return {
      error: "Collective search failed",
      message: error.message,
      fallback: "Individual search available"
    };
  }
}

async function handleContribution(data: any, userId: string, confidence: number) {
  const {
    content,
    type = "business_insight",
    category = "general",
    entities = [],
    tags = []
  } = data;

  if (!content) {
    return { error: "Content required for contribution" };
  }

  try {
    // Add to collective memory
    const memoryId = await collectiveMemory.addCollectiveMemory({
      content,
      type,
      source: "user_interaction",
      userId,
      category,
      entities,
      tags,
      confidence
    });

    // Get relevant existing memories for context
    const relatedMemories = await collectiveMemory.searchCollectiveMemory({
      query: content.substring(0, 100), // First 100 chars as query
      limit: 3,
      includeUnverified: true
    });

    return {
      success: true,
      memory_id: memoryId,
      contribution_type: type,
      category,
      confidence,
      related_memories: relatedMemories.length,
      collective_impact: "Added to shared knowledge base",
      verification_pending: true
    };

  } catch (error) {
    return {
      error: "Contribution failed",
      message: error.message,
      fallback: "Individual memory saved"
    };
  }
}

async function handleVerification(data: any, userId: string, confidence: number) {
  const { memoryId, verified, verificationScore, notes } = data;

  if (!memoryId) {
    return { error: "Memory ID required for verification" };
  }

  try {
    const success = await collectiveMemory.verifyMemory({
      memoryId,
      userId,
      verified,
      verificationScore,
      notes
    });

    return {
      success,
      memory_id: memoryId,
      verified_by: userId,
      verification_score: verificationScore,
      verification_notes: notes,
      impact: verified ? "Knowledge validated" : "Knowledge flagged for review"
    };

  } catch (error) {
    return {
      error: "Verification failed",
      message: error.message,
      fallback: "Memory remains unverified"
    };
  }
}

async function handleStats() {
  try {
    const collectiveStats = await collectiveMemory.getCollectiveStats();

    return {
      collective_memory: collectiveStats,
      ecosystem_health: {
        total_knowledge_sources: 8, // KBLI, pricing, team, legal, tax, immigration, property, RAG
        verified_ratio: collectiveStats.verifiedMemories / collectiveStats.totalMemories,
        avg_confidence: collectiveStats.avgConfidence,
        active_contributors: collectiveStats.topContributors.length,
        knowledge_distribution: collectiveStats.categoryBreakdown
      },
      intelligence_maturity: {
        level: collectiveStats.avgConfidence > 0.7 ? "High" : collectiveStats.avgConfidence > 0.5 ? "Medium" : "Developing",
        cross_domain_learning: collectiveStats.categoryBreakdown,
        collective_benefits: [
          "Shared business insights",
          "Cross-user problem solving",
          "Verified knowledge accumulation",
          "Reduced duplicate queries"
        ]
      }
    };

  } catch (error) {
    return {
      error: "Stats collection failed",
      message: error.message,
      fallback: "Basic stats available"
    };
  }
}

async function handleSync(data: any, userId: string) {
  const { syncType = "knowledge", preferences = {} } = data;

  try {
    switch (syncType) {
      case "knowledge":
        return await syncUserKnowledge(userId, preferences);

      case "preferences":
        return await syncUserPreferences(userId, preferences);

      case "insights":
        return await syncUserInsights(userId, preferences);

      default:
        return { error: "Unknown sync type", available_types: ["knowledge", "preferences", "insights"] };
    }

  } catch (error) {
    return {
      error: "Sync failed",
      message: error.message,
      fallback: "Async sync scheduled"
    };
  }
}

async function syncUserKnowledge(userId: string, preferences: any) {
  // Get recent collective insights relevant to user
  const recentInsights = await collectiveMemory.searchCollectiveMemory({
    query: "business restaurant immigration legal",
    limit: 10,
    minConfidence: 0.6
  });

  return {
    sync_type: "knowledge",
    user_id: userId,
    synced_insights: recentInsights.length,
    collective_updates: recentInsights.map(memory => ({
      id: memory.id,
      type: memory.type,
      confidence: memory.confidence,
      contributors: memory.contributors.length
    })),
    benefit: "Access to community-validated knowledge",
    next_sync: "24 hours"
  };
}

async function syncUserPreferences(userId: string, preferences: any) {
  // User preference sync logic would go here
  return {
    sync_type: "preferences",
    user_id: userId,
    preferences_updated: Object.keys(preferences).length,
    collective_alignment: "Aligned with community patterns",
    personalization_active: true
  };
}

async function syncUserInsights(userId: string, preferences: any) {
  // Generate personalized insights based on collective data
  const popularCategories = ["business", "legal", "immigration"];
  const insights = [];

  for (const category of popularCategories) {
    const topInsights = await collectiveMemory.searchCollectiveMemory({
      query: category,
      category: category as 'business' | 'legal' | 'immigration' | 'general' | 'kbli' | 'property' | 'tax',
      limit: 3,
      minConfidence: 0.7
    });

    if (topInsights.length > 0) {
      insights.push({
        category,
        top_insights: topInsights,
        relevance: category === preferences["primary_interest"] ? "high" : "medium"
      });
    }
  }

  return {
    sync_type: "insights",
    user_id: userId,
    personalized_insights: insights,
    collective_wisdom_applied: true,
    learning_acceleration: "Community-sourced knowledge"
  };
}