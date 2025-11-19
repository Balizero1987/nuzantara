# NUZANTARA System Architecture

**Version:** 5.2.0
**Status:** 🟢 Production Ready
**Last Updated:** 2025-11-07

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Component Breakdown](#component-breakdown)
4. [Design Patterns](#design-patterns)
5. [Data Flow](#data-flow)
6. [Technology Stack](#technology-stack)
7. [Scalability & Performance](#scalability--performance)

---

## System Overview

NUZANTARA is a sophisticated AI-powered platform for Bali Zero business services, combining multiple specialized backends with an advanced RAG (Retrieval-Augmented Generation) system.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Progressive Web App (Vanilla JavaScript + SSE)      │  │
│  │  • Chat Interface • Memory Panel • KB Search         │  │
│  │  • Real-time Streaming • Offline Support             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             ↓ HTTP/REST + SSE + WebSocket
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  ┌─────────────────────┐      ┌────────────────────────┐   │
│  │  Backend-TS         │      │  Backend-RAG (Python)  │   │
│  │  (Node.js Express)  │←────→│  (FastAPI)             │   │
│  │  Port: 8080         │      │  Port: 8000            │   │
│  │  • 136+ Handlers    │      │  • RAG System          │   │
│  │  • 5 AI Agents      │      │  • 8 Specialized AI    │   │
│  │  • API Gateway      │      │  • 164+ Tools          │   │
│  └─────────────────────┘      └────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ PostgreSQL   │  │ ChromaDB     │  │ Redis Cache     │  │
│  │ (Relational) │  │ (Vector DB)  │  │ (Session/Cache) │  │
│  │ • CRM        │  │ • 8,122+     │  │ • Rate Limit    │  │
│  │ • Sessions   │  │   Chunks     │  │ • Auth Tokens   │  │
│  │ • Users      │  │ • 14 Colls   │  │ • Query Cache   │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                          │
│  • OpenAI (GPT-4, Embeddings)                               │
│  • Anthropic (Claude Haiku 4.5)                             │
│  • DeepSeek (V3.1)                                          │
│  • OpenRouter (Qwen3, MiniMax)                              │
│  • Google Workspace APIs                                    │
│  • Fly.io (Deployment)                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture Layers

### 1. Presentation Layer (Frontend)

**Technology:** Vanilla JavaScript + HTML5 + CSS3

**Key Components:**
- Progressive Web App (PWA) with offline support
- Server-Sent Events (SSE) for real-time streaming
- WebSocket connections for bi-directional communication
- Modular JavaScript architecture (100+ modules)

**Design Principles:**
- Module Pattern for code organization
- Observer Pattern for event-driven UI
- Lazy loading for performance
- Virtual scrolling for large datasets

### 2. Application Layer (Backend Services)

#### Backend-TS (TypeScript/Node.js)

**Purpose:** Main API gateway and orchestration

**Architecture:**
```
src/
├── server.ts              # Express app initialization
├── routing/
│   └── router.ts          # Route definitions
├── core/
│   ├── handler-registry   # Centralized handler management
│   └── zantara-orchestrator # Agent coordination
├── handlers/              # 136+ business logic handlers
├── agents/                # 5 autonomous AI agents
├── middleware/            # Security, caching, monitoring
├── services/              # Business services
└── config/                # Configuration management
```

**Key Features:**
- Handler Registry Pattern (136+ handlers)
- Autonomous Agent System (5 agents)
- Multi-strategy Authentication
- Performance Monitoring
- Circuit Breaker Protection

#### Backend-RAG (Python/FastAPI)

**Purpose:** RAG system and AI intelligence

**Architecture:**
```
backend/
├── app/
│   ├── main_cloud.py      # FastAPI application
│   └── routers/           # 23 API routers
├── services/              # 58 business services
├── llm/                   # LLM client integrations
├── core/                  # Vector DB, embeddings
├── db/                    # Database migrations
└── middleware/            # Error monitoring, rate limiting
```

**Key Features:**
- Intelligent AI Router (Haiku 4.5 + Llama Scout)
- 8 Specialized AI Agents
- RAG System (8,122+ chunks, 14 collections)
- Tool Execution System (164+ tools)
- Session Store (Redis-based)

### 3. Data Layer

#### PostgreSQL (Relational Database)

**Schema Organization:**
- **CRM System:** clients, practices, interactions
- **Team Management:** team_members, work_sessions
- **Memory System:** conversations, memory_facts
- **Oracle System:** oracle_knowledge_base
- **Audit:** activity_log

#### ChromaDB (Vector Database)

**Collections:**
- `kbli_eye` - Business classification codes
- `legal_architect` - Legal framework
- `tax_genius` - Tax regulations
- `visa_oracle` - Immigration rules
- `property_sage` - Real estate law
- `cultural_intelligence` - Cultural context
- 8 more specialized collections

#### Redis (Cache & Session Store)

**Usage:**
- Session storage (50+ message conversations)
- Query result caching
- Rate limiting counters
- JWT token blacklist
- Real-time analytics

---

## Component Breakdown

### Backend-TS Components

#### 1. Handler Registry System

**Location:** `src/core/handler-registry.ts`

```typescript
class HandlerRegistry {
  register(key: string, handler: Function, metadata: HandlerMetadata): void
  registerModule(module: HandlerModule): void
  get(key: string): Handler | undefined
  execute(key: string, params: any): Promise<any>
  list(): Handler[]
  getStats(): RegistryStats
}
```

**Purpose:** Centralized handler management with auto-discovery

**Features:**
- Auto-registration on module load
- Dependency injection
- Performance metrics tracking
- Call count monitoring
- Handler versioning

#### 2. Autonomous Agent System

**Location:** `src/agents/`

**Agents:**

1. **ENDPOINT-GENERATOR**
   - Generate complete API endpoints from natural language
   - ROI: 20 minutes → <1 minute
   - Model: Qwen3 Coder 480B

2. **MEMORY-INTEGRATOR**
   - Auto-integrate session memory into handlers
   - Automatic context injection
   - Model: DeepSeek V3.1

3. **SELF-HEALING**
   - Analyze and fix production errors
   - Impact: -95% downtime
   - Model: DeepSeek V3.1

4. **TEST-WRITER**
   - Generate comprehensive test suites
   - Coverage: Unit, integration, E2E
   - Model: Qwen3 Coder 480B

5. **PR-AGENT**
   - Create pull requests autonomously
   - Auto-commit and push
   - Model: MiniMax M2

**Orchestration:**
```typescript
class AgentOrchestrator {
  submitTask(task: AgentTask): Promise<string>
  getTaskStatus(taskId: string): TaskStatus
  listTasks(): AgentTask[]
  cleanupOldTasks(): void
}
```

#### 3. Enhanced Architecture (GLM 4.6 Patch)

**Service Registry:**
```typescript
class ServiceRegistry {
  registerService(name: string, instance: Service): void
  discoverService(name: string): Service[]
  getHealthyInstance(name: string): Service
  startHealthChecking(): void
}
```

**Enhanced Router:**
- Circuit breaker protection
- Retry logic with exponential backoff
- Health checking
- Load balancing

**V3 Ω Services:**
- `unified` - Unified knowledge hub
- `collective` - Collective memory service
- `ecosystem` - Business ecosystem analysis

#### 4. Authentication System

**Unified Auth Strategy:**
```typescript
class UnifiedAuth {
  validateToken(token: string): Promise<TokenPayload>
  refreshToken(token: string): Promise<string>
  revokeToken(token: string): Promise<void>
  generateToken(user: User): string
}
```

**Strategies:**
- JWT tokens (primary)
- Firebase authentication (prepared)
- OAuth2 (prepared)

### Backend-RAG Components

#### 1. Intelligent Router

**Location:** `services/intelligent_router.py`

```python
class IntelligentRouter:
    def route_query(query: str) -> str:
        """Route query to appropriate AI model"""

    def fallback_strategy(error: Exception) -> str:
        """Handle model failures"""

    def cost_optimization(query: str) -> str:
        """Optimize model selection for cost"""
```

**Routing Logic:**
- Claude Haiku 4.5: 100% traffic (primary)
- Llama 4 Scout: Experimental fallback
- Cost: 3x cheaper than Sonnet
- Quality: Same with RAG enhancement

#### 2. RAG System

**Search Service:**
```python
class SearchService:
    def semantic_search(
        query: str,
        collections: List[str],
        top_k: int = 10
    ) -> List[Document]:
        """Perform semantic search"""

    def hybrid_search(
        query: str,
        keywords: List[str],
        collections: List[str]
    ) -> List[Document]:
        """Combine vector + keyword search"""

    def rerank_results(
        documents: List[Document],
        query: str
    ) -> List[Document]:
        """Rerank results for relevance"""
```

**Features:**
- 94% search accuracy
- Multi-collection search
- Hybrid search (vector + keyword)
- Result reranking

#### 3. Specialized AI Agents

**1. Autonomous Research Agent**
```python
class AutonomousResearchService:
    def conduct_research(topic: str) -> ResearchReport:
        """Self-directed research"""

    def synthesize_findings(findings: List[Finding]) -> Summary:
        """Synthesize research results"""
```

**2. Cross-Oracle Synthesis Agent**
```python
class CrossOracleSynthesisService:
    def multi_domain_analysis(query: str) -> Analysis:
        """Analyze across tax, legal, property domains"""

    def synthesize_knowledge(sources: List[Source]) -> Synthesis:
        """Combine knowledge from multiple oracles"""
```

**3. Dynamic Pricing Agent**
```python
class DynamicPricingService:
    def calculate_price(service: str, params: dict) -> Price:
        """Calculate service price"""

    def generate_breakdown(price: Price) -> Breakdown:
        """Generate cost breakdown"""
```

**4-8. Other Agents:**
- Knowledge Graph Agent
- Cultural RAG Agent
- Client Journey Agent
- Compliance Monitor Agent
- Team Analytics Agent (7 techniques)

#### 4. Tool Execution System

**Location:** `services/tool_executor.py`

```python
class ToolExecutor:
    def execute(tool_name: str, params: dict) -> ToolResult:
        """Execute tool with parameters"""

    def list_tools() -> List[Tool]:
        """List available tools"""

    def validate_params(tool_name: str, params: dict) -> bool:
        """Validate tool parameters"""
```

**Available Tools:** 164+ tools across:
- Google Workspace (Gmail, Drive, Calendar, Sheets, Docs)
- Bali Zero services (KBLI, Oracle, Pricing, Advisory)
- Communication (WhatsApp, Instagram, Translation)
- Analytics and reporting
- Memory and knowledge management

### Frontend Components

#### 1. SSE Client System

**Multiple Implementations:**
- `streaming-client.js` - Base SSE
- `bali-zero-stream-client.js` - Bali Zero optimized
- `optimized-sse-client.js` - Performance optimized
- `resilient-sse-client.js` - Error recovery

**Features:**
- Auto-reconnect
- Message buffering
- Continuity tracking
- Error recovery

#### 2. Memory Client

```javascript
class MemoryClient {
  async retrieveMemory(sessionId) {
    // Retrieve conversation history
  }

  async saveMemory(sessionId, message) {
    // Save message to memory
  }

  async exportMemory(sessionId, format) {
    // Export conversation (JSON/Markdown)
  }
}
```

#### 3. Knowledge Base Service

```javascript
class KBService {
  async search(query, collections) {
    // Search knowledge base
  }

  async getCollections() {
    // Get available collections
  }

  async getCitations(resultId) {
    // Get source citations
  }
}
```

---

## Design Patterns

### Backend-TS Patterns

1. **Registry Pattern**
   - Handler Registry for centralized management
   - Service Registry for service discovery

2. **Strategy Pattern**
   - Unified Authentication with multiple strategies
   - AI model selection strategies

3. **Circuit Breaker Pattern**
   - Enhanced Router for fault tolerance
   - Automatic fallback to backup services

4. **Factory Pattern**
   - Handler creation
   - Service instantiation

5. **Dependency Injection**
   - Service-based architecture
   - Testable components

6. **Observer Pattern**
   - Event-driven WebSocket
   - Real-time notifications

7. **Singleton Pattern**
   - Global registry instance
   - Configuration management

8. **Middleware Chain Pattern**
   - Express middleware pipeline
   - Request/response processing

### Backend-RAG Patterns

1. **Service Layer Pattern**
   - Business logic separation
   - Clean architecture

2. **Repository Pattern**
   - Data access abstraction
   - Database independence

3. **Factory Pattern**
   - Service instantiation
   - Client creation

4. **Strategy Pattern**
   - AI model selection
   - Search strategy selection

5. **Observer Pattern**
   - Event-driven notifications
   - Real-time updates

6. **Decorator Pattern**
   - Middleware chains
   - Service enhancement

7. **Singleton Pattern**
   - Global service instances
   - Configuration management

8. **Facade Pattern**
   - Simplified interfaces
   - Complex subsystem hiding

### Frontend Patterns

1. **Module Pattern**
   - JavaScript module organization
   - Encapsulation

2. **Observer Pattern**
   - Event-driven UI
   - Real-time updates

3. **Singleton Pattern**
   - State manager
   - API client

4. **Factory Pattern**
   - Component creation
   - Dynamic instantiation

5. **Decorator Pattern**
   - UI enhancements
   - Feature extensions

6. **Strategy Pattern**
   - Theme selection
   - Layout strategies

7. **Command Pattern**
   - Action handlers
   - Undo/redo functionality

8. **Proxy Pattern**
   - API client
   - Request interception

---

## Data Flow

### Chat Message Flow

```
┌─────────────┐
│   User      │
│  (Frontend) │
└──────┬──────┘
       │ 1. User sends message
       ↓
┌─────────────────────────┐
│  SSE Client             │
│  (resilient-sse-client) │
└──────┬──────────────────┘
       │ 2. POST /bali-zero/chat-stream
       ↓
┌─────────────────────────┐
│  Backend-RAG            │
│  (FastAPI main_cloud)   │
└──────┬──────────────────┘
       │ 3. Route to Intelligent Router
       ↓
┌─────────────────────────┐
│  Intelligent Router     │
│  (intelligent_router)   │
└──────┬──────────────────┘
       │ 4. Select AI model (Haiku 4.5)
       ↓
┌─────────────────────────┐
│  RAG System             │
│  (search_service)       │
└──────┬──────────────────┘
       │ 5. Semantic search (ChromaDB)
       ↓
┌─────────────────────────┐
│  ChromaDB               │
│  (14 collections)       │
└──────┬──────────────────┘
       │ 6. Return relevant chunks
       ↓
┌─────────────────────────┐
│  Claude Haiku Service   │
│  (claude_haiku_service) │
└──────┬──────────────────┘
       │ 7. Generate response with context
       ↓
┌─────────────────────────┐
│  Tool Executor          │
│  (tool_executor)        │
└──────┬──────────────────┘
       │ 8. Execute tools if needed
       ↓
┌─────────────────────────┐
│  Backend-TS             │
│  (Handler Registry)     │
└──────┬──────────────────┘
       │ 9. Execute handlers
       ↓
┌─────────────────────────┐
│  PostgreSQL / Redis     │
│  (Data persistence)     │
└──────┬──────────────────┘
       │ 10. Return results
       ↓
┌─────────────────────────┐
│  SSE Stream             │
│  (Real-time chunks)     │
└──────┬──────────────────┘
       │ 11. Stream to frontend
       ↓
┌─────────────────────────┐
│  Frontend UI            │
│  (Progressive display)  │
└─────────────────────────┘
```

### Authentication Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ 1. Enter credentials
       ↓
┌─────────────────────────┐
│  Frontend (login.html)  │
└──────┬──────────────────┘
       │ 2. POST /api/auth/team/login
       ↓
┌─────────────────────────┐
│  Backend-TS             │
│  (team-login-secure)    │
└──────┬──────────────────┘
       │ 3. Validate credentials
       ↓
┌─────────────────────────┐
│  PostgreSQL             │
│  (team_members)         │
└──────┬──────────────────┘
       │ 4. Return user data
       ↓
┌─────────────────────────┐
│  Unified Auth           │
│  (JWT generation)       │
└──────┬──────────────────┘
       │ 5. Generate JWT token
       ↓
┌─────────────────────────┐
│  Redis                  │
│  (Token storage)        │
└──────┬──────────────────┘
       │ 6. Cache token
       ↓
┌─────────────────────────┐
│  Frontend               │
│  (localStorage)         │
└──────┬──────────────────┘
       │ 7. Store token
       ↓
┌─────────────────────────┐
│  Authenticated Session  │
└─────────────────────────┘
```

---

## Technology Stack

### Backend-TS

**Runtime:** Node.js 20+
**Language:** TypeScript 5.x
**Framework:** Express 5.1.0
**Testing:** Jest, Playwright

**Key Dependencies:**
```json
{
  "@anthropic-ai/sdk": "^0.62.0",
  "@google/generative-ai": "^0.24.1",
  "@prisma/client": "^6.16.2",
  "express": "^5.1.0",
  "chromadb": "^1.10.5",
  "openai": "^5.20.2",
  "redis": "^4.6.10",
  "winston": "^3.18.3",
  "socket.io": "^4.8.1",
  "zod": "^3.25.76"
}
```

### Backend-RAG

**Runtime:** Python 3.11+
**Framework:** FastAPI
**Testing:** pytest

**Key Dependencies:**
```
fastapi==0.115.6
uvicorn==0.34.0
anthropic==0.42.0
openai==1.59.6
chromadb==0.5.23
psycopg2-binary==2.9.10
redis==5.2.1
pydantic==2.10.5
```

### Frontend

**Language:** JavaScript ES6+
**Architecture:** Vanilla JavaScript (no framework)
**Build:** None (direct deployment)
**Testing:** Playwright E2E

**Key Features:**
- Progressive Web App (PWA)
- Server-Sent Events (SSE)
- WebSocket
- Service Workers
- Local Storage
- IndexedDB

### Infrastructure

**Deployment:** Fly.io
**CDN:** Cloudflare Pages
**Workers:** Cloudflare Workers
**Storage:** Cloudflare R2
**Monitoring:** Winston + Custom metrics

---

## Scalability & Performance

### Horizontal Scaling

**Backend-TS:**
- Stateless design (session in Redis)
- Load balancer ready
- Multiple instances supported
- Auto-scaling on Fly.io

**Backend-RAG:**
- Stateless FastAPI app
- Multiple workers (Gunicorn/Uvicorn)
- Connection pooling
- Auto-scaling on Fly.io

### Vertical Scaling

**Current Resources:**
- Backend-TS: 1GB RAM, 1 CPU
- Backend-RAG: 2GB RAM, 2 CPUs
- PostgreSQL: 1GB RAM, 1 CPU
- Redis: 256MB RAM

**Upgrade Path:**
- Backend-TS: Up to 8GB RAM, 8 CPUs
- Backend-RAG: Up to 16GB RAM, 16 CPUs
- PostgreSQL: Up to 64GB RAM, 32 CPUs
- Redis: Up to 8GB RAM

### Caching Strategy

**Redis Caching:**
- Query result caching (TTL: 1 hour)
- Handler result caching (TTL: 30 minutes)
- Session storage (TTL: 24 hours)
- Rate limit counters (TTL: 15 minutes)

**Browser Caching:**
- Static assets (1 year)
- API responses (5 minutes)
- User preferences (permanent)

### Performance Optimizations

**Backend:**
- Connection pooling (PostgreSQL, ChromaDB)
- Query optimization (indexed fields)
- Lazy loading (handlers, services)
- Response compression (gzip)
- Request deduplication

**Frontend:**
- Virtual scrolling (large lists)
- Lazy loading (images, modules)
- Code splitting (dynamic imports)
- Service Worker caching
- Request batching

### Load Testing Results

**Backend-TS:**
- Throughput: 1,000 req/s
- Latency p95: 150ms
- Latency p99: 300ms
- Error rate: <0.1%

**Backend-RAG:**
- Throughput: 500 req/s (RAG-heavy)
- Latency p95: 800ms
- Latency p99: 1,500ms
- Error rate: <0.5%

---

## Security Architecture

### Authentication & Authorization

**Multi-Layer Security:**
1. JWT token validation
2. Role-based access control (RBAC)
3. API key authentication
4. Rate limiting
5. IP whitelisting (optional)

### Data Protection

**In Transit:**
- HTTPS/TLS 1.3 (enforced)
- WebSocket Secure (WSS)
- Certificate pinning

**At Rest:**
- PostgreSQL encryption
- Redis encryption
- Sensitive data hashing (bcrypt)

### Security Middleware

1. **Helmet.js** - Security headers
2. **CORS** - Cross-origin control
3. **Rate Limiter** - DDoS protection
4. **Input Sanitization** - XSS protection
5. **SQL Injection Prevention** - Parameterized queries

---

## Monitoring & Observability

### Logging

**Winston Logger:**
- Structured JSON logging
- Multiple transports (file, console)
- Log levels (error, warn, info, debug)
- Request correlation IDs

### Metrics

**Custom Metrics:**
- Request count
- Response time
- Error rate
- Handler execution time
- AI model latency
- Cache hit rate

### Health Checks

**Endpoints:**
- `/health` - Basic health check
- `/health/detailed` - Detailed status
- `/metrics` - Prometheus metrics

### Alerting

**Alert Service:**
- Error threshold alerts
- Performance degradation alerts
- Database connection alerts
- WhatsApp notifications (configured)

---

## Conclusion

NUZANTARA's architecture is designed for:

✅ **Scalability** - Horizontal and vertical scaling
✅ **Performance** - Caching, pooling, optimization
✅ **Reliability** - Circuit breakers, fallbacks, retry logic
✅ **Security** - Multi-layer security, encryption
✅ **Maintainability** - Modular design, clear patterns
✅ **Observability** - Comprehensive logging, metrics, monitoring

**Status:** 🟢 **Production Ready** (v5.2.0)

---

**Next Steps:**
- Read [ONBOARDING.md](./ONBOARDING.md) for developer setup
- Read [API_REFERENCE.md](./API_REFERENCE.md) for API documentation
- Read [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for workflows
