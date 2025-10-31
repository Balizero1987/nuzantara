# Qdrant Vector Database Service

Production vector database for NUZANTARA, replacing ChromaDB.

## Fly.io Deployment

### Step 1: Create Service
```bash
# Via Fly.io dashboard:
# 1. New Service → Empty Service
# 2. Name: "qdrant"
# 3. Link to this directory: apps/qdrant-service
```

### Step 2: Add Volume (CRITICAL!)
```bash
# In Fly.io dashboard:
# 1. qdrant service → Settings → Volumes
# 2. Click "Add Volume"
# 3. Mount Path: /qdrant/storage
# 4. Size: 10GB (scalable later)
```

### Step 3: Deploy
```bash
railway up --service qdrant
```

### Step 4: Get Internal URL
Fly.io generates internal hostname:
```
nuzantara-qdrant.fly.dev
```

Update backend-rag environment:
```env
QDRANT_URL=https://nuzantara-qdrant.fly.dev
QDRANT_API_KEY=your-secure-key-here
```

## Access Qdrant Dashboard

Public URL (Fly.io generates):
- https://nuzantara-qdrant.fly.dev/dashboard

## Health Check

```bash
curl https://<your-qdrant-app>.fly.dev/healthz
# Response: {"status":"ok"}
```

## Collections (Post-Migration)

- `zantara_books` - Main knowledge base
- `oracle_kb` - Oracle AI knowledge  
- `cultural_context` - Indonesian context
- `crm_memory` - Conversation memory
- +10 more collections (14 total)

## Monitoring

Metrics endpoint for Grafana:
```bash
curl https://nuzantara-qdrant.fly.dev/metrics
```

## Backup Strategy

1. **Fly.io Volume Snapshots** (automatic)
2. **Qdrant API Snapshots**:
```bash
curl -X POST http://qdrant:8080/collections/{collection}/snapshots
```

## Migration

Run from backend-rag:
```bash
cd apps/backend-rag
python scripts/migrate_chromadb_to_qdrant.py
```

## Cost

- Service: $5/month (512MB RAM)
- Volume 10GB: $2/month
- **Total: $7/month**

## Rollback Plan

If issues occur, ChromaDB backup available at:
```
apps/backend-rag/data/chroma_db.backup/
```
