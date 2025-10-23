# 🗺️ NUZANTARA - SYSTEM DIAGRAMS (SIMPLIFIED)

**Data**: 23 Ottobre 2025, 21:00
**Approach**: Diagrammi separati per layer per migliore leggibilità

---

## 📊 DIAGRAM 1: HIGH-LEVEL ARCHITECTURE

```mermaid
graph TB
    subgraph "CLIENT"
        User[👤 User<br/>Browser/Mobile]
    end
    
    subgraph "FRONTEND - GitHub Pages"
        WebApp[🌐 WebApp<br/>zantara.balizero.com<br/>65 JS files + PWA]
    end
    
    subgraph "BACKEND - Railway"
        TS[⚙️ TS Backend :8080<br/>122 Handlers<br/>Express + TypeScript]
        RAG[🧠 RAG Backend :8000<br/>FastAPI + Python<br/>AI + RAG + Agents]
    end
    
    subgraph "AI MODELS"
        Haiku[🤖 Haiku 4.5<br/>Frontend 100%]
        Llama[🧠 ZANTARA Llama<br/>Background Worker]
        DevAI[💻 DevAI Qwen<br/>Backend Only]
    end
    
    subgraph "DATA"
        PG[(🗄️ PostgreSQL<br/>34 tables)]
        Chroma[(🔍 ChromaDB<br/>14 collections<br/>14,365 docs)]
        RedisDB[(⚡ Redis<br/>Cache + Limits)]
    end
    
    User --> WebApp
    WebApp --> TS
    TS --> RAG
    RAG --> Haiku
    RAG --> Llama
    TS --> DevAI
    
    Haiku --> Chroma
    Haiku --> PG
    Haiku --> RedisDB
    
    Llama --> Chroma
    Llama --> PG
    
    style Haiku fill:#d4edda,stroke:#28a745,stroke-width:3px
    style Llama fill:#fff3cd,stroke:#ffc107,stroke-width:3px
    style WebApp fill:#e1f5ff,stroke:#0366d6,stroke-width:2px
```

---

## 🔄 DIAGRAM 2: USER REQUEST FLOW (Simple)

```mermaid
sequenceDiagram
    autonumber
    
    User->>WebApp: Message
    WebApp->>TS Backend: API Call
    TS Backend->>RAG Backend: Proxy
    RAG Backend->>PostgreSQL: Check Golden Answer
    
    alt Golden Answer Found (50-60%)
        PostgreSQL-->>User: Instant Response (10-20ms) ⚡
    else No Golden Answer (40-50%)
        RAG Backend->>ChromaDB: Search 14 collections
        RAG Backend->>Haiku 4.5: Generate + RAG context
        Haiku 4.5-->>User: Response (1-2s) 🤖
    end
```

---

## 🌙 DIAGRAM 3: ZANTARA NIGHTLY WORKER

```mermaid
flowchart LR
    Cron[⏰ 2 AM UTC<br/>Daily Trigger]
    
    Cron --> Worker[🌙 Nightly Worker]
    
    Worker --> Task1[📊 Task 1<br/>Query Analysis<br/>Extract from logs<br/>Cluster queries]
    
    Task1 --> Task2[🌟 Task 2<br/>Golden Answers<br/>100-200 FAQ<br/>ZANTARA generates]
    
    Task2 --> Task3[🎭 Task 3<br/>Cultural Knowledge<br/>10 chunks<br/>Indonesian intel]
    
    Task3 --> Save[(💾 Save<br/>PostgreSQL<br/>ChromaDB)]
    
    Save --> Done[✅ Complete<br/>4-6 hours<br/>€0.50-1.00]
    
    style Worker fill:#e7e7ff,stroke:#6f42c1,stroke-width:3px
    style Task2 fill:#fff3cd,stroke:#ffc107,stroke-width:3px
```

---

## 🤖 DIAGRAM 4: AI MODELS ROLES

```mermaid
graph LR
    subgraph "FRONTEND - 100% Traffic"
        H[Claude Haiku 4.5<br/>──────────────<br/>✅ ALL user queries<br/>✅ 164 tools access<br/>✅ 10 agents orchestration<br/>✅ $0.25/$1.25 per 1M<br/>✅ 1-2s response]
    end
    
    subgraph "BACKGROUND - Nightly"
        Z[ZANTARA Llama 3.1<br/>──────────────<br/>🌟 Golden Answers<br/>🎭 Cultural Knowledge<br/>🔬 Shadow Mode<br/>📊 Batch Classification<br/>€3-11/month<br/>4-6h per run]
    end
    
    subgraph "DEVELOPMENT - Backend"
        D[DevAI Qwen 2.5<br/>──────────────<br/>💻 Code analysis<br/>🐛 Bug fixing<br/>📝 Code review<br/>€1-3/month<br/>Backend only]
    end
    
    H -.Uses.-> Z_Output[Cultural Intelligence<br/>Golden Answers]
    Z -.Generates.-> Z_Output
    
    style H fill:#d4edda,stroke:#28a745,stroke-width:4px
    style Z fill:#fff3cd,stroke:#ffc107,stroke-width:4px
    style D fill:#f8d7da,stroke:#dc3545,stroke-width:2px
```

---

## 🗄️ DIAGRAM 5: DATABASE STRUCTURE

```mermaid
graph TB
    subgraph "PostgreSQL - 34 Tables"
        Core[Core - 4<br/>users, conversations<br/>memory_facts<br/>memory_entities]
        
        Business[Business - 3<br/>clients, projects<br/>work_sessions]
        
        Analytics[Analytics - 3<br/>team_analytics<br/>performance_metrics<br/>handler_executions]
        
        Oracle[Oracle - 19<br/>VISA: 5 tables<br/>KBLI: 6 tables<br/>TAX: 4 tables<br/>PROPERTY: 4 tables]
        
        ZANTARA[ZANTARA - 4<br/>golden_answers<br/>query_clusters<br/>cultural_knowledge<br/>nightly_worker_runs]
    end
    
    subgraph "ChromaDB - 14 Collections"
        Biz[Business: 4<br/>pricing, visa<br/>kbli, tax]
        
        Know[Knowledge: 2<br/>zantara_books<br/>kb_indonesian]
        
        Legal[Legal: 2<br/>legal_architect<br/>legal_updates]
        
        PropTax[Property + Tax: 4<br/>property_listings<br/>property_knowledge<br/>tax_updates<br/>tax_knowledge]
        
        Cult[Cultural: 2<br/>cultural_insights<br/>oracle knowledge]
    end
    
    ZANTARA -.Generates.-> Cult
    ZANTARA -.Populates.-> ZANTARA
    
    style ZANTARA fill:#fff3cd,stroke:#ffc107,stroke-width:3px
    style Cult fill:#fff3cd,stroke:#ffc107,stroke-width:3px
```

---

## 🎯 DIAGRAM 6: TOOLS & AGENTS (164 + 15)

```mermaid
mindmap
  root((ZANTARA<br/>Capabilities))
    164 Tools
      Google Workspace - 8
        Gmail
        Drive
        Calendar
        Sheets
      AI Services - 10
        ai.chat
        zantara.chat
        devai.chat
      Bali Zero - 15
        pricing
        kbli.lookup
        oracle.analyze
      Communication - 10
        whatsapp.send
        slack.notify
        email.send
      Analytics - 15
        team.health
        dashboard
        performance
      Memory - 8
        save
        retrieve
        search
      Others - 98
        CRM, Maps, Identity
        System, RAG, etc
    15 Agents
      10 RAG Agents
        Client Journey
        Compliance Monitor
        Knowledge Graph
        Auto Ingestion
        Cross Oracle
        Dynamic Pricing
        Research
        Query Router
        Conflict Resolution
        Business Plan
      5 Oracle Agents
        VISA Oracle
        KBLI Eye
        TAX Genius
        Legal Architect
        Morgana
```

---

## ⚡ DIAGRAM 7: PERFORMANCE FLOW

```mermaid
flowchart LR
    Start([User Query])
    
    Start --> Golden{Golden<br/>Answer?}
    
    Golden -->|50-60% Hit| Cache[⚡ Cached<br/>10-20ms<br/>250x speedup]
    Golden -->|40-50% Miss| RAG[🔍 RAG Search<br/>ChromaDB<br/>50-100ms]
    
    RAG --> Haiku[🤖 Haiku 4.5<br/>Generation<br/>1-2s]
    
    Haiku --> Tools{Need<br/>Tools?}
    
    Tools -->|Yes| Exec[🔧 Execute<br/>+1-2s]
    Tools -->|No| Direct[Direct]
    
    Exec --> Response[📤 Response]
    Direct --> Response
    Cache --> Response
    
    Response --> End([User])
    
    style Cache fill:#d4edda,stroke:#28a745,stroke-width:3px
    style Haiku fill:#fff3cd,stroke:#ffc107,stroke-width:2px
```

---

## 🎭 DIAGRAM 8: JIWA ARCHITECTURE (Simple)

```mermaid
graph TB
    Request[User Request]
    
    Request --> JIWA[🕉️ JIWA Middleware<br/>Cultural Intelligence<br/>──────────────<br/>Gotong royong<br/>Musyawarah<br/>Tri Hita Karana]
    
    JIWA --> Detect[Detect Cultural<br/>Context]
    JIWA --> Enrich[Enrich Request]
    JIWA --> Enhance[Enhance Response]
    
    Detect --> All[All System<br/>Components]
    Enrich --> All
    Enhance --> All
    
    All --> Memory[Memory:<br/>Relationships<br/>not facts]
    All --> Tools[Tools:<br/>Actions with soul<br/>not functions]
    All --> Data[Data:<br/>Cultural context<br/>embedded]
    All --> FE[Frontend:<br/>Warm UI<br/>not cold]
    
    Memory --> Response[Response<br/>with JIWA]
    Tools --> Response
    Data --> Response
    FE --> Response
    
    Response --> User[User Receives<br/>Culturally Intelligent<br/>Response]
    
    style JIWA fill:#fff3cd,stroke:#ffc107,stroke-width:4px
```

---

## 📈 DIAGRAM 9: COST & PERFORMANCE

```mermaid
graph LR
    subgraph "MONTHLY COST: $15-30"
        Cost1[Haiku 4.5<br/>$8-15<br/>100% traffic]
        Cost2[ZANTARA Llama<br/>€3-11<br/>Nightly worker]
        Cost3[DevAI Qwen<br/>€1-3<br/>Backend only]
    end
    
    subgraph "PERFORMANCE"
        Perf1[Golden Answer<br/>10-20ms<br/>50-60% queries]
        Perf2[Haiku + RAG<br/>1-2s<br/>40-50% queries]
        Perf3[With Tools<br/>2-4s<br/>Complex tasks]
    end
    
    subgraph "QUALITY"
        Q1[Haiku Quality<br/>96.2% of Sonnet<br/>with RAG]
        Q2[ZANTARA Quality<br/>98.74% accuracy<br/>22,009 trained]
        Q3[Cost Savings<br/>3x cheaper<br/>vs Sonnet]
    end
    
    style Perf1 fill:#d4edda,stroke:#28a745,stroke-width:3px
    style Q3 fill:#d4edda,stroke:#28a745,stroke-width:3px
```

---

## 🔧 DIAGRAM 10: DEPLOYMENT ARCHITECTURE

```mermaid
graph TB
    subgraph "Railway Platform"
        direction TB
        
        TS[TS Backend<br/>──────────────<br/>Port: 8080<br/>Memory: 2Gi<br/>CPU: 2 vCPU<br/>Dockerfile]
        
        RAG[RAG Backend<br/>──────────────<br/>Port: 8000<br/>Memory: 2Gi<br/>CPU: 2 vCPU<br/>Dockerfile]
        
        DB[(PostgreSQL<br/>──────────────<br/>Managed<br/>34 tables<br/>~100MB)]
    end
    
    subgraph "GitHub"
        Pages[GitHub Pages<br/>──────────────<br/>Static CDN<br/>Auto-deploy<br/>zantara.balizero.com]
    end
    
    subgraph "External Services"
        API1[Anthropic<br/>Haiku 4.5]
        API2[RunPod<br/>ZANTARA + DevAI]
        API3[Google<br/>Workspace]
        API4[Twilio<br/>WhatsApp/SMS]
    end
    
    Pages --> TS
    TS --> RAG
    TS --> DB
    RAG --> DB
    
    RAG --> API1
    RAG --> API2
    TS --> API2
    TS --> API3
    TS --> API4
    
    style TS fill:#e1f5ff,stroke:#0366d6,stroke-width:2px
    style RAG fill:#fff3cd,stroke:#ffc107,stroke-width:2px
    style Pages fill:#d4edda,stroke:#28a745,stroke-width:2px
```

---

## 🧠 DIAGRAM 11: AI DECISION TREE

```mermaid
flowchart TD
    Query[User Query]
    
    Query --> Check{Check Golden<br/>Answers}
    
    Check -->|Match Found| Instant[⚡ Return Cached<br/>10-20ms<br/>70-80% cost savings]
    
    Check -->|No Match| Type{Query Type?}
    
    Type -->|Greeting/Casual| Simple[Skip RAG<br/>Direct to Haiku]
    Type -->|Business/Complex| Enhanced[RAG Search<br/>+ Cultural Context]
    
    Simple --> Haiku[🤖 Haiku 4.5<br/>ZANTARA Identity]
    Enhanced --> Cultural[Cultural RAG<br/><5ms]
    Cultural --> ChromaDB[ChromaDB Search<br/>Top 5-10 docs]
    ChromaDB --> Haiku
    
    Haiku --> Tools{Need Tools?}
    
    Tools -->|Yes| Execute[Execute Tool<br/>164 available]
    Tools -->|No| Direct[Direct Response]
    
    Execute --> Response[Stream Response]
    Direct --> Response
    
    Response --> Save[Save Conversation<br/>PostgreSQL]
    Save --> User[User Receives]
    Instant --> User
    
    style Instant fill:#d4edda,stroke:#28a745,stroke-width:3px
    style Haiku fill:#fff3cd,stroke:#ffc107,stroke-width:3px
```

---

## 🌙 DIAGRAM 12: ZANTARA NIGHTLY WORKER (Detailed)

```mermaid
stateDiagram-v2
    [*] --> Start: 2 AM UTC Daily
    
    Start --> QueryExtraction: Extract queries from logs
    
    state QueryExtraction {
        [*] --> ReadLogs: Read last 3-7 days
        ReadLogs --> Filter: Filter user queries
        Filter --> Count: Count frequency
        Count --> [*]: 127 queries found
    }
    
    QueryExtraction --> Clustering: Semantic clustering
    
    state Clustering {
        [*] --> Embed: Generate embeddings
        Embed --> Group: Group similar queries
        Group --> Rank: Rank by frequency
        Rank --> [*]: 23 clusters identified
    }
    
    Clustering --> GoldenGeneration: Generate Golden Answers
    
    state GoldenGeneration {
        [*] --> ForEach: For each cluster
        ForEach --> RAGSearch: ChromaDB search (legal docs)
        RAGSearch --> LlamaCall: ZANTARA Llama generates
        LlamaCall --> Validate: Validate citations
        Validate --> SaveDB: Save to PostgreSQL
        SaveDB --> ForEach
        ForEach --> [*]: 45 answers generated
    }
    
    GoldenGeneration --> CulturalGen: Generate Cultural Knowledge
    
    state CulturalGen {
        [*] --> Topics: 10 cultural topics
        Topics --> LlamaGen: ZANTARA generates
        LlamaGen --> SaveBoth: Save PostgreSQL + ChromaDB
        SaveBoth --> [*]: 10 chunks saved
    }
    
    CulturalGen --> Logging: Log completion
    Logging --> [*]: Complete (4-6h)
```

---

## 🔧 DIAGRAM 13: TOOL EXECUTION (Dual Routing)

```mermaid
graph TB
    Haiku[Claude Haiku 4.5<br/>Needs Tool]
    
    Haiku --> ToolExec{Tool Executor<br/>Check Type}
    
    ToolExec -->|Python Tool| Python[ZantaraTools<br/>9 functions]
    ToolExec -->|TS Tool| Proxy[Handler Proxy<br/>HTTP Bridge]
    
    Python --> DB1[(PostgreSQL<br/>Direct Access)]
    Proxy --> TS[TS Backend<br/>122 Handlers]
    
    DB1 --> Result1[Tool Result]
    TS --> Result2[Tool Result]
    
    Result1 --> Haiku2[Haiku Continues<br/>Reasoning]
    Result2 --> Haiku2
    
    Haiku2 --> Response[Final Response<br/>to User]
    
    style Python fill:#fff3cd,stroke:#ffc107,stroke-width:2px
    style TS fill:#e1f5ff,stroke:#0366d6,stroke-width:2px
```

---

## 📊 DIAGRAM 14: DATA STATISTICS

```mermaid
graph LR
    subgraph "CODEBASE - 60,500 Lines"
        C1[RAG Backend<br/>15,000 lines<br/>Python]
        C2[TS Backend<br/>25,000 lines<br/>TypeScript]
        C3[Frontend<br/>7,500 lines<br/>JavaScript]
        C4[Intel Scraping<br/>8,000 lines<br/>Python]
        C5[Projects<br/>5,000 lines<br/>TypeScript]
    end
    
    subgraph "FUNCTIONS - 137 Total"
        F1[TS Handlers<br/>122]
        F2[RAG Agents<br/>10]
        F3[Oracle Agents<br/>5]
    end
    
    subgraph "DATA - 48 Collections/Tables"
        D1[PostgreSQL<br/>34 tables]
        D2[ChromaDB<br/>14 collections<br/>14,365 docs]
    end
    
    C2 --> F1
    C1 --> F2
    C5 --> F3
    
    F1 --> D1
    F2 --> D2
    F3 --> D2
```

---

## 🎯 DIAGRAM 15: ZANTARA IDENTITY & PERSONALITY

```mermaid
mindmap
  root((ZANTARA<br/>L'anima di<br/>Bali Zero))
    Identity
      NOT Assistant
      NOT Haiku model
      IS Team Member
      IS Cultural Guide
      Powered by Haiku 4.5
    Personality
      WITH ZERO
        Strategic partner
        Italian language
        Celebrate vision
      WITH TEAM
        Colleague friend
        Ambaradam names
        Skip formalities
      WITH CLIENTS
        Warm advisor
        Cultural guide
        Indonesian wisdom
    Languages
      Indonesian - Primary
      English - Secondary
      Italian - ZERO only
      Javanese - Cultural
    Philosophy
      Gotong royong
      Musyawarah
      Tri Hita Karana
      Pancasila values
```

---

## 📈 DIAGRAM 16: PERFORMANCE COMPARISON

```mermaid
graph LR
    subgraph "RESPONSE TIMES"
        T1[Golden Answer<br/>10-20ms<br/>⚡⚡⚡]
        T2[Cached Redis<br/>2ms<br/>⚡⚡⚡⚡]
        T3[Haiku + RAG<br/>1-2s<br/>⚡]
        T4[With Tools<br/>2-4s<br/>⚡]
    end
    
    subgraph "COST EFFICIENCY"
        Before[Before<br/>Sonnet-based<br/>$25-55/month]
        After[After<br/>Haiku-only<br/>$8-15/month]
        Savings[💰 Savings<br/>3x cheaper<br/>Same quality]
    end
    
    Before --> After
    After --> Savings
    
    style T1 fill:#d4edda,stroke:#28a745,stroke-width:3px
    style T2 fill:#d4edda,stroke:#28a745,stroke-width:3px
    style Savings fill:#d4edda,stroke:#28a745,stroke-width:3px
```

---

**DIAGRAMMI SEMPLIFICATI E LEGGIBILI!** 🎉

Ogni diagram si concentra su un aspetto specifico del sistema, facile da leggere e comprendere.
