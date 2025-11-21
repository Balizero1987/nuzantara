import type { ActionName } from './types.js';

export interface Capability {
  handler: string | '__dynamic__';
  tier: 'low' | 'medium' | 'high';
  rate: { windowMs: number; max: number } | null;
}

export const CAPABILITY_MAP: Record<ActionName, Capability> = {
  chat_send: { handler: 'bali.zero.chat', tier: 'high', rate: { windowMs: 60_000, max: 20 } },
  tool_run: { handler: '__dynamic__', tier: 'medium', rate: { windowMs: 60_000, max: 30 } },
  open_view: { handler: 'system.handlers.list', tier: 'low', rate: { windowMs: 60_000, max: 60 } },
  memory_save: { handler: 'memory.save', tier: 'low', rate: { windowMs: 60_000, max: 60 } },
  lead_save: { handler: 'lead.save', tier: 'low', rate: { windowMs: 60_000, max: 30 } },
  set_language: { handler: 'identity.resolve', tier: 'low', rate: { windowMs: 60_000, max: 60 } },

  // ZANTARA v3 Ω Strategic Endpoints (Production Ready)
  zantara_unified: {
    handler: 'zantara.unified',
    tier: 'high',
    rate: { windowMs: 60_000, max: 50 },
  },
  zantara_collective: {
    handler: 'zantara.collective',
    tier: 'medium',
    rate: { windowMs: 60_000, max: 30 },
  },
  zantara_ecosystem: {
    handler: 'zantara.ecosystem',
    tier: 'high',
    rate: { windowMs: 60_000, max: 20 },
  },

  // ZANTARA v3 Knowledge Domains
  kbli_lookup: { handler: 'kbli.lookup', tier: 'medium', rate: { windowMs: 60_000, max: 40 } },
  team_search: { handler: 'team.search', tier: 'low', rate: { windowMs: 60_000, max: 60 } },
  pricing_query: {
    handler: 'pricing.official',
    tier: 'medium',
    rate: { windowMs: 60_000, max: 30 },
  },
  collective_memory: {
    handler: 'collective.memory',
    tier: 'low',
    rate: { windowMs: 60_000, max: 40 },
  },
};
