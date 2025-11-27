# ✅ Deployment Checklist - Quick Reference

**Basato su:** Strategia di deployment validata dai deploy precedenti

**Quando usare:** Prima di ogni deploy in produzione

---

## 🔍 Pre-Deployment (5 minuti)

- [ ] Working tree pulito (`git status`)
- [ ] Commit fatto (`git log --oneline -1`)
- [ ] **fly.toml validato** (`flyctl config validate`) ⭐ NUOVO
- [ ] Test passati localmente (se applicabile)
- [ ] Build locale funziona
- [ ] Secrets verificati (`flyctl secrets list`)
- [ ] **Health endpoints verificati** ⭐ NUOVO

---

## 🚀 Deployment Commands

### Backend TypeScript
```bash
cd apps/backend-ts
flyctl deploy \
  --app nuzantara-backend \
  --strategy rolling \
  --wait-timeout 600 \
  --remote-only
```

### Backend RAG
```bash
# ✅ Backend RAG usa /health (standardizzato)

# Opzione 1: Usa fly.toml in apps/backend-rag/
cd apps/backend-rag
flyctl config validate --app nuzantara-rag  # ⭐ NUOVO: Validazione
flyctl deploy \
  --app nuzantara-rag \
  --strategy rolling \
  --wait-timeout 600 \
  --remote-only

# Opzione 2: Usa fly.toml in deploy/
cd /path/to/project
flyctl config validate --app nuzantara-rag --config deploy/fly.toml  # ⭐ NUOVO
flyctl deploy \
  --app nuzantara-rag \
  --config deploy/fly.toml \
  --strategy rolling \
  --wait-timeout 600 \
  --remote-only
```

---

## 🏥 Health Checks (5 minuti)

### Wait & Check
```bash
# Wait for stabilization
sleep 45

# Backend TypeScript (usa /health)
curl https://nuzantara-backend.fly.dev/health

# Backend RAG (usa /health)
curl https://nuzantara-rag.fly.dev/health
```

### Automated Health Check Script
```bash
MAX_RETRIES=15
RETRY_COUNT=0
URL="https://nuzantara-backend.fly.dev/health"  # O nuzantara-rag.fly.dev/health

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL" || echo "000")

  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check passed"
    exit 0
  fi

  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "⏳ Attempt $RETRY_COUNT/$MAX_RETRIES: HTTP $HTTP_CODE"
  sleep 10
done

echo "❌ Health check failed"
exit 1
```

---

## 📊 Post-Deployment (2 minuti)

- [ ] Health endpoint: 200 OK
- [ ] Logs controllati: `flyctl logs --app <app> --since 5m`
- [ ] No errori critici nei log
- [ ] Smoke test endpoint critico funziona

---

## 🔄 Rollback (Se Necessario)

```bash
# Vedere releases
flyctl releases --app <app-name>

# Rollback
flyctl releases rollback <release-id> --app <app-name>
```

---

## 📚 Documentazione Completa

Vedi [DEPLOYMENT_STRATEGY_SUCCESS.md](./DEPLOYMENT_STRATEGY_SUCCESS.md) per dettagli completi.
