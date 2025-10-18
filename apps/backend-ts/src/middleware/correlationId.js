import crypto from 'node:crypto';
function genId() {
    return crypto.randomBytes(8).toString('hex');
}
export function correlationId() {
    return function cid(req, res, next) {
        const incoming = req.headers['x-request-id'] || req.headers['x-correlation-id'];
        const id = incoming || genId();
        res.setHeader('X-Request-ID', id);
        // Correlation: prefer explicit header, fallback to request id
        const corr = req.headers['x-correlation-id'] || id;
        res.setHeader('X-Correlation-ID', corr);
        req.correlationId = corr;
        next();
    };
}
