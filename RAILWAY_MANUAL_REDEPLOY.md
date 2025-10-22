# 🚀 Railway Manual Redeploy - Guida Visiva

## Passo 1: Vai al Dashboard
```
https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9
```

## Passo 2: Seleziona il Service
Click su **"RAG BACKEND"** nella lista dei services (colonna sinistra)

## Passo 3: Vai a Deployments
Nella parte alta, click sul tab **"Deployments"**

## Passo 4: Trova Latest Deployment
Vedrai una lista di deployment con:
- ID deployment (es. `af651f59`)
- Status (SUCCESS / FAILED / BUILDING)
- Timestamp
- Commit message

## Passo 5: Menu Deploy
Sul deployment più recente, vedrai **3 puntini verticali (⋯)** sulla destra

Click sui **⋯**

## Passo 6: Redeploy
Nel menu dropdown che appare, seleziona:
```
🔄 Redeploy
```

## Passo 7: Conferma
Railway chiederà conferma:
```
"Are you sure you want to redeploy?"
```
Click **"Redeploy"**

---

## ⏱️ Cosa Aspettarsi

### Durante il Build (3-5 minuti)
- Status: `BUILDING`
- Logs live disponibili cliccando sul deployment
- Railway scarica ChromaDB (72MB, ~2-3 min)
- Installa dependencies Python

### Durante lo Startup (2-3 minuti)
- Status: `DEPLOYING`
- Healthcheck in esecuzione (timeout: 600s)
- ChromaDB initialization

### Quando Pronto
- Status: `SUCCESS` ✅
- Service running su `https://scintillating-kindness-production-47e3.up.railway.app`

---

## 🧪 Test Immediato (Dopo SUCCESS)

### 1. Verifica Versione
```bash
curl https://scintillating-kindness-production-47e3.up.railway.app/health
```
**Aspettati**: `version` NON più `2.0.0` (dovrebbe essere `3.2.0-crm` o simile)

### 2. Verifica Endpoint Nuovo
```bash
curl -X POST https://scintillating-kindness-production-47e3.up.railway.app/api/oracle/populate-now
```
**Aspettati**: `{"success": true}` (NON più 404!)

### 3. Popola Collections
```bash
curl -X POST https://scintillating-kindness-production-47e3.up.railway.app/api/oracle/populate-now
```
**Aspettati**: `{"success": true, "total_documents": 17}`

### 4. Test Oracle Query
```bash
curl -X POST https://scintillating-kindness-production-47e3.up.railway.app/api/oracle/query \
  -H "Content-Type: application/json" \
  -d '{"query":"latest tax updates","limit":3,"use_ai":false}'
```
**Aspettati**: JSON con `results` array contenente tax updates

---

## 🔧 Alternative: Redeploy via CLI

Se preferisci CLI:
```bash
railway up --service "RAG BACKEND"
```

Oppure force redeploy specifico commit:
```bash
railway up --service "RAG BACKEND" --detach
```

---

## ⚠️ Se Redeploy Fallisce

### Check Build Logs
1. Click sul deployment FAILED
2. Tab "Build Logs"
3. Cerca errori tipo:
   - `railway.toml not found`
   - `ModuleNotFoundError`
   - `Port already in use`

### Check Deploy Logs
1. Tab "Deploy Logs"
2. Cerca:
   - Healthcheck timeout
   - Application crash
   - ChromaDB errors

### Common Fixes
```bash
# Se railway.toml not found
Settings → Root Directory → apps/backend-rag/backend

# Se healthcheck timeout
Settings → Health Check → Timeout: 600 seconds

# Se port issues
Settings → Deploy → Start Command:
uvicorn app.main_cloud:app --host 0.0.0.0 --port $PORT
```

---

## 📞 Se Continua a Non Funzionare

**Ping me** con:
1. Screenshot del deployment status
2. Build logs (ultimi 50 righe)
3. Deploy logs (ultimi 50 righe)

Oppure prova:
- Settings → Root Directory → Riconferma `apps/backend-rag/backend` e **Save**
- Trigger nuovo redeploy dopo save
