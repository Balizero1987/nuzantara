import crypto from 'node:crypto';
import type { BootstrapArgs, BootstrapResponse } from './types.js';
import { getFlags } from '../config/flags.js';

function genSessionId(): string {
  return `sess_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
}

export async function buildBootstrapResponse(args: BootstrapArgs): Promise<BootstrapResponse> {
  const sessionId = genSessionId();
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

  return {
    ok: true,
    data: {
      sessionId,
      schema: schema as any,
      flags: getFlags(),
    },
  };
}
