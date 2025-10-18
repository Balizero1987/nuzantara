export function normalizeParams(action, payload, meta) {
    try {
        switch (action) {
            case 'chat_send': {
                const text = String(payload?.text ?? payload?.message ?? '').trim();
                const user_email = meta?.user;
                return { query: text, user_role: 'member', ...(user_email ? { user_email } : {}) };
            }
            case 'memory_save': {
                return { userId: payload?.userId, content: payload?.content };
            }
            case 'lead_save': {
                // keep camelCase; backend handler expects camelCase for lead.save
                return { email: payload?.email, service: payload?.service, details: payload?.details };
            }
            case 'tool_run': {
                // direct passthrough; UI will provide { key, params }
                return payload?.params ?? {};
            }
            default:
                return payload ?? {};
        }
    }
    catch {
        return payload ?? {};
    }
}
