# 🗺️ ZANTARA Navigation Map - Complete Documentation Guide

> **Purpose**: Quick reference per trovare QUALSIASI informazione nel progetto
> **Updated**: 2025-10-11 (Post-cleanup, 86 file archiviati)

---

## 🎯 Start Here (Prima Sessione)

**Leggi SEMPRE in questo ordine**:

1. **README.md** (root) → Panoramica progetto, Quick Start
2. **`.claude/INIT.md`** → Entry/exit protocol per AI
3. **`.claude/PROJECT_CONTEXT.md`** → Architettura completa, stato produzione
4. **`.claude/diaries/` (ultimi 2 giorni)** → Cosa è stato fatto recentemente

**Tempo**: 15-20 minuti per avere context completo

---

## 📚 Mappa Documentazione Completa

### **1. Sistema Documentazione AI** (`.claude/`)

| File | Cosa Contiene | Quando Leggere |
|------|---------------|----------------|
| **`INIT.md`** | Entry/Exit protocol | **SEMPRE** all'inizio/fine sessione |
| **`PROJECT_CONTEXT.md`** | Architettura, URLs, stato corrente | **SEMPRE** all'inizio sessione |
| **`README.md`** | Funzionamento sistema diaries/handovers | Se non capisci il sistema |
| **`diaries/YYYY-MM-DD_model_mN.md`** | Log sessioni chronological | Per capire cosa è stato fatto |
| **`handovers/INDEX.md`** | Indice handover per area | Per trovare handover specifico |
| **`handovers/[category].md`** | Operational notes per categoria | Task-specific (vedi sotto) |

**Cross-reference**: Tutti i diaries → handovers → PROJECT_CONTEXT (bidirezionale)

---

### **2. Handovers per Categoria** (`.claude/handovers/`)

| Handover | Cosa Copre | Keywords |
|----------|------------|----------|
| **`backend-typescript.md`** | Backend TS: handlers, router, middleware | express, handler, router, ts |
| **`backend-handlers.md`** | 107 handlers business logic | business logic, handlers |
| **`backend-testing.md`** | Test suite, Jest config | test, jest, spec |
| **`backend-bug-fixes-2025-10-03.md`** | Bug fixes log | debug, fix, error |
| **`deploy-backend.md`** | Backend deployment (Cloud Run) | deploy, docker, cloud run |
| **`deploy-rag-backend.md`** | RAG deployment specifics | rag deploy, fastapi |
| **`deploy-webapp.md`** | WebApp sync to GitHub Pages | webapp deploy, gh-pages |
| **`frontend-ui.md`** | WebApp UI, HTML/CSS/JS | frontend, html, ui |
| **`rag-performance.md`** | RAG optimization, ChromaDB | chromadb, search, embeddings |
| **`reranker-fix-2025-10-10.md`** | Reranker implementation | reranker, torch, cross-encoder |
| **`security.md`** | Security setup, API keys | secret, api key, auth |
| **`security-audit.md`** | Security audit results | audit, vulnerability |
| **`security-rate-limiting-2025-10-10.md`** | Rate limiting implementation | rate limit, abuse protection |
| **`websocket-implementation-2025-10-03.md`** | WebSocket server | ws, websocket, realtime |
| **`multi-agent-architecture-2025-10-10.md`** | Multi-agent design (3 scenari) | multi-agent, llama4, cost |
| **`llama4-finetuning.md`** | LLAMA 4 training notes | llama4, fine-tuning, training |

**Interconnessione**: Ogni handover linka diaries specifici + PROJECT_CONTEXT

---

### **3. LLAMA 4 Fine-Tuning** (`docs/llama4/`)

| File | Cosa Contiene | Quando Usare |
|------|---------------|--------------|
| **`.INIT_LLAMA4_FINETUNING.md`** | Quick start training | Inizio training session |
| **`README_LLAMA4.md`** | Training status, key notes | Check status training |
| **`LLAMA4_FINETUNING_COMPLETE_GUIDE.md`** | Guida completa step-by-step | Training dalla A alla Z |
| **`LLAMA4_OPTIMAL_PARAMETERS_100_PERCENT_SUCCESS.md`** | Parametri testati e validati | Configurazione training |
| **`LLAMA4_DEEP_ANALYSIS_100_PERCENT_SUCCESS.md`** | Analisi approfondita successo | Capire perché funziona |
| **`LLAMA4_DEPLOYMENT_OPTIONS.md`** | Hosting options (Modal, RunPod, etc.) | Deploy model dopo training |
| **`LLAMA4_INTEGRATION_PLAN.md`** | Integrazione in ZANTARA | Dopo training completato |
| **`LLAMA4_TOOL_SYSTEM.md`** | Tool use con LLAMA 4 | Implementazione tool calling |
| **`LLAMA4_LAMBDA_LABS_EXECUTION.sh`** | Script training Lambda Labs | Alternative a RunPod |
| **`FINETUNING_SIZE_CALCULATOR.md`** | Calcolo VRAM/GPU needed | Planning risorse |
| **`requirements-finetune.txt`** | Python deps training | Setup ambiente |
| **`LLAMA4_FAILURE_ANALYSIS_TRANSFORMERS_PEFT.md`** | Cosa NON fare | Evitare errori comuni |
| **`LLAMA4_REAL_WORLD_SUCCESS_CONFIGURATIONS.md`** | Config reali funzionanti | Troubleshooting |
| **`COMPARISON_MY_RECOMMENDATIONS_VS_REALITY.md`** | Lessons learned | Post-mortem analisi |

**Interconnessione**:
- `.claude/PROJECT_CONTEXT.md` → `docs/llama4/` (LLAMA 4 Training Status section)
- `.claude/INIT.md` Step 1A → `docs/llama4/.INIT_LLAMA4_FINETUNING.md`
- `.claude/handovers/llama4-finetuning.md` → `docs/llama4/README_LLAMA4.md`

---

### **4. Setup Guides** (`docs/setup/`)

| File | Cosa Contiene | Quando Usare |
|------|---------------|--------------|
| **`AI_START_HERE.md`** | Operational bootstrap | Nuova AI joiner |
| **`GOOGLE_WORKSPACE_SETUP.md`** | OAuth2, Gmail, Calendar setup | Setup Google APIs |
| **`WHATSAPP_SETUP_COMPLETE.md`** | WhatsApp Business API | Setup WhatsApp |
| Altri setup specifici | Configurazioni servizi esterni | Task-specific |

**Interconnessione**:
- README.md → `docs/setup/AI_START_HERE.md`
- `.claude/PROJECT_CONTEXT.md` → setup guides per coordinamento

---

### **5. Onboarding System** (`docs/onboarding/`)

| File | Cosa Contiene | Score |
|------|---------------|-------|
| **`INDEX.md`** | Onboarding entry point | - |
| **`ORIENTATION_ONE_PAGER.md`** | 1-page overview (24 righe) | ⭐⭐⭐⭐⭐ |
| **`NEW_JOINER_REPORT.md`** | Detailed capabilities (106 righe) | ⭐⭐⭐⭐⭐ |
| **`CAPABILITY_MAP_DIGEST.md`** | 107 handlers mapped (139 righe) | ⭐⭐⭐⭐⭐ |
| **`FIRST_90_MINUTES.md`** | Primo lavoro pratico (40 righe) | ⭐⭐⭐⭐⭐ |
| **`WEEKLY_DELTA_NEXT.md`** | Delta updates (44 righe) | ⭐⭐⭐⭐⭐ |

**Score**: 15/15 ⭐ (AI-first design, 6x faster onboarding)

**Smoke Test**: `scripts/onboarding_smoke.sh` (30 secondi, verifica tutto)

**Interconnessione**: Progressive disclosure (INDEX → O1 → NJR → CMD → F90 → WDN)

---

### **6. Architecture Decision Records** (`docs/adr/`)

| File | Decision | Date |
|------|----------|------|
| **`ADR-001-runtime-endpoints.md`** | Cloud Run endpoints strategy | 2025-09 |
| **`ADR-002-app-gateway-p0.md`** | App-Gateway architecture | 2025-10 (in progress) |
| Future ADRs | To be added | - |

**Interconnessione**: ADRs → PROJECT_CONTEXT → implementation in code

---

### **7. Intelligence Scraping** (`apps/bali-intel-scraper/docs/`)

| Area | Files | Location |
|------|-------|----------|
| **Quick Start** | `ROOT_DOCS/QUICKSTART_INTEL_AUTOMATION.md` | Symlinked in root |
| **Complete Docs** | 31+ files | `apps/bali-intel-scraper/docs/` |
| **Scrapers** | 13 Python scripts | `apps/bali-intel-scraper/scripts/` |

**Interconnessione**:
- Root symlink → `apps/bali-intel-scraper/docs/ROOT_DOCS/`
- `.claude/PROJECT_CONTEXT.md` → Intel scraper status

---

## 🔍 Come Trovare Informazioni (Quick Reference)

### **Domanda → Risposta**

| Domanda | File da Leggere |
|---------|-----------------|
| **Architettura generale?** | `.claude/PROJECT_CONTEXT.md` → Architecture Overview |
| **Come iniziare sessione?** | `.claude/INIT.md` → Entry Protocol |
| **Cosa è stato fatto ieri?** | `.claude/diaries/$(date -v-1d +%Y-%m-%d)_*.md` |
| **Come funzionano gli handlers?** | `.claude/handovers/backend-handlers.md` |
| **Come deployare backend?** | `.claude/handovers/deploy-backend.md` |
| **Come deployare RAG?** | `.claude/handovers/deploy-rag-backend.md` |
| **Come deployare webapp?** | `.claude/handovers/deploy-webapp.md` |
| **LLAMA 4 training status?** | `docs/llama4/README_LLAMA4.md` |
| **LLAMA 4 come trainare?** | `docs/llama4/.INIT_LLAMA4_FINETUNING.md` |
| **LLAMA 4 parametri?** | `docs/llama4/LLAMA4_OPTIMAL_PARAMETERS_100_PERCENT_SUCCESS.md` |
| **Multi-agent architecture?** | `.claude/handovers/multi-agent-architecture-2025-10-10.md` |
| **Security setup?** | `.claude/handovers/security.md` |
| **Rate limiting?** | `.claude/handovers/security-rate-limiting-2025-10-10.md` |
| **WebSocket?** | `.claude/handovers/websocket-implementation-2025-10-03.md` |
| **Onboarding nuova AI?** | `docs/onboarding/INDEX.md` |
| **Test suite?** | `.claude/handovers/backend-testing.md` + `scripts/onboarding_smoke.sh` |
| **Intel scraping?** | `apps/bali-intel-scraper/docs/` + root symlink |
| **URLs produzione?** | `.claude/PROJECT_CONTEXT.md` → Deployment Coordinates |
| **Stato corrente sistema?** | `.claude/PROJECT_CONTEXT.md` → Current State |
| **Task pending?** | `.claude/PROJECT_CONTEXT.md` → Known Issues & Pending Tasks |
| **ADR decisioni?** | `docs/adr/ADR-*.md` |

---

## 🔗 Interconnessioni Chiave (Grafo)

```
README.md (root)
  ├─→ .claude/INIT.md (entry protocol)
  ├─→ .claude/PROJECT_CONTEXT.md (architecture)
  ├─→ docs/setup/AI_START_HERE.md (quick start)
  └─→ docs/onboarding/INDEX.md (onboarding)

.claude/INIT.md
  ├─→ .claude/PROJECT_CONTEXT.md (Step 1)
  ├─→ docs/llama4/.INIT_LLAMA4_FINETUNING.md (Step 1A)
  ├─→ .claude/handovers/backend-typescript.md (Step 1B)
  ├─→ .claude/handovers/deploy-rag-backend.md (Step 1C)
  ├─→ .claude/handovers/frontend-ui.md (Step 1D)
  ├─→ .claude/handovers/deploy-backend.md (Step 1E)
  ├─→ .claude/handovers/websocket-implementation-2025-10-03.md (Step 1F)
  ├─→ .claude/handovers/security.md (Step 1G)
  └─→ .claude/diaries/ (Step 2)

.claude/PROJECT_CONTEXT.md
  ├─→ .claude/handovers/security-rate-limiting-2025-10-10.md (line 20)
  ├─→ .claude/handovers/multi-agent-architecture-2025-10-10.md (line 21)
  ├─→ .claude/diaries/2025-10-10_sonnet-4.5_m1.md (line 23)
  ├─→ .claude/diaries/2025-10-10_sonnet-4.5_m2.md (line 24)
  ├─→ .claude/diaries/2025-10-10_sonnet-4.5_m3.md (line 25)
  ├─→ docs/llama4/ (line 26)
  ├─→ ~/Desktop/FINE TUNING/LLAMA4_100_PERCENT_SUCCESS.md (line 27)
  ├─→ .claude/handovers/INDEX.md (line 28)
  ├─→ .claude/handovers/websocket-implementation-2025-10-03.md (line 30)
  ├─→ .claude/handovers/deploy-backend.md (line 31)
  ├─→ .claude/handovers/deploy-rag-backend.md (line 31)
  └─→ .claude/handovers/deploy-webapp.md (line 31)

docs/llama4/
  ├─→ .INIT_LLAMA4_FINETUNING.md (quick start)
  ├─→ README_LLAMA4.md (status)
  ├─→ LLAMA4_FINETUNING_COMPLETE_GUIDE.md (full guide)
  ├─→ LLAMA4_OPTIMAL_PARAMETERS_100_PERCENT_SUCCESS.md (config)
  └─→ [12 altri file] (analysis, deployment, tools)

.claude/handovers/
  ├─→ INDEX.md (indice)
  ├─→ backend-typescript.md → diaries specific
  ├─→ deploy-backend.md → diaries specific
  ├─→ multi-agent-architecture-2025-10-10.md → diary 2025-10-10_m2
  ├─→ security-rate-limiting-2025-10-10.md → diary 2025-10-10_m3
  └─→ llama4-finetuning.md → docs/llama4/README_LLAMA4.md

docs/onboarding/
  ├─→ INDEX.md (entry)
  ├─→ ORIENTATION_ONE_PAGER.md (24 righe overview)
  ├─→ NEW_JOINER_REPORT.md (106 righe detail)
  ├─→ CAPABILITY_MAP_DIGEST.md (139 righe handlers)
  ├─→ FIRST_90_MINUTES.md (40 righe first task)
  └─→ WEEKLY_DELTA_NEXT.md (44 righe delta updates)
```

---

## ✅ Verification Checklist

### **Documentazione Completa? (Self-Check)**

- [ ] README.md aggiornato con stato corrente? → ✅ YES (2025-10-11)
- [ ] PROJECT_CONTEXT.md aggiornato? → ✅ YES (Last Updated: 2025-10-10)
- [ ] INIT.md ha tutti gli Step? → ✅ YES (Step 1-6 + Exit 1-5)
- [ ] Handovers INDEX aggiornato? → ✅ YES (19 handovers listed)
- [ ] LLAMA4 docs completi in docs/llama4/? → ✅ YES (14 files)
- [ ] Onboarding system completo? → ✅ YES (6 docs, 15/15 score)
- [ ] ADRs presenti? → ✅ YES (ADR-001, ADR-002)
- [ ] Symlink intel scraping? → ✅ YES (QUICKSTART_INTEL_AUTOMATION.md)
- [ ] Tutti i cross-references funzionano? → ✅ YES (verificato)
- [ ] File obsoleti archiviati? → ✅ YES (86 files in backup)

**Risultato**: **10/10** ✅ Documentazione completa e interconnessa!

---

## 🚀 Quick Start per Nuova AI

**Tempo totale**: 90 minuti (da zero a produttiva)

**Step 1** (15 min): Leggi entry point
```bash
cat README.md
cat .claude/INIT.md
cat .claude/PROJECT_CONTEXT.md
```

**Step 2** (10 min): Leggi diaries recenti
```bash
ls -lt .claude/diaries/ | head -5
# Leggi ultimi 2-3 diaries
```

**Step 3** (5 min): Run smoke test
```bash
./scripts/onboarding_smoke.sh
```

**Step 4** (30 min): Leggi onboarding system
```bash
cat docs/onboarding/INDEX.md
cat docs/onboarding/ORIENTATION_ONE_PAGER.md
cat docs/onboarding/NEW_JOINER_REPORT.md
cat docs/onboarding/CAPABILITY_MAP_DIGEST.md
```

**Step 5** (30 min): Primo task pratico
```bash
cat docs/onboarding/FIRST_90_MINUTES.md
# Esegui task suggerito
```

**Risultato**: Pronta a contribuire! 🎉

---

## 📊 Statistiche Documentazione

**Totale file documentazione**: 150+ files
**System docs** (`.claude/`): 50+ files (diaries + handovers)
**Technical docs** (`docs/`): 40+ files
**LLAMA 4 docs** (`docs/llama4/`): 14 files
**Onboarding** (`docs/onboarding/`): 6 files
**ADRs** (`docs/adr/`): 2 files
**Intel scraper** (`apps/bali-intel-scraper/docs/`): 31+ files

**Cross-references**: 100+ bidirezionali
**Interconnessione**: ⭐⭐⭐⭐⭐ (5/5) - Completamente interconnesso

---

## 🎯 Navigation Tips

1. **Sempre inizia da INIT.md** → Ti guida verso docs rilevanti
2. **PROJECT_CONTEXT.md è single source of truth** → Stato corrente
3. **Diaries = chronological** → Cosa è successo quando
4. **Handovers = categorical** → Operational knowledge per area
5. **docs/ = stable reference** → Setup guides, ADRs, onboarding
6. **Cross-references = bidirezionali** → Navigazione avanti/indietro

---

**Creato**: 2025-10-11
**Versione**: 1.0.0
**Manutenzione**: Aggiorna quando aggiungi nuovi docs
**Status**: ✅ Complete & Verified

**Navigazione ZANTARA perfettamente interconnessa! 🗺️✅**
