# Handover: Monorepo Planning

**Category**: monorepo-planning, migration
**Purpose**: Track monorepo decisions, migration plans, structure design

---

## Latest Updates

### 2025-10-04 16:53 (Verifica allineamento monorepo plan) [sonnet-4.5_m1]

**Verified**:
- FINAL_MONOREPO_PLAN.md: 38 componenti, 6 fasi, 8.5 ore stimato
- COMPLETE_FINAL_REPORT.md: 24 componenti (raggruppati per categoria)
- ALIGNMENT_FINAL_CHECK.md: Allineamento 98% PERFETTO ✅

**Structure Confirmed**:
```
nuzantara/
├── apps/ (8)
│   ├── backend-api, backend-rag, webapp, landing
│   ├── orchestrator, workspace-addon ⭐, dashboard ⭐
│   └── brain, oracle (futuro)
├── packages/ (6)
│   ├── types, tools ⭐, widget ⭐, kb-scripts
│   ├── utils-legacy ⭐, assets ⭐
├── infra/ (3)
│   ├── analytics, terraform, .github/workflows
├── docs/ (4)
│   ├── api (+ openapi ⭐), best-practices ⭐ (192 KB!)
│   ├── adr, architecture, deployment, engineering, setup
├── scripts/ (2)
│   ├── deploy, testing
├── tests/ (1)
│   └── 2 cache tests ⭐
└── configs (5)
    └── .env.example, docker/gcloud ignore, jest, pa11y, chat-local
```

**Decision**:
- ✅ Seguire FINAL_MONOREPO_PLAN per migration
- ✅ Priorità #1: RAG AMD64 re-ranker (GitHub Actions ubuntu-latest)
- ✅ Workflow: Desktop → git push → GitHub Actions → Cloud Run

**Migration Timeline**:
- Phase 1: Setup (30 min)
- Phase 2: Core apps (3 ore) - **RAG AMD64 priorità**
- Phase 3: Supporting apps (2 ore)
- Phase 4: Packages (1 ora)
- Phase 5: Docs/Scripts (1 ora)
- Phase 6: Config/Cleanup (1 ora)
**TOTALE**: 8.5 ore

**Related**:
→ Full session: [.claude/diaries/2025-10-04_sonnet-4.5_m1.md](../diaries/2025-10-04_sonnet-4.5_m1.md#monorepo-verification)
→ Plan: FINAL_MONOREPO_PLAN.md
→ Analysis: COMPLETE_FINAL_REPORT.md
→ Alignment: ALIGNMENT_FINAL_CHECK.md

---

## Decisions Consolidated

### Components to INCLUDE (38):
- ✅ All 8 apps (including 2 NEW: workspace-addon, dashboard)
- ✅ All 6 packages (including 4 NEW: tools, widget, assets, utils-legacy)
- ✅ All infra, docs, scripts, tests, configs

### Components to EXCLUDE (4 obsolete):
- ❌ `/routes/` (legacy server only)
- ❌ `/services/` (duplicato obsoleto)
- ❌ `/static/*.html` (test files)
- ❌ `backend_clean/` (experimental)

### Verifications Completed:
- ✅ `/utils/` ≠ `src/utils/` (FILES DIVERSI, entrambi da includere)
- ✅ `/tests/` = 2 cache tests (18 KB)
- ✅ `/dashboard/` ≠ `/static/dashboard.html` (DIVERSI)
- ✅ Git commits = 749 totali

---

## History

### 2025-10-04 (Previous sessions)
- MONOREPO_DECISION.md created
- PENDING_DECISIONS_REPORT.md created
- FINAL_MONOREPO_PLAN.md created (v2.0)
- COMPLETE_FINAL_REPORT.md created

---

## Next Steps

1. **BACKUP/PUSH** (25 min) - IMMEDIATO
   - Backup locale
   - Commit 38 componenti
   - Push + tag v5.2.0-complete

2. **MIGRATION** (8.5 ore) - Post backup
   - Seguire FINAL_MONOREPO_PLAN 6 fasi
   - Priorità: RAG AMD64 deploy

---

**Last Updated**: 2025-10-04 16:53 CET
