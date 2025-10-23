# 📊 Monitoring & Alerting Guide

**System health monitoring and alert configuration**

**Last Updated:** October 23, 2025

---

## 🎯 Monitoring Philosophy

**Monitor what matters:**
- ✅ User-facing metrics (response time, errors)
- ✅ Resource utilization (CPU, memory, database)
- ✅ Business metrics (API costs, cache hit rate)
- ❌ Vanity metrics (code commits, lines of code)

---

## 📈 Key Metrics to Track

### 1. Response Time Metrics

| Metric | Target | Alert Threshold | P95 Target |
|--------|--------|-----------------|------------|
| **Golden Answer Lookup** | < 20ms | > 100ms | < 50ms |
| **Haiku + RAG** | < 2s | > 5s | < 3s |
| **Database Query** | < 50ms | > 200ms | < 100ms |
| **ChromaDB Search** | < 100ms | > 500ms | < 200ms |

**How to Measure:**
```typescript
// Add to handlers
const start = Date.now();
const result = await operation();
const duration = Date.now() - start;

logger.info('Operation completed', {
  operation: 'golden_answer_lookup',
  duration_ms: duration,
  success: !!result
});
```

**Query Logs:**
```bash
# Get P95 response time
railway logs --service TS-BACKEND | \
  grep "duration_ms" | \
  jq -r '.duration_ms' | \
  sort -n | \
  awk '{arr[NR]=$1} END {print arr[int(NR*0.95)]}'
```

---

### 2. Error Rate Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **API Error Rate** | < 1% | > 5% |
| **Database Errors** | 0 | > 5 per hour |
| **RAG Backend Errors** | < 2% | > 10% |
| **Auth Failures** | < 0.5% | > 2% |

**How to Measure:**
```bash
# Count errors in last hour
railway logs --service TS-BACKEND --since 1h | grep -c "ERROR"

# Error rate calculation
TOTAL=$(railway logs --service TS-BACKEND --since 1h | grep -c "Request")
ERRORS=$(railway logs --service TS-BACKEND --since 1h | grep -c "ERROR")
echo "scale=2; $ERRORS * 100 / $TOTAL" | bc
```

---

### 3. Resource Utilization

| Metric | Warning | Critical |
|--------|---------|----------|
| **CPU Usage** | > 70% | > 90% |
| **Memory Usage** | > 80% | > 95% |
| **Database Connections** | > 80% of pool | > 95% of pool |
| **Disk Usage** | > 80% | > 90% |

**How to Monitor:**
```bash
# Railway provides metrics in dashboard
# Navigate to: Service → Metrics tab

# Check database connections
railway run psql $DATABASE_URL -c "
SELECT count(*) as active_connections,
       max_conn.setting::int as max_connections,
       (count(*)::float / max_conn.setting::float * 100)::int as percent_used
FROM pg_stat_activity,
     (SELECT setting FROM pg_settings WHERE name='max_connections') max_conn
WHERE state = 'active';
"
```

---

### 4. Business Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| **Golden Answer Hit Rate** | > 50% | Cost optimization |
| **API Cost per 1K Requests** | < $0.50 | Haiku pricing |
| **Average Tokens per Request** | < 3000 input, < 500 output | Cost control |
| **Cache Hit Rate (Redis)** | > 30% | Performance indicator |

**How to Measure:**
```bash
# Golden answer hit rate
railway logs --service "RAG BACKEND" --since 24h | \
  grep "golden_answer" | \
  jq -r 'select(.hit != null) | .hit' | \
  awk '{s+=$1; n++} END {print "Hit rate:", s/n*100 "%"}'

# API cost calculation
# Haiku: $0.25 per 1M input tokens, $1.25 per 1M output tokens
# Average request: 2500 input, 450 output
# Cost per request: (2500 * 0.25 + 450 * 1.25) / 1000000 = $0.0012
```

---

## 🚨 Alert Configuration

### Critical Alerts (Immediate Action)

**1. Service Down**
```yaml
Alert: service_down
Condition: /health endpoint returns non-200 for 2 consecutive checks
Check Interval: 1 minute
Notification: PagerDuty, SMS, Slack #alerts
```

**2. Error Rate Spike**
```yaml
Alert: high_error_rate
Condition: Error rate > 10% over 5 minutes
Check Interval: 5 minutes
Notification: Slack #alerts, Email
```

**3. Database Down**
```yaml
Alert: database_unreachable
Condition: Cannot connect to PostgreSQL
Check Interval: 1 minute
Notification: PagerDuty, Slack #alerts
```

**4. Memory Exhaustion**
```yaml
Alert: memory_critical
Condition: Memory usage > 95% for 5 minutes
Check Interval: 1 minute
Notification: Slack #alerts, Email
```

---

### Warning Alerts (Monitor & Investigate)

**1. Slow Response Time**
```yaml
Alert: slow_response
Condition: P95 response time > 5s for 10 minutes
Check Interval: 5 minutes
Notification: Slack #monitoring
```

**2. High Database Load**
```yaml
Alert: database_high_load
Condition: Active connections > 80% of max for 10 minutes
Check Interval: 5 minutes
Notification: Slack #monitoring
```

**3. Cache Hit Rate Low**
```yaml
Alert: low_cache_hit_rate
Condition: Golden answer hit rate < 30% over 1 hour
Check Interval: 1 hour
Notification: Slack #monitoring
```

---

## 📊 Monitoring Tools

### Railway Built-in Monitoring

```bash
# View metrics in Railway dashboard
# Navigate to: Project → Service → Metrics

# Available metrics:
# - CPU usage (%)
# - Memory usage (MB)
# - Network I/O
# - Request count
# - Response time
```

### Log-based Monitoring

```bash
# Real-time error monitoring
railway logs --service TS-BACKEND --follow | grep ERROR

# Search for specific issues
railway logs --service TS-BACKEND --since 1h | grep "timeout\|ECONNREFUSED\|OOM"

# Count requests by handler
railway logs --service TS-BACKEND --since 24h | \
  grep "Handler execution" | \
  jq -r '.handler' | \
  sort | uniq -c | sort -rn
```

### Custom Health Checks

```typescript
// apps/backend-ts/src/routes/health.ts

import { Router } from 'express';
import { db } from '../services/postgres.js';
import { ragService } from '../services/ragService.js';

const router = Router();

router.get('/health', async (req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {}
  };

  try {
    // Check database
    const dbStart = Date.now();
    await db.query('SELECT 1');
    checks.checks.database = {
      status: 'healthy',
      response_time_ms: Date.now() - dbStart
    };
  } catch (error) {
    checks.status = 'unhealthy';
    checks.checks.database = {
      status: 'unhealthy',
      error: error.message
    };
  }

  try {
    // Check RAG backend
    const ragStart = Date.now();
    await ragService.healthCheck();
    checks.checks.rag_backend = {
      status: 'healthy',
      response_time_ms: Date.now() - ragStart
    };
  } catch (error) {
    checks.status = 'degraded';
    checks.checks.rag_backend = {
      status: 'unhealthy',
      error: error.message
    };
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(checks);
});

export default router;
```

---

## 📈 Performance Baselines

### Expected Metrics (Production)

```
Response Times:
├── Golden Answer: 10-20ms (P50), 50ms (P95)
├── Haiku + RAG: 1-2s (P50), 3s (P95)
├── Database Query: 10-50ms (P50), 100ms (P95)
└── ChromaDB Search: 50-100ms (P50), 200ms (P95)

Resource Usage:
├── CPU: 20-40% average, 70% peak
├── Memory: 1-1.5Gi average, 2Gi peak
├── Database Connections: 5-15 active
└── Network: 10-50 MB/day

Business Metrics:
├── Golden Answer Hit Rate: 50-60%
├── API Cost per 1K Requests: $0.40-0.60
├── Average Tokens: 2500 input, 450 output
└── Cache Hit Rate: 30-40%
```

---

## 🔍 Debugging Commands

### Quick Health Check

```bash
# Full system health
curl https://ts-backend-production-568d.up.railway.app/health | jq

# RAG backend health
curl https://scintillating-kindness-production-47e3.up.railway.app/health | jq

# Database connectivity
railway run psql $DATABASE_URL -c "SELECT NOW();"
```

### Find Recent Errors

```bash
# Last 100 errors
railway logs --service TS-BACKEND --tail 1000 | grep ERROR | tail -100

# Errors by type
railway logs --service TS-BACKEND --since 1h | \
  grep ERROR | \
  jq -r '.error_type' | \
  sort | uniq -c | sort -rn
```

### Performance Analysis

```bash
# Slowest handlers (last hour)
railway logs --service TS-BACKEND --since 1h | \
  grep "Handler execution" | \
  jq -r '"\(.duration_ms)\t\(.handler)"' | \
  sort -rn | head -20

# Database query performance
railway run psql $DATABASE_URL -c "
SELECT query,
       calls,
       mean_exec_time::int as avg_ms,
       max_exec_time::int as max_ms
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
"
```

---

## ✅ Monitoring Checklist

**Daily:**
- [ ] Check Railway dashboard for service health
- [ ] Review error logs (should be < 1% error rate)
- [ ] Verify API costs (should be $0.50-1.00/day)
- [ ] Check golden answer hit rate (should be > 50%)

**Weekly:**
- [ ] Review performance trends (response times)
- [ ] Analyze slow queries (optimize if needed)
- [ ] Check database size growth
- [ ] Review ChromaDB collection sizes
- [ ] Audit API usage patterns

**Monthly:**
- [ ] Review total API costs vs budget
- [ ] Analyze user traffic patterns
- [ ] Optimize slow queries
- [ ] Review alert thresholds (adjust if needed)
- [ ] Database backup verification

---

## 🔗 Related Documentation

- **Incident Response**: [Incident Response Playbook](./INCIDENT_RESPONSE.md)
- **Deployment**: [Railway Deployment Guide](../guides/RAILWAY_DEPLOYMENT_GUIDE.md)
- **Architecture**: [System Overview](../galaxy-map/01-system-overview.md)

---

**Monitor proactively. Alert intelligently. Respond quickly.** 📊✨
