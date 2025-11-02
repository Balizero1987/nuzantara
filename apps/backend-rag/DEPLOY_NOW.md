# 🚀 Deployment Rapido - Reranker Optimization

## Quick Start Commands

### 1. Verifica Deployment Readiness

```bash
cd apps/backend-rag/backend

# Check local files
python scripts/check_deployment.py

# Check Fly.io status (se già deployato)
./scripts/check_fly_deployment.sh
```

### 2. Deploy su Fly.io (Zero-Downtime)

#### Stage 1: Feature Flags (Cache Disabilitata)
```bash
./scripts/deploy_fly.sh feature-flags
```

**Attendere 2-3 minuti per il deploy, poi verificare:**
```bash
./scripts/check_fly_deployment.sh
```

#### Stage 2: Cache Piccola (10% traffic)
```bash
# Aspettare 5-10 minuti per monitorare Stage 1, poi:
./scripts/deploy_fly.sh cache-10
```

#### Stage 3: Cache Media (50%)
```bash
# Aspettare 5-10 minuti, poi:
./scripts/deploy_fly.sh cache-50
```

#### Stage 4: Cache Completa (100%)
```bash
./scripts/deploy_fly.sh cache-100
```

#### Stage 5: Full Rollout
```bash
./scripts/deploy_fly.sh full
```

### 3. Monitoring Continuo

```bash
# Monitoring Fly.io (ogni 30 secondi)
./scripts/monitor_fly.sh 30
```

### 4. Quick Health Check

```bash
# Check rapido
APP_NAME=nuzantara-rag
curl -s "https://${APP_NAME}.fly.dev/health" | jq '.reranker'
```

### 5. Rollback Rapido (se necessario)

```bash
./scripts/deploy_fly.sh rollback
```

---

## Verifica Manuale

### Health Endpoint
```bash
APP_NAME=nuzantara-rag
curl "https://${APP_NAME}.fly.dev/health" | jq '.reranker.stats'
```

### Fly.io Logs
```bash
fly logs -a nuzantara-rag | grep -i reranker
```

### Fly.io Secrets
```bash
fly secrets list -a nuzantara-rag | grep RERANKER
```

---

## Metriche Target

Dopo il deployment completo, verificare:

- ✅ Avg latency: <50ms
- ✅ P95 latency: <50ms  
- ✅ Cache hit rate: >30%
- ✅ Target met rate: >80%
- ✅ Error rate: <0.1%

---

## Troubleshooting

### Service non risponde
```bash
fly status -a nuzantara-rag
fly logs -a nuzantara-rag --recent
```

### Secrets non configurati
```bash
fly secrets set ENABLE_RERANKER=true -a nuzantara-rag
```

### Deploy fallito
```bash
fly releases -a nuzantara-rag
fly releases rollback <release-id> -a nuzantara-rag
```

---

## Prossimi Passi

1. ✅ Deploy Stage 1 (feature-flags)
2. ⏳ Monitorare per 10 minuti
3. ✅ Deploy Stage 2 (cache-10)
4. ⏳ Monitorare per 10 minuti
5. ✅ Continuare con Stage 3-5
6. ⏳ Validare metriche dopo 24h

**Ready to deploy! 🚀**

