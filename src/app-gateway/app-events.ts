import type { Request } from 'express';
import { z } from 'zod';
import { EventRequestSchema, type EventRequest, type Patch } from './types.js';
import { normalizeParams } from './param-normalizer.js';

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

export async function handleAppEvent(req: Request): Promise<{ ok: boolean; patches?: Patch[]; code?: string; message?: string }>
{
  const parse = EventRequestSchema.safeParse(req.body as unknown);
  if (!parse.success) {
    return { ok: false, code: 'validation_failed', message: z.flatten(parse.error.format()).formErrors.join('; ') || 'invalid_payload' };
  }
  const ev: EventRequest = parse.data;

  // Idempotency
  const cached = checkIdem(ev.idempotencyKey);
  if (cached) return cached;

  // Minimal action handling stub (P0)
  let patches: Patch[] = [];
  if (ev.action === 'chat_send') {
    const params = normalizeParams('chat_send', ev.payload, ev.meta);
    const text = String(params?.query || '').trim();
    patches.push({ op: 'append', target: 'timeline', data: { role: 'user', content: text } });
    patches.push({ op: 'notify', level: 'info', message: 'Gateway received chat_send (stub)' });
    patches.push({ op: 'append', target: 'timeline', data: { role: 'assistant', content: '✅ Gateway online (stub). Soon this will call RAG/handlers.' } });
  } else {
    patches.push({ op: 'notify', level: 'info', message: `Action ${ev.action} acknowledged (stub)` });
  }

  const result = { ok: true, patches } as const;
  if (ev.idempotencyKey) remember(ev.idempotencyKey, result);
  return result;
}
