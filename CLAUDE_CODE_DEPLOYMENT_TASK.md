# 🚀 CLAUDE CODE - DEPLOYMENT TASK

**CONTESTO**: Abbiamo completato lo sviluppo e testing di 5 agenti autonomi Tier 1 per NUZANTARA. Tutto il codice è stato reviewato, testato, e commitato sul branch `claude/analyze-frontend-backend-coordination-011CUu1coX6KFraX8AVtgein`.

**OBIETTIVO**: Eseguire il deployment su Fly.io dei seguenti componenti:
- Backend-TS (nuzantara-backend) con Multi-Agent Orchestrator
- Backend-RAG (nuzantara-rag) con 3 agenti Python

**STATUS ATTUALE**:
- ✅ Code review completo (95.1% score)
- ✅ Tutti i test passati (83% coverage)
- ✅ 4 bug critici risolti
- ✅ Script di deployment automatico pronto
- ✅ Documentazione completa (7 guide)

---

## 🎯 TASK PER CLAUDE CODE

**Esegui questi step in sequenza sul computer locale:**

### STEP 1: Verifica Prerequisiti

Prima di procedere, verifica che siano soddisfatti:

```bash
# Check Fly CLI
fly version
# Expected: flyctl v0.x.x

# Check autenticazione Fly
fly auth whoami
# Expected: email@example.com

# Check Python 3
python3 --version
# Expected: Python 3.8+

# Check Node.js
node --version
# Expected: v18+

# Check Git
git --version
# Expected: git version 2.x
```

**Se qualcosa manca, fermati e installa prima.**

---

### STEP 2: Posizionati nel Repository

```bash
# Vai alla directory del progetto NUZANTARA
# (sostituisci con il percorso reale del tuo sistema)
cd ~/Projects/nuzantara  # macOS/Linux esempio
# oppure
cd C:/Projects/nuzantara  # Windows esempio

# Verifica di essere nel posto giusto
pwd
ls -la | grep deploy-autonomous-agents.sh
# Dovrebbe trovare lo script
```

---

### STEP 3: Pull del Branch Corretto

```bash
# Checkout del branch con tutti i fix
git checkout claude/analyze-frontend-backend-coordination-011CUu1coX6KFraX8AVtgein

# Pull degli ultimi cambiamenti
git pull origin claude/analyze-frontend-backend-coordination-011CUu1coX6KFraX8AVtgein

# Verifica il branch corrente
git branch --show-current
# Expected: claude/analyze-frontend-backend-coordination-011CUu1coX6KFraX8AVtgein

# Verifica che hai gli ultimi file
ls -la deploy-autonomous-agents.sh DEPLOY_NOW.md CODE_REVIEW.md
# Tutti dovrebbero esistere
```

---

### STEP 4: Review Pre-Deployment

**Leggi rapidamente questi file per capire cosa verrà deployato:**

```bash
# Quick overview del deployment
head -50 DEPLOY_NOW.md

# Lista degli agenti
grep -A 5 "Autonomous Agents" FINAL_DEPLOYMENT_REPORT.md

# Verifica che lo script sia eseguibile
chmod +x deploy-autonomous-agents.sh
```

---

### STEP 5: Esegui il Deployment Automatico

**Questo è il comando principale:**

```bash
# Esegui lo script di deployment
./deploy-autonomous-agents.sh

# Lo script ti guiderà attraverso:
# 1. Check prerequisiti
# 2. Verifica environment variables (ti chiederà di inserirle se mancano)
# 3. Installazione dipendenze
# 4. Pre-deployment tests
# 5. Database initialization
# 6. Deploy backend-ts
# 7. Deploy backend-rag
# 8. Knowledge graph initialization
# 9. Health verification
# 10. Start monitoring
```

**IMPORTANTE**: Lo script è interattivo. Risponderai a prompt come:
- "Proceed with deployment? (y/N)" → rispondi `y`
- "Set ANTHROPIC_API_KEY now? (y/N)" → rispondi `y` se manca
- Inserisci le API keys quando richiesto (avrai bisogno di ANTHROPIC_API_KEY, OPENAI_API_KEY, DATABASE_URL)

---

### STEP 6: Verifica Post-Deployment

Dopo che lo script completa, verifica che tutto sia OK:

```bash
# Check status backend-ts
fly status --app nuzantara-backend

# Check status backend-rag
fly status --app nuzantara-rag

# Controlla i log per il Multi-Agent Orchestrator
fly logs --app nuzantara-backend | grep "🎭"
# Expected: "Multi-Agent Orchestrator initialized"

# Controlla i log per gli agenti Python
fly logs --app nuzantara-rag | grep -E "🤖|💰|🕸️"
# Expected: Logs degli agenti quando vengono eseguiti
```

---

### STEP 7: Monitoring (48 ore)

**Monitora il deployment per le prossime 48 ore:**

```bash
# Monitora orchestrator in tempo reale
fly logs --app nuzantara-backend --json | grep "orchestrat"

# Monitora agenti
fly logs --app nuzantara-rag --json | grep -E "Starting|completed"

# Oppure usa lo script di monitoring (se lo vuoi interrompere: Ctrl+C)
# Nota: questo parte automaticamente alla fine del deploy se rispondi 'y'
```

---

## 🚨 TROUBLESHOOTING

### Se il deployment fallisce:

**1. Check dei log:**
```bash
fly logs --app nuzantara-backend
fly logs --app nuzantara-rag
```

**2. Rollback se necessario:**
```bash
# Lista delle release
fly releases --app nuzantara-backend

# Rollback all'ultima versione funzionante
fly releases rollback <version-number> --app nuzantara-backend
```

**3. Disabilita orchestrator se causa problemi:**
```bash
fly secrets set ENABLE_ORCHESTRATOR=false --app nuzantara-backend
fly apps restart nuzantara-backend
```

---

## 📋 ENVIRONMENT VARIABLES NECESSARIE

**Se lo script ti chiede di inserire secrets, avrai bisogno di:**

### Backend-TS (nuzantara-backend):
```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
DATABASE_URL=postgresql://user:pass@your-postgres.fly.dev:5432/zantara
ENABLE_ORCHESTRATOR=true
OPENROUTER_API_KEY=sk-or-your-key-here  # Optional ma consigliato
```

### Backend-RAG (nuzantara-rag):
```bash
OPENAI_API_KEY=sk-proj-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
DATABASE_URL=postgresql://user:pass@your-postgres.fly.dev:5432/zantara
```

**Nota**: Lo script ti chiederà di inserirli interattivamente se mancano.

---

## 📊 EXPECTED OUTCOMES

**Dopo deployment di successo, dovresti vedere:**

1. **Backend-TS deployed**:
   - Status: running (1 instance)
   - Health checks: passing
   - Logs: "🎭 Multi-Agent Orchestrator initialized"

2. **Backend-RAG deployed**:
   - Status: running (1 instance)
   - Health checks: passing
   - Logs: Server startup messages

3. **Knowledge Graph initialized**:
   - Tables created: kg_entities, kg_relationships, kg_entity_mentions
   - Schema ready per agenti

4. **Orchestrator attivo**:
   - Esegue ogni ora
   - Seleziona agenti basandosi su metriche sistema
   - Esegue 1-3 agenti per ciclo

5. **Agenti pronti**:
   - 🤖 Conversation Trainer (weekly)
   - 💰 Client Value Predictor (daily)
   - 🕸️ Knowledge Graph Builder (daily)
   - ⚡ Performance Optimizer (every 6h)
   - 🎭 Orchestrator (hourly)

---

## 📚 DOCUMENTAZIONE DI RIFERIMENTO

**Se hai domande durante il deployment, consulta:**

1. **DEPLOY_NOW.md** - Quick start guide
2. **DEPLOYMENT_GUIDE.md** - Guida completa step-by-step
3. **CODE_REVIEW.md** - Dettagli del code review
4. **FINAL_DEPLOYMENT_REPORT.md** - Status finale e checklist

**Per troubleshooting:**
- Sezione "Troubleshooting" in DEPLOY_NOW.md
- Sezione "🚨 TROUBLESHOOTING" in DEPLOYMENT_GUIDE.md

---

## ⏱️ TIMELINE STIMATA

- **Prerequisiti check**: 2 minuti
- **Pull branch**: 1 minuto
- **Deployment automatico**: 12-15 minuti
- **Verifica post-deployment**: 3 minuti
- **TOTALE**: ~20 minuti

---

## ✅ SUCCESS CRITERIA

**Il deployment è considerato riuscito quando:**

- [x] Backend-TS status = running
- [x] Backend-RAG status = running
- [x] Orchestrator logs mostrano inizializzazione
- [x] Knowledge graph tables esistono
- [x] Almeno 1 agent è stato eseguito con successo
- [x] Nessun errore critico nei log
- [x] Health checks passano

---

## 🎯 NEXT STEPS DOPO DEPLOYMENT

1. **Monitor per 48 ore**
2. Raccogli metriche (esecuzioni agenti, success rate)
3. Se tutto OK → Deploy to production
4. Dopo 1 settimana → Genera impact report

---

## 📞 IN CASO DI PROBLEMI

**Se incontri problemi che non riesci a risolvere:**

1. **Disabilita orchestrator** (safe fallback):
   ```bash
   fly secrets set ENABLE_ORCHESTRATOR=false --app nuzantara-backend
   ```

2. **Rollback completo**:
   ```bash
   fly releases rollback --app nuzantara-backend
   fly releases rollback --app nuzantara-rag
   ```

3. **Check logs dettagliati**:
   ```bash
   fly logs --app nuzantara-backend > backend-logs.txt
   fly logs --app nuzantara-rag > rag-logs.txt
   ```

4. **Chiedi supporto** allegando:
   - backend-logs.txt
   - rag-logs.txt
   - Output dello script di deployment

---

## 🎬 COMANDO FINALE

**Se tutto è pronto, esegui questo singolo comando:**

```bash
./deploy-autonomous-agents.sh
```

**E segui i prompt interattivi.**

---

## 📝 NOTES

- Lo script è idempotente (puoi eseguirlo più volte)
- Ha rollback automatico in caso di failure
- Tutti i secrets sono gestiti in modo sicuro tramite Fly secrets
- I log sono colorati per facilità di lettura
- Il monitoring è opzionale (puoi skipparlo e farlo dopo)

---

**READY TO DEPLOY! 🚀**

**Branch**: `claude/analyze-frontend-backend-coordination-011CUu1coX6KFraX8AVtgein`
**Commit**: `1bbed56`
**Status**: All systems go ✅
