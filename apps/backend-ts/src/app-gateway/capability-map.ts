import type { ActionName } from './types.js';

export interface Capability {
  handler: string | '__dynamic__';
  tier: 'low'|'medium'|'high';
  rate: { windowMs: number; max: number } | null;
}

export const CAPABILITY_MAP: Record<ActionName, Capability> = {
  chat_send: { handler: 'bali.zero.chat', tier: 'high', rate: { windowMs: 60_000, max: 20 } },
  tool_run:  { handler: '__dynamic__', tier: 'medium', rate: { windowMs: 60_000, max: 30 } },
  open_view: { handler: 'system.handlers.list', tier: 'low', rate: { windowMs: 60_000, max: 60 } },
  memory_save: { handler: 'memory.save', tier: 'low', rate: { windowMs: 60_000, max: 60 } },
  lead_save: { handler: 'lead.save', tier: 'low', rate: { windowMs: 60_000, max: 30 } },
  set_language: { handler: 'identity.resolve', tier: 'low', rate: { windowMs: 60_000, max: 60 } },
};
