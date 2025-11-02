# ZANTARA RAG Backend API Endpoints

## 🎯 Core Working Endpoints

### Health Check
```bash
GET https://nuzantara-rag.fly.dev/health
```
**Response**: `{"status": "healthy", "service": "ZANTARA RAG", ...}`

### Document Search
```bash
POST https://nuzantara-rag.fly.dev/search
Content-Type: application/json

{
  "query": "KBLI business classification",
  "collection": "kbli_eye",
  "limit": 10
}
```

### Document Storage (MIGRATION ENDPOINT)
```bash
POST https://nuzantara-rag.fly.dev/api/memory/store
Content-Type: application/json

{
  "id": "kbli_eye_KBLI_2020_COMPLETE_0",
  "document": "Indonesian business classification system...",
  "embedding": [0.1, 0.2, 0.3, ...],
  "metadata": {
    "source_file": "kbli_eye/KBLI_2020_COMPLETE_KNOWLEDGE_BASE.md",
    "file_name": "KBLI_2020_COMPLETE_KNOWLEDGE_BASE",
    "collection": "kbli_eye",
    "chunk_index": 0,
    "created_at": "2025-11-02T13:25:00.000Z",
    "relative_path": "kbli_eye/KBLI_2020_COMPLETE_KNOWLEDGE_BASE.md"
  }
}
```

### Embedding Generation
```bash
POST https://nuzantara-rag.fly.dev/api/memory/embed
Content-Type: application/json

{
  "text": "Business classification in Indonesia",
  "model": "sentence-transformers"
}
```
**Response**: `{"embedding": [0.1, 0.2, 0.3, ...]}`

### Collections List
```bash
GET https://nuzantara-rag.fly.dev/api/oracle/collections
```
**Response**: `{"success": true, "collections": ["kbli_eye", "visa_oracle", ...]}`

## 📚 Available Collections

### Primary Collections (with local data)
| Collection | Description | Files | Chunks |
|------------|-------------|-------|--------|
| `kbli_eye` | Indonesian business classification codes | 103 | 5,961 |
| `visa_oracle` | Visa and immigration information | 66 | 620 |
| `zantara_books` | General knowledge base | 68 | 1,069 |
| `tax_genius` | Tax regulations and procedures | 20 | 152 |
| `legal_architect` | Legal structures and compliance | 16 | 334 |

### Additional Collections (empty, ready for data)
| Collection | Description | Status |
|------------|-------------|--------|
| `kb_indonesian` | Indonesian knowledge base | Empty |
| `kbli_comprehensive` | Comprehensive KBLI reference | Empty |
| `cultural_insights` | Cultural information | Empty |
| `tax_updates` | Recent tax updates | Empty |
| `tax_knowledge` | Tax knowledge base | Empty |
| `property_listings` | Property listings | Empty |
| `property_knowledge` | Property information | Empty |
| `legal_updates` | Legal updates | Empty |
| `bali_zero_pricing` | Pricing information | Empty |

**TOTAL: 14 collections available** - ALL EMPTY, READY FOR MIGRATION

## 🔧 Migration Script Usage

### Working Script
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-FLY/scripts

# Test migration
python3 migrate-to-chromadb-v3.py --dry-run --verbose

# Execute migration
python3 migrate-to-chromadb-v3.py --verbose
```

### Script Features
- ✅ Uses `/api/memory/store` endpoint
- ✅ Generates embeddings via `/api/memory/embed`
- ✅ Handles 273 files → 8,136 chunks
- ✅ Progress tracking with tqdm
- ✅ Error handling and retry logic
- ✅ Dry run mode for testing

## 🚨 Error Handling

### Common HTTP Status Codes
- `200`: Success
- `422`: Validation error (missing required fields)
- `500`: Server error
- `429`: Rate limiting (auto-retry with backoff)

### Retry Logic
- Max retries: 3
- Backoff: 1s, 2s, 3s
- Exponential increase

## 📊 API Documentation

### Full OpenAPI Spec
```
https://nuzantara-rag.fly.dev/openapi.json
```

### Interactive Docs
```
https://nuzantara-rag.fly.dev/docs
```

## 🔍 Verification Commands

### Health Check
```bash
curl -s https://nuzantara-rag.fly.dev/health | jq '.status'
# Expected: "healthy"
```

### Collections Check
```bash
curl -s https://nuzantara-rag.fly.dev/api/oracle/collections | jq '.collections | length'
# Expected: 14+ collections
```

### Search Test (Post-Migration)
```bash
curl -s -X POST https://nuzantara-rag.fly.dev/search \
  -H "Content-Type: application/json" \
  -d '{"query": "business", "collection": "kbli_eye", "limit": 3}' | \
  jq '.results | length'
# Expected: >0 results after migration
```

### Memory Stats
```bash
curl -s https://nuzantara-rag.fly.dev/api/memory/stats
# Shows total_memories and collection_size_mb
```

---

**Status**: ✅ ENDPOINTS VERIFIED AND WORKING
**Migration Ready**: ✅ ALL TOOLS TESTED FUNCTIONAL
**Next Action**: 🚀 EXECUTE MIGRATION