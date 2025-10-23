# 🗺️ NUZANTARA - MERMAID SYSTEM DIAGRAM

**Data**: 23 Ottobre 2025, 20:45
**StatusMenuComplete System Architecture (Haiku 4.5 ONLY Frontend)

---

## 🏗️ COMPLETE SYSTEM ARCHITECTURE

```mermaid
graph TB
    subgraph "🌐 CLIENT LAYER"
        Browser[Browser/PWA<br/>zantara.balizero.com]
        Mobile[Mobile Apps]
        Admin[Admin Dashboard]
    end

    subgraph "🚀 DEPLOYMENT LAYER"
        Railway[Railway<br/>Auto-deploy]
        GitHub[GitHub Pages/CDN]
        GCloud[Google Cloud Run]
    end

    subgraph "🌊 API GATEWAY LAYER - TS Backend :8080"
        direction TB
        Gateway[API Gateway<br/>Express Router]
        
        subgraph "Middleware Pipeline"
            DemoAuth[Demo User Auth<br/>25 public tools]
            JWTAuth[JWT Auth<br/>Team/Admin]
            RateLimit[Rate Limiter<br/>Selective]
            Logger[Logger<br/>Correlation ID]
        end
        
        subgraph "Handler Registry - 122 Handlers"
            direction LR
            H_GWS[Google Workspace<br/>8 handlers]
            H_AI[AI Services<br/>10 handlers]
            H_BZ[Bali Zero<br/>15 handlers]
            H_ZANT[ZANTARA<br/>20 handlers]
            H_Comm[Communication<br/>10 handlers]
            H_Analytics[Analytics<br/>15 handlers]
            H_Memory[Memory<br/>8 handlers]
            H_Maps[Maps<br/>3 handlers]
            H_RAG[RAG Proxy<br/>4 handlers]
            H_DevAI[DevAI<br/>7 handlers]
            H_Identity[Identity<br/>3 handlers]
            H_System[System<br/>10+ handlers]
        end
    end

    subgraph "🧠 AI INTELLIGENCE LAYER"
        direction TB
        
        subgraph "Frontend AI - 100% Traffic"
            Haiku[Claude Haiku 4.5<br/>ZANTARA Identity<br/>$0.25/$1.25 per 1M tokens<br/>~1-2s response<br/>164 tools access]
        end
        
        subgraph "Background AI - Nightly Worker"
            ZANTARA_Llama[ZANTARA Llama 3.1 8B<br/>Trained: 22,009 conversations<br/>Accuracy: 98.74%<br/>RunPod vLLM + HF fallback<br/>€3-11/month]
        end
        
        subgraph "Development AI - Backend Only"
            DevAI[DevAI Qwen 2.5 Coder<br/>7 handlers<br/>Code analysis<br/>€1-3/month]
        end
    end

    subgraph "🎯 RAG LAYER - Python Backend :8000"
        direction TB
        FastAPI[FastAPI App<br/>12 endpoints]
        
        subgraph "RAG Services"
            Router[Intelligent Router<br/>Haiku ONLY]
            SearchSvc[Search Service<br/>ChromaDB client]
            CulturalRAG[Cultural RAG<br/>Indonesian context]
            GoldenAnswer[Golden Answer Service<br/>10-20ms lookup]
            MemorySvc[Memory Service<br/>PostgreSQL]
            ConvSvc[Conversation Service]
            EmotionalSvc[Emotional Attunement]
            HandlerProxy[Handler Proxy<br/>TS Backend bridge]
            ToolExecutor[Tool Executor<br/>Dual routing]
        end
        
        subgraph "10 Agentic Functions"
            A1[Client Journey<br/>Orchestrator]
            A2[Proactive Compliance<br/>Monitor]
            A3[Knowledge Graph<br/>Builder]
            A4[Auto Ingestion<br/>Orchestrator]
            A5[Cross Oracle<br/>Synthesis]
            A6[Dynamic<br/>Pricing]
            A7[Autonomous<br/>Research]
            A8[Intelligent Query<br/>Router]
            A9[Conflict<br/>Resolution]
            A10[Business Plan<br/>Generator]
        end
    end

    subgraph "🗄️ DATA LAYER"
        direction TB
        
        subgraph "PostgreSQL - 34 Tables"
            PG_Core[(Core<br/>users, conversations<br/>memory_facts)]
            PG_Business[(Business<br/>clients, projects<br/>work_sessions)]
            PG_Analytics[(Analytics<br/>team_analytics<br/>performance_metrics)]
            PG_Oracle[(Oracle - 19 tables<br/>visa, kbli, tax<br/>property)]
            PG_ZANTARA[(ZANTARA<br/>golden_answers<br/>query_clusters<br/>cultural_knowledge<br/>nightly_worker_runs)]
        end
        
        subgraph "ChromaDB - 14 Collections"
            C_Business[(Business<br/>pricing, visa<br/>kbli, tax)]
            C_Knowledge[(Knowledge<br/>zantara_books<br/>kb_indonesian)]
            C_Legal[(Legal<br/>legal_architect<br/>legal_updates)]
            C_Property[(Property<br/>listings<br/>knowledge)]
            C_Tax[(Tax<br/>updates<br/>knowledge)]
            C_Cultural[(Cultural<br/>cultural_insights<br/>oracle_visa<br/>oracle_kbli)]
        end
        
        subgraph "Redis - Caching"
            Redis[(Cache<br/>TTL 5min<br/>Rate Limiting<br/>Metrics)]
        end
    end

    subgraph "🔧 BACKGROUND WORKERS"
        direction TB
        NightlyWorker[ZANTARA Nightly Worker<br/>2 AM UTC daily]
        
        subgraph "Worker Tasks"
            Task1[Query Analysis<br/>& Clustering]
            Task2[Golden Answers<br/>Generation]
            Task3[Cultural Knowledge<br/>Generation]
            Task4[Shadow Mode<br/>A/B Testing]
        end
        
        NightlyWorker --> Task1
        Task1 --> Task2
        Task2 --> Task3
        Task3 --> Task4
    end

    subgraph "🌍 EXTERNAL INTEGRATIONS"
        direction LR
        Anthropic[Anthropic API<br/>Claude Haiku 4.5]
        RunPod[RunPod<br/>ZANTARA Llama 3.1<br/>DevAI Qwen 2.5]
        HuggingFace[HuggingFace<br/>Fallback]
        Google[Google Workspace<br/>Gmail, Drive, Calendar]
        Twilio[Twilio<br/>WhatsApp, SMS]
        SendGrid[SendGrid<br/>Email]
        Slack[Slack API]
        Discord[Discord API]
    end

    %% Client to Gateway
    Browser --> Gateway
    Mobile --> Gateway
    Admin --> Gateway
    
    %% Gateway to Middleware
    Gateway --> DemoAuth
    DemoAuth --> JWTAuth
    JWTAuth --> RateLimit
    RateLimit --> Logger
    
    %% Middleware to Handlers
    Logger --> H_GWS
    Logger --> H_AI
    Logger --> H_BZ
    Logger --> H_ZANT
    Logger --> H_Comm
    Logger --> H_Analytics
    Logger --> H_Memory
    Logger --> H_Maps
    Logger --> H_RAG
    Logger --> H_DevAI
    Logger --> H_Identity
    Logger --> H_System
    
    %% Handlers to RAG Backend
    H_RAG --> FastAPI
    H_AI --> FastAPI
    H_ZANT --> FastAPI
    
    %% RAG Backend to Services
    FastAPI --> Router
    Router --> Haiku
    Router --> SearchSvc
    Router --> CulturalRAG
    Router --> GoldenAnswer
    Router --> MemorySvc
    Router --> ConvSvc
    Router --> EmotionalSvc
    Router --> HandlerProxy
    Router --> ToolExecutor
    
    %% Agents
    FastAPI --> A1
    FastAPI --> A2
    FastAPI --> A3
    FastAPI --> A4
    FastAPI --> A5
    FastAPI --> A6
    FastAPI --> A7
    FastAPI --> A8
    FastAPI --> A9
    FastAPI --> A10
    
    %% Services to Data Layer
    SearchSvc --> C_Business
    SearchSvc --> C_Knowledge
    SearchSvc --> C_Legal
    SearchSvc --> C_Property
    SearchSvc --> C_Tax
    SearchSvc --> C_Cultural
    
    GoldenAnswer --> PG_ZANTARA
    MemorySvc --> PG_Core
    A1 --> PG_Business
    A2 --> PG_Oracle
    H_Memory --> PG_Core
    H_Analytics --> PG_Analytics
    
    Router --> Redis
    GoldenAnswer --> Redis
    
    %% Background Workers
    Task1 --> PG_Core
    Task2 --> ZANTARA_Llama
    Task2 --> PG_ZANTARA
    Task3 --> ZANTARA_Llama
    Task3 --> PG_ZANTARA
    Task3 --> C_Cultural
    Task4 --> ZANTARA_Llama
    Task4 --> Haiku
    
    %% External Integrations
    Haiku --> Anthropic
    ZANTARA_Llama --> RunPod
    ZANTARA_Llama --> HuggingFace
    DevAI --> RunPod
    H_GWS --> Google
    H_Comm --> Twilio
    H_Comm --> SendGrid
    H_Comm --> Slack
    H_Comm --> Discord
    
    %% Styling
    classDef frontend fill:#e1f5ff,stroke:#0366d6,stroke-width:2px
    classDef backend fill:#fff3cd,stroke:#ffc107,stroke-width:2px
    classDef ai fill:#d4edda,stroke:#28a745,stroke-width:2px
    classDef data fill:#f8d7da,stroke:#dc3545,stroke-width:2px
    classDef worker fill:#e7e7ff,stroke:#6f42c1,stroke-width:2px
    
    class Browser,Mobile,Admin frontend
    class Gateway,FastAPI,H_GWS,H_AI,H_BZ,H_ZANT backend
    class Haiku,ZANTARA_Llama,DevAI,Router ai
    class PG_Core,PG_Business,PG_Analytics,PG_Oracle,PG_ZANTARA,C_Business,C_Knowledge,Redis data
    class NightlyWorker,Task1,Task2,Task3,Task4 worker
```

---

## 🔄 COMPLETE REQUEST FLOWS

### **Flow 1: User Chat (Real-time)**

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant TS_Backend
    participant RAG_Backend
    participant Haiku
    participant ChromaDB
    participant PostgreSQL
    participant Redis

    User->>Browser: Type message + Enter
    Browser->>TS_Backend: POST /call (handler: ai.chat)
    TS_Backend->>TS_Backend: Demo Auth Check (25 public tools)
    TS_Backend->>RAG_Backend: Proxy to /bali-zero/chat
    RAG_Backend->>Redis: Check Golden Answer cache
    
    alt Golden Answer Found
        Redis-->>RAG_Backend: Return cached answer (10-20ms)
        RAG_Backend-->>Browser: Stream response (SSE)
        Browser-->>User: ZANTARA response (instant!)
    else No Golden Answer
        RAG_Backend->>RAG_Backend: Intelligent Router
        RAG_Backend->>ChromaDB: Search cultural_insights
        ChromaDB-->>RAG_Backend: Cultural context (<5ms)
        RAG_Backend->>ChromaDB: Search 14 collections (RAG)
        ChromaDB-->>RAG_Backend: Top 5-10 results (2000-3000 words)
        RAG_Backend->>Haiku: Generate with RAG + Cultural context
        Haiku->>Haiku: Tool calling (if needed - 164 tools)
        Haiku-->>RAG_Backend: Response (1-2s)
        RAG_Backend->>PostgreSQL: Save conversation
        RAG_Backend-->>Browser: Stream response (SSE)
        Browser-->>User: ZANTARA response
    end
```

### **Flow 2: ZANTARA Nightly Worker (Background)**

```mermaid
sequenceDiagram
    participant Cron
    participant Worker
    participant PostgreSQL
    participant ChromaDB
    participant ZANTARA_Llama
    participant RunPod

    Cron->>Worker: Trigger at 2 AM UTC
    Worker->>PostgreSQL: Extract queries (last 3-7 days)
    PostgreSQL-->>Worker: 127 queries found
    Worker->>Worker: Semantic clustering
    Worker->>Worker: Identify top 100-200 clusters
    
    loop For each cluster (100-200)
        Worker->>ChromaDB: Search legal documents
        ChromaDB-->>Worker: RAG context (2000-3000 words)
        Worker->>ZANTARA_Llama: Generate answer + citations
        ZANTARA_Llama->>RunPod: API call (vLLM)
        RunPod-->>ZANTARA_Llama: Generated answer (300-500 words)
        ZANTARA_Llama-->>Worker: Answer ready
        Worker->>PostgreSQL: Save to golden_answers
    end
    
    Worker->>ZANTARA_Llama: Generate cultural knowledge (10 chunks)
    ZANTARA_Llama->>RunPod: API calls
    RunPod-->>ZANTARA_Llama: Cultural chunks
    Worker->>PostgreSQL: Save to cultural_knowledge
    Worker->>ChromaDB: Save to cultural_insights
    
    Worker->>PostgreSQL: Log completion (nightly_worker_runs)
    Worker-->>Cron: Complete (4-6 hours)
```

### **Flow 3: Golden Answer Lookup (Cached)**

```mermaid
sequenceDiagram
    participant User
    participant RAG_Backend
    participant PostgreSQL
    participant Redis

    User->>RAG_Backend: "What docs for KITAS?"
    RAG_Backend->>RAG_Backend: Generate query hash (MD5)
    RAG_Backend->>Redis: Check cache
    
    alt Redis Hit
        Redis-->>RAG_Backend: Cached answer (2ms)
        RAG_Backend-->>User: Instant response
    else Redis Miss
        RAG_Backend->>PostgreSQL: Check golden_answers
        
        alt Exact Match
            PostgreSQL-->>RAG_Backend: Golden answer (10ms)
            RAG_Backend->>Redis: Cache for 5min
            RAG_Backend-->>User: Fast response (10-20ms)
        else Semantic Match
            PostgreSQL->>PostgreSQL: Embedding similarity search
            PostgreSQL-->>RAG_Backend: Similar answer (20ms)
            RAG_Backend->>Redis: Cache for 5min
            RAG_Backend-->>User: Fast response (20ms)
        else No Match
            RAG_Backend->>RAG_Backend: Proceed to Haiku + RAG (1-2s)
        end
    end
```

### **Flow 4: Tool Execution (Dual Routing)**

```mermaid
sequenceDiagram
    participant Haiku
    participant ToolExecutor
    participant ZantaraTools
    participant HandlerProxy
    participant TS_Backend
    participant PostgreSQL

    Haiku->>Haiku: Needs tool: "team.recent_activity"
    Haiku->>ToolExecutor: Call tool with params
    ToolExecutor->>ToolExecutor: Check tool type
    
    alt Python Tool (ZantaraTools)
        ToolExecutor->>ZantaraTools: Execute Python function
        ZantaraTools->>PostgreSQL: Query team data
        PostgreSQL-->>ZantaraTools: Results
        ZantaraTools-->>ToolExecutor: Tool result
    else TypeScript Tool (Handler)
        ToolExecutor->>HandlerProxy: Proxy to TS Backend
        HandlerProxy->>TS_Backend: HTTP call (/call endpoint)
        TS_Backend->>TS_Backend: Execute handler
        TS_Backend-->>HandlerProxy: Handler result
        HandlerProxy-->>ToolExecutor: Tool result
    end
    
    ToolExecutor-->>Haiku: Tool result
    Haiku->>Haiku: Continue reasoning with result
```

---

## 🧠 AI MODELS ARCHITECTURE

```mermaid
graph TB
    subgraph "AI MODELS - 3 Total"
        direction TB
        
        subgraph "FRONTEND AI - 100%"
            H[Claude Haiku 4.5<br/>ZANTARA Identity<br/>──────────────<br/>Traffic: 100%<br/>Cost: $0.25/$1.25<br/>Speed: 1-2s<br/>Tools: 164<br/>Agents: 10<br/>Quality: 96.2% Sonnet]
        end
        
        subgraph "BACKGROUND AI"
            Z[ZANTARA Llama 3.1 8B<br/>Master Generator<br/>──────────────<br/>Training: 22,009 conv<br/>Accuracy: 98.74%<br/>Cost: €3-11/month<br/>Tasks:<br/>• Golden Answers<br/>• Cultural Knowledge<br/>• Shadow Mode<br/>• Batch Classification]
        end
        
        subgraph "DEVELOPMENT AI"
            D[DevAI Qwen 2.5 Coder<br/>Code Specialist<br/>──────────────<br/>Backend Only<br/>Cost: €1-3/month<br/>Handlers: 7<br/>Use: Code analysis]
        end
    end
    
    H -->|Uses| Cultural[Cultural Intelligence<br/>ZANTARA-generated]
    H -->|Uses| Golden[Golden Answers<br/>ZANTARA-generated]
    
    Z -->|Generates| Cultural
    Z -->|Generates| Golden
    
    style H fill:#d4edda,stroke:#28a745,stroke-width:3px
    style Z fill:#fff3cd,stroke:#ffc107,stroke-width:3px
    style D fill:#f8d7da,stroke:#dc3545,stroke-width:2px
```

---

## 🗄️ DATABASE ARCHITECTURE

```mermaid
graph LR
    subgraph "PostgreSQL - 34 Tables"
        direction TB
        
        subgraph "Core - 4"
            T1[users<br/>conversations<br/>memory_facts<br/>memory_entities]
        end
        
        subgraph "Business - 3"
            T2[clients<br/>projects<br/>work_sessions]
        end
        
        subgraph "Analytics - 3"
            T3[team_analytics<br/>performance_metrics<br/>handler_executions]
        end
        
        subgraph "Oracle - 19"
            T4[VISA: 5 tables<br/>KBLI: 6 tables<br/>TAX: 4 tables<br/>PROPERTY: 4 tables]
        end
        
        subgraph "ZANTARA - 4"
            T5[golden_answers<br/>query_clusters<br/>cultural_knowledge<br/>nightly_worker_runs]
        end
    end
    
    subgraph "ChromaDB - 14 Collections"
        direction TB
        
        C1[bali_zero_pricing<br/>visa_oracle<br/>kbli_eye<br/>tax_genius]
        C2[zantara_books<br/>12,907 embeddings<br/>214 books]
        C3[legal_architect<br/>legal_updates<br/>property_listings<br/>property_knowledge]
        C4[tax_updates<br/>tax_knowledge<br/>cultural_insights<br/>oracle_visa<br/>oracle_kbli]
    end
    
    subgraph "Redis"
        R1[API Cache<br/>TTL 5min]
        R2[Rate Limits<br/>Sliding window]
        R3[Metrics<br/>Hits/Misses]
    end
    
    T5 -.Generates.-> C4
    
    style T5 fill:#fff3cd,stroke:#ffc107,stroke-width:3px
    style C4 fill:#fff3cd,stroke:#ffc107,stroke-width:3px
```

---

## 🤖 AGENTIC ARCHITECTURE

```mermaid
graph TB
    subgraph "15 AGENTS TOTAL"
        direction TB
        
        subgraph "RAG Backend - 10 Agentic Functions"
            A1[1. Client Journey<br/>Orchestrator<br/>──────────────<br/>Multi-step workflows<br/>Progress tracking<br/>Auto notifications]
            A2[2. Proactive Compliance<br/>Monitor<br/>──────────────<br/>Deadline tracking<br/>Auto alerts<br/>Multi-channel notify]
            A3[3. Knowledge Graph<br/>Builder<br/>──────────────<br/>Entity relationships<br/>Semantic mapping<br/>Graph visualization]
            A4[4. Auto Ingestion<br/>Orchestrator<br/>──────────────<br/>Content pipeline<br/>Source monitoring<br/>Auto processing]
            A5[5. Cross Oracle<br/>Synthesis<br/>──────────────<br/>Multi-domain search<br/>Intelligence synthesis<br/>Combined insights]
            A6[6. Dynamic<br/>Pricing<br/>──────────────<br/>Context-aware pricing<br/>Market adaptation<br/>Personalization]
            A7[7. Autonomous<br/>Research<br/>──────────────<br/>Multi-source research<br/>Auto synthesis<br/>Report generation]
            A8[8. Intelligent Query<br/>Router<br/>──────────────<br/>Smart AI routing<br/>Performance optimize<br/>Cost efficiency]
            A9[9. Conflict<br/>Resolution<br/>──────────────<br/>Source contradictions<br/>Intelligent reconcile<br/>Truth synthesis]
            A10[10. Business Plan<br/>Generator<br/>──────────────<br/>Auto planning<br/>Market analysis<br/>Financial projections]
        end
        
        subgraph "Oracle System - 5 Oracle Agents"
            O1[VISA ORACLE<br/>Immigration intel<br/>Visa requirements]
            O2[KBLI EYE<br/>Business codes<br/>Classification]
            O3[TAX GENIUS<br/>Tax optimization<br/>Compliance]
            O4[LEGAL ARCHITECT<br/>Property law<br/>Legal docs]
            O5[MORGANA<br/>Content creation<br/>Marketing]
        end
    end
    
    A5 --> O1
    A5 --> O2
    A5 --> O3
    A5 --> O4
    A5 --> O5
    
    style A1 fill:#e1f5ff,stroke:#0366d6,stroke-width:2px
    style A2 fill:#e1f5ff,stroke:#0366d6,stroke-width:2px
    style A5 fill:#d4edda,stroke:#28a745,stroke-width:3px
```

---

## 🎭 JIWA ARCHITECTURE (Cultural Intelligence)

```mermaid
graph TB
    subgraph "JIWA CULTURAL INTELLIGENCE LAYER"
        direction TB
        
        JIWA[JIWA Middleware<br/>Cultural Intelligence Layer<br/>──────────────<br/>• Gotong royong<br/>• Musyawarah<br/>• Tri Hita Karana<br/>• Pancasila values]
        
        JIWA --> Detect[Cultural Context<br/>Detection<br/>──────────────<br/>• Language<br/>• Emotional tone<br/>• Relationship stage<br/>• Indonesian signals]
        
        JIWA --> Enrich[Request<br/>Enrichment<br/>──────────────<br/>• Add warmth<br/>• Cultural values<br/>• Relational context<br/>• Spiritual awareness]
        
        JIWA --> Enhance[Response<br/>Enhancement<br/>──────────────<br/>• Cultural appropriate<br/>• Emotional attunement<br/>• Warmth injection<br/>• Indonesian soul]
    end
    
    subgraph "PROPAGATION TO ALL LAYERS"
        Memory[Memory Service<br/>Relationship-focused<br/>Not just facts]
        Tools[Tool Handlers<br/>Actions with soul<br/>Not just functions]
        Data[Data Layer<br/>Cultural context<br/>Embedded meaning]
        Frontend[Frontend<br/>Warm Indonesian feel<br/>Not cold UI]
        Errors[Error Messages<br/>Empathetic<br/>Not technical]
    end
    
    JIWA --> Memory
    JIWA --> Tools
    JIWA --> Data
    JIWA --> Frontend
    JIWA --> Errors
    
    style JIWA fill:#fff3cd,stroke:#ffc107,stroke-width:4px
```

---

## 📊 SYSTEM STATISTICS DIAGRAM

```mermaid
graph LR
    subgraph "CODEBASE - 60,500+ Lines"
        Code1[RAG Backend<br/>15,000 lines<br/>Python/FastAPI]
        Code2[TS Backend<br/>25,000 lines<br/>TypeScript/Express]
        Code3[Frontend<br/>7,500 lines<br/>JavaScript/HTML]
        Code4[Intel Scraping<br/>8,000 lines<br/>Python]
        Code5[Projects<br/>5,000 lines<br/>TypeScript]
    end
    
    subgraph "FUNCTIONALITY - 137 Functions"
        Func1[TS Handlers<br/>122 handlers<br/>19 categories]
        Func2[RAG Agents<br/>10 agentic<br/>functions]
        Func3[Oracle Agents<br/>5 Oracle<br/>agents]
    end
    
    subgraph "DATA - 3 Databases"
        DB1[PostgreSQL<br/>34 tables<br/>~100MB]
        DB2[ChromaDB<br/>14 collections<br/>14,365 docs]
        DB3[Redis<br/>Cache + Limits<br/>In-memory]
    end
    
    subgraph "AI MODELS - 3 Models"
        AI1[Haiku 4.5<br/>100% frontend<br/>$8-15/month]
        AI2[ZANTARA Llama<br/>Background<br/>€3-11/month]
        AI3[DevAI Qwen<br/>Backend only<br/>€1-3/month]
    end
    
    Code1 --> Func2
    Code2 --> Func1
    Code5 --> Func3
    
    Func1 --> DB1
    Func2 --> DB2
    AI2 --> DB1
    AI2 --> DB2
    
    AI1 -.Uses.-> DB2
    AI1 -.Uses.-> DB3
```

---

## 🎯 ZANTARA CAPABILITIES MAP

```mermaid
mindmap
  root((ZANTARA<br/>L'anima di<br/>Bali Zero))
    AI Models
      Claude Haiku 4.5
        100% frontend
        164 tools
        10 agents
      ZANTARA Llama 3.1
        Golden Answers
        Cultural Knowledge
        Shadow Mode
      DevAI Qwen 2.5
        Backend only
        Code analysis
    Data Access
      PostgreSQL
        34 tables
        Memory, CRM, Analytics
      ChromaDB
        14 collections
        14,365 documents
      Redis
        Caching
        Rate limiting
    Tools - 164
      Google Workspace::8
      AI Services::10
      Bali Zero::15
      ZANTARA Intel::20
      Communication::10
      Analytics::15
      Memory::8
      Others::78
    Agents - 10
      Client Journey
      Compliance Monitor
      Knowledge Graph
      Auto Ingestion
      Cross Oracle
      Dynamic Pricing
      Autonomous Research
      Query Router
      Conflict Resolution
      Business Plan
    Personality
      WITH ZERO
        Strategic partner
        Italian language
      WITH TEAM
        Colleague friend
        Ambaradam names
      WITH CLIENTS
        Warm advisor
        Cultural guide
    Languages
      Indonesian::Primary
      English::Secondary
      Italian::ZERO only
      Javanese::Cultural
```

---

## 🔄 DATA FLOW ARCHITECTURE

```mermaid
flowchart TB
    Start([User Message])
    
    Start --> Auth{Auth Check}
    Auth -->|Demo| Public[25 Public Tools]
    Auth -->|Team| Protected[120 Team Tools]
    Auth -->|Admin| Full[164 All Tools]
    
    Public --> Cache{Golden Answer?}
    Protected --> Cache
    Full --> Cache
    
    Cache -->|Hit 50-60%| Instant[Return Cached<br/>10-20ms]
    Cache -->|Miss 40-50%| Router[Intelligent Router]
    
    Router --> Cultural{Need Cultural<br/>Context?}
    Cultural -->|Yes| CultRAG[Cultural RAG<br/>ChromaDB<br/><5ms]
    Cultural -->|No| RAG
    
    CultRAG --> RAG{Business<br/>Query?}
    RAG -->|Yes| ChromaDB[ChromaDB Search<br/>14 collections<br/>Top 5-10 docs]
    RAG -->|No| Skip[Skip RAG]
    
    ChromaDB --> Haiku[Claude Haiku 4.5<br/>ZANTARA Identity]
    Skip --> Haiku
    
    Haiku --> Tools{Need<br/>Tools?}
    Tools -->|Yes| ToolExec[Tool Executor<br/>Dual Routing]
    Tools -->|No| Response
    
    ToolExec --> Response[Response<br/>Generation]
    
    Response --> Save[Save to<br/>PostgreSQL]
    Save --> Stream[SSE Stream<br/>or JSON]
    
    Stream --> End([User Receives])
    Instant --> End
    
    style Haiku fill:#d4edda,stroke:#28a745,stroke-width:3px
    style Instant fill:#fff3cd,stroke:#ffc107,stroke-width:3px
```

---

**SISTEMA COMPLETO VISUALIZZATO!** 🎉
