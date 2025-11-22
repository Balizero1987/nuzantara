# ZANTARA Backend RAG - Current Architecture

## 🏗️ Architecture Overview

The ZANTARA RAG backend is built on a clean architecture pattern with centralized AI services and modern vector database technology.

### Core Components

#### 🤖 AI Engine: ZANTARA AI Client
- **Location**: `backend/llm/zantara_ai_client.py`
- **Provider**: OpenRouter (configurable)
- **Model**: meta-llama/llama-4-scout (configurable via `ZANTARA_AI_MODEL`)
- **Features**:
  - Conversational AI with tool calling support
  - Token-by-token streaming for real-time responses
  - Cost tracking and usage metrics
  - Multi-language support (EN, IT, ID)

#### 🗄️ Vector Database: Qdrant
- **Location**: `backend/core/qdrant_db.py`
- **Collections**: 16 specialized collections (25,415+ documents)
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Features**:
  - Semantic search with filtering
  - Hybrid search capabilities
  - Collection management and health monitoring

#### 🔍 Search Service
- **Location**: `backend/services/search_service.py`
- **Features**:
  - Multi-collection search with intelligent routing
  - Conflict resolution and deduplication
  - Access tier control (S, A, B, C, D levels)
  - Performance optimization with caching

### Key Services

#### Streaming Service (`backend/services/streaming_service.py`)
- Real-time token-by-token streaming via Server-Sent Events (SSE)
- Integrated with ZANTARA AI for responsive chat
- Context-aware streaming with RAG and memory integration

#### Follow-up Service (`backend/services/followup_service.py`)
- AI-powered question suggestion generation
- Multi-language topic detection (EN, IT, ID)
- Fallback to predefined topic-based suggestions

#### Autonomous Research (`backend/services/autonomous_research_service.py`)
- Self-directed multi-collection exploration
- Iterative query expansion and gap analysis
- AI-powered synthesis of research findings

## 📁 Directory Structure

```
apps/backend-rag/
├── backend/
│   ├── app/                    # FastAPI application
│   │   ├── main_cloud.py      # Main entry point
│   │   ├── dependencies.py    # Dependency injection
│   │   └── routers/           # API endpoints
│   ├── services/              # Business logic
│   │   ├── search_service.py  # RAG search engine
│   │   ├── streaming_service.py # Real-time streaming
│   │   ├── followup_service.py   # Question suggestions
│   │   └── ...
│   ├── core/                  # Core infrastructure
│   │   ├── qdrant_db.py      # Vector database client
│   │   └── embeddings.py     # Embedding generation
│   └── llm/
│       └── zantara_ai_client.py # AI client
├── scripts/                   # Active scripts (migrations, maintenance, dataset tools)
│   └── modules/              # Shared script modules
└── docs/
    ├── archive/              # Legacy documentation
    └── prompts/              # System prompts
```

## 🔧 Configuration

### Environment Variables
```bash
# ZANTARA AI (OpenRouter)
OPENROUTER_API_KEY_LLAMA=your-openrouter-api-key
ZANTARA_AI_MODEL=meta-llama/llama-4-scout
ZANTARA_AI_COST_INPUT=0.20
ZANTARA_AI_COST_OUTPUT=0.20

# Qdrant Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-qdrant-api-key

# OpenAI (for embeddings)
OPENAI_API_KEY=your-openai-api-key

# Other Services
DATABASE_URL=postgresql://user:password@host:port/dbname
REDIS_URL=redis://default:password@host:port
```

## 🚀 API Endpoints

### Main Streaming Endpoint
- **POST** `/bali-zero/chat-stream`
- Server-Sent Events for real-time responses
- Supports conversation context and RAG integration

### Health & Monitoring
- **GET** `/healthz` - Service health check
- **GET** `/api/oracle/health` - RAG system health

## 📊 Collections in Qdrant

| Collection | Documents | Purpose |
|------------|-----------|---------|
| legal_unified | 5,041 | Legal regulations and compliance |
| kbli_unified | 8,886 | Business classification codes |
| tax_genius | 895 | Tax regulations and advice |
| visa_oracle | 1,612 | Immigration and visa procedures |
| property_unified | 29 | Real estate regulations |
| ... | ... | Additional specialized collections |

## 🔄 Migration Status

### ✅ Completed Migrations
- **ChromaDB → Qdrant**: Full migration completed
- **Claude API → ZANTARA AI**: All services updated
- **Legacy scripts → Modern services**: Functionality preserved
- **Centralized configuration**: Environment-based setup

### 📁 Archived Components
- **ChromaDB scripts**: `scripts/legacy_chromadb/`
- **Dataset generators**: `scripts/deprecated/`
- **Legacy docs**: `docs/archive/`

## 🧪 Testing

### Current Test Integration
- **Shell script**: `backend/test_pricing_integration.sh`
- **Health checks**: Built into all services
- **API testing**: Available via `/healthz` endpoints

## 🛠️ Development

### Adding New Collections
1. Update `core/qdrant_db.py` with collection schema
2. Add routing logic in `services/search_service.py`
3. Update `services/query_router.py` for intelligent routing

### Modifying AI Behavior
1. Update system prompts in `backend/prompts/`
2. Modify `ZantaraAIClient` for new model integration
3. Adjust `services/intelligent_router.py` for routing changes

## 📈 Performance

- **Search latency**: <500ms for multi-collection queries
- **Streaming latency**: <100ms for first token
- **Vector dimensions**: 1536 (OpenAI embeddings)
- **Total documents**: 25,415+ across 16 collections
- **API response time**: 70-80% faster perceived with streaming

---

**Last Updated**: 2025-01-21
**Architecture Version**: 6.0 (ZANTARA AI + Qdrant)