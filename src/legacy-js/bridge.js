import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { stableHash } from './utils/hash.js';
import { withRetry } from './utils/retry.js';
import { BridgeError } from './utils/errors.js';
// Import handlers from same directory (both are copied to app root in Docker)
import { getHandlers } from './handlers.js';
export class Bridge {
    constructor() {
        this.inflight = new Map();
        this.metrics = { startedAt: Date.now(), calls: 0, dedupHits: 0 };
        const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
        const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '';
        let credentials;
        let useServiceAccount = false;
        if (keyFile) {
            // Use file path
            credentials = keyFile;
            useServiceAccount = true;
        }
        else if (raw) {
            // Use JSON string
            try {
                credentials = JSON.parse(raw);
                useServiceAccount = true;
            }
            catch (e) {
                throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_KEY (not JSON)');
            }
        }
        else {
            // OAuth2 mode - no service account needed
            console.log('🔐 Running in OAuth2 mode - Service Account not required');
            credentials = null;
        }
        // Only initialize GoogleAuth if we have service account credentials
        if (useServiceAccount && credentials) {
            const scopes = [
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/gmail.send',
                'https://www.googleapis.com/auth/gmail.readonly'
            ];
            const auth = new GoogleAuth({
                keyFile: typeof credentials === 'string' && keyFile ? credentials : undefined,
                credentials: typeof credentials === 'object' ? credentials : undefined,
                scopes,
                clientOptions: process.env.IMPERSONATE_USER
                    ? { subject: process.env.IMPERSONATE_USER }
                    : undefined,
            });
            google.options({ auth: auth });
            this.auth = auth;
            this.drive = google.drive({ version: 'v3', auth: auth });
        }
        else {
            // OAuth2 mode - no auth needed for Bridge, handlers will use OAuth2
            this.auth = null;
            this.drive = null; // Will be handled by OAuth2 handlers
            console.log('✅ Bridge initialized in OAuth2 mode');
        }
        this.handlers = getHandlers(this.drive, this.auth);
    }
    keyFor(input) {
        return (input.idempotencyKey ||
            stableHash({ k: input.key, p: input.params || {} }));
    }
    async call(input, opts) {
        const { key, params } = input;
        const handler = this.handlers[key];
        if (!handler)
            throw new BridgeError(404, 'UNKNOWN_KEY', `Unknown key: ${key}`);
        const idKey = this.keyFor(input);
        const existing = this.inflight.get(idKey);
        if (existing) {
            this.metrics.dedupHits++;
            return existing;
        }
        const exec = async () => {
            this.metrics.calls++;
            const res = await (opts?.retries ? withRetry(() => handler(params), { maxAttempts: opts.retries }) : handler(params));
            return { ok: true, idempotencyKey: idKey, result: res };
        };
        const p = this.withTimeout(exec(), opts?.timeoutMs || 30000)
            .finally(() => this.inflight.delete(idKey));
        this.inflight.set(idKey, p);
        return p;
    }
    async dispatch(handler, params) {
        // dispatch is an alias for call with key=handler
        return this.call({ key: handler, params });
    }
    withTimeout(p, ms) {
        let t;
        const to = new Promise((_resolve, reject) => {
            t = setTimeout(() => reject(new BridgeError(504, 'TIMEOUT', `Timed out after ${ms}ms`)), ms);
        });
        return Promise.race([p, to]).finally(() => clearTimeout(t));
    }
}
export default Bridge;
