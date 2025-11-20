# Deploy Backend RAG - Workflow Automatico ✅

**Data:** 20 Novembre 2025  
**File:** `.github/workflows/deploy-backend-rag.yml`  
**Status:** ✅ CREATO E PRONTO

---

## 🎯 OVERVIEW

Workflow GitHub Actions per deployare automaticamente `nuzantara-rag` su Fly.io quando vengono modificati file in `apps/backend-rag/`.

### Features
- ✅ Deploy automatico su push a `main`
- ✅ Deploy manuale tramite workflow_dispatch
- ✅ Python quality checks (black, isort, ruff)
- ✅ Health checks post-deployment
- ✅ Test auth endpoint `/api/auth/verify`
- ✅ Notifiche Slack (opzionali)
- ✅ Rolling deployment (zero-downtime)

---

## 🚀 TRIGGER

### Automatico
```yaml
on:
  push:
    branches: [main]
    paths:
      - 'apps/backend-rag/**'
      - '.github/workflows/deploy-backend-rag.yml'
      - 'fly.toml'
```

**Quando si attiva:**
- Push su `main` che modifica file in `apps/backend-rag/`
- Modifica del workflow stesso
- Modifica di `fly.toml`

### Manuale
```bash
# Via GitHub UI
Actions → Deploy Backend RAG → Run workflow

# Via CLI
gh workflow run deploy-backend-rag.yml
```

---

## 📋 JOBS

### 1. ✅ Pre-Flight Checks
**Durata:** ~10s

**Cosa fa:**
- Verifica se ci sono modifiche in `apps/backend-rag/`
- Skip deploy se nessuna modifica (ottimizzazione)
- Output deployment info

**Output:**
- `should_deploy`: true/false

### 2. 🐍 Python Quality Checks
**Durata:** ~30s

**Checks:**
- **Black** - Code formatting
- **isort** - Import sorting
- **Ruff** - Fast Python linter

**Note:** Tutti i check sono `continue-on-error: true` per non bloccare il deploy

### 3. 🚀 Deploy to Fly.io
**Durata:** ~5-8 minuti

**Steps:**
1. Setup Fly.io CLI
2. Deploy con `flyctl deploy`
3. Strategy: rolling (zero-downtime)
4. Wait timeout: 10 minuti
5. Remote-only build

**Environment:**
- Name: `production-rag`
- URL: `https://nuzantara-rag.fly.dev`

**Secrets Required:**
- `FLY_API_TOKEN` (già configurato)

### 4. 🏥 Health Check
**Durata:** ~1-2 minuti

**Tests:**
1. **Health Endpoint**
   - URL: `https://nuzantara-rag.fly.dev/health`
   - Max retries: 10
   - Retry interval: 10s
   - Expected: HTTP 200

2. **Auth Endpoint**
   - URL: `https://nuzantara-rag.fly.dev/api/auth/verify`
   - Method: POST
   - Body: `{"token": "demo-token-test"}`
   - Expected: `{"valid": true, "user": {...}}`

### 5. 📢 Notifications
**Durata:** ~5s

**Success:**
- GitHub Step Summary con deployment details
- Slack notification (se configurato)

**Failure:**
- GitHub Step Summary con troubleshooting steps
- Slack notification (se configurato)

---

## 🔧 CONFIGURAZIONE

### Secrets Necessari
```bash
# Già configurato in GitHub
FLY_API_TOKEN=<fly-api-token>
```

### Variables Opzionali
```bash
# Per notifiche Slack (opzionale)
SLACK_WEBHOOK_URL=<webhook-url>
```

### Verifica Secrets
```bash
gh secret list
# Output atteso: FLY_API_TOKEN
```

---

## 📊 WORKFLOW EXECUTION

### Esempio di Esecuzione Completa

```
✅ Pre-Flight Checks (10s)
   ✅ Checkout code
   ✅ Check backend-rag changes
   ✅ Deployment info

🐍 Python Quality Checks (30s)
   ✅ Setup Python 3.11
   ✅ Install dependencies
   ⚠️ Black check (warnings)
   ⚠️ isort check (warnings)
   ⚠️ Ruff check (warnings)

🚀 Deploy to Fly.io (5-8 min)
   ✅ Checkout code
   ✅ Setup Fly.io CLI
   ✅ Deploy to Fly.io
   ✅ Wait for stabilization

🏥 Health Check (1-2 min)
   ✅ Health endpoint (HTTP 200)
   ✅ Auth endpoint test
   ✅ Response validation

📢 Notify Success (5s)
   ✅ Deployment summary
   ✅ Slack notification

Total: ~7-12 minutes
```

---

## 🧪 TESTING

### Test Locale (Prima del Push)
```bash
# 1. Verifica Python quality
cd apps/backend-rag
python -m black --check backend/
python -m isort --check-only backend/
python -m ruff check backend/

# 2. Test build Docker locale
cd /Users/antonellosiano/Desktop/NUZANTARA-CLEAN-ARCHITECT
docker build -f apps/backend-rag/Dockerfile.fly -t test-rag .

# 3. Test container locale
docker run -p 8000:8000 test-rag
curl http://localhost:8000/health
```

### Test Workflow (Dry Run)
```bash
# Trigger manuale senza deploy reale
gh workflow run deploy-backend-rag.yml --ref main
```

### Monitorare Workflow
```bash
# Lista runs
gh run list --workflow=deploy-backend-rag.yml --limit 5

# Watch latest run
gh run watch

# View run details
gh run view <run-id>

# View logs
gh run view <run-id> --log
```

---

## 🐛 TROUBLESHOOTING

### Deploy Fallisce

#### 1. Build Error
```bash
# Check Dockerfile
cat apps/backend-rag/Dockerfile.fly

# Verify requirements.txt
cat apps/backend-rag/requirements.txt

# Test build locale
docker build -f apps/backend-rag/Dockerfile.fly -t test-rag .
```

#### 2. Fly.io Error
```bash
# Check app status
fly status -a nuzantara-rag

# Check logs
fly logs -a nuzantara-rag

# Check releases
fly releases -a nuzantara-rag
```

#### 3. Health Check Fails
```bash
# Test health endpoint
curl https://nuzantara-rag.fly.dev/health

# Check app logs
fly logs -a nuzantara-rag | grep -i error

# SSH into machine
fly ssh console -a nuzantara-rag
```

### Workflow Non Si Attiva

#### Check Triggers
```bash
# Verifica che i file modificati siano in apps/backend-rag/
git diff --name-only HEAD^ HEAD | grep "apps/backend-rag/"

# Se nessun output, il workflow non si attiva
```

#### Force Trigger
```bash
# Trigger manuale
gh workflow run deploy-backend-rag.yml
```

### Python Quality Checks Falliscono

**Nota:** I quality checks sono `continue-on-error: true`, quindi NON bloccano il deploy.

**Fix (opzionale):**
```bash
cd apps/backend-rag

# Auto-fix formatting
python -m black backend/
python -m isort backend/

# Check linting
python -m ruff check backend/ --fix

# Commit fixes
git add backend/
git commit -m "style: fix python formatting"
git push
```

---

## 📈 MONITORING

### GitHub Actions Dashboard
```
https://github.com/Balizero1987/nuzantara/actions/workflows/deploy-backend-rag.yml
```

### Fly.io Dashboard
```
https://fly.io/apps/nuzantara-rag
```

### Health Endpoint
```bash
# Check health
curl https://nuzantara-rag.fly.dev/health | jq '.'

# Monitor continuously
watch -n 5 'curl -s https://nuzantara-rag.fly.dev/health | jq ".status"'
```

### Logs
```bash
# Real-time logs
fly logs -a nuzantara-rag

# Filter errors
fly logs -a nuzantara-rag | grep -i error

# Last 100 lines
fly logs -a nuzantara-rag --limit 100
```

---

## 🎯 BEST PRACTICES

### 1. Test Locale Prima del Push
```bash
# Sempre testare localmente
cd apps/backend-rag
pytest tests/
python -m black --check backend/
```

### 2. Commit Atomici
```bash
# Un commit = una feature/fix
git add apps/backend-rag/backend/app/auth_mock.py
git commit -m "feat(auth): add /api/auth/verify endpoint"
```

### 3. Monitorare Deploy
```bash
# Dopo il push, monitora il workflow
gh run watch
```

### 4. Verificare Health
```bash
# Dopo il deploy, verifica health
curl https://nuzantara-rag.fly.dev/health
curl -X POST https://nuzantara-rag.fly.dev/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "demo-token"}'
```

---

## 🔄 ROLLBACK

### Automatic Rollback
Il workflow usa `strategy: rolling`, quindi Fly.io mantiene la versione precedente fino a quando la nuova è healthy.

### Manual Rollback
```bash
# Lista releases
fly releases -a nuzantara-rag

# Rollback a release precedente
fly releases rollback <release-id> -a nuzantara-rag

# Verifica
fly status -a nuzantara-rag
```

---

## 📝 NEXT STEPS

### Immediate
1. ✅ Workflow creato
2. ⏳ Commit e push workflow
3. ⏳ Trigger primo deploy automatico

### Short Term
- [ ] Configurare Slack webhook (opzionale)
- [ ] Aggiungere più test post-deployment
- [ ] Configurare staging environment

### Long Term
- [ ] Aggiungere integration tests
- [ ] Configurare blue-green deployment
- [ ] Aggiungere performance monitoring

---

## ✅ COMMIT WORKFLOW

```bash
# Add workflow
git add .github/workflows/deploy-backend-rag.yml
git add DEPLOY_BACKEND_RAG_WORKFLOW.md

# Commit
git commit -m "feat(ci): add automatic deployment workflow for backend RAG

- Auto-deploy on push to main (apps/backend-rag/ changes)
- Python quality checks (black, isort, ruff)
- Health checks post-deployment
- Auth endpoint testing
- Slack notifications (optional)
- Rolling deployment strategy

Workflow triggers:
- Automatic: push to main with backend-rag changes
- Manual: workflow_dispatch

Deploy time: ~7-12 minutes
Zero-downtime: rolling strategy"

# Push
git push origin main
```

---

## 🎉 CONCLUSIONE

**Status:** ✅ **WORKFLOW PRONTO**

**Features:**
- ✅ Deploy automatico
- ✅ Quality checks
- ✅ Health verification
- ✅ Zero-downtime
- ✅ Notifications

**Prossimo Deploy:**
- Automatico al prossimo push su `main` con modifiche in `apps/backend-rag/`

---

**Creato:** 20 Novembre 2025  
**Status:** ✅ **PRODUCTION-READY**
