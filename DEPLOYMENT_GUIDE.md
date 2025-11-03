# 🚀 NUZANTARA-FLY Deployment Guide

Quick reference for serving locally and deploying to production.

---

## 📋 Table of Contents

1. [Local Development (Serve Locally)](#local-development-serve-locally)
2. [Fly.io Production Deployment](#flyio-production-deployment)
3. [Quick Commands](#quick-commands)
4. [Troubleshooting](#troubleshooting)

---

## 🏠 Local Development (Serve Locally)

### Start TypeScript Backend

```bash
# From project root
npm run dev
# OR
make dev
```

**URL:** http://localhost:8080  
**Health Check:** http://localhost:8080/health

### Start RAG Backend (Python)

```bash
# From project root
make dev-rag
# OR
cd apps/backend-rag/backend
uvicorn app.main_integrated:app --port 8000 --reload
```

**URL:** http://localhost:8000  
**Health Check:** http://localhost:8000/health

### Start Webapp (Frontend)

```bash
# Option 1: Python HTTP Server
cd apps/webapp
python3 -m http.server 8888

# Option 2: Using serve
cd apps/webapp
npx serve .
```

**URL:** http://localhost:8888

### Start Dashboard

```bash
cd apps/dashboard
npm start
# OR
python3 -m http.server 8001
```

**URL:** http://localhost:8001

### Start All Services (Recommended)

```bash
# Terminal 1: TypeScript Backend
npm run dev

# Terminal 2: RAG Backend
make dev-rag

# Terminal 3: Webapp
cd apps/webapp && python3 -m http.server 8888
```

---

## ☁️ Fly.io Production Deployment

### Prerequisites

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   # OR on macOS
   brew install flyctl
   ```

2. **Login to Fly.io:**
   ```bash
   fly auth login
   ```

3. **Verify Apps:**
   ```bash
   fly apps list
   # Should show: nuzantara-backend, nuzantara-rag
   ```

### Deploy TypeScript Backend

```bash
cd apps/backend-ts
fly deploy -a nuzantara-backend
```

**Production URL:** https://nuzantara-backend.fly.dev  
**Health Check:** https://nuzantara-backend.fly.dev/health

### Deploy RAG Backend

```bash
cd apps/backend-rag
fly deploy -a nuzantara-rag
```

**Production URL:** https://nuzantara-rag.fly.dev  
**Health Check:** https://nuzantara-rag.fly.dev/health

### Deploy Both (Quick)

```bash
# From project root - run the fix-deployment script
./fix-deployment.sh

# Or manually:
cd apps/backend-rag && fly deploy -a nuzantara-rag
cd ../backend-ts && fly deploy -a nuzantara-backend
```

---

## 🔧 Configuration

### Set Secrets (Environment Variables)

#### Backend TS Secrets:
```bash
cd apps/backend-ts

# Required secrets
fly secrets set ANTHROPIC_API_KEY="your-key" -a nuzantara-backend
fly secrets set OPENAI_API_KEY="your-key" -a nuzantara-backend
fly secrets set RAG_BACKEND_URL="https://nuzantara-rag.fly.dev" -a nuzantara-backend

# Optional secrets
fly secrets set DATABASE_URL="your-db-url" -a nuzantara-backend
fly secrets set JWT_SECRET="your-secret" -a nuzantara-backend
```

#### RAG Backend Secrets:
```bash
cd apps/backend-rag

fly secrets set OPENAI_API_KEY="your-key" -a nuzantara-rag
fly secrets set CHROMA_DB_PATH="/data/chroma_db" -a nuzantara-rag
```

### Verify Secrets:
```bash
fly secrets list -a nuzantara-backend
fly secrets list -a nuzantara-rag
```

### ChromaDB Volume (RAG Backend)

```bash
# Check if volume exists
fly volumes list -a nuzantara-rag

# Create volume if missing (10GB in Singapore)
fly volumes create chroma_data --size 10 --region sin -a nuzantara-rag
```

---

## ⚡ Quick Commands

### Health Checks

```bash
# Local
npm run health-check

# Production
curl https://nuzantara-backend.fly.dev/health | jq
curl https://nuzantara-rag.fly.dev/health | jq
```

### View Logs

```bash
# Backend TS
fly logs -a nuzantara-backend

# RAG Backend
fly logs -a nuzantara-rag

# Follow logs (live)
fly logs -a nuzantara-backend --follow
```

### Check Status

```bash
# App status
fly status -a nuzantara-backend
fly status -a nuzantara-rag

# List all apps
fly apps list

# Scale instances
fly scale count 2 -a nuzantara-backend
```

### SSH into Container

```bash
fly ssh console -a nuzantara-backend
fly ssh console -a nuzantara-rag
```

---

## 🔄 Deployment Workflow

### Standard Deployment Process

1. **Test Locally:**
   ```bash
   npm run dev
   npm run health-check
   ```

2. **Build & Type Check:**
   ```bash
   npm run build
   npm run typecheck
   ```

3. **Run Tests:**
   ```bash
   npm test
   ```

4. **Deploy to Fly.io:**
   ```bash
   cd apps/backend-ts
   fly deploy -a nuzantara-backend
   ```

5. **Verify Deployment:**
   ```bash
   curl https://nuzantara-backend.fly.dev/health | jq
   fly logs -a nuzantara-backend --follow
   ```

### Zero-Downtime Deployment

Fly.io uses **rolling deployments** by default (configured in `fly.toml`):

```toml
[deploy]
  strategy = "rolling"
  max_unavailable = 0  # Always have at least one instance running
```

This ensures zero downtime during deployments.

### Rollback

```bash
# List releases
fly releases -a nuzantara-backend

# Rollback to previous release
fly releases rollback -a nuzantara-backend
```

---

## 🐛 Troubleshooting

### Deployment Fails

1. **Check logs:**
   ```bash
   fly logs -a nuzantara-backend
   ```

2. **Verify secrets:**
   ```bash
   fly secrets list -a nuzantara-backend
   ```

3. **Check build locally:**
   ```bash
   npm run build
   ```

4. **Verify Dockerfile:**
   ```bash
   docker build -t test-build -f apps/backend-ts/Dockerfile .
   ```

### Health Check Fails

1. **Check app status:**
   ```bash
   fly status -a nuzantara-backend
   ```

2. **SSH into container:**
   ```bash
   fly ssh console -a nuzantara-backend
   curl localhost:8080/health
   ```

3. **Check environment variables:**
   ```bash
   fly ssh console -a nuzantara-backend
   env | grep -i port
   ```

### CORS Issues

Ensure CORS is configured in both backends:

**Backend TS:** Check `apps/backend-ts/src/server.ts`  
**RAG Backend:** Check `apps/backend-rag/backend/app/main_cloud.py`

Add your frontend URL to allowed origins.

### Connection Issues

1. **Verify RAG backend is accessible:**
   ```bash
   curl https://nuzantara-rag.fly.dev/health
   ```

2. **Update RAG_BACKEND_URL secret:**
   ```bash
   fly secrets set RAG_BACKEND_URL=https://nuzantara-rag.fly.dev -a nuzantara-backend
   ```

3. **Check network in Fly.io:**
   ```bash
   fly status -a nuzantara-backend
   # Look for network configuration
   ```

### Memory/CPU Issues

```bash
# Check resource usage
fly status -a nuzantara-backend

# Scale up resources
fly scale vm shared-cpu-2x -a nuzantara-backend
fly scale memory 2048 -a nuzantara-backend

# Scale instances
fly scale count 3 -a nuzantara-backend
```

---

## 📊 Monitoring

### View Metrics

```bash
# Real-time metrics
fly dashboard -a nuzantara-backend

# Metrics endpoint
curl https://nuzantara-backend.fly.dev/metrics
```

### Alerting

Configure alerts in `monitoring/prometheus/alerts.yml` or use Fly.io's built-in monitoring.

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] All secrets are set (API keys, database URLs)
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Health checks are working
- [ ] HTTPS is enforced (`force_https = true` in fly.toml)
- [ ] Authentication/Authorization is working
- [ ] Database connections are secured
- [ ] Logs don't expose sensitive data

---

## 📝 Deployment Checklist

### Pre-Deployment

- [ ] Code is tested locally
- [ ] All tests pass (`npm test`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] Secrets are configured
- [ ] Health checks work locally

### During Deployment

- [ ] Monitor deployment logs
- [ ] Verify health checks pass
- [ ] Check error rates in logs
- [ ] Test critical endpoints

### Post-Deployment

- [ ] Verify production health endpoint
- [ ] Test key functionality
- [ ] Monitor logs for errors
- [ ] Check metrics/dashboard
- [ ] Update documentation if needed

---

## 🚀 Quick Start Examples

### Full Local Development Setup

```bash
# Terminal 1: Backend TS
npm run dev

# Terminal 2: RAG Backend
make dev-rag

# Terminal 3: Webapp
cd apps/webapp && python3 -m http.server 8888
```

### Quick Production Deploy

```bash
# Deploy both backends
cd apps/backend-rag && fly deploy -a nuzantara-rag
cd ../backend-ts && fly deploy -a nuzantara-backend

# Verify
curl https://nuzantara-backend.fly.dev/health
curl https://nuzantara-rag.fly.dev/health
```

### Debug Production Issue

```bash
# View logs
fly logs -a nuzantara-backend --follow

# SSH into container
fly ssh console -a nuzantara-backend

# Check health
curl localhost:8080/health

# Check environment
env | grep -i api
```

---

## 📚 Additional Resources

- **Fly.io Docs:** https://fly.io/docs/
- **Project Structure:** See `INFRASTRUCTURE_OVERVIEW.md`
- **Bug Fix Templates:** See `TEMPLATES_BUG_FIXES_AND_OPTIMIZATION.md`
- **Fix Deployment Script:** `./fix-deployment.sh`
- **Makefile Commands:** `make help`

---

## 🔗 Production URLs

- **Backend TS:** https://nuzantara-backend.fly.dev
- **RAG Backend:** https://nuzantara-rag.fly.dev
- **Webapp:** https://zantara.balizero.com (GitHub Pages)
- **Dashboard:** (if deployed separately)

---

**Last Updated:** 2025-01-02  
**Maintained By:** NUZANTARA-FLY Development Team



