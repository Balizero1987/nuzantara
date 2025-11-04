// Collective Memory System for ZANTARA v3 Ω
// Enables cross-user learning and shared knowledge accumulation

import logger from '../../services/logger.js';
import { storeMemoryVector, searchMemoriesSemantica } from '../../services/memory-vector.js';

// Fallback in-memory store for collective memory
class InMemoryStore {
  private dataStore: Map<string, any> = new Map();

  async getCollection(_name: string, _options?: any): Promise<any[]> {
    // Return all memories as array
    return Array.from(this.dataStore.values());
  }

  async store(_name: string, id: string, data: any): Promise<void> {
    this.dataStore.set(id, data);
  }

  async get(_name: string, id: string): Promise<any> {
    return this.dataStore.get(id);
  }
}

const firestoreStore = new InMemoryStore();

interface CollectiveMemory {
  id: string;
  content: string;
  type:
    | 'business_insight'
    | 'legal_precedent'
    | 'pricing_update'
    | 'process_improvement'
    | 'case_study';
  source: 'user_interaction' | 'team_input' | 'system_learning' | 'external_api';
  contributors: string[];
  userIds: string[]; // Users who contributed this knowledge
  entities: string[];
  verified: boolean;
  verificationScore: number;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  lastUsed: Date;
  tags: string[];
  confidence: number;
  category: 'kbli' | 'immigration' | 'legal' | 'property' | 'tax' | 'business' | 'general';
}

class CollectiveMemoryStore {
  private readonly COLLECTION_NAME = 'collective_memory';
  private readonly _SHARED_COLLECTION_ID = 'zantara_collective';

  /**
   * Add knowledge to collective memory from any user interaction
   */
  async addCollectiveMemory(params: {
    content: string;
    type: CollectiveMemory['type'];
    source: CollectiveMemory['source'];
    userId: string;
    category: CollectiveMemory['category'];
    entities?: string[];
    tags?: string[];
    confidence?: number;
    relatedMemoryId?: string;
  }): Promise<string> {
    const memoryId = `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const collectiveMemory: CollectiveMemory = {
      id: memoryId,
      content: params.content,
      type: params.type,
      source: params.source,
      contributors: [params.userId],
      userIds: [params.userId],
      entities: params.entities || [],
      verified: false,
      verificationScore: 0.5,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      lastUsed: new Date(),
      tags: params.tags || [],
      confidence: params.confidence || 0.5,
      category: params.category,
    };

    try {
      // Store in Firestore for persistence
      await firestoreStore.store(this.COLLECTION_NAME, memoryId, collectiveMemory);

      // Store in vector store for semantic search
      await storeMemoryVector({
        memoryId,
        userId: 'collective', // Special user ID for collective memories
        content: params.content,
        type: `collective_${params.type}`,
        timestamp: collectiveMemory.createdAt.toISOString(),
        entities: params.entities || [],
      });

      logger.info(`🧠 Collective memory added: ${memoryId} by ${params.userId}`);
      return memoryId;
    } catch (error: any) {
      logger.error('❌ Failed to add collective memory:', error);
      throw error;
    }
  }

  /**
   * Search collective knowledge across all users
   */
  async searchCollectiveMemory(params: {
    query: string;
    category?: CollectiveMemory['category'];
    type?: CollectiveMemory['type'];
    limit?: number;
    minConfidence?: number;
    includeUnverified?: boolean;
  }): Promise<CollectiveMemory[]> {
    const {
      query,
      category,
      type,
      limit = 10,
      minConfidence = 0.3,
      includeUnverified = false,
    } = params;

    try {
      // Search vector store for semantic matches
      const vectorResults = await searchMemoriesSemantica({
        query,
        userId: 'collective',
        limit: limit * 2, // Get more to filter
      });

      // Get matching memories from in-memory store
      const memoryIds = vectorResults.map((r) => r.id);
      const allMemories = await firestoreStore.getCollection(this.COLLECTION_NAME);
      const firestoreResults = allMemories.filter((memory: CollectiveMemory) =>
        memoryIds.includes(memory.id)
      );

      // Filter and sort results
      let filteredResults = firestoreResults.filter((memory: CollectiveMemory) => {
        const meetsConfidence = memory.confidence >= minConfidence;
        const meetsVerification = includeUnverified || memory.verified;
        const meetsCategory = !category || memory.category === category;
        const meetsType = !type || memory.type === type;

        return meetsConfidence && meetsVerification && meetsCategory && meetsType;
      });

      // Sort by usage count and verification score
      filteredResults.sort((a: CollectiveMemory, b: CollectiveMemory) => {
        const scoreA = a.usageCount * 0.3 + a.verificationScore * 0.5 + a.confidence * 0.2;
        const scoreB = b.usageCount * 0.3 + b.verificationScore * 0.5 + b.confidence * 0.2;
        return scoreB - scoreA;
      });

      // Update usage count for returned memories
      const results = filteredResults.slice(0, limit);
      await this.updateUsageCounts(results.map((r) => r.id));

      return results;
    } catch (error: any) {
      logger.error('❌ Failed to search collective memory:', error);
      return [];
    }
  }

  /**
   * Contribute to existing collective memory (enhance/correct)
   */
  async contributeToMemory(params: {
    memoryId: string;
    userId: string;
    contribution: string;
    correction?: boolean;
    confidenceBoost?: number;
  }): Promise<boolean> {
    try {
      const memory = (await firestoreStore.get(
        this.COLLECTION_NAME,
        params.memoryId
      )) as CollectiveMemory;

      if (!memory) {
        throw new Error(`Memory ${params.memoryId} not found`);
      }

      // Add contributor if not already present
      if (!memory.contributors.includes(params.userId)) {
        memory.contributors.push(params.userId);
      }
      if (!memory.userIds.includes(params.userId)) {
        memory.userIds.push(params.userId);
      }

      // Update content if correction
      if (params.correction && params.contribution) {
        memory.content = params.contribution;
        memory.verified = false; // Reset verification on correction
        memory.verificationScore *= 0.8; // Reduce confidence on correction
      }

      // Update timestamps and usage
      memory.updatedAt = new Date();
      memory.lastUsed = new Date();
      memory.usageCount += 1;

      // Apply confidence boost
      if (params.confidenceBoost) {
        memory.confidence = Math.min(1.0, memory.confidence + params.confidenceBoost);
      }

      // Save updated memory
      await firestoreStore.store(this.COLLECTION_NAME, params.memoryId, memory);

      // Update vector store if content changed
      if (params.correction && params.contribution) {
        await storeMemoryVector({
          memoryId: params.memoryId,
          userId: 'collective',
          content: memory.content,
          type: `collective_${memory.type}`,
          timestamp: memory.updatedAt.toISOString(),
          entities: memory.entities,
        });
      }

      logger.info(`🔄 Memory ${params.memoryId} updated by ${params.userId}`);
      return true;
    } catch (error: any) {
      logger.error('❌ Failed to contribute to memory:', error);
      return false;
    }
  }

  /**
   * Verify collective memory (team member verification)
   */
  async verifyMemory(params: {
    memoryId: string;
    userId: string;
    verified: boolean;
    verificationScore?: number;
    notes?: string;
  }): Promise<boolean> {
    try {
      const memory = (await firestoreStore.get(
        this.COLLECTION_NAME,
        params.memoryId
      )) as CollectiveMemory;

      if (!memory) {
        throw new Error(`Memory ${params.memoryId} not found`);
      }

      memory.verified = params.verified;
      if (params.verificationScore) {
        memory.verificationScore = params.verificationScore;
      }

      // Add verification notes to content
      if (params.notes) {
        memory.content += `\n\n[Verification by ${params.userId} on ${new Date().toISOString()}]: ${params.notes}`;
      }

      memory.updatedAt = new Date();

      await firestoreStore.store(this.COLLECTION_NAME, params.memoryId, memory);

      const status = params.verified ? '✅ VERIFIED' : '❌ REJECTED';
      logger.info(`${status} Memory ${params.memoryId} by ${params.userId}`);
      return true;
    } catch (error: any) {
      logger.error('❌ Failed to verify memory:', error);
      return false;
    }
  }

  /**
   * Get collective memory statistics
   */
  async getCollectiveStats(): Promise<{
    totalMemories: number;
    verifiedMemories: number;
    categoryBreakdown: Record<string, number>;
    topContributors: Array<{ userId: string; contributions: number }>;
    avgConfidence: number;
  }> {
    try {
      const allMemories = (await firestoreStore.getCollection(
        this.COLLECTION_NAME
      )) as CollectiveMemory[];

      const stats = {
        totalMemories: allMemories.length,
        verifiedMemories: allMemories.filter((m) => m.verified).length,
        categoryBreakdown: {} as Record<string, number>,
        topContributors: [] as Array<{ userId: string; contributions: number }>,
        avgConfidence: 0,
      };

      // Category breakdown
      allMemories.forEach((memory) => {
        stats.categoryBreakdown[memory.category] =
          (stats.categoryBreakdown[memory.category] || 0) + 1;
      });

      // Top contributors
      const contributorCounts: Record<string, number> = {};
      allMemories.forEach((memory) => {
        memory.contributors.forEach((userId) => {
          contributorCounts[userId] = (contributorCounts[userId] || 0) + 1;
        });
      });

      stats.topContributors = Object.entries(contributorCounts)
        .map(([userId, contributions]) => ({ userId, contributions }))
        .sort((a, b) => b.contributions - a.contributions)
        .slice(0, 10);

      // Average confidence
      stats.avgConfidence =
        allMemories.reduce((sum, m) => sum + m.confidence, 0) / allMemories.length;

      return stats;
    } catch (error: any) {
      logger.error('❌ Failed to get collective stats:', error);
      return {
        totalMemories: 0,
        verifiedMemories: 0,
        categoryBreakdown: {},
        topContributors: [],
        avgConfidence: 0,
      };
    }
  }

  private async updateUsageCounts(memoryIds: string[]): Promise<void> {
    for (const memoryId of memoryIds) {
      try {
        const memory = (await firestoreStore.get(
          this.COLLECTION_NAME,
          memoryId
        )) as CollectiveMemory;
        if (memory) {
          memory.usageCount += 1;
          memory.lastUsed = new Date();
          await firestoreStore.store(this.COLLECTION_NAME, memoryId, memory);
        }
      } catch (error) {
        // Continue even if update fails for one memory
        logger.warn(`⚠️ Failed to update usage count for ${memoryId}`);
      }
    }
  }
}

export const collectiveMemory = new CollectiveMemoryStore();
export { CollectiveMemory };
