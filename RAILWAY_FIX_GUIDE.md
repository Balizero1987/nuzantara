# 🔧 Railway Backend Fix Guide - AUTONOMO

## 📊 Problema Identificato

**Status**: Backend RAG deployment completato MA:
- Health endpoint: 403 Access Denied (era 200 OK prima)
- Possibili cause:
  1. ANTHROPIC_API_KEY mancante/non valida
  2. Cambio configurazione auth nel deployment recente
  3. Environment variables non caricate

---

## 🚀 FIX IMMEDIATO (Railway CLI)

### Step 1: Verifica Status
```bash
railway status
```

### Step 2: Controlla Env Variables
```bash
# Vedi tutte le env vars del RAG backend
railway variables --service "RAG BACKEND"

# Cerca ANTHROPIC_API_KEY
railway variables --service "RAG BACKEND" | grep -i anthropic
```

### Step 3: Aggiungi/Aggiorna API Key
```bash
# Se manca, aggiungi
railway variables set ANTHROPIC_API_KEY="sk-ant-api03-TUA-CHIAVE-QUI" --service "RAG BACKEND"

# Se esiste ma è sbagliata, aggiorna
railway variables set ANTHROPIC_API_KEY="sk-ant-api03-NUOVA-CHIAVE" --service "RAG BACKEND"
```

### Step 4: Verifica Altre Env Vars Necessarie
```bash
# Il backend RAG potrebbe aver bisogno di:
railway variables set CLAUDE_API_KEY="sk-ant-api03-..." --service "RAG BACKEND"
railway variables set CLAUDE_MODEL="claude-sonnet-4.5-20250929" --service "RAG BACKEND"
railway variables set ANTHROPIC_MODEL="claude-sonnet-4.5-20250929" --service "RAG BACKEND"
```

### Step 5: Trigger Redeploy
```bash
# Railway farà redeploy automatico dopo set variables
# Oppure forza redeploy manuale:
railway up --service "RAG BACKEND"
```

### Step 6: Monitor Logs
```bash
# Watch logs in real-time
railway logs --service "RAG BACKEND"

# Cerca errori:
# - "API key not found"
# - "Authentication failed"
# - "Anthropic connection error"
```

### Step 7: Verifica Health Endpoint
```bash
# Aspetta 3-5 minuti dopo redeploy, poi:
curl https://scintillating-kindness-production-47e3.up.railway.app/health

# Risposta attesa:
# {
#   "status": "healthy",
#   "anthropic": true,   ✅ DEVE essere true
#   "router": true       ✅ DEVE essere true
# }
```

---

## 🔍 DEBUG: Se Continua a Dare 403

### Check 1: Verifica Service Name
```bash
railway status
# Output dovrebbe mostrare:
# - RAG BACKEND (Python)
# - TS-BACKEND (TypeScript)
```

Se il nome è diverso, usa quello corretto:
```bash
railway variables --service "nome-esatto-del-servizio"
```

### Check 2: Verifica Root Directory
```bash
# Il RAG backend dovrebbe avere:
# Root Directory: apps/backend-rag/backend

# Controlla su Railway Dashboard:
# Service → Settings → Root Directory
```

### Check 3: Verifica Dockerfile
```bash
# Il backend usa Dockerfile per build
# Controlla: apps/backend-rag/backend/Dockerfile
# Entry point deve essere: app/main_integrated.py o app/main_cloud.py
```

### Check 4: Check Recent Deployments
```bash
railway logs --service "RAG BACKEND" | grep -i "error\|failed\|exception" | tail -20
```

---

## 🎯 ALTERNATIVE FIX (Railway Dashboard)

Se Railway CLI da problemi:

1. **Apri**: https://railway.com/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9

2. **Clicca** su "RAG BACKEND" service

3. **Tab "Variables"**:
   - Aggiungi `ANTHROPIC_API_KEY` = `sk-ant-api03-[tua-chiave]`
   - Verifica `PORT` = `8000`
   - Verifica altre vars necessarie

4. **Tab "Deployments"**:
   - Vedi ultimo deployment
   - Se FAILED → clicca "View Logs"
   - Se SUCCESS ma 403 → problema auth/env vars

5. **Tab "Settings"**:
   - Verifica "Root Directory" = `apps/backend-rag/backend`
   - Verifica "Start Command" (se custom)
   - Verifica "Health Check Path" = `/health`

6. **Redeploy**:
   - Dopo fix env vars, Railway redeploya automaticamente
   - Oppure clicca "Deploy" → "Redeploy"

---

## 📋 Checklist Completa

- [ ] Railway CLI funziona (`railway status`)
- [ ] Service RAG BACKEND visibile
- [ ] ANTHROPIC_API_KEY presente e valida
- [ ] Altre env vars configurate (se necessarie)
- [ ] Root Directory corretto: `apps/backend-rag/backend`
- [ ] Deployment SUCCESS (non FAILED)
- [ ] Logs senza errori critici
- [ ] Health endpoint risponde 200 OK
- [ ] JSON response mostra `"anthropic": true`
- [ ] Tutti i 10 agenti caricati correttamente

---

## 🧪 Test Finale

Dopo fix, testa i nuovi agenti:

```bash
# Test 1: Smart Fallback Chain
curl -X POST https://scintillating-kindness-production-47e3.up.railway.app/search \
  -H "Content-Type: application/json" \
  -d '{"query": "KITAS visa requirements", "user_level": 3, "enable_fallbacks": true}'

# Test 2: Cross-Oracle Synthesis
curl -X POST https://scintillating-kindness-production-47e3.up.railway.app/synthesize \
  -H "Content-Type: application/json" \
  -d '{"query": "Start PT PMA restaurant in Bali", "user_level": 3}'

# Test 3: Client Journey
curl -X POST https://scintillating-kindness-production-47e3.up.railway.app/journey/create \
  -H "Content-Type: application/json" \
  -d '{"journey_type": "pt_pma_setup", "client_name": "Test Co", "client_email": "test@test.com"}'
```

Se tutti e 3 funzionano = ✅ I 10 agenti sono LIVE! 🎉

---

## 💡 Note Importanti

1. **API Key Format**: Deve iniziare con `sk-ant-api03-`
2. **Redeploy Time**: 3-5 minuti dopo set env vars
3. **Health Check Timeout**: Railway aspetta 10 min (config in railway.toml)
4. **ChromaDB Download**: Primo deploy scarica 72MB, ci vuole tempo
5. **Model Loading**: Sentence transformers caricati all'avvio

---

**Ultimo Deployment**: 2025-10-22 ~14:47 UTC
**Commit**: ea70e46 - "Merge: 10 Advanced Agentic Functions"
**Branch**: main

🔥 Be autonomous and fix it!
