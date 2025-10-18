# 🏗️ NUZANTARA - Current Architecture

**TRIPLE-AI System** - Pattern Matching + Claude Haiku + Claude Sonnet + DevAI

**Last Updated**: 2025-10-18
**Status**: ✅ Production

---

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    NUZANTARA Railway                        │
│                  Production Architecture                     │
└─────────────────────────────────────────────────────────────┘

         ┌──────────────┐
         │   User App   │
         │  (Frontend)  │
         └──────┬───────┘
                │
                ▼
    ┌───────────────────────┐
    │   Backend TypeScript  │──── apps/backend-ts/
    │   (Express Gateway)   │      Port 8080
    └───────────┬───────────┘
                │
                ▼
    ┌───────────────────────────────────┐
    │   Pattern Matching Router         │
    │   (Fast intent classification)    │
    └───────────┬───────────────────────┘
                │
        ┌───────┴────────┬──────────────┬──────────┐
        │                │              │          │
        ▼                ▼              ▼          ▼
   ┌────────┐      ┌─────────┐    ┌────────┐  ┌──────┐
   │ Haiku  │      │ Sonnet  │    │Sonnet+ │  │DevAI │
   │        │      │         │    │  RAG   │  │Qwen  │
   │Greeting│      │Business │    │Complex │  │Code  │
   │ 60%    │      │  35%    │    │  5%    │  │Internal
   └────────┘      └─────┬───┘    └────┬───┘  └──────┘
                         │             │
                         ▼             │
                    ┌────────────┐    │
                    │ Backend    │◄───┘
                    │ RAG Python │
                    │ Port 8000  │
                    └────────────┘
                    apps/backend-rag/
```

---

## 🎯 AI Routing Strategy

### Pattern Matching Classification (0ms, $0)
Fast, rule-based intent detection:

```typescript
// Keywords → Intent
"ciao", "hi", "hello" → greeting → Haiku
"kitas", "visa", "pt pma" → business → Sonnet + RAG
"bug", "fix", "code" → code → DevAI (internal only)
```

### AI Models

| Model | Use Case | Traffic | Cost/1M tokens | Latency |
|-------|----------|---------|----------------|---------|
| **Claude Haiku 3.5** | Greetings, casual chat | 60% | $0.25/$1.25 | 0.6s |
| **Claude Sonnet 4.5** | Business queries + RAG | 35% | $3/$15 | 1.2s |
| **DevAI Qwen 2.5** | Code analysis (internal) | <1% | $0 (self-hosted) | 1.5s |

**Monthly Cost**: $25-55 for 3,000 requests (optimal)

---

## 🔄 Request Flow

### Example 1: Greeting
```
User: "Ciao!"
  ↓
Pattern Match: "ciao" → greeting
  ↓
Route: Claude Haiku (fast, cheap)
  ↓
Response: "Ciao! 😊 Come posso aiutarti?"
  ↓
Latency: 0.6s | Cost: $0.0001
```

### Example 2: Business Query with RAG
```
User: "What is KITAS?"
  ↓
Pattern Match: "kitas" → business_simple
  ↓
RAG Backend: Search ChromaDB (7,300 docs)
  ↓
Context: Top 3 relevant chunks (compressed)
  ↓
Route: Claude Sonnet + RAG context
  ↓
Response: "KITAS (Kartu Izin Tinggal Terbatas) è un permesso..."
  ↓
Latency: 1.6s | Cost: $0.002
```

### Example 3: Complex Business Query
```
User: "I want to start a PT PMA, what are steps and costs?"
  ↓
Pattern Match: long query + "pt pma" → business_complex
  ↓
RAG Backend:
  - Search relevant docs
  - Get user memory
  - Load conversation history
  ↓
Route: Claude Sonnet + enriched context
  ↓
Response: Detailed answer with steps, costs, sources
  ↓
Latency: 2.5s | Cost: $0.005
```

---

## 🏗️ Backend Architecture

### Backend TypeScript (`apps/backend-ts/`)
**Role**: Gateway, routing, handlers, middleware

**Port**: 8080
**Language**: TypeScript
**Framework**: Express.js

**Key Components**:
```
apps/backend-ts/src/
├── index.ts              # Entry point
├── app-gateway/          # Request gateway
├── handlers/             # Business logic handlers
├── services/             # External services
├── middleware/           # Auth, rate limiting, etc.
├── routes/               # API routes
└── utils/                # Utilities
```

**Responsibilities**:
- HTTP request handling
- Pattern matching classification
- Route to appropriate AI
- Handler execution (email, calendar, memory)
- Authentication & authorization
- Rate limiting
- Logging & metrics

### Backend RAG Python (`apps/backend-rag/`)
**Role**: RAG orchestration, ChromaDB search, context enrichment

**Port**: 8000
**Language**: Python
**Framework**: FastAPI

**Key Components**:
```
apps/backend-rag/backend/
├── app/
│   ├── main_cloud.py              # Entry point
│   ├── services/
│   │   ├── intelligent_router.py  # AI routing logic
│   │   ├── claude_service.py      # Claude API
│   │   ├── chromadb_service.py    # Vector search
│   │   └── search_service.py      # RAG orchestration
│   └── routers/
│       ├── chat.py                # Chat endpoint
│       └── search.py              # Search endpoint
│
└── scripts/                       # Background jobs
    ├── llama_nightly_worker.py    # Daily batch processing
    └── modules/                   # Worker modules
```

**Responsibilities**:
- ChromaDB vector search (7,300+ docs)
- Context retrieval & compression
- Claude API calls (Haiku + Sonnet)
- Conversation memory management
- RAG result synthesis
- Background batch jobs (LLAMA)

---

## 🔐 Data Flow & Storage

### ChromaDB (Vector Database)
**Location**: Cloudflare R2 (persistent storage)
**Size**: ~72MB (7,300+ documents)
**Collections**:
- `bali_zero_knowledge` - Business documents
- `indonesia_regulations` - Legal/immigration docs
- `cultural_knowledge` - Indonesian cultural context

### PostgreSQL (Transactional Data)
**Provider**: Railway
**Tables**:
- `conversations` - Chat history
- `users` - User profiles
- `handler_executions` - Tool use logs
- `nightly_worker_runs` - Batch job tracking

### Redis (Cache)
**Provider**: Railway
**Purpose**: Session cache, response cache

---

## 🌙 Background Jobs (LLAMA)

**Important**: LLAMA is **NOT** used in the frontend. It runs only as background jobs.

### Job 1: Intel Classification
**Schedule**: Daily 2 AM UTC
**Script**: `apps/backend-rag/scripts/llama_batch_classifier.py`
**Purpose**: Classify unprocessed intel from scrapers

### Job 2: Nightly Worker
**Schedule**: Daily 3 AM UTC
**Script**: `apps/backend-rag/scripts/llama_nightly_worker.py`
**Purpose**:
1. Analyze last 7 days of queries
2. Cluster similar queries
3. Generate golden answers for top 50 clusters
4. Update cultural knowledge chunks

**Why LLAMA for batch?**
- Self-hosted (RunPod) = $0 API cost
- Fine-tuned for Indonesian context
- Good for structured/batch tasks
- Not exposed to users (quality doesn't matter as much)

---

## 🎛️ Configuration

### Environment Variables

**Backend TypeScript**:
```bash
PORT=8080
NODE_ENV=production
ANTHROPIC_API_KEY=sk-ant-...  # Claude API
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

**Backend RAG Python**:
```bash
PORT=8000
ANTHROPIC_API_KEY=sk-ant-...
CHROMADB_PATH=/app/chromadb
R2_BUCKET=zantara-chromadb
DATABASE_URL=postgresql://...
RUNPOD_LLAMA_ENDPOINT=...  # Background jobs only
RUNPOD_API_KEY=...
```

---

## 📊 Monitoring & Metrics

### Key Metrics
- **Latency**: P50, P95, P99 per route
- **Cost**: Claude API costs per day
- **Quality**: User satisfaction score
- **Errors**: 5xx rate, timeout rate

### Health Checks
- **Backend TS**: `GET /health` (port 8080)
- **Backend RAG**: `GET /health` (port 8000)
- **ChromaDB**: Document count check
- **Claude API**: Availability check

---

## 🔒 Security

### Authentication
- API key authentication for external requests
- JWT tokens for user sessions
- Service-to-service auth (Railway internal network)

### Rate Limiting
- Per-user: 60 requests/minute
- Per-IP: 100 requests/minute
- Global: 1000 requests/minute

### Data Privacy
- User data encrypted at rest (PostgreSQL)
- No PII in logs
- Claude API calls: No data retention (Anthropic policy)

---

## 🚀 Deployment

### Railway Services

**Service 1**: Backend TypeScript
- **Dockerfile**: `Dockerfile` (root)
- **Build**: `npm run build`
- **Start**: `npm start`
- **Health**: `/health`

**Service 2**: Backend RAG Python
- **Dockerfile**: `apps/backend-rag/backend/Dockerfile`
- **Build**: `pip install -r requirements.txt`
- **Start**: `uvicorn app.main_cloud:app`
- **Health**: `/health`

**Service 3**: PostgreSQL (managed by Railway)

**Service 4**: Redis (managed by Railway)

### Cron Jobs
Configured in `config/railway_cron.toml`:
- `llama_classification`: Daily 2 AM UTC
- `llama_nightly_worker`: Daily 3 AM UTC

---

## 📈 Scalability

### Current Limits
- **Max requests**: ~1,000/minute (rate limits)
- **Max concurrent**: 80 (Cloud Run concurrency)
- **ChromaDB size**: ~7,300 docs (can scale to 100K+)

### Scaling Strategy
- **Horizontal**: Add more Railway instances
- **Vertical**: Increase CPU/RAM per instance
- **Database**: PostgreSQL connection pooling (10 connections)
- **Cache**: Redis cluster (if needed)

---

## 🔄 Future Improvements

1. **Streaming responses** - Server-sent events for long answers
2. **Multi-language RAG** - Separate collections per language
3. **Fine-tuned classifier** - Replace pattern matching with ML
4. **Edge caching** - Cloudflare Workers for common queries
5. **A/B testing** - Route % traffic to different AI models

---

## 📚 Related Docs

- [AI_ROUTING.md](AI_ROUTING.md) - Detailed routing logic
- [BACKEND_TS.md](BACKEND_TS.md) - TypeScript backend details
- [BACKEND_RAG.md](BACKEND_RAG.md) - RAG backend details
- [MEMORY_SYSTEM.md](MEMORY_SYSTEM.md) - User memory system
- [../railway/RAILWAY_SERVICES_CONFIG.md](../railway/RAILWAY_SERVICES_CONFIG.md) - Deployment config

---

**Last Updated**: 2025-10-18
**Architecture Version**: 3.0 (TRIPLE-AI)
**Status**: ✅ Production Ready
