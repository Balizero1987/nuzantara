# ⚠️ CRITICAL: ChromaDB Version Compatibility

**Last Updated**: 2025-10-02

## 🚨 Before Deploying

**ALWAYS check ChromaDB version compatibility!**

### Quick Check

```bash
# 1. Check local ChromaDB version
pip3 list | grep chromadb

# 2. Check requirements.txt version
grep chromadb requirements-ml.txt

# 3. They MUST MATCH!
```

### Why This Matters

**2025-10-01 Incident**: Deployment failed with `KeyError: '_type'` because:
- Local DB: chromadb **1.1.0** (new schema with `_type` field)
- Docker: chromadb **0.5.15** (old schema, can't read new format)
- Result: 8+ hours debugging 🔥

### The Rule

```
IF you regenerate ChromaDB locally:
  1. Check local version: pip3 list | grep chromadb
  2. Update requirements-ml.txt to EXACT same version
  3. Rebuild Docker image
  4. Deploy
```

## 📂 File Structure

```
backend/
├── requirements-base.txt    # Fast deps (FastAPI, etc.)
├── requirements-ml.txt      # Heavy deps (chromadb, transformers)
├── Dockerfile               # Multi-layer build (base + ML)
└── README_CHROMADB.md       # This file
```

## 🔄 Update ChromaDB Workflow

### Scenario 1: Update Embeddings (Keep Same Version)

```bash
# 1. Regenerate embeddings locally
cd /Users/antonellosiano/Desktop/NUZANTARA/zantara-rag
python3 scripts/generate_embeddings.py

# 2. Upload to GCS
gsutil -m rsync -r -d data/chroma_db gs://nuzantara-chromadb-2025/chroma_db/

# 3. Redeploy (no Docker rebuild needed)
gcloud run deploy zantara-rag-backend \
  --image gcr.io/involuted-box-469105-r0/zantara-rag-backend:v7-chroma-1.1.0 \
  --region europe-west1
```

### Scenario 2: Upgrade ChromaDB Version

```bash
# 1. Upgrade local version
pip3 install --upgrade chromadb

# 2. Check new version
pip3 list | grep chromadb
# Example output: chromadb 1.2.0

# 3. Update requirements-ml.txt
cd backend
echo "chromadb==1.2.0" > requirements-ml.txt
echo "sentence-transformers==3.2.1" >> requirements-ml.txt

# 4. Rebuild Docker
docker buildx build --platform linux/amd64 --load \
  -t gcr.io/involuted-box-469105-r0/zantara-rag-backend:v8-chroma-1.2.0 .

# 5. Push
docker push gcr.io/involuted-box-469105-r0/zantara-rag-backend:v8-chroma-1.2.0

# 6. Deploy
gcloud run deploy zantara-rag-backend \
  --image gcr.io/involuted-box-469105-r0/zantara-rag-backend:v8-chroma-1.2.0 \
  --region europe-west1
```

## 🐛 Troubleshooting

### Health Check Shows `"chromadb": false`

```bash
# 1. Check logs for error
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=zantara-rag-backend AND severity>=ERROR" \
  --limit 10

# 2. Look for these errors:
#    - KeyError: '_type'           → Version mismatch! Update requirements-ml.txt
#    - ImportError                  → Missing dependency
#    - Permission denied            → GCS bucket access issue
```

### Build Takes Too Long (>10 minutes)

```bash
# ChromaDB 1.1.0 is heavy (~330s install)
# Solutions:
# - Use Docker layer caching (split requirements-base + requirements-ml)
# - Don't change requirements-ml.txt unless necessary
# - Cached layer = instant rebuild
```

## 📊 Current Status

- **Production Version**: chromadb==1.1.0
- **Docker Image**: gcr.io/involuted-box-469105-r0/zantara-rag-backend:v7-chroma-1.1.0
- **Revision**: zantara-rag-backend-00019-6w8
- **Embeddings**: 12,907 from 214 books
- **Status**: ✅ OPERATIONAL

## 📚 Full Guide

See `/Users/antonellosiano/Desktop/NUZANTARA/zantara-rag/CHROMADB_DEPLOYMENT_GUIDE.md` for:
- Complete deployment steps
- Architecture overview
- Performance metrics
- Security notes
- Change log

---

**Remember**: Version mismatch = deployment failure. Always check before deploying! 🚀
