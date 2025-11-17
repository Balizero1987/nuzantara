# NUZANTARA RAG Implementation - Comprehensive Analysis

## Executive Summary

The NUZANTARA codebase implements a sophisticated **Retrieval-Augmented Generation (RAG)** system with:
- **16 ChromaDB collections** for multi-domain knowledge retrieval
- **Intelligent query routing** with fallback chains
- **Reranking optimization** with query caching and batch processing
- **Multilingual support** (English, Italian, Indonesian)
- **Cultural intelligence** integration via LLAMA-generated embeddings
- **Production deployment** with Fly.io and zero-downtime strategies

---

## 1. CORE RAG ARCHITECTURE

### Location
```
/home/user/nuzantara/apps/backend-rag/
```

### Key Components

#### 1.1 Search Service (Primary RAG Entry Point)
**File**: `/home/user/nuzantara/apps/backend-rag/backend/services/search_service.py` (774 lines)

**Responsibilities**:
- Semantic search across 16 ChromaDB collections
- Tier-based access control (S, A, B, C, D tiers)
- Multi-collection routing with conflict detection/resolution
- Health monitoring and warmup optimization

**Collections**:
1. `bali_zero_pricing` - Pricing information (1536-dim embeddings, OpenAI migrated)
2. `visa_oracle` - Immigration/visa information
3. `tax_genius` - Tax compliance data (1536-dim, migrated)
4. `legal_architect` / `indonesian_laws_unified` - Legal frameworks (5,039 docs)
5. `kbli_eye` / `kbli_unified` - Business classification (8,887 docs)
6. `kb_indonesian` - Indonesian knowledge base
7. `cultural_insights` - LLAMA-generated cultural intelligence
8. `property_listings` / `property_knowledge` - Property data
9. `zantara_books` - General knowledge base (8,923 docs)
10. Additional test collections for migration validation

**Key Methods**:
- `search()` - Single collection semantic search with caching
- `search_with_conflict_resolution()` - Multi-collection search with conflict detection
- `detect_conflicts()` - Identifies conflicting results from different sources
- `resolve_conflicts()` - Applies timestamp/relevance-based priority rules
- `query_cultural_insights()` - Retrieves cultural context
- `warmup()` - Pre-loads collections on startup

**Query Routing Logic**:
```python
# Pricing query detection → Always route to bali_zero_pricing
if any(kw in query.lower() for kw in pricing_keywords):
    collection = "bali_zero_pricing"

# Standard queries → Use QueryRouter with fallback chains
primary_collection, confidence, fallbacks = router.route_with_confidence(query)

# Multi-collection search with conflict resolution
results = await search_with_conflict_resolution(query, user_level, fallbacks_enabled=True)
```

---

#### 1.2 Reranking Service (Quality Enhancement)
**File**: `/home/user/nuzantara/apps/backend-rag/backend/services/reranker_service.py` (520 lines)

**Model**: `cross-encoder/ms-marco-MiniLM-L-6-v2` (400MB, ~30ms latency)

**Features**:
- **Query similarity caching** - LRU cache with thread-safe operations
- **Batch reranking** - Process multiple queries efficiently
- **Performance monitoring** - Latency tracking with percentiles (p50, p95, p99)
- **Cache statistics** - Hit rate tracking and target achievement
- **Audit logging** - GDPR-compliant query hashing

**Methods**:
```python
# Single query reranking
results = reranker.rerank(
    query="How much does KITAS cost?",
    documents=docs,
    top_k=5
)
# Returns: [(doc, relevance_score), ...] sorted by score

# Multi-source reranking
results = reranker.rerank_multi_source(
    query=query,
    source_results={
        'visa_oracle': [...],
        'tax_genius': [...]
    },
    top_k=5
)
# Returns: [(doc, score, source_name), ...]

# Batch reranking (multiple queries)
results = reranker.rerank_batch(
    queries=["KITAS cost", "PT PMA setup"],
    documents_list=[docs1, docs2],
    top_k=5
)
```

**Performance Metrics**:
- **Target**: <50ms per query
- **Actual P95**: ~50ms
- **Cache hit latency**: <5ms
- **Cache hit rate**: Target >30%
- **Quality improvement**: +40% precision@5

**Configuration** (`app/config.py`):
```python
enable_reranker: bool = True
reranker_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
reranker_top_k: int = 5
reranker_cache_enabled: bool = True
reranker_cache_size: int = 1000
reranker_batch_enabled: bool = True
reranker_audit_enabled: bool = True
```

---

#### 1.3 Embeddings Generation
**Files**:
- `/home/user/nuzantara/apps/backend-rag/backend/core/embeddings.py` (221 lines)
- `/home/user/nuzantara/apps/backend-rag/backend/core/embeddings_local.py` (116 lines)

**Dual Provider Strategy**:

1. **OpenAI Provider** (Production)
   - Model: `text-embedding-3-small`
   - Dimensions: 1536
   - Cost: Paid API
   - Status: Migrated collections (Nov 2025)

2. **Sentence Transformers** (Local/Fallback)
   - Model: `sentence-transformers/all-MiniLM-L6-v2` (default)
   - Dimensions: 384
   - Cost: Free (runs locally)
   - Alternatives: `all-mpnet-base-v2`, `paraphrase-multilingual-MiniLM-L12-v2`

**Migration Note** (Nov 5, 2025):
```
HOTFIX: Collections migrated from 384-dim (Sentence Transformers) to 
1536-dim (OpenAI text-embedding-3-small) to match production requirements
```

---

#### 1.4 Vector Database (ChromaDB)
**File**: `/home/user/nuzantara/apps/backend-rag/backend/core/vector_db.py` (180+ lines)

**Capabilities**:
- Persistent storage with metadata filtering
- Document upsert with embeddings
- Semantic search with distance/similarity scoring
- Tier-based filtering (S/A/B/C/D)

**Example Usage**:
```python
# Initialize
vector_db = ChromaDBClient(
    persist_directory="/data/chroma_db",
    collection_name="visa_oracle"
)

# Search
results = vector_db.search(
    query_embedding=[...1536-dim vector...],
    filter={"tier": {"$in": ["S", "A"]}},
    limit=20
)
# Returns: {
#   'documents': [...],
#   'distances': [...],
#   'metadatas': [...]
# }
```

---

## 2. TRANSLATION & MULTILINGUAL SUPPORT

### 2.1 Language Detection & Response Adaptation
**File**: `/home/user/nuzantara/apps/backend-rag/backend/llm/llama_scout_client.py` (lines 110-176)

**Supported Languages**:
- English - Professional but friendly tone
- Italian - Warm and personable ("Ciao!" appropriate)
- Indonesian - Respectful with appropriate formality levels

**System Prompt Integration**:
```python
base_prompt = """Match the user's language and energy:
- English: Professional but friendly, clear and confident
- Italian: Warm and personable, "Ciao!" is fine but maintain substance
- Indonesian: Respectful and culturally aware, using appropriate formality levels

When responding in Indonesian, prioritize natural, fluid expression over literal translation.
Use appropriate formality levels and Indonesian idioms where suitable.
Examples: "Saya bisa bantu Anda dengan..." (not robotic)
"""
```

### 2.2 Cultural Intelligence Integration
**File**: `/home/user/nuzantara/apps/backend-rag/backend/services/cultural_rag_service.py` (150+ lines)

**Features**:
- Retrieves LLAMA-generated cultural insights from ChromaDB
- Injects cultural context into Claude's responses
- Contextual injection based on conversation stage & intent

**Cultural Topics Covered**:
- Indonesian greetings and etiquette
- Bureaucracy patience expectations
- Face-saving culture protocols
- Tri Hita Karana (Balinese philosophy)
- Hierarchy and respect norms
- Meeting etiquette and negotiation styles

**Usage**:
```python
cultural_rag = CulturalRAGService(search_service)

cultural_context = await cultural_rag.get_cultural_context(
    context_params={
        "query": user_message,
        "intent": "business_simple",
        "conversation_stage": "first_contact"
    },
    limit=2
)

# Build prompt injection
cultural_prompt = cultural_rag.build_cultural_prompt_injection(cultural_context)
```

### 2.3 Multilingual Testing
**File**: `/home/user/nuzantara/apps/backend-rag/test_multilingual_quality.py` (80+ lines)

**Test Coverage**:
- English: 3 queries (professional, detailed, casual)
- Italian: 3 queries (warm/professional, detailed)
- Indonesian: 3 queries (helpful/respectful, direct, professional)

**Quality Criteria Tested**:
- Fluency (30% weight)
- Cultural appropriateness (25%)
- Completeness (20%)
- Accuracy (15%)
- Language naturalness (10%)

---

## 3. RERANKING DEPLOYMENT & OPTIMIZATION

### 3.1 Deployment Scripts
**Location**: `/home/user/nuzantara/apps/backend-rag/backend/scripts/`

**Key Scripts**:
1. `deploy_reranker.sh` - Zero-downtime staged deployment
2. `monitor_reranker.sh` - Real-time performance monitoring
3. `check_fly_deployment.sh` - Deployment validation
4. `auto_deploy.sh` - Automated full deployment pipeline
5. `check_deployment.py` - Local validation checks

**Deployment Stages**:
```bash
Stage 1: feature-flags        (cache disabled, audit enabled)
Stage 2: cache-10            (100 entries, 10% capacity)
Stage 3: cache-50            (500 entries, 50% capacity)
Stage 4: cache-100           (1000 entries, full capacity)
Stage 5: full                (all features enabled)
```

**Example Deployment**:
```bash
cd apps/backend-rag/backend
./scripts/auto_deploy.sh      # ~10 minutes total
# OR manual:
./scripts/deploy_reranker.sh feature-flags
./scripts/monitor_reranker.sh 30    # Monitor for 30 seconds
```

### 3.2 Monitoring & Metrics
**Script**: `/home/user/nuzantara/apps/backend-rag/backend/scripts/monitor_reranker.sh` (80 lines)

**Tracked Metrics**:
- `total_reranks` - Total operations since startup
- `avg_latency_ms` - Average latency across all queries
- `p95_latency_ms` - 95th percentile latency (target: <50ms)
- `cache_hit_rate_percent` - Hit rate percentage (target: >30%)
- `target_latency_met_rate_percent` - % of queries meeting <50ms target

**Live Monitoring**:
```bash
# Real-time stats (updates every 10 seconds)
./scripts/monitor_reranker.sh 10

# Output example:
# [2025-11-17 10:30:00]
# Total Reranks: 1542
# Avg Latency: 42.3ms (target: <50ms)
# P95 Latency: 48.7ms
# Cache Hit Rate: 35.2% (target: >30%)
# Target Met Rate: 92.1%
```

**Health Endpoint**:
```bash
curl https://nuzantara-rag.fly.dev/health | jq '.reranker'
```

---

## 4. CONFIGURATION MANAGEMENT

### 4.1 Main Configuration File
**File**: `/home/user/nuzantara/apps/backend-rag/backend/app/config.py` (86 lines)

**RAG-Specific Settings**:
```python
# Embeddings
embedding_provider: str = "openai"
embedding_model: str = "text-embedding-3-small"
embedding_dimensions: int = 1536

# ChromaDB
chroma_persist_dir: str = "./data/chroma_db"
chroma_collection_name: str = "zantara_books"

# Chunking
chunk_size: int = 500
chunk_overlap: int = 50

# Reranker Service
enable_reranker: bool = True
reranker_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
reranker_top_k: int = 5
reranker_latency_target_ms: float = 50.0

# Feature Flags
reranker_cache_enabled: bool = True
reranker_cache_size: int = 1000
reranker_batch_enabled: bool = True
reranker_audit_enabled: bool = True

# Rate Limiting
reranker_rate_limit_per_minute: int = 100
reranker_rate_limit_per_hour: int = 1000

# Overfetch Strategy
reranker_overfetch_count: int = 20    # Fetch 20, return 5
reranker_return_count: int = 5
```

### 4.2 Environment Variables
All settings can be overridden via `.env`:
```bash
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-...
ENABLE_RERANKER=true
RERANKER_CACHE_ENABLED=true
RERANKER_CACHE_SIZE=1000
RERANKER_BATCH_ENABLED=true
RERANKER_AUDIT_ENABLED=true
CHROMA_DB_PATH=/data/chroma_db
```

---

## 5. RECENT CHANGES (November 15-17, 2025)

### 5.1 Nov 16 Commits
**Focus**: Dataset expansion and multilingual training data

| Time | Commit | Description |
|------|--------|-------------|
| 20:33 UTC | `446e63b` | Add CLAUDE 13 Zero-ZANTARA Creator-Creation Italian dataset |
| 16:34 UTC | `74c06e3` | Add Javanese dataset validation script |
| 16:31 UTC | `d06751f` | Add Javanese conversational dataset (3,000 conversations) |
| 15:36 UTC | `3f77511` | Add mixed Indonesian dialect conversations dataset |
| 14:25 UTC | `71fd9af` | Add compressed Sundanese dataset |
| 13:40 UTC | `2a3b6b9` | Add Sundanese dataset (3,000 conversations) |
| 12:37 UTC | `351d272` | Add PR template for Jakarta Authentic dataset |
| 12:35 UTC | `22fba32` | Add Jakarta Authentic dataset to DATASET_GEMMA |
| 11:48 UTC | `657ab19` | Add Jakarta Authentic dataset generator (CLAUDE 12) |
| 11:43 UTC | `855135a` | Add Jakarta special conversations generator (1,500) |

**Total**: 9 major dataset additions on Nov 16, supporting:
- Italian language fine-tuning
- Javanese dialect training
- Indonesian dialect diversity
- Jakarta-specific business conversations
- Sundanese language variants

### 5.2 Earlier Changes (Nov 15)
- `5a58832` - Disable Haiku fallback temporarily (API limits until Dec 1st)
- `4f6fbe0` - Add graceful fallback when Haiku API limit reached

---

## 6. TESTING SUITE

### 6.1 RAG Tests
**File**: `/home/user/nuzantara/apps/backend-rag/backend/tests/test_search_service.py` (100 lines)

**Test Coverage**:
- Semantic search returns relevant documents
- Search with metadata filters
- Empty query handling
- Search result limits
- Score threshold filtering

**Running Tests**:
```bash
cd apps/backend-rag
pytest backend/tests/test_search_service.py -v
```

### 6.2 Multilingual Quality Tests
**File**: `/home/user/nuzantara/apps/backend-rag/test_multilingual_quality.py` (80+ lines)

Tests response quality across:
- English (3 queries)
- Italian (3 queries)  
- Indonesian (3 queries)

### 6.3 Integration Tests
- `test_llm_routing.py` - LLM selection logic
- `test_memory_service.py` - Memory integration
- `test_pricing_service.py` - Pricing calculations
- `test_endpoints.py` - API endpoint validation

---

## 7. LLAMA SCOUT INTEGRATION

### 7.1 Primary AI Model
**File**: `/home/user/nuzantara/apps/backend-rag/backend/llm/llama_scout_client.py` (200+ lines)

**Configuration**:
```python
# Primary: Llama 4 Scout
llama_model = "meta-llama/llama-4-scout"
llama_pricing = {"input": 0.20, "output": 0.20}  # Per 1M tokens

# Fallback: Claude Haiku 4.5
haiku_model = "claude-3-5-haiku-20241022"
haiku_pricing = {"input": 1.0, "output": 5.0}
```

**Cost Comparison**:
```
For 1000 queries/day (500 tokens input, 1500 tokens output):
  Haiku:     $8/day = $240/month
  Llama Scout: $0.40/day = $12/month
  Savings:   95% cheaper (95% → $228/month)
```

**Features**:
- Automatic fallback on Llama errors
- Performance metrics tracking
- Cost optimization integration
- Multimodal support (text + image + video)

### 7.2 Routing Strategy
**File**: `/home/user/nuzantara/apps/backend-rag/backend/services/intelligent_router.py`

Routes queries to:
1. **Llama Scout** (primary) - 92% cheaper, 22% faster
2. **Haiku** (fallback) - Tool calling, complex reasoning
3. **Pricing Service** - Specialized pricing calculations
4. **Tax Oracle** - Complex tax scenarios

---

## 8. ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    User Query                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   Language Detection         │
        │  (English/Italian/Indonesian)│
        └──────────────┬───────────────┘
                       │
        ┌──────────────▼───────────────┐
        │   Query Router               │
        │  (Collection Selection)       │
        └──────────────┬───────────────┘
                       │
        ┌──────────────▼───────────────────────┐
        │   ChromaDB Semantic Search           │
        │  16 Collections, 1536-dim embeddings │
        │  (OpenAI text-embedding-3-small)    │
        └──────────────┬───────────────────────┘
                       │
        ┌──────────────▼───────────────┐
        │   Reranking Service          │
        │  (Cross-Encoder Relevance)   │
        │  - Query Caching (LRU)       │
        │  - Batch Processing          │
        │  - Audit Logging (GDPR)      │
        └──────────────┬───────────────┘
                       │
        ┌──────────────▼───────────────┐
        │   Cultural Intelligence      │
        │  (LLAMA-generated insights)  │
        └──────────────┬───────────────┘
                       │
        ┌──────────────▼───────────────────────┐
        │   LLM Response Generation            │
        │  Primary: Llama 4 Scout ($0.20/1M)  │
        │  Fallback: Claude Haiku ($1-5/1M)   │
        └──────────────┬───────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  Multilingual Response│
            │  (Tone-matched)       │
            └──────────────────────┘
```

---

## 9. KEY FILES SUMMARY

| File | Lines | Purpose |
|------|-------|---------|
| `search_service.py` | 774 | Core RAG retrieval with 16 collections |
| `reranker_service.py` | 520 | Cross-encoder ranking with caching |
| `embeddings.py` | 221 | OpenAI/SentenceTransformers dual provider |
| `vector_db.py` | 180+ | ChromaDB wrapper and persistence |
| `cultural_rag_service.py` | 150+ | Cultural context injection |
| `llama_scout_client.py` | 200+ | Llama Scout with Haiku fallback |
| `main_cloud.py` | 2000+ | FastAPI app with all services |
| `config.py` | 86 | Settings and configuration |
| `RERANKER_OPTIMIZATION.md` | 463 | Complete reranker documentation |
| `LLAMA_SCOUT_MIGRATION.md` | 100+ | Llama Scout setup guide |

---

## 10. DEPLOYMENT STATUS

### Current Status
- ✅ Reranker optimization: Production-ready
- ✅ OpenAI embeddings migration: Complete (Nov 5)
- ✅ Cultural RAG: Integrated and tested
- ✅ Llama Scout: Primary AI active (Haiku fallback for API limits)
- ✅ Fly.io deployment: Automated zero-downtime strategy

### Ready for Deployment
```bash
cd apps/backend-rag/backend
./scripts/auto_deploy.sh  # Full deployment in ~10 minutes
```

### Monitoring
```bash
./scripts/monitor_reranker.sh 10  # Monitor for performance
curl https://nuzantara-rag.fly.dev/health | jq  # Health check
```

---

## 11. RECOMMENDATIONS

1. **Monitor Cache Hit Rate**: Aim for >30% (currently tracking)
2. **Watch Latency P95**: Keep <50ms (current average ~42ms)
3. **Scale Reranker**: Consider Redis-backed cache for multi-instance
4. **Multilingual Expansion**: Extend test coverage beyond 3 languages
5. **A/B Testing**: Implement user feedback integration for quality metrics
6. **Cost Tracking**: Monitor Llama Scout vs Haiku usage for ROI

---

**Generated**: November 17, 2025
**Current Branch**: claude/test-rag-optimization-01VLL9PYzqB2U588xGwxgWqK
