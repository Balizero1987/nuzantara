import logger from '../services/logger.js';
import { EventRequestSchema } from './types.js';
import { normalizeParams } from './param-normalizer.js';
import { getSession } from './session-store.js';
import { CAPABILITY_MAP } from './capability-map.js';
import { globalRegistry } from '../core/handler-registry.js';
// Simple in-memory idempotency cache (P0)
const IDEMPOTENCY_WINDOW_MS = 5 * 60 * 1000;
const idem = new Map();
function remember(key, result) {
    idem.set(key, { expiresAt: Date.now() + IDEMPOTENCY_WINDOW_MS, result });
    setTimeout(() => idem.delete(key), IDEMPOTENCY_WINDOW_MS).unref?.();
}
function checkIdem(key) {
    if (!key)
        return null;
    const rec = idem.get(key);
    if (rec && rec.expiresAt > Date.now())
        return rec.result;
    return null;
}
function originAllowed(origin) {
    const allowed = (process.env.CORS_ORIGINS || 'https://zantara.balizero.com,https://balizero1987.github.io,http://localhost:3000,http://127.0.0.1:3000')
        .split(',').map(s => s.trim()).filter(Boolean);
    return !!(origin && allowed.includes(origin));
}
export async function handleAppEvent(req) {
    const parse = EventRequestSchema.safeParse(req.body);
    if (!parse.success) {
        const flat = parse.error.flatten();
        const msg = (flat.formErrors && flat.formErrors.join('; ')) || 'invalid_payload';
        return { ok: false, code: 'validation_failed', message: msg };
    }
    const ev = parse.data;
    // Security: origin allowlist
    const origin = req.headers['origin'] || undefined;
    if (!originAllowed(origin)) {
        return { ok: false, code: 'auth_origin_denied', message: 'Origin not allowed' };
    }
    // Security: CSRF header check (session-bound)
    const sess = getSession(ev.sessionId);
    const csrfHeader = req.headers['x-csrf-token'] || '';
    if (!sess || !sess.csrfToken || csrfHeader !== sess.csrfToken) {
        return { ok: false, code: 'csrf_invalid', message: 'Invalid or missing CSRF token' };
    }
    // Idempotency
    const cached = checkIdem(ev.idempotencyKey);
    if (cached)
        return cached;
    // Real action handling with capability routing
    let patches = [];
    try {
        // Get capability configuration
        const capability = CAPABILITY_MAP[ev.action];
        if (!capability) {
            return { ok: false, code: 'action_unknown', message: `Unknown action: ${ev.action}` };
        }
        // CRITICAL FIX: Enrich meta.user from session if not provided by webapp
        // This ensures user identification works even if webapp doesn't send it
        const enrichedMeta = {
            ...ev.meta,
            user: ev.meta?.user || sess.user // Use session user if not in meta
        };
        logger.info(`🔐 [Event] Session user: ${sess.user}, Meta user: ${enrichedMeta.user}`);
        // Normalize parameters for handler
        const params = normalizeParams(ev.action, ev.payload, enrichedMeta);
        // Special handling for chat_send - call bali.zero.chat
        if (ev.action === 'chat_send') {
            const query = String(params?.query || params?.message || '').trim();
            if (!query) {
                return { ok: false, code: 'missing_query', message: 'Query text is required' };
            }
            // Add user message to timeline
            patches.push({
                op: 'append',
                target: 'timeline',
                data: { role: 'user', content: query }
            });
            // Call Bali Zero Chat handler
            const handlerKey = capability.handler;
            if (!globalRegistry.has(handlerKey)) {
                patches.push({
                    op: 'append',
                    target: 'timeline',
                    data: {
                        role: 'assistant',
                        content: '⚠️ Chat service temporarily unavailable. Handler not found.'
                    }
                });
                return { ok: true, patches };
            }
            // Execute handler
            const chatResult = await globalRegistry.execute(handlerKey, {
                query,
                conversation_history: ev.meta?.conversation_history,
                user_role: sess.user_role || 'member'
            }, req);
            // Add assistant response
            const responseText = chatResult?.response || chatResult?.answer ||
                'I could not generate a response. Please try again.';
            patches.push({
                op: 'append',
                target: 'timeline',
                data: { role: 'assistant', content: responseText }
            });
            // Add sources if available
            if (chatResult?.sources && Array.isArray(chatResult.sources) && chatResult.sources.length > 0) {
                patches.push({
                    op: 'set',
                    target: 'sources',
                    data: chatResult.sources
                });
            }
            // Add model info if available
            if (chatResult?.model) {
                patches.push({
                    op: 'notify',
                    level: 'info',
                    message: `Model: ${chatResult.model}`
                });
            }
        }
        else if (ev.action === 'tool_run') {
            // Dynamic handler execution
            const toolName = params?.tool || params?.handler;
            if (!toolName) {
                return { ok: false, code: 'missing_tool', message: 'Tool name is required' };
            }
            if (!globalRegistry.has(toolName)) {
                return { ok: false, code: 'tool_not_found', message: `Tool not found: ${toolName}` };
            }
            // Execute tool handler
            const toolResult = await globalRegistry.execute(toolName, params, req);
            patches.push({
                op: 'set',
                target: 'tool_result',
                data: toolResult
            });
            patches.push({
                op: 'notify',
                level: 'success',
                message: `Tool ${toolName} executed successfully`
            });
        }
        else {
            // Generic action handling - try to execute handler
            const handlerKey = capability.handler;
            if (handlerKey === '__dynamic__') {
                // Dynamic handler - get from params
                const dynamicHandler = params?.handler || ev.action;
                if (!globalRegistry.has(dynamicHandler)) {
                    return { ok: false, code: 'handler_not_found', message: `Handler not found: ${dynamicHandler}` };
                }
                const result = await globalRegistry.execute(dynamicHandler, params, req);
                patches.push({ op: 'set', target: 'result', data: result });
            }
            else {
                // Fixed handler
                if (!globalRegistry.has(handlerKey)) {
                    return { ok: false, code: 'handler_not_found', message: `Handler not configured: ${handlerKey}` };
                }
                const result = await globalRegistry.execute(handlerKey, params, req);
                patches.push({ op: 'set', target: 'result', data: result });
            }
            patches.push({
                op: 'notify',
                level: 'success',
                message: `Action ${ev.action} completed`
            });
        }
    }
    catch (error) {
        logger.error(`Gateway handler error [${ev.action}]:`, error);
        // Add error notification
        patches.push({
            op: 'notify',
            level: 'error',
            message: error.message || 'An error occurred processing your request'
        });
        // For chat, add error message to timeline
        if (ev.action === 'chat_send') {
            patches.push({
                op: 'append',
                target: 'timeline',
                data: {
                    role: 'assistant',
                    content: `⚠️ Error: ${error.message || 'Service temporarily unavailable'}`
                }
            });
        }
        return {
            ok: false,
            code: 'handler_error',
            message: error.message || 'Handler execution failed',
            patches
        };
    }
    const result = { ok: true, patches };
    if (ev.idempotencyKey)
        remember(ev.idempotencyKey, result);
    return result;
}
