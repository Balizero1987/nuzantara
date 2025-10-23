# 🗺️ NUZANTARA - SYSTEM ARCHITECTURE DIAGRAM

**View this file on GitHub to see the rendered diagrams automatically!**

---

## 📊 DIAGRAM 1: COMPLETE SYSTEM OVERVIEW

```mermaid
graph TB
    subgraph "🌐 CLIENT LAYER"
        User[👤 User<br/>Browser/Mobile]
    end
    
    subgraph "FRONTEND"
        WebApp[🌐 WebApp<br/>zantara.balizero.com<br/>65 JS files + PWA]
    end
    
    subgraph "BACKEND - Railway"
        TS[⚙️ TS Backend :8080<br/>122 Handlers]
        RAG[🧠 RAG Backend :8000<br/>AI + RAG + Agents]
    end
    
    subgraph "AI MODELS"
        Haiku[🤖 Haiku 4.5<br/>Frontend 100%]
        Llama[🧠 ZANTARA Llama<br/>Background Worker]
    end
    
    subgraph "DATA"
        PG[(🗄️ PostgreSQL<br/>34 tables)]
        Chroma[(🔍 ChromaDB<br/>14 collections)]
        Redis[(⚡ Redis<br/>Cache)]
    end
    
    User --> WebApp
    WebApp --> TS
    TS --> RAG
    RAG --> Haiku
    RAG --> Llama
    
    Haiku --> Chroma
    Haiku --> PG
    Haiku --> Redis
    
    Llama --> Chroma
    Llama --> PG
    
    style Haiku fill:#d4edda,stroke:#28a745,stroke-width:3px
    style Llama fill:#fff3cd,stroke:#ffc107,stroke-width:3px
```

---

## 🔄 DIAGRAM 2: USER REQUEST FLOW

```mermaid
sequenceDiagram
    autonumber
    
    User->>WebApp: Type message
    WebApp->>TS Backend: API Call
    TS Backend->>RAG Backend: Proxy
    RAG Backend->>PostgreSQL: Check Golden Answer
    
    alt Golden Answer Found (50-60%)
        PostgreSQL-->>User: ⚡ Instant (10-20ms)
    else No Golden Answer
        RAG Backend->>ChromaDB: Search RAG
        RAG Backend->>Haiku 4.5: Generate
        Haiku 4.5-->>User: 🤖 Response (1-2s)
    end
```

---

## 🌙 DIAGRAM 3: ZANTARA NIGHTLY WORKER

```mermaid
flowchart LR
    Cron[⏰ 2 AM UTC]
    
    Cron --> Worker[🌙 Nightly Worker]
    
    Worker --> Task1[📊 Query Analysis<br/>Extract & Cluster]
    
    Task1 --> Task2[🌟 Golden Answers<br/>100-200 FAQ<br/>ZANTARA generates]
    
    Task2 --> Task3[🎭 Cultural Knowledge<br/>10 chunks<br/>Indonesian intel]
    
    Task3 --> Save[(💾 Save<br/>PostgreSQL<br/>ChromaDB)]
    
    Save --> Done[✅ Complete<br/>4-6 hours]
    
    style Worker fill:#e7e7ff,stroke:#6f42c1,stroke-width:3px
    style Task2 fill:#fff3cd,stroke:#ffc107,stroke-width:3px
```

---

## 🤖 DIAGRAM 4: AI MODELS

```mermaid
graph LR
    subgraph "FRONTEND - 100%"
        H[Claude Haiku 4.5<br/>──────────────<br/>ALL user queries<br/>164 tools<br/>$8-15/month]
    end
    
    subgraph "BACKGROUND"
        Z[ZANTARA Llama 3.1<br/>──────────────<br/>Golden Answers<br/>Cultural Knowledge<br/>€3-11/month]
    end
    
    H -.Uses.-> Output[Cultural Intelligence<br/>Golden Answers]
    Z -.Generates.-> Output
    
    style H fill:#d4edda,stroke:#28a745,stroke-width:4px
    style Z fill:#fff3cd,stroke:#ffc107,stroke-width:4px
```

---

## 🗄️ DIAGRAM 5: DATABASE STRUCTURE

```mermaid
graph TB
    subgraph "PostgreSQL - 34 Tables"
        Core[Core: 4<br/>users, conversations<br/>memory]
        Business[Business: 3<br/>clients, projects]
        Oracle[Oracle: 19<br/>VISA, KBLI, TAX]
        ZANTARA[ZANTARA: 4<br/>golden_answers<br/>cultural_knowledge]
    end
    
    subgraph "ChromaDB - 14 Collections"
        Biz[Business: 4<br/>pricing, visa, kbli]
        Books[Books: 2<br/>12,907 embeddings]
        Legal[Legal + Property: 6<br/>legal, tax, property]
        Cultural[Cultural: 2<br/>cultural_insights]
    end
    
    ZANTARA -.Generates.-> Cultural
    
    style ZANTARA fill:#fff3cd,stroke:#ffc107,stroke-width:3px
    style Cultural fill:#fff3cd,stroke:#ffc107,stroke-width:3px
```

---

## ⚡ DIAGRAM 6: PERFORMANCE

```mermaid
flowchart TD
    Query[User Query]
    
    Query --> Check{Golden<br/>Answer?}
    
    Check -->|Hit 50-60%| Fast[⚡ 10-20ms<br/>250x speedup]
    Check -->|Miss 40-50%| RAG[🔍 RAG + Haiku<br/>1-2s]
    
    Fast --> User[User]
    RAG --> User
    
    style Fast fill:#d4edda,stroke:#28a745,stroke-width:3px
```

---

## 🎯 DIAGRAM 7: ZANTARA CAPABILITIES

```mermaid
mindmap
  root((ZANTARA))
    164 Tools
      Google - 8
      AI - 10
      Bali Zero - 15
      Communication - 10
      Analytics - 15
      Memory - 8
      Others - 98
    15 Agents
      10 RAG Agents
        Journey
        Compliance
        Knowledge Graph
        Ingestion
        Cross Oracle
        Pricing
        Research
        Router
        Conflict
        Business Plan
      5 Oracle
        VISA
        KBLI
        TAX
        Legal
        Morgana
    3 Databases
      PostgreSQL - 34
      ChromaDB - 14
      Redis - Cache
```

---

## 💰 DIAGRAM 8: COST COMPARISON

```mermaid
graph LR
    Before[Before<br/>Sonnet-based<br/>──────────────<br/>$25-55/month]
    
    After[After<br/>Haiku-only<br/>──────────────<br/>$8-15/month]
    
    Savings[💰 Savings<br/>──────────────<br/>3x cheaper<br/>Same quality]
    
    Before --> After
    After --> Savings
    
    style Savings fill:#d4edda,stroke:#28a745,stroke-width:3px
```

---

**View this file on GitHub to see all diagrams rendered automatically!**

**Link**: https://github.com/Balizero1987/nuzantara/blob/main/SYSTEM_ARCHITECTURE_DIAGRAM.md
