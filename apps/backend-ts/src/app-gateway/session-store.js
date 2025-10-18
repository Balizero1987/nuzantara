import logger from '../services/logger.js';
import { getFirestore } from '../services/firebase.js';
const inMem = new Map();
const CLEANUP_MS = 60_000;
function cleanup() {
    const now = Date.now();
    for (const [k, v] of inMem.entries()) {
        if (now - v.createdAt > v.ttlMs)
            inMem.delete(k);
    }
}
setInterval(cleanup, CLEANUP_MS).unref?.();
export function createSession(id, opt) {
    const ttlDefaults = {
        webapp: 24 * 60 * 60 * 1000,
        whatsapp: 30 * 60 * 1000,
        instagram: 15 * 60 * 1000,
        telegram: 60 * 60 * 1000,
    };
    const ttl = ttlDefaults[(opt.channel || 'webapp')] || ttlDefaults.webapp;
    const rec = { id, user: opt.user, origin: opt.origin, channel: opt.channel, csrfToken: opt.csrfToken, createdAt: Date.now(), ttlMs: ttl ?? 0 };
    inMem.set(id, rec);
    return rec;
}
export function getSession(id) {
    return inMem.get(id) || null;
}
export async function persistSessionFirestore(rec) {
    try {
        const db = getFirestore();
        await db.collection('app_sessions').doc(rec.id).set(rec, { merge: true });
    }
    catch (e) {
        // Best-effort in P0
        logger.warn('Session Firestore persist failed (best-effort):', e?.message || e);
    }
}
