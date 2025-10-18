import { ok } from "../../utils/response.js";
import { BadRequestError, ForbiddenError } from "../../utils/errors.js";
const store = new Map();
function getOrInit(userId) {
    const current = store.get(userId);
    if (current)
        return current;
    const empty = {
        userId,
        profile_facts: [],
        summary: '',
        counters: {},
        updated_at: new Date().toISOString(),
    };
    store.set(userId, empty);
    return empty;
}
export async function userMemorySave(params) {
    const { userId, profile_facts = [], summary = '', counters = {} } = params || {};
    if (!userId)
        throw new BadRequestError('userId is required');
    const id = userId.toLowerCase().trim();
    const current = getOrInit(id);
    const mergedFacts = [...current.profile_facts, ...profile_facts];
    const rec = {
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
export async function userMemoryRetrieve(params) {
    const { userId } = params || {};
    if (!userId)
        throw new BadRequestError('userId is required');
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
export async function userMemoryList(params) {
    const { adminUser } = params || {};
    if (!adminUser || adminUser.toLowerCase() !== 'zero') {
        throw new ForbiddenError('Only Zero can access all users');
    }
    const users = Array.from(store.values()).map(r => ({ userId: r.userId, facts: r.profile_facts.length }));
    return ok({ users });
}
export async function userMemoryLogin(params) {
    const { userId } = params || {};
    if (!userId)
        throw new BadRequestError('userId is required');
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
        'user.memory.save': userMemorySave,
        'user.memory.retrieve': userMemoryRetrieve,
        'user.memory.list': userMemoryList,
        'user.memory.login': userMemoryLogin,
    }, { requiresAuth: true, description: 'User memory (skeleton)' });
}
catch (_) {
    // registry might not be initialized in some entrypoints
}
