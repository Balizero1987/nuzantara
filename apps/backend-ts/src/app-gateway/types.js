import { z } from 'zod';
export const ActionName = z.union([
    z.literal('chat_send'),
    z.literal('tool_run'),
    z.literal('open_view'),
    z.literal('memory_save'),
    z.literal('lead_save'),
    z.literal('set_language'),
]);
export const EventMeta = z.object({
    channel: z.enum(['webapp', 'whatsapp', 'instagram', 'x', 'telegram']).optional(),
    user: z.string().optional(),
    origin: z.string().optional(),
    conversation_history: z.array(z.any()).optional(),
}).partial();
export const EventRequestSchema = z.object({
    sessionId: z.string().min(1),
    action: ActionName,
    idempotencyKey: z.string().min(6).max(64).optional(),
    payload: z.unknown().optional(),
    meta: EventMeta.optional(),
});
