# 🚀 Strategia di Deployment - Pattern di Successo

**Basata su:** Analisi dei deploy precedenti riusciti (v5.3, production workflows)

**Data:** 2025-01-27
**Versione:** 1.0

---

## 📋 Overview

Questa strategia è basata sui pattern di successo osservati nei deploy precedenti del sistema ZANTARA, incluso il deployment v5.3 Ultra Hybrid e i workflow di produzione automatizzati.

---

## ✅ Fase 1: Pre-Deployment Validation (Pre-Flight Checks)

### 1.1 Verifiche Pre-Deploy

```bash
# ✅ Verifica branch e commit
git status
git log --oneline -1

# ✅ Verifica che non ci siano modifiche non committate
git diff --exit-code

# ✅ Verifica configurazione Fly.io
flyctl status --app nuzantara-backend
flyctl status --app nuzantara-rag

# ✅ Valida fly.toml (NUOVO - Previene errori di configurazione)
cd apps/backend-ts
flyctl config validate --app nuzantara-backend || echo "⚠️ Config validation failed"

cd ../backend-rag
flyctl config validate --app nuzantara-rag || echo "⚠️ Config validation failed"

# Verifica sintassi TOML (alternativa se flyctl non disponibile)
# Python:
python -c "import tomllib; tomllib.loads(open('fly.toml').read())" 2>/dev/null || echo "⚠️ TOML syntax error"

# Node.js alternative:
# npx @iarna/toml parse < fly.toml || echo "⚠️ TOML syntax error"
```

### 1.2 Checklist Pre-Deploy

- [ ] **Working tree pulito** - Nessuna modifica non committata
- [ ] **Test passati localmente** - Eseguire test prima del deploy
- [ ] **Build locale funzionante** - Verificare che compili correttamente
- [ ] **fly.toml validato** - ⭐ NUOVO: Validare configurazione Fly.io
- [ ] **Secrets verificati** - Controllare che tutti i secrets siano configurati
- [ ] **Health endpoints verificati** - ⭐ NUOVO: Verificare endpoint corretti
- [ ] **Database backup** - (Opzionale ma consigliato)

### 1.3 Verifica Secrets

```bash
# Backend TypeScript
flyctl secrets list --app nuzantara-backend

# Backend RAG
flyctl secrets list --app nuzantara-rag

# Verificare secrets critici:
# - OPENROUTER_API_KEY (backend-ts)
# - GOOGLE_API_KEY (backend-rag)
# - GOOGLE_CREDENTIALS_JSON (backend-rag)
# - DATABASE_URL (backend-rag)
# - OPENAI_API_KEY (backend-rag)
```

### 1.4 Verifica Health Endpoints (NUOVO)

**⚠️ IMPORTANTE:** Verificare endpoint corretti prima del deploy

```bash
# Backend TypeScript: /health
curl -s https://nuzantara-backend.fly.dev/health | jq '.' || echo "❌ Backend TS health check failed"

# Backend RAG: /health (standardizzato)
curl -s https://nuzantara-rag.fly.dev/health | jq '.' || echo "❌ Backend RAG health check failed"

# Verifica che rispondano correttamente
```

**Endpoint Mapping:**
- **Backend TypeScript:** `/health`, `/health/detailed`, `/api/monitoring/ai-health`
- **Backend RAG:** `/health` (main), `/api/oracle/health` (se disponibile)

---

## 🔨 Fase 2: Build & Validation

### 2.1 Build Locale (Opzionale ma Consigliato)

```bash
# Backend TypeScript
cd apps/backend-ts
npm run build
npm test  # Se ci sono test

# Backend RAG
cd apps/backend-rag
pip install -r requirements.txt
python -m pytest  # Se ci sono test
```

### 2.2 Quality Checks

**TypeScript Backend:**
- ✅ Linting: `npm run lint`
- ✅ Type checking: `npm run typecheck`

**Python RAG Backend:**
- ✅ Black formatting: `black --check backend/`
- ✅ isort imports: `isort --check-only backend/`
- ✅ Ruff linting: `ruff check backend/`

---

## 🚀 Fase 3: Deployment Execution

### 3.1 Strategia: Rolling Deployment (Zero-Downtime)

**Pattern di Successo:**
- ✅ Usa `--strategy rolling` per zero-downtime
- ✅ `--wait-timeout 600` per dare tempo al deploy
- ✅ `--remote-only` per deploy più veloce

### 3.2 Deploy Backend TypeScript

```bash
cd apps/backend-ts

# Deploy con rolling strategy
flyctl deploy \
  --app nuzantara-backend \
  --strategy rolling \
  --wait-timeout 600 \
  --remote-only
```

### 3.3 Deploy Backend RAG

```bash
cd apps/backend-rag

# Deploy con rolling strategy
flyctl deploy \
  --app nuzantara-rag \
  --strategy rolling \
  --wait-timeout 600 \
  --remote-only
```

**Nota:** Per il backend-rag, il `fly.toml` potrebbe essere in `deploy/fly.toml`, quindi:

```bash
cd /path/to/project
flyctl deploy \
  --app nuzantara-rag \
  --config deploy/fly.toml \
  --strategy rolling \
  --wait-timeout 600 \
  --remote-only
```

### 3.4 Deploy Webapp (GitHub Pages)

```bash
# Automatico via GitHub Actions su push a main
# Oppure manuale:
cd apps/webapp
# Push a main branch attiva automaticamente il deploy
```

---

## 🏥 Fase 4: Health Checks & Validation

### 4.1 Wait for Stabilization

**Pattern di Successo:**
- ⏳ Aspetta 30-45 secondi dopo il deploy
- 🔄 Retry health checks fino a 10-15 volte
- ⏱️ 10 secondi tra ogni retry

```bash
# Wait period
sleep 45
```

### 4.2 Health Check Backend TypeScript

```bash
MAX_RETRIES=15
RETRY_COUNT=0
PROD_URL="https://nuzantara-backend.fly.dev/health"

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL" || echo "000")

  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check passed (HTTP $HTTP_CODE)"
    curl -s "$PROD_URL" | jq '.'
    exit 0
  fi

  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "⏳ Attempt $RETRY_COUNT/$MAX_RETRIES: HTTP $HTTP_CODE"
  sleep 10
done

echo "❌ Health check failed after $MAX_RETRIES attempts"
exit 1
```

### 4.3 Health Check Backend RAG

**✅ IMPORTANTE:** Backend RAG usa `/health` (standardizzato)

```bash
MAX_RETRIES=10
RETRY_COUNT=0
APP_URL="https://nuzantara-rag.fly.dev/health"  # ⭐ Endpoint corretto

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" || echo "000")

  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check passed (HTTP $HTTP_CODE)"
    curl -s "$APP_URL" | jq '.'
    exit 0
  fi

  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "⏳ Attempt $RETRY_COUNT/$MAX_RETRIES: HTTP $HTTP_CODE"
  sleep 10
done

echo "❌ Health check failed after $MAX_RETRIES attempts"
exit 1
```

**Nota:** Endpoint disponibili:
- `/health` - Main health endpoint (usato da fly.toml)
- `/api/oracle/health` - Oracle system health (se disponibile)

### 4.4 Smoke Tests Completi

**Backend TypeScript:**
```bash
PROD_URL="https://nuzantara-backend.fly.dev"
FAILED=0

echo "🧪 Running smoke tests for Backend TypeScript..."

# 1. Basic health check
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/health" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ /health: HTTP $HTTP_CODE"
  curl -s "$PROD_URL/health" | jq '.' | head -10
else
  echo "❌ /health: HTTP $HTTP_CODE"
  FAILED=1
fi

# 2. Detailed health check
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/health/detailed" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ /health/detailed: HTTP $HTTP_CODE"
else
  echo "⚠️ /health/detailed: HTTP $HTTP_CODE (may not be available)"
fi

# 3. AI health monitoring
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/api/monitoring/ai-health" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ /api/monitoring/ai-health: HTTP $HTTP_CODE"
else
  echo "⚠️ /api/monitoring/ai-health: HTTP $HTTP_CODE"
fi

# 4. Auth verification (test endpoint)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$PROD_URL/api/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{"token": "demo-token-test"}' || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "400" ]; then
  echo "✅ /api/auth/verify: HTTP $HTTP_CODE (endpoint responds)"
else
  echo "⚠️ /api/auth/verify: HTTP $HTTP_CODE"
fi

if [ $FAILED -eq 1 ]; then
  echo "❌ Some critical smoke tests failed"
  exit 1
else
  echo "✅ All critical smoke tests passed"
fi
```

**Backend RAG:**
```bash
PROD_URL="https://nuzantara-rag.fly.dev"
FAILED=0

echo "🧪 Running smoke tests for Backend RAG..."

# 1. Main health check (/health)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/health" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ /health: HTTP $HTTP_CODE"
  curl -s "$PROD_URL/health" | jq '.' | head -10
else
  echo "❌ /health: HTTP $HTTP_CODE"
  FAILED=1
fi

# 2. Oracle health check
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/api/oracle/health" || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ /api/oracle/health: HTTP $HTTP_CODE"
else
  echo "⚠️ /api/oracle/health: HTTP $HTTP_CODE (may not be available)"
fi

# 3. Auth verification
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$PROD_URL/api/auth/verify" \
  -H "Content-Type: application/json" \
  -d '{"token": "demo-token-test"}' || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "400" ]; then
  echo "✅ /api/auth/verify: HTTP $HTTP_CODE (endpoint responds)"
else
  echo "⚠️ /api/auth/verify: HTTP $HTTP_CODE"
fi

# 4. Test oracle query endpoint (lightweight)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$PROD_URL/api/oracle/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "user_email": "test@example.com"}' || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ]; then
  echo "✅ /api/oracle/query: HTTP $HTTP_CODE (endpoint responds)"
else
  echo "⚠️ /api/oracle/query: HTTP $HTTP_CODE"
fi

if [ $FAILED -eq 1 ]; then
  echo "❌ Some critical smoke tests failed"
  exit 1
else
  echo "✅ All critical smoke tests passed"
fi
```

---

## 📊 Fase 5: Post-Deployment Monitoring

### 5.1 Monitor Metrics (2 minuti)

**Pattern di Successo:**
- 📊 Monitor per almeno 2 minuti
- 🔍 Check ogni 10 secondi
- ⚠️ Allerta se errori > 2/12

```bash
PROD_URL="https://nuzantara-backend.fly.dev/health"
ERROR_COUNT=0

for i in {1..12}; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL" || echo "000")

  if [ "$HTTP_CODE" != "200" ]; then
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi

  sleep 10
done

if [ $ERROR_COUNT -gt 2 ]; then
  echo "❌ Too many errors detected: $ERROR_COUNT/12"
  exit 1
fi

echo "✅ Deployment is stable!"
```

### 5.2 Check Logs

```bash
# Backend TypeScript
flyctl logs --app nuzantara-backend --since 5m

# Backend RAG
flyctl logs --app nuzantara-rag --since 5m

# Cercare errori
flyctl logs --app nuzantara-backend | grep -i "error\|fail\|exception"
```

### 5.3 Verify Metrics

```bash
# Fly.io dashboard
flyctl dashboard metrics --app nuzantara-backend
flyctl dashboard metrics --app nuzantara-rag

# Status
flyctl status --app nuzantara-backend
flyctl status --app nuzantara-rag
```

---

## 🔄 Fase 6: Rollback Plan (Se Necessario)

### 6.1 Rollback Immediato

```bash
# Vedere releases disponibili
flyctl releases --app nuzantara-backend

# Rollback all'ultima release
flyctl releases rollback <release-id> --app nuzantara-backend
```

### 6.2 Disabilitare Feature Flags (Se Applicabile)

```bash
# Se ci sono feature flags problematiche
flyctl secrets unset FF_ENABLE_CIRCUIT_BREAKER --app nuzantara-backend
flyctl secrets unset FF_ENABLE_ENHANCED_POOLING --app nuzantara-backend
```

### 6.3 Scale Down (Se Necessario)

```bash
# Scale down temporaneamente
flyctl scale count 1 --app nuzantara-backend
```

---

## ✅ Checklist Completa Post-Deploy

### Backend TypeScript

- [ ] ✅ Health endpoint: `200 OK`
- [ ] ✅ AI health endpoint: `200 OK`
- [ ] ✅ Metrics endpoint: `200 OK`
- [ ] ✅ Logs senza errori critici
- [ ] ✅ Response times accettabili (< 2s)
- [ ] ✅ Auto-scaling configurato (se applicabile)

### Backend RAG

- [ ] ✅ Health endpoint: `200 OK`
- [ ] ✅ Auth endpoint funzionante
- [ ] ✅ Oracle query endpoint: test query funziona
- [ ] ✅ Google Drive connection: OK
- [ ] ✅ Gemini integration: OK
- [ ] ✅ Logs senza errori critici

### Webapp

- [ ] ✅ Frontend accessibile
- [ ] ✅ API calls funzionanti
- [ ] ✅ No errori console
- [ ] ✅ Loading times accettabili

---

## 🎯 Pattern di Successo Chiave

### ✅ 1. Rolling Deployment Strategy

**Perché funziona:**
- Zero-downtime durante il deploy
- Gradual rollout riduce rischi
- Possibilità di rollback immediato

**Comando:**
```bash
flyctl deploy --strategy rolling --wait-timeout 600 --remote-only
```

### ✅ 2. Health Checks Aggressivi

**Perché funziona:**
- Rileva problemi prima che utenti li vedano
- Retry logic robusta (10-15 tentativi)
- Timeout appropriati (10s tra retry)

### ✅ 3. Monitoring Post-Deploy

**Perché funziona:**
- Cattura regressioni immediate
- Monitor per almeno 2 minuti
- Alert se errori > 2/12 checks

### ✅ 4. Pre-Flight Validation

**Perché funziona:**
- Evita deploy di codice rotto
- Verifica secrets prima del deploy
- Build locale prima del deploy remoto

---

## 🚨 Troubleshooting Comune

### Problema: Health Check Fallisce

**Soluzione:**
1. Check logs: `flyctl logs --app <app-name>`
2. Verifica secrets: `flyctl secrets list --app <app-name>`
3. Check database connection (se applicabile)
4. Verifica variabili d'ambiente

### Problema: Deploy Timeout

**Soluzione:**
1. Aumenta timeout: `--wait-timeout 900`
2. Check risorse VM: `flyctl status --app <app-name>`
3. Verifica build size e ottimizza Dockerfile

### Problema: Build Fallisce

**Soluzione:**
1. Test build locale prima
2. Verifica dipendenze
3. Check Dockerfile syntax
4. Verifica context path

---

## 📝 Note Importanti

### Secrets Management

**Pattern di Successo:**
- ✅ Secrets configurati PRIMA del deploy
- ✅ Never commit secrets nel codice
- ✅ Usa `flyctl secrets set` per aggiornarli

### Database Migrations

**Pattern di Successo (Backend RAG):**
- ✅ Migrazioni idempotenti (ON CONFLICT)
- ✅ Backup prima di migrazioni breaking
- ✅ Verifica dopo migrazione

### Feature Flags

**Pattern di Successo (Backend TS):**
- ✅ Gradual rollout (10% → 50% → 100%)
- ✅ Monitoring durante rollout
- ✅ Rollback immediato se problemi

---

## 🎉 Success Criteria

Un deploy è considerato riuscito quando:

1. ✅ **Health checks passano** (200 OK)
2. ✅ **Smoke tests passano** (endpoints critici funzionanti)
3. ✅ **Monitoring stabile** (< 2 errori in 2 minuti)
4. ✅ **Logs puliti** (nessun errore critico)
5. ✅ **Performance OK** (response times accettabili)

---

## 📚 Riferimenti

- [DEPLOYMENT_GUIDE_v5_3_ULTRA_HYBRID.md](./DEPLOYMENT_GUIDE_v5_3_ULTRA_HYBRID.md)
- [DEPLOYMENT_VALIDATION_v5_3.md](./DEPLOYMENT_VALIDATION_v5_3.md)
- [.github/workflows/deploy-production.yml](../../.github/workflows/deploy-production.yml)
- [.github/workflows/deploy-backend-rag.yml](../../.github/workflows/deploy-backend-rag.yml)

---

**Strategia validata:** ✅ Basata su deploy riusciti v5.3 e production workflows
**Ultima revisione:** 2025-01-27
**Mantenuto da:** DevOps Team
