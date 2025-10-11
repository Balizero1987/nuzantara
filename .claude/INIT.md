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

### **Step 5.5: Register Session & Check Locks** 🔒

> **CRITICAL**: Multi-CLI coordination - Prevents overlapping work

**A. Register this session**:
```bash
mkdir -p .claude/locks

# Create or update active-sessions.json
node -e "
const fs = require('fs');
const file = '.claude/active-sessions.json';
const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {sessions:[]};

// Detect model and matricola from current context
const model = 'sonnet-4.5'; // Auto-detect: claude-sonnet-4-5-* → sonnet-4.5
const date = new Date().toISOString().split('T')[0];
const existingToday = data.sessions.filter(s => s.id.startsWith('m')).length;
const matricola = 'm' + (existingToday + 1);

data.sessions.push({
  id: matricola,
  model: model,
  started: new Date().toISOString(),
  task: 'TASK_DESCRIPTION_HERE', // Will be updated after Step 4
  categories: [], // Will be filled after category detection
  files_editing: [],
  status: 'starting',
  pid: process.pid
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('✅ Session registered: ' + matricola);
" 2>/dev/null || echo "⚠️ Node.js not available, skipping session registration"
```

**B. Check for conflicts**:
```bash
# For each detected category (from Step 5), check locks
DETECTED_CATEGORIES=("backend-handlers" "middleware") # Example

for CATEGORY in "${DETECTED_CATEGORIES[@]}"; do
  LOCK_FILE=".claude/locks/${CATEGORY}.lock"

  if [ -f "$LOCK_FILE" ]; then
    echo ""
    echo "🔴 CONFLICT DETECTED!"
    echo "Category: $CATEGORY"
    echo "Locked by:"
    cat "$LOCK_FILE"
    echo ""
    echo "Options:"
    echo "1. Wait for other CLI to finish (check diary for ETA)"
    echo "2. Choose different task/category"
    echo "3. Coordinate with other CLI (ask user)"
    echo ""
    # ASK USER what to do
    read -p "Continue anyway (risky)? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "Aborting. Choose different task."
      exit 1
    fi
  fi
done
```

**C. Create locks**:
```bash
# For each category, create lock file
MATRICOLA="m1" # From Step 3
MODEL="sonnet-4.5"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

for CATEGORY in "${DETECTED_CATEGORIES[@]}"; do
  echo "$TIMESTAMP | $MODEL $MATRICOLA | PID: $$ | Task: YOUR_TASK" > ".claude/locks/${CATEGORY}.lock"
  echo "🔒 Locked: $CATEGORY"
done
```

**D. Update session with task + categories**:
```bash
# After Step 4 (user provides task description)
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('.claude/active-sessions.json'));
const session = data.sessions[data.sessions.length - 1]; // Last session (this one)
session.task = 'YOUR_TASK_FROM_STEP_4';
session.categories = ['backend-handlers', 'middleware']; // From Step 5
session.status = 'in_progress';
fs.writeFileSync('.claude/active-sessions.json', JSON.stringify(data, null, 2));
" 2>/dev/null
```

**Why this matters**:
- 🚫 Prevents 2+ CLIs editing same file simultaneously
- 👀 Visibility: see what other CLIs are doing
- ⚡ Coordination: detect conflicts before they happen

---

### **Step 6: Start Work**

- Create diary: `.claude/diaries/YYYY-MM-DD_model_mN.md`
- Log all actions in real-time
- Update diary as you work

#### **During-Session Tracking Protocol** 🔄

**WHEN to update diary** (real-time logging):
- ✅ **Every 15-30 minutes** - Add timestamp entry with progress
- ✅ **Immediately after**: File edits, bash commands, test runs, deployments, errors
- ✅ **Before context switch** - Log current state before switching tasks

**WHAT to log** (be specific):
```markdown
## HH:MM - Task Description

**Files modified**:
- `path/to/file.ts:123-145` - Added rate limiting middleware
- `path/to/config.json:12` - Updated API timeout to 30s

**Commands executed**:
\`\`\`bash
npm run build && docker buildx build ...
\`\`\`

**Errors encountered**:
- TypeScript error TS2345 in router.ts:67 - Fixed by adding type annotation
- Time lost: 5 min

**Deployments**:
- Backend → https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app (rev 00123)
- Verified: Health check ✅, handlers count ✅

**Test results**:
- `npm test` → 45/45 passed ✅
- Smoke test → All endpoints responding ✅

**Next immediate step**:
- Test rate limiting with 50 req/min
```

**TodoWrite Tool Integration** (use when needed):
- ✅ **Use TodoWrite when**: Task has 3+ steps OR estimated >30 min
- ✅ **Create todos for**: Multi-step features, bug fixes with multiple files, deployment sequences
- ✅ **Update todo status**: in_progress when starting, completed immediately after finishing
- ✅ **Sync with diary**: After marking todo completed, add corresponding diary entry with timestamp
- ❌ **Don't use for**: Single-step tasks, quick fixes <10 min, exploratory reading

**Format Tips**:
- Use `## HH:MM` for each major update (makes timeline searchable)
- Include file paths with line numbers: `file.ts:123-145`
- Log command outputs (especially errors)
- Note time lost on blockers (helps improve future estimates)

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

**WHEN TO UPDATE** (Categories touched):

✅ **UPDATE handover if you**:
- Modified code in that category (added, edited, deleted)
- Deployed changes to that category
- Fixed bug in that category
- Added feature to that category
- Changed configuration that affects that category

❌ **DON'T UPDATE if you only**:
- Read code to understand (no modifications)
- Discussed or planned (no implementation)
- Tested existing functionality (no bugs found)
- Reviewed during onboarding/context gathering

**For EACH category touched**:

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

**Multiple Categories**:
- **2-3 categories** → Update all handovers individually
- **5+ categories** → Probably a major change, consider updating PROJECT_CONTEXT instead + add note in each handover pointing to diary

**Bidirectional Cross-Reference** (CRITICAL):
- In handover → link to diary section: `[diary](../diaries/YYYY-MM-DD_model_mN.md#HH-MM-task-name)`
- In diary → link to handover: `[handover](../handovers/category.md)`
- This allows navigation in both directions: "What changed in category?" ↔ "Where's the full context?"

---

### **Step 2A: LLAMA 4 — Chiusura sessione (se applicabile)**

Se la sessione include `llama4-finetuning`:
- Aggiorna `docs/llama4/README_LLAMA4.md` con note chiave (VRAM, throughput, step/sec, loss, batch/grad-acc, checkpointing, errori/OOM).
- Aggiungi un entry in `.claude/handovers/llama4-finetuning.md` con: data/ora, run id/pod id, modello base, LoRA config, dataset, durata, output (link pesi se esistono), problemi+soluzioni.
- Allega log essenziali nel diario (stdout tail, metriche) e linka eventuali artifact esterni.
- Se cambiano strumenti/percorsi/modello base → aggiorna `.claude/PROJECT_CONTEXT.md` (sezione AI Models/Fine-Tuning) con breve nota e data.

---

### **Step 3: Check PROJECT_CONTEXT**

**WHEN TO UPDATE** (Major changes only):

✅ **UPDATE PROJECT_CONTEXT if**:
- New service deployed OR service removed
- Deployment URL changed
- Port changed
- Major infrastructure change (new database, message queue, cache layer)
- Major feature added (new backend, new AI model, new integration)
- ±10 handlers added/removed (107→97 or 107→120)
- Architecture diagram would change
- New developer would be confused by outdated info

❌ **DON'T UPDATE if**:
- Added/modified 1-5 handlers (small changes)
- Bug fixes (even if critical)
- Refactoring (no functional changes)
- Small config changes (timeout, batch size, etc.)
- Performance optimizations (no architecture impact)
- UI changes (unless major redesign)
- Documentation updates

**Rule of Thumb**: Ask yourself: "Would a new AI joining tomorrow be confused by PROJECT_CONTEXT being outdated?" If YES → UPDATE. If NO → Only update handovers.

**If you update**:
- Update "Last Updated" timestamp at top
- Keep it concise (PROJECT_CONTEXT is high-level overview, not implementation details)

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

### **Step 5: Cleanup & Show Summary**

**A. Remove locks**:
```bash
# Remove category locks
rm -f .claude/locks/*.lock
echo "🔓 All locks released"
```

**B. Unregister session**:
```bash
# Remove from active-sessions.json
MATRICOLA="m1" # Your session ID

node -e "
const fs = require('fs');
const file = '.claude/active-sessions.json';
if (fs.existsSync(file)) {
  const data = JSON.parse(fs.readFileSync(file));
  data.sessions = data.sessions.filter(s => s.id !== '$MATRICOLA');
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log('✅ Session unregistered: $MATRICOLA');
}
" 2>/dev/null || echo "⚠️ Could not unregister session"
```

**C. Show summary**:
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

🔒 Locks released: [categories]
```

---

## 📚 System Documentation

- **Full system docs**: `.claude/README.md`
- **Project details**: `.claude/PROJECT_CONTEXT.md`
- **Entry point**: `AI_START_HERE.md`
- **Onboarding (new joiners)**: `docs/onboarding/INDEX.md`

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

**System Version**: 1.3.0
**Created**: 2025-10-01
**Last Updated**: 2025-10-11 18:25 (Added Multi-CLI Coordination: Lock System + Session Registration)
