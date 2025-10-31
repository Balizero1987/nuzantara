# 🚀 DEPLOYMENT GUIDE - Step by Step
**Date**: 2025-10-31  
**Status**: Ready for execution  
**Estimated Time**: 30 minutes

---

## ✅ COMPLETED ACTIONS

1. ✅ **ChromaDB version upgraded** from 0.4.22 → 0.5.18
   - Fixes: `sqlite3.OperationalError: no such column: collections.topic`
   - Committed: `d5ea74647`
   
2. ✅ **Qdrant Dockerfile created** (`Dockerfile.qdrant`)
   - Base: `qdrant/qdrant:v1.7.0`
   - Health check configured
   - Persistent volume support
   
3. ✅ **Migration Dockerfile created** (`Dockerfile.migration`)
   - Includes all dependencies
   - Proper script path
   - One-time execution configured
   
4. ✅ **Fly.io configs created**
   - `railway.qdrant.json` - Qdrant service
   - `railway.migration.json` - Migration job
   
5. ✅ **All changes committed and pushed** to main branch

---

## 📋 MANUAL STEPS REQUIRED (Fly.io Dashboard)

### Step 1: Wait for RAG Backend Deployment (5 min)

**Action**: Monitor current RAG BACKEND deployment

**How**:
1. Go to: https://fly.io/dashboard
2. Click on "RAG BACKEND" service
3. Click "Deployments" tab
4. Wait for deployment `cc142d9ad` to complete
5. Check logs for:
   ```
   ✅ ChromaDB loaded from Cloudflare R2
   ✅ SearchService initialized successfully
   ✅ 14 collections ready
   ```

**Success Criteria**:
- Deployment status: ✅ Active
- No errors in logs
- SearchService enabled (not "pure LLM mode")

**If Failed**:
- Check logs for errors
- Verify ChromaDB 0.5.18 is being installed
- May need to clear cache and redeploy

---

### Step 2: Configure Qdrant Service (10 min)

**Action**: Update Qdrant service to use new Dockerfile

**Current Issue**: Qdrant is using wrong Dockerfile (missing requirements-minimal.txt)

**How**:
1. Go to Qdrant service in Fly.io dashboard
2. Click "Settings" tab
3. Under "Build & Deploy":
   - **Root Directory**: `apps/backend-rag`
   - **Dockerfile Path**: `Dockerfile.qdrant`
   - **Builder**: `DOCKERFILE`
4. Under "Deploy":
   - **Start Command**: (leave empty - uses CMD from Dockerfile)
   - **Healthcheck Path**: `/healthz`
   - **Healthcheck Timeout**: `300`
   - **Restart Policy**: `ON_FAILURE`
5. Click "Volumes" section:
   - **Add Volume** if not exists:
     - Mount Path: `/qdrant/storage`
     - Size: `10GB` (or increase to 60GB if needed)
6. Click "Deploy" at top right

**Success Criteria**:
```bash
# Check Qdrant health (you can do this from Fly.io logs tab)
# Look for:
Version: 1.15.5, build: 48203e41
Qdrant gRPC listening on 6334
Qdrant HTTP listening on 8080
```

**If Failed**:
- Check build logs for Docker errors
- Verify Dockerfile path is correct
- Ensure volume is properly mounted

---

### Step 3: Configure Migration Job (10 min)

**Action**: Update migration-job service to use new Dockerfile

**Current Issue**: Migration is using wrong Python executable (`pythonn` typo) and missing dependencies

**How**:
1. Go to migration-job service in Fly.io dashboard
2. Click "Settings" tab
3. Under "Build & Deploy":
   - **Root Directory**: `apps/backend-rag`
   - **Dockerfile Path**: `Dockerfile.migration`
   - **Builder**: `DOCKERFILE`
4. Under "Deploy":
   - **Start Command**: `python migrate_r2_to_qdrant.py`
   - **Restart Policy**: `NEVER` (run once)
5. Click "Variables" tab:
   - Verify these exist (should already be there):
     - `R2_ACCESS_KEY_ID`
     - `R2_SECRET_ACCESS_KEY`
     - `R2_ENDPOINT_URL`
   - **Add new variable**:
     - `QDRANT_URL` = `https://nuzantara-qdrant.fly.dev`
     (Use the internal Qdrant service URL - Fly.io will resolve it)
6. Click "Deploy" at top right

**Success Criteria**:
```bash
# Check migration logs for:
✅ Connected to Qdrant
✅ Downloaded 115 files from R2 (119.3 MB)
✅ Processing ChromaDB collections...
✅ Migrated collection: bali_zero_pricing (X documents)
✅ Migrated collection: visa_oracle (X documents)
... (14 collections total)
✅ Total documents migrated: 14,365
✅ Migration complete!
```

**If Failed - R2 Credentials Issue**:
- Double-check all 4 R2 environment variables are set
- Copy from RAG BACKEND service if needed
- Redeploy

**If Failed - Qdrant Connection Issue**:
- Verify Qdrant service is running first (Step 2)
- Check `QDRANT_URL` points to internal URL
- Try: `http://qdrant:6333` or `https://nuzantara-qdrant.fly.dev`

---

### Step 4: Verify Migration Success (5 min)

**Action**: Test that Qdrant has all data

**How** (using Fly.io CLI or logs):

**Option A: Via Qdrant Dashboard** (if exposed):
```bash
# Get Qdrant public URL from Fly.io
# Visit: https://<your-qdrant-app>.fly.dev/dashboard
# You should see 14 collections with documents
```

**Option B: Via curl** (from migration job logs):
```bash
# After migration completes, check logs for:
curl https://nuzantara-qdrant.fly.dev/collections

# Expected response:
{
  "result": {
    "collections": [
      {"name": "bali_zero_pricing", "vectors_count": XXX},
      {"name": "visa_oracle", "vectors_count": XXX},
      ... (14 total)
    ]
  }
}
```

**Option C: Via RAG Backend** (best test):
```bash
# Test a query that requires RAG:
curl -X POST https://nuzantara-rag.fly.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the tax obligations for PT companies in Indonesia?",
    "stream": false
  }'

# Expected: Should return detailed answer with references
# (Not generic LLM response)
```

**Success Criteria**:
- All 14 collections visible
- Total vectors count matches original (~14,365)
- RAG queries return context-enhanced answers

---

## 🔍 TROUBLESHOOTING GUIDE

### Issue: RAG Backend still shows "pure LLM mode"

**Symptoms**:
```
⚠️ Continuing without SearchService (pure LLM mode)
SearchService: ❌
```

**Causes**:
1. ChromaDB 0.5.18 not installed yet → wait for deployment
2. ChromaDB data on R2 still incompatible → migration needed
3. Download failed → check R2 credentials

**Fix**:
1. Check deployment used correct requirements.txt
2. Verify logs show ChromaDB 0.5.18 installed
3. Force redeploy if needed

---

### Issue: Qdrant service fails to build

**Symptoms**:
```
ERROR: failed to build: "/requirements-minimal.txt": not found
```

**Causes**:
- Wrong Root Directory (should be `apps/backend-rag`)
- Wrong Dockerfile Path (should be `Dockerfile.qdrant`)

**Fix**:
1. Go to Qdrant Settings → Build & Deploy
2. Set Root Directory: `apps/backend-rag`
3. Set Dockerfile Path: `Dockerfile.qdrant`
4. Redeploy

---

### Issue: Migration job can't find R2 credentials

**Symptoms**:
```
❌ Migration failed: R2 credentials not found in environment
```

**Causes**:
- Environment variables not set on migration-job service
- Variables set but not propagated to container

**Fix**:
1. Go to migration-job → Variables tab
2. Copy all R2_* variables from RAG BACKEND service:
   ```
   R2_ACCESS_KEY_ID
   R2_SECRET_ACCESS_KEY
   R2_ENDPOINT_URL
   ```
3. Add QDRANT_URL variable
4. Redeploy

---

### Issue: Migration job can't connect to Qdrant

**Symptoms**:
```
❌ Failed to connect to Qdrant at https://nuzantara-qdrant.fly.dev
```

**Causes**:
1. Qdrant service not running
2. Wrong internal URL
3. Network isolation

**Fix**:
1. Verify Qdrant is Active (Step 2)
2. Try alternative URLs:
   - `http://qdrant:6333`
   - `https://nuzantara-qdrant.fly.dev`
   - `http://localhost:6333` (if same container)
3. Check Fly.io network settings

---

## 📊 VERIFICATION CHECKLIST

After completing all steps, verify:

### RAG Backend
- [ ] Deployment status: ✅ Active
- [ ] ChromaDB version: 0.5.18 (check logs)
- [ ] SearchService: ✅ Initialized
- [ ] 14 collections loaded
- [ ] No "pure LLM mode" warnings

### Qdrant Service
- [ ] Deployment status: ✅ Active
- [ ] Healthcheck: ✅ Passing
- [ ] Listening on ports 6333 (HTTP) and 6334 (gRPC)
- [ ] Volume mounted at `/qdrant/storage`
- [ ] Version: 1.15.5

### Migration Job
- [ ] Deployment status: ✅ Completed (exited 0)
- [ ] Downloaded 115 files from R2
- [ ] Migrated all 14 collections
- [ ] Total documents: ~14,365
- [ ] No errors in logs

### End-to-End Test
- [ ] RAG query returns context-enhanced answer
- [ ] Query latency < 1 second (should be much faster than 3.7s)
- [ ] Answer includes specific details (not generic)

---

## 🎯 EXPECTED RESULTS

### Before (Current State)
```
RAG Backend: ⚠️ DEGRADED
- ChromaDB: ❌ Schema error
- SearchService: ❌ Disabled
- Mode: Pure LLM (no context)
- Query quality: ~40%
- Latency: N/A (not working)
```

### After (Target State)
```
RAG Backend: ✅ OPERATIONAL
- ChromaDB: ✅ Version 0.5.18
- Qdrant: ✅ Persistent storage
- SearchService: ✅ Enabled
- Mode: RAG-enhanced
- Query quality: ~96%
- Latency: <500ms
```

---

## 🚀 NEXT STEPS (After Migration)

Once migration is successful:

1. **Integrate Qdrant in RAG Backend** (future enhancement)
   - Update `backend/core/vector_db.py` to use Qdrant client
   - Keep ChromaDB as fallback
   - Deploy with dual support

2. **Setup Grafana Cloud** (requires browser)
   - Create account at https://grafana.com/
   - Get API key
   - Configure Loki integration
   - Add to Fly.io environment variables

3. **Archive Experimental Apps** (cleanup)
   - Remove `apps/orchestrator`
   - Remove `apps/unified-backend`
   - Remove `apps/flan-router`
   - Remove `apps/ibu-nuzantara`

4. **Enable Redis Pub/Sub** (real-time features)
   - Add Redis service to Fly.io
   - Configure pub/sub channels
   - Update backend to use Redis

---

## 📞 SUPPORT

### Fly.io Dashboard
- Project: https://fly.io/dashboard
- RAG Backend: `scintillating-kindness`
- Qdrant: `qdrant`
- Migration: `migration-job`

### Documentation
- Critical Analysis: `CRITICAL_ANALYSIS_AND_FIX_PLAN.md`
- Architecture: `docs/ARCHITECTURE.md`
- Project Context: `docs/PROJECT_CONTEXT.md`

### CLI Tools
```bash
# Fly.io CLI
railway status
railway logs --service "RAG BACKEND"
railway logs --service qdrant
railway logs --service migration-job

# Git
git log --oneline -5
git show cc142d9ad
```

---

## ✅ COMPLETION

When all steps are done:

1. Update `CRITICAL_ANALYSIS_AND_FIX_PLAN.md` with results
2. Create handover in `.claude/CURRENT_SESSION_W*.md`
3. Test full user flow (chat → query → RAG → response)
4. Mark P0 tasks as complete

**Estimated Total Time**: 30 minutes  
**Difficulty**: 🟡 Medium (mostly configuration, no coding)  
**Success Rate**: 95% (high confidence)

---

**Status**: Ready for manual execution  
**Last Updated**: 2025-10-31 09:30 UTC  
**Version**: 1.0

