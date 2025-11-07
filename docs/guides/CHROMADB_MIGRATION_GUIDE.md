# ZANTARA ChromaDB Migration Guide

## 🎯 Overview

Complete migration solution for transferring 273+ markdown documents from local database to ChromaDB collections on Fly.io production.

## ✅ Status

- **Infrastructure Ready**: ✅ ChromaDB + RAG Backend operational on Fly.io
- **Migration Tools Ready**: ✅ Working script with API integration
- **Data Ready**: ✅ 273 documents discovered and chunked (8,136 chunks)
- **Endpoint Identified**: ✅ `/api/memory/store` for document ingestion

## 🔑 Key Information

### Target Backend Endpoint
```
POST https://nuzantara-rag.fly.dev/api/memory/store
```

### Request Schema
```json
{
  "id": "string",
  "document": "string",
  "embedding": [number],
  "metadata": {
    "source_file": "string",
    "file_name": "string",
    "collection": "string",
    "chunk_index": number,
    "created_at": "string",
    "relative_path": "string"
  }
}
```

### Collections Structure
| Collection | Files | Chunks | Description |
|------------|-------|--------|-------------|
| `kbli_eye` | 103 | 5,961 | Indonesian business classification codes |
| `visa_oracle` | 66 | 620 | Visa and immigration information |
| `zantara_books` | 68 | 1,069 | General knowledge base (philosophy, tech, culture) |
| `tax_genius` | 20 | 152 | Tax regulations and procedures |
| `legal_architect` | 16 | 334 | Legal structures and compliance |
| **ADDITIONAL COLLECTIONS** |  |  |  |
| `kb_indonesian` | - | - | Indonesian knowledge base |
| `kbli_comprehensive` | - | - | Comprehensive KBLI reference |
| `cultural_insights` | - | - | Cultural information |
| `tax_updates` | - | - | Recent tax updates |
| `tax_knowledge` | - | - | Tax knowledge base |
| `property_listings` | - | - | Property listings |
| `property_knowledge` | - | - | Property information |
| `legal_updates` | - | - | Legal updates |
| `bali_zero_pricing` | - | - | Pricing information |

**TOTAL: 14 collections available**

## 🚀 Quick Start

### 1. Test Migration (Dry Run)
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-FLY/scripts
python3 migrate-to-chromadb-v3.py --dry-run --verbose
```

### 2. Execute Migration
```bash
python3 migrate-to-chromadb-v3.py --verbose
```

### 3. Verify Results
```bash
curl -s "https://nuzantara-rag.fly.dev/search" \
  -X POST -H "Content-Type: application/json" \
  -d '{"query": "KBLI", "collection": "kbli_eye", "limit": 3}'
```

## 📋 Migration Tools

### Primary Tool: `migrate-to-chromadb-v3.py`
- **Status**: ✅ Working
- **Method**: API-based via `/api/memory/store`
- **Features**: Progress tracking, error handling, retry logic
- **Dependencies**: Python 3.x, requests library

### Alternative Tools
- `migrate-to-chromadb-v2.ts` - TypeScript version (API-based)
- `migrate-to-chromadb.ts` - Original version (ChromaDB direct)
- `migrate-kb-to-chromadb.py` - Python version (ChromaDB direct)

## 🔧 Technical Details

### Document Processing
1. **Discovery**: Recursive scan of `/Users/antonellosiano/Desktop/DATABASE/KB/`
2. **Extraction**: Markdown parsing and content cleaning
3. **Chunking**: 1000-character chunks with 10% overlap
4. **Embedding**: Generated via `/api/memory/embed` endpoint
5. **Storage**: Uploaded via `/api/memory/store` endpoint

### Document ID Format
```
{collection}_{filename}_{chunkIndex}
```
Example: `kbli_eye_KBLI_2020_COMPLETE_KNOWLEDGE_BASE_0`

### Metadata Structure
```json
{
  "source_file": "kbli_eye/KBLI_2020_COMPLETE_KNOWLEDGE_BASE.md",
  "file_name": "KBLI_2020_COMPLETE_KNOWLEDGE_BASE",
  "collection": "kbli_eye",
  "chunk_index": 0,
  "created_at": "2025-11-02T13:25:00.000Z",
  "relative_path": "kbli_eye/KBLI_2020_COMPLETE_KNOWLEDGE_BASE.md"
}
```

## 📊 Migration Statistics

### Current Status (Pre-Migration)
- **Local Documents**: 273 markdown files
- **Local Size**: ~50MB of content
- **Estimated Chunks**: 8,136 chunks
- **Production Data**: 0 documents (all collections empty!)
- **Gap**: 273 documents need migration - COMPLETE MIGRATION NEEDED

### Expected Post-Migration
- **Total Documents**: 8,136+ chunks in ChromaDB
- **Search Performance**: Semantic search enabled across all domains
- **Coverage**: Complete knowledge base availability

## 🛠️ Environment Setup

### Prerequisites
```bash
# Python dependencies
pip install requests tqdm

# Verify backend access
curl https://nuzantara-rag.fly.dev/health
```

### Environment Variables (Optional)
```bash
RAG_BACKEND_URL=https://nuzantara-rag.fly.dev
CHUNK_SIZE=1000
BATCH_SIZE=10
```

## 🔍 Verification Commands

### Backend Health
```bash
curl -s https://nuzantara-rag.fly.dev/health | jq '.status'
```

### Available Collections
```bash
curl -s https://nuzantara-rag.fly.dev/api/oracle/collections | jq '.collections'
```

### Search Test (Post-Migration)
```bash
# KBLI search
curl -s -X POST https://nuzantara-rag.fly.dev/search \
  -H "Content-Type: application/json" \
  -d '{"query": "business classification", "collection": "kbli_eye", "limit": 3}'

# Visa search
curl -s -X POST https://nuzantara-rag.fly.dev/search \
  -H "Content-Type: application/json" \
  -d '{"query": "investor kitas", "collection": "visa_oracle", "limit": 3}'
```

## 🚨 Troubleshooting

### Common Issues

1. **Backend Health**
   ```bash
   # Check if backend is responding
   curl -f https://nuzantara-rag.fly.dev/health
   ```

2. **Rate Limiting**
   - Script includes automatic retry logic
   - Default delay: 1 second between batches
   - Batch size: 10 documents per request

3. **Embedding Failures**
   - Fallback to zero vectors if embedding API fails
   - Monitor logs for embedding generation errors

4. **Memory Issues**
   - Reduce batch size if needed: `--batch-size 5`
   - Monitor memory usage during migration

### Error Handling
- Automatic retries (3 attempts)
- Exponential backoff (1s, 2s, 3s delays)
- Failed document tracking and reporting
- Resume capability for interrupted migrations

## 📈 Monitoring

### Progress Tracking
- Real-time progress bars per collection
- File-by-file processing status
- Chunk count and success rates
- Error reporting and statistics

### Post-Migration Validation
```bash
# Collection statistics
for collection in kbli_eye visa_oracle tax_genius legal_architect zantara_books; do
  echo "=== $collection ==="
  curl -s -X POST https://nuzantara-rag.fly.dev/search \
    -H "Content-Type: application/json" \
    -d '{"query": "test", "collection": "'$collection'", "limit": 1}' | \
    jq '.results | length'
done
```

## 📚 API Documentation

### Core Endpoints

#### Health Check
```
GET /health
```

#### Document Search
```
POST /search
{
  "query": "string",
  "collection": "string",
  "limit": number
}
```

#### Document Storage
```
POST /api/memory/store
{
  "id": "string",
  "document": "string",
  "embedding": [number],
  "metadata": object
}
```

#### Embedding Generation
```
POST /api/memory/embed
{
  "text": "string",
  "model": "sentence-transformers"
}
```

## 🎯 Next Steps

1. **Execute Migration**: Run `python3 migrate-to-chromadb-v3.py`
2. **Verify Results**: Test search functionality across all collections
3. **Performance Testing**: Validate query response times
4. **Documentation Update**: Update user-facing documentation
5. **Monitoring Setup**: Implement ongoing health checks

## 📞 Support

### Migration Issues
- Check backend health first
- Review error logs in migration output
- Verify network connectivity to Fly.io
- Monitor rate limiting responses

### API Documentation
- Full API docs: `https://nuzantara-rag.fly.dev/docs`
- OpenAPI spec: `https://nuzantara-rag.fly.dev/openapi.json`

---

**Migration Readiness**: ✅ COMPLETE
**Tools Status**: ✅ WORKING
**Infrastructure**: ✅ READY
**Next Action**: 🚀 EXECUTE MIGRATION