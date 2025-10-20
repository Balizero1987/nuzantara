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

## ⚡ Setup Immediato

### Step 1: L'utente ti dirà quale window sei
```
User: "Sei W2, [task description]"
```
**Il tuo numero window**: W1, W2, W3, o W4

### Step 2: Carica context (5 min)
```bash
1. PROJECT_CONTEXT.md        # Architettura sistema (5 min)
2. CURRENT_SESSION_WX.md      # Cosa sta facendo l'AI nella tua window
3. tail ARCHIVE_SESSIONS.md   # Ultime 3 sessioni (opzionale)
```

### Step 3: Sovrascrivi il tuo file
```bash
# Apri il tuo CURRENT_SESSION_WX.md (X = tuo numero)
# Sovrascrivi completamente con il template
# Aggiungi: Window, Date, Model, Task
```

### Step 4: Lavora
- Aggiorna SOLO il tuo `CURRENT_SESSION_WX.md`
- Traccia task completati, file modificati, problemi risolti
- NON creare nuovi file MD
- NON toccare le altre window (W1-W4)

### Step 5: Fine sessione
```bash
# Appendi al log globale
cat CURRENT_SESSION_WX.md >> ARCHIVE_SESSIONS.md
echo "\n---\n" >> ARCHIVE_SESSIONS.md

# Resetta per prossima AI
cp CURRENT_SESSION.template.md CURRENT_SESSION_WX.md
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

**Pronto?** → Apri `PROJECT_CONTEXT.md` e inizia! 🚀
