# Deploy RAG Handover

> **What This Tracks**: Python RAG backend deployments and changes
> **Created**: 2025-10-05 by sonnet-4.5_m3

## Current State

**Version**: 2.3.0-reranker
**URL**: https://zantara-rag-backend-himaadsxua-ew.a.run.app
**Status**: ✅ Running

**Routers**: 3 (auth, memory_vector, intel)
**Collections**: 16 (8 visa/tax/kb + 8 intel topics)

---

## History

### 2025-10-05 21:00 (bali-intel-system) [sonnet-4.5_m3]

**Changed**:
- `apps/backend-rag 2/backend/app/routers/intel.py:1-330` - NEW: Intel news API router
  - 5 endpoints: /api/intel/search, /store, /critical, /trends, /stats
  - 8 ChromaDB collections: bali_intel_[immigration|bkpm_tax|realestate|events|social|competitors|bali_news|roundup]
  - Semantic search with embeddings (sentence-transformers)
- `apps/backend-rag 2/backend/app/main_cloud.py:692-694` - Registered intel router

**Related**:
→ Full session: [2025-10-05_sonnet-4.5_m3.md](./../diaries/2025-10-05_sonnet-4.5_m3.md)

---
