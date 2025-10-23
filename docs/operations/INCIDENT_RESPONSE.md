# 🚨 Incident Response Playbook

**Quick reference for handling production incidents**

**Last Updated:** October 23, 2025

---

## 🎯 Quick Response Matrix

| Severity | Response Time | Who Responds | Escalation |
|----------|--------------|--------------|------------|
| **P0 - Critical** | < 15 minutes | On-call engineer | Immediate team alert |
| **P1 - High** | < 1 hour | On-call engineer | Team notification |
| **P2 - Medium** | < 4 hours | Next available engineer | Standard ticket |
| **P3 - Low** | < 24 hours | Next sprint | Backlog |

---

## 🔥 P0 Critical Incidents

**Definition:** Complete service outage, data loss, security breach

### Incident 1: Backend Down

**Symptoms:**
- `/health` endpoint returns 503/500
- All API calls failing
- Railway dashboard shows "unhealthy"

**Immediate Response:**
```bash
# 1. Check Railway status
railway status

# 2. Check recent deployments
railway logs --service TS-BACKEND --tail 100

# 3. Check for crashes
railway logs --service TS-BACKEND | grep -i "error\|crash\|fatal"

# 4. Check database connection
railway logs --service TS-BACKEND | grep -i "database\|postgres"
```

**Common Causes & Solutions:**

| Cause | Symptoms | Fix |
|-------|----------|-----|
| **Out of Memory** | `FATAL ERROR: ... heap out of memory` | Increase Railway memory limit |
| **Database Connection** | `ECONNREFUSED ...` | Check DATABASE_URL env var |
| **Port Binding** | `EADDRINUSE` | Check PORT env var (should be 8080) |
| **Missing Env Vars** | `undefined is not defined` | Verify all required env vars |

**Fix Steps:**
```bash
# If OOM: Increase memory
# Railway dashboard → Service → Settings → Memory → 2Gi → 4Gi

# If env vars missing
railway variables --service TS-BACKEND
# Add missing vars via dashboard

# If database issue
railway logs --service TS-BACKEND | grep DATABASE_URL
# Verify connection string format

# Restart service
railway up --service TS-BACKEND
```

**Rollback Procedure:**
```bash
# Find last working commit
git log --oneline -10

# Rollback to specific commit
git revert <bad-commit-hash>
git push origin main

# Railway auto-deploys, or force:
railway up --service TS-BACKEND
```

---

### Incident 2: RAG Backend Timeout

**Symptoms:**
- Requests timeout after 30s
- 504 Gateway Timeout errors
- ChromaDB queries hanging

**Immediate Response:**
```bash
# 1. Check RAG backend logs
railway logs --service "RAG BACKEND" --tail 100

# 2. Look for ChromaDB issues
railway logs --service "RAG BACKEND" | grep -i "chromadb\|timeout"

# 3. Check healthcheck
curl https://scintillating-kindness-production-47e3.up.railway.app/health
```

**Common Causes:**

| Cause | Fix |
|-------|-----|
| **ChromaDB Loading** | Wait 4-5 min for ChromaDB initialization |
| **Large Query** | Reduce `top_k` parameter in searches |
| **Memory Pressure** | Increase Railway memory to 4Gi |
| **Database Lock** | Check PostgreSQL for long-running queries |

**Fix Steps:**
```bash
# Increase healthcheck timeout
# Railway → Service → Settings → Health Check Timeout → 300s

# Increase memory if needed
# Railway → Service → Settings → Memory → 4Gi

# Check database
railway run psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Kill long-running queries if needed
railway run psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE query_start < NOW() - INTERVAL '5 minutes';"
```

---

### Incident 3: Database Corruption

**Symptoms:**
- SQL errors in logs
- Data inconsistencies
- Migration failures

**Immediate Response:**
```bash
# 1. Check database health
railway run psql $DATABASE_URL -c "SELECT version();"

# 2. Check table integrity
railway run psql $DATABASE_URL -c "SELECT tablename FROM pg_tables WHERE schemaname='public';"

# 3. Check recent changes
git log --oneline --grep="migration" -10
```

**Recovery Steps:**
```bash
# 1. Backup current state
railway run pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Check migration status
railway run psql $DATABASE_URL -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 10;"

# 3. Rollback bad migration if needed
# Edit migration file to reverse changes
# Apply rollback SQL

# 4. Restore from backup if critical
railway run psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

---

## ⚠️ P1 High Incidents

### Incident 4: API Rate Limit Hit

**Symptoms:**
- 429 errors from Claude API
- Slowdown in responses
- API cost spike

**Response:**
```bash
# 1. Check current usage
curl https://api.anthropic.com/v1/usage \
  -H "x-api-key: $ANTHROPIC_API_KEY" | jq

# 2. Check request rate
railway logs --service "RAG BACKEND" | grep -c "claude-haiku"

# 3. Enable golden answers cache aggressively
# Increase cache TTL from 5min to 30min
```

**Mitigation:**
- Enable golden answers for more queries
- Increase Redis cache TTL
- Reduce RAG search frequency
- Contact Anthropic for limit increase

---

### Incident 5: ChromaDB Collection Missing

**Symptoms:**
- "Collection not found" errors
- Search returns empty results
- Specific domain knowledge missing

**Response:**
```bash
# 1. List available collections
railway run python -c "
from chromadb import Client
client = Client()
print(client.list_collections())
"

# 2. Check collection size
railway run python -c "
from chromadb import Client
client = Client()
collection = client.get_collection('visa_oracle')
print(f'Documents: {collection.count()}')
"

# 3. Restore collection from backup
# Run ingestion script
railway run python apps/backend-rag/backend/scrapers/visa_scraper.py --mode once
```

---

## 🛠️ P2 Medium Incidents

### Incident 6: Slow Query Performance

**Symptoms:**
- Queries take > 5s
- Golden answer lookup slow (> 100ms)
- Database load high

**Response:**
```bash
# 1. Check slow queries
railway run psql $DATABASE_URL -c "
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
"

# 2. Check missing indexes
railway run psql $DATABASE_URL -c "
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public';
"

# 3. Add indexes if needed
railway run psql $DATABASE_URL -c "
CREATE INDEX CONCURRENTLY idx_golden_answers_query_hash
ON golden_answers(query_hash);
"
```

---

## 📞 Escalation Procedures

### Level 1: On-Call Engineer
- First responder
- Has access to Railway, GitHub, logs
- Can restart services, rollback deployments

### Level 2: Team Lead
- Escalate if incident > 1 hour unresolved
- Can make architecture decisions
- Can authorize emergency spending

### Level 3: CTO
- Escalate if data loss or security breach
- Can authorize major infrastructure changes
- Customer communication

---

## 📊 Incident Postmortem Template

```markdown
# Incident Postmortem - [Date] - [Title]

## Summary
- **Severity:** P0/P1/P2
- **Duration:** X hours
- **Impact:** X users affected, Y% downtime
- **Root Cause:** [One sentence]

## Timeline
- HH:MM - Incident detected
- HH:MM - Team alerted
- HH:MM - Root cause identified
- HH:MM - Fix applied
- HH:MM - Service restored
- HH:MM - Incident closed

## Root Cause Analysis
[Detailed explanation]

## Resolution
[What fixed it]

## Action Items
- [ ] Fix 1: [Assigned to X, Due YYYY-MM-DD]
- [ ] Fix 2: [Assigned to Y, Due YYYY-MM-DD]
- [ ] Monitoring: [Add alert for Z]

## Lessons Learned
[What we learned]
```

---

## 🔗 Quick Links

- **Railway Dashboard**: https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9
- **GitHub Repo**: https://github.com/Balizero1987/nuzantara
- **Production URLs**:
  - TS Backend: https://ts-backend-production-568d.up.railway.app
  - RAG Backend: https://scintillating-kindness-production-47e3.up.railway.app
  - Frontend: https://zantara.balizero.com

---

**Stay calm. Follow the playbook. Escalate when needed.** 🚨
