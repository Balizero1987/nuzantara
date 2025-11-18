import crypto from 'crypto';

export function createHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function canonicalize(value: any, seen: WeakSet<object>): any {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (Buffer.isBuffer(value)) {
      return value.toString('base64');
    }
    if (typeof value === 'undefined' || typeof value === 'function') {
      return undefined;
    }
    return value;
  }

  if (seen.has(value)) {
    throw new TypeError('Cannot create stable hash for circular structures');
  }
  seen.add(value);

  if (Array.isArray(value)) {
    const normalized = value.map((item) => {
      const result = canonicalize(item, seen);
      return result === undefined ? null : result;
    });
    seen.delete(value);
    return normalized;
  }

  if (value instanceof Map) {
    const mapEntries = Array.from(value.entries()).sort(([a], [b]) =>
      String(a).localeCompare(String(b))
    );
    const normalizedMap: Record<string, unknown> = {};
    for (const [key, val] of mapEntries) {
      normalizedMap[String(key)] = canonicalize(val, seen);
    }
    seen.delete(value);
    return normalizedMap;
  }

  if (value instanceof Set) {
    const normalizedSet = Array.from(value.values())
      .map((item) => canonicalize(item, seen))
      .sort();
    seen.delete(value);
    return normalizedSet;
  }

  const sortedKeys = Object.keys(value).sort();
  const normalizedObject: Record<string, unknown> = {};

  for (const key of sortedKeys) {
    const normalizedValue = canonicalize(value[key], seen);
    if (normalizedValue !== undefined) {
      normalizedObject[key] = normalizedValue;
    }
  }

  seen.delete(value);
  return normalizedObject;
}

export function stableHash(obj: any): string {
  const normalized = canonicalize(obj, new WeakSet());
  const str = JSON.stringify(normalized);
  return createHash(str);
}
