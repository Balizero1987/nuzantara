# Railway Redis Deployment Guide - PATCH-1

Quick guide to deploy Redis for PATCH-1 caching on Railway.

---

## Step 1: Create Redis Service

### Via Railway Dashboard

1. **Login to Railway**: https://railway.app/dashboard
2. **Select Project**: `nuzantara-railway` (or your project name)
3. **Add New Service**:
   - Click **"New"** → **"Database"** → **"Add Redis"**
   - Railway will provision a Redis instance automatically

### Via Railway CLI (Alternative)

```bash
# Install Railway CLI if not already installed
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Add Redis
railway add redis
```

---

## Step 2: Get Redis Connection URL

### From Dashboard

1. **Navigate to Redis Service**: Click on the Redis service in your project
2. **Go to Variables Tab**: Click "Variables" in the top menu
3. **Copy REDIS_URL**:
   - Look for `REDIS_URL` or `REDIS_PRIVATE_URL`
   - Format: `redis://default:password@containers-us-west-123.railway.app:6379`
   - Click to copy the full URL

### From CLI

```bash
railway variables --service redis

# Look for REDIS_URL in the output
```

---

## Step 3: Update Orchestrator Environment Variables

### From Dashboard

1. **Navigate to Orchestrator Service**: Click on your orchestrator service
2. **Go to Variables Tab**: Click "Variables"
3. **Add New Variables**:
   - Click **"New Variable"**
   - Add each of the following:

   ```
   Variable Name: REDIS_URL
   Value: redis://default:password@containers-us-west-123.railway.app:6379
   (paste the URL you copied from Redis service)

   Variable Name: CACHE_TTL
   Value: 3600

   Variable Name: CACHE_WARM_ON_START
   Value: true
   ```

4. **Save**: Variables auto-save and trigger redeploy

### From CLI

```bash
# Set variables for orchestrator service
railway variables set REDIS_URL="redis://default:xxx@containers-us-west-123.railway.app:6379"
railway variables set CACHE_TTL="3600"
railway variables set CACHE_WARM_ON_START="true"
```

---

## Step 4: Deploy Orchestrator

### Automatic Deploy (if connected to GitHub)

```bash
# Push to trigger auto-deploy
git push origin optimization/redis-performance
```

Railway will automatically:
1. Detect the push
2. Build the orchestrator
3. Deploy with new environment variables
4. Restart the service

### Manual Deploy

```bash
# Via Railway CLI
railway up --service orchestrator
```

Or via Dashboard:
1. Navigate to orchestrator service
2. Click **"Deployments"** tab
3. Click **"Deploy"** button

---

## Step 5: Verify Deployment

### Check Health Endpoint

```bash
curl https://your-orchestrator.railway.app/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "checks": {
    "orchestrator": "healthy",
    "flanRouter": "healthy",
    "haiku": "configured",
    "redis": "healthy"  ← Should be "healthy"
  },
  "timestamp": "2025-10-29T12:00:00Z"
}
```

### Check Logs

```bash
# Via CLI
railway logs --service orchestrator

# Via Dashboard
# Navigate to orchestrator → Deployments → Latest deployment → View logs
```

**Look for**:
- `✅ Redis Connected Successfully`
- No Redis connection errors

### Test Cache

```bash
# First request (cache miss)
time curl -X POST https://your-orchestrator.railway.app/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is KITAS?"}'

# Second request (should be cached)
time curl -X POST https://your-orchestrator.railway.app/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is KITAS?"}'
```

**Expected**:
- First request: ~1-2 seconds
- Second request: ~50-100ms (much faster!)
- Response includes: `"_cache": true`

---

## Troubleshooting

### Issue: Redis shows "unhealthy" in /health

**Possible Causes**:
1. REDIS_URL not set correctly
2. Redis service not running
3. Network connectivity issue

**Solutions**:
```bash
# Check variables are set
railway variables --service orchestrator | grep REDIS

# Check Redis service status
railway status --service redis

# Restart Redis
railway restart --service redis

# Check orchestrator logs for errors
railway logs --service orchestrator | grep -i redis
```

### Issue: "ECONNREFUSED" in logs

**Cause**: Cannot connect to Redis

**Solutions**:
1. Verify REDIS_URL format is correct
2. Ensure Redis service is in same Railway project
3. Check Redis service is running (not crashed)
4. Restart orchestrator service

### Issue: Cache not working (all requests slow)

**Symptoms**: All requests take same time, no `_cache: true` in responses

**Checklist**:
1. ✅ Verify Redis is healthy: `curl .../health`
2. ✅ Check logs for "Cache hit" or "Cache miss" messages
3. ✅ Ensure REDIS_URL includes port (`:6379`)
4. ✅ Verify requests are identical (same query, body, params)

---

## Redis Service Configuration

### Default Settings

Railway Redis comes with:
- **Memory**: 512MB (can be increased)
- **Eviction Policy**: `allkeys-lru` (least recently used)
- **Persistence**: AOF (append-only file)
- **Max Connections**: 10,000

### Scaling (if needed)

To increase Redis capacity:
1. Navigate to Redis service
2. Click **"Settings"** tab
3. Adjust **"Memory"** slider
4. Click **"Update"**

**Note**: Scaling may incur additional costs.

---

## Monitoring

### Check Redis Metrics

Via Railway Dashboard:
1. Navigate to Redis service
2. Click **"Metrics"** tab
3. View:
   - Memory usage
   - CPU usage
   - Network I/O
   - Connection count

### Set Up Alerts (Optional)

1. Navigate to Redis service → Settings
2. Enable **"Health Check Alerts"**
3. Add notification email
4. Configure thresholds:
   - Memory > 90%
   - CPU > 80%
   - Service down

---

## Cost Estimation

**Railway Redis Pricing** (as of 2024):
- **Free Tier**: $5 credit/month (includes Redis)
- **Pro Plan**: $0.000231/GB-hr (~$5/month for 1GB Redis)

**PATCH-1 Expected Usage**:
- Average cache entry: ~2KB
- Estimated entries: ~10,000
- Total memory: ~20MB
- **Cost**: Included in free tier ✅

---

## Next Steps

After successful deployment:

1. ✅ **Monitor Performance**:
   - Track cache hit rate (target: >60%)
   - Monitor response times (target: <400ms avg)

2. ✅ **Optimize TTL**:
   - Adjust `CACHE_TTL` based on data freshness needs
   - Consider category-specific TTLs

3. ✅ **Implement PATCH-2**:
   - Add Grafana monitoring for cache metrics
   - Set up performance dashboards

4. ✅ **Document Results**:
   - Capture before/after latency metrics
   - Document cache hit rate achieved

---

## Rollback Plan

If issues occur:

```bash
# Remove Redis variables
railway variables unset REDIS_URL
railway variables unset CACHE_TTL
railway variables unset CACHE_WARM_ON_START

# Redeploy previous version
railway rollback

# Or deploy main branch
git checkout main
git push origin main
```

The orchestrator will gracefully handle missing Redis:
- Cache operations will fail silently
- Requests will process without caching
- System remains functional

---

## Support Resources

- **Railway Docs**: https://docs.railway.app/databases/redis
- **Redis Docs**: https://redis.io/docs/
- **PATCH-1 README**: [PATCH-1-REDIS-CACHE.md](./PATCH-1-REDIS-CACHE.md)
- **Railway Discord**: https://discord.gg/railway

---

**Created**: 2025-10-29
**Author**: Claude W1
**For**: PATCH-1 Redis Cache Implementation
