# 🔧 PATCH: Riattivazione Servizi Offline ZANTARA

**Data:** 2025-11-10
**Target:** nuzantara-rag.fly.dev
**Status:** Ready to implement
**Priorità:** HIGH

---

## 📋 SOMMARIO PATCH

Questa patch risolve i seguenti problemi:
- ❌ ChromaDB offline (credenziali R2 mancanti)
- ❌ PostgreSQL offline (DATABASE_URL mancante)
- ⚠️ Tool Executor offline
- ⚠️ Pricing Service offline
- ⚠️ Reranker disabilitato

---

## 🎯 PREREQUISITI

### 1. Accesso Fly.io
```bash
# Verifica login
fly auth whoami

# Se non loggato:
fly auth login
```

### 2. Credenziali Cloudflare R2
**Dove trovarle:**
1. Vai su https://dash.cloudflare.com/
2. R2 → Overview → Manage R2 API Tokens
3. Crea API Token con permessi: Object Read & Write
4. Salva: Access Key ID + Secret Access Key
5. Ottieni endpoint URL: `https://<account-id>.r2.cloudflarestorage.com`

### 3. Database PostgreSQL
**Opzione A:** Usare Fly.io PostgreSQL (raccomandato)
**Opzione B:** Database esterno (Supabase, Neon.tech, etc)

---

## 🚀 IMPLEMENTAZIONE

### STEP 1: Configurare Cloudflare R2 (CRITICO)

**Obiettivo:** Riattivare ChromaDB con 25,422 documenti

```bash
# 1. Navigare alla directory del progetto
cd /home/user/nuzantara

# 2. Impostare secrets R2 su Fly.io
fly secrets set \
  R2_ACCESS_KEY_ID="YOUR_R2_ACCESS_KEY_HERE" \
  R2_SECRET_ACCESS_KEY="YOUR_R2_SECRET_KEY_HERE" \
  R2_ENDPOINT_URL="https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com" \
  --app nuzantara-rag

# 3. Verificare secrets impostati
fly secrets list --app nuzantara-rag

# Output atteso:
# NAME                    DIGEST          CREATED AT
# R2_ACCESS_KEY_ID        xxx...          just now
# R2_SECRET_ACCESS_KEY    xxx...          just now
# R2_ENDPOINT_URL         xxx...          just now
```

**Validazione:**
- ✅ Tutti e 3 i secrets devono essere presenti
- ✅ R2_ENDPOINT_URL deve iniziare con `https://`
- ✅ Account ID deve corrispondere al tuo account Cloudflare

---

### STEP 2: Setup PostgreSQL Database (CRITICO)

**Obiettivo:** Abilitare persistent memory e conversazioni

#### Opzione A: PostgreSQL su Fly.io (Raccomandato)

```bash
# 1. Creare database PostgreSQL
fly postgres create \
  --name nuzantara-db \
  --region ams \
  --initial-cluster-size 1 \
  --vm-size shared-cpu-1x \
  --volume-size 10

# Output:
# Postgres cluster nuzantara-db created
# Username:    postgres
# Password:    <generated-password>
# Hostname:    nuzantara-db.internal
# ...

# 2. Salvare password (mostrata solo una volta!)
# IMPORTANTE: Copia la password generata!

# 3. Attach database all'app RAG
fly postgres attach nuzantara-db --app nuzantara-rag

# Output:
# DATABASE_URL secret has been set on nuzantara-rag

# 4. Verificare attachment
fly secrets list --app nuzantara-rag | grep DATABASE_URL

# Output atteso:
# DATABASE_URL    xxx...    just now
```

#### Opzione B: PostgreSQL Esterno

```bash
# Se usi Supabase, Neon.tech, o altro provider:

# 1. Ottenere connection string dal provider
# Formato: postgresql://user:password@host:5432/dbname

# 2. Impostare secret
fly secrets set \
  DATABASE_URL="postgresql://user:password@host:5432/dbname" \
  --app nuzantara-rag

# 3. Verificare
fly secrets list --app nuzantara-rag | grep DATABASE_URL
```

**Validazione:**
- ✅ DATABASE_URL deve essere presente
- ✅ Connection string deve essere valida
- ✅ Database deve essere accessibile dall'app Fly.io

---

### STEP 3: Deploy con Nuove Configurazioni

```bash
# 1. Verificare che tutti i secrets siano configurati
fly secrets list --app nuzantara-rag

# Output atteso (minimo 4 secrets):
# R2_ACCESS_KEY_ID
# R2_SECRET_ACCESS_KEY
# R2_ENDPOINT_URL
# DATABASE_URL

# 2. Redeploy l'applicazione
cd apps/backend-rag
fly deploy --app nuzantara-rag

# 3. Monitorare deployment
fly logs --app nuzantara-rag

# Cerca nel log:
# ✅ "✅ ChromaDB loaded from Cloudflare R2"
# ✅ "✅ ChromaDB search service ready"
# ✅ "✅ MemoryServicePostgres ready (PostgreSQL enabled)"
# ✅ "✅ ChromaDB warmup complete"
```

**Validazione Deployment:**
```bash
# 1. Health check immediato
curl https://nuzantara-rag.fly.dev/health | jq .

# Output atteso (verificare questi campi):
# {
#   "status": "healthy",
#   "chromadb": true,              ← DEVE essere true
#   "memory": {
#     "postgresql": true,           ← DEVE essere true
#     "vector_db": true             ← DEVE essere true
#   }
# }

# 2. Test RAG query
curl -X POST https://nuzantara-rag.fly.dev/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is KBLI?",
    "collection": "kbli"
  }' | jq .

# Output atteso: Risposta RAG con documenti (NON "Search service not available")

# 3. Test collections
curl https://nuzantara-rag.fly.dev/api/collections | jq .

# Output atteso: Lista di collezioni (NON "Search service not available")
```

---

### STEP 4: Configurazioni Opzionali

#### A. Abilitare Reranker (Performance +40%)

**File:** `apps/backend-rag/backend/app/config.py`

```python
# Linea 57: Già abilitato nel config, ma verificare che funzioni
enable_reranker: bool = True
```

**Verifica dopo deploy:**
```bash
curl https://nuzantara-rag.fly.dev/health | jq '.reranker'

# Output atteso:
# {
#   "enabled": true,
#   "status": "operational"
# }
```

Se ancora disabled, controllare logs:
```bash
fly logs --app nuzantara-rag | grep -i reranker
```

#### B. Fix Tool Executor (se ancora offline)

**Verifica backend TypeScript:**
```bash
# 1. Check se backend TS è online
curl https://nuzantara-backend.fly.dev/health

# Se offline/errore:
fly status --app nuzantara-backend

# Se serve redeploy:
cd apps/backend-ts
npm run build
fly deploy --app nuzantara-backend
```

**Configurare URL corretto:**
```bash
# Se backend TS ha URL diverso, aggiornare:
fly secrets set \
  TYPESCRIPT_BACKEND_URL="https://nuzantara-backend.fly.dev" \
  --app nuzantara-rag

# Redeploy
fly deploy --app nuzantara-rag
```

#### C. Fix Pricing Service

**Verifica import e dipendenze:**
```bash
# 1. Controllare logs durante startup
fly logs --app nuzantara-rag | grep -A 10 "PricingService"

# Se errore import, verificare file esiste:
fly ssh console --app nuzantara-rag
ls -la backend/services/pricing_service.py
exit

# Se manca, potrebbe essere necessario aggiungere al deployment
```

---

## 🧪 TESTING COMPLETO

### Test Suite Post-Deploy

```bash
#!/bin/bash
# File: test_services_online.sh

echo "🧪 Testing ZANTARA Services..."
echo ""

# 1. Health Check
echo "1️⃣ Health Check..."
HEALTH=$(curl -s https://nuzantara-rag.fly.dev/health)
echo "$HEALTH" | jq .
echo ""

# 2. ChromaDB Status
echo "2️⃣ ChromaDB Status..."
CHROMADB=$(echo "$HEALTH" | jq -r '.chromadb')
if [ "$CHROMADB" = "true" ]; then
  echo "✅ ChromaDB: ONLINE"
else
  echo "❌ ChromaDB: OFFLINE"
fi
echo ""

# 3. PostgreSQL Status
echo "3️⃣ PostgreSQL Status..."
POSTGRES=$(echo "$HEALTH" | jq -r '.memory.postgresql')
if [ "$POSTGRES" = "true" ]; then
  echo "✅ PostgreSQL: ONLINE"
else
  echo "❌ PostgreSQL: OFFLINE"
fi
echo ""

# 4. RAG Query Test
echo "4️⃣ RAG Query Test..."
RAG_RESPONSE=$(curl -s -X POST https://nuzantara-rag.fly.dev/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is KBLI?", "collection": "kbli"}')

if echo "$RAG_RESPONSE" | grep -q "Search service not available"; then
  echo "❌ RAG Query: FAILED"
else
  echo "✅ RAG Query: SUCCESS"
  echo "$RAG_RESPONSE" | jq '.answer' 2>/dev/null || echo "$RAG_RESPONSE"
fi
echo ""

# 5. Collections Test
echo "5️⃣ Collections Test..."
COLLECTIONS=$(curl -s https://nuzantara-rag.fly.dev/api/collections)
if echo "$COLLECTIONS" | grep -q "Search service not available"; then
  echo "❌ Collections: FAILED"
else
  echo "✅ Collections: SUCCESS"
  echo "$COLLECTIONS" | jq '.collections | length' 2>/dev/null || echo "$COLLECTIONS"
fi
echo ""

# 6. CRM Test
echo "6️⃣ CRM System Test..."
CRM_STATUS=$(echo "$HEALTH" | jq -r '.crm.enabled')
if [ "$CRM_STATUS" = "true" ]; then
  echo "✅ CRM: ONLINE"
  echo "$HEALTH" | jq '.crm'
else
  echo "❌ CRM: OFFLINE"
fi
echo ""

# 7. AI Services Test
echo "7️⃣ AI Services Test..."
AI_STATUS=$(echo "$HEALTH" | jq -r '.ai.has_ai')
echo "   Llama 4 Scout: $(echo "$HEALTH" | jq -r '.ai.primary' 2>/dev/null || echo 'N/A')"
echo "   Claude Haiku: $(echo "$HEALTH" | jq -r '.ai.fallback' 2>/dev/null || echo 'N/A')"
echo ""

# Summary
echo "📊 SUMMARY"
echo "=========="
echo "✅ Services Online:"
echo "$HEALTH" | jq -r 'to_entries | map(select(.value == true)) | .[].key' 2>/dev/null || echo "Check manually"
echo ""
echo "❌ Services Offline:"
echo "$HEALTH" | jq -r 'to_entries | map(select(.value == false)) | .[].key' 2>/dev/null || echo "Check manually"
```

**Eseguire test:**
```bash
chmod +x test_services_online.sh
./test_services_online.sh
```

---

## 📊 METRICHE SUCCESSO

### Criteri di Accettazione

✅ **CRITICAL (Must Have):**
- [ ] ChromaDB online (`chromadb: true`)
- [ ] PostgreSQL online (`memory.postgresql: true`)
- [ ] RAG queries funzionanti (no "Search service not available")
- [ ] Collections accessibili (lista collezioni disponibile)
- [ ] 25,422 documenti accessibili

✅ **HIGH (Should Have):**
- [ ] CRM System operativo (`crm.enabled: true`)
- [ ] AI Services operativi (Llama 4 Scout)
- [ ] Memory vector DB funzionante (`memory.vector_db: true`)

⚠️ **MEDIUM (Nice to Have):**
- [ ] Tool Executor online
- [ ] Pricing Service online
- [ ] Reranker abilitato

---

## 🔄 ROLLBACK PLAN

Se il deploy fallisce:

```bash
# 1. Controllare logs
fly logs --app nuzantara-rag

# 2. Verificare secrets
fly secrets list --app nuzantara-rag

# 3. Se necessario, rimuovere secrets problematici
fly secrets unset R2_ACCESS_KEY_ID --app nuzantara-rag
fly secrets unset R2_SECRET_ACCESS_KEY --app nuzantara-rag
fly secrets unset R2_ENDPOINT_URL --app nuzantara-rag

# 4. Redeploy versione precedente
fly deploy --app nuzantara-rag

# 5. Sistema tornerà allo stato "funzionante ma limitato"
```

---

## 📝 CHECKLIST IMPLEMENTAZIONE

### Pre-Deploy
- [ ] Ottenere credenziali Cloudflare R2
- [ ] Decidere strategia PostgreSQL (Fly.io vs esterno)
- [ ] Backup configurazione attuale
- [ ] Verificare accesso Fly.io

### Deploy Phase 1 (ChromaDB)
- [ ] Configurare R2_ACCESS_KEY_ID
- [ ] Configurare R2_SECRET_ACCESS_KEY
- [ ] Configurare R2_ENDPOINT_URL
- [ ] Verificare secrets
- [ ] Deploy applicazione
- [ ] Monitorare logs per "ChromaDB loaded from R2"
- [ ] Test health endpoint (chromadb: true)
- [ ] Test RAG query

### Deploy Phase 2 (PostgreSQL)
- [ ] Setup PostgreSQL database
- [ ] Configurare DATABASE_URL
- [ ] Verificare secret
- [ ] Deploy applicazione
- [ ] Monitorare logs per "MemoryServicePostgres ready"
- [ ] Test health endpoint (postgresql: true)
- [ ] Test memory save/retrieve

### Post-Deploy Validation
- [ ] Eseguire test suite completo
- [ ] Verificare tutti i servizi online
- [ ] Testare frontend webapp
- [ ] Verificare metriche performance
- [ ] Documentare eventuali issue

### Opzionale
- [ ] Abilitare Reranker
- [ ] Fix Tool Executor
- [ ] Fix Pricing Service
- [ ] Setup monitoring alerts

---

## 🆘 TROUBLESHOOTING

### Problema: ChromaDB ancora offline dopo deploy

**Soluzione 1:** Verificare credenziali R2
```bash
# Testare accesso R2 manualmente
aws s3 ls s3://nuzantaradb/chroma_db/ \
  --endpoint-url=$R2_ENDPOINT_URL \
  --profile r2
```

**Soluzione 2:** Forzare download completo
```bash
# SSH nell'app
fly ssh console --app nuzantara-rag

# Rimuovere ChromaDB locale
rm -rf /data/chroma_db_FULL_deploy

# Exit e redeploy
exit
fly deploy --app nuzantara-rag
```

### Problema: PostgreSQL connection timeout

**Soluzione:** Verificare firewall rules
```bash
# Se usi PostgreSQL esterno, allow Fly.io IPs
# Consulta documentazione provider database
```

### Problema: Out of Memory durante deploy

**Soluzione:** Aumentare risorse VM
```bash
fly scale memory 512 --app nuzantara-rag
fly deploy --app nuzantara-rag
```

---

## 📞 SUPPORTO

**In caso di problemi:**
1. Controllare logs: `fly logs --app nuzantara-rag`
2. Verificare status: `fly status --app nuzantara-rag`
3. Consultare docs: https://fly.io/docs/
4. Contattare: zero@balizero.com

---

## 📌 NOTE FINALI

### Cosa cambia dopo la patch:
- ✅ RAG queries operative (accesso a 25,422 documenti)
- ✅ Semantic search funzionante
- ✅ Persistent memory tra sessioni
- ✅ Storico conversazioni salvato
- ✅ Sistema completamente operativo

### Cosa NON cambia:
- ✅ Llama 4 Scout rimane AI primario
- ✅ Frontend webapp invariato
- ✅ CRM system invariato
- ✅ Collaborative Intelligence invariata

### Costi Stimati:
- **Cloudflare R2:** ~$0.015/GB/mese storage + $0.36/milione requests
- **Fly.io PostgreSQL:** ~$7-15/mese (dipende da dimensione)
- **Nessun costo extra:** Per R2/PostgreSQL esterni esistenti

---

**Patch preparata da:** Claude Code (Sonnet 4.5)
**Data:** 2025-11-10
**Branch:** claude/analyze-codebase-features-011CUyPo3nSGqshfcq34hU4z
**Versione:** 1.0

**Ready to implement!** 🚀
