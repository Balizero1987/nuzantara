import crypto from 'crypto';

export function createHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function stableHash(obj: any): string {
  const str = JSON.stringify(obj, Object.keys(obj).sort());
  return createHash(str);
}
