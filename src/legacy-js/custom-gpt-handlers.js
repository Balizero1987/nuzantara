// Custom GPT Handlers - Memory System Implementation
import { getMemory, saveMemory } from './memory.js';

export const customGptHandlers = {
  // Memory System Handlers
  'memory.save': async (params) => {
    const { userId, data, type = 'general', metadata = {} } = params;

    if (!userId) {
      throw new Error('userId is required for memory.save');
    }

    // Get existing memory
    const existing = await getMemory(userId);

    // Create new fact entry
    const timestamp = new Date().toISOString();
    const fact = typeof data === 'string' ? data : JSON.stringify(data);
    const newFact = `[${timestamp.split('T')[0]}] ${type}: ${fact}`;

    // Save updated memory
    await saveMemory({
      userId,
      profile_facts: [...(existing.profile_facts || []), newFact],
      summary: existing.summary || `Memory for ${userId}`,
      counters: {
        ...(existing.counters || {}),
        saves: ((existing.counters?.saves || 0) + 1)
      },
      tenant: 'zantara'
    });

    return {
      ok: true,
      message: 'Memory saved successfully',
      userId,
      type,
      timestamp
    };
  },

  'memory.search': async (params) => {
    const { userId, query = '', limit = 10 } = params;

    if (!userId) {
      throw new Error('userId is required for memory.search');
    }

    // Get user memory
    const memory = await getMemory(userId);

    // Simple text search in profile facts
    const facts = memory.profile_facts || [];
    const results = query
      ? facts.filter(fact => fact.toLowerCase().includes(query.toLowerCase())).slice(0, limit)
      : facts.slice(0, limit);

    return {
      ok: true,
      userId,
      query,
      results,
      total: results.length,
      hasMore: facts.length > limit
    };
  },

  'memory.retrieve': async (params) => {
    const { userId } = params;

    if (!userId) {
      throw new Error('userId is required for memory.retrieve');
    }

    // Get complete user memory
    const memory = await getMemory(userId);

    return {
      ok: true,
      userId,
      memory: {
        facts: memory.profile_facts || [],
        summary: memory.summary || '',
        counters: memory.counters || {},
        updated_at: memory.updated_at || null,
        total_facts: (memory.profile_facts || []).length
      }
    };
  }
};

// Export in both CommonJS format for backwards compatibility
export const handlers = customGptHandlers;
export default customGptHandlers;