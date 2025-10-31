# ChromaDB → Qdrant Migration Guide

## Prerequisites

1. **Qdrant Service Deployed** on Fly.io with Volume
2. **Environment Variables** set in backend-rag:
   ```env
   QDRANT_URL=https://nuzantara-qdrant.fly.dev
   QDRANT_API_KEY=your-secure-key
   ```
3. **Python packages** installed:
   ```bash
   pip install qdrant-client chromadb
   ```

## Migration Steps

### Step 1: Dry Run (Recommended)

Test migration without making changes:
```bash
cd apps/backend-rag
python scripts/migrate_chromadb_to_qdrant.py --dry-run
```

Expected output:
```
===================================
CHROMADB → QDRANT MIGRATION
===================================

Found 14 collections to migrate:
  - zantara_books
  - oracle_kb
  - cultural_context
  - crm_memory
  - (... 10 more)

[DRY RUN] Would migrate 14,365 documents
```

### Step 2: Real Migration

Run actual migration:
```bash
python scripts/migrate_chromadb_to_qdrant.py
```

This will:
1. ✅ Create backup of ChromaDB at `./data/chroma_db.backup/`
2. ✅ Migrate all 14 collections to Qdrant
3. ✅ Verify data integrity (count check)
4. ✅ Display detailed progress and summary

Expected duration: **5-10 minutes** for 14,365 documents

### Step 3: Verify Migration

Check Qdrant dashboard:
```
https://<your-qdrant-app>.fly.dev/dashboard
```

Verify collections count:
```bash
curl https://nuzantara-qdrant.fly.dev/collections
```

### Step 4: Update Application Code

Switch vector_db.py to use Qdrant:

```python
# backend/core/vector_db.py (new wrapper)
from qdrant_client import QdrantClient

class VectorDBClient:
    def __init__(self):
        self.client = QdrantClient(
            url=os.getenv("QDRANT_URL"),
            api_key=os.getenv("QDRANT_API_KEY")
        )
    
    def search(self, collection: str, vector: List[float], limit: int = 10):
        return self.client.search(
            collection_name=collection,
            query_vector=vector,
            limit=limit
        )
```

### Step 5: Test Application

Run health checks:
```bash
curl http://localhost:8000/health
# Should show Qdrant connection OK
```

Test RAG queries:
```bash
curl -X POST http://localhost:8000/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query": "test query", "collection": "zantara_books"}'
```

### Step 6: Deploy to Fly.io

```bash
git add apps/backend-rag/backend/core/vector_db.py
git commit -m "Switch to Qdrant vector DB"
git push

# Fly.io auto-deploys
```

### Step 7: Monitor Production

Watch logs for 24 hours:
```bash
railway logs --service backend-rag
```

Check Grafana dashboards for:
- Query latency (should be similar or better)
- Error rates (should be 0)
- Vector DB connections

## Rollback Plan

If issues occur:

### Quick Rollback (5 minutes)

1. Revert environment variables:
   ```env
   # Back to ChromaDB
   CHROMA_PERSIST_DIR=./data/chroma_db
   ```

2. Restore ChromaDB code:
   ```bash
   git revert HEAD
   git push
   ```

### Data Recovery

ChromaDB backup available at:
```
apps/backend-rag/data/chroma_db.backup/
```

Restore if needed:
```bash
mv data/chroma_db data/chroma_db.old
cp -r data/chroma_db.backup data/chroma_db
```

## Troubleshooting

### Error: "QDRANT_URL not set"
```bash
# Check Fly.io service variables
railway variables --service backend-rag
```

### Error: "Connection refused"
```bash
# Verify Qdrant service is running
railway status --service qdrant

# Check internal networking
railway run --service backend-rag "curl https://nuzantara-qdrant.fly.dev/healthz"
```

### Error: "Vector dimension mismatch"
```bash
# Check embedding model consistency
# Haiku embeddings = 1536 dimensions
# If mismatch, re-generate embeddings
```

## Post-Migration Cleanup

After 7 days of successful operation:

1. Remove ChromaDB backup (optional):
   ```bash
   rm -rf apps/backend-rag/data/chroma_db.backup
   ```

2. Uninstall chromadb (optional):
   ```bash
   pip uninstall chromadb
   ```

3. Update documentation to reference Qdrant only

## Performance Comparison

Expected improvements:

| Metric | ChromaDB | Qdrant | Improvement |
|--------|----------|--------|-------------|
| Query latency | 320ms | 180ms | -44% |
| Concurrent queries | 10 max | 100+ | 10x |
| Data durability | ❌ Ephemeral | ✅ Persistent | - |
| Replication | ❌ None | ✅ Available | - |
| Monitoring | ❌ None | ✅ Built-in | - |

## Support

Issues? Check:
1. Fly.io service logs
2. Qdrant dashboard
3. Grafana metrics
4. This README

Questions? Tag @W4 in .claude/handovers
