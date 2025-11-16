# 🚀 Setup Immediato Fly.io

## Database già creato ✅

Il database PostgreSQL è stato creato con successo:
- **Cluster**: bali-zero-db
- **Connection String**: `postgres://postgres:3PSIxqNqG4HT69o@bali-zero-db.flycast:5432`

## Passi per completare il setup

### 1. Creare l'App

```bash
fly apps create bali-zero-journal --org personal
```

### 2. Configurare Secrets

```bash
# DATABASE_URL
fly secrets set DATABASE_URL="postgres://postgres:3PSIxqNqG4HT69o@bali-zero-db.flycast:5432" -a bali-zero-journal

# OPENROUTER_API_KEY
fly secrets set OPENROUTER_API_KEY="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" -a bali-zero-journal

# Environment variables
fly secrets set NODE_ENV=production PORT=3000 -a bali-zero-journal
```

### 3. Oppure usa lo script automatico

```bash
chmod +x scripts/setup-fly-app.sh
./scripts/setup-fly-app.sh
```

### 4. Deploy

```bash
fly deploy -a bali-zero-journal
```

### 5. Post-Deploy Setup

```bash
# Migrazioni database
fly ssh console -a bali-zero-journal -C "cd /app && npm run migrate"

# Import sorgenti (10% sample)
fly ssh console -a bali-zero-journal -C "cd /app && npm run import-sources:sample"

# Test completo
fly ssh console -a bali-zero-journal -C "cd /app && npm run test:full"
```

## Verifica

```bash
# Status
fly status -a bali-zero-journal

# Logs
fly logs -a bali-zero-journal

# Health check
curl https://bali-zero-journal.fly.dev/health
```

## URL App

Dopo il deploy, l'app sarà disponibile su:
- **App**: https://bali-zero-journal.fly.dev
- **Health**: https://bali-zero-journal.fly.dev/health
- **API**: https://bali-zero-journal.fly.dev/api

---
*Setup immediato per Fly.io*

