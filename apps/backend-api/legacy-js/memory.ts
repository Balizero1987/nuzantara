import { Firestore } from "@google-cloud/firestore";

const db = new Firestore({
  projectId: process.env.GOOGLE_PROJECT_ID || 'involuted-box-469105-r0'
});
const USERS_COL = "zantara_users";

export type ZMemory = {
  userId: string;
  tenant?: string;
  profile_facts?: string[];
  summary?: string;
  counters?: Record<string, number>;
  updated_at?: Date | null;
  created_at?: Date | null;
};

function users() { return db.collection(USERS_COL); }
function uref(userId: string) { return users().doc(userId); }

export async function getMemory(userId: string) {
  if (!userId) return { profile_facts: [], summary: "" };
  const snap = await uref(userId).get();
  if (!snap.exists) return { profile_facts: [], summary: "" };
  const d = (snap.data() || {}) as ZMemory;
  return {
    profile_facts: d.profile_facts || [],
    summary: d.summary || "",
    counters: d.counters || {},
    updated_at: (d as any).updated_at || null,
  };
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
  
  await ref.set(data, { merge: true });
}

export async function incrementCounter(userId: string, field: string, by = 1) {
  if (!userId || !field) return;
  const inc = (Firestore as any).FieldValue.increment(by);
  await uref(userId).set({ counters: { [field]: inc } }, { merge: true });
}

export async function searchMemory(query: string, limit = 10) {
  if (!query) return [];

  // Search across all users for matching facts or summaries
  const results: any[] = [];
  const snapshot = await users()
    .where('profile_facts', 'array-contains-any', [query.toLowerCase()])
    .limit(limit)
    .get();

  snapshot.forEach(doc => {
    const data = doc.data() as ZMemory;
    results.push({
      userId: data.userId,
      facts: data.profile_facts || [],
      summary: data.summary || '',
      updated_at: data.updated_at
    });
  });

  // Also search in summaries using text search
  if (results.length < limit) {
    const allUsers = await users().limit(100).get();
    allUsers.forEach(doc => {
      const data = doc.data() as ZMemory;
      if (data.summary?.toLowerCase().includes(query.toLowerCase()) &&
          !results.find(r => r.userId === data.userId)) {
        results.push({
          userId: data.userId,
          facts: data.profile_facts || [],
          summary: data.summary || '',
          updated_at: data.updated_at
        });
      }
    });
  }

  return results.slice(0, limit);
}

export async function retrieveMemory(key: string) {
  if (!key) return null;

  // Try to get by userId first
  const memory = await getMemory(key);
  if (memory.profile_facts.length > 0 || memory.summary) {
    return {
      userId: key,
      ...memory
    };
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
