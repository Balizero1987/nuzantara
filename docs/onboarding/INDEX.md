# Onboarding Index

Use these reports to get new contributors productive in 60–90 minutes.

- Orientation One‑Pager (O1): docs/onboarding/ORIENTATION_ONE_PAGER.md
- New Joiner Report (NJR): docs/onboarding/NEW_JOINER_REPORT.md
- Capability Map Digest (CMD): docs/onboarding/CAPABILITY_MAP_DIGEST.md
- First 90 Minutes (F90): docs/onboarding/FIRST_90_MINUTES.md
- Weekly Delta & Next (WDN): docs/onboarding/WEEKLY_DELTA_NEXT.md

Maintainers: Core team (update on major changes)

Quick Start
- Prerequisites: bash, curl, jq
- Env: export KEY=<internal-dev-key>
- Run smoke test: KEY=$KEY scripts/onboarding_smoke.sh
- Health: GET /health (TS, RAG)

Security & Secrets
- Never commit keys in repo; use env/Secret Manager.
