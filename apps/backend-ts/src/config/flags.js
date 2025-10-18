import crypto from 'node:crypto';
export const DEFAULT_FLAGS = {
    ENABLE_APP_GATEWAY: true, // ✅ Gateway now production-ready
    ENABLE_THIN_SHELL: false,
    ENABLE_CAPABILITY_MAP: false,
    ENABLE_OMNICHANNEL: false,
    ENABLE_OBSERVABILITY: true,
    ENABLE_SELF_HEALING: true,
    ENABLE_WS_TRANSPORT: true,
};
function envBool(name, def) {
    const v = process.env[name];
    if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        if (s === 'true' || s === '1' || s === 'yes')
            return true;
        if (s === 'false' || s === '0' || s === 'no')
            return false;
    }
    return def;
}
export function getFlags() {
    // Merge DEFAULT_FLAGS with env overrides
    const f = { ...DEFAULT_FLAGS };
    Object.keys(DEFAULT_FLAGS).forEach((k) => {
        f[k] = envBool(k, DEFAULT_FLAGS[k]);
    });
    return f;
}
export function computeFlagsETag(flags) {
    try {
        const h = crypto.createHash('sha1').update(JSON.stringify(flags)).digest('hex');
        return `W/"flags-${h}"`;
    }
    catch {
        return `W/"flags-${JSON.stringify(flags).length}"`;
    }
}
