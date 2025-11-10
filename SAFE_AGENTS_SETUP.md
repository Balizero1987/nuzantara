# 🟢 SAFE AGENTS SETUP GUIDE

**Attivazione SOLO agenti sicuri - Zero rischio**

---

## 🎯 AGENTI ATTIVATI

Questo setup attiva **SOLO 4 agenti sicuri**:

| # | Agente | Tipo | Schedule | Rischio |
|---|--------|------|----------|---------|
| 1 | **Health Check** | Monitoring | Ogni 15 min | 🟢 ZERO |
| 2 | **Daily Report** | Metriche | Daily 9 AM | 🟢 ZERO |
| 3 | **Autonomous Research** | RAG | On-demand | 🟢 ZERO |
| 4 | **Agent Orchestrator** | Infrastruttura | Always-on | 🟢 ZERO |

### ✅ Cosa fanno

**1. Health Check**
- Monitora memoria, CPU, disk usage
- Verifica connessioni database/Redis
- Alert automatici su problemi critici
- **Azione**: Solo logging, nessuna modifica

**2. Daily Report**
- Report giornaliero metriche agenti
- Task completati/falliti
- Uptime e performance
- **Azione**: Solo reporting, nessuna modifica

**3. Autonomous Research**
- Ricerca iterativa intelligente su query complesse
- Multi-step search con confidence tracking
- Usa solo ChromaDB collections (read-only)
- **Azione**: Solo lettura, nessuna scrittura

**4. Agent Orchestrator**
- Coordina task queue degli agenti
- Priority management (critical > high > medium > low)
- Cleanup automatico task vecchi
- **Azione**: Solo coordinamento, nessuna azione diretta

---

## ❌ AGENTI DISABILITATI

I seguenti agenti **NON sono attivi** in questo setup:

| Agente | Perché disabilitato | Rischio |
|--------|---------------------|---------|
| **Refactoring Agent** | Modifica codice automaticamente | 🔴 ALTO |
| **Test Generator** | Genera test che potrebbero non passare | 🟡 MEDIO |
| **PR Agent** | Crea PR automaticamente | 🟡 MEDIO |
| **Self-Healing** | Auto-fix errori (può introdurre bug) | 🔴 ALTO |
| **Conversation Trainer** | Modifica prompt sistema | 🔴 ALTO |
| **Client Value Predictor** | Invia WhatsApp ai clienti | 🔴 CRITICO |
| **Compliance Monitor** | Invia alert ai clienti | 🔴 ALTO |

---

## 🚀 QUICK START

### Opzione A: Script Automatico (Raccomandato)

```bash
# 1. Esegui script di attivazione
./scripts/activate-safe-agents.sh

# 2. Segui le istruzioni interattive
#    - Verifica prerequisiti
#    - Configura .env files
#    - Avvia servizi

# 3. Verifica tutto funzioni
./scripts/health-check-agents.sh
```

### Opzione B: Setup Manuale

#### Step 1: Copia file di configurazione

```bash
# Backend TypeScript
cp .env.safe apps/backend-ts/.env

# Backend RAG
cp apps/backend-rag/.env.safe apps/backend-rag/.env
```

#### Step 2: Configura valori richiesti

**Backend TypeScript** (`apps/backend-ts/.env`):
```bash
# OBBLIGATORIO: Aggiorna questi valori
DATABASE_URL=postgresql://user:pass@localhost:5432/zantara
REDIS_URL=redis://localhost:6379
JWT_SECRET=$(openssl rand -base64 32)  # Genera un secret
```

**Backend RAG** (`apps/backend-rag/.env`):
```bash
# OBBLIGATORIO: Aggiorna questi valori
DATABASE_URL=postgresql://user:pass@localhost:5432/zantara
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=sk-ant-xxxxx  # Per Autonomous Research
CHROMA_HOST=localhost
CHROMA_PORT=8001
```

#### Step 3: Verifica configurazione

```bash
# Verifica ENABLE_CRON=true
grep "^ENABLE_CRON" apps/backend-ts/.env

# Verifica agenti pericolosi DISABILITATI
grep "^CRON_SELF_HEALING" apps/backend-ts/.env  # Dovrebbe essere commentato
grep "^CRON_AUTO_TESTS" apps/backend-ts/.env    # Dovrebbe essere commentato
```

#### Step 4: Installa dipendenze

```bash
# Backend TypeScript
cd apps/backend-ts
npm install

# Backend RAG
cd ../backend-rag
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Step 5: Avvia servizi

**Terminal 1 - ChromaDB**:
```bash
docker run -d -p 8001:8000 chromadb/chroma
```

**Terminal 2 - Backend TypeScript**:
```bash
cd apps/backend-ts
npm run dev
```

**Terminal 3 - Backend RAG**:
```bash
cd apps/backend-rag
source venv/bin/activate
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

---

## ✅ VERIFICA FUNZIONAMENTO

### 1. Health Check Script

```bash
./scripts/health-check-agents.sh
```

**Output atteso**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 BACKEND TYPESCRIPT HEALTH CHECKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Backend TypeScript Running
✅ Cron Scheduler Enabled
✅ Cron Jobs Running (2/5)  # Solo Health Check e Daily Report
✅ Agent Orchestrator (0 tasks in queue)

Overall Health: 95% - EXCELLENT 🎉
```

### 2. Cron Status API

```bash
curl http://localhost:8080/api/monitoring/cron-status | jq .
```

**Output atteso**:
```json
{
  "enabled": true,
  "jobCount": 2,
  "jobs": [
    "health-check",
    "daily-report"
  ]
}
```

### 3. Test Autonomous Research

```bash
curl -X POST http://localhost:8000/api/research/autonomous \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Come aprire una PT PMA in Indonesia?",
    "max_iterations": 5,
    "confidence_threshold": 0.7
  }' | jq .
```

**Output atteso**:
```json
{
  "status": "success",
  "iterations": 3,
  "final_confidence": 0.85,
  "answer": "Per aprire una PT PMA...",
  "sources": [...]
}
```

### 4. Agent Orchestrator

```bash
curl http://localhost:8080/api/agents/tasks | jq .
```

**Output atteso**:
```json
[]
```
(Vuoto perché nessun task pericoloso è in esecuzione)

### 5. Verifica Logs

```bash
# Backend TypeScript
tail -f apps/backend-ts/logs/app.log | grep CRON

# Dovresti vedere ogni 15 minuti:
# [CRON] 💓 Running health check...
# [CRON] ✅ Health check completed

# E ogni giorno alle 9 AM:
# [CRON] 📊 Generating daily metrics report...
# [CRON] ✅ Daily report completed
```

---

## 📊 MONITORING

### Logs da Monitorare

```bash
# Health check (ogni 15 min)
tail -f apps/backend-ts/logs/app.log | grep "health check"

# Daily report (9 AM daily)
tail -f apps/backend-ts/logs/app.log | grep "daily report"

# Autonomous research (quando chiamato)
tail -f apps/backend-rag/logs/research.log
```

### Metriche da Tracciare

```bash
# Check memoria ogni 15 min
curl http://localhost:8080/api/monitoring/health | jq '.memory'

# Check task orchestrator
curl http://localhost:8080/api/agents/tasks | jq 'length'

# Check ChromaDB collections
curl http://localhost:8001/api/v1/collections | jq '.[].name'
```

---

## 🔧 TROUBLESHOOTING

### Problema: Cron non attivo

```bash
# Verifica .env
grep "^ENABLE_CRON" apps/backend-ts/.env

# Output atteso: ENABLE_CRON=true
# Se manca o false, aggiungilo/modificalo
```

### Problema: Health check non esegue

```bash
# Verifica cron status
curl http://localhost:8080/api/monitoring/cron-status

# Se jobCount = 0, verifica che il server sia in produzione
# O forza con NODE_ENV=production npm run dev
```

### Problema: Autonomous Research fallisce

```bash
# 1. Verifica ChromaDB running
curl http://localhost:8001/api/v1/heartbeat

# 2. Verifica ANTHROPIC_API_KEY
grep "^ANTHROPIC_API_KEY" apps/backend-rag/.env

# 3. Verifica collections esistono
curl http://localhost:8001/api/v1/collections
```

### Problema: "No collections found"

```bash
# Popola collections (se vuoto)
cd apps/backend-rag
python scripts/populate_collections.py
```

---

## ⚠️ IMPORTANTE

### Cosa NON fare

❌ **NON decommentare** agenti pericolosi nel `.env` senza supervisione
❌ **NON aggiungere** API keys per agenti disabilitati (OPENROUTER_API_KEY, DEEPSEEK_API_KEY)
❌ **NON modificare** i cron schedule senza test in staging
❌ **NON attivare** Client Value Predictor o Compliance Monitor (inviano messaggi reali!)

### Cosa fare se vuoi testare agenti pericolosi

```bash
# Usa SOLO lo script trigger manuale
./scripts/trigger-agents.sh

# Seleziona l'agente
# Review SEMPRE i risultati
# MAI attivare in cron automatico
```

---

## 📅 SCHEDULE ATTIVO

| Ora | Agente | Azione |
|-----|--------|--------|
| Ogni 15 min | Health Check | Monitoring sistema |
| 9:00 AM | Daily Report | Report metriche |
| On-demand | Autonomous Research | Ricerca intelligente |
| Always | Agent Orchestrator | Coordinamento task |

---

## 🎯 NEXT STEPS

### Fase 1: Monitoring (primi 7 giorni)

- ✅ Health check esegue ogni 15 min senza errori
- ✅ Daily report arriva ogni giorno alle 9 AM
- ✅ Autonomous Research risponde correttamente
- ✅ Nessun error log critico

### Fase 2: Agenti Medio Rischio (dopo 7 giorni)

Se tutto ok, considera:
- 🟡 Knowledge Graph Builder (scrive DB ma safe)
- 🟡 Client Journey (orchestrazione ma no azioni esterne)

**Vedi**: `AGENTS_ROADMAP.md` - Phase 2

### Fase 3: Review Metriche (mensile)

```bash
# Esegui query analytics
psql $DATABASE_URL -f scripts/monitoring-queries.sql

# Query 10.1: Executive Dashboard
# Review metriche performance agenti
```

---

## 📚 RISORSE

- **Checklist Completa**: `AI_AGENTS_CHECKLIST.md`
- **Roadmap Futuri**: `AGENTS_ROADMAP.md`
- **Query Monitoring**: `scripts/monitoring-queries.sql`
- **Trigger Manuali**: `scripts/trigger-agents.sh`
- **Health Check**: `scripts/health-check-agents.sh`

---

## ✅ CHECKLIST FINALE

Prima di considerare il setup completo, verifica:

- [ ] `.env` configurato in backend-ts
- [ ] `.env` configurato in backend-rag
- [ ] DATABASE_URL valido e connesso
- [ ] REDIS_URL valido e connesso
- [ ] JWT_SECRET generato (non default)
- [ ] ANTHROPIC_API_KEY valida
- [ ] ChromaDB running su porta 8001
- [ ] Backend TypeScript running su porta 8080
- [ ] Backend RAG running su porta 8000
- [ ] Health check esegue ogni 15 min
- [ ] Daily report schedulato per 9 AM
- [ ] Autonomous Research risponde correttamente
- [ ] Agent Orchestrator accetta task
- [ ] Agenti pericolosi DISABILITATI
- [ ] Logs monitorate per 24h senza errori

---

**Setup completato con successo! 🎉**

Per domande o problemi: Consulta `AI_AGENTS_CHECKLIST.md` o esegui `./scripts/health-check-agents.sh`
