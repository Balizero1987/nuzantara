# 📊 Analisi Struttura Repository NUZANTARA

**Data Analisi**: 2025-11-08  
**Versione Repository**: v5.2.0  
**Branch Corrente**: `cursor/analizza-struttura-repository-attuale-cddb`

---

## 🎯 Panoramica Generale

**NUZANTARA** (ZANTARA AI Platform) è una piattaforma di Business Intelligence e Legal Advisory per il mercato indonesiano, basata su architettura multi-servizio con AI avanzata.

### Caratteristiche Principali
- **Piattaforma AI**: Llama 4 Scout (primario) + Claude Haiku 4.5 (fallback)
- **Knowledge Base**: 25,422 documenti indicizzati in ChromaDB
- **Deployment**: Fly.io (backend) + Cloudflare Pages (frontend)
- **Stack**: TypeScript/Node.js + Python/FastAPI + React
- **Status**: 🟢 Production Ready (9/38 features implementate - 23.7%)

---

## 📁 Struttura Directory Principale

```
/workspace/
├── apps/                          # Applicazioni principali
│   ├── backend-rag/               # Backend Python RAG (FastAPI)
│   ├── backend-ts/                 # Backend TypeScript (Express)
│   ├── webapp/                    # Frontend React (production)
│   ├── webapp-next/               # Frontend Next.js (enhanced)
│   ├── dashboard/                 # Dashboard amministrativa
│   ├── memory-service/            # Servizio memoria/conversazioni
│   ├── publication/               # Sito Astro per pubblicazioni
│   ├── qdrant-service/            # Servizio vector DB alternativo
│   └── vibe-dashboard/            # Dashboard analytics
│
├── docs/                          # Documentazione completa
│   ├── architecture/              # Documenti architettura
│   ├── guides/                    # Guide operative
│   ├── reports/                   # Report e analisi
│   ├── sessions/                  # Log sessioni sviluppo
│   └── legal/                     # Documenti legali
│
├── scripts/                       # Script di automazione
│   ├── migrations/                # Script migrazione database
│   ├── monitoring/                # Script monitoraggio
│   ├── plugins/                   # Generazione documentazione
│   └── disaster-recovery/         # Backup e restore
│
├── config/                        # File di configurazione
├── monitoring/                    # Configurazione monitoring
├── docker/                        # Config Docker
├── gateway/                       # API Gateway
├── shared/                        # Codice condiviso
├── code/                          # Codice legacy/migrazione
├── benchmarks/                    # Benchmark e test performance
├── oracle-data/                   # Dati oracle/legali
├── chroma_data/                   # Dati ChromaDB locali
└── tmp/                           # File temporanei
```

---

## 🏗️ Architettura Applicazioni

### 1. **Backend TypeScript** (`apps/backend-ts/`)

**Stack Tecnologico:**
- **Runtime**: Node.js 20
- **Framework**: Express.js 5.1.0
- **Linguaggio**: TypeScript 5.8.3
- **Database**: PostgreSQL (via `pg`), Redis (via `ioredis`)
- **AI**: Anthropic SDK, OpenAI SDK, Google Generative AI
- **Autenticazione**: JWT (jsonwebtoken), bcrypt
- **Monitoring**: Prometheus (prom-client), Winston logging
- **WebSocket**: Socket.io, ws

**Struttura Sorgente:**
```
apps/backend-ts/
├── src/
│   ├── server.ts                  # Entry point principale
│   ├── routes/                    # Route handlers
│   ├── handlers/                  # Business logic handlers
│   ├── middleware/                # Express middleware
│   ├── services/                  # Servizi business
│   ├── agents/                    # Sistema agenti AI
│   ├── utils/                     # Utility functions
│   └── types/                     # TypeScript types
├── tests/                         # Test suite
├── config/                        # Configurazioni
├── migrations/                    # Database migrations
└── metrics/                       # Metriche Prometheus
```

**Endpoints Principali:**
- `/health` - Health check
- `/metrics` - Prometheus metrics
- `/api/v3/zantara/unified` - Unified knowledge query
- `/api/v3/zantara/collective` - Collective intelligence
- `/api/v3/zantara/ecosystem` - Business ecosystem analysis
- `/api/auth/team/*` - Team authentication
- `/api/v2/bali-zero/*` - Business services
- `/cache/*` - Redis cache management

**Deployment:**
- **Platform**: Fly.io (Singapore)
- **Machine**: 2 CPU cores, 2GB RAM
- **URL**: https://nuzantara-backend.fly.dev
- **Port**: 8080

---

### 2. **Backend RAG Python** (`apps/backend-rag/`)

**Stack Tecnologico:**
- **Runtime**: Python 3.11+
- **Framework**: FastAPI 0.109.0
- **Vector DB**: ChromaDB 0.4.22
- **Embeddings**: OpenAI text-embedding-3-small (1536 dim) + Sentence-Transformers
- **AI**: OpenAI SDK, LangChain
- **Database**: PostgreSQL (asyncpg), Redis (asyncio)
- **Document Processing**: PyPDF2, BeautifulSoup4, ebooklib

**Struttura Sorgente:**
```
apps/backend-rag/
├── backend/
│   ├── app/
│   │   ├── main_cloud.py          # Entry point FastAPI
│   │   ├── routes/                 # API routes
│   │   ├── services/               # Business services
│   │   ├── agents/                 # Agent system
│   │   ├── models/                 # Data models
│   │   └── utils/                  # Utilities
│   └── ...
├── api/                            # API layer
├── scripts/                        # Utility scripts
├── tests/                          # Test suite
├── chroma_db_FULL_deploy/          # ChromaDB data (10GB volume)
└── requirements-*.txt              # Dipendenze Python
```

**Knowledge Collections (25,422 documenti):**
1. `knowledge_base` - 8,923 docs (Blockchain, Whitepaper, Satoshi)
2. `kbli_unified` - 8,887 docs (KBLI 2020 Business Classification)
3. `legal_unified` - 5,041 docs (Indonesian Laws & Regulations)
4. `visa_oracle` - 1,612 docs (Immigration & Visa Intelligence)
5. `tax_genius` - 895 docs (Tax Framework & Calculations)
6. `property_unified` - 29 docs (Property Investment)
7. `bali_zero_pricing` - 29 docs (Service Pricing)
8. `property_listings` - 2 docs
9. `tax_updates` - 2 docs
10. `legal_updates` - 2 docs

**Deployment:**
- **Platform**: Fly.io (Singapore)
- **Machine**: 2 CPU cores, 2GB RAM
- **Volume**: 10GB (chroma_data)
- **URL**: https://nuzantara-rag.fly.dev
- **Port**: 8000
- **Docs**: https://nuzantara-rag.fly.dev/docs

---

### 3. **Frontend Webapp** (`apps/webapp/`)

**Stack Tecnologico:**
- **Framework**: React 18+ (Vanilla JS + HTML5/CSS3)
- **Build**: Vite (presumibilmente)
- **Deployment**: Cloudflare Pages
- **Bundle Size**: 192KB (ottimizzato da 1.3MB)

**Caratteristiche:**
- Progressive Web App (PWA)
- Server-Sent Events (SSE) per streaming
- Real-time updates via WebSocket
- Responsive design

**Deployment:**
- **Platform**: Cloudflare Pages
- **URL**: https://zantara.balizero.com
- **CDN**: Cloudflare global edge network
- **HTTPS**: Enforced

---

### 4. **Frontend Next.js** (`apps/webapp-next/`)

**Stack Tecnologico:**
- **Framework**: Next.js
- **Status**: Enhanced version (in sviluppo)

**Struttura:**
```
apps/webapp-next/
├── design-v4/                     # Design v4
├── components/                     # React components
└── pages/                         # Next.js pages
```

---

### 5. **Altri Servizi**

**Dashboard** (`apps/dashboard/`)
- Dashboard amministrativa semplice
- HTML/CSS/JS vanilla

**Memory Service** (`apps/memory-service/`)
- Servizio gestione memoria conversazioni
- TypeScript-based

**Publication** (`apps/publication/`)
- Sito Astro per pubblicazioni
- 36 file (13 JPG, 12 Astro, 3 JSON)

**Qdrant Service** (`apps/qdrant-service/`)
- Servizio alternativo per vector database
- Configurazione Qdrant

---

## 🛠️ Stack Tecnologico Completo

### Backend
| Componente | Tecnologia | Versione |
|------------|-----------|----------|
| **Runtime TS** | Node.js | 20 |
| **Framework TS** | Express.js | 5.1.0 |
| **Runtime Python** | Python | 3.11+ |
| **Framework Python** | FastAPI | 0.109.0 |
| **ASGI Server** | Uvicorn | 0.27.0 |
| **Database** | PostgreSQL | 15 |
| **Cache** | Redis | 7/8 |
| **Vector DB** | ChromaDB | 0.4.22 |

### Frontend
| Componente | Tecnologia | Versione |
|------------|-----------|----------|
| **Framework** | React | 18+ |
| **Framework Alt** | Next.js | Latest |
| **Build Tool** | Vite | Latest |
| **Styling** | CSS3/Tailwind | - |

### AI & ML
| Componente | Tecnologia | Versione |
|------------|-----------|----------|
| **Primary AI** | Llama 4 Scout | via OpenRouter |
| **Fallback AI** | Claude Haiku 4.5 | 0.62.0 |
| **Embeddings** | OpenAI | text-embedding-3-small |
| **Embeddings Local** | Sentence-Transformers | 2.3.1 |
| **LangChain** | LangChain | 0.1.6 |

### Infrastructure
| Componente | Tecnologia | Versione |
|------------|-----------|----------|
| **Container** | Docker | Latest |
| **Orchestration** | Docker Compose | 3.9 |
| **Cloud Platform** | Fly.io | Latest |
| **CDN** | Cloudflare | - |
| **Monitoring** | Prometheus | 15.1.0 |
| **Logging** | Winston | 3.18.3 |

---

## 📚 Documentazione

### Struttura Documentazione

**Documenti Principali (Root):**
- `README.md` - Overview progetto
- `START_HERE.md` - Guida quick start
- `PROJECT_CONTEXT.md` - Contesto e architettura
- `CHANGELOG.md` - Storico modifiche
- `SYSTEM_PROMPT_REFERENCE.md` - Configurazione AI

**Documentazione Tecnica (`docs/`):**
```
docs/
├── architecture/                  # Architettura sistema
│   ├── INFRASTRUCTURE_OVERVIEW.md
│   ├── KNOWLEDGE_BASE_MAP.md
│   ├── GALAXY_MAP.md
│   └── ...
├── guides/                        # Guide operative
│   ├── WORKFLOW_COMPLETO.md
│   ├── DEV_ONBOARDING_GUIDE.md
│   ├── API_AUTHENTICATION_GUIDE.md
│   └── ...
├── reports/                       # Report e analisi
│   ├── DEPLOYMENT_STATUS.md
│   ├── LLAMA_SCOUT_DEPLOYMENT_REPORT.md
│   └── ...
├── sessions/                      # Log sessioni
│   └── SESSION_FINAL_NOV8_2025.md
└── legal/                         # Documenti legali
    └── PP28_*.md
```

**Totale Documenti Markdown**: ~220 file

---

## 🔧 Script e Automazione

### Script Principali (`scripts/`)

**Migrazioni Database:**
- `migrate-to-chromadb.ts` - Migrazione a ChromaDB
- `migrate-kb-to-chromadb.py` - Migrazione knowledge base
- `migrations/` - Script migrazione avanzati

**Deployment:**
- `deploy-pp28-production.py` - Deploy PP28
- `maestro-deploy-chromadb.sh` - Deploy ChromaDB
- `monitoring/monitor-deploy.sh` - Monitoraggio deploy

**Testing:**
- `test-production-connection.py` - Test connessione produzione
- `test-pp28-rag.py` - Test RAG PP28
- `test-migration.ts` - Test migrazioni

**Monitoring:**
- `monitoring/backup-databases.sh` - Backup database
- `monitoring/quick-health-check.sh` - Health check rapido
- `monitor-memory-analytics.js` - Analytics memoria

**Disaster Recovery:**
- `disaster-recovery/backup-database.sh`
- `disaster-recovery/restore-database.sh`

---

## 🚀 Deployment e Infrastruttura

### Architettura Deployment

```
┌─────────────────────────────────────────────────┐
│           🌍 PRODUCTION INFRASTRUCTURE         │
├─────────────────────────────────────────────────┤
│                                                 │
│  Frontend (Cloudflare Pages)                   │
│  └── https://zantara.balizero.com              │
│      ├── React App (192KB bundle)              │
│      ├── Global CDN                            │
│      └── HTTPS Enforced                        │
│                                                 │
│  Backend TypeScript (Fly.io Singapore)         │
│  └── https://nuzantara-backend.fly.dev         │
│      ├── Node.js 20 + Express                  │
│      ├── 2 CPU, 2GB RAM                        │
│      ├── PostgreSQL + Redis                    │
│      └── Port 8080                             │
│                                                 │
│  Backend RAG Python (Fly.io Singapore)         │
│  └── https://nuzantara-rag.fly.dev             │
│      ├── Python 3.11 + FastAPI                 │
│      ├── 2 CPU, 2GB RAM                        │
│      ├── ChromaDB (10GB volume)                │
│      └── Port 8000                             │
│                                                 │
│  Redis Cache (AWS Singapore)                   │
│  └── Redis Cloud 8.0.2                        │
│      ├── 60-80% hit rate                       │
│      └── Domain-specific TTL                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Docker Compose (Local Development)

**Servizi Configurati:**
1. **postgres** - PostgreSQL 15 Alpine
2. **redis** - Redis 7 Alpine
3. **backend** - Backend TypeScript
4. **frontend** - Frontend webapp
5. **chromadb** - ChromaDB vector database
6. **pgadmin** - Database management UI (profile: tools)

**Network**: `zantara-network` (bridge)

**Volumes:**
- `postgres_data` - Dati PostgreSQL
- `redis_data` - Dati Redis
- `chromadb_data` - Dati ChromaDB
- `pgadmin_data` - Dati pgAdmin
- `backend_logs` - Log backend

---

## 📊 Metriche e Performance

### Performance Attuali

| Metrica | Valore | Note |
|---------|--------|------|
| **Response Time (cached)** | ~120ms | Media |
| **v3 Unified (quick)** | ~500ms | Quick mode |
| **v3 Comprehensive** | <2s | Comprehensive mode |
| **v3 Ecosystem** | ~1800ms | Business analysis |
| **System Uptime** | 99%+ | Production |
| **Concurrent Requests** | 100+ | Supportati |
| **Rate Limit** | 100 req/min | Per endpoint |
| **Cache Hit Rate** | 60-80% | Redis |

### Knowledge Base

| Metrica | Valore |
|---------|--------|
| **Total Documents** | 25,422 |
| **Collections** | 10 |
| **Search Accuracy** | 94% |
| **Embedding Dimensions** | 1536 |
| **Embedding Model** | text-embedding-3-small |

---

## 🎯 Features Implementate (9/38 = 23.7%)

### ✅ Features Completate

**Infrastructure & Monitoring (Features #1-6):**
1. ✅ **CORS & Security** - Helmet, rate limiting (100 req/min)
2. ✅ **Prometheus Metrics** - CPU, memory, HTTP tracking
3. ✅ **Health Checks** - Advanced status monitoring
4. ✅ **Redis Cache** - 7/7 endpoints working
5. ✅ **Correlation Tracking** - X-Correlation-ID headers
6. ✅ **Performance Routes** - Detailed metrics endpoints

**Business & Authentication (Features #7-9):**
7. ✅ **Bali Zero Chat** - KBLI, pricing, business setup
8. ✅ **ZANTARA v3 Ω** - 3 unified endpoints
9. ✅ **Team Authentication** - JWT + 22 team members

### ❌ Features Mancanti (29)

**User Management:**
- User registration, password reset, email verification
- User profiles, preferences, history

**RAG Direct Access:**
- Direct query endpoints, embeddings API, completions

**Business Analysis:**
- Complete KBLI analysis, license checks, compliance

**Financial:**
- Pricing plans, subscriptions, invoicing, payments

**Admin Tools:**
- User management, analytics dashboard, logs viewer, backups

**File Operations:**
- Upload, download, validation, processing

---

## 🔐 Sicurezza e Autenticazione

### Autenticazione Implementata

**Team Authentication:**
- JWT-based authentication
- 22 team members configurati
- Endpoints: `/api/auth/team/*`
- Token validation e refresh

### Sicurezza

- **CORS**: Configurato con whitelist
- **Rate Limiting**: 100 requests/min per endpoint
- **Helmet**: Security headers
- **JWT**: Token-based authentication
- **HTTPS**: Enforced su tutti i servizi
- **Input Validation**: Zod schemas

---

## 🤖 Sistema AI

### Configurazione AI

**Primary Model:**
- **Llama 4 Scout** via OpenRouter
- Cost: 92% più economico di Haiku
- TTFT: 22% più veloce
- Context: 10M tokens
- Status: PRIMARY (verificato Nov 8, 2025)

**Fallback Model:**
- **Claude Haiku 4.5** via Anthropic
- Tool calling support
- Automatic fallback su errori
- Reliability garantita

**Cost Optimization:**
- Risparmio: $10-12/month (verificato via 100-query POC)
- Strategy: Llama Scout PRIMARY, zero breaking changes

---

## 📦 Dipendenze Principali

### Backend TypeScript (`apps/backend-ts/package.json`)

**Dependencies (56):**
- `express` - Web framework
- `@anthropic-ai/sdk` - Claude AI
- `openai` - OpenAI API
- `chromadb` - Vector database client
- `pg` - PostgreSQL client
- `ioredis` - Redis client
- `jsonwebtoken` - JWT authentication
- `prom-client` - Prometheus metrics
- `winston` - Logging
- `zod` - Schema validation

**DevDependencies (14):**
- `typescript` - TypeScript compiler
- `jest` - Testing framework
- `tsx` - TypeScript execution
- `playwright` - E2E testing
- `typedoc` - Documentation generator

### Backend Python (`apps/backend-rag/requirements-backend.txt`)

**Dependencies (20+):**
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `chromadb` - Vector database
- `openai` - OpenAI SDK
- `sentence-transformers` - Local embeddings
- `langchain` - LLM framework
- `asyncpg` - PostgreSQL async driver
- `redis[asyncio]` - Redis async client
- `pydantic` - Data validation
- `loguru` - Logging

---

## 🧪 Testing

### Test Infrastructure

**Backend TypeScript:**
- Jest per unit testing
- Supertest per API testing
- Playwright per E2E testing
- Coverage: 70% threshold

**Backend Python:**
- pytest per unit testing
- pytest-asyncio per async tests
- httpx per API testing

**Scripts di Test:**
- `test-production-connection.py`
- `test-pp28-rag.py`
- `test-migration.ts`
- `test-api-ai-chat.js`

---

## 📈 CI/CD

### GitHub Actions

**Workflows:**
- `.github/workflows/deploy-pages.yml` - Auto-deploy frontend
- Trigger: Push to `main` branch
- Target: GitHub Pages
- Duration: ~40 seconds

### Deployment Scripts

**Fly.io Deployment:**
- `fly.toml` - Configurazione Fly.io
- `Dockerfile.fly` - Docker image per RAG
- `Dockerfile` - Docker image per backend TS

**Manual Deployment:**
```bash
# Backend TypeScript
cd apps/backend-ts
flyctl deploy --app nuzantara-backend --remote-only

# Backend RAG
cd apps/backend-rag
flyctl deploy --app nuzantara-rag --remote-only
```

---

## 🔍 File di Configurazione Chiave

### Root Level

- `package.json` - Workspace configuration, scripts
- `tsconfig.json` - TypeScript config (test/playwright)
- `docker-compose.yml` - Local development stack
- `fly.toml` - Fly.io RAG service config
- `eslint.config.js` - ESLint configuration
- `jest.config.js` - Jest test configuration
- `playwright.config.ts` - Playwright E2E config
- `wrangler.toml` - Cloudflare Workers config

### App-Specific

**Backend TS:**
- `apps/backend-ts/tsconfig.json` - TS config
- `apps/backend-ts/fly.toml` - Fly.io config
- `apps/backend-ts/jest.config.js` - Jest config
- `apps/backend-ts/package.json` - Dependencies

**Backend RAG:**
- `apps/backend-rag/requirements-*.txt` - Python deps
- `apps/backend-rag/Dockerfile.fly` - Docker config
- `apps/backend-rag/fly.toml` - Fly.io config

---

## 📝 Note e Osservazioni

### Punti di Forza

1. **Architettura Modulare**: Separazione chiara tra frontend, backend TS, backend RAG
2. **Documentazione Estesa**: ~220 file markdown con documentazione completa
3. **Knowledge Base Robusta**: 25,422 documenti indicizzati
4. **Multi-Platform**: Fly.io + Cloudflare Pages per alta disponibilità
5. **AI Integration**: Sistema AI dual-model con fallback automatico
6. **Monitoring**: Prometheus metrics, health checks, logging completo

### Aree di Miglioramento

1. **Feature Completion**: Solo 23.7% features implementate (9/38)
2. **Test Coverage**: Necessario aumentare coverage test
3. **Documentation**: Alcuni file potrebbero essere consolidati
4. **Code Organization**: Alcune directory potrebbero essere riorganizzate
5. **Dependencies**: Alcune dipendenze potrebbero essere aggiornate

### File da Monitorare

- `package.json` (root) - Workspace dependencies
- `docker-compose.yml` - Local development setup
- `fly.toml` - Production deployment config
- `apps/backend-ts/src/server.ts` - Main backend entry
- `apps/backend-rag/backend/app/main_cloud.py` - RAG backend entry
- `docs/architecture/INFRASTRUCTURE_OVERVIEW.md` - System overview

---

## 🎯 Conclusioni

Il repository **NUZANTARA** presenta una struttura ben organizzata con:

✅ **Architettura Solida**: Multi-service architecture con separazione chiara delle responsabilità  
✅ **Stack Moderno**: TypeScript, Python, React con tecnologie all'avanguardia  
✅ **Knowledge Base Estesa**: 25,422 documenti con ricerca semantica avanzata  
✅ **Production Ready**: Deployment su Fly.io e Cloudflare con 99%+ uptime  
✅ **Documentazione Completa**: Sistema di documentazione esteso e ben organizzato  

**Raccomandazioni:**
1. Continuare implementazione features mancanti (29 rimanenti)
2. Aumentare test coverage per maggiore affidabilità
3. Consolidare documentazione ridondante
4. Monitorare performance e ottimizzare query costose
5. Implementare feature di user management e autenticazione completa

---

**Ultimo Aggiornamento**: 2025-11-08  
**Versione Analisi**: 1.0  
**Analizzato da**: Claude Code (Cursor AI)
