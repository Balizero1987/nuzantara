# NUZANTARA — Intelligent Business Platform

## 🤖 AI Models (Updated: 14 ottobre 2025)

| AI | Model | Status | Endpoint |
|----|-------|--------|----------|
| **ZANTARA** | Llama 3.1 8B (Fine-tuned) | ✅ Active | [zantara.balizero.com](https://zantara.balizero.com/) |
| **DevAI** | Qwen 2.5 Coder 7B (Fine-tuned) | ✅ Active | [zantara.balizero.com/devai](https://zantara.balizero.com/devai/) |

**Complete AI Info**: `docs/AI_MODELS_INFO.md`

---

## 🌍 Deployment Environments

| Environment   | Region          | URL                                                                                     | Version | Notes |
|---------------|-----------------|------------------------------------------------------------------------------------------|---------|-------|
| Primary       | europe-west1    | https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app | v5.2.0  | Cloud Run (latest) |
| Stable        | asia-southeast2 | https://zantara-bridge-v2-prod-1064094238013.asia-southeast2.run.app                    | v4.0.0  | LTS runtime |
| Local Dev     | localhost       | http://localhost:8080                                                                    | dev     | `npm run dev` / `npm start` |

- Dettagli e storico: `docs/adr/ADR-001-runtime-endpoints.md`.
- Per note infrastrutturali e best practice: cartella `docs/`.

## Documentation Index
- Project Context: `.claude/PROJECT_CONTEXT.md`
- Session INIT: `.claude/INIT.md`
- Handovers Index: `.claude/handovers/INDEX.md`
- LLAMA 4 Fine-Tuning: `docs/llama4/` (Quick Start, Full Guide, README)
- Backend TypeScript: `.claude/handovers/backend-typescript.md`
- RAG Backend: `.claude/handovers/deploy-rag-backend.md`
- WebApp: `.claude/handovers/frontend-ui.md`
- Deploy: `.claude/handovers/deploy-backend.md`, `.claude/handovers/deploy-webapp.md`
- WebSocket: `.claude/handovers/websocket-implementation-2025-10-03.md`
- Security: `.claude/handovers/security.md`, `.claude/handovers/security-audit.md`


## OAuth2 Secret Handling (v5.2.0)
- Set `USE_OAUTH2=true` on Cloud Run to enable Google Workspace handlers.
- Provide the token JSON via `OAUTH2_TOKENS_JSON` (recommended: link the Secret Manager secret `OAUTH2_TOKENS`).
- Optional: override the on-disk location with `OAUTH2_TOKENS_FILE` (defaults to `./oauth2-tokens.json`).
- The runtime entrypoint writes `OAUTH2_TOKENS_JSON` to `OAUTH2_TOKENS_FILE` and symlinks `./oauth2-tokens.json` for legacy handlers.
- When rotating tokens, update the Secret and redeploy so the entrypoint refreshes the file.
