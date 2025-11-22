// Memory System Handlers for ZANTARA v5.2.0
import { ok } from '../../utils/response.js';
import { BadRequestError } from '../../utils/errors.js';

// LEGACY CODE CLEANED: Mock memory store (Firestore removed - use Python memory system in production)
class MemoryStore {
  private store: Map<string, any> = new Map();

  async getMemory(userId: string) {
    if (!userId) return { profile_facts: [], summary: '', counters: {}, updated_at: null };

    const data = this.store.get(userId) || {};
    return {
      profile_facts: data.profile_facts || [],
      summary: data.summary || '',
      counters: data.counters || {},
      updated_at: data.updated_at || null,
    };
  }

  async saveMemory(params: any) {
    const { userId, profile_facts = [], summary = '', counters = {} } = params;
    if (!userId) return;

    // Remove duplicates and limit facts
    const uniq: string[] = [];
    const seen = new Set();
    for (const raw of profile_facts) {
      const s = (raw || '').trim().slice(0, 140);
      if (s && !seen.has(s)) {
        seen.add(s);
        uniq.push(s);
      }
    }

    const now = new Date();
    const data = {
      userId,
      profile_facts: uniq.slice(0, 10), // Limit to 10 facts
      summary: summary.slice(0, 500), // Limit summary
      counters,
      updated_at: now,
    };

    this.store.set(userId, data);
  }
}

const memoryStore = new MemoryStore();

export async function memorySave(params: any) {
  const { userId, data, type = 'general', key, value } = params;

  if (!userId) {
    throw new BadRequestError('userId is required for memory.save');
  }

  // Get existing memory
  const existing = await memoryStore.getMemory(userId);

  // Create new fact entry with improved data handling
  const timestamp = new Date().toISOString();
  let fact: string;

  // Handle different data formats
  if (key && value !== undefined) {
    // Key-value pair format: key="visa_type", value="EXAMPLE_VISA_CODE"
    fact = `${key}: ${value}`;
  } else if (data && typeof data === 'object') {
    // Object format: data={visa_type: "EXAMPLE_VISA_CODE", preference: "WhatsApp"}
    const entries = Object.entries(data)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    fact = entries || JSON.stringify(data);
  } else if (data !== undefined) {
    // String or primitive format
    fact = String(data);
  } else {
    throw new BadRequestError('Either data, or key+value must be provided');
  }

  const newFact = `[${timestamp.split('T')[0]}] ${type}: ${fact}`;

  // Save updated memory
  await memoryStore.saveMemory({
    userId,
    profile_facts: [...(existing.profile_facts || []), newFact],
    summary: existing.summary || `Memory for ${userId}`,
    counters: {
      ...(existing.counters || {}),
      saves: (existing.counters?.saves || 0) + 1,
    },
  });

  return ok({
    message: 'Memory saved successfully',
    userId,
    type,
    timestamp: timestamp.split('T')[0],
    saved_fact: fact,
  });
}

export async function memorySearch(params: any) {
  const { userId, query = '', limit = 10 } = params;

  if (!userId) {
    throw new BadRequestError('userId is required for memory.search');
  }

  // Get user memory
  const memory = await memoryStore.getMemory(userId);

  // Simple text search in profile facts
  const facts = memory.profile_facts || [];
  const results = query
    ? facts
        .filter((fact: string) => fact.toLowerCase().includes(query.toLowerCase()))
        .slice(0, limit)
    : facts.slice(0, limit);

  return ok({
    userId,
    query,
    results,
    total: results.length,
    hasMore: facts.length > limit,
  });
}

export async function memoryRetrieve(params: any) {
  const { userId } = params;

  if (!userId) {
    throw new BadRequestError('userId is required for memory.retrieve');
  }

  // Get complete user memory
  const memory = await memoryStore.getMemory(userId);

  return ok({
    userId,
    memory: {
      facts: memory.profile_facts || [],
      summary: memory.summary || '',
      counters: memory.counters || {},
      updated_at: memory.updated_at || null,
      total_facts: (memory.profile_facts || []).length,
    },
  });
}
