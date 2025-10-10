import crypto from 'node:crypto';

export interface Flags {
  ENABLE_APP_GATEWAY: boolean;
  ENABLE_THIN_SHELL: boolean;
  ENABLE_CAPABILITY_MAP: boolean;
  ENABLE_OMNICHANNEL: boolean;
  ENABLE_OBSERVABILITY: boolean;
  ENABLE_LLAMA4: boolean;
  ENABLE_SELF_HEALING: boolean;
  ENABLE_WS_TRANSPORT: boolean;
}

export const DEFAULT_FLAGS: Flags = {
  ENABLE_APP_GATEWAY: process.env.NODE_ENV !== 'production',
  ENABLE_THIN_SHELL: false,
  ENABLE_CAPABILITY_MAP: false,
  ENABLE_OMNICHANNEL: false,
  ENABLE_OBSERVABILITY: true,
  ENABLE_LLAMA4: false,
  ENABLE_SELF_HEALING: true,
  ENABLE_WS_TRANSPORT: true,
};

function envBool(name: keyof Flags, def: boolean): boolean {
  const v = process.env[name as string];
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes') return true;
    if (s === 'false' || s === '0' || s === 'no') return false;
  }
  return def;
}

export function getFlags(): Flags {
  // Merge DEFAULT_FLAGS with env overrides
  const f: Flags = { ...DEFAULT_FLAGS };
  (Object.keys(DEFAULT_FLAGS) as (keyof Flags)[]).forEach((k) => {
    f[k] = envBool(k, DEFAULT_FLAGS[k]);
  });
  return f;
}

export function computeFlagsETag(flags: Flags): string {
  try {
    const h = crypto.createHash('sha1').update(JSON.stringify(flags)).digest('hex');
    return `W/"flags-${h}"`;
  } catch {
    return `W/"flags-${JSON.stringify(flags).length}"`;
  }
}
