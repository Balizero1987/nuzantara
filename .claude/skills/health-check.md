---
name: health-check
description: Comprehensive health monitoring of all nuzantara services including backends, database, ChromaDB, and deployment status
---

# System Health Check Protocol

Use this skill when user asks about system status, "is everything running?", debugging production issues, or scheduled health monitoring.

## Quick Health Check

### 1. Backend Services Status
```bash
# TypeScript Backend (Port 8080)
curl http://localhost:8080/health

# Python RAG Backend (Port 8000)
curl http://localhost:8000/health
```

Expected: Both return 200 OK with health status JSON.

### 2. Database Connectivity
```bash
# PostgreSQL connection test
# Check if backend can connect to database
curl http://localhost:8080/api/health/db
```

Expected: Database responds and connection pool is healthy.

### 3. ChromaDB Status
Check vector database is loaded and accessible:
```bash
# Test ChromaDB endpoint
curl http://localhost:8000/api/rag/health
```

Expected: ChromaDB collections are loaded with chunk count.

## Comprehensive System Check

### 4. Service Availability
Check all critical services:

- ✅ **Backend TypeScript**: Port 8080 responding
- ✅ **Backend RAG**: Port 8000 responding
- ✅ **PostgreSQL**: Database queries working
- ✅ **ChromaDB**: Vector search operational
- ✅ **Redis** (optional): Cache responding
- ✅ **Cloudflare R2**: File storage accessible

### 5. Performance Metrics

**Response Times**:
```bash
# Measure API latency
time curl http://localhost:8080/health
time curl http://localhost:8000/health
```

Target response times:
- Health endpoints: < 100ms
- API endpoints: < 500ms
- RAG queries: < 2s

**System Resources**:
- CPU usage: Should be < 70% under normal load
- Memory usage: Monitor for leaks
- Database connections: Check pool utilization
- Disk space: Ensure ChromaDB has space

### 6. Log Analysis
Check recent logs for errors:

```bash
# TypeScript backend logs (if using Winston)
tail -n 100 logs/combined.log | grep "ERROR"

# Check for critical errors
grep -i "error\|exception\|critical\|fatal" logs/*.log
```

Look for patterns:
- Repeated errors
- Connection timeouts
- Authentication failures
- Rate limit hits

### 7. Railway/Cloud Status
If deployed to Railway:

```bash
# Check Railway deployment status
railway status

# View recent logs
railway logs --tail 100
```

Monitor for:
- Deployment status: healthy/unhealthy
- Restart count: Should be minimal
- Resource usage: Within limits
- Error rate: Should be < 1%

### 8. API Endpoint Tests
Test critical endpoints:

```bash
# Test auth endpoint
curl -X POST http://localhost:8080/api/auth/health

# Test RAG query
curl -X POST http://localhost:8000/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query": "test query", "tier": 0}'

# Test Oracle agent
curl -X POST http://localhost:8080/api/oracle/health
```

### 9. Database Health
Check database metrics:

- Connection count
- Query performance
- Table sizes
- Index health
- Replication lag (if applicable)

### 10. Security Checks
Verify security measures:

- ✅ JWT authentication working
- ✅ Rate limiting active
- ✅ CORS configured correctly
- ✅ HTTPS enabled (production)
- ✅ API keys not exposed

## Health Report Template

Generate a comprehensive health report:

```
🏥 NUZANTARA SYSTEM HEALTH REPORT
Generated: [timestamp]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ SERVICES STATUS
- Backend TypeScript (8080): [status]
- Backend RAG (8000): [status]
- PostgreSQL: [status]
- ChromaDB: [status]
- Redis: [status]

⚡ PERFORMANCE
- API Avg Response Time: [ms]
- RAG Query Latency: [ms]
- CPU Usage: [%]
- Memory Usage: [%]

📊 STATISTICS
- Uptime: [duration]
- Total Requests (24h): [count]
- Error Rate: [%]
- Active Users: [count]

⚠️ ISSUES DETECTED
[List any issues found]

💡 RECOMMENDATIONS
[Suggested actions if any]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Monitoring Schedule

Recommend running health checks:
- **Every 5 minutes**: Quick service ping
- **Every hour**: Full health check
- **Daily**: Comprehensive system audit
- **After deployment**: Immediate validation
- **On user report**: Debug mode check

## Key Files to Check
- `apps/backend-ts/src/routes/health.ts` - Health endpoints
- `apps/backend-rag/backend/app/main_cloud.py` - RAG health
- `scripts/maintenance/` - Maintenance scripts
- `railway.json` - Deployment health config

## Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| Service timeout | Health check fails | Restart service, check logs |
| High memory | Memory usage > 90% | Check for leaks, restart if needed |
| DB connection error | Database queries fail | Check connection string, restart DB |
| ChromaDB not loaded | RAG queries fail | Reload vector database |
| Rate limit hit | 429 responses | Check rate limit config |
| Slow responses | Latency > 2s | Check database queries, optimize |

## Alert Thresholds

Set up alerts for:
- 🚨 **Critical**: Service down, error rate > 5%
- ⚠️ **Warning**: Response time > 1s, CPU > 80%
- ℹ️ **Info**: Deployment complete, restart occurred

## Success Criteria
✅ All services responding within 100ms
✅ No critical errors in logs (last 24h)
✅ Memory usage stable (no leaks)
✅ Database connections healthy
✅ ChromaDB loaded with expected chunks
✅ API endpoints functional
✅ Performance within target ranges
✅ No security issues detected

## Emergency Actions

If critical issues found:
1. **Service Down**: Attempt restart via Railway/Docker
2. **High Error Rate**: Check logs immediately, may need rollback
3. **Database Issues**: Check connection pool, may need scaling
4. **Memory Leak**: Identify source, schedule restart
5. **Security Breach**: Immediate lockdown, rotate keys
