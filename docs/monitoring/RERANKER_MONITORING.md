# Reranker Monitoring

This folder documents how to continuously verify that the RAG re-ranker is enabled in production and alert when it isn’t.

## Health Signal

Production `/health` returns:

```json
{
  "reranker": true,
  "enhancements": { "cross_encoder_reranking": true }
}
```

Backend gating: `ENABLE_RERANKER=true` (Cloud Run env var).

## Local Check

Script: `scripts/check_reranker.sh`

```bash
PROJECT=involuted-box-469105-r0 REGION=europe-west1 SERVICE=zantara-rag-backend \
  bash scripts/check_reranker.sh
```

Exit codes:
- 0: OK (re-ranker active)
- 2: Health unreachable
- 3: Re-ranker inactive

## CI Monitor (GitHub Actions)

Workflow: `.github/workflows/monitor-reranker.yml`

- Schedule: hourly
- Auth: uses `secrets.GCP_SA_KEY` (JSON) to read Cloud Run service URL
- Fails if `reranker!=true` and opens a GitHub Issue

Manual run:

```bash
gh workflow run monitor-reranker.yml
```

## Optional Alerts

Add a Slack incoming webhook as `SLACK_WEBHOOK_URL` secret and extend the workflow with a notification step on failure.

