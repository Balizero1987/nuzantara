# ZANTARA v5.2.0 – Production Environment Variables

This template consolidates every environment variable the v5.2.0 stack reads at runtime. Use it to populate Secret Manager entries and Cloud Run `--set-env-vars` / `--set-secrets` flags. Defaults mirror the development `.env` while highlighting secrets and optional toggles.

## Core Server

| Variable | Required | Example / Default | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | yes | `production` | Must be `production` in Cloud Run. |
| `PORT` | yes | `8080` | Cloud Run listens on 8080. |
| `OWNER_EMAIL` | optional | `zero@balizero.com` | Used for contact metadata only. |
| `CACHE_MODE` | optional | `conservative` | Honoured by deployment scripts; no direct code usage yet. |
| `MIN_INSTANCES` | optional | `1` | Only used in `cloud-run-config.yaml`. |

## RBAC & API Keys

| Variable | Required | Example / Default | Notes |
| --- | --- | --- | --- |
| `API_KEYS_INTERNAL` | yes | `zantara-internal-dev-key-2025` | Comma-separated list; grants "internal" role. |
| `API_KEYS_EXTERNAL` | yes | `zantara-external-dev-key-2025` | Comma-separated list; grants "external" role. |
| `API_KEY` | legacy | *(store in Secret Manager)* | Needed only for legacy `server.ts` endpoints; safe to keep for backward compatibility. |

## AI Provider Credentials

| Variable | Required | Example / Default | Notes |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | yes | *(Secret Manager: `openai-api-key`)* | Used by both TS handlers and legacy bridge. Keep unquoted to avoid dotenv truncation. |
| `OPENAI_API_KEY_FULL` | optional | *(same as above)* | Fallback when `OPENAI_API_KEY` is truncated. |
| `ANTHROPIC_API_KEY` | yes (if Claude enabled) | *(Secret Manager: `anthropic-api-key`)* | Required for `claude.chat`. |
| `GEMINI_API_KEY` | yes (if Gemini enabled) | *(Secret Manager: `gemini-api-key`)* | Required for Gemeni + memory semantics. |
| `COHERE_API_KEY` | yes (if Cohere enabled) | *(Secret Manager: `cohere-api-key`)* | Required for `cohere.chat`. |
| `AI_MAX_TOKENS` | optional | `1024` | Overrides adaptive token limits. |
| `AI_ROUTER_STRICT` | optional | `true` / `false` | Forces deterministic provider routing. |

## Google Cloud / Firebase

| Variable | Required | Example / Default | Notes |
| --- | --- | --- | --- |
| `GOOGLE_PROJECT_ID` | yes | `involuted-box-469105-r0` | Firestore client (`memory.ts`). |
| `FIREBASE_PROJECT_ID` | yes | `involuted-box-469105-r0` | Controls Firebase Admin bootstrap (`src/index.ts`). |
| `GOOGLE_APPLICATION_CREDENTIALS` | yes | `/app/zantara-v2-key.json` | Path to mounted service-account JSON in container. |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | optional | `{"type":"service_account",...}` | JSON string alternative when no file mount is possible. |
| `IMPERSONATE_USER` | optional | `ops@balizero.com` | Enables domain-wide delegation for Workspace APIs. |

## Google OAuth2 / Workspace

| Variable | Required | Example / Default | Notes |
| --- | --- | --- | --- |
| `GOOGLE_OAUTH_CLIENT_ID` | yes (OAuth flows) | `8361.apps.googleusercontent.com` | Stored in Secret Manager (`google-oauth-client-id`). |
| `GOOGLE_OAUTH_CLIENT_SECRET` | yes (OAuth flows) | *(Secret Manager: `google-oauth-client-secret`)* | Required for refresh tokens. |
| `GOOGLE_CLIENT_SECRET` | legacy | *(Secret Manager: `google-oauth-client-secret`)* | Legacy code expects this alias; mirror the OAuth secret. |
| `GOOGLE_OAUTH_REDIRECT_URI` | yes (OAuth flows) | `https://zantara.example/auth/callback` | Must match Google Console configuration. |
| `GOOGLE_REDIRECT_URI` | legacy | same as above | Legacy config loader reads this key. |
| `GOOGLE_CLIENT_ID` | optional | same as above | Legacy router checks this for Drive UI endpoints. |
| `DRIVE_FOLDER_ID` | optional | `1aBc...` | Default AMBARADAM folder for document handlers. |
| `GDRIVE_AMBARADAM_DRIVE_ID` | optional | `0AFx...` | Alternative shared drive identifier. |
| `ZANTARA_SHARED_DRIVE_ID` | optional | `0AGx...` | Used by folder diagnostics endpoint. |
| `SA_GMAIL_KEY` | optional | *(JSON string)* | Required for Gmail impersonation in Google Chat commands. |
| `GMAIL_SENDER` | optional | `ops@balizero.com` | From address when Gmail impersonation active. |
| `GOOGLE_CHAT_WEBHOOK_URL` | optional | `https://chat.googleapis.com/...` | Enables notification handlers in legacy bridge. |
| `CHAT_AUDIENCE` | optional | Cloud Run URL | Validates Google Chat webhook JWT audience. |

## Observability & Integrations

| Variable | Required | Example / Default | Notes |
| --- | --- | --- | --- |
| `SLACK_WEBHOOK_URL` | optional | `https://hooks.slack.com/...` | For Slack notification handlers. |
| `DISCORD_WEBHOOK_URL` | optional | `https://discord.com/api/webhooks/...` | For Discord notification handlers. |
| `REDIS_URL` | optional | `redis://10.0.0.5:6379` | Enables L2 cache (`cache.js`). Without it, cache falls back to in-memory mode. |

## Auxiliary / Legacy Toggles

| Variable | Required | Example / Default | Notes |
| --- | --- | --- | --- |
| `OPENAI_MODEL` | optional | `gpt-4o` | Used by legacy `config.ts`; modern handlers set model per request. |
| `GOOGLE_SCOPES` | optional | Workspace scopes list | Legacy OAuth tooling fallback. |
| `GOOGLE_OAUTH_TOKENS_SECRET` | optional | `zantara-google-oauth-tokens` | Secret name for storing OAuth refresh tokens. |
| `GCP_PROJECT_ID` | optional | `involuted-box-469105-r0` | Alias for `GOOGLE_PROJECT_ID` in legacy scripts. |
| `DASHBOARD_PORT` | optional | `3001` | Port for standalone dashboard server. |
| `SKIP_AUTH` | dev only | `true` | Allows `/call` access without API key when `NODE_ENV=development`. |
| `DISASTER_RECOVERY_MODE` | optional | `true` / `false` | Enables failover logic in DR scripts / infra templates. |
| `REGION` | optional | `europe-west1` | Used by deployment scripts (not read by runtime). |

## Deployment Notes

- Prefer storing secrets in Google Secret Manager and mapping them with `--set-secrets`, in line with `deploy-production-oauth2.sh`.
- Mount the service-account JSON (`GOOGLE_APPLICATION_CREDENTIALS`) as a read-only volume in Cloud Run or bake it into the image only for non-production builds.
- Verify that `oauth2-tokens.json` (if used) is mounted securely when Workspace OAuth refresh tokens are required.
- Keep `PORT=8080`; Cloud Run ignores other values and expects 8080 internally.
- For blue/green or zero-risk scripts, make sure any additional variables they set (`CACHE_MODE`, `MIN_INSTANCES`) are present where referenced.

## Quick Secret Manager Checklist

| Secret Manager Entry | Maps To | Notes |
| --- | --- | --- |
| `openai-api-key` | `OPENAI_API_KEY` / `OPENAI_API_KEY_FULL` | Single secret can feed both vars. |
| `anthropic-api-key` | `ANTHROPIC_API_KEY` | Required for Claude. |
| `gemini-api-key` | `GEMINI_API_KEY` | Needed for Oracle + memory semantics. |
| `cohere-api-key` | `COHERE_API_KEY` | Optional but recommended for redundancy. |
| `api-key` | `API_KEY` | Legacy fallback.
| `google-oauth-client-id` | `GOOGLE_OAUTH_CLIENT_ID` | Use Secret Manager or Config Map. |
| `google-oauth-client-secret` | `GOOGLE_OAUTH_CLIENT_SECRET` | Mark as secret. |
| `gmail-service-account` | `SA_GMAIL_KEY` | Store JSON payload. |

Once populated, run:

```bash
gcloud run deploy zantara-v520-prod \
  --image gcr.io/involuted-box-469105-r0/zantara-bridge:v520-prod \
  --region europe-west1 \
  --platform managed \
  --service-account zantara-bridge-v2@involuted-box-469105-r0.iam.gserviceaccount.com \
  --set-env-vars NODE_ENV=production,PORT=8080,FIREBASE_PROJECT_ID=involuted-box-469105-r0,GOOGLE_PROJECT_ID=involuted-box-469105-r0 \
  --set-secrets OPENAI_API_KEY=openai-api-key:latest,ANTHROPIC_API_KEY=anthropic-api-key:latest,GEMINI_API_KEY=gemini-api-key:latest,COHERE_API_KEY=cohere-api-key:latest,API_KEY=api-key:latest
```

Add extra `--set-env-vars` entries for optional Workspace values (`DRIVE_FOLDER_ID`, `IMPERSONATE_USER`, etc.) as needed.
