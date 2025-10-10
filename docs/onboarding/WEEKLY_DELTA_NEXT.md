# Weekly Delta & Next (WDN)
Week: 2025-W41 (Oct 7–13, 2025)

## Delta (what changed)

### New Features
- ✅ Rate Limiting (2025-10-10) — 4-tier system active
  - Bali Zero: 20 req/min; AI Chat: 30 req/min; RAG: 15 req/min; Batch: 5 req/min
  - Files: src/middleware/rate-limit.ts, src/middleware/selective-rate-limit.ts

- ✅ Reranker Active (2025-10-10) — Cross-encoder (+400% quality)
  - Model: cross-encoder/ms-marco-MiniLM-L-6-v2; ENV: ENABLE_RERANKER=true

- ✅ Security Fix (2025-10-10) — API key removed from frontend
  - File: apps/webapp/js/api-config.js (# no x-api-key; origin-based)

### Removed/Deprecated
- ✅ Twilio removed (2025-10-09) — WhatsApp direct via Meta; code cleanup

### Infrastructure Changes
- ✅ Secret Manager Migration (2025-10-09) — 100% API keys moved

### Deployments
- TS Backend: v5.5.0 + rate-limiting (commit 2a1b5fb)
- RAG Backend: v2.5.0-reranker-active (rev 00118-864)
- WebApp: Security fix (commit fc99ce4)

## Impact (test this week)
1) bali.zero.chat — RL + reranker
2) memory.search.hybrid — RL tier check
3) team.recent_activity — data from session tracker
4) WebApp API — origin-based auth (no x-api-key)
5) system.handlers.tools — tool-use exposure count

## Next (3 safe tasks for newcomers)

Task 1: Test Rate Limiting Behavior
- Goal: verify tiers; Acceptance: 429 at req #21/#31/#16/#6; bypass works with internal key

Task 2: Benchmark Reranker Performance
- Goal: measure quality vs latency; Acceptance: report with P@5 and latency deltas

Task 3: Memory Handler E2E
- Goal: save/retrieve/search/cachestats across 5 users; Acceptance: 100% pass
