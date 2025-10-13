# Zantara Bridge — Business Integration & Google Workspace Best Practices

## 0) Leggi non negoziabili
- Idempotenza ovunque c’è rete: chiavi idempotenti, consumer resilienti (at-least-once è lo standard).
- Webhook firmati e verificati: rifiuta payload senza firma valida, solo HTTPS.
- Secret fuori dal codice: Secret Manager + IAM stretto + audit logging.
- Tracce, log, metriche correlati: OpenTelemetry con trace ↔ log link.
- SLO espliciti: availability, p95, error budget; fall-fast + DLQ.

## 1) Pagamenti (Stripe)
- PaymentIntents (non Charges), idempotency key su ogni POST.
- Stripe Checkout per SAQ A / SCA quando possibile.
- Webhook: verifica Stripe-Signature, processa idempotente, registra event.id.
- Marketplace: usa Stripe Connect (hosted/embedded onboarding, KYC fatto).

_Note_: crea PaymentIntent quando l’importo è definitivo; conferma lato server; retry con backoff.

## 2) CRM Integration
### Salesforce
- Bulk API 2.0 per > 2k record; sotto, REST Composite.
- Real-time: Change Data Capture, monitora retention.
- Control limits via `/limits` endpoint.

### HubSpot
- Private App token o OAuth; scope minimi.
- Rate limit: 190 richieste/10s (Pro/Enterprise) → token bucket + backoff 429.
- Associazioni v3/v4 con bulk + label.

## 3) Email & SMS
### Email (SendGrid / Mailgun)
- SPF + DKIM + DMARC obbligatori, one-click unsubscribe, TLS.
- Event Webhook firmato: verifica Ed25519 (SendGrid) o HMAC SHA256 (Mailgun) con anti-replay.

### SMS (Twilio / Vonage)
- A2P 10DLC: registra brand/campaign prima di inviare negli USA.
- Verifica X-Twilio-Signature / Vonage-Signature.
- Mittente coerente: Sticky Sender, throttling per mercato/carrier.

## 4) Scheduling (tipo Calendly)
- Google Calendar push + sync incrementale: `watch` + `syncToken`; su 410 Gone fai full resync.
- Round-robin & buffer: supporta strategie “massimizza disponibilità” o “equal distribution”.

## 5) Documenti & Firme
- PDF complessi: Puppeteer (headless Chrome), gestisci timeout e pool.
- E-signature: DocuSign Connect con HMAC (X-DocuSign-Signature-1 + digest), invalid signature → 401.

## 6) Workflow & Async (GCP)
- Cloud Tasks: handler idempotente, ack 2xx; attendi retry.
- Pub/Sub: ack dopo elaborazione, DLQ configurata.
- Scheduler → HTTP: autenticare con OIDC service account verso Cloud Run/API.

## 7) Analytics (Mixpanel / Amplitude)
- Tracking plan prima del codice: eventi, proprietà, tassonomia versionata.
- Governance: seguire linee guida Amplitude (goal → event → property) per evitare duplicati.

## 8) Google Workspace avanzato
### Apps Script
- Batch read/write (Sheets), minimizza roundtrip, CacheService per hot data.
- LockService per sezioni critiche.
- Controlla quote e gestisci job lunghi, triggers installabili solo dove servono.

### API Management
- Endpoints (ESPv2) vs API Gateway: ESPv2 → proxy gestito da te; API Gateway → managed serverless.

### Firebase
- Security Rules non si applicano all’Admin SDK: proteggere lato server con IAM.
- Evita hotspot negli ID.

### Vertex AI
- In produzione: abilita Model Monitoring (skew/drift), usa Model Registry, configura safety filters se generativo.

## 9) Osservabilità
- OTel SDK/Collector → Cloud Ops (metriche/traces/logs) con correlazione traceId/spanId.
- Alert su SLO (non su singoli errori).

## 10) Checklist “ready for prod”
### Webhook
- [ ] Firma verificata (lib ufficiale)
- [ ] Idempotenza su `event.id` / digest
- [ ] Retry & DLQ attivi
- [ ] Timeout < retry window provider

### Pagamenti
- [ ] PaymentIntents + 3DS
- [ ] Checkout (PCI light)
- [ ] Connect onboarding (se piattaforma)

### CRM
- [ ] Bulk API 2.0 per carichi grandi
- [ ] CDC per near-real-time
- [ ] Rate limit aware (190/10s HubSpot)

### Email/SMS
- [ ] SPF/DKIM/DMARC + unsubscribe
- [ ] Firma webhook SendGrid/Mailgun
- [ ] A2P 10DLC registrato (USA)

### GCP Async
- [ ] Cloud Tasks handler idempotente + ack 2xx
- [ ] Pub/Sub DLQ configurata
- [ ] Scheduler→HTTP con OIDC SA

### Workspace
- [ ] Apps Script: batch, CacheService, LockService
- [ ] Calendar: watch + syncToken + full resync su 410

## 11) Struttura repo (consistenza)
```
/docs/best-practices/SYNTHESIS.md
/docs/best-practices/PLAYBOOKS/
  ├─ webhooks.md
  ├─ stripe.md
  ├─ crm-sync.md
  ├─ gcp-async.md
  └─ analytics.md
```

_Playbook da preparare:_
- `PLAYBOOKS/webhooks.md`: firme (Stripe, Twilio, SendGrid, Mailgun, DocuSign), validazione, retry policy.
- `PLAYBOOKS/stripe.md`: PaymentIntents, SCA, Checkout, Connect.
- `PLAYBOOKS/crm-sync.md`: Bulk vs realtime (CDC), mapping, conflict resolution, limiti.
- `PLAYBOOKS/gcp-async.md`: Cloud Tasks / Pub/Sub / Scheduler con snippet Terraform.
- `PLAYBOOKS/analytics.md`: tracking plan, naming, proprietà obbligatorie.

---

_Nota_: checklist compatta, pronta da estendere con i mini-playbook suggeriti per snippet/interfacce specifiche.
