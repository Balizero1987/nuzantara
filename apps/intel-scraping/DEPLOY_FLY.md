# 🚀 Deploy su Fly.io - Bali Zero Journal

## Setup Iniziale

### 1. Installare Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Login a Fly.io
```bash
fly auth login
```

### 3. Creare l'App
```bash
fly apps create bali-zero-journal --org personal
```

## Configurare Secrets (Variabili d'Ambiente)

### Configurare DATABASE_URL
```bash
# Se hai già un database PostgreSQL su Fly.io
fly postgres attach --app bali-zero-journal

# Oppure crea un nuovo database
fly postgres create --name bali-zero-db --region sin --vm-size shared-cpu-1x
fly postgres attach bali-zero-db --app bali-zero-journal
```

### Configurare OPENROUTER_API_KEY
```bash
fly secrets set OPENROUTER_API_KEY=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
```

### Configurare altri secrets (opzionali)
```bash
# Redis (se usi queue)
fly redis create --region sin
fly secrets set REDIS_HOST=your-redis-host REDIS_PORT=6379

# Proxy (opzionale)
fly secrets set PROXY_SERVICE_API=your-proxy-api PROXY_SERVICE_KEY=your-key
```

## Deploy

### Build e Deploy
```bash
# Build locale (opzionale, per test)
fly deploy --local-only

# Deploy completo
fly deploy
```

### Verificare il Deploy
```bash
# Status
fly status

# Logs
fly logs

# SSH nella VM
fly ssh console
```

## Post-Deploy Setup

### 1. Eseguire Migrazioni
```bash
fly ssh console -C "npm run migrate"
```

### 2. Importare Sorgenti
```bash
fly ssh console -C "npm run import-sources:sample"
```

### 3. Testare Connettività
```bash
fly ssh console -C "npm run test-connectivity"
```

## Monitoraggio

### Dashboard
La dashboard sarà disponibile su: `https://bali-zero-journal.fly.dev`

### API Endpoints
- Health: `https://bali-zero-journal.fly.dev/health`
- API Docs: `https://bali-zero-journal.fly.dev/api`
- Dashboard Stats: `https://bali-zero-journal.fly.dev/api/dashboard/stats`

## Scaling

```bash
# Aumentare CPU/Memory
fly scale vm shared-cpu-2x --memory 1024

# Aumentare istanze
fly scale count 2
```

## Troubleshooting

### Verificare Secrets
```bash
fly secrets list
```

### Verificare Logs
```bash
fly logs -a bali-zero-journal
```

### Riavviare App
```bash
fly apps restart bali-zero-journal
```

## Costi Stimati

- **PostgreSQL**: Free tier (256MB) o $1.94/mese (1GB)
- **App VM**: ~$2-5/mese (shared-cpu-1x, 512MB)
- **Totale**: ~$3-7/mese per setup base

---
*Configurazione Fly.io per Bali Zero Journal*

