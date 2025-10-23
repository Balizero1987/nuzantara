---
name: debug-assistant
description: Comprehensive debugging support for nuzantara including log analysis, error tracking, service diagnostics, and troubleshooting common issues
---

# Debug Assistant Protocol

Use this skill when user reports errors, services aren't working, debugging production issues, or when logs show problems.

## Quick Diagnostic

### 1. Check Service Status
```bash
# Are services running?
lsof -i :8080  # TypeScript backend
lsof -i :8000  # Python RAG backend
lsof -i :5432  # PostgreSQL

# Check health endpoints
curl http://localhost:8080/health
curl http://localhost:8000/health
```

### 2. Recent Errors in Logs
```bash
# TypeScript backend logs
tail -n 100 logs/combined.log | grep -i "error"

# Check for critical errors
grep -i "error\|exception\|fatal\|critical" logs/*.log | tail -n 20

# Python backend logs (if using file logging)
tail -n 100 apps/backend-rag/backend/logs/app.log
```

### 3. System Resources
```bash
# Memory usage
free -h

# Disk space
df -h

# CPU usage
top -bn1 | head -n 20

# Process status
ps aux | grep -E "node|python|postgres"
```

## Systematic Debugging

### Step 1: Identify the Problem

**Gather Information**:
- What is the user trying to do?
- What error message are they seeing?
- When did it start happening?
- Does it happen consistently or intermittently?
- What changed recently?

### Step 2: Reproduce the Issue

**Attempt to reproduce**:
```bash
# Try the exact same request
curl -X POST http://localhost:8080/api/rag/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "tier": 0}'

# Check response status and body
# Look for error codes: 400, 401, 403, 404, 429, 500
```

### Step 3: Analyze Logs

**TypeScript Backend Logs**:
```bash
# Real-time log monitoring
tail -f logs/combined.log

# Filter by request ID
grep "requestId-12345" logs/combined.log

# Filter by user ID
grep "userId=abc123" logs/combined.log

# Show only errors
grep -i "error" logs/combined.log | tail -n 50
```

**Python Backend Logs**:
```bash
# If using uvicorn
tail -f logs/uvicorn.log

# Check FastAPI logs
grep "ERROR" apps/backend-rag/backend/logs/*.log
```

**Database Logs**:
```bash
# PostgreSQL logs (location varies)
tail -f /var/log/postgresql/postgresql-*.log
```

### Step 4: Check Database

**Connection Issues**:
```bash
# Can we connect?
psql $DATABASE_URL -c "SELECT 1;"

# Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Look for long-running queries
psql $DATABASE_URL -c "
  SELECT pid, now() - pg_stat_activity.query_start AS duration, query
  FROM pg_stat_activity
  WHERE state = 'active'
  ORDER BY duration DESC;
"
```

**Prisma Issues**:
```bash
# Check Prisma connection
npx prisma db pull

# Check migration status
npx prisma migrate status

# Reset if needed (CAUTION: dev only!)
npx prisma migrate reset
```

### Step 5: Check ChromaDB

**Vector Database Issues**:
```python
# Test ChromaDB connectivity
import chromadb

client = chromadb.Client()
collections = client.list_collections()
print(f"Collections: {collections}")

# Check collection size
collection = client.get_collection("nuzantara_kb")
print(f"Chunks: {collection.count()}")

# Test query
results = collection.query(
    query_texts=["test query"],
    n_results=1
)
print(f"Results: {results}")
```

If ChromaDB fails:
```bash
# Check data directory
ls -lh data/chroma/

# Verify permissions
chmod -R 755 data/chroma/

# Restart service (if standalone)
docker restart chromadb
```

### Step 6: Authentication Issues

**JWT Token Problems**:
```typescript
// Test token validation
import jwt from 'jsonwebtoken';

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Token valid:', decoded);
} catch (error) {
  console.error('Token invalid:', error.message);
  // Common: TokenExpiredError, JsonWebTokenError
}
```

**Common Auth Issues**:
- Token expired: Check expiration time
- Invalid signature: Wrong JWT_SECRET
- Missing Authorization header
- Malformed token (missing "Bearer " prefix)

### Step 7: API Integration Issues

**External API Failures**:
```bash
# Test Anthropic API
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model": "claude-3-5-sonnet-20241022", "max_tokens": 10, "messages": [{"role": "user", "content": "Hi"}]}'

# Test OpenAI API
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**Common Issues**:
- Invalid API keys
- Rate limits hit (429 status)
- Network timeouts
- API service down

### Step 8: Performance Issues

**Slow Queries**:
```bash
# Database query performance
psql $DATABASE_URL -c "
  SELECT query, mean_exec_time, calls
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"

# Check for missing indexes
npx prisma db pull
# Review schema for index opportunities
```

**Memory Leaks**:
```bash
# Monitor memory over time
while true; do
  ps aux | grep "node.*backend-ts" | awk '{print $6}'
  sleep 10
done

# Node.js heap dump (if memory growing)
kill -USR2 <node-pid>
```

**Slow RAG Queries**:
```python
import time

start = time.time()
results = collection.query(query_texts=["test"], n_results=10)
elapsed = time.time() - start

print(f"Query took {elapsed:.2f}s")

# If > 2s, investigate:
# - Large collection size
# - Inefficient embedding model
# - Disk I/O issues
```

## Common Issues & Solutions

### Issue: "Cannot connect to database"
**Symptoms**: Database connection errors, Prisma failures
**Debug**:
```bash
# Check DATABASE_URL env var
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check PostgreSQL is running
systemctl status postgresql
# or
docker ps | grep postgres
```
**Solution**:
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check firewall/network settings
- Verify credentials

### Issue: "ChromaDB collection not found"
**Symptoms**: RAG queries fail, "Collection does not exist" error
**Debug**:
```bash
# List data directory
ls -la data/chroma/

# Check if collection files exist
```
**Solution**:
- Load knowledge base: `python scripts/load-kb.py`
- Verify data path in config
- Check permissions on data directory

### Issue: "Rate limit exceeded"
**Symptoms**: 429 status code, "Too many requests"
**Debug**:
```bash
# Check rate limit config
grep -r "rate-limit" apps/backend-ts/src/

# Check Redis (if used for rate limiting)
redis-cli KEYS "rate-limit:*"
```
**Solution**:
- Wait for rate limit to reset
- Increase rate limit threshold (if appropriate)
- Implement request queuing
- Use caching to reduce requests

### Issue: "Oracle agent not responding"
**Symptoms**: Timeout, empty responses, errors
**Debug**:
```bash
# Check agent configuration
ls -la projects/oracle-system/agents/

# Test agent directly
curl -X POST http://localhost:8080/api/oracle/visa-oracle \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "test"}' \
  -v
```
**Solution**:
- Verify agent config files exist
- Check Anthropic API key validity
- Ensure tier-based access is correct
- Review agent prompts for issues

### Issue: "High memory usage"
**Symptoms**: OOM errors, slow performance, crashes
**Debug**:
```bash
# Check current memory
free -h

# Monitor process memory
watch -n 1 'ps aux | grep -E "node|python" | grep -v grep'

# Node.js heap usage
curl http://localhost:8080/api/debug/heap
```
**Solution**:
- Restart services
- Check for memory leaks in code
- Optimize ChromaDB loading (lazy load)
- Increase system memory
- Implement memory limits in Docker

### Issue: "Slow API responses"
**Symptoms**: Requests taking > 2 seconds
**Debug**:
```bash
# Measure request time
time curl http://localhost:8080/api/rag/query \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "test", "tier": 0}'

# Check database query times
# Enable query logging in Prisma
```
**Solution**:
- Add database indexes
- Implement Redis caching
- Optimize ChromaDB queries
- Review N+1 query problems
- Consider CDN for static assets

### Issue: "Authentication failing"
**Symptoms**: 401 Unauthorized, token errors
**Debug**:
```bash
# Decode JWT token
echo $TOKEN | cut -d '.' -f2 | base64 -d | jq

# Check token expiration
# Check JWT_SECRET matches

# Test login endpoint
curl -X POST http://localhost:8080/api/auth/login \
  -d '{"email": "test@example.com", "password": "pass"}' \
  -v
```
**Solution**:
- Verify JWT_SECRET is consistent
- Check token hasn't expired
- Ensure "Bearer " prefix in Authorization header
- Verify user exists in database

## Debug Tools

### Enable Debug Mode
```bash
# TypeScript backend
DEBUG=* npm run dev

# Python backend
LOG_LEVEL=DEBUG uvicorn app.main_cloud:app --reload
```

### Request Tracing
Add request IDs to track requests across services:
```typescript
// Middleware to add request ID
app.use((req, res, next) => {
  req.id = randomUUID();
  logger.info('Request started', { requestId: req.id, path: req.path });
  next();
});
```

### Error Monitoring
Use structured logging:
```typescript
logger.error('RAG query failed', {
  requestId,
  userId,
  error: error.message,
  stack: error.stack,
  query: sanitize(query)  // Remove sensitive data
});
```

## Key Files for Debugging
- `apps/backend-ts/src/middleware/error-handler.ts` - Error handling
- `apps/backend-ts/src/services/logger.ts` - Winston logger config
- `apps/backend-rag/backend/core/` - RAG core logic
- `logs/combined.log` - Application logs
- `.env` - Environment variables
- `railway.json` - Deployment config

## Success Criteria
✅ Root cause identified
✅ Issue reproduced or understood
✅ Logs analyzed for patterns
✅ Solution implemented or recommended
✅ Issue resolved or escalated appropriately
✅ Documentation updated if needed

## Escalation Path

If issue cannot be resolved:
1. Document all debugging steps taken
2. Capture relevant logs and error messages
3. Note any workarounds tried
4. Escalate to senior developer
5. Create issue in issue tracker
6. Add to known issues documentation

## Debug Report Template

```markdown
## 🐛 DEBUG REPORT
Issue: [Brief description]
Reported: [timestamp]
Reporter: [user/system]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### SYMPTOMS
[What's happening]

### REPRODUCTION STEPS
1. [Step 1]
2. [Step 2]
...

### LOGS
```
[Relevant log excerpts]
```

### DIAGNOSIS
[Root cause or hypothesis]

### SOLUTION ATTEMPTED
[What was tried]

### RESOLUTION
[How it was fixed or current status]

### PREVENTION
[How to prevent in future]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
