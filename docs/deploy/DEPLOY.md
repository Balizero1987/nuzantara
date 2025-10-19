# 🚀 NUZANTARA Railway Deployment Guide

## ⚡ Quick Deploy

Railway uses **GitHub Auto-Deploy**. Just push to main:

```bash
git add .
git commit -m "your changes"
git push origin main
```

Railway automatically detects the push and deploys both backends within **3-7 minutes**.

---

## 🎯 How It Works

### Railway Auto-Deploy Flow

```
1. Push to main branch (GitHub)
   ↓
2. Railway detects commit
   ↓
3. Railway builds Docker images
   ↓
4. Railway runs health checks
   ↓
5. Services go LIVE ✅
```

### Service Configuration

| Service | Root Directory | Deploy Time | Status |
|---------|---------------|-------------|--------|
| **TS-BACKEND** | `apps/backend-ts` | 3-4 min | ✅ Auto-deploy enabled |
| **RAG BACKEND** | `apps/backend-rag/backend` | 6-7 min | ✅ Auto-deploy enabled |

---

## 📊 Monitoring Deployments

### Check Deployment Status

```bash
# Via Railway CLI
railway deployment list --service TS-BACKEND
railway deployment list --service "RAG BACKEND"

# Check service health
curl https://ts-backend-production-568d.up.railway.app/health
curl https://scintillating-kindness-production-47e3.up.railway.app/health
```

### View Live Logs

```bash
# TS Backend logs
railway logs --service TS-BACKEND

# RAG Backend logs
railway logs --service "RAG BACKEND"
```

### Understanding Deployment Statuses

- **SUCCESS** ✅ - Deployment completed, service is live
- **FAILED** ❌ - Build/deploy error (check logs)
- **SKIPPED** ⏭️ - No changes detected in service's root directory
- **BUILDING** 🔨 - Currently building

---

## 🔄 Manual Deploy (Optional)

If you need to force a deploy without code changes:

```bash
# From repo root
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY

# Deploy TS Backend
railway up --service TS-BACKEND

# Deploy RAG Backend
railway up --service "RAG BACKEND"
```

Or via Railway Dashboard:
1. Go to: https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9
2. Click on service (TS-BACKEND or RAG BACKEND)
3. Go to "Deployments" tab
4. Click "Redeploy" on latest deployment

---

## 🐛 Troubleshooting

### Deployment is SKIPPED

**Cause**: No changes detected in the service's root directory

**Solution**:
- Make a change in the relevant directory (`apps/backend-ts` or `apps/backend-rag/backend`)
- Or use manual deploy: `railway up --service TS-BACKEND`

### Deployment FAILED

**Check logs**:
```bash
# Get deployment ID from list
railway deployment list --service TS-BACKEND

# View logs for specific deployment
railway logs --deployment <deployment-id>
```

**Common issues**:
1. Build errors → Check build logs
2. Health check timeout → Verify `/health` endpoint works
3. Missing env vars → Check `railway variables --service TS-BACKEND`

---

## 📁 Repository Structure

```
NUZANTARA-RAILWAY/
├── apps/
│   ├── backend-ts/              # TS Backend (Root Directory for Railway)
│   │   ├── railway.toml         # Railway config
│   │   ├── package.json
│   │   └── src/
│   └── backend-rag/
│       └── backend/             # RAG Backend (Root Directory for Railway)
│           ├── railway.toml     # Railway config
│           ├── Dockerfile
│           ├── requirements.txt
│           └── app/
└── railway.toml                 # Documentation only (not used)
```

---

## ⚙️ Railway Configuration

### Root Directories (Set in Railway Dashboard)

**TS-BACKEND**:
- Root Directory: `apps/backend-ts`
- Build Config: `apps/backend-ts/railway.toml`
- Auto-deploy: ✅ Enabled (main branch)

**RAG BACKEND**:
- Root Directory: `apps/backend-rag/backend`
- Build Config: `apps/backend-rag/backend/railway.toml`
- Auto-deploy: ✅ Enabled (main branch)

### Health Check Configuration

Both services are configured with health checks in their `railway.toml`:

```toml
[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 30  # TS Backend
healthcheckTimeout = 600 # RAG Backend (ChromaDB download takes time)
```

---

## ✅ Deployment Checklist

Before pushing to main:

- [ ] Code changes tested locally
- [ ] Environment variables set (if new vars added)
- [ ] Health endpoint working (`/health`)
- [ ] No breaking changes to API contracts
- [ ] Tests passing (TS Backend has Jest tests)

After pushing:

- [ ] Monitor deployment: `railway deployment list`
- [ ] Check health: `curl https://<service-url>/health`
- [ ] Test critical endpoints
- [ ] Check logs for errors: `railway logs`

---

## 🚨 Important Notes

### DO NOT Use GitHub Actions for Deployment

❌ **Removed** (2025-10-19):
- `.github/workflows/deploy-backend.yml`
- `.github/workflows/deploy-rag.yml`

**Reason**: The `railwayapp/railway-deploy` action doesn't exist. Railway's native auto-deploy is simpler and more reliable.

### DO Use Railway Auto-Deploy

✅ **Current method** (recommended):
- Push to main → Railway auto-deploys
- No GitHub Actions needed
- Faster, simpler, more reliable

---

## 📖 Additional Resources

- **Railway Dashboard**: https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9
- **Railway Docs**: https://docs.railway.app/
- **Project Status**: See `docs/railway/` (archived) or use `railway status`

---

## 💡 Pro Tips

1. **Parallel Deploys**: Changes to both backends in one commit will trigger parallel deploys
2. **Selective Deploy**: Only changed services deploy (Railway detects changes in root directories)
3. **Quick Health Check**: Add to aliases:
   ```bash
   alias check-ts='curl https://ts-backend-production-568d.up.railway.app/health'
   alias check-rag='curl https://scintillating-kindness-production-47e3.up.railway.app/health'
   ```

---

**Last Updated**: 2025-10-19
**Deploy Method**: Railway GitHub Auto-Deploy
**Status**: ✅ Fully Operational
