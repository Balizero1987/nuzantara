import { Firestore } from "@google-cloud/firestore";
import { LRUCache } from 'lru-cache';

const db = new Firestore({
  projectId: process.env.GOOGLE_PROJECT_ID || 'involuted-box-469105-r0'
});
const USERS_COL = "zantara_users";
const SEARCH_INDEX_COL = "zantara_search_index";

// LRU Cache for frequently accessed memories
const memoryCache = new LRUCache<string, any>({
  max: 500, // Cache up to 500 entries
  ttl: 1000 * 60 * 5, // 5 minute TTL
  updateAgeOnGet: true,
  updateAgeOnHas: true,
});

// Cache for search results
const searchCache = new LRUCache<string, any[]>({
  max: 100,
  ttl: 1000 * 60 * 2, // 2 minute TTL for search results
});

export type ZMemory = {
  userId: string;
  tenant?: string;
  profile_facts?: string[];
  summary?: string;
  counters?: Record<string, number>;
  updated_at?: Date | null;
  created_at?: Date | null;
  searchTokens?: string[]; // Pre-computed search tokens
};

function users() { return db.collection(USERS_COL); }
function uref(userId: string) { return users().doc(userId); }
function searchIndex() { return db.collection(SEARCH_INDEX_COL); }

// Tokenize text for better search
function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2);
}

// Build search tokens from memory data
function buildSearchTokens(memory: Partial<ZMemory>): string[] {
  const tokens = new Set<string>();

  // Add fact tokens
  if (memory.profile_facts) {
    memory.profile_facts.forEach(fact => {
      tokenize(fact).forEach(token => tokens.add(token));
    });
  }

  // Add summary tokens
  if (memory.summary) {
    tokenize(memory.summary).forEach(token => tokens.add(token));
  }

  return Array.from(tokens);
}

export async function getMemory(userId: string) {
  if (!userId) return { profile_facts: [], summary: "" };

  // Check cache first
  const cached = memoryCache.get(userId);
  if (cached) return cached;

  const snap = await uref(userId).get();
  if (!snap.exists) return { profile_facts: [], summary: "" };

  const d = (snap.data() || {}) as ZMemory;
  const result = {
    profile_facts: d.profile_facts || [],
    summary: d.summary || "",
    counters: d.counters || {},
    updated_at: (d as any).updated_at || null,
  };

  // Cache the result
  memoryCache.set(userId, result);

  return result;
}

export async function saveMemory(params: {
  userId: string;
  profile_facts?: string[];
  summary?: string;
  tenant?: string;
  counters?: Record<string, number>;
}) {
  const { userId, profile_facts = [], summary = "", tenant, counters } = params;
  if (!userId) return;

  const uniq: string[] = [];
  const seen = new Set<string>();
  for (const raw of profile_facts) {
    const s = (raw || "").trim().slice(0, 140);
    if (s && !seen.has(s)) { seen.add(s); uniq.push(s); }
  }

  const ref = uref(userId);
  const now = new Date();
  const exists = (await ref.get()).exists;

  const data: any = {
    userId,
    updated_at: now,
  };

  if (tenant !== undefined) data.tenant = tenant;
  if (uniq.length > 0) data.profile_facts = uniq.slice(0, 10);
  if (summary) data.summary = summary.slice(0, 500);
  if (counters) data.counters = counters;
  if (!exists) data.created_at = now;

  // Build and save search tokens
  data.searchTokens = buildSearchTokens(data);

  await ref.set(data, { merge: true });

  // Invalidate caches
  memoryCache.delete(userId);
  searchCache.clear(); // Clear all search results since data changed

  // Update search index (for even faster searching)
  await updateSearchIndex(userId, data.searchTokens);
}

async function updateSearchIndex(userId: string, tokens: string[]) {
  const batch = db.batch();

  // Remove old index entries for this user
  const oldIndexes = await searchIndex()
    .where('userId', '==', userId)
    .get();

  oldIndexes.forEach(doc => {
    batch.delete(doc.ref);
  });

  // Add new index entries (batch for performance)
  tokens.forEach(token => {
    const indexRef = searchIndex().doc(`${userId}_${token}`);
    batch.set(indexRef, {
      userId,
      token,
      timestamp: new Date()
    });
  });

  await batch.commit();
}

export async function incrementCounter(userId: string, field: string, by = 1) {
  if (!userId || !field) return;
  const inc = (Firestore as any).FieldValue.increment(by);
  await uref(userId).set({ counters: { [field]: inc } }, { merge: true });

  // Invalidate cache
  memoryCache.delete(userId);
}

export async function searchMemory(query: string, limit = 10) {
  if (!query) return [];

  // Check cache first
  const cacheKey = `${query}_${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  const queryTokens = tokenize(query);
  const results: any[] = [];
  const userScores = new Map<string, number>();

  // Use composite query for better performance
  if (queryTokens.length > 0) {
    // Search using indexed tokens (much faster)
    const indexResults = await searchIndex()
      .where('token', 'in', queryTokens.slice(0, 10)) // Firestore 'in' limit is 10
      .limit(limit * 3) // Get more to account for duplicates
      .get();

    // Score users by number of matching tokens
    indexResults.forEach(doc => {
      const { userId } = doc.data();
      userScores.set(userId, (userScores.get(userId) || 0) + 1);
    });

    // Sort by score and fetch top users
    const topUsers = Array.from(userScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([userId]) => userId);

    // Batch fetch user data (more efficient than individual fetches)
    if (topUsers.length > 0) {
      const userDocs = await db.getAll(
        ...topUsers.map(userId => uref(userId))
      );

      userDocs.forEach(doc => {
        if (doc.exists) {
          const data = doc.data() as ZMemory;
          results.push({
            userId: data.userId,
            facts: data.profile_facts || [],
            summary: data.summary || '',
            updated_at: data.updated_at,
            score: userScores.get(data.userId) || 0
          });
        }
      });
    }
  }

  // Fallback to text search if not enough results
  if (results.length < limit) {
    const snapshot = await users()
      .orderBy('updated_at', 'desc')
      .limit(50)
      .get();

    snapshot.forEach(doc => {
      const data = doc.data() as ZMemory;
      if (!results.find(r => r.userId === data.userId)) {
        const summaryMatch = data.summary?.toLowerCase().includes(query.toLowerCase());
        const factMatch = data.profile_facts?.some(f =>
          f.toLowerCase().includes(query.toLowerCase())
        );

        if (summaryMatch || factMatch) {
          results.push({
            userId: data.userId,
            facts: data.profile_facts || [],
            summary: data.summary || '',
            updated_at: data.updated_at,
            score: summaryMatch ? 2 : 1
          });
        }
      }
    });
  }

  // Sort by score and limit
  const finalResults = results
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, limit);

  // Cache the results
  searchCache.set(cacheKey, finalResults);

  return finalResults;
}

export async function retrieveMemory(key: string) {
  if (!key) return null;

  // Check cache first
  const cached = memoryCache.get(key);
  if (cached) {
    return {
      userId: key,
      ...cached
    };
  }

  // Try to get by userId first
  const memory = await getMemory(key);
  if (memory.profile_facts.length > 0 || memory.summary) {
    const result = {
      userId: key,
      ...memory
    };
    memoryCache.set(key, memory);
    return result;
  }

  // If not found, search by fact
  const results = await searchMemory(key, 1);
  return results[0] || null;
}

export function extractFactsAndSummary(
  input: string,
  reply: string,
  prev: { facts: string[]; summary: string }
) {
  const text = (input || "").toLowerCase();
  const facts = new Set<string>(prev.facts || []);

  const mName = text.match(/\b(mi chiamo|sono)\s+([A-ZÀ-ÖØ-Ý][a-zà-öø-ý']{1,20})(?:\s+[A-ZÀ-ÖØ-Ý][a-zà-öø-ý']{1,20})?/i);
  if (mName) facts.add(`name:${mName[2]}`);

  if (/\binglese\b/.test(text)) facts.add("lang:en");
  if (/\bitalian(o|a)\b|\bitaliano\b/.test(text)) facts.add("lang:it");
  if (/\bbahasa( indonesia)?\b|\bindonesian(o|a)\b/.test(text)) facts.add("lang:id");

  const mDur = text.match(/\bprefer(isc|o)\s+(\d+h?\d*m?)\b/i);
  if (mDur) facts.add(`duration_pref:${mDur[2].toLowerCase()}`);

  const mLoc = text.match(/@([\p{L}\p{N} '._-]{3,60})/u);
  if (mLoc) facts.add(`fav_location:${mLoc[1].trim()}`);

  facts.add("tz:Asia/Makassar");

  const trimmedFacts = Array.from(facts).slice(0, 10);
  const summary = (prev.summary || "").slice(0, 500);

  return { facts: trimmedFacts, summary };
}

// Warm up cache on startup
export async function warmUpCache() {
  console.log('📊 Warming up memory cache...');

  // Load most recently active users into cache
  const recentUsers = await users()
    .orderBy('updated_at', 'desc')
    .limit(20)
    .get();

  let cached = 0;
  recentUsers.forEach(doc => {
    const data = doc.data() as ZMemory;
    memoryCache.set(data.userId, {
      profile_facts: data.profile_facts || [],
      summary: data.summary || "",
      counters: data.counters || {},
      updated_at: data.updated_at
    });
    cached++;
  });

  console.log(`✅ Cached ${cached} recent user memories`);
}

// Export cache stats for monitoring
export function getCacheStats() {
  return {
    memory: {
      size: memoryCache.size,
      calculatedSize: memoryCache.calculatedSize
    },
    search: {
      size: searchCache.size,
      calculatedSize: searchCache.calculatedSize
    }
  };
}