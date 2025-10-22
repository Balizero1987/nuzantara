# RAILWAY DEPLOYMENT CONFIGURATION - CRITICAL

## 🔴 ERRORI TROVATI E FIXES APPLICATI

### Problemi Risolti:
1. ✅ Rimosso `apps/backend-rag/railway.toml` conflittuale
2. ✅ Rimosso `apps/backend-rag/backend/nixpacks.toml` con startCommand in conflitto
3. ✅ UNICO file di configurazione ora: `apps/backend-rag/backend/railway.toml`

### ⚠️ CONFIGURAZIONE RAILWAY DASHBOARD RICHIESTA

**SERVIZIO**: RAG BACKEND
**URL**: https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9

#### STEP 1: Verifica Root Directory
```
Settings → Root Directory
DEVE ESSERE: apps/backend-rag/backend
```

Se è diverso, cambialo in `apps/backend-rag/backend` e salva.

#### STEP 2: Verifica Builder
```
Settings → Builder
DEVE ESSERE: NIXPACKS (not Dockerfile)
```

#### STEP 3: Verifica Start Command (OPZIONALE)
Railway dovrebbe leggere `railway.toml` automaticamente.
Se vuoi sovrascrivere manualmente:
```
Settings → Deploy → Custom Start Command
uvicorn app.main_cloud:app --host 0.0.0.0 --port $PORT
```

#### STEP 4: Verifica Health Check
```
Settings → Health Check
Path: /health
Timeout: 600 seconds (10 minutes)
```

#### STEP 5: Variabili d'Ambiente Richieste
Verifica che siano impostate in Settings → Variables:
- ✅ `DATABASE_URL` (PostgreSQL connection string)
- ✅ `ANTHROPIC_API_KEY`
- ✅ `R2_ACCESS_KEY_ID` (Cloudflare R2)
- ✅ `R2_SECRET_ACCESS_KEY`
- ✅ `R2_ENDPOINT_URL`
- ⚠️ `RAILWAY_VOLUME_MOUNT_PATH` (optional, default: /tmp/chroma_db)
- ⚠️ `TYPESCRIPT_BACKEND_URL` (optional)

#### STEP 6: Trigger Manual Redeploy
```
Deployments → ⋯ Menu → Redeploy
```

---

## 📝 Configurazione File Corrente

**File**: `apps/backend-rag/backend/railway.toml`

```toml
[build]
builder = "NIXPACKS"
watchPaths = ["./**"]

[deploy]
startCommand = "uvicorn app.main_cloud:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 600
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
numReplicas = 1
```

---

## 🧪 Test Deployment

Dopo il redeploy, testa:

```bash
# Health check
curl https://scintillating-kindness-production-47e3.up.railway.app/health

# Oracle collections
curl https://scintillating-kindness-production-47e3.up.railway.app/api/oracle/collections

# Oracle populate (one-time)
curl -X POST https://scintillating-kindness-production-47e3.up.railway.app/admin/populate-oracle-inline

# Oracle query (after populate)
curl -X POST https://scintillating-kindness-production-47e3.up.railway.app/api/oracle/query \
  -H "Content-Type: application/json" \
  -d '{"query":"tax updates","limit":2,"use_ai":false}'
```

---

## 🎯 Root Cause Analysis

L'errore **"config file railway.toml does not exist"** era causato da:

1. **Root Directory** su Railway configurato come `apps/backend-rag` invece di `apps/backend-rag/backend`
2. **Railway cercava** `railway.toml` in `apps/backend-rag/`
3. **File presente** era in `apps/backend-rag/backend/railway.toml`
4. **Conflitto** con un secondo `railway.toml` in `apps/backend-rag/` che aveva startCommand sbagliato

**Soluzione**: Eliminati files conflittuali, mantenuto solo `apps/backend-rag/backend/railway.toml` come unica fonte di verità.
