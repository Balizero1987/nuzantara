# 🚀 Deploy Completo su Fly.io

## Setup Automatico (Raccomandato)

### 1. Esegui lo script automatico

```bash
cd "/Users/antonellosiano/Desktop/INTEL SCRAPING"
./scripts/setup-complete.sh
```

Lo script farà automaticamente:
- ✅ Verifica Fly CLI
- ✅ Verifica login
- ✅ Crea app `bali-zero-journal`
- ✅ Configura DATABASE_URL
- ✅ Configura OPENROUTER_API_KEY
- ✅ Configura variabili d'ambiente

### 2. Deploy

```bash
fly deploy -a bali-zero-journal
```

### 3. Post-Deploy Setup

```bash
# Migrazioni database
fly ssh console -a bali-zero-journal -C "cd /app && npm run migrate"

# Import sorgenti (10% sample)
fly ssh console -a bali-zero-journal -C "cd /app && npm run import-sources:sample"

# Test completo
fly ssh console -a bali-zero-journal -C "cd /app && npm run test:full"
```

## Setup Manuale

Se preferisci fare tutto manualmente:

### 1. Crea app
```bash
fly apps create bali-zero-journal --org personal
```

### 2. Configura secrets
```bash
fly secrets set DATABASE_URL="postgres://postgres:3PSIxqNqG4HT69o@bali-zero-db.flycast:5432" -a bali-zero-journal

fly secrets set OPENROUTER_API_KEY="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" -a bali-zero-journal

fly secrets set NODE_ENV=production PORT=3000 -a bali-zero-journal
```

### 3. Verifica
```bash
fly secrets list -a bali-zero-journal
```

### 4. Deploy
```bash
fly deploy -a bali-zero-journal
```

## Verifica Deployment

```bash
# Status
fly status -a bali-zero-journal

# Logs
fly logs -a bali-zero-journal

# Health check
curl https://bali-zero-journal.fly.dev/health
```

## URL App

Dopo il deploy:
- **App**: https://bali-zero-journal.fly.dev
- **Health**: https://bali-zero-journal.fly.dev/health
- **API**: https://bali-zero-journal.fly.dev/api
- **Dashboard Stats**: https://bali-zero-journal.fly.dev/api/dashboard/stats

## Troubleshooting

### App non si avvia
```bash
fly logs -a bali-zero-journal
fly ssh console -a bali-zero-journal
```

### Database connection error
```bash
# Verifica DATABASE_URL
fly secrets list -a bali-zero-journal

# Test connection
fly ssh console -a bali-zero-journal -C "psql \$DATABASE_URL -c 'SELECT 1'"
```

### Riavviare app
```bash
fly apps restart bali-zero-journal
```

## Costi Stimati

- **PostgreSQL**: ~$2-5/mese (3 machines, 10GB)
- **App VM**: ~$2-5/mese (shared-cpu-1x, 512MB)
- **Totale**: ~$4-10/mese

---
*Deploy guide per Fly.io*

