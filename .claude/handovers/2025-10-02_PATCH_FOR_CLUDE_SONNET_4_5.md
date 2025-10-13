# PATCH: Identity Recognition + UX Stability (for Claude Sonnet 4.5)

Date: 2025-10-02
Author: Codex CLI

## Context

- Webapp showed “RAG offline” too often (5s timeout, no retry), falling back to canned replies.
- Collaborator recognition (Zero Master, L3) didn’t trigger because the webapp didn’t send `user_email` to the backend, and UI name/avatar weren’t updated when email changed.
- Public users could see explicit “esoteric” wording; this was meant to be Sub Rosa (not surfaced at L0–L1).

## Goals

1) Always recognize collaborators when they log in or type their email in chat.
2) Make connection detection resilient (retry + periodic re-check) and surface identity in the badge.
3) Hide sensitive/esoteric wording for public users (L0–L1) while keeping full depth for L3.

## Changes

Frontend (LIVE via GitHub Pages)
- `zantara_webapp/chat.html`
  - Send `user_email` in POST body to `/bali-zero/chat`.
  - Capture any email typed in chat, persist to `localStorage`, and immediately update UI name/avatar.
  - Health check: 15s timeout + 2 retries (exponential backoff) + periodic re-check (60s).
  - Identity badge: on connect, call `/admin/collaborators/{email}` and show “Connected (v2.0.0-cloud) • Zero Master L3” if recognized.
  - Immediate personalization: if user asks “chi sono?” and identity is known, reply locally with recognized name/level.
  - Sanitize assistant output for L0–L1 (hide sensitive terms like ‘esoteric’, ‘sacred’, ‘Sub Rosa’, etc.).

- `zantara_webapp/login.html`
  - Pre-fill email with `zero@balizero.com` only when no remembered session exists.

Backend (READY for Cloud Run deploy)
- `zantara-rag/backend/app/main_cloud.py`
  - System prompt: removed explicit “esotericism” wording; focus on culture, law, business.
  - Add `/admin/collaborators/{email}` endpoint to fetch profile + Sub Rosa L.
  - Personalize answers when collaborator recognized (prefix greeting with Ambaradam name, language-aware).
  - Heuristic fallback: infer `zero@balizero.com` if user writes “sono Zero/Zero Master” (only if `user_email` missing).
  - Sanitize responses for L0–L1 on server-side (mirror of frontend), keeping L2–L3 intact.

## File References (key spots)

- Webapp email → backend:
  - `Desktop/NUZANTARA/zantara_webapp/chat.html:900` (request body includes `user_email`).

- Health + badge:
  - `Desktop/NUZANTARA/zantara_webapp/chat.html:620` (HEALTH config, monitor, badge updates).

- Local identity reply + client greeting:
  - `Desktop/NUZANTARA/zantara_webapp/chat.html:870` (immediate “chi sono?” reply when recognized).

- Login default email (non-remembered):
  - `Desktop/NUZANTARA/zantara_webapp/login.html:600`.

- Backend personalization + sanitization:
  - `Desktop/NUZANTARA/zantara-rag/backend/app/main_cloud.py:240` (SYSTEM_PROMPT revised).
  - `Desktop/NUZANTARA/zantara-rag/backend/app/main_cloud.py:340` (`/bali-zero/chat` flow: identify → memory → attunement → search → answer).
  - `Desktop/NUZANTARA/zantara-rag/backend/app/main_cloud.py:560` (admin endpoints, including `/admin/collaborators/{email}`).

## Deployment Notes

- Frontend is LIVE (GitHub Pages push completed). Hard refresh to bypass CDN cache.
- Backend needs Cloud Run deploy to activate server-side personalization/sanitization:
  - Build: `gcloud builds submit --tag gcr.io/involuted-box-469105-r0/zantara-rag-backend:v10-ci`
  - Deploy: `gcloud run deploy zantara-rag-backend --image gcr.io/involuted-box-469105-r0/zantara-rag-backend:v10-ci --region europe-west1 --allow-unauthenticated --port 8000 --set-env-vars ANTHROPIC_API_KEY=sk-ant-...`

## Tests

1) Identity recognition
   - Login or type `zero@balizero.com` in chat → badge shows “• Zero Master L3”.
   - Ask “chi sono?” → immediate client reply with recognized identity; backend reply adds greeting after deploy.

2) Connection stability
   - Health check tolerates cold start; auto-recovers without page reload.

3) Content sanitization
   - Incognito (L0): assistant output does not contain explicit ‘esoteric’ wording.
   - L3 (Zero Master): full depth preserved.

## Why (Rationale)

- Minimize friction: identity set once (login or typed), then used automatically.
- UX stability: avoid false “offline” and fallback responses due to short timeouts.
- Respect Sub Rosa: sensitive language not surfaced to public users, while advanced users get full detail.

---

Note for Claude Sonnet 4.5 (context):
This patch tightened identity wiring between frontend and backend, improved health/UX resilience, and enforced content presentation by access level. No model prompts were added that reveal sensitive terms to public users; depth is preserved for recognized collaborators.

