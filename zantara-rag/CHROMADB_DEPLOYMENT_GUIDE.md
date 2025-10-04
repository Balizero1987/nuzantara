# ChromaDB Cloud Run Deployment Guide

**Status**: ✅ OPERATIONAL (2025-10-02)
**Last Deploy**: v7-chroma-1.1.0 (revision: zantara-rag-backend-00019-6w8)
**Endpoint**: https://zantara-rag-backend-1064094238013.europe-west1.run.app

---

## 🎯 Quick Status Check

```bash
curl https://zantara-rag-backend-1064094238013.europe-west1.run.app/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "chromadb": true,     // ✅ Must be true
  "anthropic": true,
  "version": "2.0.0-cloud"
}
```

---

## 🚨 Critical Issue Resolved: ChromaDB Version Mismatch

### Problem (2025-10-01)
- **Error**: `KeyError: '_type'` during ChromaDB initialization
- **Root Cause**: ChromaDB version incompatibility
  - Local DB created with: **chromadb==1.1.0** (new schema with `_type` field)
  - Docker image using: **chromadb==0.5.15** (old schema without `_type`)
  - Version 0.5.15 couldn't read 1.1.0 database format

### Solution
**Upgraded requirements.txt from chromadb 0.5.15 → 1.1.0**

⚠️ **IMPORTANT FOR FUTURE DEVELOPERS**:
- **ALWAYS match ChromaDB versions** between local and production
- If you regenerate ChromaDB locally, check your installed version:
  ```bash
  pip3 list | grep chromadb
  ```
- Update `requirements.txt` to match **before** uploading to GCS

---

## 📦 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Cloud Run Instance                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 1. Startup: Download ChromaDB from GCS (311 MB, ~10s) │ │
│  │    gs://nuzantara-chromadb-2025/chroma_db/            │ │
│  │    ↓                                                   │ │
│  │ 2. Extract to /tmp/chroma_db                          │ │
│  │    ↓                                                   │ │
│  │ 3. Initialize ChromaDBClient(persist_directory=...)  │ │
│  │    ↓                                                   │ │
│  │ 4. Ready: 12,907 embeddings from 214 books           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Key Files & Configuration

### 1. Requirements (Split for Better Caching)

**requirements-base.txt** (Fast layer ~15s):
```txt
fastapi==0.115.0
uvicorn[standard]==0.32.0
pydantic==2.9.2
anthropic==0.39.0
google-cloud-storage==2.18.2
```

**requirements-ml.txt** (Heavy layer ~330s):
```txt
chromadb==1.1.0              # ⚠️ MUST MATCH LOCAL VERSION
sentence-transformers==3.2.1
```

### 2. Dockerfile (Multi-layer Build)

```dockerfile
# Layer 1: Base dependencies (fast)
COPY requirements-base.txt .
RUN pip install --no-cache-dir -r requirements-base.txt

# Layer 2: ML dependencies (heavy - cached unless changed)
COPY requirements-ml.txt .
RUN pip install --no-cache-dir -r requirements-ml.txt

# Pre-download sentence-transformers model (87MB)
RUN python3 -c "from sentence_transformers import SentenceTransformer; \
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2'); \
    print(f'✅ Model pre-cached: {model.get_sentence_embedding_dimension()} dimensions')"
```

### 3. Environment Variables

```bash
CHROMA_DB_PATH=/tmp/chroma_db        # Set by main_cloud.py after GCS download
ANTHROPIC_API_KEY=<secret>           # From Secret Manager
```

---

## 🚀 Deployment Steps

### 1. Local ChromaDB Update (If Needed)

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA/zantara-rag

# Check local ChromaDB version
pip3 list | grep chromadb
# Output: chromadb 1.1.0

# Regenerate embeddings (if needed)
python3 scripts/generate_embeddings.py

# Verify local DB works
cd backend
python3 << EOF
from core.vector_db import ChromaDBClient
client = ChromaDBClient(persist_directory="../data/chroma_db")
stats = client.get_collection_stats()
print(f"✅ {stats['total_documents']} embeddings")
EOF
```

### 2. Upload to GCS

```bash
# Sync local ChromaDB to Cloud Storage
gsutil -m rsync -r -d \
  /Users/antonellosiano/Desktop/NUZANTARA/zantara-rag/data/chroma_db \
  gs://nuzantara-chromadb-2025/chroma_db/

# Verify upload
gsutil ls -lh gs://nuzantara-chromadb-2025/chroma_db/
# Expected: ~290-310 MB (chroma.sqlite3 + UUID directory)
```

### 3. Update requirements.txt (CRITICAL!)

```bash
cd backend

# Check local ChromaDB version
pip3 list | grep chromadb

# Update requirements-ml.txt to match
echo "chromadb==<YOUR_VERSION>" > requirements-ml.txt
echo "sentence-transformers==3.2.1" >> requirements-ml.txt
```

### 4. Build & Push Docker Image

```bash
# Build for linux/amd64 (Cloud Run platform)
docker buildx build \
  --platform linux/amd64 \
  --load \
  -t gcr.io/involuted-box-469105-r0/zantara-rag-backend:v8-latest \
  .

# Push to GCR
docker push gcr.io/involuted-box-469105-r0/zantara-rag-backend:v8-latest
```

### 5. Deploy to Cloud Run

```bash
gcloud run deploy zantara-rag-backend \
  --image gcr.io/involuted-box-469105-r0/zantara-rag-backend:v8-latest \
  --region europe-west1 \
  --port 8000 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars CHROMA_DB_PATH=/tmp/chroma_db \
  --set-secrets ANTHROPIC_API_KEY=CLAUDE_API_KEY:latest
```

### 6. Verify Deployment

```bash
# Check health
curl https://zantara-rag-backend-1064094238013.europe-west1.run.app/health

# Test RAG query
curl -X POST \
  https://zantara-rag-backend-1064094238013.europe-west1.run.app/bali-zero/chat \
  -H 'Content-Type: application/json' \
  -d '{"query":"What is KITAS?"}'

# Check logs
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=zantara-rag-backend" \
  --limit 20 \
  --format json
```

---

## 🐛 Troubleshooting

### Issue: `"chromadb": false` in /health

**Symptoms**:
```json
{"chromadb": false, "anthropic": true}
```

**Debug Steps**:

1. **Check logs for error**:
```bash
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=zantara-rag-backend AND severity>=ERROR" \
  --limit 10
```

2. **Common Errors & Solutions**:

| Error | Cause | Solution |
|-------|-------|----------|
| `KeyError: '_type'` | ChromaDB version mismatch | Update requirements-ml.txt to match local version |
| `AttributeError: 'AnthropicClient' object has no attribute 'generate'` | Wrong method name | Use `.chat_async()` instead of `.generate()` |
| `ImportError: attempted relative import beyond top-level package` | Import path issue | Add `extra = "ignore"` to config.py |
| `ValidationError: Extra inputs are not permitted` | Pydantic strict mode | Add `extra = "ignore"` to Config class |
| GCS download timeout | Network issue | Increase Cloud Run timeout to 300s |

3. **Verify ChromaDB version in container**:
```bash
# Get running revision
gcloud run revisions list --service zantara-rag-backend --region europe-west1 --limit 1

# Check container logs for version
gcloud logging read "textPayload:chromadb" --limit 5
```

### Issue: Slow Cold Starts (>60s)

**Solutions**:
- ✅ Pre-cache sentence-transformers model in Dockerfile (saves 15-20s)
- ✅ Use layered requirements (base + ML) for Docker cache
- 🔄 Consider Cloud Run min-instances=1 (costs ~$50/month)
- 🔄 Implement persistent disk instead of GCS download

---

## 📊 Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| ChromaDB Size | 290 MB | 12,907 embeddings from 214 books |
| Docker Image Size | ~2 GB | Includes PyTorch, transformers, chromadb |
| Cold Start Time | ~30s | Download 311MB from GCS + init |
| Warm Start Time | <1s | Container already running |
| Query Response Time | 2-3s | RAG search (50-200ms) + LLM (1.5-2.5s) |
| Memory Usage | 1.2-1.5 GB | Peak during query processing |

---

## 🔐 Security Notes

- ChromaDB in GCS bucket: `nuzantara-chromadb-2025` (private)
- Cloud Run service account: `1064094238013-compute@developer.gserviceaccount.com`
- Anthropic API key: Stored in Secret Manager (`CLAUDE_API_KEY`)
- Public endpoints: `/health`, `/search`, `/bali-zero/chat` (no auth yet)

---

## 📝 Change Log

### 2025-10-02 - v7-chroma-1.1.0 (CURRENT)
- ✅ Fixed ChromaDB version mismatch (0.5.15 → 1.1.0)
- ✅ Split requirements into base + ML layers
- ✅ Added full traceback logging for debugging
- ✅ Deployed with 2GB RAM, 2 CPU
- ✅ Status: chromadb=true, anthropic=true

### 2025-10-01 - v6-debug
- 🐛 Added traceback logging to debug `_type` error
- 🐛 Identified ChromaDB version mismatch issue

### 2025-10-01 - v5-chromadb-working
- 🐛 Attempted fix with config.py `extra = "ignore"`
- 🐛 Still failed due to version mismatch

---

## 🎓 Lessons Learned

1. **Version Pinning is Critical**: Always match ChromaDB versions exactly between local and production
2. **Layer Docker Builds**: Split heavy ML dependencies into separate layer for better caching
3. **Log Everything**: Added full traceback logging saved hours of debugging
4. **Test Locally First**: Reproduce production environment locally before deploying
5. **GCS is Slow**: 311MB download takes ~10s on cold start - consider persistent disk for production

---

## 📚 Related Documentation

- ChromaDB Docs: https://docs.trychroma.com/
- Cloud Run Best Practices: https://cloud.google.com/run/docs/tips
- Sentence Transformers: https://www.sbert.net/
- Anthropic API: https://docs.anthropic.com/

---

**Last Updated**: 2025-10-02 00:14 UTC
**Maintained By**: Claude Code (Sonnet 4.5)
**Contact**: Check `/Users/antonellosiano/.claude/diaries/` for session logs
