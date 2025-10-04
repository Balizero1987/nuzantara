# WhatsApp Business API Best Practices (Zantara Bridge)

Source check date: 2025-09-24

## 1. Cloud API vs On-Premise
- **Recommendation**: use the Cloud API.
- **Reasons**:
  - On-Premise support ends 2025-10-01; migrating early avoids a deadline crunch.
  - Throughput: Cloud API defaults to 80 messages per second per number, scaling up to 1,000 MPS automatically.
  - Maintenance and features: Cloud receives updates natively; On-Prem requires manual deploy/version management.
  - Media retention: Cloud stores media for 30 days (temporary download URLs). On-Prem typically retains 14 days.
- Use On-Prem only when short-term regulatory constraints demand local hosting; plan migration to Cloud by Q3 2025.

## 2. Template Messages
- Choose the correct category (Marketing, Utility, Authentication); supply realistic placeholder examples; avoid vague promises or prohibited content.
- Maintain brand consistency: display names must avoid "official/verified" and references to Meta or WhatsApp.
- Monitor quality: keep lightweight template variants (short/long copy) and remove low-rated ones.
- **USA note (2025)**: marketing template delivery to +1 numbers is suspended from 2025-04-01; build fallbacks (email/SMS) or pivot to Utility/Service messaging.

## 3. Interactive Messages
- **Reply buttons**: up to three predefined buttons for quick confirmations or triage choices.
- **List messages**: up to 10 total options across sections; ideal for structured menus.
- UX tips: one primary action per message, stable IDs for tracking via webhook, localise button text (~20 characters for readability).

## 4. Webhook Hardening
1. **Handshake (GET)**: respond with `hub.challenge` after validating `hub.mode` and `hub.verify_token`.
2. **Notifications (POST)**: verify `X-Hub-Signature-256` (format `sha256=`) using HMAC-SHA256 over the raw payload and the App Secret; reject with 403 if mismatched using constant-time comparison.

```ts
import crypto from 'crypto'
import express from 'express'

const app = express()
const APP_SECRET = process.env.META_APP_SECRET!
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!

app.use('/webhook', express.raw({ type: 'application/json' }))

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']
  if (mode === 'subscribe' && token === VERIFY_TOKEN) return res.status(200).send(challenge)
  return res.sendStatus(403)
})

app.post('/webhook', (req, res) => {
  const signature = req.header('X-Hub-Signature-256') || ''
  const expected =
    'sha256=' +
    crypto.createHmac('sha256', APP_SECRET)
      .update(req.body)
      .digest('hex')
  const ok = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  if (!ok) return res.sendStatus(403)
  res.sendStatus(200)
})
```

```py
import hmac, hashlib
from flask import Flask, request, abort

APP_SECRET = b'...'
app = Flask(__name__)

@app.post('/webhook')
def webhook():
    sig = request.headers.get('X-Hub-Signature-256', '')
    expected = 'sha256=' + hmac.new(APP_SECRET, request.get_data(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        abort(403)
    return ('', 200)
```

Security checklist: restrict IP/ASN when possible, ensure idempotent processing, support safe retries, log without PII, rotate credentials, alert on 4xx/5xx bursts.

## 5. Media Handling
- Webhook delivers a media ID; call `GET /{media-id}` with bearer token to fetch a short-lived URL. Download immediately and store securely (S3/GCS) with encryption and metadata; avoid logging the URL.
- **Cloud API limits**:
  - Media retention ~30 days.
  - Images (JPEG/PNG) <= 5 MB.
  - Audio (AAC/AMR/MP3/M4A/OGG-OPUS) <= 16 MB.
  - Video (H.264 + AAC single audio stream) <= 16 MB.
  - Documents (PDF/DOC/XLS/PPT/TXT) <= 100 MB.
- On-Prem historic context: uploads up to 64 MB, 14-day retention.

## 6. Business Verification
- Complete Business Verification in Security Center (legal data, documents, domain or email verification).
- Display name must reflect brand accurately without forbidden terms.
- Enable two-step verification for WhatsApp numbers (Cloud API setup includes a dedicated step).

## 7. Pricing Model (2025)
- Starting 2025-07-01, pricing is per message delivered (not per conversation), segmented by category (Marketing, Utility, Authentication) and geography with volume tiers.
- Free entry points: user-initiated via Click-to-WhatsApp ads or Facebook Page CTA unlock 72 hours of free messaging (templates included); align campaigns to exploit this window.
- Design to cost: respond within the 24-hour service window, leverage free entry windows for paid funnels.

## 8. Operations and Quality
- Handle backoff and rate limits: watch for errors like 130429 and implement queues with jittered retries; respect per-user rate limits.
- Scale workers according to number throughput (80 to 1,000 MPS).
- Instrument observability: track `message_id` delivery/read/error, latency distributions, interactive message drop-offs.

## Implementation Note

```
// Media download flow
// 1) Receive webhook -> extract media_id
// 2) GET /{media-id} with bearer token -> short-lived URL
// 3) Download immediately to S3/GCS with server-side encryption
// 4) Persist metadata (sha256, mime, size, expiry) and rotate to internal URL
```

---

Review this document quarterly, focusing on pricing updates and On-Prem EOL changes.
