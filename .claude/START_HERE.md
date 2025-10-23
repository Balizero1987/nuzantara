# 🤖 AI Quick Start - NUZANTARA

> **Per nuove istanze AI**: Leggi SOLO questo file. 2 minuti.

---

## 🕯️ PREGHIERA OBBLIGATORIA A SANT'ANTONIO 🙏

**⚠️ PRIMA DI QUALSIASI LAVORO, TUTTI I DEV AI DEVONO RECITARE QUESTA PREGHIERA! ⚠️**

### Preghiera a Sant'Antonio da Padova per i Deploy

```
O glorioso Sant'Antonio,
Protettore degli sviluppatori e custode dei deploy,
Tu che hai il potere di ritrovare ciò che è perduto,
Guida i nostri deployment verso il successo!

Aiutaci a trovare i bug nascosti nel codice,
Illumina i path oscuri delle configurazioni Railway,
Proteggi i nostri container da crash improvvisi,
E fa' che i nostri healthcheck passino sempre al primo tentativo!

Sant'Antonio, patrono delle cose perdute,
Ritrovaci le env variables dimenticate,
Riportaci le connessioni al database cadute,
E salva i nostri logs dagli errori misteriosi!

Per la tua intercessione, o Santo Taumaturgo,
Fa' che i nostri build non falliscano mai,
Che i nostri timeout siano sempre sufficienti,
E che ogni deployment diventi SUCCESS!

Gloria al Padre, al Figlio e allo Spirito Santo,
Gloria a Railway, a Docker e a Nixpacks,
Gloria a PostgreSQL, ChromaDB e Claude AI,
Come era nel principio, ora e sempre,
Nei secoli dei secoli, in production.

Amen. 🕯️
```

### 📜 Storia della Grande Vittoria (19 Ottobre 2025)

**Il Miracolo dei Due Backend** - Dopo ore di battaglia contro deploy falliti, healthcheck timeout e Firebase credentials errors, Sant'Antonio ha ascoltato le nostre preghiere:

✅ **TS-BACKEND**: deployment 9aab1250 - SUCCESS (v5.2.0)
✅ **RAG BACKEND**: deployment af651f59 - SUCCESS (v3.1.0-perf-fix)

**Problemi Sconfitti**:
- Healthcheck timeout (30s → 300s)
- ChromaDB download lento (72MB, 4-5 min)
- Firebase Google Cloud ADC errors
- Deployment stuck in BUILDING
- PostgreSQL migrations fallite
- Claude Haiku model 404

**Messaggio ai Futuri Dev AI**:
*"Un deploy senza preghiera è un deploy destinato al FAILED! 🕯️"*

**Before you start coding, light a virtual candle and recite the prayer above!**

---

## ⚡ Setup Immediato (2 minuti)

### Step 1: Identifica la tua Window
```
User: "Sei W2, [task description]"
```
**Il tuo numero window**: W1, W2, W3, o W4

### Step 2: Quick Orientation (60 secondi)
**Read FIRST (1 min total):**
```bash
1. .claude/QUICK_REFERENCE.md     # ⭐ 1-page cheat sheet (30s)
2. .claude/PROJECT_MAP.md         # ⭐ Visual system map (30s)
```

### Step 3: Load Context (2 min)
**Read if needed:**
```bash
3. .claude/PROJECT_CONTEXT.md     # Full architecture (optional, 5 min)
4. .claude/CURRENT_SESSION_WX.md  # Previous session in your window
5. tail .claude/ARCHIVE_SESSIONS.md  # Recent sessions (optional)
```

### Step 4: Check Documentation (when coding)
**NEW! Complete docs in `/docs`:**
```bash
# Code Examples (copy-paste ready!)
docs/examples/HANDLER_INTEGRATION.md    # Create handlers
docs/examples/RAG_SEARCH_EXAMPLE.md     # Use RAG backend
docs/examples/TOOL_CREATION.md          # Build tools
docs/examples/API_CLIENT_EXAMPLES.md    # External APIs

# Operations (when deploying)
docs/operations/INCIDENT_RESPONSE.md    # Playbooks P0-P3
docs/operations/MONITORING_GUIDE.md     # Metrics & alerts

# Security
docs/security/SECURITY_GUIDE.md         # Auth, encryption

# Architecture
docs/galaxy-map/README.md                # System overview
```

### Step 5: Inizia Sessione
```bash
# 1. Open your session file
# File: .claude/CURRENT_SESSION_WX.md (X = your window)

# 2. Copy template structure
# Use: .claude/CURRENT_SESSION.template.md as reference

# 3. Fill in session info
# Add: Window, Date, Task, Understanding
```

### Step 6: Lavora & Aggiorna
- ✅ Aggiorna SOLO il tuo `CURRENT_SESSION_WX.md`
- ✅ Commit frequentemente (ogni task completato)
- ✅ Traccia: task, files, decisions, issues
- ❌ NON creare nuovi file MD
- ❌ NON toccare le altre window (W1-W4)

**Tip:** Update session file after EVERY completed subtask, not just at the end!

### Step 7: Handover & Chiusura
**When ending session:**

1. **Read:** `.claude/HANDOVER_GUIDE.md` ⭐ (detailed handover process)

2. **Complete handover sections:**
   - ✅ All tasks status updated
   - ✅ Next steps documented
   - ✅ Tips for next AI
   - ✅ Known issues listed

3. **Archive session:**
   ```bash
   cat .claude/CURRENT_SESSION_WX.md >> .claude/ARCHIVE_SESSIONS.md
   echo "\n---\n" >> .claude/ARCHIVE_SESSIONS.md
   cp .claude/CURRENT_SESSION.template.md .claude/CURRENT_SESSION_WX.md
   ```

4. **Final commit:**
   ```bash
   git add .claude/
   git commit -m "docs: archive WX session + reset for next AI"
   git push
   ```

---

## 🎯 Sistema NUZANTARA (60 sec)

**Cosa è**: Monorepo multi-AI su Railway
- Backend TypeScript (96 handlers) → :8080
- Backend RAG Python (ChromaDB) → :8000
- Webapp vanilla JS → GitHub Pages

**AI Systems**:
- ZANTARA (Llama 3.1 8B) → Customer-facing
- DevAI (Qwen 2.5 Coder 7B) → Internal dev (tu)

**Stack**: TypeScript 5.9 + Express 5.1 + Python FastAPI + ChromaDB

---

## 📁 File Structure

```
NUZANTARA-RAILWAY/
├── apps/
│   ├── backend-ts/         # API TypeScript
│   ├── backend-rag/        # RAG Python
│   └── webapp/             # Frontend
├── docs/ARCHITECTURE.md    # Full architecture
└── .claude/
    ├── CURRENT_SESSION_W1-4.md  # 4 window files (TU)
    └── ARCHIVE_SESSIONS.md      # Global log
```

---

## 🚫 REGOLE CRITICHE

### ❌ NON Fare
- **NON creare nuovi file in .claude/** (no .md, .txt, .log, etc.)
- **NON toccare altre window** (solo la tua WX)
- **NON modificare diaries/ o handovers/** (archivio legacy, read-only)

### ✅ COSA Modificare
```bash
# In .claude/: SOLO il tuo file
.claude/CURRENT_SESSION_WX.md  # ✅ X = tuo window number

# Nel progetto: QUALSIASI file necessario per il task
apps/*/           ✅ codice
packages/*/       ✅ codice
docs/             ✅ documentazione
config/           ✅ configurazione
README.md         ✅ documentazione generale
package.json      ✅ dipendenze
tsconfig.json     ✅ config TypeScript
.env.example      ✅ env template
# ... TUTTO quello che serve per completare il task
```

### ✅ Archiviazione (fine sessione)
```bash
# Working directory corretto:
cd /path/to/NUZANTARA-RAILWAY/.claude
cat CURRENT_SESSION_W1.md >> ARCHIVE_SESSIONS.md  # ✅
echo "\n---\n" >> ARCHIVE_SESSIONS.md
```

### ✅ Fare
- Chiedi all'utente se non sai quale window sei
- Modifica tutti i file di codice necessari per il task
- Documenta il lavoro nel tuo CURRENT_SESSION_WX.md
- Archivia sempre a fine sessione

---

## 📖 Se Serve Approfondire

| File | Quando |
|------|--------|
| `PROJECT_CONTEXT.md` | Sempre (context base) |
| `ARCHITECTURE.md` | Architettura dettagliata |
| `ARCHIVE_SESSIONS.md` | Cerca sessioni passate |
| `diaries/` | Solo se serve storia specifica |

---

## 🔧 Template Sessione

```markdown
## 📅 Session Info
- Window: WX
- Date: YYYY-MM-DD HH:MM UTC
- Model: claude-sonnet-4.5-20250929
- User: antonellosiano
- Task: [what user asked]

## ✅ Task Completati
### 1. [Nome Task]
- Status: ✅/🚧/❌
- Files: [lista]
- Changes: [cosa fatto]

## 📝 Note
- Scoperte importanti
- Problemi risolti

## 🏁 Chiusura
- Risultato: [summary]
- Build/Tests: ✅/❌
- Handover: [info per prossima AI]
```

---

## 🚂 Railway Commands Reference

### Status & Monitoring
```bash
railway status                           # Stato generale progetto
railway logs --service TS-BACKEND        # Logs live TypeScript backend
railway logs --service "RAG BACKEND"     # Logs live RAG backend
```

### Deploy
```bash
railway up --service TS-BACKEND          # Deploy manuale TS backend
```

### Configuration
```bash
railway variables --service TS-BACKEND   # Visualizza env vars TS backend
railway variables --service "RAG BACKEND" # Visualizza env vars RAG backend
```

**Railway Dashboard**: https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9

---

## 🚀 Quick Start Checklist

### First 2 Minutes
- [ ] Read `.claude/QUICK_REFERENCE.md` (1-page cheat sheet)
- [ ] Skim `.claude/PROJECT_MAP.md` (visual overview)
- [ ] Open `.claude/CURRENT_SESSION_WX.md` (your session file)

### Before Coding
- [ ] Review relevant doc from `/docs/examples/`
- [ ] Check if Railway maintenance is active
- [ ] Understand the task requirements

### During Work
- [ ] Update session file frequently
- [ ] Commit after each completed task
- [ ] Document decisions and issues
- [ ] Test before committing

### Before Ending
- [ ] Read `.claude/HANDOVER_GUIDE.md`
- [ ] Complete all handover sections
- [ ] Archive session
- [ ] Final commit + push

---

## 📚 Essential Resources

**Onboarding (Start Here):**
- 📖 `.claude/START_HERE.md` - This file
- ⚡ `.claude/QUICK_REFERENCE.md` - 1-page cheat sheet
- 🗺️ `.claude/PROJECT_MAP.md` - Visual system map
- 🤝 `.claude/HANDOVER_GUIDE.md` - Session handover process

**Code Examples:**
- 💻 `docs/examples/` - 4 guides with real code snippets

**Operations:**
- 🚨 `docs/operations/INCIDENT_RESPONSE.md` - Playbooks
- 📊 `docs/operations/MONITORING_GUIDE.md` - Metrics

**Architecture:**
- 🌌 `docs/galaxy-map/` - 6 architecture documents

---

**Pronto?** → Open `.claude/QUICK_REFERENCE.md` and start! 🚀
