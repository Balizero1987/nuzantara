# 🚀 DEPLOY NUZANTARA BACKEND - PRONTO!

## ✅ Tutto Pronto per il Deploy

Il backend TypeScript con AI Automation è completamente configurato e pronto per essere deployato su Fly.io.

### 📦 Cosa è Stato Configurato

1. **AI Automation**
   - ✅ Cron scheduler con 3 job AI
   - ✅ OpenRouter API key integrata
   - ✅ Monitoring endpoints configurati
   - ✅ Rate limiting e circuit breaker
   - ✅ Budget giornaliero di $1

2. **Fly.io Configuration**
   - ✅ `apps/backend-ts/fly.toml` creato
   - ✅ App name: `nuzantara-backend`
   - ✅ Region: Singapore (sin)
   - ✅ Resources: 1GB RAM, 1 CPU
   - ✅ Health checks configurati

3. **CI/CD Pipeline**
   - ✅ GitHub Actions workflow aggiornato
   - ✅ Deploy automatico su push a `main`
   - ✅ Docker build validation
   - ✅ Health checks post-deploy

4. **Codice**
   - ✅ Server.ts con AI automation integrata
   - ✅ Monitoring routes create
   - ✅ Dockerfile aggiornato
   - ✅ PM2 config con OpenRouter key
   - ✅ Tutto committato e pushato

---

## 🚀 DEPLOY RAPIDO (2 Minuti)

### Sul Tuo Mac

```bash
# 1. Vai nella directory del progetto
cd ~/Desktop/NUZANTARA

# 2. Pull del branch con tutte le modifiche
git pull origin claude/verify-generate-report-011CUthqT5HvcACjNgyibCix

# 3. Esegui lo script di deploy (ha già tutto configurato)
./deploy-backend.sh
```

**FATTO!** Lo script:
- Configura l'OpenRouter API key su Fly.io
- Deploya l'applicazione
- Esegue health checks
- Mostra i logs
- Visualizza gli endpoint di monitoring

---

## 📋 Oppure: Deploy Manuale Passo-Passo

Se preferisci avere più controllo:

### Step 1: Setup Secrets

```bash
cd ~/Desktop/NUZANTARA

# Configura l'OpenRouter API key
flyctl secrets set \
  OPENROUTER_API_KEY=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 \
  --app nuzantara-backend
```

### Step 2: Deploy

```bash
cd apps/backend-ts
flyctl deploy --app nuzantara-backend --remote-only
```

### Step 3: Verifica

```bash
# Health generale
curl https://nuzantara-backend.fly.dev/health

# AI Automation health
curl https://nuzantara-backend.fly.dev/api/monitoring/ai-health | jq .

# Logs
flyctl logs --app nuzantara-backend

# Status
flyctl status --app nuzantara-backend
```

---

## 🤖 Endpoint AI Monitoring

Una volta deployato:

### Health Check
```bash
curl https://nuzantara-backend.fly.dev/api/monitoring/ai-health | jq .
```

Risposta attesa:
```json
{
  "ok": true,
  "data": {
    "healthy": true,
    "openRouter": {
      "callsThisHour": 0,
      "maxCallsPerHour": 100,
      "errorCount": 0,
      "circuitBreakerOpen": false,
      "costToday": 0,
      "dailyBudget": 1,
      "budgetRemaining": 1
    },
    "cron": {
      "isRunning": true,
      "jobCount": 3,
      "jobs": [
        "ai-code-refactoring",
        "ai-test-generation",
        "ai-health-check"
      ]
    }
  }
}
```

### Altri Endpoint

```bash
# Stato cron jobs
curl https://nuzantara-backend.fly.dev/api/monitoring/cron-status | jq .

# Statistiche OpenRouter
curl https://nuzantara-backend.fly.dev/api/monitoring/ai-stats | jq .

# Stats refactoring agent
curl https://nuzantara-backend.fly.dev/api/monitoring/refactoring-stats | jq .

# Stats test generator
curl https://nuzantara-backend.fly.dev/api/monitoring/test-generator-stats | jq .
```

---

## 📅 Schedule Cron Jobs

I job AI girano automaticamente:

- **Code Refactoring**: Ogni giorno alle 2:00 AM UTC
- **Test Generation**: Ogni giorno alle 3:00 AM UTC
- **Health Check**: Ogni ora

Puoi modificare gli orari in `apps/backend-ts/src/services/cron-scheduler.ts`

---

## 🔄 Deploy Automatico via CI/CD

### Opzione A: Merge a Main

1. Crea una PR su GitHub dal branch `claude/verify-generate-report-011CUthqT5HvcACjNgyibCix`
2. Merge la PR in `main`
3. Il workflow GitHub Actions farà automaticamente:
   - Lint e type check
   - Build
   - Docker build
   - Deploy su Fly.io
   - Health checks

### Opzione B: Trigger Manuale

1. Vai su GitHub → Actions
2. Seleziona "🚀 ZANTARA CI/CD Pipeline"
3. Click "Run workflow"
4. Seleziona `main` branch
5. Spunta "Deploy to production"
6. Click "Run workflow"

**⚠️ IMPORTANTE**: Prima di usare il CI/CD, configura il secret su GitHub:

```bash
# Ottieni il token
flyctl auth token

# Vai su GitHub:
# Settings → Secrets → Actions → New repository secret
# Nome: FLY_API_TOKEN
# Valore: <il token copiato sopra>
```

---

## 💰 Costi

- **Fly.io**: ~$5-10/mese (1GB RAM, 1 CPU, Singapore)
- **OpenRouter**:
  - Budget giornaliero: $1
  - Llama 3.3 70B: ~$0.0006/request
  - DeepSeek Coder: ~$0.0002/request
  - Stima mensile: $15-30

**Totale stimato: $20-40/mese**

---

## 🐛 Troubleshooting

### Il deploy fallisce

```bash
# Verifica l'app esiste
flyctl apps list | grep nuzantara-backend

# Se non esiste, creala
flyctl apps create nuzantara-backend --org personal

# Poi riprova il deploy
cd apps/backend-ts
flyctl deploy --app nuzantara-backend
```

### L'AI automation non funziona

```bash
# Verifica che l'API key sia impostata
flyctl secrets list --app nuzantara-backend

# Se non c'è, impostala
flyctl secrets set \
  OPENROUTER_API_KEY=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 \
  --app nuzantara-backend

# Testa l'endpoint
curl https://nuzantara-backend.fly.dev/api/monitoring/ai-health | jq .
```

### Logs troubleshooting

```bash
# Logs in real-time
flyctl logs --app nuzantara-backend

# Filtra per AI automation
flyctl logs --app nuzantara-backend | grep -i "cron\|ai"

# SSH nella macchina
flyctl ssh console --app nuzantara-backend
```

---

## 📚 Documentazione

- **Deployment completo**: `apps/backend-ts/DEPLOYMENT.md`
- **Script deploy**: `deploy-backend.sh`
- **Script secrets**: `fly-set-secrets.sh`
- **CI/CD workflow**: `.github/workflows/ci.yml`

---

## ✅ Checklist Pre-Deploy

- [x] Codice committato e pushato
- [x] OpenRouter API key disponibile
- [x] Fly.io account creato e autenticato
- [x] flyctl installato sul Mac
- [x] Fly.io app `nuzantara-backend` pronta
- [x] Configurazione testata localmente

---

## 🎯 Prossimi Passi Dopo il Deploy

1. **Verifica health checks** - Tutti gli endpoint devono rispondere 200
2. **Monitora i logs** - Verifica che i cron job partano
3. **Testa le API** - Prova gli endpoint di monitoring
4. **Configura alerting** - (opzionale) Setup Sentry o simili
5. **Monitora i costi** - Controlla dashboard OpenRouter

---

## 🚀 COMANDO RAPIDO

```bash
cd ~/Desktop/NUZANTARA && \
git pull origin claude/verify-generate-report-011CUthqT5HvcACjNgyibCix && \
./deploy-backend.sh
```

**Tempo stimato: 2-3 minuti** ⏱️

---

**Tutto pronto! Esegui il comando e il backend con AI Automation sarà live!** 🎉
