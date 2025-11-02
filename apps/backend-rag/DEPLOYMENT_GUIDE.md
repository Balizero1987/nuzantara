# Reranker Optimization - Deployment Guide

## Pre-Deployment Checklist

✅ **Code Changes**
- [x] RerankerService con cache e batch reranking
- [x] RerankerAuditService per audit trail
- [x] Feature flags in config.py
- [x] Health endpoint aggiornato con stats
- [x] Rate limiting configurato
- [x] Test suite creata

✅ **Scripts**
- [x] `scripts/deploy_reranker.sh` - Deployment graduale
- [x] `scripts/monitor_reranker.sh` - Monitoring continuo
- [x] `scripts/check_deployment.py` - Validazione pre-deploy

---

## Deployment Process (Zero-Downtime)

### Step 1: Pre-Deployment Validation

```bash
cd apps/backend-rag/backend

# Check deployment readiness
python scripts/check_deployment.py

# Expected output:
# ✅ All service files present
# ✅ Config file OK
# ✅ Health endpoint: OK (if service running)
# ✅ Reranker enabled: true
# ✅ Statistics available: true
```

### Step 2: Deploy Code (Feature Flags Disabled)

Deploy il codice con feature flags disabilitati per backward compatibility:

```bash
# For Fly.io deployment
fly deploy

# For Docker
docker-compose up -d --build backend

# For local development
# Service should restart automatically or manually restart
```

### Step 3: Gradual Feature Rollout

#### Stage 1: Enable Feature Flags (Cache Disabled)
```bash
./scripts/deploy_reranker.sh feature-flags

# Verify:
curl http://localhost:8000/health | jq '.reranker'
# Should show: enabled: true, cache_enabled: false
```

#### Stage 2: Enable Cache (Small - 10% Traffic)
```bash
./scripts/deploy_reranker.sh cache-10

# Monitor for 10 minutes:
./scripts/monitor_reranker.sh 10
# Watch for:
# - Cache hit rate increasing
# - Latency improving
# - No errors
```

#### Stage 3: Scale Cache (50%)
```bash
./scripts/deploy_reranker.sh cache-50

# Monitor for 5 minutes
./scripts/monitor_reranker.sh 10
```

#### Stage 4: Full Cache (100%)
```bash
./scripts/deploy_reranker.sh cache-100

# Monitor for 5 minutes
```

#### Stage 5: Full Rollout
```bash
./scripts/deploy_reranker.sh full

# Enable all features:
# - Cache: enabled (1000 entries)
# - Batch reranking: enabled
# - Audit: enabled
# - Overfetch: 20 → top-5
```

### Step 4: Monitoring & Validation

```bash
# Continuous monitoring (every 10 seconds)
./scripts/monitor_reranker.sh 10

# Or check health endpoint manually
curl http://localhost:8000/health | jq '.reranker.stats'

# Expected metrics:
# - avg_latency_ms: <50ms ✅
# - p95_latency_ms: <50ms ✅
# - cache_hit_rate_percent: >30% ✅
# - target_latency_met_rate_percent: >80% ✅
```

---

## Monitoring Dashboard

### Key Metrics to Watch

1. **Latency Metrics**
   - Target: <50ms average
   - P95: <50ms
   - P99: <100ms

2. **Cache Performance**
   - Hit rate: Target >30%
   - Cache size: Monitor growth
   - Memory usage: ~100MB for 1000 entries

3. **Quality Metrics**
   - Total reranks: Increasing
   - Target met rate: >80%
   - Error rate: <0.1%

4. **Rate Limiting**
   - 429 responses: <1% of requests
   - Check audit logs for violations

### Health Endpoint Query

```bash
# Get full health status
curl http://localhost:8000/health | jq '.'

# Get reranker stats only
curl http://localhost:8000/health | jq '.reranker.stats'

# Example response:
# {
#   "total_reranks": 150,
#   "avg_latency_ms": 42.3,
#   "p95_latency_ms": 48.1,
#   "p99_latency_ms": 52.2,
#   "cache_hit_rate_percent": 35.2,
#   "target_latency_met_rate_percent": 82.5,
#   "cache_enabled": true,
#   "cache_size": 245,
#   "cache_max_size": 1000,
#   "target_latency_ms": 50.0
# }
```

---

## Rollback Procedure

Se si verificano problemi:

### Quick Rollback (Disable Optimizations)
```bash
./scripts/deploy_reranker.sh rollback

# Questo disabilita:
# - Cache
# - Batch reranking
# Ma mantiene il reranker base attivo
```

### Full Rollback (Disable Reranker)
```bash
# Set environment variable
export ENABLE_RERANKER=false

# Restart service
# (method depends on deployment platform)
```

### Verify Rollback
```bash
curl http://localhost:8000/health | jq '.reranker.enabled'
# Should return: false
```

---

## Troubleshooting

### High Latency (>50ms)

**Symptoms:**
- avg_latency_ms > 50
- p95_latency_ms > 50

**Actions:**
1. Check cache hit rate:
   ```bash
   curl http://localhost:8000/health | jq '.reranker.stats.cache_hit_rate_percent'
   ```
2. If cache hit rate is low (<20%):
   - Increase cache size
   - Check query patterns (are queries too diverse?)
3. If cache hit rate is high but latency still high:
   - Check model loading time
   - Check system resources (CPU, memory)

### Cache Not Working

**Symptoms:**
- cache_hit_rate_percent: 0
- cache_size: 0

**Actions:**
1. Verify feature flag:
   ```bash
   grep RERANKER_CACHE_ENABLED .env
   # Should be: RERANKER_CACHE_ENABLED=true
   ```
2. Check service logs for errors
3. Verify cache is enabled in health endpoint:
   ```bash
   curl http://localhost:8000/health | jq '.reranker.stats.cache_enabled'
   ```

### Rate Limit Violations

**Symptoms:**
- 429 Too Many Requests responses
- Audit log shows rate_limit_violation events

**Actions:**
1. Check audit logs:
   ```bash
   tail -f data/reranker_audit.jsonl | jq 'select(.event_type=="rate_limit_violation")'
   ```
2. Adjust limits if needed:
   ```bash
   export RERANKER_RATE_LIMIT_PER_MINUTE=200
   ```
3. Check if legitimate traffic or abuse

### Errors in Audit Log

**Symptoms:**
- success: false in audit entries
- error field populated

**Actions:**
1. Check audit log:
   ```bash
   tail -f data/reranker_audit.jsonl | jq 'select(.success==false)'
   ```
2. Review error messages
3. Check service logs for stack traces
4. Verify model loading correctly

---

## Post-Deployment Validation

After full rollout, validate:

### 1. Performance Metrics (24h after deployment)
```bash
# Check statistics
curl http://localhost:8000/health | jq '.reranker.stats'

# Expected:
# - avg_latency_ms: <50ms ✅
# - cache_hit_rate_percent: >30% ✅
# - target_latency_met_rate_percent: >80% ✅
# - error rate: <0.1% ✅
```

### 2. Quality Metrics
- Review user feedback
- Compare relevance scores (before/after)
- Check if +40% relevance improvement achieved

### 3. System Health
- No increase in error rate
- No memory leaks (check over 24h)
- No performance degradation

---

## Production Monitoring

### Grafana Dashboard (Recommended)

Create dashboard with panels for:
1. **Latency Panel**
   - Avg latency (line)
   - P95 latency (line)
   - P99 latency (line)
   - Target line at 50ms

2. **Cache Panel**
   - Cache hit rate (%)
   - Cache size (current/max)
   - Cache hits/misses (counter)

3. **Quality Panel**
   - Total reranks (counter)
   - Target met rate (%)
   - Error rate (%)

4. **Rate Limiting Panel**
   - 429 responses (counter)
   - Rate limit violations (counter)

### Alerting Rules

Set up alerts for:
- **High Latency**: avg_latency_ms > 50ms for 5 minutes
- **Low Cache Hit Rate**: cache_hit_rate < 20% for 10 minutes
- **High Error Rate**: error_rate > 1% for 5 minutes
- **Rate Limit Spike**: 429 responses > 5% for 5 minutes

---

## Backup & Recovery

### Audit Log Backups

```bash
# Daily backup (add to crontab)
0 2 * * * tar -czf /backups/reranker_audit_$(date +\%Y\%m\%d).tar.gz /app/data/reranker_audit.jsonl

# Retention: 90 days
find /backups -name "reranker_audit_*.tar.gz" -mtime +90 -delete
```

### Configuration Backup

- All config is in `.env` (version controlled in `.env.example`)
- Feature flags documented in `config.py`
- Backup `.env` before changes

---

## Support & Contacts

For issues:
1. Check this guide
2. Review audit logs: `data/reranker_audit.jsonl`
3. Check application logs
4. Run diagnostics: `python scripts/check_deployment.py`
5. Contact development team

---

**Last Updated:** 2025-01-02  
**Version:** 1.0.0

