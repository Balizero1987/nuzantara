# 📋 Comandi Fly.io - Copia e Incolla

## Setup Completo (Copia tutto e incolla)

```bash
# 1. Crea app
fly apps create bali-zero-journal --org personal

# 2. Configura secrets
fly secrets set DATABASE_URL="postgres://postgres:3PSIxqNqG4HT69o@bali-zero-db.flycast:5432" -a bali-zero-journal

fly secrets set OPENROUTER_API_KEY="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" -a bali-zero-journal

fly secrets set NODE_ENV=production PORT=3000 -a bali-zero-journal

# 3. Verifica secrets
fly secrets list -a bali-zero-journal

# 4. Deploy
fly deploy -a bali-zero-journal

# 5. Post-deploy (dopo il deploy)
fly ssh console -a bali-zero-journal -C "cd /app && npm run migrate"
fly ssh console -a bali-zero-journal -C "cd /app && npm run import-sources:sample"
fly ssh console -a bali-zero-journal -C "cd /app && npm run test:full"
```

## Comandi Utili

```bash
# Status app
fly status -a bali-zero-journal

# Logs in tempo reale
fly logs -a bali-zero-journal

# SSH nella VM
fly ssh console -a bali-zero-journal

# Riavviare app
fly apps restart bali-zero-journal

# Verificare secrets
fly secrets list -a bali-zero-journal

# Health check
curl https://bali-zero-journal.fly.dev/health
```

---
*Comandi pronti per copia-incolla*

