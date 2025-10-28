# 🚂 ZANTARA Router-Only - Railway Deployment Guide

**Status**: Ready for deployment
**Date**: October 29, 2025

---

## 📋 Prerequisites

✅ Git commits pushed to GitHub (DONE)
✅ Railway CLI installed (DONE)
✅ Orchestrator Docker files created (DONE)
⏳ Railway login required (MANUAL STEP)
⏳ FLAN Router exposure (MANUAL STEP)

---

## 🏗️ Architecture

**Railway will host:**
- ✅ **Orchestrator** (Node.js Express) - Public URL
- ✅ **Haiku API** - Connected via Anthropic API

**Local/VM will host:**
- 🖥️ **FLAN Router** (Python FastAPI) - Exposed via ngrok or VM

**Why?** Railway free tier cannot run FLAN-T5 model (300MB + PyTorch = too heavy)

---

## 🚀 Deployment Steps

### Step 1: Expose FLAN Router (Choose ONE option)

#### Option A: Use ngrok (Quick, for testing)

```bash
# Install ngrok if needed
brew install ngrok

# Authenticate (get token from https://dashboard.ngrok.com/)
ngrok authtoken YOUR_NGROK_TOKEN

# Expose FLAN router
ngrok http 8000

# You'll get: https://abc123.ngrok.io
# Save this URL for Step 3
```

#### Option B: Deploy Router on VM (Production)

```bash
# SSH to your VM
ssh your-vm

# Clone repo
git clone https://github.com/Balizero1987/nuzantara.git
cd nuzantara

# Deploy router
./scripts/deploy-router-only.sh

# Ensure port 8000 is open in firewall
# Your router URL: http://your-vm-ip:8000
```

---

### Step 2: Login to Railway

```bash
cd ~/Desktop/NUZANTARA-RAILWAY

# Login (will open browser)
railway login

# Link to existing project or create new
railway link  # If you have existing project
# OR
railway init  # To create new project
```

---

### Step 3: Create New Service for Orchestrator

```bash
# Go to orchestrator directory
cd apps/orchestrator

# Create new service in Railway
railway service create orchestrator

# Link this directory to the service
railway service connect orchestrator
```

---

### Step 4: Configure Environment Variables

```bash
# Set ANTHROPIC_API_KEY (use your actual key)
railway variables set ANTHROPIC_API_KEY="sk-ant-api03-YOUR_KEY_HERE"

# Set FLAN_ROUTER_URL (use your ngrok URL or VM IP from Step 1)
railway variables set FLAN_ROUTER_URL="https://your-ngrok-id.ngrok.io"
# OR
railway variables set FLAN_ROUTER_URL="http://your-vm-ip:8000"

# Optional: Set backend URLs if needed
railway variables set TS_BACKEND_URL="http://localhost:8080"
railway variables set PYTHON_BACKEND_URL="http://localhost:8001"
```

**Verify variables:**
```bash
railway variables list
```

---

### Step 5: Deploy to Railway

```bash
# Still in apps/orchestrator directory
railway up

# This will:
# - Build Docker image
# - Push to Railway
# - Deploy the service
# - Generate public URL
```

**Expected output:**
```
🚝 Building...
✅ Build successful
🚀 Deploying...
✅ Deployment successful
🌐 Service URL: https://orchestrator-production-xyz.up.railway.app
```

---

### Step 6: Verify Deployment

```bash
# Get your Railway URL
railway status

# Test health endpoint
curl https://your-orchestrator-url.railway.app/health

# Should return:
# {"status":"healthy","checks":{"orchestrator":"healthy","flanRouter":"healthy","haiku":"configured"}}
```

**Test query endpoint:**
```bash
curl -X POST https://your-orchestrator-url.railway.app/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the price of KITAS?"}'
```

---

## 🔧 Troubleshooting

### Issue 1: "FLAN router not reachable"

**Symptoms:**
```json
{"status":"degraded","checks":{"flanRouter":"unhealthy"}}
```

**Solutions:**
1. Check ngrok is still running: `curl http://localhost:4040/api/tunnels`
2. Verify FLAN_ROUTER_URL is correct: `railway variables list`
3. Test router directly: `curl https://your-ngrok-url/health`
4. Update variable if needed: `railway variables set FLAN_ROUTER_URL="new-url"`

---

### Issue 2: "Anthropic API error"

**Symptoms:**
```
Error: Request failed with status code 401
```

**Solution:**
```bash
# Verify API key is set
railway variables list | grep ANTHROPIC

# Update if needed
railway variables set ANTHROPIC_API_KEY="your-key"

# Redeploy
railway up
```

---

### Issue 3: "Build failed"

**Symptoms:**
```
❌ Build failed: Cannot find module
```

**Solutions:**
```bash
# Ensure you're in correct directory
cd apps/orchestrator

# Check Dockerfile exists
ls -la Dockerfile

# Try manual build locally first
docker build -t orchestrator .
docker run -p 3000:3000 orchestrator

# If works locally, redeploy to Railway
railway up
```

---

## 📊 Monitoring

### Railway Dashboard
- Visit: https://railway.app/dashboard
- Select your project
- View: Metrics, Logs, Deployments

### Logs
```bash
# Real-time logs
railway logs

# Follow logs
railway logs -f
```

### Metrics
```bash
# Get public URL
railway status

# Check metrics endpoint
curl https://your-url.railway.app/api/metrics
```

---

## 🔄 Updates & Redeployment

When you make changes:

```bash
# 1. Commit changes
git add .
git commit -m "Update: description"
git push origin main

# 2. Redeploy to Railway
cd apps/orchestrator
railway up

# Railway will:
# - Pull latest code from GitHub
# - Rebuild Docker image
# - Deploy new version
# - Zero downtime deployment
```

---

## 💰 Cost Estimation

**Railway Free Tier:**
- $5 credit/month
- ~500 hours runtime
- Orchestrator: Small Node.js app (~0.5 vCPU, 512MB RAM)
- **Estimated cost**: $2-3/month (within free tier)

**Additional costs:**
- Anthropic API: $0.25 per 1M input tokens, $1.25 per 1M output tokens
- ngrok: Free for 1 tunnel, $8/month for persistent URL
- VM for FLAN router: $5-10/month (DigitalOcean, Hetzner)

---

## 🎯 Production Checklist

Before going to production:

- [ ] FLAN router on persistent VM (not ngrok)
- [ ] Custom domain configured
- [ ] Environment variables verified
- [ ] Health checks passing
- [ ] Monitoring/alerting configured
- [ ] Error tracking (Sentry) integrated
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] SSL/HTTPS enforced
- [ ] Backup strategy for logs

---

## 📝 Quick Commands Reference

```bash
# Login
railway login

# Create service
railway service create orchestrator

# Set variables
railway variables set KEY="value"

# Deploy
railway up

# View logs
railway logs -f

# Get URL
railway status

# Open dashboard
railway open

# Rollback
railway rollback
```

---

## 🆘 Support

**Railway Issues:**
- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app

**ZANTARA Issues:**
- Check logs: `railway logs`
- Check router: `curl https://your-ngrok-url/health`
- Check metrics: `curl https://your-railway-url/api/metrics`

---

## ✅ Post-Deployment Verification

After deployment, verify:

1. **Health Check**: `curl https://your-url/health`
2. **Router Connection**: Check logs for "flanRouter: healthy"
3. **Query Test**: Send test query and verify response
4. **Metrics**: Check `/api/metrics` for stats
5. **Performance**: Latency should be <2000ms total

**Expected Results:**
- ✅ Status: healthy
- ✅ Router latency: 100-200ms
- ✅ Haiku latency: 1000-2000ms
- ✅ Success rate: >90%

---

**Ready to deploy!** Follow the steps above. 🚀

Questions? Check troubleshooting section or Railway docs.
