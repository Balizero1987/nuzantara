import { createHash, randomBytes } from 'crypto';

export function hashString(input: string, algorithm: string = 'sha256'): string {
  return createHash(algorithm).update(input).digest('hex');
}

export function md5(input: string): string {
  return hashString(input, 'md5');
}

export function sha256(input: string): string {
  return hashString(input, 'sha256');
}

export function generateId(length: number = 16): string {
  return randomBytes(length).toString('hex');
}

export function generateApiKey(): string {
  return randomBytes(32).toString('hex');
}

export function createSignature(data: string, secret: string): string {
  return createHash('sha256')
    .update(data + secret)
    .digest('hex');
}

export function verifySignature(data: string, signature: string, secret: string): boolean {
  const expectedSignature = createSignature(data, secret);
  return signature === expectedSignature;
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const saltToUse = salt || randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(password + saltToUse)
    .digest('hex');
  
  return { hash, salt: saltToUse };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: computedHash } = hashPassword(password, salt);
  return computedHash === hash;
}

export function stableHash(input: any): string {
  const str = typeof input === 'string' ? input : JSON.stringify(input);
  return sha256(str);
}