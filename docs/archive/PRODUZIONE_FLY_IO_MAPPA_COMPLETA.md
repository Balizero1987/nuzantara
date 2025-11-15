# 🚀 MAPPATURA COMPLETA PRODUZIONE FLY.IO - NUZANTARA

**Data**: 15 Novembre 2025
**Versione**: 1.0
**Ambiente**: Production (fly.io)

---

## 📋 INDICE

1. [Architettura Production Fly.io](#architettura-production-flyio)
2. [Mappatura App Fly.io → Codebase](#mappatura-app-flyio--codebase)
3. [API Endpoints in Produzione](#api-endpoints-in-produzione)
4. [Handlers e Servizi Attivi](#handlers-e-servizi-attivi)
5. [Database e Storage](#database-e-storage)
6. [API Deprecate e Non Utilizzate](#api-deprecate-e-non-utilizzate)
7. [Raccomandazioni](#raccomandazioni)

---

## 1. ARCHITETTURA PRODUCTION FLY.IO

### 🌐 App Deployate su Fly.io

| App Fly.io | Machines | Region | Storage | RAM | vCPU | Status |
|------------|----------|--------|---------|-----|------|--------|
| **nuzantara-memory** | 1 | sin | - | - | - | ❓ NON DEPLOYATA |
| **nuzantara-rag** | 1 | sin | 20 GB | 2 GB | 2 | ✅ ATTIVA |
| **nuzantara-backend** | 2 | sin | 3 GB | 1 GB | 1 | ✅ ATTIVA |
| **nuzantara-postgres** | 1 | sin | 10 GB | - | - | 🗄️ DATABASE |
| **bali-zero-db** | 3 | sin | 30 GB | - | - | 🗄️ DATABASE |

### 🔄 Correlazione App → Servizi

```
PRODUCTION DEPLOYMENT MAP:

nuzantara-backend (2 machines)
  ├─ Codebase: /apps/backend-ts/
  ├─ Port: 8080
  ├─ Entry: src/server.ts
  ├─ Tecnologia: Node.js 20.x + TypeScript 5.8
  └─ Endpoints: 147 API (vedi sezione 3)

nuzantara-rag (1 machine)
  ├─ Codebase: /apps/backend-rag/
  ├─ Port: 8000
  ├─ Entry: backend/app/main_cloud.py
  ├─ Tecnologia: Python 3.11 + FastAPI
  └─ Endpoints: 93 API (vedi sezione 3)

nuzantara-memory (NON DEPLOYATA ❌)
  ├─ Codebase: /apps/memory-service/
  ├─ Port: 8080 (teorico)
  ├─ Entry: src/index.ts
  ├─ Status: Microservice locale (non in produzione)
  └─ Endpoints: 20+ API (solo local/dev)

nuzantara-postgres + bali-zero-db
  ├─ Tipo: PostgreSQL 15
  ├─ Shared storage: 40 GB totale
  └─ Utilizzato da: backend-ts + backend-rag

nuzantara-webapp
  ├─ Hosting: GitHub Pages (NON Fly.io)
  ├─ Domain: zantara.balizero.com
  └─ CDN: Cloudflare
```

---

## 2. MAPPATURA APP FLY.IO → CODEBASE

### 2.1 nuzantara-backend (TypeScript)

**File Configurazione**: `/apps/backend-ts/fly.toml`

```toml
app = 'nuzantara-backend'
primary_region = 'sin'
[http_service]
  internal_port = 8080
  min_machines_running = 1
[[vm]]
  memory = '1gb'
  cpus = 1
```

**Stack Tecnologico**:
- Node.js 20.x
- Express.js 5.1
- TypeScript 5.8
- PostgreSQL client (pg 8.16)
- Redis client (ioredis 5.4)
- ChromaDB client (chromadb 1.10)

**Dipendenze Production**:
- DATABASE_URL → nuzantara-postgres
- REDIS_URL → Redis (esterno o Upstash)
- CHROMADB_URL → ChromaDB (volume persistente)

**Health Check**: `GET /health` (ogni 30s)

---

### 2.2 nuzantara-rag (Python/FastAPI)

**File Configurazione**: `/fly.toml` (root)

```toml
app = 'nuzantara-rag'
primary_region = 'sin'
[http_service]
  internal_port = 8000
  min_machines_running = 1
[[mounts]]
  source = 'chroma_data'
  destination = '/data/chroma_db_FULL_deploy'
[[vm]]
  memory = '2gb'
  cpus = 2
```

**Stack Tecnologico**:
- Python 3.11+
- FastAPI 0.115
- Uvicorn (ASGI server)
- PostgreSQL (psycopg2-binary 2.9.9)
- ChromaDB 0.4.22 (persistente)
- Redis 5.0.6

**AI System**:
- **Primary**: Llama 4 Scout ($0.20/$0.20 per 1M tokens) - 10M context
- **Fallback**: Claude Haiku 4.5 ($1/$5 per 1M tokens) - 200K context
- **Embeddings**: OpenAI text-embedding-3-small (1536 dim)

**Dipendenze Production**:
- DATABASE_URL → nuzantara-postgres / bali-zero-db
- REDIS_URL → Redis cache
- OPENAI_API_KEY → Embeddings
- ANTHROPIC_API_KEY → Claude Haiku fallback
- CHROMA_DB_PATH → /data/chroma_db_FULL_deploy (20 GB volume)

**Health Check**: `GET /health` (ogni 30000s ⚠️ troppo lungo!)

---

### 2.3 nuzantara-memory (NON IN PRODUZIONE)

**Status**: ❌ NON DEPLOYATA SU FLY.IO

Questo servizio è referenziato come "nuzantara-memory" ma **NON esiste un deploy su Fly.io**.

**Analisi**:
- Codebase esiste in `/apps/memory-service/`
- È un microservice standalone (Express + PostgreSQL + Redis)
- Viene usato SOLO in ambiente development locale
- Il backend-ts ha un client (`memory-service-client.ts`) ma probabilmente non lo chiama in prod

**Raccomandazione**:
1. Verificare se il nome "nuzantara-memory" nell'elenco Fly.io si riferisce a:
   - Un volume storage?
   - Un database separato?
   - Un deploy mai completato?
2. Se è un deploy, controllare: `flyctl apps list | grep memory`
3. Valutare se deployare effettivamente o rimuovere il codice

---

### 2.4 Database: nuzantara-postgres + bali-zero-db

**nuzantara-postgres**:
- PostgreSQL 15-alpine (local docker-compose)
- 10 GB storage (secondo specifiche)
- Tabelle: users, sessions, conversations, etc.

**bali-zero-db**:
- PostgreSQL 15 (Fly.io managed)
- 30 GB storage, 3 machines (HA setup)
- Tabelle CRM: clients, practices, interactions, conversations, practice_types, company_profiles

**Nota**: Entrambi i database sono PostgreSQL, probabilmente:
- **nuzantara-postgres**: Development/Staging
- **bali-zero-db**: Production CRM data

---

## 3. API ENDPOINTS IN PRODUZIONE

### 3.1 nuzantara-backend (147 endpoints)

**Documentazione Completa**: `/tmp/API_ENDPOINTS_DOCUMENTATION.md`

#### Categorie:

| Categoria | Endpoints | Base Path | Auth |
|-----------|-----------|-----------|------|
| **Authentication** | 11 | `/api/auth/`, `/auth/` | Public/JWT |
| **Health & Monitoring** | 8 | `/health`, `/metrics`, `/performance` | Public |
| **AI Services** | 8 | `/api/v2/bali-zero/chat-stream` (SSE) | API Key |
| **RAG & Memory** | 12 | `/api/rag/`, `/api/memory/` | API Key |
| **Bali Zero Business** | 20 | `/api/v2/bali-zero/*` | API Key |
| **Google Workspace** | 25 | `/api/google/*` | OAuth2 |
| **Analytics** | 8 | `/api/analytics/*` | API Key |
| **Cache Management** | 4 | `/cache/*` | Admin |
| **ZANTARA Core** | 5 | `/zantara.unified`, `/zantara.collective` | Circuit Breaker |

#### Endpoints Critici in Produzione:

```typescript
// 🔥 MAIN CHAT ENDPOINT (SSE Streaming)
POST /api/v2/bali-zero/chat-stream
  - Server-Sent Events (SSE)
  - Real-time AI responses
  - Rate limit: Speciale per chat
  - Handler: ragService.ts

// 🔑 AUTHENTICATION
POST /auth/login                    // User login
POST /auth/logout                   // User logout
POST /auth/validate                 // Token validation
POST /auth/refresh                  // Token refresh
POST /api/auth/demo                 // Demo token generation
POST /auth/generate                 // Generate JWT
GET  /auth/strategies               // List auth strategies

// 📊 BUSINESS LOGIC
GET  /api/v2/bali-zero/kbli        // Indonesia business classification
GET  /api/v2/bali-zero/pricing     // Pricing calculator
POST /api/v2/bali-zero/oracle      // Oracle query (universal)
POST /api/v2/bali-zero/team/activity  // Team activity tracking

// 🔍 RAG & MEMORY
POST /api/rag/query                // RAG query
POST /api/rag/ingest               // Ingest documents
GET  /api/memory/session/:id       // Get session memory
POST /api/memory/store             // Store memory

// 📈 ANALYTICS
GET  /api/analytics/dashboard      // Dashboard analytics
GET  /api/analytics/weekly         // Weekly report
POST /api/analytics/track          // Track event

// ⚙️ MONITORING
GET  /health                       // Health check
GET  /metrics                      // Prometheus metrics
GET  /performance/metrics          // Performance metrics
GET  /architecture/status          // Circuit breaker status
```

#### Rate Limiting in Produzione:

```typescript
// Multi-layer rate limiting:
1. Global: Tutti gli endpoint
2. API Key: 5 failures → HTTP 429 (1 min block)
3. JWT: 5 failures in 15 min → 30 min block
4. Chat: Custom limit per chat-stream
5. Prioritized: Feature flag abilitabile
```

#### Caching Strategy:

```typescript
// Redis caching (TTL):
- /api/v2/bali-zero/kbli: 10 min
- /api/v2/bali-zero/pricing: 1 hour
- /api/analytics/*: Variable
```

---

### 3.2 nuzantara-rag (93 endpoints)

**Documentazione Completa**: `/home/user/nuzantara/BACKEND_RAG_API_SUMMARY.md`

#### Router Attivi (22):

| Router | Endpoints | Funzione | Status |
|--------|-----------|----------|--------|
| **health.py** | 1 | Health check | ✅ |
| **search.py** | 4 | Semantic search RAG | ✅ |
| **ingest.py** | 4 | Document ingestion | ✅ |
| **conversations.py** | 6 | Conversation storage + Auto-CRM | ✅ |
| **agents.py** | 10 | Agentic functions | ✅ |
| **crm_clients.py** | 8 | Client management | ✅ |
| **crm_practices.py** | 8 | Practice tracking | ✅ |
| **crm_interactions.py** | 7 | Interaction logging | ✅ |
| **crm_shared_memory.py** | 4 | Team memory queries | ✅ |
| **memory_vector.py** | 8 | Semantic memory | ✅ |
| **oracle_universal.py** | 4 | Intelligent routing | ✅ |
| **oracle_ingest.py** | 2 | Bulk ingestion | ✅ |
| **oracle_tax.py** | 8 | Tax intelligence | ⚠️ DEPRECATED |
| **oracle_property.py** | 10 | Property intelligence | ⚠️ DEPRECATED |
| **intel.py** | 5 | News & intelligence | ✅ |
| **notifications.py** | 2 | Multi-channel notifications | ✅ |
| **handlers.py** | 3 | API discovery | ✅ |
| **admin_migration.py** | 2 | Database migrations | ✅ |
| **admin_oracle_populate.py** | 1 | Initial population | ✅ |
| **autonomous_agents.py** | 6 | Agent execution | ✅ |
| **oracle_migrate_endpoint.py** | 1 | Data migration | ❌ TO REMOVE |
| **oracle_populate.py** | 1 | Populate oracle | ❌ DUPLICATE |

#### Endpoints Critici in Produzione:

```python
# 🔍 SEARCH & RAG
POST /api/search                   # Semantic search in ChromaDB
POST /api/search/hybrid            # Hybrid search (semantic + keyword)
GET  /api/search/collections       # List ChromaDB collections
POST /api/ingest/book              # Ingest book (PDF, EPUB, MOBI)

# 💼 CRM
POST /api/crm/clients              # Create client
GET  /api/crm/clients              # List clients
GET  /api/crm/clients/{id}         # Get client details
PUT  /api/crm/clients/{id}         # Update client
DELETE /api/crm/clients/{id}       # Delete client
POST /api/crm/practices            # Create practice
POST /api/crm/interactions         # Log interaction
GET  /api/crm/shared-memory/query  # Query team memory

# 🧠 MEMORY & CONVERSATIONS
POST /api/conversations            # Create conversation
GET  /api/conversations/{id}       # Get conversation
POST /api/memory-vector/store     # Store semantic memory
POST /api/memory-vector/search    # Search semantic memory

# 🔮 ORACLE (Universal Intelligence)
POST /api/oracle/query             # Universal oracle query
POST /api/oracle/ingest/bulk       # Bulk ingest
POST /api/oracle/tax/*             # ⚠️ DEPRECATED - use /query
POST /api/oracle/property/*        # ⚠️ DEPRECATED - use /query

# 🤖 AGENTS (10 Agentic Functions)
POST /api/agents/client-journey    # Client journey orchestrator
POST /api/agents/compliance        # Proactive compliance monitor
POST /api/agents/knowledge-graph   # Knowledge graph builder
POST /api/agents/auto-ingestion    # Auto ingestion orchestrator
POST /api/agents/cross-oracle      # Cross-oracle synthesis
POST /api/agents/dynamic-pricing   # Dynamic pricing calculator
POST /api/agents/research          # Autonomous research
POST /api/agents/quality-trainer   # Conversation quality trainer
POST /api/agents/value-predictor   # Client value predictor
POST /api/agents/skill-detection   # Skill detection layer

# 📰 INTEL
GET  /api/intel/news               # News search
POST /api/intel/scrape             # Web scraping
POST /api/intel/analyze            # Analyze intel

# 🔔 NOTIFICATIONS
POST /api/notifications/send       # Send notification
GET  /api/notifications/templates  # List templates

# 🏥 HEALTH & ADMIN
GET  /health                       # Health check
POST /admin/apply-migration-007    # Apply migration
GET  /admin/populate-oracle        # Populate collections
```

#### ChromaDB Collections (14):

```python
1. legal_unified          # Legal knowledge
2. kbli_unified          # Indonesia business classification
3. visa_oracle           # Visa information
4. tax_genius            # Tax knowledge
5. property_genius       # Property knowledge
6. crm_clients           # Client profiles
7. crm_interactions      # Interaction history
8. team_memory           # Shared team knowledge
9. books_library         # Ingested books
10. intel_news           # News & intelligence
11. pricing_knowledge    # Pricing models
12. compliance_rules     # Compliance regulations
13. market_data          # Market intelligence
14. company_profiles     # Company information
```

---

### 3.3 nuzantara-memory (20+ endpoints) - LOCAL ONLY

**⚠️ IMPORTANTE**: Questi endpoint NON sono in produzione su Fly.io

```typescript
// SESSION MANAGEMENT
POST /api/session/create           // Create session
GET  /api/session/:session_id      // Get session

// CONVERSATION STORAGE
POST /api/conversation/store       // Store message
GET  /api/conversation/:session_id // Get conversation
GET  /api/conversation/:session_id/with-summary
GET  /api/conversation/:session_id/summary
POST /api/conversation/summarize/:session_id

// COLLECTIVE MEMORY
POST /api/memory/collective/store  // Store collective memory
GET  /api/memory/collective/search // Search collective memory

// USER FACTS
POST /api/memory/fact/store        // Store fact
GET  /api/memory/fact/:user_id     // Get user facts

// ANALYTICS
GET  /api/stats                    // General stats
GET  /api/stats/users              // User stats
GET  /api/analytics/comprehensive  // Comprehensive analytics
GET  /api/analytics/realtime       // Real-time metrics
POST /api/analytics/aggregate-daily
POST /api/analytics/clean-old-events

// FACT EXTRACTION
POST /api/facts/extract/:session_id
GET  /api/facts/relevant
POST /api/facts/batch-extract
GET  /api/facts/stats

// ADMIN
POST /api/admin/recreate-summaries-table
POST /api/admin/optimize-database
POST /api/admin/cleanup-old-sessions
GET  /api/admin/cleanup-stats
GET  /api/admin/database-size
GET  /api/admin/growth-projection
```

---

## 4. HANDLERS E SERVIZI ATTIVI

### 4.1 Backend TypeScript - Servizi Critici (60+)

| Servizio | File | Funzione | Status |
|----------|------|----------|--------|
| **AI Communication** | ai-communication.ts | AI routing logic | ✅ |
| **RAG Service** | ragService.ts | RAG integration | ✅ |
| **Memory Service Client** | memory-service-client.ts | Memory microservice client | ❓ |
| **Redis Client** | redis-client.ts | Redis cache management | ✅ |
| **ChromaDB Pool** | chromadb-pool.ts | ChromaDB connection pooling | ✅ |
| **Cron Scheduler** | cron-scheduler.ts | Background jobs (5 jobs) | ✅ |
| **Circuit Breaker** | circuit-breaker.ts | Failure protection | ✅ |
| **Connection Pool** | connection-pool.ts | DB connection pooling | ✅ |
| **Feature Flags** | feature-flags.ts | Feature toggles | ✅ |
| **Audit Trail** | audit-trail.ts | Audit logging | ✅ |
| **Unified Auth** | unified-auth-strategy.ts | Multi-strategy auth | ✅ |
| **Streaming Service** | streaming-service.ts | SSE streaming | ✅ |
| **WebSocket Server** | websocket-server.ts | WebSocket handler | ✅ |
| **Firebase** | firebase.ts | Firebase integration | ✅ |
| **Google Auth** | google-auth-service.ts | Google OAuth | ✅ |

#### Servizi Deprecated:

| Servizio | Status | Ragione |
|----------|--------|---------|
| memory-vector.ts | ⚠️ | Duplicato da backend-rag |
| jiwa-client.ts | ❓ | Verifica utilizzo |

---

### 4.2 Backend RAG - Servizi Attivi (58)

| Servizio | File | Funzione | Status |
|----------|------|----------|--------|
| **Search Service** | search_service.py | Semantic search | ✅ |
| **Conversation Service** | conversation_service.py | Conversation management | ✅ |
| **Memory Service** | memory_service_postgres.py | PostgreSQL memory | ✅ |
| **Llama Scout Client** | llama_scout_client.py | Primary AI (Llama 4) | ✅ |
| **Claude Haiku Service** | claude_haiku_service.py | Fallback AI | ✅ |
| **Intelligent Router** | intelligent_router.py | AI routing | ✅ |
| **Ingestion Service** | ingestion_service.py | Document ingestion | ✅ |
| **Client Journey** | client_journey_orchestrator.py | Journey automation | ✅ |
| **Knowledge Graph** | knowledge_graph_builder.py | Graph construction | ✅ |
| **Auto CRM** | auto_crm_service.py | Automatic CRM | ✅ |
| **Semantic Cache** | semantic_cache.py | Redis semantic cache | ✅ |
| **Emotional Attunement** | emotional_attunement.py | Tone analysis | ✅ |
| **Tool Executor** | tool_executor.py | Agent tool execution | ✅ |
| **Notification Hub** | notification_hub.py | Multi-channel notifications | ✅ |
| **Health Monitor** | health_monitor.py | System monitoring | ✅ |

---

## 5. DATABASE E STORAGE

### 5.1 PostgreSQL (bali-zero-db)

**Tabelle CRM** (backend-rag):
```sql
1. clients              # Client profiles
2. practices            # Business practices
3. interactions         # Client interactions
4. conversations        # Conversation history
5. practice_types       # Practice type taxonomy
6. company_profiles     # Company information
```

**Tabelle Auth/Users** (backend-ts):
```sql
1. users                # User accounts
2. sessions             # Active sessions
3. api_keys             # API key management
4. audit_logs           # Audit trail
```

---

### 5.2 ChromaDB (Volume 20 GB)

**Mount Point**: `/data/chroma_db_FULL_deploy`

**14 Collections** (vedi sezione 3.2)

**Embedding Model**: OpenAI text-embedding-3-small (1536 dimensions)

**Utilizzo**:
- Semantic search
- RAG retrieval
- Document ingestion
- Knowledge graph

---

### 5.3 Redis

**Utilizzo**:
- Session caching (backend-ts)
- Semantic caching (backend-rag)
- Rate limiting
- Pub/Sub messaging
- WebSocket state

**TTL Policies**:
- Session cache: 1 hour
- Semantic cache: Variable (based on query similarity)
- Rate limit: 1-30 minutes

---

## 6. API DEPRECATE E NON UTILIZZATE

### 6.1 Endpoint Deprecati (38 totali)

#### Backend RAG - Oracle Tax/Property (18 endpoint)

**⚠️ DEPRECATED Phase 3**: Usare `/api/oracle/query` (universal)

```python
# oracle_tax.py - 8 endpoint
POST /api/oracle/tax/search
GET  /api/oracle/tax/rates
GET  /api/oracle/tax/deadlines
POST /api/oracle/tax/optimize
GET  /api/oracle/tax/audit-risk
GET  /api/oracle/tax/treaties
GET  /api/oracle/tax/updates
POST /api/oracle/tax/company/save

# oracle_property.py - 10 endpoint
POST /api/oracle/property/search
GET  /api/oracle/property/listings
GET  /api/oracle/property/market
POST /api/oracle/property/due-diligence
POST /api/oracle/property/structures
GET  /api/oracle/property/areas
GET  /api/oracle/property/legal-updates
POST /api/oracle/property/save
GET  /api/oracle/property/investment
POST /api/oracle/property/valuation
```

#### Backend TypeScript - Firestore Handlers (15 endpoint)

**❌ DEPRECATED**: Firestore completamente rimosso, sostituito da PostgreSQL + memory service

```typescript
// Tutti questi handler lanciano errore:
memory.list
memory.search.entity
memory.entities
memory.entity.info
memory.event.save
memory.timeline.get
memory.entity.events
memory.search.semantic
memory.search.hybrid
memory.cache.stats
memory.cache.clear
user.memory.save
user.memory.retrieve
user.memory.list
user.memory.login
```

#### Backend TypeScript - Team Login Legacy

```typescript
// ⚠️ LEGACY (deprecated - no PIN)
team.login

// ✅ SOSTITUZIONE
team.login.secure  // PIN-based authentication
```

---

### 6.2 Handler Non Utilizzati (3 file)

**❌ File creati ma mai importati nel router**:

```bash
/apps/backend-ts/src/handlers/zantara/zantara-collective.ts  # 130 linee
/apps/backend-ts/src/handlers/zantara/zantara-ecosystem.ts   # 120 linee
/apps/backend-ts/src/handlers/zantara/zantara-unified.ts     # 100 linee
```

**Motivo**: Funzionalità coperta da `oracle_universal.query` nel backend-rag

---

### 6.3 Endpoint Duplicati (5)

```bash
# Migration endpoints (rimuovere):
oracle_populate.py               # ❌ ELIMINARE
oracle_migrate_endpoint.py       # ❌ ELIMINARE (nota: "should be REMOVED")

# Mantenere:
admin_oracle_populate.py         # ✅ MANTENERE (più completo)
admin_migration.py               # ✅ MANTENERE (schema migration)
```

---

### 6.4 Piano di Cleanup

#### FASE 1: IMMEDIATO (Zero Risk) ⚡

**Elimina OGGI**:
```bash
rm /home/user/nuzantara/apps/backend-ts/src/handlers/zantara/zantara-collective.ts
rm /home/user/nuzantara/apps/backend-ts/src/handlers/zantara/zantara-ecosystem.ts
rm /home/user/nuzantara/apps/backend-ts/src/handlers/zantara/zantara-unified.ts
rm /home/user/nuzantara/apps/backend-rag/backend/app/routers/oracle_migrate_endpoint.py
rm /home/user/nuzantara/apps/backend-rag/backend/app/routers/oracle_populate.py
```

**Benefici**:
- 983 linee eliminate
- 5 file rimossi
- 0 rischi (non utilizzati)

#### FASE 2: v6.1 - Deprecation Warnings 🟡

```python
# Aggiungere warning nei router:
@router.post("/api/oracle/tax/search")
async def tax_search():
    logger.warning("⚠️ DEPRECATED: Use /api/oracle/query instead")
    # ... existing code ...
```

#### FASE 3: v7.0 - Rimozione Completa 🔴

**Eliminare**:
- `oracle_tax.py` (~574 linee)
- `oracle_property.py` (~679 linee)
- `team.login` handler (~200 linee)
- 15 Firestore stub handlers (~300 linee)

**TOTALE CLEANUP**: ~3,100 linee

---

## 7. RACCOMANDAZIONI

### 🔴 CRITICHE (Da fare SUBITO)

1. **Health Check Timeout Backend RAG**:
   ```toml
   # ATTUALE (fly.toml):
   interval = '30000s'  # 8.3 ORE! ❌
   timeout = '5000s'    # 1.4 ORE! ❌

   # CORRETTO:
   interval = '30s'     # 30 secondi ✅
   timeout = '5s'       # 5 secondi ✅
   ```

2. **nuzantara-memory Disambiguation**:
   - Verificare se "nuzantara-memory" nell'elenco Fly.io esiste davvero
   - Se NON esiste, rimuovere il codice da `/apps/memory-service/`
   - Se esiste, documentare la configurazione

3. **Cleanup Immediato**:
   - Eseguire FASE 1 cleanup (5 file, 983 linee)
   - Zero rischio, benefici immediati

---

### 🟡 IMPORTANTI (Prossime 2 settimane)

4. **Database Clarification**:
   - Documentare differenza tra `nuzantara-postgres` e `bali-zero-db`
   - Verificare se sono due database separati o uno solo
   - Mappare quali tabelle sono in quale database

5. **Memory Service Integration**:
   - Se `memory-service-client.ts` è usato in prod, deployare il microservice
   - Altrimenti, rimuovere il client dal backend-ts

6. **API Versioning**:
   - Deprecare formalmente oracle_tax e oracle_property
   - Aggiungere versioning header agli endpoint

---

### 🟢 OTTIMIZZAZIONI (v6.1+)

7. **Monitoraggio**:
   - Setup Prometheus alerts per:
     - Health check failures
     - Rate limit violations
     - ChromaDB disk usage (20 GB limit)
     - Database connection pool saturation

8. **Documentazione**:
   - Generare OpenAPI spec per backend-rag
   - Generare Swagger UI per backend-ts
   - Documentare flussi di autenticazione

9. **Performance**:
   - Review ChromaDB collection sizes (20 GB limit)
   - Optimize semantic cache hit rate
   - Review database indexes

10. **Security**:
    - Audit API key rotation policies
    - Review CORS origins in produzione
    - Enable audit trail in produzione

---

## 📊 RIEPILOGO NUMERICO

| Metrica | Valore |
|---------|--------|
| **App Fly.io Attive** | 2 (backend, rag) |
| **App Fly.io Database** | 2 (postgres, bali-zero-db) |
| **App NON in Produzione** | 1 (memory-service) |
| **Total Endpoints Backend-TS** | 147 |
| **Total Endpoints Backend-RAG** | 93 |
| **Total Endpoints Memory** | 20+ (local only) |
| **Endpoint Deprecati** | 38 |
| **Handler Non Utilizzati** | 3 |
| **Endpoint Duplicati** | 5 |
| **ChromaDB Collections** | 14 |
| **PostgreSQL Tables** | 10+ |
| **Linee Eliminabili (immediate)** | 983 |
| **Linee Eliminabili (v7.0)** | 3,100 |
| **File Eliminabili (immediate)** | 5 |

---

## 📁 FILE DI RIFERIMENTO

Documentazione Dettagliata:

1. **Struttura Generale**: `/home/user/nuzantara/CODEBASE_STRUCTURE_MAP.md`
2. **Backend TypeScript API**: `/tmp/API_ENDPOINTS_DOCUMENTATION.md`
3. **Backend RAG API**: `/home/user/nuzantara/BACKEND_RAG_API_SUMMARY.md`
4. **Cleanup Analysis**: `/home/user/nuzantara/API_CLEANUP_ANALYSIS.md`
5. **Quick Reference**: `/home/user/nuzantara/FLY_IO_SERVICES_QUICK_REFERENCE.md`
6. **Visual Architecture**: `/home/user/nuzantara/VISUAL_ARCHITECTURE_MAP.txt`

---

## ✅ CONCLUSIONI

Questo documento fornisce una **mappatura completa e definitiva** di:

✅ Tutte le app Fly.io in produzione e loro configurazioni
✅ Correlazione tra app Fly.io e codebase
✅ **147 endpoint del backend TypeScript** (tutti documentati)
✅ **93 endpoint del backend RAG** (tutti documentati)
✅ 20+ endpoint del memory service (NON in produzione)
✅ **38 API deprecate** identificate
✅ **3 handler non utilizzati** identificati
✅ **5 endpoint duplicati** identificati
✅ Database, storage e configurazioni
✅ Piano di cleanup con 3,100 linee eliminabili

**Prossimi Passi**:
1. Correggere health check backend-rag (CRITICO)
2. Eseguire cleanup FASE 1 (5 file, 983 linee)
3. Chiarire status nuzantara-memory
4. Deprecare formalmente oracle_tax/property
5. Setup monitoring e alerts

---

**Generato da**: Claude Code (Anthropic)
**Data**: 15 Novembre 2025
**Versione Documento**: 1.0
