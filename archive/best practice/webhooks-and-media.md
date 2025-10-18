# WhatsApp Webhooks and Media Handling

## Webhook Hardening
1. Expose an HTTPS endpoint that responds to the verification challenge (`hub.challenge`) during GET onboarding.
2. For POST requests, validate the `X-Hub-Signature-256` header by computing `sha256=HMAC_SHA256(raw_payload, META_APP_SECRET)`; reject mismatches and always use the raw request body.
3. Persist raw payloads when debugging signature issues; never rely on parsed JSON for the HMAC check.

### Express Middleware Example
```ts
import crypto from 'crypto'
import express from 'express'

const app = express()
app.use(express.raw({ type: 'application/json' }))

function verifySignature(req: express.Request): boolean {
  const provided = req.get('x-hub-signature-256') || ''
  const expected =
    'sha256=' +
    crypto.createHmac('sha256', process.env.META_APP_SECRET as string)
      .update(req.body)
      .digest('hex')

  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

app.post('/webhook', (req, res) => {
  if (!verifySignature(req)) return res.sendStatus(403)

  // Enforce idempotency with message.id or status.id in a fast store (for example Redis SETEX)
  // Hand off processing to async workers and acknowledge immediately
  res.sendStatus(200)
})
```

### Critical Events to Capture
- `messages`: inbound and outbound payloads, including `wa_id`, `message.id`, media, and metadata.
- `statuses`: delivery states (sent, delivered, read, failed), pricing, and category information.
- `conversation` updates: track billing windows and templates used.

### Idempotency and Resilience
- Deduplicate on `message.id` or `status.id` and maintain short-lived caches for replays.
- Always acknowledge within one to two seconds; move heavy processing to background workers or an event bus.
- When sending messages, implement exponential backoff with jitter for `429` and `5xx` responses.

## Media Handling
- Media URLs expire roughly five minutes after issuance; call `GET /{media-id}` with the access token, download immediately, and regenerate if expired.
- Store media in managed storage (S3, GCS, etc.), encrypt at rest, run malware scanning when required, and enforce TTL-based lifecycle rules.
- Cloud API retains messages at rest for up to 30 days to guarantee basic retransmission; document this retention in your privacy register and notices.

## Reference Snippets
### Webhook Verification (GET)
```ts
app.get('/webhook', (req, res) => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === verifyToken) {
    return res.status(200).send(challenge)
  }

  return res.sendStatus(403)
})
```

### POST with Retry, Backoff, and Jitter
```ts
async function postWithRetry(url: string, body: unknown, max = 5) {
  let wait = 250

  for (let attempt = 0; attempt < max; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (res.ok) return res
    if (res.status === 429 || res.status >= 500) {
      const jitter = Math.random() * wait
      await new Promise(resolve => setTimeout(resolve, wait + jitter))
      wait = Math.min(wait * 2, 10000)
      continue
    }

    throw new Error(`HTTP ${res.status}`)
  }

  throw new Error('Max retries exceeded')
}
```
