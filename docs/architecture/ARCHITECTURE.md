# ZANTARA / NUZANTARA Architecture

## Overview

ZANTARA is a comprehensive AI assistant system for Bali Zero, providing intelligent chat, knowledge retrieval, and business services through a clean, modular architecture.

## System Components

### 1. Frontend (apps/webapp)
- **Deployment**: GitHub Pages (`zantara.balizero.com`)
- **Technology**: Vanilla JavaScript (ES6 modules)
- **Pages**:
  - `login.html` - Team authentication (email + PIN)
  - `chat.html` - Main chat interface with SSE streaming
- **Key Features**:
  - Server-Sent Events (SSE) for real-time streaming
  - JWT token-based authentication (localStorage)
  - System handlers/tools integration
  - Collective memory and CRM integration
  - PWA support (service workers)

### 2. Backend TypeScript (apps/backend-ts)
- **Deployment**: Fly.io (`nuzantara-backend.fly.dev`)
- **Technology**: Node.js + Express + TypeScript
- **Key Responsibilities**:
  - REST API endpoints (`/api/*`)
  - RPC-style handler system (`/call` endpoint)
  - SSE proxy to RAG backend
  - Team authentication (`/api/auth/team/login`)
  - Google Workspace integration
  - CRM and analytics services
  - Persistent memory management
- **Database**: PostgreSQL (via Fly.io Postgres)
- **Cache**: Redis (optional, for performance)

### 3. Backend RAG (apps/backend-rag)
- **Deployment**: Fly.io (`nuzantara-rag.fly.dev`)
- **Technology**: Python 3.11 + FastAPI
- **Key Responsibilities**:
  - RAG (Retrieval-Augmented Generation) queries
  - Chat streaming via SSE (`/bali-zero/chat-stream`)
  - ZANTARA AI integration (via OpenRouter)
  - Vector search (Qdrant)
  - Team member knowledge base
  - Pricing and business services tools
- **AI Engine**: ZANTARA AI (configurable via `ZANTARA_AI_MODEL`, default: `meta-llama/llama-4-scout`)
- **Vector DB**: Qdrant (`nuzantara-qdrant.fly.dev`)
- **Embeddings**: OpenAI `text-embedding-3-small` (1536 dimensions)
- **Memory**: PostgreSQL (user profiles, conversation summaries)

### 4. Memory Service (apps/memory-service)
- **Deployment**: Fly.io (`nuzantara-memory.fly.dev`)
- **Technology**: Node.js + TypeScript
- **Key Responsibilities**:
  - Persistent conversation storage
  - User memory management
  - Collective memory insights

## Data Flow

### Chat Flow
1. User sends message in `chat.html`
2. Frontend → Backend TS (`/api/v2/bali-zero/chat-stream` or `/bali-zero/chat-stream`)
3. Backend TS → Backend RAG (`/bali-zero/chat-stream` via SSE proxy)
4. Backend RAG:
   - Queries Qdrant for relevant context
   - Calls ZANTARA AI (OpenRouter) with context
   - Streams response back via SSE
5. Frontend displays streaming tokens in real-time

### Authentication Flow
1. User enters email + PIN in `login.html`
2. Frontend → Backend TS (`/api/auth/team/login`)
3. Backend TS validates credentials and returns JWT token
4. Frontend stores token in `localStorage` as `zantara-token`
5. All subsequent requests include token in `Authorization: Bearer <token>` header

### Tools/Handlers Flow
1. Frontend calls `SystemHandlersClient.getTools()`
2. Frontend → Backend TS (`POST /call` with `{ key: 'system.handlers.tools' }`)
3. Backend TS returns available tools (e.g., `search_team_member`, `get_pricing`)
4. Frontend includes tools in `handlers_context` when sending chat messages
5. Backend RAG uses tools as needed during AI generation

## Configuration

### Environment Variables

#### Backend TypeScript
- `PORT`: Server port (default: 8080)
- `RAG_BACKEND_URL`: RAG backend URL (default: `https://nuzantara-rag.fly.dev`)
- `OPENROUTER_API_KEY`: OpenRouter API key for ZANTARA AI
- `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`: Google Workspace OAuth (optional)

#### Backend RAG
- `OPENAI_API_KEY`: OpenAI API key for embeddings
- `OPENROUTER_API_KEY_LLAMA`: OpenRouter API key for ZANTARA AI
- `ZANTARA_AI_MODEL`: AI model identifier (default: `meta-llama/llama-4-scout`)
- `QDRANT_URL`: Qdrant vector database URL (default: `https://nuzantara-qdrant.fly.dev`)
- `DATABASE_URL`: PostgreSQL connection string (for memory service)

## Key Endpoints

### Frontend
- `/login.html` - Login page
- `/chat.html` - Chat interface

### Backend TypeScript
- `GET /health` - Health check
- `GET /metrics` - Performance metrics
- `POST /call` - RPC-style handler execution
- `POST /api/auth/team/login` - Team authentication
- `GET /api/v2/bali-zero/chat-stream` - SSE chat streaming (proxied to RAG)
- `GET /bali-zero/chat-stream` - Alias for above

### Backend RAG
- `GET /health` - Health check
- `GET /bali-zero/chat-stream` - SSE chat streaming (main endpoint)
- `POST /api/rag/query` - RAG query endpoint
- `POST /api/rag/search` - Semantic search

## Storage

### Vector Database (Qdrant)
- **URL**: `https://nuzantara-qdrant.fly.dev`
- **Collection**: `knowledge_base`
- **Embeddings**: OpenAI `text-embedding-3-small` (1536 dim)
- **Content**: Immigration, visas, company setup, tax, legal, cultural knowledge

### PostgreSQL
- **Purpose**: User memory, conversation history, CRM data
- **Schema**: Managed via migrations in `apps/backend-rag/backend/db/migrations/`
- **Key Tables**:
  - `user_memory` - User profile facts and summaries
  - `conversations` - Chat history
  - `crm_*` - CRM system tables

## Removed/Legacy Components

The following components have been removed as part of the cleanup:
- **AMBARADAM** identity system (legacy)
- Multi-level access controls tied to esoteric tiers (legacy)
- **Demo authentication** (`/api/auth/demo` endpoint)
- **Cloudflare Pages** deployment (migrated to GitHub Pages)
- **login-react.html** (replaced with vanilla JS `login.html`)
- **ZANTARA v3 endpoints** (`/zantara.unified`, `/zantara.collective`, `/zantara.ecosystem`)
- **ChromaDB** (migrated to Qdrant)
- **Firebase** (migrated to PostgreSQL)
- **Anthropic/Claude direct integration** (replaced with ZANTARA AI via OpenRouter)
- **Google Cloud Run** URLs (migrated to Fly.io)

## Development

### Local Development
- Frontend: Serve `apps/webapp` with any static server (e.g., `python -m http.server 3000`)
- Backend TS: `cd apps/backend-ts && npm run dev` (port 8080)
- Backend RAG: `cd apps/backend-rag && uvicorn main_cloud:app --reload` (port 8000)

### Deployment
- Frontend: GitHub Actions → GitHub Pages
- Backend TS: Fly.io (`flyctl deploy --app nuzantara-backend`)
- Backend RAG: Fly.io (`flyctl deploy --app nuzantara-rag`)
- Memory Service: Fly.io (`flyctl deploy --app nuzantara-memory`)

## Notes

- All backend URLs use Fly.io (`.fly.dev` domain)
- No hardcoded URLs - all use environment variables or centralized config
- ZANTARA AI is model-agnostic - switch models via `ZANTARA_AI_MODEL` env var
- System is designed for scalability and easy maintenance
