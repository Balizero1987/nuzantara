# 🚀 Deployment Guide: Phase 1 + Phase 2

**Date**: 2025-10-05
**Commit**: `e0a41fb`
**Status**: ✅ Code ready, awaiting manual deployment

---

## 📦 What Needs to Be Deployed

### **1. TypeScript Backend** (ZANTARA v5.2.0)
- **Service**: `zantara-v520-nuzantara`
- **Region**: `europe-west1`
- **Changes**:
  - Episodes-firestore handlers (Phase 1)
  - Memory-vector service (Phase 2)
  - Updated router with 8 new handlers

### **2. Python RAG Backend**
- **Service**: `zantara-rag-backend`
- **Region**: `europe-west1`
- **Changes**:
  - New router: `memory_vector.py` (7 endpoints)
  - ChromaDB collection "zantara_memories"

---

## 🔧 Manual Deployment Steps

### **Option 1: GitHub Actions** (Recommended)

#### **TypeScript Backend**:
```bash
# Trigger deploy via GitHub Actions
gh workflow run deploy.yml --ref main

# OR push to main (auto-triggers deploy)
git push origin main
```

#### **Python RAG Backend**:
```bash
# Check if workflow exists
gh workflow list

# Trigger RAG deploy
gh workflow run deploy-rag.yml --ref main
```

---

### **Option 2: Direct Cloud Run Deploy**

#### **TypeScript Backend**:
```bash
# From project root
gcloud run deploy zantara-v520-nuzantara \
  --source . \
  --region=europe-west1 \
  --platform=managed \
  --allow-unauthenticated \
  --timeout=300 \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=10 \
  --min-instances=1 \
  --set-env-vars="NODE_ENV=production,RAG_BACKEND_URL=https://zantara-rag-backend-himaadsxua-ew.a.run.app"
```

**Expected Output**:
```
Service [zantara-v520-nuzantara] revision [zantara-v520-nuzantara-00031-xxx] has been deployed
Service URL: https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app
```

---

#### **Python RAG Backend**:
```bash
# From apps/backend-rag 2/
cd "apps/backend-rag 2"

gcloud run deploy zantara-rag-backend \
  --source . \
  --region=europe-west1 \
  --platform=managed \
  --allow-unauthenticated \
  --timeout=300 \
  --memory=1Gi \
  --cpu=2 \
  --max-instances=5 \
  --min-instances=1 \
  --set-env-vars="CHROMA_PERSIST_DIR=/tmp/chroma_db,OPENAI_API_KEY=${OPENAI_API_KEY},ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}"
```

**Expected Output**:
```
Service [zantara-rag-backend] revision [zantara-rag-backend-00025-xxx] has been deployed
Service URL: https://zantara-rag-backend-himaadsxua-ew.a.run.app
```

---

### **Option 3: Cloud Build**

If Cloud Build API enabled and permissions granted:

#### **TypeScript**:
```bash
gcloud builds submit \
  --config=configs/cloudbuild-m13.yaml \
  --timeout=20m \
  --project=involuted-box-469105-r0
```

#### **Python**:
```bash
gcloud builds submit \
  --config=configs/cloudbuild-rag.yaml \
  --timeout=20m \
  --project=involuted-box-469105-r0
```

---

## ✅ Post-Deployment Verification

### **1. Check Deployment Status**

```bash
# TypeScript service
gcloud run services describe zantara-v520-nuzantara \
  --region=europe-west1 \
  --format="value(status.latestReadyRevisionName,status.url)"

# Python RAG service
gcloud run services describe zantara-rag-backend \
  --region=europe-west1 \
  --format="value(status.latestReadyRevisionName,status.url)"
```

---

### **2. Test New Handlers**

#### **Test Entity Search** (Quick Wins):
```bash
curl -X POST 'https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/call' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: zantara-internal-dev-key-2025' \
  -d '{
    "key": "memory.search.entity",
    "params": {
      "entity": "zero",
      "category": "people",
      "limit": 5
    }
  }' | jq .
```

**Expected Response**:
```json
{
  "ok": true,
  "entity": "people:zero",
  "memories": [
    {
      "userId": "zero",
      "facts": ["ZANTARA Creator - creatore silenzioso del sistema"],
      "entities": ["people:zero", "projects:zantara"],
      "recencyWeight": 1.0
    }
  ],
  "count": 1
}
```

---

#### **Test Timeline Query** (Phase 1):
```bash
curl -X POST 'https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/call' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: zantara-internal-dev-key-2025' \
  -d '{
    "key": "memory.timeline.get",
    "params": {
      "userId": "zero",
      "startDate": "2025-10-01",
      "endDate": "2025-10-05",
      "limit": 10
    }
  }' | jq .
```

**Expected Response**:
```json
{
  "ok": true,
  "userId": "zero",
  "timeline": [],  // Empty initially (no events saved yet)
  "count": 0,
  "startDate": "2025-10-01T00:00:00.000Z",
  "endDate": "2025-10-05T00:00:00.000Z"
}
```

---

#### **Test Semantic Search** (Phase 2):

First, verify Python backend has memory_vector endpoints:
```bash
curl 'https://zantara-rag-backend-himaadsxua-ew.a.run.app/api/memory/health' | jq .
```

**Expected**:
```json
{
  "status": "operational",
  "service": "memory_vector",
  "collection": "zantara_memories",
  "total_memories": 0,
  "embedder_model": "all-MiniLM-L6-v2",
  "embedder_provider": "sentence-transformers",
  "dimensions": 384
}
```

Then test semantic search:
```bash
curl -X POST 'https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/call' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: zantara-internal-dev-key-2025' \
  -d '{
    "key": "memory.search.semantic",
    "params": {
      "query": "chi aiuta con KITAS?",
      "limit": 5
    }
  }' | jq .
```

**Expected** (if vectors exist):
```json
{
  "ok": true,
  "query": "chi aiuta con KITAS?",
  "results": [
    {
      "userId": "krisna",
      "content": "Specializzazione: KITAS/visa procedures specialist",
      "similarity": 0.87,
      "entities": ["people:krisna", "skills:kitas"]
    }
  ],
  "count": 1,
  "search_type": "semantic"
}
```

**Or** (if no vectors, fallback to keyword):
```json
{
  "ok": true,
  "query": "chi aiuta con KITAS?",
  "results": [...],
  "search_type": "keyword_fallback",
  "message": "Semantic search unavailable, using keyword fallback"
}
```

---

### **3. Populate Vector Database**

Once deployed, populate vectors for existing team memories:

```bash
# Save a test memory (auto-vectorizes)
curl -X POST 'https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/call' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: zantara-internal-dev-key-2025' \
  -d '{
    "key": "memory.save",
    "params": {
      "userId": "zero",
      "content": "Implemented Phase 2 vector embeddings with ChromaDB",
      "type": "achievement"
    }
  }' | jq .
```

**Check vector was stored**:
```bash
curl 'https://zantara-rag-backend-himaadsxua-ew.a.run.app/api/memory/stats' | jq .
```

**Expected**:
```json
{
  "total_memories": 1,
  "collection_name": "zantara_memories",
  "users": 1,
  "collection_size_mb": 0.001
}
```

---

## 🐛 Troubleshooting

### **Issue 1: TypeScript Deploy Fails**

**Error**: `Cannot find module './services/memory-vector.js'`

**Fix**: Ensure `npm run build` was successful before deploy
```bash
npm run build
ls -la dist/services/memory-vector.js  # Should exist
```

---

### **Issue 2: Python Backend Missing memory_vector Router**

**Error**: `404 Not Found` on `/api/memory/health`

**Fix**: Verify `main_cloud.py` includes router registration:
```python
# Should be in apps/backend-rag 2/backend/app/main_cloud.py
from app.routers.memory_vector import router as memory_vector_router
app.include_router(memory_vector_router)
```

Re-deploy Python backend.

---

### **Issue 3: Semantic Search Returns Empty**

**Cause**: ChromaDB collection "zantara_memories" not yet populated

**Fix**: Save memories to auto-populate vectors:
```bash
# Use memory.save to trigger vectorization
curl -X POST '.../call' -d '{"key":"memory.save","params":{...}}'
```

---

### **Issue 4: Cloud Build Permission Denied**

**Error**: `NOT_FOUND: Requested entity was not found`

**Fix**: Use direct Cloud Run deploy (Option 2) or enable Cloud Build API:
```bash
gcloud services enable cloudbuild.googleapis.com
```

---

## 📊 Deployment Checklist

### **Pre-Deployment**
- [x] Code committed to GitHub (`e0a41fb`)
- [x] TypeScript compiled (`npm run build`)
- [x] Python dependencies verified
- [ ] Environment variables set (API keys)

### **Deployment**
- [ ] TypeScript backend deployed
- [ ] Python RAG backend deployed
- [ ] Services accessible (200 OK)

### **Verification**
- [ ] `memory.search.entity` works
- [ ] `memory.timeline.get` works (returns empty initially)
- [ ] `/api/memory/health` returns 200
- [ ] `memory.search.semantic` works (fallback or vector)
- [ ] `memory.save` auto-vectorizes

### **Post-Deployment**
- [ ] Populate team memories (23 users)
- [ ] Test cross-language semantic search
- [ ] Benchmark query latency
- [ ] Monitor CloudWatch logs for errors

---

## 🚀 Quick Deploy Commands

**Full deployment sequence**:
```bash
# 1. TypeScript
gcloud run deploy zantara-v520-nuzantara --source . --region=europe-west1 --allow-unauthenticated

# 2. Python
cd "apps/backend-rag 2"
gcloud run deploy zantara-rag-backend --source . --region=europe-west1 --allow-unauthenticated

# 3. Verify
curl https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/health
curl https://zantara-rag-backend-himaadsxua-ew.a.run.app/api/memory/health

# 4. Test
curl -X POST 'https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/call' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: zantara-internal-dev-key-2025' \
  -d '{"key":"memory.search.entity","params":{"entity":"zero"}}'
```

---

**Current Status**: ✅ Code deployed to GitHub, awaiting Cloud Run deployment
**Next Action**: Run deployment commands above or use GitHub Actions
