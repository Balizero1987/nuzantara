// Memory System Handlers with Firestore for ZANTARA v5.2.0
import { ok } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";
import { getFirestore } from "../../services/firebase.js";
import { storeMemoryVector, searchMemoriesSemantica } from "../../services/memory-vector.js";

// Known entities database (people, projects, skills, companies)
const KNOWN_ENTITIES = {
  people: ['zero', 'antonello', 'zainal', 'ruslana', 'amanda', 'anton', 'krisna', 'dea', 'adit', 'vino', 'ari', 'surya', 'damar', 'veronika', 'angel', 'kadek', 'dewaayu', 'faisha', 'sahira', 'nina', 'rina', 'marta', 'olena'],
  projects: ['zantara', 'nuzantara', 'google_workspace', 'rag', 'chromadb', 'pricing', 'pt_pma', 'kitas', 'kitap', 'visa', 'tax'],
  skills: ['typescript', 'python', 'tax', 'pph', 'ppn', 'kitas', 'e28a', 'e23', 'e33', 'pt_pma', 'bkpm', 'legal', 'compliance', 'cloud_run', 'firestore', 'ai'],
  companies: ['bali_zero', 'balizero']
};

/**
 * Extract entities (people, projects, skills) from text
 * Simple pattern matching - can be enhanced with NER later
 */
function extractEntities(text: string, contextUserId?: string): string[] {
  const entities: string[] = [];
  const lowerText = text.toLowerCase();

  // Extract known entities
  for (const [category, items] of Object.entries(KNOWN_ENTITIES)) {
    for (const entity of items) {
      if (lowerText.includes(entity.toLowerCase())) {
        entities.push(`${category}:${entity}`);
      }
    }
  }

  // Add context user if not already included
  if (contextUserId && !entities.some(e => e.includes(contextUserId))) {
    entities.push(`people:${contextUserId}`);
  }

  return Array.from(new Set(entities)); // Deduplicate
}

/**
 * Calculate recency weight for memory ranking
 * Recent memories get higher scores (exponential decay)
 */
function calculateRecencyWeight(timestamp: Date | null): number {
  if (!timestamp) return 0.1; // Old memories with no timestamp get low weight

  const now = new Date();
  const ageInDays = (now.getTime() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24);

  // Exponential decay: weight = e^(-age/30)
  // 0 days ago = 1.0, 30 days ago = 0.37, 90 days ago = 0.05
  return Math.exp(-ageInDays / 30);
}

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
    if (!userId) return { profile_facts: [], summary: "", counters: {}, entities: [], updated_at: null };

    try {
      if (this.db) {
        const doc = await this.db.collection('memories').doc(userId).get();
        if (doc.exists) {
          const data = doc.data();
          return {
            profile_facts: data?.profile_facts || [],
            summary: data?.summary || "",
            counters: data?.counters || {},
            entities: data?.entities || [],
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
      entities: data.entities || [],
      updated_at: data.updated_at || null,
    };
  }

  async saveMemory(params: any) {
    const { userId, profile_facts = [], summary = "", counters = {}, entities = [] } = params;
    if (!userId) return;

    // Remove duplicates only (NO LIMIT - ZANTARA must remember everything)
    const uniq: string[] = [];
    const seen = new Set();
    for (const raw of profile_facts) {
      const s = (raw || "").trim(); // No character limit - full context preserved
      if (s && !seen.has(s)) {
        seen.add(s);
        uniq.push(s);
      }
    }

    const now = new Date();
    const data = {
      userId,
      profile_facts: uniq, // NO LIMIT - Unlimited memory for Bali Zero consciousness
      summary: summary,    // NO LIMIT - Full summary preserved
      entities: Array.from(new Set(entities)), // Unique entities extracted from facts
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
            const recencyWeight = calculateRecencyWeight(data.updated_at);
            const relevance = matchingFacts.length;

            memories.push({
              userId: data.userId,
              matchingFacts,
              summary: data.summary,
              updated_at: data.updated_at,
              recencyWeight,
              relevance,
              score: relevance * recencyWeight // Combined score
            });
          }
        });

        // Sort by score (relevance × recency)
        memories.sort((a, b) => b.score - a.score);

        return memories;
      }
    } catch (error: any) {
      console.log('⚠️ Firestore search error, using fallback:', error?.message);
    }

    // Fallback to in-memory search
    for (const [id, data] of Array.from(this.fallbackStore.entries())) {
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

  // Extract entities from fact (people, projects, skills)
  const entities = extractEntities(fact, userId);

  const newFact = `[${timestamp.split('T')[0]}] ${type}: ${fact}`;

  // Save updated memory with entities
  await memoryStore.saveMemory({
    userId,
    profile_facts: [...(existing.profile_facts || []), newFact],
    summary: existing.summary || `Memory for ${userId}`,
    entities: Array.from(new Set([...(existing.entities || []), ...entities])), // Merge unique entities
    counters: {
      ...(existing.counters || {}),
      saves: ((existing.counters?.saves || 0) + 1)
    }
  });

  // Phase 2: Store in vector database for semantic search (async, non-blocking)
  const memoryId = `mem_${Date.now()}`;
  storeMemoryVector({
    memoryId,
    userId,
    content: fact,
    type,
    timestamp: timestamp.split('T')[0],
    entities
  }).catch(err => {
    console.log('⚠️ Vector storage failed (non-blocking):', err?.message);
  });

  return ok({
    memoryId,
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

  // Helper: infer preferred language/tone by known collaborator id
  function inferPrefsForUser(uid: string | undefined): { lang?: string; tone?: string; dialect?: string; cultural?: string } {
    if (!uid) return {};
    const base = uid!.toLowerCase().split('@')[0].replace(/[^a-z0-9]/g, '');
    const map: Record<string, { lang?: string; tone?: string; dialect?: string; cultural?: string }> = {
      zero: { lang: 'it', tone: 'napoletano_caloroso', cultural: 'cita_toto_spesso' },
      ari: { lang: 'su' },
      faisha: { lang: 'su' },
      amanda: { lang: 'jv' },
      dea: { lang: 'jv' },
      sahira: { lang: 'jv' },
      damar: { lang: 'jv' },
      surya: { lang: 'jv' },
      angel: { lang: 'jv' },
      vino: { lang: 'jv' },
      krisna: { lang: 'ban' },
      kadek: { lang: 'ban' },
      dewaayu: { lang: 'ban' },
      adit: { lang: 'ban' },
      veronika: { lang: 'id', dialect: 'jaksel' }
    };
    return map[base] || {};
  }

  // Ensure default language preference if not set (per-user mapping, else 'id')
  try {
    const facts: string[] = memory.profile_facts || [];
    const hasLangPref = facts.some((f: string) => /language_pref\s*:/i.test(f) || /prefers\s+.*language/i.test(f));
    const prefs = inferPrefsForUser(targetUserId);
    const desiredLang = prefs.lang || 'id';
    if (!hasLangPref && targetUserId) {
      await memorySave({ userId: targetUserId, type: 'preference', key: 'language_pref', value: desiredLang, metadata: { source: 'auto-default' } });
      if (prefs.tone) {
        await memorySave({ userId: targetUserId, type: 'preference', key: 'tone_pref', value: prefs.tone, metadata: { source: 'auto-default' } });
      }
      if (prefs.dialect) {
        await memorySave({ userId: targetUserId, type: 'preference', key: 'dialect_pref', value: prefs.dialect, metadata: { source: 'auto-default' } });
      }
      if (prefs.cultural) {
        await memorySave({ userId: targetUserId, type: 'preference', key: 'cultural_pref', value: prefs.cultural, metadata: { source: 'auto-default' } });
      }
    }
  } catch (e) {
    console.log('⚠️ Could not enforce default language_pref=id:', (e as any)?.message);
  }

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
    entities: memory.entities || [],
    counters: memory.counters || {},
    updated_at: memory.updated_at || null,
    total_facts: (memory.profile_facts || []).length
  });
}

/**
 * NEW: Search memories by entity (person, project, skill)
 * Example: {"entity": "zero"} finds all memories mentioning Zero
 */
export async function memorySearchByEntity(params: any) {
  const { entity, category, limit = 20 } = params;

  if (!entity) {
    throw new BadRequestError('entity is required for memory.search.entity');
  }

  const entityPattern = category ? `${category}:${entity}` : entity;
  const memories: any[] = [];

  try {
    const db = memoryStore['db'];
    if (db) {
      const snapshot = await db.collection('memories')
        .where('entities', 'array-contains', entityPattern)
        .limit(limit)
        .get();

      snapshot.forEach(doc => {
        const data = doc.data();
        const recencyWeight = calculateRecencyWeight(data.updated_at);

        memories.push({
          userId: data.userId,
          facts: data.profile_facts || [],
          entities: data.entities || [],
          recencyWeight,
          updated_at: data.updated_at
        });
      });

      // Sort by recency
      memories.sort((a, b) => b.recencyWeight - a.recencyWeight);
    }
  } catch (error: any) {
    console.log('⚠️ Entity search error:', error?.message);
  }

  return ok({
    entity: entityPattern,
    memories,
    count: memories.length,
    message: memories.length > 0
      ? `Found ${memories.length} memories mentioning ${entity}`
      : `No memories found for ${entity}`
  });
}

/**
 * NEW: Get all people/projects/skills related to a user
 */
export async function memoryGetEntities(params: any) {
  const { userId } = params;

  if (!userId) {
    throw new BadRequestError('userId is required for memory.entities');
  }

  const memory = await memoryStore.getMemory(userId);
  const entities = memory.entities || [];

  // Group by category
  const grouped: any = {
    people: [],
    projects: [],
    skills: [],
    companies: []
  };

  for (const entity of entities) {
    const [category, name] = entity.split(':');
    if (grouped[category]) {
      grouped[category].push(name);
    }
  }

  return ok({
    userId,
    entities: grouped,
    total: entities.length,
    raw: entities
  });
}

/**
 * NEW: Get complete entity profile (semantic facts + episodic events)
 * Combines data from /memories/ and /episodes/ collections
 */
export async function memoryEntityInfo(params: any) {
  const { entity, category } = params;

  if (!entity) {
    throw new BadRequestError('entity is required for memory.entity.info');
  }

  const entityPattern = category ? `${category}:${entity}` : entity;

  // Get all memories mentioning this entity (from memorySearchByEntity)
  const memories: any[] = [];
  const db = memoryStore['db'];

  try {
    if (db) {
      // Search memories
      const memSnapshot = await db.collection('memories')
        .where('entities', 'array-contains', entityPattern)
        .limit(20)
        .get();

      memSnapshot.forEach(doc => {
        const data = doc.data();
        memories.push({
          userId: data.userId,
          facts: data.profile_facts || [],
          updated_at: data.updated_at
        });
      });

      // Search episodes (all users)
      const episodes: any[] = [];
      const usersSnapshot = await db.collection('episodes').get();

      for (const userDoc of usersSnapshot.docs) {
        const eventsSnapshot = await userDoc.ref
          .collection('events')
          .where('entities', 'array-contains', entityPattern)
          .orderBy('timestamp', 'desc')
          .limit(20)
          .get();

        eventsSnapshot.forEach(doc => {
          const data = doc.data();
          episodes.push({
            id: data.id,
            userId: data.userId,
            timestamp: data.timestamp,
            event: data.event,
            type: data.type,
            metadata: data.metadata || {}
          });
        });
      }

      // Sort episodes by timestamp
      episodes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return ok({
        entity: entityPattern,
        semantic: {
          memories,
          count: memories.length
        },
        episodic: {
          events: episodes.slice(0, 20),
          count: episodes.length
        },
        total: memories.length + episodes.length,
        message: `Complete profile for ${entity}: ${memories.length} facts, ${episodes.length} events`
      });
    }
  } catch (error: any) {
    console.log('⚠️ Entity info query error:', error?.message);
  }

  return ok({
    entity: entityPattern,
    semantic: { memories: [], count: 0 },
    episodic: { events: [], count: 0 },
    total: 0,
    message: `No data found for ${entity}`
  });
}

/**
 * NEW PHASE 2: Semantic memory search using vector embeddings
 * Searches by meaning, not just keywords (e.g., "chi aiuta con KITAS?" → finds "Krisna specialist visa")
 */
export async function memorySearchSemantic(params: any) {
  const { query, userId, limit = 10 } = params;

  if (!query) {
    throw new BadRequestError('query is required for memory.search.semantic');
  }

  try {
    // Call vector search service (Python RAG backend)
    const results = await searchMemoriesSemantica({ query, userId, limit });

    return ok({
      query,
      results: results.map(r => ({
        userId: r.userId,
        content: r.content,
        type: r.type,
        timestamp: r.timestamp,
        entities: r.entities,
        similarity: r.similarity
      })),
      count: results.length,
      search_type: 'semantic',
      message: results.length > 0
        ? `Found ${results.length} semantically similar memories`
        : 'No similar memories found'
    });
  } catch (error: any) {
    console.log('⚠️ Semantic search error:', error?.message);

    // Fallback to keyword search if vector search fails
    const keywordResults = await memoryStore.searchMemories(query, userId, limit);

    return ok({
      query,
      results: keywordResults.map(m => ({
        userId: m.userId,
        content: m.matchingFacts.join('; ') || m.summary,
        relevance: m.matchingFacts.length,
        updated_at: m.updated_at
      })),
      count: keywordResults.length,
      search_type: 'keyword_fallback',
      message: 'Semantic search unavailable, using keyword fallback'
    });
  }
}

/**
 * NEW PHASE 2: Hybrid search (keyword + semantic)
 * Combines Firestore keyword matching with ChromaDB vector search for best results
 */
export async function memorySearchHybrid(params: any) {
  const { query, userId, limit = 10 } = params;

  if (!query) {
    throw new BadRequestError('query is required for memory.search.hybrid');
  }

  try {
    // Run both searches in parallel
    const [vectorResults, keywordResults] = await Promise.all([
      searchMemoriesSemantica({ query, userId, limit: limit * 2 }).catch(() => []),
      memoryStore.searchMemories(query, userId, limit * 2)
    ]);

    // Combine and deduplicate results using content-based keys
    const combined = new Map();

    // Helper: create content-based key for deduplication
    const makeKey = (content: string, userId: string) => {
      // Normalize: lowercase, remove whitespace/punctuation, take first 100 chars
      const normalized = content.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 100);
      return `${userId}:${normalized}`;
    };

    // Add vector results (weighted 0.7)
    vectorResults.forEach(r => {
      const key = makeKey(r.content, r.userId);
      combined.set(key, {
        id: r.id,
        userId: r.userId,
        content: r.content,
        type: r.type,
        timestamp: r.timestamp,
        entities: r.entities,
        score: r.similarity * 0.7,
        source: 'semantic'
      });
    });

    // Add keyword results (weighted 0.3)
    keywordResults.forEach(m => {
      const content = m.matchingFacts.join('; ') || m.summary;
      const key = makeKey(content, m.userId);

      if (combined.has(key)) {
        // Boost score if found in both
        const existing = combined.get(key);
        existing.score += m.score * 0.3;
        existing.source = 'hybrid';
      } else {
        combined.set(key, {
          userId: m.userId,
          content,
          relevance: m.matchingFacts.length,
          recencyWeight: m.recencyWeight,
          score: m.score * 0.3,
          source: 'keyword'
        });
      }
    });

    // Sort by score and limit
    const sortedResults = Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return ok({
      query,
      results: sortedResults,
      count: sortedResults.length,
      search_type: 'hybrid',
      sources: {
        semantic: vectorResults.length,
        keyword: keywordResults.length,
        combined: sortedResults.length
      },
      message: `Found ${sortedResults.length} results using hybrid search`
    });
  } catch (error: any) {
    console.log('⚠️ Hybrid search error:', error?.message);
    throw new BadRequestError(`Hybrid search failed: ${error?.message}`);
  }
}
