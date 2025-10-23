---
name: rag-test
description: Test and validate the RAG system including ChromaDB queries, embedding quality, tier-based access control, and response streaming
---

# RAG System Testing Protocol

Use this skill when the user asks to test the RAG system, validate embeddings, check semantic search, or debug retrieval issues.

## Testing Procedure

### 1. Check ChromaDB Status
```bash
# Verify ChromaDB is accessible
curl http://localhost:8000/health
```

Check that the vector database is loaded with chunks from the knowledge base.

### 2. Test Semantic Search
Test with realistic queries for Indonesian business consulting:

**Test Queries by Category**:
- VISA/KITAS: "How to get KITAS for foreign workers in Bali?"
- Tax: "What are the tax obligations for PT company in Indonesia?"
- Legal: "Legal requirements for foreign investment in Indonesia"
- KBLI: "Which KBLI code for IT consulting business?"
- Business: "How to establish a PT PMA company?"

### 3. Validate Tier-Based Access
Test all access levels:
- **Level 0** (Public): General information
- **Level 1** (Basic): Standard consulting knowledge
- **Level 2** (Premium): Advanced strategies
- **Level 3** (Enterprise): Confidential methodologies

Verify that queries respect tier restrictions.

### 4. Check Embedding Quality
- Verify semantic similarity scores
- Test with synonyms and paraphrases
- Check multilingual support (English/Indonesian)
- Validate chunk relevance rankings

### 5. Test Response Streaming
- Check SSE endpoint functionality
- Verify partial response handling
- Test timeout and error scenarios

### 6. Validate Source Citations
- Ensure returned chunks include source metadata
- Check page numbers and book titles
- Verify chunk context completeness

### 7. Performance Metrics
- Query latency (target: <500ms)
- Embedding generation time
- Number of chunks retrieved (typically 5-10)
- Relevance score thresholds

## Key Files to Check
- `apps/backend-rag/backend/core/vector_db.py` - ChromaDB integration
- `apps/backend-rag/backend/core/embeddings.py` - Embedding generation
- `apps/backend-rag/backend/app/main_cloud.py` - FastAPI endpoints
- `apps/backend-rag/backend/services/` - RAG service logic

## Common Issues
- ChromaDB not loaded: Check data/ directory for vector DB files
- Poor retrieval: May need embedding model fine-tuning
- Tier access errors: Check user permissions in request headers
- Streaming issues: Verify sse-starlette configuration

## Success Criteria
✅ ChromaDB responds with valid results
✅ Semantic search returns relevant chunks
✅ Tier-based filtering works correctly
✅ Streaming responses work end-to-end
✅ Response latency under 500ms
✅ Source citations are accurate
