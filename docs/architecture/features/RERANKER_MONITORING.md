# Reranker Monitoring

Questo documento descrive come verificare continuamente che il re‑ranker del RAG sia attivo in produzione e come ricevere alert in caso contrario.

## Segnale di Health

L'endpoint `/health` in produzione espone:

```json
{
  "reranker": true,
  "enhancements": { "cross_encoder_reranking": true }
}
```

Backend gating: variabile di ambiente `ENABLE_RERANKER=true` (Cloud Run).

## Verifica Locale

Script: `scripts/check_reranker.sh`

```bash
PROJECT=involuted-box-469105-r0 REGION=europe-west1 SERVICE=zantara-rag-backend \
  bash scripts/check_reranker.sh
```

Codici uscita:
- 0: OK (re‑ranker attivo)
- 2: Health non raggiungibile
- 3: Re‑ranker non attivo

## Monitor in CI (GitHub Actions)

Workflow: `.github/workflows/monitor-reranker.yml`

- Schedule: hourly
- Auth: `secrets.GCP_SA_KEY` (JSON) per leggere l'URL del servizio Cloud Run
- Fallisce se `reranker!=true` e apre un'Issue automaticamente

Esecuzione manuale:

```bash
gh workflow run monitor-reranker.yml -R Balizero1987/nuzantara
```

## Notifiche opzionali

Aggiungere `SLACK_WEBHOOK_URL` come secret e integrare uno step di notifica su failure.

