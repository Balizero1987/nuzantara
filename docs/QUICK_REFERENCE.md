# 📇 NUZANTARA Quick Reference

> **Emergency?** Jump to [🚨 Emergency Procedures](#-emergency-procedures)
> **Quick Commands?** See [⚡ Most Common Commands](#-most-common-commands)

---

## 🔗 Important Links

| Resource | URL |
|----------|-----|
| **Production Backend** | https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app |
| **Production RAG** | https://zantara-rag-backend-himaadsxua-ew.a.run.app |
| **Web UI (GitHub Pages)** | https://balizero1987.github.io/zantara_webapp |
| **Custom Domain** | https://zantara.balizero.com ⚠️ (Pages not enabled yet) |
| **GCP Console** | https://console.cloud.google.com/run?project=involuted-box-469105-r0 |
| **Repository** | https://github.com/Balizero1987/nuzantara |

---

## ⚡ Most Common Commands

```bash
# 🏠 LOCAL DEVELOPMENT
make dev                # Start backend locally (port 8080, hot reload)
make dev-rag            # Start RAG backend locally (port 8000)
make health-check       # Check local server health

# 🚀 DEPLOYMENT
make deploy-backend     # Deploy TypeScript backend (~8 min)
make deploy-backend-quick  # Quick deploy, skip tests (~5 min)
make deploy-rag         # Deploy RAG backend via GitHub Actions (AMD64)
make deploy-full        # Deploy full stack (~15 min)

# 🧪 TESTING
make test               # Run all tests
make test-coverage      # Run tests with coverage
npm run test:handlers   # Test new handlers

# 📊 MONITORING
make health-prod        # Check production services health
make logs               # Tail backend logs (Cloud Run)
make logs-rag           # Tail RAG backend logs
make status             # Show status of all services
make metrics            # Show production metrics

# 🔧 MAINTENANCE
make clean              # Clean build artifacts
make rebuild            # Clean + rebuild
make info               # Show project information

# 🆘 HELP
make help               # Show all available commands
```

---

## 🚨 EMERGENCY PROCEDURES

### 🔴 Backend Service Down

**Symptoms**: API returning 502/503, health endpoint not responding

**Immediate Actions**:
```bash
# 1. Check service status
gcloud run services describe zantara-v520-nuzantara --region europe-west1

# 2. Check recent logs for errors
make logs | head -100

# 3. Rollback to previous revision
make rollback
# Then select: 1 (Backend API)

# Alternative: Manual rollback
gcloud run services update-traffic zantara-v520-nuzantara \
  --region europe-west1 \
  --to-revisions PREVIOUS=100
```

**Follow-up**:
1. Investigate error in logs
2. Fix issue in code
3. Test locally: `make dev` + `make health-check`
4. Deploy fix: `make deploy-backend`

---

### 🔴 RAG Backend Down / Search Not Working

**Symptoms**: `rag.query` failing, /bali.zero.chat errors

**Immediate Actions**:
```bash
# 1. Check RAG service status
curl https://zantara-rag-backend-himaadsxua-ew.a.run.app/health

# 2. Check if re-ranker issue (AMD64)
# Look for "ENABLE_RERANKER" errors in logs
make logs-rag | grep -i reranker

# 3. Disable re-ranker if causing issues
gcloud run services update zantara-rag-backend \
  --region europe-west1 \
  --set-env-vars ENABLE_RERANKER=false

# 4. OR: Rollback to previous revision
gcloud run services update-traffic zantara-rag-backend \
  --region europe-west1 \
  --to-revisions PREVIOUS=100
```

**Follow-up**:
1. Check if AMD64 build issue (re-ranker requires AMD64)
2. Rebuild via GitHub Actions: `make deploy-rag`
3. Monitor workflow: `gh run list --limit 5`

---

### 🟡 High Latency (>500ms P50)

**Symptoms**: API slow, dashboard showing high latency

**Diagnosis**:
```bash
# 1. Check metrics
make metrics

# Look for:
# - avg_latency_ms > 500
# - Cache hit rate < 70%
# - High error rate

# 2. Check Redis cache health
# (System degrades gracefully if Redis down, but slower)

# 3. Check Cloud Run CPU/Memory
gcloud run services describe zantara-v520-nuzantara \
  --region europe-west1 \
  --format="value(status.conditions)"
```

**Fixes**:
```bash
# If cache hit rate low:
# → No direct fix (Redis optional), system auto-degrades
# → Check if Firestore down (memory system fallback)

# If CPU/Memory high:
# → Increase resources
gcloud run services update zantara-v520-nuzantara \
  --region europe-west1 \
  --memory 4Gi \
  --cpu 4

# If RAG backend slow:
# → Check re-ranker latency in logs
# → Consider disabling: ENABLE_RERANKER=false
```

---

### 🟡 Build Failed (GitHub Actions)

**Symptoms**: GitHub Actions workflow failed, red X on commit

**Diagnosis**:
```bash
# 1. Check recent workflow runs
gh run list --limit 5

# 2. View failed run details
gh run view [RUN_ID]

# 3. Common issues:
# - GCP_SA_KEY secret expired/wrong
# - Docker build timeout
# - Image push failed (GCR permissions)
```

**Fixes**:
```bash
# Re-run workflow
gh run rerun [RUN_ID]

# OR: Trigger new workflow
make deploy-rag

# Check secrets are set
gh secret list

# If GCP_SA_KEY missing/wrong:
# 1. Create new service account key
gcloud iam service-accounts keys create /tmp/sa-key.json \
  --iam-account=cloud-run-deployer@involuted-box-469105-r0.iam.gserviceaccount.com

# 2. Update GitHub secret
gh secret set GCP_SA_KEY --body "$(cat /tmp/sa-key.json | base64)"

# 3. Delete local key (security)
rm /tmp/sa-key.json
```

---

### 🟡 Memory System Not Persisting

**Symptoms**: User memory lost after restart, `memory.retrieve` returns empty

**Diagnosis**:
```bash
# 1. Check if Firestore connection working
# Look for "Firestore unavailable, using in-memory fallback" in logs
make logs | grep -i firestore

# 2. Check Firestore IAM permissions
gcloud projects get-iam-policy involuted-box-469105-r0 \
  --flatten="bindings[].members" \
  --filter="bindings.members:cloud-run-deployer@*"

# Should show: roles/datastore.user
```

**Fixes**:
```bash
# If IAM permissions missing:
gcloud projects add-iam-policy-binding involuted-box-469105-r0 \
  --member="serviceAccount:cloud-run-deployer@involuted-box-469105-r0.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

# Re-deploy backend
make deploy-backend
```

---

### 🟠 WhatsApp/Instagram Webhooks Not Working

**Symptoms**: Webhook verification failed, messages not received

**Local Development Fix**:
```bash
# 1. Setup ngrok tunnel
./scripts/setup/ngrok-setup.sh

# 2. Copy ngrok URL (e.g., https://abc123.ngrok.io)

# 3. Update webhook URL on Meta Developer Portal:
# WhatsApp: https://abc123.ngrok.io/whatsapp/webhook
# Instagram: https://abc123.ngrok.io/instagram/webhook

# 4. Test webhook
curl -X GET "https://abc123.ngrok.io/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"
# Should return: test
```

**Production Fix**:
```bash
# Webhook URLs (update on Meta portal):
# WhatsApp: https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/whatsapp/webhook
# Instagram: https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/instagram/webhook

# Verify tokens set in Cloud Run env vars:
gcloud run services describe zantara-v520-nuzantara \
  --region europe-west1 \
  --format="value(spec.template.spec.containers[0].env)"
```

---

### 🟠 WebSocket Connections Failing

**Symptoms**: WebSocket not connecting, dashboard not updating

**Diagnosis**:
```bash
# 1. Check if WebSocket server initialized
make logs | grep -i websocket
# Look for: "✅ WebSocket server initialized on /ws"

# 2. Test WebSocket connection locally
# (requires wscat: npm install -g wscat)
wscat -c ws://localhost:8080/ws

# 3. Check WebSocket stats
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -d '{"key": "websocket.stats", "params": {}}'
```

**Fixes**:
```bash
# If ws npm package missing:
npm install ws @types/ws

# Rebuild
make build

# Re-deploy
make deploy-backend
```

---

### ⚫ Firestore / Database Errors

**Symptoms**: 500 errors on memory/user handlers, Firestore connection timeouts

**Diagnosis**:
```bash
# 1. Check Firestore status
# (No direct status check, use Cloud Console)
# https://console.cloud.google.com/firestore?project=involuted-box-469105-r0

# 2. Check service account permissions
gcloud projects get-iam-policy involuted-box-469105-r0 \
  --flatten="bindings[].members" \
  --filter="bindings.role:roles/datastore.user"
```

**Fixes**:
```bash
# System auto-falls back to in-memory Map (graceful degradation)
# Data will be lost on restart, but service continues

# To restore Firestore persistence:
# 1. Grant IAM permissions (if missing)
gcloud projects add-iam-policy-binding involuted-box-469105-r0 \
  --member="serviceAccount:cloud-run-deployer@involuted-box-469105-r0.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

# 2. Re-deploy
make deploy-backend
```

---

## 📊 Health Check Checklist

**Quick Health Check**:
```bash
make health-prod
```

**Manual Health Check**:
```bash
# 1. Backend API
curl https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/health | jq

# Expected:
# {
#   "ok": true,
#   "uptime": <seconds>,
#   "metrics": {...}
# }

# 2. RAG Backend
curl https://zantara-rag-backend-himaadsxua-ew.a.run.app/health | jq

# Expected:
# {
#   "status": "healthy",
#   "chromadb_collections": 5,
#   "reranker_enabled": true
# }

# 3. Frontend (GitHub Pages)
curl -I https://balizero1987.github.io/zantara_webapp
# Expected: HTTP/2 200

# 4. WebSocket (local only)
wscat -c ws://localhost:8080/ws
# Expected: Connected
```

---

## 🏗️ Architecture Quick View

```
Client → TypeScript Backend :8080 → RAG Backend :8000
              ↓                           ↓
         150 Handlers              FAISS + Re-ranker
              ↓                           ↓
       Firestore (Memory)        ChromaDB (Knowledge Base)
       Redis (Cache)
```

**Key Components**:
- **Backend**: 150 handlers (Google Workspace, AI, Bali Zero, ZANTARA, Memory, RAG proxy)
- **RAG**: FAISS search + Cross-encoder re-ranking (AMD64 only!)
- **Memory**: Firestore primary + In-memory fallback
- **Deploy**: GitHub Actions for RAG (AMD64), Scripts for backend

---

## 📋 Pre-Deployment Checklist

Before deploying to production:

- [ ] All tests pass: `make test`
- [ ] Local build works: `make build`
- [ ] Health check passes locally: `make health-check`
- [ ] Reviewed changes: `git diff`
- [ ] Updated version (if needed): `package.json`
- [ ] Committed changes: `git status` shows clean
- [ ] Ready to rollback: Know previous revision number

**Then deploy**:
```bash
make deploy-backend  # Full deploy (8 min)
# OR
make deploy-backend-quick  # Quick deploy (5 min, skip tests)
```

---

## 🎯 Performance Targets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Backend API** | | | |
| P50 latency | <100ms | ~50ms | ✅ |
| P99 latency | <300ms | ~250ms | ✅ |
| Uptime | >99.5% | 99.8% | ✅ |
| **RAG Backend** | | | |
| Search (cache miss) | <200ms | ~150ms | ✅ |
| Search (cache hit) | <50ms | ~20ms | ✅ |
| Uptime | >99.5% | 99.7% | ✅ |

**How to Check**:
```bash
make metrics  # Current metrics
make logs | grep "latency"  # Latency logs
```

---

## 🔐 Secrets & Environment

**Required Secrets**:
```bash
# LLM APIs
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
COHERE_API_KEY=...

# Google Cloud
FIREBASE_PROJECT_ID=involuted-box-469105-r0
GOOGLE_APPLICATION_CREDENTIALS=path/to/sa.json

# API Access
API_KEYS_INTERNAL=zantara-internal-dev-key-2025
API_KEYS_EXTERNAL=zantara-external-dev-key-2025
```

**Check Secrets**:
```bash
# Local (.env)
cat .env | grep -v "^#" | grep "="

# Cloud Run
gcloud run services describe zantara-v520-nuzantara \
  --region europe-west1 \
  --format="value(spec.template.spec.containers[0].env)"

# GitHub Actions
gh secret list
```

---

## 📚 Documentation Index

| Doc | Purpose | When to Read |
|-----|---------|--------------|
| **README.md** | Project overview | First time |
| **ARCHITECTURE.md** | System design | Understanding architecture |
| **DECISIONS.md** | ADR (why choices made) | Understanding decisions |
| **QUICK_REFERENCE.md** | This file | Quick lookup |
| **Makefile** | All commands | Finding commands |
| **scripts/README.md** | Script documentation | Using scripts |
| **.claude/PROJECT_CONTEXT.md** | Context for AI | AI session start |
| **.claude/INIT.md** | AI session protocol | Starting new AI session |

---

## 💡 Tips & Tricks

**Faster Deployments**:
```bash
# Use quick deploy when tests already passed
make deploy-backend-quick  # 5 min vs 8 min
```

**Debug Faster**:
```bash
# Tail logs with filter
make logs | grep -i error
make logs | grep "handler_not_found"
```

**Test Specific Handler**:
```bash
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -d '{"key": "memory.save", "params": {"userId": "test", "content": "test"}}'
```

**Monitor Deployment**:
```bash
# Watch logs during deployment
make logs &
make deploy-backend
```

---

## 🆘 Getting Help

1. **Check logs**: `make logs` (production) or console for local
2. **Check this file**: Emergency procedures above
3. **Check ARCHITECTURE.md**: Understand system design
4. **Check DECISIONS.md**: Understand why decisions made
5. **Check diaries**: `.claude/diaries/` for recent sessions
6. **Check GitHub Issues**: Known issues & solutions

---

**Version**: 2.0.0 (Complete rewrite with emergency procedures)
**Created**: 2025-10-04 by Claude Sonnet 4.5 (m3)
**Last Updated**: 2025-10-04
**Maintained by**: All project contributors
