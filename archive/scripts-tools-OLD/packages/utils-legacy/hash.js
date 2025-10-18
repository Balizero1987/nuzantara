import { createHash, randomBytes } from 'crypto';
export function hashString(input, algorithm = 'sha256') {
    return createHash(algorithm).update(input).digest('hex');
}
export function md5(input) {
    return hashString(input, 'md5');
}
export function sha256(input) {
    return hashString(input, 'sha256');
}
export function generateId(length = 16) {
    return randomBytes(length).toString('hex');
}
export function generateApiKey() {
    return randomBytes(32).toString('hex');
}
export function createSignature(data, secret) {
    return createHash('sha256')
        .update(data + secret)
        .digest('hex');
}
export function verifySignature(data, signature, secret) {
    const expectedSignature = createSignature(data, secret);
    return signature === expectedSignature;
}
export function hashPassword(password, salt) {
    const saltToUse = salt || randomBytes(16).toString('hex');
    const hash = createHash('sha256')
        .update(password + saltToUse)
        .digest('hex');
    return { hash, salt: saltToUse };
}
export function verifyPassword(password, hash, salt) {
    const { hash: computedHash } = hashPassword(password, salt);
    return computedHash === hash;
}
export function stableHash(input) {
    const str = typeof input === 'string' ? input : JSON.stringify(input);
    return sha256(str);
}
