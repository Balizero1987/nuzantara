# ZANTARA Backend RAG - Current Architecture

## 🏗️ Architecture Overview

The ZANTARA RAG backend is an **Ultra Hybrid** system utilizing a multi-model approach to balance cost, speed, and reasoning depth.

### Core Components

#### 🧠 Reasoning Engine: Google Gemini 1.5 Flash
- **Location**: `backend/app/routers/oracle_universal.py`
- **Role**: Deep document analysis and complex reasoning
- **Capabilities**:
  - Full PDF analysis via "Smart Oracle" (bypassing chunking limitations)
  - 1M+ token context window for legal document synthesis
  - Native multilingual support (ID, EN, IT)

#### 🤖 Conversational Engine: ZANTARA AI Client
- **Location**: `backend/llm/zantara_ai_client.py`
- **Provider**: OpenRouter (Unified Gateway)
- **Models**:
  - `meta-llama/llama-4-scout`: Primary conversational agent
  - `mistralai/mistral-7b-instruct`: Fast fallback and chatter
- **Features**:
  - Token-by-token streaming via SSE
  - Tool calling support (Search, Pricing)

#### 🗄️ Vector Database: Qdrant
- **Location**: `backend/core/qdrant_db.py`
- **Collections**: 16 specialized collections (25,415+ documents)
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Features**:
  - Semantic search with hybrid filtering
  - Deduplication and conflict resolution

#### ☁️ Document Storage: Google Drive
- **Integration**: Direct API integration via Service Account
- **Role**: Source of Truth for full PDF documents
- **Workflow**: Qdrant finds chunks -> Drive provides full PDF -> Gemini analyzes full context

### Key Services

#### Smart Oracle (`backend/services/smart_oracle.py`)
- Retrieves full documents from Google Drive based on search relevance
- Feeds entire documents into Gemini 1.5 Flash for comprehensive analysis
- Eliminates "lost in middle" context problems common with chunking

#### Streaming Service (`backend/services/streaming_service.py`)
- Real-time token-by-token streaming via Server-Sent Events (SSE)
- Integrated with ZANTARA AI for responsive chat

#### Intelligent Router (`backend/services/intelligent_router.py`)
- Dynamically routes queries between:
  - **Fast Path:** Qdrant + Llama (Simple queries)
  - **Deep Path:** Smart Oracle + Gemini (Complex legal analysis)

## 📁 Directory Structure

```
apps/backend-rag/
├── backend/
│   ├── app/                    # FastAPI application
│   │   ├── main_cloud.py      # Main entry point
│   │   ├── routers/           # API endpoints (Oracle v5.3)
│   ├── services/              # Business logic
│   │   ├── smart_oracle.py    # Gemini + Drive Integration
│   │   ├── search_service.py  # Qdrant Search
│   │   └── ...
│   ├── core/                  # Core infrastructure
│   │   ├── qdrant_db.py      # Vector database client
│   │   └── embeddings.py     # Embedding generation
│   └── llm/
│       └── zantara_ai_client.py # OpenRouter Client
```

## 🔧 Configuration

### Environment Variables

```bash
# Google Gemini & Drive (Reasoning)
GOOGLE_API_KEY=your-gemini-api-key
GOOGLE_CREDENTIALS_JSON={...} # Service account JSON

# ZANTARA AI (OpenRouter - Conversation)
OPENROUTER_API_KEY_LLAMA=your-openrouter-api-key
ZANTARA_AI_MODEL=meta-llama/llama-4-scout

# Qdrant & Embeddings
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your-qdrant-api-key
OPENAI_API_KEY=your-openai-api-key # For embeddings only

# Infrastructure
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

## 🚀 API Endpoints

### Main Oracle Endpoint
- **POST** `/api/oracle/query`
- **Description**: Universal entry point for Hybrid RAG
- **Features**: Auto-routing between Llama/Gemini based on complexity

### Health & Monitoring
- **GET** `/healthz` - Service health check
- **GET** `/api/oracle/health` - RAG system status (Gemini/Drive/Qdrant)

## 🔄 Migration Status

### ✅ Completed Migrations
- **Reasoning**: Moved from Claude Haiku -> Gemini 1.5 Flash
- **Conversation**: Moved from direct APIs -> OpenRouter Gateway
- **Architecture**: Implemented "Ultra Hybrid" pattern (Drive + Vector)

## 📈 Performance

- **Smart Oracle**: <3s for full PDF analysis (Gemini)
- **Fast Search**: <500ms for Qdrant queries
- **Streaming**: <100ms Time-to-First-Token

---

**Last Updated**: November 2025
**Architecture Version**: 6.1 (Ultra Hybrid: Gemini + Qdrant)