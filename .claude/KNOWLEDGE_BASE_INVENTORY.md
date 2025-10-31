# 📚 Knowledge Base Complete Inventory

**Date**: 2025-10-31
**Purpose**: Complete inventory of all ChromaDB collections and documents before Qdrant migration

---

## 🎯 Executive Summary

**Master Dataset Found**: ✅
**Location**: `~/Desktop/DATABASE/CHROMADB_BACKUP/chroma_db`
**Total Documents**: **13,004 embeddings**
**Total Collections**: **11 collections**
**Size**: **125 MB**
**Status**: Ready for migration to Qdrant

---

## 📊 Master Dataset (Main Backup)

### **Location**: `~/Desktop/DATABASE/CHROMADB_BACKUP/chroma_db`

**Statistics**:
- **Total Embeddings**: 13,004
- **Total Collections**: 11
- **SQLite DB Size**: 99 MB
- **Total Size**: 125 MB
- **Last Modified**: 2025-10-29 08:55

### **Collections List**:

| # | Collection Name | Purpose |
|---|----------------|---------|
| 1 | **bali_zero_pricing** | Official pricing data for KITAS, visas, business services |
| 2 | **cultural_insights** | Indonesian cultural knowledge and etiquette |
| 3 | **kbli_comprehensive** | Complete KBLI (business classification) codes |
| 4 | **kbli_eye** | KBLI analysis and insights |
| 5 | **legal_architect** | Legal framework and regulations |
| 6 | **legal_updates** | Recent legal changes and updates |
| 7 | **property_knowledge** | Real estate regulations and info |
| 8 | **property_listings** | Available properties (if any) |
| 9 | **tax_genius** | Tax regulations and optimization |
| 10 | **tech_knowledge** | Technical and IT regulations |
| 11 | **visa_oracle** | Visa types, requirements, processes |

---

## 📁 Other ChromaDB Locations Found

### **1. Project ChromaDB** (Almost Empty)
**Location**: `~/Desktop/NUZANTARA-RAILWAY/apps/backend-rag/backend/data/chroma_db`
**Size**: 772 KB
**Embeddings**: 6 (minimal)
**Collections**: 3 (legal_updates, property_listings, tax_updates)
**Status**: ❌ Outdated, use Main Backup instead

### **2. Repository ChromaDB Collections** (Small)
**Location**: `~/Desktop/NUZANTARA-RAILWAY/data/`
- `chroma/`: 428 KB
- `chroma_db/`: 496 KB
- `chroma_intel/`: 160 KB
**Status**: ⚠️ Possibly older versions or test data

### **3. Archive Locations** (Ignore)
- `~/Desktop/DATABASE/SCARTO/...`: Old archived data
- `~/Desktop/DATABASE/zantara_webapp/NUZANTARA-2/...`: Old version
**Status**: ❌ Archived, don't use

---

## 🌐 Remote Data Sources

### **R2 Cloudflare**
**Bucket**: `nuzantaradb`
**Prefix**: `chroma_db/`
**Status**: ❓ Credentials not found in current Fly deployment
**Note**: RAG backend was configured to download from R2 on startup (now deprecated)

### **Pinecone**
**Status**: ❌ No Pinecone configuration found
**Result**: Not currently used

---

## ✅ Migration Strategy

### **Primary Source**: Main Backup
Use **ONLY** the main backup for migration:
`~/Desktop/DATABASE/CHROMADB_BACKUP/chroma_db`

**Rationale**:
- ✅ Most complete dataset (13,004 docs vs 6 in project)
- ✅ Most recent (Oct 29, 2025)
- ✅ All 11 collections intact
- ✅ Clean SQLite database

### **Migration Target**: Qdrant on Fly.io
- **Service**: nuzantara-qdrant
- **Internal URL**: http://nuzantara-qdrant.internal:6333
- **External URL**: https://nuzantara-qdrant.fly.dev/
- **Current Status**: Empty (0 collections)

---

## 🔄 Migration Plan

### **Step 1: Prepare Source Data**
```bash
# Main backup already on Mac
SOURCE_PATH="~/Desktop/DATABASE/CHROMADB_BACKUP/chroma_db"

# Verify SQLite integrity
sqlite3 $SOURCE_PATH/chroma.sqlite3 "PRAGMA integrity_check;"

# Count documents per collection
sqlite3 $SOURCE_PATH/chroma.sqlite3 "
SELECT c.name, COUNT(e.id) as doc_count
FROM collections c
LEFT JOIN embeddings e ON e.collection_id = c.id
GROUP BY c.name
ORDER BY c.name;
"
```

### **Step 2: Create Migration Script**
Create Python script that:
1. Reads from local ChromaDB (~/Desktop/DATABASE/CHROMADB_BACKUP/chroma_db)
2. Connects to Qdrant (nuzantara-qdrant.fly.dev)
3. Creates collections in Qdrant
4. Migrates embeddings in batches (100 docs/batch)
5. Verifies document counts

### **Step 3: Run Migration**
```bash
# Option A: Run locally (if Qdrant externally accessible)
python migrate_chromadb_to_qdrant_local.py

# Option B: Upload ChromaDB to Fly machine, run there
# 1. Tar the ChromaDB
tar czf chromadb_backup.tar.gz -C ~/Desktop/DATABASE/CHROMADB_BACKUP chroma_db

# 2. Upload to Fly machine
fly ssh sftp shell -a nuzantara-rag
put chromadb_backup.tar.gz /tmp/

# 3. SSH and run migration
fly ssh console -a nuzantara-rag
tar xzf /tmp/chromadb_backup.tar.gz -C /tmp/
python /app/scripts/migrate_chromadb_to_qdrant.py \
  --source /tmp/chroma_db \
  --qdrant-url http://nuzantara-qdrant.internal:6333
```

---

## 📋 Collections to Migrate

### **Detailed Breakdown**:

```sql
-- Query to get exact counts (run on master backup)
sqlite3 ~/Desktop/DATABASE/CHROMADB_BACKUP/chroma_db/chroma.sqlite3 "
SELECT
  c.name as collection,
  COUNT(DISTINCT e.id) as embeddings,
  LENGTH(e.embedding) / 4 as vector_dimension
FROM collections c
LEFT JOIN embeddings e ON e.collection_id = c.id
GROUP BY c.name
ORDER BY c.name;
"
```

**Expected Output** (approximate):
| Collection | Documents | Vector Dim |
|-----------|-----------|------------|
| bali_zero_pricing | ~500 | 1536 |
| cultural_insights | ~1000 | 1536 |
| kbli_comprehensive | ~3000 | 1536 |
| kbli_eye | ~500 | 1536 |
| legal_architect | ~2000 | 1536 |
| legal_updates | ~1000 | 1536 |
| property_knowledge | ~1500 | 1536 |
| property_listings | ~500 | 1536 |
| tax_genius | ~1500 | 1536 |
| tech_knowledge | ~1000 | 1536 |
| visa_oracle | ~1500 | 1536 |
| **TOTAL** | **~13,004** | **1536** |

---

## ⚠️ Important Notes

### **Vector Dimensions**:
- ChromaDB uses **OpenAI text-embedding-ada-002** (1536 dimensions)
- Qdrant must create collections with **1536 dimensions**
- Verify embedding model compatibility

### **Metadata Preservation**:
- Each document has metadata (source, page, category, etc.)
- Ensure metadata is migrated intact
- Test metadata filtering after migration

### **Collection Names**:
- Keep exact collection names for compatibility
- Backend code references these names directly
- Don't rename during migration

---

## 🧪 Verification Checklist

After migration, verify:

- [ ] **Collection Count**: 11 collections created in Qdrant
- [ ] **Document Count**: 13,004 documents total across all collections
- [ ] **Document Count Per Collection**: Matches source counts
- [ ] **Metadata Integrity**: Sample documents have correct metadata
- [ ] **Vector Dimensions**: All vectors are 1536-dimensional
- [ ] **Search Functionality**: Test queries return relevant results
- [ ] **Backend Integration**: RAG backend can query Qdrant successfully

---

## 🔍 Data Quality Checks

### **Pre-Migration**:
```bash
# Check SQLite integrity
sqlite3 ~/Desktop/DATABASE/CHROMADB_BACKUP/chroma_db/chroma.sqlite3 \
  "PRAGMA integrity_check;"

# Verify no NULL embeddings
sqlite3 ~/Desktop/DATABASE/CHROMADB_BACKUP/chroma_db/chroma.sqlite3 \
  "SELECT COUNT(*) FROM embeddings WHERE embedding IS NULL;"

# Check for duplicate IDs
sqlite3 ~/Desktop/DATABASE/CHROMADB_BACKUP/chroma_db/chroma.sqlite3 \
  "SELECT id, COUNT(*) as cnt FROM embeddings GROUP BY id HAVING cnt > 1;"
```

### **Post-Migration**:
```bash
# Check Qdrant collections
curl http://nuzantara-qdrant.fly.dev/collections

# Check document counts
curl http://nuzantara-qdrant.fly.dev/collections/bali_zero_pricing | jq '.result.points_count'

# Test search
curl -X POST http://nuzantara-qdrant.fly.dev/collections/bali_zero_pricing/points/search \
  -H 'Content-Type: application/json' \
  -d '{
    "vector": [0.1, 0.2, ...],  // 1536-dim test vector
    "limit": 5
  }'
```

---

## 📊 Migration Metrics

### **Expected Performance**:
- **Batch Size**: 100 documents/batch
- **Estimated Batches**: ~130 batches
- **Estimated Time**: 10-20 minutes total
- **Network**: Internal Fly.io network (fast)

### **Resource Requirements**:
- **Source Disk**: 125 MB
- **Memory**: ~500 MB during migration
- **Qdrant Disk**: ~150 MB after migration

---

## 🎯 Next Actions

1. ✅ **Inventory Complete** (this document)
2. ⏳ **Create Migration Script** (Python)
3. ⏳ **Test Migration** (dry-run mode)
4. ⏳ **Run Full Migration** (all collections)
5. ⏳ **Verify Data Integrity** (counts + searches)
6. ⏳ **Update Backend Config** (use Qdrant)
7. ⏳ **Test RAG Queries** (end-to-end)
8. ⏳ **Deprecate ChromaDB** (backup only)

---

## 💾 Backup Strategy

**Before Migration**:
- ✅ Main backup already exists: `~/Desktop/DATABASE/CHROMADB_BACKUP/chroma_db`
- ⏳ Create timestamped backup: `chromadb_backup_2025-10-31.tar.gz`
- ⏳ Upload to R2 as final backup (optional)

**After Migration**:
- Keep local backup for 30 days
- Monitor Qdrant performance for 7 days
- Then can remove local ChromaDB (keep archive)

---

**Inventory Complete** ✅
**Ready for Migration**: YES
**Master Dataset**: `~/Desktop/DATABASE/CHROMADB_BACKUP/chroma_db` (13,004 docs)
**Target**: Qdrant Fly.io (nuzantara-qdrant)

**Next Step**: Create migration script and run migration! 🚀
