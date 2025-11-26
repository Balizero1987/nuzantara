import { z } from 'zod';

export const ActionName = z.union([
  z.literal('chat_send'),
  z.literal('tool_run'),
  z.literal('open_view'),
  z.literal('memory_save'),
  z.literal('lead_save'),
  z.literal('set_language'),
  // Additional capabilities
  z.literal('team_search'),
  z.literal('pricing_query'),
  z.literal('collective_memory'),
]);

export type ActionName = z.infer<typeof ActionName>;

export const EventMeta = z
  .object({
    channel: z.enum(['webapp', 'whatsapp', 'instagram', 'x', 'telegram']).optional(),
    user: z.string().optional(),
    origin: z.string().optional(),
    conversation_history: z.array(z.any()).optional(),
  })
  .partial();

export const EventRequestSchema = z.object({
  sessionId: z.string().min(1),
  action: ActionName,
  idempotencyKey: z.string().min(6).max(64).optional(),
  payload: z.unknown().optional(),
  meta: EventMeta.optional(),
});

export type EventRequest = z.infer<typeof EventRequestSchema>;

export type Patch =
  | { op: 'append'; target: string; data: any }
  | { op: 'replace'; target: string; data: any }
  | { op: 'remove'; target: string }
  | { op: 'state'; key: string; value: any }
  | { op: 'set'; target: string; data: any }
  | { op: 'notify'; level: 'info' | 'warn' | 'error' | 'success'; message: string }
  | { op: 'navigate'; route: string }
  | { op: 'tool'; name: string; args: any }
  | { op: 'error'; code: string; message: string; details?: any };

export interface BootstrapArgs {
  user?: string;
  origin?: string;
}

export interface BootstrapResponse {
  ok: true;
  data: {
    sessionId: string;
    csrfToken: string;
    schema: {
      version: string;
      layout: {
        header: string[];
        leftSidebar?: string[];
        main: string[];
        rightDrawer?: string[];
        footer?: string[];
      };
      views: Record<string, { components: string[]; data?: any }>;
      components: Record<string, { id: string; type: string; props?: Record<string, any> }>;
      designTokens: Record<string, any>;
    };
    flags: import('../config/flags.js').Flags;
  };
}
