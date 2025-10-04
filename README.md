# Zantara Bridge — Deployment Snapshot (2025-09-24)

| Environment   | Region          | URL                                                                                     | Version | Notes |
|---------------|-----------------|------------------------------------------------------------------------------------------|---------|-------|
| Primary       | europe-west1    | https://zantara-bridge-v2-prod-himaadsxua-ew.a.run.app (alias https://zantara-bridge-v2-prod-1064094238013.europe-west1.run.app) | v5.2.0  | Cloud Run revision `zantara-bridge-v2-prod-00027-xwr` |
| Stable        | asia-southeast2 | https://zantara-bridge-v2-prod-1064094238013.asia-southeast2.run.app                    | v4.0.0  | LTS runtime |
| ChatGPT Patch | europe-west1    | https://zantara-v520-chatgpt-patch-himaadsxua-ew.a.run.app (alias https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app) | v5.2.0  | Feature branch for GPT actions |
| Local Dev     | localhost       | http://localhost:8080                                                                    | dev     | `npm run dev` / `npm start` |

- Dettagli e storico: `docs/adr/ADR-001-runtime-endpoints.md`.
- Per note infrastrutturali e best practice: cartella `docs/`.


## OAuth2 Secret Handling (v5.2.0)
- Set `USE_OAUTH2=true` on Cloud Run to enable Google Workspace handlers.
- Provide the token JSON via `OAUTH2_TOKENS_JSON` (recommended: link the Secret Manager secret `OAUTH2_TOKENS`).
- Optional: override the on-disk location with `OAUTH2_TOKENS_FILE` (defaults to `./oauth2-tokens.json`).
- The runtime entrypoint writes `OAUTH2_TOKENS_JSON` to `OAUTH2_TOKENS_FILE` and symlinks `./oauth2-tokens.json` for legacy handlers.
- When rotating tokens, update the Secret and redeploy so the entrypoint refreshes the file.
