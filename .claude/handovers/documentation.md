# Handover: Documentation & Workflow

**Category**: documentation, workflow, onboarding
**Purpose**: Track documentation updates, workflow definitions, team guides

---

## Latest Updates

### 2025-10-04 16:53 (Workflow futuro + exit protocol) [sonnet-4.5_m1]

**Documented**:

**1. Workflow Futuro** ✅
```
Desktop (sviluppo locale)
    ↓
git add . && git commit -m "..." && git push
    ↓
GitHub Actions (automatico!)
    ├── ubuntu-latest (AMD64) ← Fix re-ranker
    ├── docker build --platform linux/amd64
    ├── docker push a GCR
    └── gcloud run deploy
    ↓
Cloud Run (production)
    └── App live (3 minuti)
```

**Vantaggio**: Zero comando Docker manuale, tutto automatico, AMD64 corretto

**2. "App Live" Definito** ✅
- **Live** = Deployed su Cloud Run, accessibile da internet
- **NON** = Codice solo sul Desktop
- Esempio: https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app

**3. Exit Protocol Completo** ✅
- Entry: Leggi `.claude/INIT.md`
- Durante: Logga in diary real-time
- Exit: Completa diary + aggiorna handovers + mostra summary

**Files Referenced**:
- `.claude/INIT.md` (già esistente, 199 lines)
- Entry/Exit protocol già documentato
- Workflow spiegato semplicemente

**Related**:
→ Full session: [.claude/diaries/2025-10-04_sonnet-4.5_m1.md](../diaries/2025-10-04_sonnet-4.5_m1.md#workflow-documentation)
→ Protocol: .claude/INIT.md

---

## Workflow Reference

### Development Workflow (CON Monorepo)
```bash
# 1. Sviluppo locale
cd ~/Desktop/NUZANTARA
# modifica codice, test locale

# 2. Push
git add .
git commit -m "fix: description"
git push

# 3. GitHub Actions fa tutto (automatico)
# - Build AMD64
# - Push GCR
# - Deploy Cloud Run

# 4. App live in 3 minuti ✅
```

### Session Workflow (Per nuovi agenti)
```
INIZIO:
  1. User: "Leggi .claude/INIT.md"
  2. Agent: Legge PROJECT_CONTEXT + diaries + chiede task
  3. Agent: Crea diary + logga real-time

DURANTE:
  - Logga azioni in diary
  - Timestamp + files modified
  - Code snippets + problemi

FINE:
  1. User: "Ho finito, aggiorna tutto"
  2. Agent: Completa diary
  3. Agent: Aggiorna handovers
  4. Agent: Mostra summary
```

---

## Documentation Files

### Session System
- `.claude/INIT.md` - Entry/Exit protocol (199 lines)
- `.claude/PROJECT_CONTEXT.md` - Architecture + URLs (274 lines)
- `.claude/diaries/` - Session logs (31 sessions, Oct 1-4)
- `.claude/handovers/` - Category handovers (10+ files)

### Project Documentation
- `docs/` - 86+ markdown files
  - `api/` - API docs + openapi spec ⭐
  - `best-practices/` - 192 KB, 27 files ⭐⭐⭐
  - `adr/` - Architecture decisions
  - `architecture/`, `deployment/`, `engineering/`, `setup/`
- Root markdown - 24 files (guides, status, reports)

---

## History

### 2025-10-04
- INIT.md protocol verified
- Workflow futuro documentato
- Exit protocol spiegato a utente

### 2025-10-01 - 2025-10-03 (m1-m24)
- 31 diaries created
- 10+ handovers created
- PROJECT_CONTEXT maintained

---

**Last Updated**: 2025-10-04 16:53 CET

### 2025-10-08 10:20 (INIT/Docs alignment + indices) [chatgpt_m3]

**Changed**:
- INIT.md: LLAMA4 Quick Start; multi Quick Starts (TS, RAG, WebApp, Deploy, WS, Security); closure LLAMA4
- PROJECT_CONTEXT.md: added Documentation Pointers (LLAMA4, handover index)
- docs/README.md: anchors + quick links; README.md (root) added Documentation Index

**Related**:
- Diary: `.claude/diaries/2025-10-08_sonnet-4.5_m3.md`
