import type { Request } from 'express';
import { EventRequestSchema, type EventRequest, type Patch } from './types.js';
import { normalizeParams } from './param-normalizer.js';
import { getSession } from './session-store.js';

// Simple in-memory idempotency cache (P0)
const IDEMPOTENCY_WINDOW_MS = 5 * 60 * 1000;
const idem = new Map<string, { expiresAt: number; result: any }>();

function remember(key: string, result: any) {
  idem.set(key, { expiresAt: Date.now() + IDEMPOTENCY_WINDOW_MS, result });
  setTimeout(() => idem.delete(key), IDEMPOTENCY_WINDOW_MS).unref?.();
}

function checkIdem(key?: string) {
  if (!key) return null;
  const rec = idem.get(key);
  if (rec && rec.expiresAt > Date.now()) return rec.result;
  return null;
}

function originAllowed(origin?: string): boolean {
  const allowed = (process.env.CORS_ORIGINS || 'https://zantara.balizero.com,https://balizero1987.github.io,http://localhost:3000,http://127.0.0.1:3000')
    .split(',').map(s=>s.trim()).filter(Boolean);
  return !!(origin && allowed.includes(origin));
}

export async function handleAppEvent(req: Request): Promise<{ ok: boolean; patches?: Patch[]; code?: string; message?: string }>{
  const parse = EventRequestSchema.safeParse(req.body as unknown);
  if (!parse.success) {
    const flat = parse.error.flatten();
    const msg = (flat.formErrors && flat.formErrors.join('; ')) || 'invalid_payload';
    return { ok: false, code: 'validation_failed', message: msg };
  }
  const ev: EventRequest = parse.data;

  // Security: origin allowlist
  const origin = (req.headers['origin'] as string) || undefined;
  if (!originAllowed(origin)) {
    return { ok: false, code: 'auth_origin_denied', message: 'Origin not allowed' };
  }

  // Security: CSRF header check (session-bound)
  const sess = getSession(ev.sessionId);
  const csrfHeader = (req.headers['x-csrf-token'] as string) || '';
  if (!sess || !sess.csrfToken || csrfHeader !== sess.csrfToken) {
    return { ok: false, code: 'csrf_invalid', message: 'Invalid or missing CSRF token' };
  }

  // Idempotency
  const cached = checkIdem(ev.idempotencyKey);
  if (cached) return cached;

  // Minimal action handling stub (P0)
  let patches: Patch[] = [];
  if (ev.action === 'chat_send') {
    const params = normalizeParams('chat_send', ev.payload, ev.meta);
    const text = String(params?.query || '').trim();
    if (text) {
      patches.push({ op: 'append', target: 'timeline', data: { role: 'user', content: text } });
    }
    patches.push({ op: 'notify', level: 'info', message: 'Gateway received chat_send (stub)' });
    patches.push({ op: 'append', target: 'timeline', data: { role: 'assistant', content: '✅ Gateway online (stub). Soon this will call RAG/handlers.' } });
  } else {
    patches.push({ op: 'notify', level: 'info', message: `Action ${ev.action} acknowledged (stub)` });
  }

  const result = { ok: true, patches } as const;
  if (ev.idempotencyKey) remember(ev.idempotencyKey, result);
  return result;
}
