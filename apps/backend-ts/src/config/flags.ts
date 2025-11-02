import crypto from 'node:crypto';

export interface Flags {
  ENABLE_APP_GATEWAY: boolean;
  ENABLE_THIN_SHELL: boolean;
  ENABLE_CAPABILITY_MAP: boolean;
  ENABLE_OMNICHANNEL: boolean;
  ENABLE_OBSERVABILITY: boolean;
  ENABLE_SELF_HEALING: boolean;
  ENABLE_WS_TRANSPORT: boolean;
  // Performance Optimization Flags (Zero-Downtime Deployment)
  ENABLE_WEBSOCKET_IOS_FALLBACK: boolean;
  ENABLE_MESSAGE_QUEUE: boolean;
  ENABLE_ENHANCED_REDIS_CACHE: boolean;
  ENABLE_CDN_INTEGRATION: boolean;
  ENABLE_DB_QUERY_OPTIMIZATION: boolean;
  ENABLE_MEMORY_LEAK_PREVENTION: boolean;
  ENABLE_AUDIT_TRAIL: boolean;
  ENABLE_PERFORMANCE_BENCHMARKING: boolean;
  // SSE Streaming Feature Flag (Zero-Downtime Deployment)
  ENABLE_SSE_STREAMING: boolean;
}

export const DEFAULT_FLAGS: Flags = {
  ENABLE_APP_GATEWAY: true, // ✅ Gateway now production-ready
  ENABLE_THIN_SHELL: false,
  ENABLE_CAPABILITY_MAP: false,
  ENABLE_OMNICHANNEL: false,
  ENABLE_OBSERVABILITY: true,
  ENABLE_SELF_HEALING: true,
  ENABLE_WS_TRANSPORT: true,
  // Performance Optimization Flags - DISABLED by default for zero-downtime deployment
  ENABLE_WEBSOCKET_IOS_FALLBACK: false, // Enable after staging testing
  ENABLE_MESSAGE_QUEUE: false, // Enable after staging testing
  ENABLE_ENHANCED_REDIS_CACHE: true, // ✅ ENABLED - Production ready
  ENABLE_CDN_INTEGRATION: false, // Enable after staging testing
  ENABLE_DB_QUERY_OPTIMIZATION: false, // Enable after staging testing
  ENABLE_MEMORY_LEAK_PREVENTION: true, // Always enabled for safety
  ENABLE_AUDIT_TRAIL: true, // Always enabled for security/compliance
  ENABLE_PERFORMANCE_BENCHMARKING: false, // Enable for monitoring
  // SSE Streaming - DISABLED by default, enable via ENABLE_SSE_STREAMING=true
  ENABLE_SSE_STREAMING: false, // Enable after staging testing and performance validation
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
  for (const k of Object.keys(DEFAULT_FLAGS) as (keyof Flags)[]) {
    f[k] = envBool(k, DEFAULT_FLAGS[k]);
  }
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
