import { logger } from '../logging/unified-logger.js';

interface SessionRecord {
  id: string;
  user?: string;
  origin?: string;
  channel?: string;
  csrfToken?: string;
  user_role?: string;
  createdAt: number;
  ttlMs: number;
}

const inMem = new Map<string, SessionRecord>();
const CLEANUP_MS = 60_000;

function cleanup() {
  const now = Date.now();
  for (const [k, v] of inMem.entries()) {
    if (now - v.createdAt > v.ttlMs) inMem.delete(k);
  }
}
setInterval(cleanup, CLEANUP_MS).unref?.();

export function createSession(id: string, opt: Partial<SessionRecord>) {
  const ttlDefaults: Record<string, number> = {
    webapp: 24 * 60 * 60 * 1000,
    whatsapp: 30 * 60 * 1000,
    instagram: 15 * 60 * 1000,
    telegram: 60 * 60 * 1000,
  };
  const ttl = ttlDefaults[opt.channel || 'webapp'] || ttlDefaults.webapp;
  const rec: SessionRecord = {
    id,
    user: opt.user,
    origin: opt.origin,
    channel: opt.channel,
    csrfToken: opt.csrfToken,
    createdAt: Date.now(),
    ttlMs: ttl ?? 0,
  };
  inMem.set(id, rec);
  return rec;
}

export function getSession(id: string) {
  return inMem.get(id) || null;
}

export async function persistSessionFirestore(rec: SessionRecord) {
  // Firestore persistence removed - sessions now use in-memory only
  // TODO: If persistence needed, use PostgreSQL
  logger.debug('Session persistence disabled (using in-memory only)');
}
