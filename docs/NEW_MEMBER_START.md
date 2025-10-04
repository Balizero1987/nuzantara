# ZANTARA v5.2.0 – New Member Quickstart

## Project Context
- **Branch**: ChatGPT Patch (v5.2.0) located at `/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch/`
- **Legacy Reference**: v4.0.0 lives at `/Users/antonellosiano/Desktop/zantara-bridge/`
- **Scope**: TypeScript backend with RBAC keys, Ambaradam identity, Zod validation, Firestore memory store, 10 ZARA collaborative intelligence handlers.
- **Frontend**: Live separately in `~/Desktop/zantara-web-app` (kept outside repo to avoid repo bloat and conflicting build chains).

## First-Day Checklist
1. Read `AI_START_HERE.md` for architecture highlights and immediate tasks.
2. Skim `HANDOVER_LOG.md` (latest updates) and `TODO_CURRENT.md` (active work items).
3. Install dependencies if needed: `npm install`.
4. Verify environment:
   ```bash
   npm run health-check   # requires server running on :8080
   npm start              # launches dev server (Ctrl+C to stop)
   ```
5. Review `TEST_SUITE.md` for mandatory test coverage expectations.
6. Confirm access to OAuth tokens (`oauth2-tokens.json`) and Firebase service account (`zantara-v2-key.json`).

## Environment Requirements
- Node.js 18+
- Local Firestore emulator not required (project uses service account file).
- Ensure `x-api-key` header values (internal/external) from `AI_START_HERE.md` when hitting `/call` endpoints.
- For Google Workspace handlers, OAuth tokens must be refreshed periodically (see handover log entries dated 2025-09-26).

## Testing & Validation
- Quick checks: `npm run health-check`, `npm run test:working` (see scripts in `package.json`).
- Comprehensive coverage: `./test-all-handlers.sh` or specific scripts documented in `TEST_SUITE.md`.
- Any successful manual/API test must be documented back into `TEST_SUITE.md` per team rule.

## Key References
- `ZANTARA_COMPLETE_SYSTEM_v2.md` – full system map.
- `ZANTARA_BEST_PRACTICES_2025.md` – coding and operational guidelines.
- `ZANTARA_COHERENCE_ANALYSIS.md` – rationale for collaborative intelligence handlers.
- `docs/` folder – detailed ADRs, engineering notes, and setup guides.

## Collaboration Notes
- Backend and web app repos remain decoupled; coordinate via README link or this document when cross-referencing frontend work.
- Record changes and new learnings in `HANDOVER_LOG.md` to keep continuity across AI/dev sessions.
- When in doubt, ping the bridge/tech owner (`team.get` handler key `zero`) for escalation paths.

Welcome aboard! Keep this document updated as onboarding evolves.
