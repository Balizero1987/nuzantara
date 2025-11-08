# 🚀 PP28/2025 Deployment Guide

## Status: READY FOR PRODUCTION DEPLOYMENT

**Date**: November 3, 2025  
**Law**: PP Nomor 28 Tahun 2025 tentang Penyelenggaraan Perizinan Berusaha Berbasis Risiko  
**Chunks**: 523 Pasal processed  
**RAG**: Local ✅ | Production ⏳

---

## 📦 What Was Prepared

### 1. Law Processing (COMPLETE)

```
oracle-data/PP_28_2025/
├── kb_ready/
│   ├── chunks_articles.json     (523 chunks, 204KB)
│   └── obligations_matrix.json  (obligations extracted)
├── analysis/
│   └── [detailed legal analysis]
├── PP_28_2025_raw_text.txt      (537KB full text)
└── structure_map.json            (142KB structure)
```

**Each chunk contains:**
- `chunk_id`: Unique identifier (e.g., PP-28-2025-Pasal-211)
- `text`: Article content
- `law_id`: PP-28-2025
- `pasal`: Article number
- `signals`: Extracted business signals (KBLI, OSS, etc.)
- `metadata`: Source, type, hierarchy

### 2. RAG Integration (COMPLETE - LOCAL)

```python
# Already indexed in local ChromaDB
Collection: legal_intelligence
Path: data/chromadb/
Documents: 523
Status: ✅ WORKING
```

**Verification:**
```bash
python3 scripts/test-pp28-rag.py

✅ Collection exists: legal_intelligence
✅ Total documents: 523
✅ PP-28-2025 documents found: 5 (sample)
```

### 3. Backend API (NEW)

Created `/api/rag/*` endpoints for production management:

```typescript
POST   /api/rag/ingest       # Batch ingest documents
GET    /api/rag/stats        # Collection statistics
POST   /api/rag/query        # Query with filters
GET    /api/rag/collections  # List all collections
DELETE /api/rag/collection/:name
GET    /api/rag/health       # RAG system health
```

**File:** `apps/backend-ts/src/routes/rag.routes.ts`

---

## 🎯 Deployment Options

### Option A: API-Based Deployment (RECOMMENDED)

**Fast, simple, no SSH needed**

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-FLY
python3 scripts/deploy-pp28-via-api.py
```

**What it does:**
1. ✅ Checks backend health
2. ✅ Loads 523 chunks
3. ✅ Batches into 50-chunk groups
4. ✅ POSTs to `/api/rag/ingest`
5. ✅ Verifies with test queries
6. ✅ Reports stats

**Estimated time:** 2-3 minutes

---

### Option B: SSH-Based Deployment (ADVANCED)

**For direct ChromaDB file sync**

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-FLY
bash scripts/deploy-pp28-to-production.sh
```

**What it does:**
1. ✅ Verifies local data
2. ✅ Creates deployment package
3. ✅ SSHs to Fly.io machines
4. ✅ Syncs ChromaDB files
5. ✅ Runs migration script
6. ✅ Verifies each machine

**Estimated time:** 5-7 minutes

---

## 📋 Pre-Deployment Checklist

- [x] PP28/2025 PDF processed
- [x] 523 chunks extracted
- [x] Local ChromaDB verified
- [x] RAG routes created
- [x] API endpoints tested locally
- [x] Deployment scripts ready
- [ ] **Backend deployed to Fly.io** (run first)
- [ ] **PP28 data deployed**
- [ ] **Webapp verification**

---

## 🚀 Deployment Steps

### Step 1: Deploy Backend Update

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-FLY

# Build and deploy
npm run build --workspace=apps/backend-ts
flyctl deploy --config fly.toml

# Verify deployment
flyctl status
```

**Expected:** New deployment with RAG routes active

---

### Step 2: Deploy PP28 Data

**Choose your method:**

```bash
# Method A: API (recommended)
python3 scripts/deploy-pp28-via-api.py

# Method B: SSH
bash scripts/deploy-pp28-to-production.sh
```

---

### Step 3: Verify Production

```bash
# Test RAG health
curl https://nuzantara-backend.fly.dev/api/rag/health

# Test PP28 query
curl -X POST https://nuzantara-backend.fly.dev/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "legal_intelligence",
    "query": "PP 28 2025 KBLI 5 digit requirement",
    "limit": 3
  }'
```

**Expected:** 3 relevant PP28 documents returned

---

### Step 4: Test in Webapp

1. Go to: https://zantara.balizero.com
2. Login as: zero@balizero.com / PIN: 010719
3. Ask: **"Cosa dice PP 28/2025 sul KBLI a 5 cifre?"**

**Expected:** ZANTARA cites Pasal 211 with exact requirements

---

## 📊 Monitoring

### Backend Logs

```bash
# Real-time logs
flyctl logs --app nuzantara-backend

# Filter for RAG
flyctl logs --app nuzantara-backend | grep RAG
```

### ChromaDB Stats

```bash
# Get collection stats
curl https://nuzantara-backend.fly.dev/api/rag/stats?collection=legal_intelligence
```

### Test Queries

```bash
# Query 1: KBLI requirement
curl -X POST https://nuzantara-backend.fly.dev/api/rag/query \
  -d '{"collection":"legal_intelligence","query":"KBLI 5 digit OSS","limit":3}'

# Query 2: Risk-based licensing
curl -X POST https://nuzantara-backend.fly.dev/api/rag/query \
  -d '{"collection":"legal_intelligence","query":"risk based business licensing","limit":3}'

# Query 3: OSS integration
curl -X POST https://nuzantara-backend.fly.dev/api/rag/query \
  -d '{"collection":"legal_intelligence","query":"OSS system integration","limit":3}'
```

---

## ✅ Success Criteria

| Metric | Target | Verification |
|--------|--------|-------------|
| **Chunks deployed** | 523 | `GET /api/rag/stats` |
| **Query response** | <2s | Test queries above |
| **Webapp working** | ✅ | Ask PP28 question |
| **No errors** | 0 | `flyctl logs` |

---

## 🎯 What ZANTARA Can Now Do

With PP28/2025 in production:

✅ **KBLI Guidance**
- "Come funziona il KBLI a 5 cifre in Indonesia?"
- "Quali dati servono per registrare KBLI in OSS?"

✅ **Business Licensing**
- "Explain risk-based licensing framework in Indonesia"
- "What are the requirements for PT PMA licensing?"

✅ **OSS System**
- "How does OSS integrate with business licensing?"
- "Auto-approval timeline in OSS system?"

✅ **TKA (Foreign Workers)**
- "TKA requirements according to PP 28/2025"
- "How to register foreign workers in Indonesia?"

✅ **Sector-Specific**
- Maritime, forestry, ESDM, industry, trade, transport, health, education, tourism, etc.

---

## 🔧 Troubleshooting

### Issue: "Collection not found"

```bash
# Check collections
curl https://nuzantara-backend.fly.dev/api/rag/collections

# Recreate if needed
python3 scripts/deploy-pp28-via-api.py
```

### Issue: "No results returned"

```bash
# Verify count
curl "https://nuzantara-backend.fly.dev/api/rag/stats?collection=legal_intelligence"

# Check documents exist
curl -X POST https://nuzantara-backend.fly.dev/api/rag/query \
  -d '{"collection":"legal_intelligence","query":"PP-28-2025","limit":5}'
```

### Issue: "Backend errors"

```bash
# Check logs
flyctl logs --app nuzantara-backend | tail -50

# Restart machines
flyctl machines restart --app nuzantara-backend
```

---

## 📝 Next Steps (After Deployment)

1. **Add More Laws**
   - Use same pipeline for other PP/UU documents
   - Process: PDF → chunks → ingest → verify

2. **Enhance Metadata**
   - Add bilingual support (ID/EN/IT)
   - Entity linking (ministries, agencies)
   - Cross-references between laws

3. **Optimize Queries**
   - Fine-tune embedding model
   - Add hybrid search (keyword + semantic)
   - Implement query caching

4. **User Feedback**
   - Monitor which Pasal are queried most
   - Track citation accuracy
   - Improve response quality

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `scripts/deploy-pp28-via-api.py` | API-based deployment |
| `scripts/deploy-pp28-to-production.sh` | SSH-based deployment |
| `apps/backend-ts/src/routes/rag.routes.ts` | RAG API endpoints |
| `oracle-data/PP_28_2025/kb_ready/chunks_articles.json` | Source data |
| `PP28_INGESTION_COMPLETE.md` | Local deployment report |

---

## ✅ Deployment Command

**Run this now:**

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-FLY

# Step 1: Deploy backend with RAG routes
npm run build --workspace=apps/backend-ts
flyctl deploy

# Step 2: Deploy PP28 data
python3 scripts/deploy-pp28-via-api.py
```

**Then verify in webapp:**
https://zantara.balizero.com → Ask about PP 28/2025

---

**Zero, sei pronto per fare il deploy? 🚀**

1. `flyctl deploy` per il backend
2. `python3 scripts/deploy-pp28-via-api.py` per i dati
3. Test su https://zantara.balizero.com

Dimmi quando sei pronto e ti seguo passo per passo! 💪
