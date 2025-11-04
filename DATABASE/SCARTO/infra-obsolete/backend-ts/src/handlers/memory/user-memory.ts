import { ok } from "../../utils/response.js";
import { BadRequestError, ForbiddenError } from "../../utils/errors.js";

// Simple in-memory store (skeleton). Replace with Firestore as needed.
interface MemoryRecord {
  userId: string;
  profile_facts: string[];
  summary: string;
  counters: Record<string, number>;
  updated_at: string;
}

export interface SaveRequest {
  userId: string;
  profile_facts?: string[];
  summary?: string;
  counters?: Record<string, number>;
}

export interface RetrieveRequest { userId: string }
export interface ListRequest { adminUser: string }
export interface LoginRequest { userId: string }

const store = new Map<string, MemoryRecord>();

function getOrInit(userId: string): MemoryRecord {
  const current = store.get(userId);
  if (current) return current;
  const empty: MemoryRecord = {
    userId,
    profile_facts: [],
    summary: '',
    counters: {},
    updated_at: new Date().toISOString(),
  };
  store.set(userId, empty);
  return empty;
}

export async function userMemorySave(params: SaveRequest) {
  const { userId, profile_facts = [], summary = '', counters = {} } = params || ({} as SaveRequest);
  if (!userId) throw new BadRequestError('userId is required');

  const id = userId.toLowerCase().trim();
  const current = getOrInit(id);
  const mergedFacts = [...current.profile_facts, ...profile_facts];

  const rec: MemoryRecord = {
    userId: id,
    profile_facts: mergedFacts,
    summary: summary || current.summary,
    counters: { ...current.counters, ...counters },
    updated_at: new Date().toISOString(),
  };
  store.set(id, rec);

  return ok({
    userId: id,
    message: `Memory updated for ${id}`,
    facts_count: rec.profile_facts.length,
    counters: rec.counters,
  });
}

export async function userMemoryRetrieve(params: RetrieveRequest) {
  const { userId } = params || ({} as RetrieveRequest);
  if (!userId) throw new BadRequestError('userId is required');
  const id = userId.toLowerCase().trim();
  const rec = getOrInit(id);
  return ok({
    userId: id,
    profile: {
      summary: rec.summary,
      facts: rec.profile_facts,
      counters: rec.counters,
      updated_at: rec.updated_at,
    },
    exists: rec.profile_facts.length > 0,
  });
}

export async function userMemoryList(params: ListRequest) {
  const { adminUser } = params || ({} as ListRequest);
  if (!adminUser || adminUser.toLowerCase() !== 'zero') {
    throw new ForbiddenError('Only Zero can access all users');
  }
  const users = Array.from(store.values()).map(r => ({ userId: r.userId, facts: r.profile_facts.length }));
  return ok({ users });
}

export async function userMemoryLogin(params: LoginRequest) {
  const { userId } = params || ({} as LoginRequest);
  if (!userId) throw new BadRequestError('userId is required');
  const id = userId.toLowerCase().trim();
  const rec = getOrInit(id);
  const now = new Date().toISOString();
  const [datePart, timePart] = now.split('T');
  rec.profile_facts.push(`${datePart}: Logged in at ${timePart?.split('.')[0] || '00:00:00'}`);
  rec.counters.logins = (rec.counters.logins || 0) + 1;
  rec.updated_at = now;
  store.set(id, rec);
  return ok({ userId: id, login_count: rec.counters.logins });
}

// Optional: register on module load (works with auto-load)
import { globalRegistry } from '../../core/handler-registry.js';
try {
  globalRegistry.registerModule('memory', {
    'user.memory.save': userMemorySave as any,
    'user.memory.retrieve': userMemoryRetrieve as any,
    'user.memory.list': userMemoryList as any,
    'user.memory.login': userMemoryLogin as any,
  } as any, { requiresAuth: true, description: 'User memory (skeleton)' });
} catch (_) {
  // registry might not be initialized in some entrypoints
}

