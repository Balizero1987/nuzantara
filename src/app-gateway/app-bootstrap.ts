import crypto from 'node:crypto';
import type { BootstrapArgs, BootstrapResponse } from './types.ts';
import { getFlags } from '../config/flags.ts';
import { createSession, persistSessionFirestore } from './session-store.ts';

function genSessionId(): string {
  return `sess_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
}

export async function buildBootstrapResponse(args: BootstrapArgs): Promise<BootstrapResponse> {
  const sessionId = genSessionId();
  const csrfToken = crypto.randomBytes(16).toString('hex');
  const schema = {
    version: '1.0',
    layout: { header: ['app-header'], main: ['view:chat','drawer:tools'] },
    views: {
      chat: { components: ['timeline','composer'] },
    },
    components: {
      'app-header': { id: 'app-header', type: 'header', props: { title: 'ZANTARA' } },
      timeline: { id: 'timeline', type: 'timeline' },
      composer: { id: 'composer', type: 'composer', props: { actions: ['chat_send','tool_run'] } },
    },
    designTokens: {},
  } as const;

  // Persist session (best-effort in P0)
  try {
    createSession(sessionId, { user: args.user, origin: args.origin, channel: 'webapp', csrfToken });
    persistSessionFirestore({ id: sessionId, user: args.user, origin: args.origin, channel: 'webapp', csrfToken, createdAt: Date.now(), ttlMs: 24 * 60 * 60 * 1000 } as any);
  } catch {}

  return {
    ok: true,
    data: {
      sessionId,
      csrfToken,
      schema: schema as any,
      flags: getFlags(),
    },
  };
}
