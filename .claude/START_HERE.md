# 🚀 START HERE - NUZANTARA Dev AI Onboarding

> **Per nuovi Dev AI**: Leggi SOLO questo file prima di iniziare. Tutto il resto dopo.

---

## 📋 Workflow Obbligatorio

### 1️⃣ All'Inizio della Sessione

```bash
# Leggi in quest'ordine:
1. START_HERE.md (questo file) ← SEI QUI
2. PROJECT_CONTEXT.md (contesto tecnico, 5 min)
3. CURRENT_SESSION.md (cosa sta facendo l'AI corrente)
```

**IMPORTANTE**: NON leggere diaries/, handovers/, sessions/ o altri file a meno che non ti serva qualcosa di specifico.

### 2️⃣ Durante la Sessione

**AGGIORNA SOLO** il tuo `CURRENT_SESSION_WX.md`:
- X = numero window (1-4) che l'utente ti indica
- Esempi: `CURRENT_SESSION_W1.md`, `CURRENT_SESSION_W2.md`, etc.
- Sovrascrivi il contenuto esistente
- Usa il template fornito
- Aggiungi progressivamente task e risultati
- NON creare nuovi file MD (mai!)

### 3️⃣ Alla Fine della Sessione

```bash
# 1. Appendi il tuo CURRENT_SESSION_WX.md a ARCHIVE_SESSIONS.md
cat CURRENT_SESSION_WX.md >> ARCHIVE_SESSIONS.md
echo "\n---\n" >> ARCHIVE_SESSIONS.md

# 2. Pulisci il tuo file per la prossima sessione
cp CURRENT_SESSION.template.md CURRENT_SESSION_WX.md
```

**IMPORTANTE**: L'utente lavora con max 4 window contemporaneamente (W1, W2, W3, W4). Chiedi sempre quale window stai usando!

---

## 🎯 Sistema NUZANTARA in 60 secondi

### Cos'è
Monorepo multi-AI deployato su **Railway**:
- **Backend TypeScript** (96 handler) → Port 8080
- **Backend RAG Python** (ChromaDB + FastAPI) → Port 8000
- **Webapp** (vanilla JS) → GitHub Pages

### AI Systems
- **ZANTARA** (Llama 3.1 8B): Customer-facing AI
- **DevAI** (Qwen 2.5 Coder 7B): Internal dev AI (tu sei qui!)

### Tech Stack
- TypeScript 5.9.3 + Express 5.1.0
- Python + FastAPI + ChromaDB
- Firebase (Firestore), Redis (optional)
- Railway (deployment), GitHub Actions (CI/CD)

---

## 📁 Struttura Rapida

```
NUZANTARA-RAILWAY/
├── apps/
│   ├── backend-ts/         # API TypeScript (96 handlers)
│   ├── backend-rag/        # RAG Python (ChromaDB)
│   └── webapp/             # Frontend vanilla JS
├── config/                 # Railway configs
├── docs/                   # Documentazione
│   └── ARCHITECTURE.md     # ★ Architettura dettagliata
└── .claude/                # Session tracking
    ├── START_HERE.md       # ★ Questo file
    ├── PROJECT_CONTEXT.md  # ★ Contesto tecnico
    ├── CURRENT_SESSION.md  # ★ Sessione corrente (TU)
    └── ARCHIVE_SESSIONS.md # Storico sessioni
```

---

## ✅ Cosa Fare Adesso

1. **Chiedi all'utente**: "Quale window sto usando? (W1/W2/W3/W4)"
2. **Apri** `PROJECT_CONTEXT.md` e leggilo (5 min)
3. **Apri** `CURRENT_SESSION_WX.md` (dove X è il numero window) e aggiorna con:
   - Data/ora inizio sessione
   - Window number
   - Tuo model (es. claude-sonnet-4.5)
   - Task ricevuto dall'utente
4. **Inizia a lavorare** seguendo il workflow sopra

---

## 🚫 Cosa NON Fare

- ❌ NON creare nuovi file `.md` in `.claude/`
- ❌ NON leggere tutti i file in `diaries/` (sono archivio)
- ❌ NON creare handover separati (usa `CURRENT_SESSION.md`)
- ❌ NON modificare `ARCHIVE_SESSIONS.md` se non a fine sessione
- ❌ NON creare report multipli (uno solo: `CURRENT_SESSION.md`)

---

## 📖 File di Riferimento (on-demand)

Leggi solo se ti serve qualcosa di specifico:

| File | Quando Leggerlo |
|------|-----------------|
| `ARCHITECTURE.md` | Architettura dettagliata del sistema |
| `WORKFLOW_DEPLOY.md` | Deploy su Railway |
| `diaries/2025-10-*` | Cerca problemi specifici del passato |
| `handovers/*.md` | Approfondisci un componente specifico |

---

## 🎯 Regole d'Oro

1. **Un file alla volta**: `CURRENT_SESSION.md` è il tuo unico file di lavoro
2. **Sovrascrivi, non creare**: Aggiorna `CURRENT_SESSION.md`, non creare nuovi file
3. **Archivia a fine sessione**: Appendi a `ARCHIVE_SESSIONS.md`, poi pulisci
4. **Leggi solo il necessario**: START_HERE → PROJECT_CONTEXT → lavora
5. **Segui il template**: Usa sempre il formato in `CURRENT_SESSION.md`

---

## 🆘 In Caso di Dubbi

1. Rileggi questo file
2. Chiedi all'utente direttamente
3. Cerca in `ARCHIVE_SESSIONS.md` (ultimi 3 mesi)
4. Solo se proprio necessario: `diaries/` o `handovers/`

---

**Pronti?** → Apri `PROJECT_CONTEXT.md` e inizia! 🚀
