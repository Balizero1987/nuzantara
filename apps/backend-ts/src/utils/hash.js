import crypto from 'crypto';
export function createHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}
export function stableHash(obj) {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    return createHash(str);
}
