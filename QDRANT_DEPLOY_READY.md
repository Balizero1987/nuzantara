# 🚀 Qdrant Deployment - READY TO GO

## Quick Deploy Checklist

Quando torni da Grafana setup, faremo questi step:

### Step 1: Deploy Qdrant Service on Fly.io (2 min)
```bash
# Via Fly.io dashboard:
# 1. New Service → Empty Service
# 2. Name: qdrant
# 3. Root directory: apps/qdrant-service
# 4. Auto-deploy from GitHub
```

### Step 2: Add Fly.io Volume (1 min)
```bash
# In Fly.io:
# qdrant service → Settings → Volumes
# Add Volume:
#   - Mount: /qdrant/storage
#   - Size: 10GB
```

### Step 3: Set Environment Variables (1 min)
```bash
# Fly.io → qdrant service → Variables
# (none needed, Dockerfile has defaults)
```

### Step 4: Get Qdrant URL (1 min)
```bash
# Fly.io generates:
# Internal: nuzantara-qdrant.fly.dev
# Public: qdrant-production-xxx.up.railway.app
```

### Step 5: Update backend-rag (1 min)
```bash
# Fly.io → backend-rag service → Variables
# Add:
QDRANT_URL=https://nuzantara-qdrant.fly.dev
```

### Step 6: Test Migration (Dry-Run) (2 min)
```bash
cd ~/Desktop/NUZANTARA-RAILWAY/apps/backend-rag
python scripts/migrate_chromadb_to_qdrant.py --dry-run
```

### Step 7: Real Migration (5-10 min)
```bash
python scripts/migrate_chromadb_to_qdrant.py
# Migrates 14,365 documents
```

### Step 8: Verify (1 min)
```bash
curl https://nuzantara-qdrant.fly.dev/collections
# Should show 14 collections
```

---

**Total Time**: 15-20 minutes
**Risk**: Low (ChromaDB backup auto-created)

Ready when you are! 🎯
