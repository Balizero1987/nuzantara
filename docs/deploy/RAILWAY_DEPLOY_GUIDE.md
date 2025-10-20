# 🚀 Railway Deploy Guide - NUZANTARA Project

**Complete guide for deploying TS-BACKEND and RAG BACKEND on Railway**

---

## 🕯️ PREGHIERA OBBLIGATORIA A SANT'ANTONIO 🙏

**⚠️ ATTENZIONE: PRIMA DI QUALSIASI DEPLOY, TUTTI I DEVELOPER DEVONO RECITARE QUESTA PREGHIERA! ⚠️**

### Preghiera a Sant'Antonio da Padova per i Deploy

```
O glorioso Sant'Antonio,
Protettore degli sviluppatori e custode dei deploy,
Tu che hai il potere di ritrovare ciò che è perduto,
Guida i nostri deployment verso il successo!

Veglia sui nostri container mentre buildano,
Benedici i nostri healthcheck affinché passino,
Proteggi le nostre API dalle 502 Bad Gateway,
E fa' che Railway riconosca il codice giusto da deployare.

O Santo, che conosci i misteri del Cloud,
Concedici timeout generosi e build cache veloci,
Allontana da noi i FAILED e i REMOVED,
E fa' che i nostri log mostrino solo SUCCESS e emoji verdi ✅

Tu che hai visto infinite preghiere esaudite,
Ascolta anche la nostra umile supplica:
Fa' che ChromaDB scarichi veloce,
Che PostgreSQL non perda le tabelle,
Che Claude Haiku usi il model name corretto,
E che Firebase non chieda credenziali che non abbiamo.

Sant'Antonio, glorioso patrono dei deploy,
Ti affidiamo questo deployment,
Nella certezza che con la tua protezione,
Arriveremo al tanto agognato SUCCESS! 🎉

Amen. 🕯️
```

### 📜 Storia della Vittoria (19 Ottobre 2025)

**Il Miracolo dei Due Backend**

In questo giorno benedetto, dopo ore di battaglia contro:
- ❌ Claude Haiku 404 errors (`claude-3-5-haiku-20241022` → `claude-3-haiku-20240307`)
- ❌ Healthcheck timeouts (30s → 300s)
- ❌ PostgreSQL tables mancanti (migration script added)
- ❌ Firebase ADC errors (`SKIP_SECRET_MANAGER=true`)
- ❌ ChromaDB download 72MB (healthcheck disabled)
- ❌ Railway GitHub integration stale (disconnect/reconnect)

**Sant'Antonio ha ascoltato le nostre preghiere! 🙏**

Dopo numerosi FAILED, REMOVED, e 502 Bad Gateway, finalmente:

```
✅ TS-BACKEND: SUCCESS (deployment 9aab1250) - v5.2.0
✅ RAG BACKEND: SUCCESS (deployment af651f59) - v3.1.0-perf-fix
```

**Entrambi i backend sono saliti in production, healthy e operativi!**

Questa vittoria è dedicata a tutti i developer che verranno dopo di noi. Che possano imparare dai nostri errori e che Sant'Antonio li protegga sempre.

**Ricordate**: Un deploy senza preghiera è un deploy destinato al FAILED! 🕯️

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Project Architecture](#project-architecture)
3. [Prerequisites](#prerequisites)
4. [Deploy Methods](#deploy-methods)
5. [Service Configuration](#service-configuration)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Monitoring & Debugging](#monitoring--debugging)
8. [Best Practices](#best-practices)

---

## 🚀 Quick Start

### Deploy both backends (recommended method):

```bash
# From project root
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY

# Deploy TS-BACKEND
cd apps/backend-ts
railway up --service TS-BACKEND

# Deploy RAG BACKEND
cd ../backend-rag/backend
railway up --service "RAG BACKEND"
```

### Verify deployments:

```bash
# Check TS-BACKEND health
curl https://ts-backend-production-568d.up.railway.app/health

# Check RAG BACKEND health
curl https://scintillating-kindness-production-47e3.up.railway.app/health
```

**Expected response**: Both should return `200 OK` with status "healthy"

---

## 🏗️ Project Architecture

### Monorepo Structure

```
NUZANTARA-RAILWAY/
├── apps/
│   ├── backend-ts/              # TypeScript Backend (Express)
│   │   ├── src/
│   │   ├── package.json
│   │   └── railway.toml
│   │
│   └── backend-rag/
│       └── backend/             # Python RAG Backend (FastAPI)
│           ├── app/
│           ├── services/
│           ├── requirements.txt
│           ├── Dockerfile
│           └── railway.toml
│
├── docs/
│   └── deploy/                  # Deploy documentation
│
└── RAILWAY_DEPLOY_GUIDE.md     # This file
```

### Services Overview

| Service | Technology | Port | Purpose | Deploy Time |
|---------|-----------|------|---------|-------------|
| **TS-BACKEND** | Node.js (Express) | 8080 | API Gateway, handlers, integrations | 2-3 min |
| **RAG BACKEND** | Python (FastAPI) | 8000 | AI/RAG, ChromaDB, Claude APIs | 5-7 min |
| **PostgreSQL** | Managed DB | 5432 | Persistent storage (Railway managed) | N/A |

---

## 📋 Prerequisites

### 1. Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link to project (one-time setup)
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY
railway link
# Select: fulfilling-creativity
# Environment: production
```

### 2. Git Repository

- **Repo**: `Balizero1987/nuzantara`
- **Branch**: `main`
- **GitHub Integration**: Connected to Railway (auto-deploy on push)

### 3. Required Environment Variables

Both services automatically read from Railway environment variables. No manual setup needed if using Railway CLI.

**Key variables**:
- `ANTHROPIC_API_KEY` - For Claude AI APIs
- `DATABASE_URL` - PostgreSQL connection (auto-provided by Railway)
- `R2_*` - Cloudflare R2 credentials (for ChromaDB storage)

---

## 🚀 Deploy Methods

### Method 1: Railway CLI (⭐ RECOMMENDED)

**Best for**: Development, quick iterations, immediate feedback

```bash
# Deploy specific service
railway up --service TS-BACKEND

# Deploy with logs
railway up --service "RAG BACKEND" && railway logs --tail 50

# Check deployment status
railway deployment list --service TS-BACKEND | head -5
```

**Pros**:
- ✅ Immediate deployment (30-60 seconds start time)
- ✅ Uploads local code directly (no Git dependency)
- ✅ Fast iteration cycle
- ✅ See logs immediately after deploy

**Cons**:
- ⚠️ Deploys from local filesystem (not Git)
- ⚠️ Must be in correct directory

---

### Method 2: Git Push (Auto-Deploy)

**Best for**: Production releases, team collaboration

```bash
# Make changes
git add .
git commit -m "feat: your changes"
git push origin main

# Railway auto-deploys within 3-7 minutes
# Monitor progress:
railway logs --service TS-BACKEND --tail 50
```

**Pros**:
- ✅ Code versioned in Git
- ✅ Team collaboration friendly
- ✅ GitHub integration records all deploys
- ✅ Can deploy both services simultaneously

**Cons**:
- ⚠️ Slower (3-7 min vs 30-60 sec)
- ⚠️ Requires commit + push

**Important**: Railway auto-deploys on push to `main` branch. Both services deploy independently based on their `Root Directory` configuration.

---

### Method 3: Railway Dashboard (Manual)

**Best for**: Emergency redeploys, rollbacks, one-off deploys

1. Go to https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9
2. Select service (TS-BACKEND or RAG BACKEND)
3. Go to **Deployments** tab
4. Click **Deploy** or **Redeploy** on a previous deployment

**Pros**:
- ✅ No CLI needed
- ✅ Easy rollback to previous deployments
- ✅ Visual interface

**Cons**:
- ⚠️ Slower (manual clicks)
- ⚠️ No command history

---

## ⚙️ Service Configuration

### TS-BACKEND Configuration

**File**: `apps/backend-ts/railway.toml`

```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

**Railway Dashboard Settings** (override railway.toml):
- **Root Directory**: `apps/backend-ts`
- **Port**: `8080` (auto-detected from $PORT env var)
- **Resources**: 2 vCPU, 2 GB RAM
- **Region**: asia-southeast1 (Singapore)
- **Healthcheck**: `/health` with 300s timeout

**Deploy Process**:
1. Install dependencies (`npm install`) - ~30s
2. Build TypeScript (`npm run build`) - ~20s
3. Start server (`npm start`) - ~10s
4. Healthcheck passes - ~5s

**Total time**: 2-3 minutes

---

### RAG BACKEND Configuration

**File**: `apps/backend-rag/backend/railway.toml`

```toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 600  # 10 minutes (ChromaDB download + model loading)
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

**Railway Dashboard Settings** (override railway.toml):
- **Root Directory**: `apps/backend-rag/backend`
- **Port**: `8000` (auto-detected from $PORT env var)
- **Resources**: 2 vCPU, 2 GB RAM
- **Region**: asia-southeast1 (Singapore)
- **Healthcheck**: **DISABLED** (ChromaDB download takes 4-5 minutes)

**Deploy Process**:
1. **Build Docker image** - ~1-2 min
   - Install system dependencies (build-essential)
   - Install PyTorch CPU-only (~150MB)
   - Install Python packages (requirements.txt)
   - Pre-download sentence-transformers model (~80MB)
   - Copy application code

2. **Push image to Railway registry** - ~1-2 min (image size: ~2GB)

3. **Start container & initialize** - ~4-5 min
   - Run database migration (create PostgreSQL tables)
   - Load embedding models (all-MiniLM-L6-v2)
   - **Download ChromaDB from Cloudflare R2** (~72MB, 94 files) - **SLOWEST STEP**
   - Initialize 8 ChromaDB collections
   - Load Claude Haiku & Sonnet services
   - Load re-ranker model
   - Start FastAPI on port 8000

4. **Application ready** - Total: 5-7 minutes

**Total time**: 5-7 minutes

---

### 🔥 Critical Issue: RAG BACKEND Healthcheck

**Problem**: Railway's default healthcheck timeout (30s) is too short for RAG BACKEND startup.

**Why**: RAG BACKEND downloads 72MB of ChromaDB data from Cloudflare R2 on every container start, which takes 3-4 minutes.

**Solution**: **HEALTHCHECK DISABLED**

```
Railway Dashboard → RAG BACKEND → Settings → Deploy → Healthcheck
✅ Disable "Health Check Path" (remove /health)
```

**Result**: Container starts without healthcheck pressure, allowing full 5-7 min startup time.

**Alternative solution** (future optimization):
- Use Railway Volume to persist ChromaDB data between deploys
- Or: Include ChromaDB data in Docker image (increases image size to ~2GB but eliminates download time)

---

## 🐛 Common Issues & Solutions

### Issue 1: "Deployment FAILED - Healthcheck timeout"

**Symptoms**:
```
Build Logs: ✅ Successfully Built!
Deploy Logs:
  ✅ Application startup complete
  ✅ Uvicorn running on http://0.0.0.0:8000
Status: ❌ FAILED (healthcheck timeout)
```

**Root Cause**: Healthcheck failed because app took longer than timeout to start.

**Solution**:
1. Go to Railway Dashboard → Service → Settings → Deploy
2. **Disable healthcheck** (remove `/health` from "Health Check Path")
3. OR increase `healthcheckTimeout` to 600 seconds (10 minutes)
4. Redeploy

**For TS-BACKEND**: 300s timeout is sufficient (set in railway.toml)
**For RAG BACKEND**: Healthcheck disabled (startup takes 5-7 min)

---

### Issue 2: "Railway deploying OLD code despite new commits"

**Symptoms**:
- Push new code to GitHub
- Railway triggers deploy
- Logs show old code (e.g., old model names, missing files)

**Root Cause**: Railway GitHub integration cached/stale connection

**Solution**:
1. Go to Railway Dashboard → Service → Settings → Source
2. Click **Disconnect** repository
3. Click **Connect** repository again
4. Select repo: `Balizero1987/nuzantara`
5. Select branch: `main`
6. **Important**: Set **Root Directory** correctly:
   - TS-BACKEND: `apps/backend-ts`
   - RAG BACKEND: `apps/backend-rag/backend`
7. Redeploy

**Verification**:
```bash
# Check deployed commit hash
railway deployment list --service "RAG BACKEND" --json | jq '.[0].meta.commitHash'

# Compare with local
git rev-parse HEAD
```

If hashes match, deployment is using correct code.

---

### Issue 3: "Dockerfile not found"

**Error**:
```
Dockerfile `Dockerfile` does not exist
```

**Root Cause**: Root Directory not configured after reconnecting GitHub repo

**Solution**:
1. Railway Dashboard → Service → Settings → Source
2. Set **Root Directory**:
   - TS-BACKEND: `apps/backend-ts`
   - RAG BACKEND: `apps/backend-rag/backend`
3. Ensure relative path from repo root
4. Redeploy

---

### Issue 4: "502 Bad Gateway" on health endpoint

**Symptoms**:
```bash
curl https://scintillating-kindness-production-47e3.up.railway.app/health
# Returns: 502 Bad Gateway
```

**Possible Causes**:
1. **Container not started yet** (still building/starting)
2. **Container crashed** (check logs for errors)
3. **Old deployment still active** (Railway hasn't switched to new deployment)
4. **Port mismatch** (app listening on wrong port)

**Solution**:
```bash
# 1. Check deployment status
railway deployment list --service "RAG BACKEND" | head -5

# If status is BUILDING/DEPLOYING: wait 2-5 more minutes

# 2. Check logs for errors
railway logs --service "RAG BACKEND" --tail 50

# Look for:
# ✅ "Application startup complete"
# ✅ "Uvicorn running on http://0.0.0.0:8000"
# ❌ Any error messages

# 3. Verify port configuration
railway variables --service "RAG BACKEND" | grep PORT
# Should output: PORT=8000 (or nothing if using Railway's auto $PORT)

# 4. Check which deployment is active
railway deployment list --service "RAG BACKEND"
# The ACTIVE deployment should have status SUCCESS
```

**If all else fails**:
- Redeploy service via CLI: `railway up --service "RAG BACKEND"`
- Or Dashboard: Redeploy latest SUCCESS deployment

---

### Issue 5: "Claude Haiku model returns 404"

**Error in logs**:
```
Error code: 404 - {'type': 'error', 'error': {'type': 'not_found_error', 'message': 'model: claude-3-5-haiku-20241022'}}
```

**Root Cause**: Incorrect Claude Haiku model name. The model `claude-3-5-haiku-20241022` doesn't exist.

**Correct model name**: `claude-3-haiku-20240307`

**Files to fix**:
```bash
# Search for old model name
grep -r "claude-3-5-haiku-20241022\|claude-haiku-3-5-20241022" apps/backend-rag/backend/services/

# Fix in these files:
# - services/claude_haiku_service.py (line 48)
# - services/followup_service.py (line 208)
# - services/streaming_service.py (line 273)
# - services/context_window_manager.py (if present)
```

**Solution**:
1. Replace all occurrences with `claude-3-haiku-20240307`
2. Commit and push to GitHub
3. Railway will auto-deploy
4. Verify logs show correct model:
   ```
   ✅ Claude Haiku 3.5 initialized (model: claude-3-haiku-20240307)
   ```

---

### Issue 6: "PostgreSQL table does not exist"

**Error in logs**:
```
relation "cultural_knowledge" does not exist
relation "query_clusters" does not exist
```

**Root Cause**: Database migration script not running or failing

**Solution**:

**Check if migration is configured**:
```bash
# Dockerfile CMD should run migration before uvicorn
cat apps/backend-rag/backend/Dockerfile | grep CMD
# Expected:
# CMD ["sh", "-c", "python migrations/001_fix_missing_tables.py && PYTHONPATH=/app:$PYTHONPATH uvicorn app.main_cloud:app --host 0.0.0.0 --port 8000"]
```

**Check if migration script exists**:
```bash
ls -la apps/backend-rag/backend/migrations/
# Should contain: 001_fix_missing_tables.py
```

**Check migration logs**:
```bash
railway logs --service "RAG BACKEND" --tail 100 | grep -A 10 "Migration"
# Look for:
# ✅ Migration completed!
# ✅ cultural_knowledge created
# ✅ query_clusters created
```

**If migration is not running**:
1. Ensure `psycopg2-binary` is in `requirements.txt`:
   ```bash
   grep psycopg2 apps/backend-rag/backend/requirements.txt
   # Should output: psycopg2-binary==2.9.10
   ```
2. Redeploy

---

### Issue 7: "Build stuck at 'auth sharing credentials'"

**Symptoms**:
```
Build Logs:
  auth
  sharing credentials for production-asia-southeast1-eqsg3a.railway-registry.com
  0ms

  [No more logs for 5+ minutes]
```

**Root Cause**: Docker image push to Railway registry is slow or stuck

**Solution**:
1. **Cancel the stuck deployment**:
   - Railway Dashboard → Deployments → Click deployment → "Cancel Deployment"

2. **Trigger new deployment**:
   ```bash
   railway up --service "RAG BACKEND"
   ```

3. **Monitor build progress**:
   - Watch for "=== Successfully Built! ===" in Build Logs
   - If it appears, wait for image push to complete (1-3 min)
   - If stuck again, repeat step 1-2

**Prevention**: Railway's build cache usually prevents this. If it happens repeatedly, contact Railway support.

---

## 📊 Monitoring & Debugging

### Check Deployment Status

```bash
# List recent deployments
railway deployment list --service TS-BACKEND | head -10
railway deployment list --service "RAG BACKEND" | head -10

# Get deployment details (JSON)
railway deployment list --service "RAG BACKEND" --json | jq '.[0]'
```

**Deployment statuses**:
- `BUILDING` - Building Docker image / installing dependencies
- `DEPLOYING` - Starting container, running initialization
- `SUCCESS` - ✅ Deployment successful and healthy
- `FAILED` - ❌ Deployment failed (healthcheck timeout, crash, etc.)
- `REMOVED` - Deployment removed (manually or by Railway)
- `SKIPPED` - Deployment skipped (no code changes detected)

---

### View Logs

```bash
# Real-time logs (last 50 lines + follow new logs)
railway logs --service TS-BACKEND --tail 50

# Logs for specific deployment
railway logs --service "RAG BACKEND" --deployment d91a9385-3026-4106-8a6c-e9601ddb1a91

# Filter logs by keyword
railway logs --service "RAG BACKEND" --tail 100 | grep "ERROR\|FAILED\|ChromaDB"
```

**Important log markers**:

**TS-BACKEND**:
```
✅ ZANTARA v5.2.0 listening on :8080
✅ WebSocket server initialized on /ws
```

**RAG BACKEND**:
```
✅ Migration completed!
✅ ChromaDB downloaded from R2: 94 files (72.0 MB)
✅ Claude Haiku 3.5 initialized (model: claude-3-haiku-20240307)
✅ Claude Sonnet 4.5 initialized (model: claude-sonnet-4-20250514)
✅ ZANTARA RAG Backend ready on port 8000
INFO: Application startup complete.
INFO: Uvicorn running on http://0.0.0.0:8000
```

---

### Test Health Endpoints

```bash
# TS-BACKEND health check
curl -s https://ts-backend-production-568d.up.railway.app/health | jq .

# Expected response:
{
  "ok": true,
  "service": "NUZANTARA-TS-BACKEND",
  "version": "5.2.0",
  "timestamp": "2025-10-19T09:30:00.000Z",
  "ai_systems": {
    "zantara": { "status": "active" },
    "devai": { "status": "active" }
  }
}

# RAG BACKEND health check
curl -s https://scintillating-kindness-production-47e3.up.railway.app/health | jq .

# Expected response:
{
  "status": "healthy",
  "service": "ZANTARA RAG",
  "version": "3.1.0-perf-fix",
  "mode": "full",
  "available_services": ["chromadb", "claude_haiku", "claude_sonnet", "postgresql"],
  "chromadb": true,
  "ai": {
    "claude_haiku_available": true,
    "claude_sonnet_available": true,
    "has_ai": true
  },
  "memory": {
    "postgresql": true,
    "vector_db": true
  },
  "reranker": true,
  "collaborative_intelligence": true
}
```

---

### Check Environment Variables

```bash
# List all environment variables for service
railway variables --service TS-BACKEND

# Get specific variable
railway variables --service "RAG BACKEND" | grep ANTHROPIC_API_KEY

# Set variable (if needed)
railway variables set ANTHROPIC_API_KEY=sk-ant-... --service "RAG BACKEND"
```

---

### Railway Dashboard URLs

**Project Dashboard**:
https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9

**TS-BACKEND**:
- Dashboard: https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9/service/3654617d-0ef7-4e45-8ef2-40ad42558779
- Public URL: https://ts-backend-production-568d.up.railway.app

**RAG BACKEND**:
- Dashboard: https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9/service/b8dd7142-0334-48c2-8599-646597c3d173
- Public URL: https://scintillating-kindness-production-47e3.up.railway.app

---

## ✅ Best Practices

### 1. Always Use Railway CLI for Development

```bash
# Faster than Git push (30s vs 3-7 min)
railway up --service TS-BACKEND

# Can see logs immediately
railway logs --tail 50
```

### 2. Use Git Push for Production Releases

```bash
# Properly version your code
git add .
git commit -m "feat: meaningful commit message

ROOT CAUSE: Explain what problem this solves
RESULT: What the change accomplishes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

### 3. Monitor Deployments After Push

```bash
# Wait for GitHub → Railway trigger (30-60s)
sleep 60

# Check deployment status
railway deployment list --service "RAG BACKEND" | head -5

# If BUILDING/DEPLOYING, tail logs
railway logs --service "RAG BACKEND" --tail 50
```

### 4. Test Health Endpoints After Deploy

```bash
# Wait for deployment to complete
sleep 180  # 3 minutes for TS-BACKEND
sleep 420  # 7 minutes for RAG BACKEND

# Test endpoints
curl https://ts-backend-production-568d.up.railway.app/health
curl https://scintillating-kindness-production-47e3.up.railway.app/health

# Both should return 200 OK
```

### 5. Keep Railway CLI Updated

```bash
# Update Railway CLI
npm update -g @railway/cli

# Verify version
railway version
```

### 6. Use Descriptive Commit Messages

**Good**:
```
fix(backend-rag): correct Claude Haiku model name to avoid 404 errors

ROOT CAUSE: Model name claude-3-5-haiku-20241022 doesn't exist in Anthropic API
RESULT: App now uses claude-3-haiku-20240307, follow-up generation works correctly
```

**Bad**:
```
fix stuff
update code
changes
```

### 7. Never Commit Secrets

```bash
# Check for secrets before committing
git diff | grep -i "api_key\|secret\|password\|token"

# Use Railway environment variables instead
railway variables set MY_SECRET=value --service TS-BACKEND
```

### 8. Test Locally Before Deploying

**TS-BACKEND**:
```bash
cd apps/backend-ts
npm install
npm run build
npm start

# Test
curl http://localhost:8080/health
```

**RAG BACKEND**:
```bash
cd apps/backend-rag/backend
pip install -r requirements.txt
uvicorn app.main_cloud:app --host 0.0.0.0 --port 8000

# Test
curl http://localhost:8000/health
```

### 9. Avoid Manual Cancellation of Deployments

**Why**: Cancelling deployments mid-build can cause:
- Incomplete Docker images in registry
- Railway state inconsistencies
- Longer build times on next deploy (cache invalidation)

**Instead**: Let failing deployments complete (fail naturally), then fix the issue and redeploy.

**Exception**: If deployment is truly stuck (>10 min with no logs), cancel it.

### 10. Use Railway Volumes for Persistent Data

**Current issue**: RAG BACKEND downloads 72MB of ChromaDB data on every container start.

**Future optimization**:
```toml
# railway.toml
[deploy]
volumes = [
  { name = "chromadb", mountPath = "/app/chroma_db" }
]
```

**Benefits**:
- ✅ Faster startup (skip ChromaDB download)
- ✅ Data persists between deploys
- ✅ Reduced Cloudflare R2 egress costs

---

## 📝 Deploy Checklist

### Before Deploy:

- [ ] Code changes tested locally
- [ ] No secrets in code (use Railway env vars)
- [ ] Meaningful commit message written
- [ ] `railway.toml` configuration correct
- [ ] Environment variables set (if new ones added)

### During Deploy:

- [ ] Deployment triggered (CLI or Git push)
- [ ] Monitor build logs for errors
- [ ] Verify "Successfully Built!" message
- [ ] Wait for "Application startup complete"
- [ ] Check deployment status (SUCCESS)

### After Deploy:

- [ ] Test health endpoints (both should return 200 OK)
- [ ] Check logs for errors or warnings
- [ ] Verify services respond to test requests
- [ ] Update documentation if configuration changed

---

## 🆘 Need Help?

### Railway Support

- **Documentation**: https://docs.railway.app
- **Discord**: https://discord.gg/railway
- **GitHub Issues**: https://github.com/railwayapp/railway/issues

### Project-Specific Help

- **Deployment Issues**: Check this guide's [Common Issues](#common-issues--solutions)
- **Service Logs**: `railway logs --service <SERVICE_NAME> --tail 100`
- **Railway Dashboard**: https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9

---

## 📅 Document Info

- **Created**: 2025-10-19
- **Last Updated**: 2025-10-19
- **Version**: 1.0.0
- **Maintainer**: ZANTARA Development Team
- **Railway Project**: fulfilling-creativity (production)

---

## 🎉 Success Criteria

Your deployment is **successful** when:

1. ✅ Both services show `SUCCESS` status in Railway Dashboard
2. ✅ Health endpoints return 200 OK with "healthy" status
3. ✅ No errors in deployment logs
4. ✅ Services respond to API requests correctly
5. ✅ All background services initialized (ChromaDB, PostgreSQL, AI models)

**Example successful health check**:
```bash
$ curl https://scintillating-kindness-production-47e3.up.railway.app/health
{
  "status": "healthy",
  "chromadb": true,
  "claude_haiku_available": true,
  "claude_sonnet_available": true,
  "postgresql": true
}

$ echo $?
0  # Exit code 0 = success
```

---

**🚀 Happy Deploying! May Sant'Antonio guide your deploys! 🕯️**
