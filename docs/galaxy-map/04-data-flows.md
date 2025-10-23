# 🔄 Data Flows - NUZANTARA

**Document:** 04-data-flows.md
**Audience:** DevOps, QA, Engineers
**Purpose:** Request flows, performance analysis, testing scenarios

---

## 🔄 FLOW 1: User Chat (Real-time)

```mermaid
sequenceDiagram
    autonumber
    
    User->>WebApp: Type message + Enter
    WebApp->>TS Backend: POST /call
    TS Backend->>TS Backend: Demo Auth (25 public tools)
    TS Backend->>RAG Backend: Proxy to /bali-zero/chat
    RAG Backend->>PostgreSQL: Check Golden Answer
    
    alt Golden Answer Found (50-60%)
        PostgreSQL-->>User: ⚡ Instant (10-20ms)
    else No Golden Answer (40-50%)
        RAG Backend->>ChromaDB: Search cultural_insights
        ChromaDB-->>RAG Backend: Cultural context (<5ms)
        RAG Backend->>ChromaDB: Search 14 collections
        ChromaDB-->>RAG Backend: Top 5-10 docs (2000-3000 words)
        RAG Backend->>Haiku 4.5: Generate with context
        Haiku 4.5->>Haiku 4.5: Tool calling (if needed)
        Haiku 4.5-->>RAG Backend: Response
        RAG Backend->>PostgreSQL: Save conversation
        RAG Backend-->>User: 🤖 Stream (SSE) 1-2s
    end
```

**Performance:**
- Golden Answer: 10-20ms (50-60% queries)
- Haiku + RAG: 1-2s (40-50% queries)
- With Tools: 2-4s (complex tasks)

---

## 🌙 FLOW 2: ZANTARA Nightly Worker

```mermaid
stateDiagram-v2
    [*] --> Trigger: 2 AM UTC
    
    Trigger --> QueryExtraction
    
    state QueryExtraction {
        [*] --> ReadLogs
        ReadLogs --> Filter
        Filter --> Cluster
        Cluster --> [*]: 127 queries, 23 clusters
    }
    
    QueryExtraction --> GoldenGeneration
    
    state GoldenGeneration {
        [*] --> Loop
        Loop --> RAGSearch: For each cluster
        RAGSearch --> LlamaGenerate
        LlamaGenerate --> SaveDB
        SaveDB --> Loop
        Loop --> [*]: 45 answers
    }
    
    GoldenGeneration --> CulturalGen
    
    state CulturalGen {
        [*] --> Topics: 10 topics
        Topics --> Generate
        Generate --> SaveBoth: PostgreSQL + ChromaDB
        SaveBoth --> [*]: 10 chunks
    }
    
    CulturalGen --> Log
    Log --> [*]: Complete (4-6h)
```

**Activation:** Manual or Cron
**Duration:** 4-6 hours
**Cost:** €0.50-1.00 per run
**Output:** 100-200 FAQ + 10 Cultural Chunks

---

## ⚡ FLOW 3: Golden Answer Lookup

```mermaid
flowchart TD
    Query[User Query]
    
    Query --> Hash[Generate MD5 Hash]
    Hash --> Redis{Redis<br/>Cache?}
    
    Redis -->|Hit| Instant[⚡ Return<br/>2ms]
    Redis -->|Miss| PG{PostgreSQL<br/>Exact Match?}
    
    PG -->|Yes| Fast[⚡ Return<br/>10ms]
    PG -->|No| Semantic{Semantic<br/>Match?}
    
    Semantic -->|>80%| Similar[⚡ Return<br/>20ms]
    Semantic -->|<80%| RAG[🔍 Haiku + RAG<br/>1-2s]
    
    Instant --> Cache[Cache 5min]
    Fast --> Cache
    Similar --> Cache
    
    Cache --> User[User]
    RAG --> User
    
    style Instant fill:#d4edda,stroke:#28a745,stroke-width:3px
    style Fast fill:#d4edda,stroke:#28a745,stroke-width:3px
    style Similar fill:#fff3cd,stroke:#ffc107,stroke-width:2px
```

---

## 🔧 FLOW 4: Tool Execution (Dual Routing)

```mermaid
graph TB
    Haiku[Haiku 4.5<br/>Needs Tool]
    
    Haiku --> ToolExec{Tool Executor<br/>Check Type}
    
    ToolExec -->|Python| Python[ZantaraTools<br/>9 functions]
    ToolExec -->|TypeScript| Proxy[Handler Proxy<br/>HTTP Bridge]
    
    Python --> DB1[(PostgreSQL<br/>Direct Access)]
    Proxy --> TS[TS Backend<br/>122 Handlers]
    
    DB1 --> Result[Tool Result]
    TS --> Result
    
    Result --> Continue[Haiku Continues<br/>Reasoning]
    Continue --> Final[Final Response]
    
    style Python fill:#fff3cd,stroke:#ffc107,stroke-width:2px
    style TS fill:#e1f5ff,stroke:#0366d6,stroke-width:2px
```

**Python Tools (9):**
- Direct PostgreSQL access
- Team logins, sessions, stats
- Memory operations

**TypeScript Tools (155):**
- Google Workspace integration
- CRM, Analytics, Communication
- All other business operations

---

## 📊 Performance Analysis

### Response Time Distribution

```mermaid
graph LR
    subgraph "100% Queries"
        Golden[Golden Answer<br/>50-60%<br/>10-20ms]
        RAG[Haiku + RAG<br/>40-50%<br/>1-2s]
    end
    
    Golden --> Avg[Average<br/>Response Time<br/>600-800ms]
    RAG --> Avg
    
    style Golden fill:#d4edda,stroke:#28a745,stroke-width:3px
```

**Average User Experience:**
- 50-60% get instant response (10-20ms)
- 40-50% get fast response (1-2s)
- **Overall avg: 600-800ms** ⚡

### Cost Per Query

| Scenario | Cost | Notes |
|----------|------|-------|
| **Golden Answer** | $0.0000 | Free (pre-generated) |
| **Redis Cache** | $0.0000 | Free (cached) |
| **Haiku + RAG** | $0.0012 | Anthropic API cost |
| **With Tools** | $0.0015 | Additional API calls |

**70-80% cost reduction** with Golden Answers!

---

## 🧪 Testing Scenarios

### Scenario 1: Simple Greeting

```
Input: "Ciao!"
Expected Flow:
1. Check Golden Answer → Miss
2. Skip RAG (greeting)
3. Haiku direct response
4. Response time: 300-500ms
5. No tools needed
```

### Scenario 2: Business Query (Golden Answer)

```
Input: "What docs for KITAS?"
Expected Flow:
1. Check Golden Answer → HIT
2. Return cached answer
3. Response time: 10-20ms
4. Cost: $0.0000
```

### Scenario 3: Complex Business Query

```
Input: "Open PT PMA for IT consulting, capital requirements?"
Expected Flow:
1. Check Golden Answer → Miss
2. RAG search (legal, kbli, tax)
3. Cultural context injection
4. Haiku generation with tools
5. Tools: kbli.lookup, oracle.analyze
6. Response time: 2-4s
7. Citations included
```

---

## 📚 For More Details

- **AI Intelligence**: [03-ai-intelligence.md](./03-ai-intelligence.md)
- **Database Schema**: [05-database-schema.md](./05-database-schema.md)
- **Technical Architecture**: [02-technical-architecture.md](./02-technical-architecture.md)

---

**Every flow optimized. Every millisecond counts.** ⚡🔄
