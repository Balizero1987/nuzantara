// Memory System Handlers with Firestore for ZANTARA v5.2.0
import { ok, err } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";
import { getFirestore } from "../../services/firebase.js";

// Firestore memory store implementation
class FirestoreMemoryStore {
  private db: FirebaseFirestore.Firestore | null = null;
  private fallbackStore: Map<string, any> = new Map();

  constructor() {
    try {
      this.db = getFirestore();
      console.log('✅ Firestore memory store initialized');
    } catch (error: any) {
      console.log('⚠️ Firestore not available, using in-memory fallback:', error?.message);
    }
  }

  async getMemory(userId: string) {
    if (!userId) return { profile_facts: [], summary: "", counters: {}, updated_at: null };

    try {
      if (this.db) {
        const doc = await this.db.collection('memories').doc(userId).get();
        if (doc.exists) {
          const data = doc.data();
          return {
            profile_facts: data?.profile_facts || [],
            summary: data?.summary || "",
            counters: data?.counters || {},
            updated_at: data?.updated_at || null,
          };
        }
      }
    } catch (error: any) {
      console.log('⚠️ Firestore read error, using fallback:', error?.message);
    }

    // Fallback to in-memory store
    const data = this.fallbackStore.get(userId) || {};
    return {
      profile_facts: data.profile_facts || [],
      summary: data.summary || "",
      counters: data.counters || {},
      updated_at: data.updated_at || null,
    };
  }

  async saveMemory(params: any) {
    const { userId, profile_facts = [], summary = "", counters = {} } = params;
    if (!userId) return;

    // Remove duplicates and limit facts
    const uniq: string[] = [];
    const seen = new Set();
    for (const raw of profile_facts) {
      const s = (raw || "").trim().slice(0, 140);
      if (s && !seen.has(s)) {
        seen.add(s);
        uniq.push(s);
      }
    }

    const now = new Date();
    const data = {
      userId,
      profile_facts: uniq.slice(0, 10), // Limit to 10 facts
      summary: summary.slice(0, 500),   // Limit summary
      counters,
      updated_at: now,
    };

    try {
      if (this.db) {
        await this.db.collection('memories').doc(userId).set(data, { merge: true });
        console.log(`✅ Memory saved to Firestore for user: ${userId}`);
        return;
      }
    } catch (error: any) {
      console.log('⚠️ Firestore write error, using fallback:', error?.message);
    }

    // Fallback to in-memory store
    this.fallbackStore.set(userId, data);
  }

  async searchMemories(query: string, userId?: string, limit: number = 10) {
    const memories: any[] = [];

    try {
      if (this.db) {
        let queryRef = this.db.collection('memories').limit(limit);

        if (userId) {
          queryRef = queryRef.where('userId', '==', userId) as any;
        }

        const snapshot = await queryRef.get();

        snapshot.forEach(doc => {
          const data = doc.data();
          const facts = data.profile_facts || [];
          const matchingFacts = facts.filter((fact: string) =>
            fact.toLowerCase().includes(query.toLowerCase())
          );

          if (matchingFacts.length > 0 ||
              (data.summary && data.summary.toLowerCase().includes(query.toLowerCase()))) {
            memories.push({
              userId: data.userId,
              matchingFacts,
              summary: data.summary,
              updated_at: data.updated_at
            });
          }
        });

        return memories;
      }
    } catch (error: any) {
      console.log('⚠️ Firestore search error, using fallback:', error?.message);
    }

    // Fallback to in-memory search
    for (const [id, data] of this.fallbackStore.entries()) {
      if (userId && id !== userId) continue;

      const facts = data.profile_facts || [];
      const matchingFacts = facts.filter((fact: string) =>
        fact.toLowerCase().includes(query.toLowerCase())
      );

      if (matchingFacts.length > 0 ||
          (data.summary && data.summary.toLowerCase().includes(query.toLowerCase()))) {
        memories.push({
          userId: id,
          matchingFacts,
          summary: data.summary,
          updated_at: data.updated_at
        });

        if (memories.length >= limit) break;
      }
    }

    return memories;
  }
}

const memoryStore = new FirestoreMemoryStore();

export async function memorySave(params: any) {
  const { userId, data, type = 'general', key, value, content, metadata } = params;

  if (!userId) {
    throw new BadRequestError('userId is required for memory.save');
  }

  // Get existing memory
  const existing = await memoryStore.getMemory(userId);

  // Create new fact entry with improved data handling
  const timestamp = new Date().toISOString();
  let fact: string;

  // Handle different data formats (support both old and new parameters)
  if (content !== undefined) {
    // New format from test suite: content parameter
    fact = String(content);
  } else if (key && value !== undefined) {
    // Key-value pair format: key="visa_type", value="B211A"
    fact = `${key}: ${value}`;
  } else if (data && typeof data === 'object') {
    // Object format: data={visa_type: "B211A", preference: "WhatsApp"}
    const entries = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(', ');
    fact = entries || JSON.stringify(data);
  } else if (data !== undefined) {
    // String or primitive format
    fact = String(data);
  } else {
    throw new BadRequestError('Either content, data, or key+value must be provided');
  }

  const newFact = `[${timestamp.split('T')[0]}] ${type}: ${fact}`;

  // Save updated memory
  await memoryStore.saveMemory({
    userId,
    profile_facts: [...(existing.profile_facts || []), newFact],
    summary: existing.summary || `Memory for ${userId}`,
    counters: {
      ...(existing.counters || {}),
      saves: ((existing.counters?.saves || 0) + 1)
    }
  });

  return ok({
    memoryId: `mem_${Date.now()}`,
    saved: true,
    message: 'Memory saved successfully',
    userId,
    type,
    timestamp: timestamp.split('T')[0],
    saved_fact: fact,
    metadata: metadata || {}
  });
}

export async function memoryRetrieve(params: any) {
  const { userId, key } = params;

  if (!userId && !key) {
    throw new BadRequestError('Either userId or key is required for memory.retrieve');
  }

  // If key is provided, treat it as userId for now (simplified implementation)
  const targetUserId = userId || key;
  const memory = await memoryStore.getMemory(targetUserId);

  // Extract the most recent fact that matches the key if provided
  let content = memory.summary;

  if (key && memory.profile_facts.length > 0) {
    // Find facts that mention the key
    const relevantFacts = memory.profile_facts.filter((fact: string) =>
      fact.toLowerCase().includes(key.toLowerCase())
    );

    if (relevantFacts.length > 0) {
      content = relevantFacts[relevantFacts.length - 1]; // Get most recent matching fact
    }
  } else if (memory.profile_facts.length > 0) {
    // Return the most recent fact
    content = memory.profile_facts[memory.profile_facts.length - 1];
  }

  return ok({
    content: content || "No memory found",
    userId: targetUserId,
    facts_count: memory.profile_facts.length,
    last_updated: memory.updated_at
  });
}

export async function memorySearch(params: any) {
  const { query, userId, limit = 10 } = params;

  if (!query) {
    throw new BadRequestError('query is required for memory.search');
  }

  const memories = await memoryStore.searchMemories(query, userId, limit);

  return ok({
    memories: memories.map(m => ({
      userId: m.userId,
      content: m.matchingFacts.join('; ') || m.summary,
      relevance: m.matchingFacts.length,
      updated_at: m.updated_at
    })),
    count: memories.length,
    query
  });
}

export async function memoryList(params: any) {
  const { userId } = params;

  if (!userId) {
    throw new BadRequestError('userId is required for memory.list');
  }

  const memory = await memoryStore.getMemory(userId);

  return ok({
    userId,
    facts: memory.profile_facts || [],
    summary: memory.summary || '',
    counters: memory.counters || {},
    updated_at: memory.updated_at || null,
    total_facts: (memory.profile_facts || []).length
  });
}