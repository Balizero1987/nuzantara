# 🚀 Deploy Immediato - Istruzioni

## Situazione Attuale

✅ App creata: `bali-zero-journal`
✅ Secrets configurati: DATABASE_URL, OPENROUTER_API_KEY
❌ App non ancora deployata (no VMs)

## Deploy

### 1. Vai nella directory corretta

```bash
cd "/Users/antonellosiano/Desktop/INTEL SCRAPING"
```

### 2. Esegui il deploy

```bash
fly deploy -a bali-zero-journal
```

Il deploy:
- Costruirà l'immagine Docker
- Installerà le dipendenze
- Compilerà TypeScript
- Installerà Playwright
- Avvierà l'app

**Tempo stimato**: 5-10 minuti

### 3. Verifica il deploy

```bash
# Status
fly status -a bali-zero-journal

# Logs
fly logs -a bali-zero-journal

# Health check
curl https://bali-zero-journal.fly.dev/health
```

### 4. Post-Deploy Setup

Dopo che il deploy è completato e l'app è running:

```bash
# Migrazioni database
fly ssh console -a bali-zero-journal -C "cd /app && npm run migrate"

# Import sorgenti (10% sample)
fly ssh console -a bali-zero-journal -C "cd /app && npm run import-sources:sample"

# Test completo
fly ssh console -a bali-zero-journal -C "cd /app && npm run test:full"
```

## Troubleshooting

### Se il deploy fallisce

```bash
# Vedi i log dettagliati
fly logs -a bali-zero-journal

# Verifica i secrets
fly secrets list -a bali-zero-journal

# Riavvia il deploy
fly deploy -a bali-zero-journal
```

### Se l'app non si avvia

```bash
# SSH nella VM
fly ssh console -a bali-zero-journal

# Dentro la VM, verifica:
cd /app
ls -la
node --version
npm --version
cat package.json
```

## URL App

Dopo il deploy:
- **App**: https://bali-zero-journal.fly.dev
- **Health**: https://bali-zero-journal.fly.dev/health
- **API**: https://bali-zero-journal.fly.dev/api

---
*Esegui: `fly deploy -a bali-zero-journal`*

