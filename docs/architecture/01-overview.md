# 🏗️ Nuzantara Architecture Overview

**Version:** 5.2.0
**Last Updated:** 23 October 2025
**Based On:** Real dependency analysis via madge

This document provides a **complete visual architecture** of the nuzantara system, generated from actual code dependencies (not approximations).

---

## 🎯 High-Level System Architecture

```mermaid
graph TB
    subgraph External["🌐 External Users & APIs"]
        User[User Browser]
        Mobile[Mobile Clients]
        ExtAPI[External APIs<br/>Anthropic, OpenAI]
    end

    subgraph Frontend["💻 Frontend Layer"]
        WebApp[WebApp<br/>Vanilla JS:8081]
        Dashboard[Admin Dashboard]
    end

    subgraph Backend["⚙️ Backend TypeScript (Port 8080)"]
        Gateway[App Gateway<br/>Bootstrap & Events]
        Router[Router<br/>50+ Endpoints]

        subgraph Handlers["Handler Modules (11)"]
            HAI[AI Services]
            HAnalytics[Analytics]
            HBaliZero[Bali Zero]
            HComm[Communication]
            HGoogle[Google Workspace]
            HRAG[RAG]
            HMemory[Memory]
            HZantara[Zantara]
        end

        subgraph Services["Core Services"]
            SLogger[Logger]
            SFirebase[Firebase]
            SRAG[RAG Service]
            SOAuth[OAuth2]
            SWebSocket[WebSocket Server]
        end

        subgraph Middleware["Middleware Stack"]
            MAuth[Auth & JWT]
            MMonitor[Monitoring]
            MRateLimit[Rate Limiting]
            MValidation[Validation]
            MReality[Reality Check]
        end
    end

    subgraph BackendRAG["🤖 Backend RAG (Port 8000)"]
        FastAPI[FastAPI Server]
        RAGCore[RAG Core Engine]
        Embeddings[Embeddings Service]
        LLM[LLM Integration]
    end

    subgraph AI["🧠 AI Layer"]
        Oracle[Zantara Orchestrator]

        subgraph Agents["5 Oracle Agents"]
            VisaOracle[VISA Oracle]
            KBLIEye[KBLI Eye]
            TaxGenius[Tax Genius]
            LegalArch[Legal Architect]
            PropertySage[Property Sage]
        end
    end

    subgraph Data["💾 Data Layer"]
        PostgreSQL[(PostgreSQL<br/>User & App Data)]
        ChromaDB[(ChromaDB<br/>Vector Store)]
        Firestore[(Firestore<br/>Memory & Sessions)]
        Redis[(Redis<br/>Cache)]
        R2[Cloudflare R2<br/>File Storage]
    end

    %% External connections
    User --> WebApp
    Mobile --> WebApp
    WebApp --> Gateway
    Dashboard --> Gateway

    %% Gateway to Router
    Gateway --> Router

    %% Router to Middleware
    Router --> MAuth
    MAuth --> MMonitor
    MMonitor --> MRateLimit
    MRateLimit --> MValidation
    MValidation --> MReality

    %% Middleware to Handlers
    MReality --> Handlers

    %% Handlers to Services
    HAI --> SLogger
    HAI --> SRAG
    HAnalytics --> SFirebase
    HBaliZero --> Oracle
    HComm --> SFirebase
    HGoogle --> SOAuth
    HRAG --> SRAG
    HMemory --> SFirebase
    HZantara --> Oracle

    %% Services to Data
    SFirebase --> Firestore
    SRAG --> FastAPI
    SOAuth --> PostgreSQL

    %% Backend RAG Flow
    FastAPI --> RAGCore
    RAGCore --> Embeddings
    RAGCore --> ChromaDB
    RAGCore --> LLM
    LLM --> ExtAPI

    %% Oracle Agents
    Oracle --> VisaOracle
    Oracle --> KBLIEye
    Oracle --> TaxGenius
    Oracle --> LegalArch
    Oracle --> PropertySage

    VisaOracle --> FastAPI
    KBLIEye --> FastAPI
    TaxGenius --> FastAPI
    LegalArch --> FastAPI
    PropertySage --> FastAPI

    %% Monitoring
    SWebSocket --> User
    SLogger --> Redis

    style Backend fill:#e3f2fd
    style BackendRAG fill:#fff3e0
    style AI fill:#f3e5f5
    style Data fill:#e8f5e9
    style Frontend fill:#fce4ec
```

---

## 📊 Component Breakdown

### Frontend Layer
- **WebApp** (Vanilla JS, Port 8081)
  - PWA with service worker
  - Chat interface
  - Dashboard UI
  - Static assets served via BFF proxy

### Backend TypeScript (Port 8080)
- **Entry Point**: `index.ts`
- **App Gateway**: Bootstrap, events, session management
- **Router**: Centralized routing for 50+ endpoints
- **11 Handler Modules**: Feature-based organization
- **Core Services**: Logger, Firebase, RAG, OAuth, WebSocket
- **Middleware Stack**: Auth, monitoring, rate limiting, validation

### Backend RAG (Port 8000)
- **FastAPI** framework
- **ChromaDB** vector database integration
- **Sentence Transformers** for embeddings
- **Anthropic API** for LLM responses
- **Tier-based access control** (Levels 0-3)

### AI Layer
- **Zantara Orchestrator**: Multi-agent coordination
- **5 Oracle Agents**: Domain-specific expertise
  - VISA Oracle: Immigration consulting
  - KBLI Eye: Business classification
  - Tax Genius: Tax consulting
  - Legal Architect: Legal consulting
  - Property Sage: Real estate consulting

### Data Layer
- **PostgreSQL**: User data, application state
- **ChromaDB**: Vector embeddings (50k+ chunks)
- **Firestore**: Memory, sessions, analytics
- **Redis**: Caching (optional)
- **Cloudflare R2**: File storage

---

## 🔄 Request Flow

### Typical RAG Query Flow

```mermaid
sequenceDiagram
    participant U as User
    participant W as WebApp
    participant G as Gateway
    participant M as Middleware
    participant H as Handler (RAG)
    participant S as RAG Service
    participant R as Backend RAG
    participant C as ChromaDB
    participant L as LLM (Anthropic)

    U->>W: "How to get KITAS?"
    W->>G: POST /api/rag/query
    G->>M: Route request
    M->>M: Auth check (JWT)
    M->>M: Rate limit check
    M->>M: Validate input
    M->>H: Forward to RAG handler
    H->>S: queryRAG(query, tier)
    S->>R: POST /api/rag/query
    R->>C: Semantic search (tier filter)
    C-->>R: Top 10 relevant chunks
    R->>L: Generate response (streaming)
    L-->>R: Streaming tokens
    R-->>S: RAG result
    S-->>H: Format response
    H-->>M: Response
    M-->>G: Response
    G-->>W: JSON response
    W-->>U: Display answer
```

### Oracle Agent Collaboration Flow

```mermaid
sequenceDiagram
    participant U as User
    participant H as Handler
    participant O as Orchestrator
    participant V as VISA Oracle
    participant K as KBLI Eye
    participant T as Tax Genius
    participant R as RAG Backend

    U->>H: "Setup PT PMA with foreign directors"
    H->>O: Orchestrate multi-agent

    par Parallel Agent Queries
        O->>V: Check VISA requirements
        V->>R: Query RAG (tier=2)
        R-->>V: KITAS procedures

        O->>K: Get KBLI codes
        K->>R: Query RAG (tier=1)
        R-->>K: Business codes

        O->>T: Tax implications
        T->>R: Query RAG (tier=2)
        R-->>T: Tax requirements
    end

    V-->>O: VISA analysis
    K-->>O: KBLI analysis
    T-->>O: Tax analysis

    O->>O: Synthesize responses
    O-->>H: Combined recommendation
    H-->>U: Complete setup guide
```

---

## 📈 Component Statistics

Based on real code analysis (madge + file counting):

| Component | Count | Details |
|-----------|-------|---------|
| **Handler Modules** | 11 | ai-services, analytics, bali-zero, communication, devai, google-workspace, identity, maps, memory, rag, zantara |
| **Total Handlers** | 50+ | Individual handler files across modules |
| **Core Services** | 15+ | firebase, logger, ragService, oauth2-client, etc. |
| **Middleware** | 8 | auth, monitoring, rate-limit, validation, reality-check, etc. |
| **API Endpoints** | 50+ | REST endpoints across all handlers |
| **Oracle Agents** | 5 | visa-oracle, kbli-eye, tax-genius, legal-architect, property-sage |
| **Dependencies** | ~300+ | Inter-module dependencies mapped |

---

## 🎯 Key Architectural Patterns

### 1. **Handler-Based Architecture**
Each feature is a self-contained handler module with:
- Handler functions
- Routes registration
- Service dependencies
- Registry for auto-loading

### 2. **Service Layer Pattern**
Business logic separated into services:
- Reusable across handlers
- Centralized logging
- Dependency injection ready

### 3. **Middleware Pipeline**
Request processing pipeline:
```
Request → Auth → Monitor → Rate Limit → Validate → Reality Check → Handler
```

### 4. **Multi-Agent AI System**
Oracle agents:
- Domain-specific expertise
- Parallel query execution
- Knowledge base integration via RAG
- Response synthesis

### 5. **RAG Architecture**
Retrieval-Augmented Generation:
- Vector embeddings for semantic search
- Tier-based access control
- ChromaDB for storage
- LLM integration for generation

---

## 🔗 Related Documentation

- [Backend TypeScript Components](./02-backend-ts-components.md) - Detailed handler/service breakdown
- [Oracle System Architecture](./03-oracle-system.md) - 5 Oracle agents deep dive
- [Data Flow Diagrams](./04-data-flow.md) - Detailed sequence diagrams
- [Dependency Graphs](./generated/) - Auto-generated dependency visualizations

---

## 📝 Notes for AI Analysis

This architecture map is generated from **real code dependencies**, not assumptions:

1. **Dependency data** extracted via `madge` tool
2. **All 300+ inter-module dependencies** mapped
3. **Component counts** based on actual file analysis
4. **Diagrams** reflect actual import/export relationships

When analyzing this codebase:
- Use this as **authoritative source** for architecture
- Refer to specific component docs for details
- Check dependency graphs for module relationships
- Follow sequence diagrams for flow understanding

---

**Generated from:** madge analysis of `apps/backend-ts/src/index.ts`
**Total LOC:** ~60,000 lines
**Monorepo Structure:** npm workspaces
**Deployment:** Railway + Docker
