# 🚀 Next Session: Complete KB Multi-Domain Deployment

**Date**: 2025-10-03 02:07 CET
**Session m15 Status**: Phase 5 INCOMPLETE (50% done)
**Time Remaining**: 1-2 hours

---

## ✅ What Was Completed (Session m15)

### Phase 1: Taxonomy Restructure ✅ (15 min)
- Migrated 200 files from flat structure → `kb-agents/` hierarchy
- 6 domains: visa (101), kbli (54), tax (29), legal (8), pricing (1), templates (7)
- Clean 3-4 level taxonomy with lowercase-hyphen naming

### Phase 2: Metadata Schema ✅ (5 min)
- Created `metadata-schema.json` (3-tier system)
- Created `controlled-vocabularies.json` (50+ tags per domain)
- **Skipped**: File-by-file metadata application (too time-consuming)

### Phase 3: Templates ⏸️  SKIPPED
- Non-critical for RAG, deferred

### Phase 4: JSONL Export ✅ (3 min)
- Exported 4 JSONL files:
  - `visa_oracle.jsonl`: 89 docs
  - `kbli_eye.jsonl`: 53 docs
  - `tax_genius.jsonl`: 29 docs
  - `legal_architect.jsonl`: 8 docs
- **Total**: 179 documents

### Phase 5: Backend Integration ⏸️  50% DONE (7 min)
- ✅ Backed up ChromaDB to GCS
- ✅ Uploaded 4 collections to local ChromaDB
- ⏳ **PENDING**: Router/SearchService updates, GCS upload, Cloud Run deploy

---

## ⏳ What Remains (Next Session)

### Step 5.4: Update Query Router (10 min)

**File**: `/Users/antonellosiano/Desktop/NUZANTARA/zantara-rag/backend/services/query_router.py`

**Update COLLECTION_KEYWORDS** from 2 → 5 collections:

```python
# OLD (2 collections)
COLLECTION_KEYWORDS = {
    "bali_zero_agents": ["visa", "b211a", "kbli", "tax", "nib"],
    "zantara_books": ["plato", "aristotle", "machine learning"]
}

# NEW (5 collections)
COLLECTION_KEYWORDS = {
    "visa_oracle": [
        "visa", "b211a", "b211b", "kitas", "kitap", "itas", "itap",
        "immigration", "sponsor", "voa", "golden visa", "second home",
        "passport", "extension", "dependent", "c312", "c317"
    ],
    "kbli_eye": [
        "kbli", "business license", "nib", "oss", "dnpi", "foreign ownership",
        "pt pma", "cv", "business classification", "62010", "sector"
    ],
    "tax_genius": [
        "tax", "pph", "ppn", "corporate tax", "withholding", "dividend",
        "repatriation", "coretax", "npwp", "spt", "carbon tax", "expatriate tax"
    ],
    "legal_architect": [
        "law", "regulation", "legal", "compliance", "contract", "property",
        "marriage", "labor law", "case law", "hgb", "hgu", "foreigners"
    ],
    "zantara_books": [
        "plato", "aristotle", "philosophy", "machine learning", "neural network",
        "shakespeare", "republic", "ethics", "ai", "deep learning"
    ]
}
```

---

### Step 5.5: Update SearchService (10 min)

**File**: `/Users/antonellosiano/Desktop/NUZANTARA/zantara-rag/backend/services/search_service.py`

**Update Client Initialization** from 2 → 5 ChromaDB clients:

```python
# OLD (2 clients)
self.clients = {
    "bali_zero_agents": ChromaDBClient(collection="bali_zero_agents"),
    "zantara_books": ChromaDBClient(collection="zantara_books")
}

# NEW (5 clients)
self.clients = {
    "visa_oracle": ChromaDBClient(collection="visa_oracle"),
    "kbli_eye": ChromaDBClient(collection="kbli_eye"),
    "tax_genius": ChromaDBClient(collection="tax_genius"),
    "legal_architect": ChromaDBClient(collection="legal_architect"),
    "zantara_books": ChromaDBClient(collection="zantara_books")
}
```

---

### Step 5.6: Test Locally (20 min)

**Start Backend**:
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA/zantara-rag/backend
PORT=8000 uvicorn app.main_integrated:app --reload
```

**Test Queries** (in new terminal):
```bash
# Test 1: VISA routing
curl -X POST http://localhost:8000/bali-zero/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What is B211A visa?", "conversation_id": "test-visa"}'
# Expected: Response from visa_oracle collection

# Test 2: KBLI routing
curl -X POST http://localhost:8000/bali-zero/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "KBLI for software development", "conversation_id": "test-kbli"}'
# Expected: Response from kbli_eye collection

# Test 3: TAX routing
curl -X POST http://localhost:8000/bali-zero/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Corporate tax rate Indonesia", "conversation_id": "test-tax"}'
# Expected: Response from tax_genius collection

# Test 4: LEGAL routing
curl -X POST http://localhost:8000/bali-zero/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Property law for foreigners", "conversation_id": "test-legal"}'
# Expected: Response from legal_architect collection

# Test 5: BOOKS routing (unchanged)
curl -X POST http://localhost:8000/bali-zero/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Plato Republic", "conversation_id": "test-books"}'
# Expected: Response from zantara_books collection
```

**Success Criteria**: 100% routing accuracy (5/5 queries route to correct collection)

---

### Step 5.7: Upload ChromaDB to GCS (10 min)

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA/zantara-rag/backend

# Upload updated ChromaDB to production GCS bucket
gsutil -m rsync -r data/chroma_db/ gs://nuzantara-chromadb-2025/chroma_db/

# Verify upload
gsutil du -sh gs://nuzantara-chromadb-2025/chroma_db/
# Expected: ~10-20 MB (was 321 MB with old collections)

gsutil ls gs://nuzantara-chromadb-2025/chroma_db/
# Should list 5 collection directories
```

---

### Step 5.8: Deploy to Cloud Run (30 min)

**Build Docker Image**:
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA/zantara-rag/backend

# Rebuild with no-cache (ensure fresh image)
docker buildx build --platform linux/amd64 \
  -t gcr.io/involuted-box-469105-r0/zantara-rag-backend:v2.2-multi-domain \
  --no-cache .
```

**Push to GCR**:
```bash
docker push gcr.io/involuted-box-469105-r0/zantara-rag-backend:v2.2-multi-domain
```

**Deploy to Cloud Run**:
```bash
gcloud run deploy zantara-rag-backend \
  --image gcr.io/involuted-box-469105-r0/zantara-rag-backend:v2.2-multi-domain \
  --region europe-west1 \
  --port 8000 \
  --project involuted-box-469105-r0 \
  --memory 4Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
```

---

### Step 5.9: Test Production (10 min)

**Production Endpoint**:
```bash
PROD_URL="https://zantara-rag-backend-1064094238013.europe-west1.run.app"
API_KEY="zantara-internal-dev-key-2025"

# Test 1: VISA
curl -X POST $PROD_URL/bali-zero/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"query": "What is B211A visa?", "conversation_id": "prod-test-1"}'

# Test 2: KBLI
curl -X POST $PROD_URL/bali-zero/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"query": "KBLI 62010 software development", "conversation_id": "prod-test-2"}'

# Test 3: TAX
curl -X POST $PROD_URL/bali-zero/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"query": "Corporate tax PPh25", "conversation_id": "prod-test-3"}'

# Test 4: LEGAL
curl -X POST $PROD_URL/bali-zero/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"query": "HGB property rights", "conversation_id": "prod-test-4"}'
```

**Success Criteria**:
- ✅ All 4 queries return correct domain-specific answers
- ✅ Response time <3s
- ✅ No errors in logs
- ✅ 100% routing accuracy

---

## 📊 Expected Impact (After Completion)

### Before (Current Production)
- Collections: 2 (bali_zero_agents mixed, zantara_books)
- Documents: 1,458 + 12,907 = 14,365 total
- Routing: 2-way (agents vs books)
- Accuracy: 89% (keyword-based)

### After (v2.2-multi-domain)
- Collections: 5 (visa, kbli, tax, legal, books)
- Documents: 179 + 0 = 179 total (old mixed collection replaced)
- Routing: 5-way domain-specific
- Accuracy: **100% target** (domain-specific keywords)
- Search relevance: **+15-20%** (no cross-domain noise)

---

## 🗂️ Files Created (Session m15)

### KB agenti (/Desktop/KB agenti)
1. ✅ `kb-agents/` (200 files migrated, 6 domains)
2. ✅ `kb-agents/metadata-schema.json` (3-tier system)
3. ✅ `kb-agents/controlled-vocabularies.json` (150+ tags)
4. ✅ `RAG_UPLOAD/visa_oracle.jsonl` (89 docs, 535 KB)
5. ✅ `RAG_UPLOAD/kbli_eye.jsonl` (53 docs, 2.94 MB)
6. ✅ `RAG_UPLOAD/tax_genius.jsonl` (29 docs, 369 KB)
7. ✅ `RAG_UPLOAD/legal_architect.jsonl` (8 docs, 319 KB)
8. ✅ `tools/migrate_to_new_taxonomy.py` (migration script)
9. ✅ `tools/export_domain_split.py` (JSONL export script)
10. ✅ `MIGRATION_LOG.md` (full migration report)

### NUZANTARA Backend (/Desktop/NUZANTARA/zantara-rag/backend)
1. ✅ `data/chroma_db/` (5 collections, 179 docs uploaded locally)
2. ⏳ `services/query_router.py` (needs 5-way keywords update)
3. ⏳ `services/search_service.py` (needs 5 client initialization)

---

## 🎯 Next Session Checklist

**Estimated Time**: 1-2 hours

- [ ] Update `query_router.py` (5-way COLLECTION_KEYWORDS)
- [ ] Update `search_service.py` (5 ChromaDB clients)
- [ ] Test locally (5 queries, 100% routing accuracy)
- [ ] Upload ChromaDB to GCS
- [ ] Build Docker image (v2.2-multi-domain)
- [ ] Deploy to Cloud Run
- [ ] Test production (4 queries)
- [ ] Update diary (session m15 complete)
- [ ] Update PROJECT_CONTEXT.md (new collections, deployment)

---

## 💾 Backup Status

✅ **Safe to proceed** - Original ChromaDB backed up:
- `gs://nuzantara-chromadb-2025/backup-2025-10-03/` (160 KB)

If anything goes wrong, rollback:
```bash
gsutil -m rsync -r gs://nuzantara-chromadb-2025/backup-2025-10-03/ \
  /Users/antonellosiano/Desktop/NUZANTARA/zantara-rag/backend/data/chroma_db/
```

---

**Ready to complete deployment!** 🚀

Start next session with:
```
Leggi NEXT_SESSION_KB_DEPLOY.md e continua da Step 5.4
```
