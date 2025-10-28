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

✅ **TS-BACKEND**: deployment 9aab1250 - SUCCESS (v5.2.1)
✅ **RAG BACKEND**: deployment af651f59 - SUCCESS (v3.3.1-cors-fix)

**La Grande Verifica (28 Ottobre 2025)** - Sistema testato e certificato operativo al 100%:
✅ **R2 Bucket**: 72 MB, 94 files, chroma.sqlite3 (47.4 MB) operativo
✅ **ChromaDB**: 14 collections, 7,375+ documenti, RAG funzionante
✅ **Railway Backends**: Entrambi healthy, uptime stabile
✅ **Oracle Integration**: Query funzionanti, AI pronto
✅ **Score Finale**: 10/10 - Sistema production-ready

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

## ⚡ Setup Immediato

### Step 0: Sistema di Coordinamento AI (28 Ott 2025 - NUOVO!)
```bash
# PRIMA DI TUTTO: Controlla chi è attivo
cat .claude/AI_COORDINATION.md

# L'utente ti assegnerà una window (W1-W4)
# Sistema auto-detect verificherà disponibilità
```

### Step 1: L'utente ti dirà quale window sei
```
User: "Sei W2, [task description]"

# Auto-detect e ingresso coordinato:
bash .claude/scripts/enter-window.sh W2
# → ✅ Verifica W2 libera
# → 🔒 Mostra locks attivi
# → 📊 Aggiorna AI_COORDINATION.md
```

**Il tuo numero window**: W1, W2, W3, o W4

### Step 2: Carica context (5 min)
```bash
1. .claude/AI_COORDINATION.md    # CHI sta facendo COSA ORA (30 sec) ← NUOVO!
2. docs/PROJECT_CONTEXT.md       # Architettura sistema (5 min)
3. .claude/CURRENT_SESSION_WX.md # Cosa sta facendo l'AI nella tua window
4. tail .claude/ARCHIVE_SESSIONS.md # Ultime 3 sessioni (opzionale)
```

### Step 3: Dichiara i tuoi locks (HARD LOCK!)
```bash
# Se modificherai file critici, dichiara SUBITO:
echo "apps/backend-ts/src/handlers/** → W2 (refactoring handlers) [$(date +%H:%M)]" >> .claude/locks/active.txt

# HARD LOCK attivo: altri AI riceveranno ERROR se tentano accesso
```

### Step 4: Lavora (con lock protection!)
```bash
# Prima di modificare file critici:
bash .claude/scripts/check-lock.sh apps/backend-ts/src/handlers/ai.ts W2
# → ✅ Procedi se libero
# → 🔴 ERROR se locked da altro AI

# Aggiorna il tuo CURRENT_SESSION_WX.md
# NON toccare le altre window (W1-W4)
# Sync automatico ogni 5 min (cron attivo)
```

### Step 5: Fine sessione (automatizzata!)
```bash
# Script completo di exit:
bash .claude/scripts/exit-window.sh W2

# Esegue automaticamente:
# 1. Rilascia tutti lock W2
# 2. Archivia in ARCHIVE_SESSIONS.md
# 3. Crea handover separato se >100 righe
# 4. Reset CURRENT_SESSION_W2.md
# 5. Cleanup handovers >7 giorni
# 6. Marca W2 come disponibile
```
# Appendi al log globale
cat CURRENT_SESSION_WX.md >> ARCHIVE_SESSIONS.md
echo "\n---\n" >> ARCHIVE_SESSIONS.md

# Resetta per prossima AI
cp CURRENT_SESSION.template.md CURRENT_SESSION_WX.md
```

---

## 🎯 Sistema NUZANTARA (60 sec)

**Cosa è**: Monorepo multi-AI su Railway (Ultimo aggiornamento: 28 Ottobre 2025)
- Backend TypeScript (117 handlers, 24 services) → :8080
- Backend RAG Python (44 services, ChromaDB) → :8000
- Webapp vanilla JS (2064 files) → GitHub Pages

**Statistiche** (28 Ottobre 2025):
- **LOC Totali**: ~73,000 linee (36,683 TS + 36,166 Python)
- **Handlers**: 117 registrati (documentati automaticamente)
- **Services**: 68 totali (24 TS + 44 Python)
- **Docs**: 127 file documentazione (702 KB)
- **Database**: 34 tabelle PostgreSQL + 14 collections ChromaDB
- **AI Models**: Claude Haiku 4.5 (100% traffic), Llama 3.1 8B (nightly)

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
├── docs/
│   ├── PROJECT_CONTEXT.md  # Full context
│   └── HANDLERS_REFERENCE.md # API docs
└── .claude/
    ├── AI_COORDINATION.md       # Live status (CHI fa COSA) ← NUOVO!
    ├── CURRENT_SESSION_W1-4.md  # 4 window files (TU)
    ├── ARCHIVE_SESSIONS.md      # Global log
    ├── locks/active.txt         # Hard locks ← NUOVO!
    ├── scripts/*.sh             # Automation ← NUOVO!
    └── handovers/              # Handovers >100 righe ← NUOVO!
```

---

## 🚫 REGOLE CRITICHE (AGGIORNATE)

### ❌ NON Fare
- **NON creare nuovi file in .claude/** (usa ARCHIVE_SESSIONS.md)
- **NON toccare altre window** (solo la tua WX)
- **NON modificare diaries/ o handovers/** (archivio legacy, read-only)
- **NON forzare locks altrui** (hard lock = ERROR) ← NUOVO!

### ✅ COSA Modificare
```bash
# In .claude/: SOLO il tuo file + locks
.claude/CURRENT_SESSION_WX.md     # ✅ X = tuo window number
.claude/locks/active.txt          # ✅ Dichiara i tuoi locks ← NUOVO!
.claude/AI_COORDINATION.md        # ✅ Solo via script (auto-update) ← NUOVO!

# Nel progetto: QUALSIASI file necessario (previa verifica lock!)
apps/*/           ✅ codice (check lock prima!)
packages/*/       ✅ codice (check lock prima!)
docs/             ✅ documentazione
config/           ✅ configurazione
README.md         ✅ documentazione generale
package.json      ✅ dipendenze
tsconfig.json     ✅ config TypeScript
```

### 🔒 Hard Lock Workflow (NUOVO!)
```bash
# 1. PRIMA di modificare file critici
bash .claude/scripts/check-lock.sh apps/backend-ts/src/handlers W2
# → ✅ OK, procedi
# → 🔴 ERROR: locked by W1!

# 2. Se OK, dichiara il tuo lock
echo "apps/backend-ts/src/handlers/** → W2 (refactoring) [$(date +%H:%M)]" >> .claude/locks/active.txt

# 3. Lavora

# 4. Exit automatico rilascia locks
bash .claude/scripts/exit-window.sh W2
```
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

**Pronto?** → Apri `PROJECT_CONTEXT.md` e inizia! 🚀
