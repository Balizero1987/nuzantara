# 🚀 CLAUDE CODE SESSION INIT

> **Quando apri una nuova CLI, fai leggere questo file all'AI**

---

## 📋 Entry Protocol

### **Step 1: Read Project Context**
```bash
cat .claude/PROJECT_CONTEXT.md
```
**Contiene**: Architettura, deployment URLs, coordinate GCP, stato corrente

### **Step 1A: LLAMA 4 Quick Start (se rilevante)**
Se la sessione riguarda il fine-tuning di LLAMA 4 per ZANTARA:
```bash
# Preferisci i file nella repo (portabili su GitHub)
cat docs/llama4/.INIT_LLAMA4_FINETUNING.md 2>/dev/null || \
  cat "/Users/antonellosiano/Desktop/FINE TUNING/.INIT_LLAMA4_FINETUNING.md" 2>/dev/null || \
  echo "LLAMA4 Quick Start non trovato"

# Guida completa (prime 120 righe)
sed -n '1,120p' docs/llama4/LLAMA4_FINETUNING_COMPLETE_GUIDE.md 2>/dev/null || \
  sed -n '1,120p' "/Users/antonellosiano/Desktop/FINE TUNING/LLAMA4_FINETUNING_COMPLETE_GUIDE.md" 2>/dev/null || \
  echo "LLAMA4 Guida completa non trovata"

# README di sezione
cat docs/llama4/README_LLAMA4.md 2>/dev/null || \
  cat "/Users/antonellosiano/Desktop/FINE TUNING/README_LLAMA4.md" 2>/dev/null || true
```
Nota: i file LLAMA4 sono ora in `docs/llama4/` (copiati dalla cartella locale "FINE TUNING").

---

### **Step 1B: Backend TypeScript Quick Start**
Per attività su API Express/handlers TS:
```bash
# Handover TS backend (stato, note, hardening)
sed -n '1,120p' .claude/handovers/backend-typescript.md

# Handlers overview e bug fixes
sed -n '1,80p' .claude/handovers/backend-handlers.md
sed -n '1,80p' .claude/handovers/backend-bug-fixes-2025-10-03.md
```

### **Step 1C: RAG Backend (Python) Quick Start**
```bash
# Deploy e integrazione tool use
sed -n '1,120p' .claude/handovers/deploy-rag-backend.md

# Performance/KB
sed -n '1,80p' .claude/handovers/rag-performance.md
```

### **Step 1D: WebApp Quick Start**
```bash
sed -n '1,120p' .claude/handovers/frontend-ui.md
sed -n '1,80p'  .claude/handovers/deploy-webapp.md
```

### **Step 1E: Deploy Backend (TS) Quick Start**
```bash
sed -n '1,120p' .claude/handovers/deploy-backend.md
```

### **Step 1F: WebSocket Quick Start**
```bash
sed -n '1,120p' .claude/handovers/websocket-implementation-2025-10-03.md
```

### **Step 1G: Security & Secrets Quick Start**
```bash
sed -n '1,120p' .claude/handovers/security.md
sed -n '1,80p'  .claude/handovers/security-audit.md
```

---

### **Step 1.5: Verify Git Alignment** 🔍

**CRITICAL: Check desktop ↔ GitHub sync before starting work**

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-2
git status
git fetch origin
git status  # Check if behind/ahead of remote
```

**Expected output (GOOD ✅):**
```
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

**If NOT aligned:**

**Case 1: Uncommitted changes**
```
Changes not staged for commit:
  modified: src/file.ts
```
→ **ACTION**: Ask user: "Ci sono modifiche non committate. Vuoi commitarle prima di iniziare?" (sì/no)

**Case 2: Behind remote**
```
Your branch is behind 'origin/main' by N commits
```
→ **ACTION**: `git pull origin main` (sync desktop with GitHub)

**Case 3: Ahead of remote**
```
Your branch is ahead of 'origin/main' by N commits
```
→ **ACTION**: Ask user: "Ci sono commit non pushati. Vuoi pushare prima di iniziare?" (sì/no)

**Case 4: Diverged**
```
Your branch and 'origin/main' have diverged
```
→ **ACTION**: STOP and ask user how to resolve (likely needs `git pull --rebase`)

⚠️ **NEVER start work with misaligned git state** - always sync first!

---

### **Step 2: Read Recent Diaries**

**Today's sessions**:
```bash
ls -lt .claude/diaries/$(date +%Y-%m-%d)_*.md 2>/dev/null || echo "No sessions today yet"
```

**Yesterday's sessions**:
```bash
ls -lt .claude/diaries/$(date -v-1d +%Y-%m-%d)_*.md 2>/dev/null || echo "No sessions yesterday"
```

**Read all found diaries** (get full context of recent work)

---

### **Step 3: Auto-Detect Session Info**

**Model**: Auto-detect from API (claude-sonnet-4-5-* → "sonnet-4.5", claude-opus-4-* → "opus-4.1")
**Date**: `date +%Y-%m-%d`
**Matricola**: Count today's diaries + 1

**Diary filename**: `.claude/diaries/YYYY-MM-DD_model_mN.md`

Example: `2025-10-01_sonnet-4.5_m3.md` (3rd session today, Sonnet 4.5)

---

### **Step 4: Ask User**

```
🎯 Su cosa lavori in questa CLI?

Esempi:
- "deploy backend"
- "fix bug in routes"
- "add websocket support"
- "test RAG endpoints"

> _
```

---

### **Step 5: Auto-Detect Categories**

Based on user's task description, detect relevant categories:

**Category Keywords**:
- `backend-routes` → ["routes", "endpoint", "api"]
- `backend-handlers` → ["handlers", "business logic"]
- `deploy-backend` → ["deploy", "cloud run", "docker"]
- `deploy-rag` → ["deploy rag", "rag backend"]
- `frontend-api-client` → ["api-config", "fetch", "cors"]
- `rag-chromadb` → ["chromadb", "embeddings", "vector"]
- `debug` → ["fix", "bug", "error"]
 - `llama4-finetuning` → ["llama 4", "qlora", "runpod", "h100", "fine-tuning", "modal"]
 - `backend-typescript` → ["express", "handler", "router", "ts", "typescript"]
 - `backend-rag` → ["fastapi", "rag", "chromadb", "kb", "python"]
 - `webapp` → ["frontend", "html", "vanilla", "ui", "pages"]
 - `deploy-webapp` → ["pages", "gh-pages", "workflow", "sync"]
 - `deploy-backend` → ["cloud run", "github actions", "docker", "workflow"]
 - `websocket` → ["ws", "websocket", "subscribe", "broadcast"]
 - `security` → ["secret", "api key", "permission", "audit"]

**Read only relevant handovers** from `.claude/handovers/[category].md`
(Create handover file if doesn't exist)

---

### **Step 6: Start Work**

- Create diary: `.claude/diaries/YYYY-MM-DD_model_mN.md`
- Log all actions in real-time
- Update diary as you work

---

## ✅ Exit Protocol

When user says "ho finito" / "done" / "chiudi sessione":

### **Step 1: Complete Diary**

Update diary with:
- End time, duration
- Files modified (with line numbers)
- Code snippets implemented
- Problems encountered + solutions + time lost
- Deployments (URLs if any)
- Test results
- Next steps / pending tasks
- Snapshot circostanziato (state at session end)

---

### **Step 2: Update Handovers**

For each category touched during session:

1. Open/create `.claude/handovers/[category].md`
2. Append entry with format:
   ```markdown
   ### YYYY-MM-DD HH:MM ([task-name]) [model_mN]

   **Changed**:
   - file:line - description

   **Related**:
   → Full session: [diary link]#anchor
   ```
3. Add cross-reference from diary to handover

---

### **Step 2A: LLAMA 4 — Chiusura sessione (se applicabile)**

Se la sessione include `llama4-finetuning`:
- Aggiorna `docs/llama4/README_LLAMA4.md` con note chiave (VRAM, throughput, step/sec, loss, batch/grad-acc, checkpointing, errori/OOM).
- Aggiungi un entry in `.claude/handovers/llama4-finetuning.md` con: data/ora, run id/pod id, modello base, LoRA config, dataset, durata, output (link pesi se esistono), problemi+soluzioni.
- Allega log essenziali nel diario (stdout tail, metriche) e linka eventuali artifact esterni.
- Se cambiano strumenti/percorsi/modello base → aggiorna `.claude/PROJECT_CONTEXT.md` (sezione AI Models/Fine-Tuning) con breve nota e data.

---

### **Step 3: Check PROJECT_CONTEXT**

If session made major changes:
- ✅ New deployment URL → update PROJECT_CONTEXT.md
- ✅ Architecture change → update PROJECT_CONTEXT.md
- ✅ Port change → update PROJECT_CONTEXT.md
- ✅ Major restructure → update PROJECT_CONTEXT.md
- ❌ Small code changes → NO (goes in handovers)

Update "Last Updated" timestamp if changed.

---

### **Step 4: Check SYSTEM_PROMPT Updates** ⚡

**CRITICAL**: When ZANTARA acquires new powers/capabilities, the SYSTEM_PROMPT must be updated!

If during this session you:
- ✅ Added new handlers or tools
- ✅ Integrated new external services (Gmail, Calendar, Maps, etc.)
- ✅ Added new business capabilities (pricing, identity, memory, etc.)
- ✅ Modified how ZANTARA can interact with users

**Then you MUST**:
1. Update `apps/backend-rag 2/backend/app/main_cloud.py` SYSTEM_PROMPT (lines 70-236)
2. Add new capabilities to the "WHAT YOU CAN DO" section
3. Update examples in "HOW TO USE YOUR CAPABILITIES" if needed
4. Note this in diary and handover

**Why**: The SYSTEM_PROMPT is ZANTARA's "brain instructions". If we add new powers but don't tell ZANTARA about them, it won't use them intelligently!

---

### **Step 5: Show Summary**

```
✅ Session Complete

📔 Diary: .claude/diaries/YYYY-MM-DD_model_mN.md
📝 Handovers updated: [list]
🔧 Files modified: [count]
🚀 Deployments: [URLs if any]
⏱️  Duration: Xh Ym

📊 Summary:
[Brief summary of work done]

🚧 Pending:
[Next steps if any]
```

---

## 📚 System Documentation

- **Full system docs**: `.claude/README.md`
- **Project details**: `.claude/PROJECT_CONTEXT.md`
- **Entry point**: `AI_START_HERE.md`

---

## ⚠️ Important Notes

### **DO**:
✅ Read PROJECT_CONTEXT + today/yesterday diaries at start
✅ Create handovers on-demand (not upfront)
✅ Log problems + solutions in diary
✅ Cross-reference diary ↔ handover (bidirectional)
✅ Update PROJECT_CONTEXT only for major changes

### **DON'T**:
❌ Read all handovers at start (waste time/tokens)
❌ Put code snippets in handovers (use diaries)
❌ Skip diary creation
❌ Update PROJECT_CONTEXT for small changes

---

## 🎯 Quick Commands for User

**To start new CLI session**:
```
Leggi .claude/INIT.md
```

**To end session**:
```
Ho finito, aggiorna tutto
- Completa Exit Protocol Step 1–4
- Se LLAMA4: esegui Step 2A (chiusura LLAMA 4)
- Altrimenti: aggiorna handover di categoria e diario con log/metriche
```

---

**System Version**: 1.1.0
**Created**: 2025-10-01
**Last Updated**: 2025-10-08 10:05 (Added LLAMA4 + Quick Starts + Exit alignment)
