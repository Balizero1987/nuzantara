# NUZANTARA CODEBASE - MAPPA COMPLETA DELLA STRUTTURA

## Documento generato: 15 Nov 2025
**Repository:** https://github.com/Balizero1987/nuzantara  
**Live Site:** https://zantara.balizero.com  
**Piattaforma AI:** Llama 4 Scout (primary) + Claude Haiku 4.5 (fallback)

---

## PARTE 1: STRUTTURA GENERALE DELLE DIRECTORY

### Root Directory Structure
```
/home/user/nuzantara/
├── apps/                          # Applicazioni principali (10 servizi)
│   ├── backend-ts/               # Backend TypeScript principale (Node.js)
│   ├── backend-rag/              # Backend RAG Python (FastAPI)
│   ├── memory-service/           # Servizio memoria distribuito
│   ├── webapp/                   # Frontend principale (Vanilla JS)
│   ├── webapp-next/              # Prototype Next.js (WIP)
│   ├── bali-intel-scraper/       # Web scraper Python
│   ├── dashboard/                # Dashboard di monitoraggio
│   ├── qdrant-service/           # Servizio vector DB (Qdrant)
│   ├── publication/              # Sito documentazione (Astro)
│   └── vibe-dashboard/           # Dashboard alternativo (prototype)
├── .github/workflows/            # CI/CD pipelines
├── docs/                         # Documentazione del progetto
├── config/                       # Configurazioni globali
├── monitoring/                   # Stack di monitoraggio
├── chroma_data/                  # ChromaDB persistent data
├── oracle-data/                  # Oracle database exports
└── docker-compose.yml            # Orchestrazione locale
```

---

## PARTE 2: CONFIGURAZIONI FLY.IO IDENTIFICATE

### 2.1 App Fly.io Configurate

#### App 1: `nuzantara-rag` (PRINCIPALE)
- **Localizzazione:** `/home/user/nuzantara/fly.toml` (root)
- **Tipo:** Python FastAPI Backend
- **Porta:** 8000
- **Region:** Singapore (sin)
- **Memory:** 2GB
- **CPU:** 2 shared cores
- **Servizio Source:** `apps/backend-rag/`

```toml
[Configurazione]
app = 'nuzantara-rag'
primary_region = 'sin'
dockerfile = 'apps/backend-rag/Dockerfile.fly'
PORT = 8000
CHROMA_DB_PATH = '/data/chroma_db_FULL_deploy'
```

#### App 2: `nuzantara-backend`
- **Localizzazione:** `/home/user/nuzantara/apps/backend-ts/fly.toml`
- **Tipo:** TypeScript/Node.js Backend
- **Porta:** 8080
- **Region:** Singapore (sin)
- **Memory:** 1GB
- **CPU:** 1 shared core
- **Servizio Source:** `apps/backend-ts/`

```toml
[Configurazione]
app = 'nuzantara-backend'
primary_region = 'sin'
dockerfile = 'Dockerfile'
PORT = 8080
NODE_ENV = 'production'
```

#### App 3: `nuzantara-core` (da GitHub Actions)
- **Tipo:** Production deployment (Blue/Green)
- **Referenced in:** `.github/workflows/deploy-production.yml`
- **Target:** Load balancer principale

#### App 4: `nuzantara-staging`
- **Referenced in:** `.github/workflows/deploy-staging.yml`
- **Tipo:** Staging environment per pre-production testing

---

## PARTE 3: SERVIZI E APPLICAZIONI PRINCIPALI

### 3.1 Backend TypeScript (nuzantara-backend)

**Localizzazione:** `/home/user/nuzantara/apps/backend-ts/`

**Configurazione:**
- **Node.js Version:** 20.x
- **Runtime:** Express.js + TypeScript
- **Entry Point:** `src/server.ts`
- **Porta:** 8080
- **Dockerfile:** `Dockerfile` (Fly.io compatible)

**Struttura Main Source (`src/`):**
```
src/
├── server.ts              # ENTRY POINT - Express server principale
├── websocket.ts           # WebSocket handler
├── index.ts              # Export principale
├── agents/               # Agenti autonomi per cron jobs
├── services/             # 60+ servizi specializzati
│   ├── memory-service-client.ts      # Client per nuzantara-memory
│   ├── rag-warmup.ts                 # RAG pre-warming
│   ├── ragService.ts                 # RAG integration
│   ├── redis-client.ts               # Redis cache management
│   ├── chromadb-pool.ts              # ChromaDB connection pooling
│   ├── memory-vector.ts              # Vector embeddings
│   ├── cron-scheduler.ts             # CRON job scheduler
│   ├── firebase.ts                   # Firebase integration
│   ├── ai-communication.ts           # AI routing logic
│   ├── circuit-breaker.ts            # Circuit breaker pattern
│   ├── connection-pool.ts            # DB connection pool
│   └── [altri servizi...]            # Vedi lista completa sotto
├── routes/               # API route definitions
├── handlers/             # Request handlers (17 sottodirectory)
├── middleware/           # Express middleware
├── config/               # Environment & configuration
├── logging/              # Structured logging
└── types/                # TypeScript type definitions
```

**Servizi Critici in `src/services/`:**
```
services/ (60+ files)
├── AdvancedNLPSystem.ts          # NLP avanzato multilingue
├── MultiLanguageSystem.ts        # Sistema multilingua
├── ai-communication.ts           # Intelligente router AI
├── anti-hallucination.ts         # Hallucination prevention
├── audit-trail.ts                # Audit logging
├── chromadb-pool.ts              # Pool di connessioni ChromaDB
├── circuit-breaker.ts            # Pattern circuit breaker
├── connection-pool.ts            # DB connection pooling
├── cron-scheduler.ts             # Scheduler per job periodici
├── feature-flags.ts              # Feature flagging system
├── firebase.ts                   # Firebase authentication
├── google-auth-service.ts        # Google OAuth
├── jiwa-client.ts                # Jiwa integration
├── memory-analytics-client.ts    # Analytics per memoria
├── memory-cache.ts               # In-memory caching
├── memory-service-client.ts      # CLIENT per nuzantara-memory
├── memory-vector.ts              # Vector embeddings
├── oauth2-client.ts              # OAuth2 client
├── rag-warmup.ts                 # RAG pre-loading
├── ragService.ts                 # RAG service wrapper
├── redis-client.ts               # Redis async client
├── reality-anchor.ts             # Fact-checking service
├── streaming-service.ts          # Server-sent events
├── websocket-server.ts           # WebSocket handler
├── zantara-architect.ts          # Architecture orchestrator
├── zantara-router.ts             # Main request router
└── [altri...]
```

**Package Dependencies Principali:**
```json
{
  "node": "20.x",
  "express": "^5.1.0",
  "typescript": "^5.8.3",
  "chromadb": "^1.10.5",
  "ioredis": "^5.4.1",
  "pg": "^8.16.3",
  "jsonwebtoken": "^9.0.2",
  "@anthropic-ai/sdk": "^0.62.0",
  "@google/generative-ai": "^0.24.1",
  "node-cron": "^4.2.1",
  "firebase-admin": "^13.5.0",
  "axios": "^1.12.2",
  "zod": "^3.25.76"
}
```

---

### 3.2 Backend RAG Python (nuzantara-rag)

**Localizzazione:** `/home/user/nuzantara/apps/backend-rag/`

**Configurazione:**
- **Python Version:** 3.11+
- **Framework:** FastAPI
- **Entry Point:** `backend/app/main_cloud.py`
- **Porta:** 8000
- **Dockerfile:** `Dockerfile.fly`
- **Vector DB:** ChromaDB (persistent from R2)

**Struttura Main Source (`backend/app/`):**
```
backend/app/
├── main_cloud.py         # ENTRY POINT - FastAPI application
├── config.py             # Configuration (from fly.toml env vars)
├── models.py             # Pydantic models
├── dependencies.py       # Dependency injection
├── metrics.py            # Prometheus metrics
├── routers/              # API endpoints (23 files)
│   ├── agents.py         # Autonomous agents endpoints
│   ├── autonomous_agents.py
│   ├── conversations.py   # Conversation management
│   ├── crm_clients.py     # CRM client endpoints
│   ├── crm_interactions.py
│   ├── crm_practices.py
│   ├── crm_shared_memory.py
│   ├── handlers.py        # Request handlers
│   ├── health.py          # Health check endpoint
│   ├── ingest.py          # Data ingestion
│   ├── intel.py           # Intel processing
│   ├── memory_vector.py   # Vector memory operations
│   ├── notifications.py   # Notification system
│   ├── oracle_*.py        # Oracle database operations (6 files)
│   ├── search.py          # Search functionality
│   └── [altri...]
└── templates/            # HTML templates

backend/
├── agents/               # Autonomous agent logic
├── api/                  # API definitions
├── core/                 # Core business logic
├── db/                   # Database modules
├── kb/                   # Knowledge base
├── llm/                  # LLM integrations
│   └── llama_scout_client.py  # Llama 4 Scout client
├── middleware/           # FastAPI middleware
├── migrations/           # Database migrations
└── data/                 # Data processing
```

**AI System in `backend/llm/`:**
```
llm/
├── llama_scout_client.py      # PRIMARY: Llama 4 Scout via OpenRouter
├── claude_haiku_service.py    # FALLBACK: Claude Haiku 4.5
└── intelligent_router.py      # AI routing logic
```

**Package Requirements:**
```python
fastapi==0.115.4
uvicorn==0.35.0
pydantic==2.5.3
chromadb==0.4.22
anthropic==0.42.0
google-generativeai==0.3.2
psycopg2-binary==2.9.9
sqlalchemy==2.0.25
redis==5.0.6
sentence-transformers==3.0.0
```

---

### 3.3 Memory Service (nuzantara-memory)

**Localizzazione:** `/home/user/nuzantara/apps/memory-service/`

**Configurazione:**
- **Type:** TypeScript/Node.js
- **Purpose:** Distributed memory management
- **Entry Point:** `src/index.ts`
- **Porta:** Configurable
- **Storage:** PostgreSQL, Redis, ChromaDB, Neo4j support

**Struttura:**
```
memory-service/
├── src/
│   ├── index.ts           # ENTRY POINT
│   ├── analytics.ts       # Analytics processing
│   ├── fact-extraction.ts # Extract facts from text
│   └── summarization.ts   # Text summarization
├── package.json
├── Dockerfile             # Multi-stage build
└── README.md
```

**Purpose:** Standalone memory microservice per gestione distribuita di:
- Conversation history
- Vector embeddings
- Knowledge graphs
- User preferences
- Context management

---

### 3.4 Frontend Webapp (nuzantara-webapp)

**Localizzazione:** `/home/user/nuzantara/apps/webapp/`

**Configurazione:**
- **Framework:** Vanilla JavaScript + HTML/CSS
- **Build Tool:** Vite
- **Testing:** Playwright
- **Hosting:** GitHub Pages (auto-deploy)
- **Custom Domain:** zantara.balizero.com
- **Bundle Size:** 192KB (optimized)

**Struttura:**
```
webapp/
├── index.html             # Main entry point
├── login.html             # Login page
├── chat.html              # Chat interface
├── src/
│   ├── components/        # React/JS components
│   ├── pages/             # Page logic
│   └── assets/            # CSS, images
├── js/                    # JavaScript modules
├── css/                   # Stylesheets
├── assets/                # Static assets
├── config/                # Frontend configuration
├── package.json           # Dependencies (React 18.2.0, Vite)
└── playwright.config.js   # E2E test configuration
```

**Deploy Strategy:**
- GitHub Actions auto-deploys on push to `apps/webapp`
- Target: GitHub Pages CDN
- Custom domain via Cloudflare

---

### 3.5 Backend RAG Data Structure

**Localizzazione:** `/home/user/nuzantara/apps/backend-rag/backend/`

**Subdirectories:**
```
backend/
├── app/                   # FastAPI application (23 routers)
├── agents/                # Autonomous agent implementations
├── api/                   # REST API definitions
├── core/                  # Core business logic
├── data/                  # Data processing pipelines
├── db/                    # Database layer
├── kb/                    # Knowledge base operations
├── llm/                   # LLM client implementations
├── middleware/            # FastAPI middleware
├── migrations/            # Alembic migrations
└── services/              # Business services (18+ files)
    ├── search_service.py
    ├── collaborator_service.py
    ├── memory_service_postgres.py
    ├── conversation_service.py
    ├── emotional_attunement.py
    ├── tool_executor.py
    ├── health_monitor.py
    ├── chromadb_backup.py
    └── [altri servizi...]
```

---

## PARTE 4: DATABASE E SERVIZI INFRASTRUTTURALI

### 4.1 PostgreSQL (nuzantara-postgres)

**Localizzazione:** Docker service in `docker-compose.yml`

**Configurazione:**
```yaml
service: postgres
image: postgres:15-alpine
port: 5432
environment:
  POSTGRES_USER: zantara
  POSTGRES_PASSWORD: zantara_dev
  POSTGRES_DB: zantara_db
volume: postgres_data:/var/lib/postgresql/data
```

**Ruolo:** Database primario per:
- User authentication
- Conversation history
- Business data
- Application state

**Connection:** `postgresql://zantara:zantara_dev@postgres:5432/zantara_db`

---

### 4.2 Redis (Cache & Session Store)

**Localizzazione:** Docker service in `docker-compose.yml`

**Configurazione:**
```yaml
service: redis
image: redis:7-alpine
port: 6379
environment:
  REDIS_PASSWORD: redis_dev
volume: redis_data:/data
```

**Ruolo:** Cache e session management:
- Request rate limiting
- Session caching
- Temporary data storage
- Pub/Sub messaging

---

### 4.3 ChromaDB (Vector Database)

**Localizzazione:** 
- Docker service: `docker-compose.yml`
- Persistent data: `/home/user/nuzantara/chroma_data/`
- Fly.io mount: `/data/chroma_db_FULL_deploy`

**Configurazione:**
```yaml
service: chromadb
image: chromadb/chroma:latest
port: 8000
environment:
  IS_PERSISTENT: "TRUE"
volume: chromadb_data:/chroma/chroma
```

**Ruolo:** Vector database per RAG:
- Document embeddings
- Similarity search
- Knowledge base queries
- Semantic retrieval

---

### 4.4 Qdrant (Vector Search Alternative)

**Localizzazione:** `/home/user/nuzantara/apps/qdrant-service/`

**Configurazione:**
- Minimal Dockerfile per deployment
- Port: Default 6333
- Purpose: Alternative vector DB option

---

## PARTE 5: MAPPATURA SERVIZI ↔ FLY.IO

### Correlazione tra Directory e App Fly.io

```
┌─────────────────────────────────────────────────────────────────┐
│                    SERVIZI MAPPATI                              │
├─────────────────────────────────────────────────────────────────┤
│ DIRECTORY           │ FLY APP             │ TECNOLOGIA │ PORT   │
├─────────────────────┼─────────────────────┼────────────┼────────┤
│ apps/backend-ts/    │ nuzantara-backend   │ Node.js/TS │ 8080   │
│ apps/backend-rag/   │ nuzantara-rag       │ Python/FP  │ 8000   │
│ apps/memory-service │ NOT ON FLY.IO       │ Node.js/TS │ N/A    │
│ apps/webapp/        │ GitHub Pages        │ JS/Vite    │ N/A    │
│ apps/publication/   │ Cloudflare Pages    │ Astro      │ N/A    │
│ apps/dashboard/     │ NOT ON FLY.IO       │ JS Vanilla │ N/A    │
│ apps/bali-scraper/  │ NOT ON FLY.IO       │ Python     │ N/A    │
│ apps/qdrant-service │ NOT ON FLY.IO       │ Docker     │ 6333   │
│ apps/vibe-dashboard │ PROTOTYPE (WIP)     │ N/A        │ N/A    │
│ apps/webapp-next/   │ PROTOTYPE (WIP)     │ Next.js    │ N/A    │
└─────────────────────┴─────────────────────┴────────────┴────────┘
```

### Interpretazione di Nomi Servizi Comuni

| Nome Genericato | Mappatura Reale | Localizzazione |
|-----------------|-----------------|-----------------|
| `nuzantara-memory` | memory-service | `/apps/memory-service/` |
| `nuzantara-postgres` | PostgreSQL DB | Docker (docker-compose.yml) |
| `bali-zero-db` | Riferimento generico a database | PostgreSQL + Redis + ChromaDB |
| `nuzantara-backend` | backend-ts | `/apps/backend-ts/` |
| `nuzantara-rag` | backend-rag | `/apps/backend-rag/` |
| `nuzantara-webapp` | webapp | `/apps/webapp/` |

---

## PARTE 6: CONFIGURAZIONI SPECIFICHE PER APP

### 6.1 nuzantara-backend (TypeScript)

**fly.toml Completo:**
```toml
app = 'nuzantara-backend'
primary_region = 'sin'
kill_signal = 'SIGTERM'
kill_timeout = '30s'

[build]
  dockerfile = 'Dockerfile'

[deploy]
  strategy = 'rolling'

[env]
  NODE_ENV = 'production'
  PORT = '8080'

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = 'off'
  auto_start_machines = true
  min_machines_running = 1
  processes = ['app']

  [[http_service.checks]]
    interval = '30s'
    timeout = '5s'
    grace_period = '1m0s'
    method = 'GET'
    path = '/health'

[[vm]]
  memory = '1gb'
  cpu_kind = 'shared'
  cpus = 1
```

**Environment Variables Richiesti:**
```
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://password@host:6379
JWT_SECRET=<secret>
LOG_LEVEL=info
CORS_ORIGINS=https://zantara.balizero.com
NODE_ENV=production
```

---

### 6.2 nuzantara-rag (Python)

**fly.toml Completo:**
```toml
app = 'nuzantara-rag'
primary_region = 'sin'
kill_signal = 'SIGTERM'
kill_timeout = '30s'

[build]
  dockerfile = 'apps/backend-rag/Dockerfile.fly'

[env]
  CHROMA_DB_PATH = '/data/chroma_db_FULL_deploy'
  EMBEDDING_DIMENSIONS = '1536'
  EMBEDDING_MODEL = 'text-embedding-3-small'
  EMBEDDING_PROVIDER = 'openai'
  NODE_ENV = 'production'
  PORT = '8000'

[[mounts]]
  source = 'chroma_data'
  destination = '/data/chroma_db_FULL_deploy'

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = 'off'
  auto_start_machines = true
  min_machines_running = 1
  processes = ['app']

  [[http_service.checks]]
    interval = '30000s'
    timeout = '5000s'
    grace_period = '1m0s'
    method = 'GET'
    path = '/health'

[[vm]]
  memory = '2gb'
  cpu_kind = 'shared'
  cpus = 2
```

**Environment Variables Richiesti:**
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_PROVIDER=openai
```

---

## PARTE 7: ENTRY POINTS E COMANDI DI AVVIO

### Backend TypeScript
```bash
# Development
cd apps/backend-ts
npm install
npm run dev

# Production (Docker)
docker build -t nuzantara-backend .
docker run -p 8080:8080 nuzantara-backend

# Fly.io Deploy
flyctl deploy --app nuzantara-backend
```

**Entrypoint Script:**
```bash
npx tsx src/server.ts
```

---

### Backend RAG Python
```bash
# Development
cd apps/backend-rag
pip install -r requirements-minimal.txt
uvicorn backend.app.main_cloud:app --reload --host 0.0.0.0 --port 8000

# Production (Docker)
docker build -f Dockerfile.fly -t nuzantara-rag .
docker run -p 8000:8000 nuzantara-rag

# Fly.io Deploy
flyctl deploy --app nuzantara-rag
```

**Entrypoint Script:**
```bash
uvicorn main_cloud:app --host 0.0.0.0 --port 8000
```

---

### Memory Service
```bash
# Development
cd apps/memory-service
npm install
npm run dev

# Production Build
npm run build
npm start
```

**Entrypoint:**
```bash
node dist/index.js
```

---

### Frontend Webapp
```bash
# Development
cd apps/webapp
npm install
npm run dev

# Build (for GitHub Pages)
npm run build

# GitHub Pages Deploy (automatic on push)
git push origin main
```

---

## PARTE 8: INTEGRAZIONI TRA SERVIZI

### 8.1 Backend TypeScript → Memory Service
```typescript
// apps/backend-ts/src/services/memory-service-client.ts
import { MemoryServiceClient } from './memory-service-client';

const memoryClient = new MemoryServiceClient(
  process.env.MEMORY_SERVICE_URL || 'http://localhost:9000'
);

// Uso
await memoryClient.storeConversation(userId, messages);
const context = await memoryClient.retrieveContext(userId, query);
```

### 8.2 Backend TypeScript → Backend RAG
```typescript
// apps/backend-ts/src/services/ragService.ts
const ragBackend = `${process.env.RAG_BACKEND_URL || 'http://localhost:8000'}`;

// Streaming RAG response
const response = await fetch(`${ragBackend}/bali-zero/chat-stream`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, context })
});
```

### 8.3 Database Connections
```typescript
// Backend TypeScript
import { Pool } from 'pg';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Backend RAG
import sqlalchemy
engine = sqlalchemy.create_engine(os.getenv("DATABASE_URL"))
```

### 8.4 Redis Cache
```typescript
// Multi-service cache
import { createClient } from 'redis';
const redis = createClient({
  url: process.env.REDIS_URL
});
```

---

## PARTE 9: DEPLOYMENT STRATEGIES

### GitHub Actions Workflows

**File:** `.github/workflows/`

| Workflow | Target | Trigger |
|----------|--------|---------|
| `deploy-pages.yml` | GitHub Pages | Push to `apps/webapp` |
| `deploy-staging.yml` | nuzantara-staging (Fly.io) | Manual/PR |
| `deploy-production.yml` | nuzantara-core (Blue/Green) | Push to `main` |
| `ci.yml` | Build verification | All PRs |
| `ci-enhanced.yml` | Extended testing | All PRs |
| `rollback.yml` | Rollback production | Manual |

---

## PARTE 10: MONITORING E LOGGING

### Monitoring Stack
```
monitoring/
├── docker-compose.yml          # Monitoring services
├── prometheus/                 # Metrics collection
├── grafana/                    # Dashboard visualization
└── loki/                       # Log aggregation
```

**Metriche Raccolte:**
- Request latency
- Error rates
- Cache hit/miss ratios
- Database connection pool status
- Vector DB performance
- AI model response times

---

## PARTE 11: TECHNOLOGIE UTILIZZATE

### Frontend
- **Languages:** JavaScript (ES6+), HTML5, CSS3
- **Framework:** Vanilla JS (primary), React 18.2 (prototype)
- **Build:** Vite 5.0
- **Testing:** Playwright
- **Hosting:** GitHub Pages + Cloudflare

### Backend
- **Languages:** TypeScript, Python 3.11+
- **Frameworks:** Express.js 5.1, FastAPI 0.115
- **Runtime:** Node.js 20.x
- **Vector DB:** ChromaDB 1.10, Qdrant
- **Caching:** Redis 7, Node Cache, IoRedis
- **Database:** PostgreSQL 15, SQLAlchemy
- **Authentication:** JWT, Firebase, OAuth2, Google Auth

### AI/LLM
- **Primary:** Llama 4 Scout via OpenRouter ($0.20/$0.20 per 1M tokens)
- **Fallback:** Claude Haiku 4.5 via Anthropic ($1/$5 per 1M tokens)
- **Embeddings:** OpenAI text-embedding-3-small (1536 dimensions)
- **RAG:** ChromaDB + Semantic search
- **Context:** 10M tokens (Llama) vs 200K (Haiku)

### DevOps
- **Container:** Docker + Docker Compose
- **Orchestration:** Fly.io (Platform as a Service)
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana + Loki
- **Logging:** Winston + Loguru + Loki

---

## PARTE 12: SUMMARY - DIRECTORY TO FLY APP MAPPING

```
COMPLETE MAPPING:

/home/user/nuzantara/
│
├── apps/backend-ts/              → Fly.io: nuzantara-backend (Port 8080)
│   └── src/server.ts             → Entry point: Node.js/Express
│
├── apps/backend-rag/             → Fly.io: nuzantara-rag (Port 8000)
│   └── backend/app/main_cloud.py → Entry point: FastAPI/Python
│
├── apps/memory-service/          → Microservice (Port variable)
│   └── src/index.ts              → Entry point: Express/Memory DB
│
├── apps/webapp/                  → GitHub Pages (zantara.balizero.com)
│   └── index.html                → Frontend entry
│
├── apps/publication/             → Cloudflare Pages (Astro)
│   └── src/                      → Documentation site
│
├── apps/bali-intel-scraper/      → Standalone Python service
│   └── scripts/                  → Web scraping automation
│
├── apps/dashboard/               → Vanilla JS Dashboard
│   └── index.html                → Monitoring dashboard
│
├── apps/qdrant-service/          → Vector DB (Port 6333)
│   └── Dockerfile                → Container definition
│
├── postgres (docker-compose)     → Database: PostgreSQL 15
├── redis (docker-compose)        → Cache: Redis 7
├── chromadb (docker-compose)     → Vector DB: ChromaDB
│
└── fly.toml (root)               → Configuration for nuzantara-rag
    fly.toml (backend-ts/)        → Configuration for nuzantara-backend
```

---

## PARTE 13: QUICK REFERENCE - COMMON TASKS

### Deploy New Service
1. Create directory in `/apps/new-service/`
2. Create `Dockerfile` (if Fly.io deployable)
3. Create optional `fly.toml` for Fly.io configuration
4. Add to `docker-compose.yml` for local development
5. Update GitHub Actions workflow for CI/CD

### Add Environment Variable
- **Fly.io Apps:** Use `flyctl secrets set KEY=VALUE`
- **Local Development:** Add to `.env` or `docker-compose.yml`
- **GitHub Actions:** Add to repository secrets

### Deploy to Fly.io
```bash
# Deploy backend
cd apps/backend-ts && flyctl deploy

# Deploy RAG
cd apps/backend-rag && flyctl deploy

# View logs
flyctl logs --app nuzantara-backend
flyctl logs --app nuzantara-rag
```

### Local Development (All Services)
```bash
# Start all services
docker-compose up -d

# Logs
docker-compose logs -f

# Access services
# Backend TS: http://localhost:8080
# Backend RAG: http://localhost:8000
# Frontend: http://localhost:3000
# PostgreSQL: localhost:5432
# Redis: localhost:6379
# ChromaDB: http://localhost:8000
```

---

**Generated by:** Claude Code (Anthropic)  
**Date:** November 15, 2025  
**Repository:** https://github.com/Balizero1987/nuzantara
