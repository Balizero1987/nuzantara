# 🗺️ MAPPA COMPLETA SISTEMA NUZANTARA

**Data**: 23 Ottobre 2025, 19:00
**Analisi**: Sistema completo - Backend, Database, Handlers, Agents

---

## 🏗️ ARCHITETTURA GENERALE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  🌐 Webapp (GitHub Pages)                                                      │
│  ├── chat.html (SSE Streaming)                                                │
│  ├── login.html (Team Authentication)                                          │
│  ├── dashboard.html (Analytics)                                                │
│  └── 32 JS files (7,500+ righe codice pronto)                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              GATEWAY LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  🔀 Railway Gateway (Load Balancer)                                            │
│  ├── Route: /bali-zero/* → RAG Backend (Python)                               │
│  ├── Route: /call → TS Backend (TypeScript)                                    │
│  └── Route: /team/* → TS Backend (Authentication)                             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
│    RAG BACKEND          │ │   TS BACKEND            │ │    DATABASE LAYER       │
│   (Python/FastAPI)      │ │  (Node.js/Express)      │ │                         │
│   Port: 8000            │ │  Port: 8080            │ │                         │
└─────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘
```

---

## 🧠 RAG BACKEND (Python) - DETTAGLI COMPLETI

### **Core Services** (15 servizi):
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RAG BACKEND SERVICES                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  🔍 SearchService (14 ChromaDB collections)                                      │
│  ├── bali_zero_pricing, visa_oracle, kbli_eye, tax_genius                      │
│  ├── legal_architect, kb_indonesian, kbli_comprehensive                         │
│  ├── zantara_books, cultural_insights                                           │
│  └── tax_updates, tax_knowledge, property_listings, property_knowledge, legal_updates │
│                                                                                 │
│  🤖 AI Services (3 modelli)                                                     │
│  ├── ClaudeHaikuService (60% traffic - fast responses)                         │
│  ├── ClaudeSonnetService (35% traffic - business intelligence)                 │
│  └── DevAIService (5% traffic - code assistance)                               │
│                                                                                 │
│  🧠 Memory & Intelligence                                                       │
│  ├── MemoryServicePostgres (conversation persistence)                          │
│  ├── EmotionalAttunementService (emotional AI)                                 │
│  ├── CollaborativeCapabilitiesService (team intelligence)                      │
│  └── MemoryFactExtractor (fact extraction)                                     │
│                                                                                 │
│  🔧 Orchestration                                                               │
│  ├── IntelligentRouter (AI routing logic)                                      │
│  ├── ToolExecutor (dual routing Python/TS)                                     │
│  ├── HandlerProxyService (TS handler bridge)                                   │
│  └── CulturalRAGService (Indonesian cultural intelligence)                     │
│                                                                                 │
│  📊 Analytics & Monitoring                                                      │
│  ├── AlertService (multi-channel notifications)                                │
│  ├── WorkSessionService (session tracking)                                     │
│  └── TeamAnalyticsService (team performance)                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### **10 Agenti Automatici** (6,500+ righe codice):
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AGENTIC FUNCTIONS                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  🎯 PHASE 1: FOUNDATION (3 agents)                                             │
│  ├── Smart Fallback Chain Agent (confidence scoring, auto-routing)              │
│  ├── Conflict Resolution Agent (multi-collection search, timestamp resolution) │
│  └── Collection Health Monitor (metrics tracking, staleness detection)        │
│                                                                                 │
│  🚀 PHASE 2: CORE AGENTS (2 agents)                                            │
│  ├── Client Journey Orchestrator (end-to-end client management)                │
│  └── Proactive Compliance Monitor (regulatory compliance tracking)           │
│                                                                                 │
│  🧠 PHASE 3: ORCHESTRATION (2 agents)                                          │
│  ├── Knowledge Graph Builder (semantic relationships)                          │
│  └── Auto Ingestion Orchestrator (content pipeline automation)               │
│                                                                                 │
│  ⚡ PHASE 4: ADVANCED (2 agents)                                                │
│  ├── Cross Oracle Synthesis (multi-source intelligence fusion)                │
│  └── Dynamic Pricing (real-time pricing optimization)                          │
│                                                                                 │
│  🤖 PHASE 5: AUTOMATION (1 agent)                                                │
│  └── Autonomous Research (self-directed research and analysis)                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### **API Endpoints** (RAG Backend):
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RAG API ENDPOINTS                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  💬 Chat & Streaming                                                           │
│  ├── POST /bali-zero/chat-stream (SSE streaming)                               │
│  ├── POST /bali-zero/chat (standard chat)                                      │
│  └── GET /bali-zero/health (health check)                                     │
│                                                                                 │
│  🔍 Search & Intelligence                                                      │
│  ├── POST /bali-zero/search (semantic search)                                 │
│  ├── POST /bali-zero/intel (intelligence queries)                             │
│  └── GET /bali-zero/collections (collection status)                           │
│                                                                                 │
│  🧠 Memory & Analytics                                                         │
│  ├── POST /bali-zero/memory/save (save conversation)                          │
│  ├── GET /bali-zero/memory/retrieve (load conversation)                       │
│  └── GET /bali-zero/analytics/team (team analytics)                           │
│                                                                                 │
│  🔧 Oracle System                                                              │
│  ├── POST /bali-zero/oracle/visa (visa oracle queries)                         │
│  ├── POST /bali-zero/oracle/kbli (KBLI oracle queries)                         │
│  └── POST /bali-zero/oracle/tax (tax oracle queries)                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ TS BACKEND (TypeScript) - DETTAGLI COMPLETI

### **122 Handlers** (categorizzati):
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              TS BACKEND HANDLERS                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│  🏢 Google Workspace (8+ handlers)                                             │
│  ├── gmail.send, gmail.read, gmail.search                                      │
│  ├── calendar.create, calendar.list, calendar.update                           │
│  ├── drive.upload, drive.download, drive.list                                 │
│  └── docs.create, sheets.create, slides.create                                 │
│                                                                                 │
│  🤖 AI Services (10+ handlers)                                                 │
│  ├── ai.chat, ai.anticipate, ai.learn, ai.xai.explain                          │
│  ├── creative.image.generate, creative.speech.synthesize                       │
│  └── zantara.call-devai, zantara.orchestrate, zantara.history                  │
│                                                                                 │
│  🏝️ Bali Zero Business (15+ handlers)                                         │
│  ├── bali-zero.pricing.get, bali-zero.pricing.calculate                        │
│  ├── bali-zero.kbli.lookup, bali-zero.visa.requirements                         │
│  ├── bali-zero.document.prepare, bali-zero.quote.generate                       │
│  └── bali-zero.oracle.predict, bali-zero.compliance.check                      │
│                                                                                 │
│  🧠 ZANTARA Intelligence (20+ handlers)                                         │
│  ├── zantara.personality.profile, zantara.attune                               │
│  ├── zantara.synergy.map, zantara.anticipate.needs                             │
│  ├── zantara.communication.adapt, zantara.learn.together                        │
│  ├── zantara.mood.sync, zantara.conflict.mediate                               │
│  ├── zantara.growth.track, zantara.celebration.orchestrate                     │
│  ├── zantara.emotional.profile.advanced, zantara.conflict.prediction            │
│  ├── zantara.multi.project.orchestration                                       │
│  ├── zantara.client.relationship.intelligence                                  │
│  ├── zantara.cultural.intelligence.adaptation                                  │
│  ├── zantara.performance.optimization                                          │
│  ├── zantara.dashboard.overview, zantara.team.health.monitor                    │
│  ├── zantara.performance.analytics, zantara.system.diagnostics                  │
│  └── zantara.knowledge.get, zantara.health.check                              │
│                                                                                 │
│  📞 Communication (10+ handlers)                                               │
│  ├── whatsapp.send, whatsapp.receive, whatsapp.status                         │
│  ├── instagram.post, instagram.analytics, instagram.user.analytics              │
│  ├── slack.send, discord.send, telegram.send                                   │
│  └── translate.text, translate.detect                                          │
│                                                                                 │
│  📊 Analytics & Monitoring (15+ handlers)                                       │
│  ├── analytics.track, analytics.report, analytics.dashboard                    │
│  ├── dashboard.main, dashboard.conversations, dashboard.services                │
│  ├── dashboard.handlers, dashboard.health, dashboard.users                      │
│  ├── weekly.report, daily.recap                                               │
│  └── team.analytics, team.health, team.performance                              │
│                                                                                 │
│  🧠 Memory & Persistence (8+ handlers)                                          │
│  ├── memory.save, memory.search, memory.retrieve, memory.list                   │
│  ├── memory.search.enhanced, memory.retrieve.enhanced                          │
│  ├── memory.entity.search, memory.entity.info                                   │
│  ├── memory.semantic.search, memory.hybrid.search                              │
│  ├── memory.event.save, memory.timeline.get, memory.entity.events             │
│  ├── conversation.autosave                                                     │
│  └── user.memory.save, user.memory.retrieve, user.memory.list, user.memory.login │
│                                                                                 │
│  🗺️ Maps & Location (3 handlers)                                                 │
│  ├── maps.directions, maps.places, maps.place.details                          │
│                                                                                 │
│  🔍 RAG Integration (4 handlers)                                                 │
│  ├── rag.query, rag.search, rag.health                                          │
│  └── bali-zero.chat (RAG chat integration)                                     │
│                                                                                 │
│  🔧 System & Development (10+ handlers)                                         │
│  ├── system.handlers.list, system.handlers.category, system.handlers.get       │
│  ├── system.handlers.tools, system.handler.execute                             │
│  ├── devai.code.analyze, devai.bug.detect, devai.performance.optimize          │
│  └── zero.* (Zero-only development tools)                                      │
│                                                                                 │
│  🔐 Identity & Authentication (3 handlers)                                      │
│  ├── identity.resolve, identity.profile.get, identity.profile.update           │
│                                                                                 │
│  🏢 AMBARADAM Integration (5+ handlers)                                         │
│  ├── ambaradam.profile.upsert, ambaradam.folder.ensure                          │
│  ├── document.analyze, drive.download, drive.upload.enhanced                     │
│  └── docs.create.enhanced, calendar.create.enhanced                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### **API Endpoints** (TS Backend):
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              TS API ENDPOINTS                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  🔧 Core API                                                                   │
│  ├── POST /call (main handler execution)                                       │
│  ├── GET /health (health check)                                                │
│  └── GET /status (system status)                                               │
│                                                                                 │
│  🔐 Authentication                                                              │
│  ├── POST /team.login (team authentication)                                    │
│  ├── POST /team.logout (logout)                                                │
│  └── GET /team.status (auth status)                                            │
│                                                                                 │
│  🧠 ZANTARA Knowledge                                                           │
│  ├── GET /zantara/knowledge (system knowledge)                                 │
│  ├── GET /zantara/health (ZANTARA health)                                      │
│  └── GET /zantara/system (system info)                                         │
│                                                                                 │
│  📊 Analytics & Monitoring                                                      │
│  ├── GET /analytics/team (team analytics)                                       │
│  ├── GET /analytics/performance (performance metrics)                           │
│  └── GET /analytics/health (system health)                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ DATABASE LAYER - DETTAGLI COMPLETI

### **PostgreSQL** (Railway Managed):
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              POSTGRESQL DATABASE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  👥 User Management                                                             │
│  ├── users (user profiles, authentication)                                      │
│  ├── user_sessions (active sessions)                                           │
│  └── user_permissions (role-based access)                                       │
│                                                                                 │
│  💬 Conversation & Memory                                                       │
│  ├── conversations (chat history)                                               │
│  ├── conversation_messages (individual messages)                               │
│  ├── memory_facts (extracted facts)                                             │
│  ├── memory_entities (entity relationships)                                     │
│  └── memory_events (episodic events)                                             │
│                                                                                 │
│  🏢 Business Context                                                            │
│  ├── clients (client profiles)                                                  │
│  ├── projects (project tracking)                                                │
│  ├── work_sessions (session analytics)                                         │
│  └── handler_executions (tool usage logs)                                       │
│                                                                                 │
│  📊 Analytics & Monitoring                                                      │
│  ├── team_analytics (team performance)                                         │
│  ├── performance_metrics (system metrics)                                       │
│  ├── error_logs (error tracking)                                                │
│  └── nightly_worker_runs (batch job tracking)                                  │
│                                                                                 │
│  🔧 Oracle System Tables (19 tables)                                            │
│  ├── tax_updates, tax_knowledge                                                 │
│  ├── property_listings, property_knowledge                                      │
│  ├── legal_updates, legal_knowledge                                            │
│  ├── visa_oracle_data, kbli_oracle_data                                         │
│  └── cultural_insights, business_intelligence                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### **ChromaDB** (14 Collections):
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CHROMADB COLLECTIONS                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  🏝️ Bali Zero Business (4 collections)                                         │
│  ├── bali_zero_pricing (pricing data, quotes)                                  │
│  ├── visa_oracle (visa requirements, procedures)                               │
│  ├── kbli_eye (KBLI codes, business structures)                               │
│  └── tax_genius (tax regulations, compliance)                                  │
│                                                                                 │
│  📚 Knowledge Base (3 collections)                                             │
│  ├── zantara_books (214 books, 7,375+ documents)                              │
│  ├── kb_indonesian (Indonesian business knowledge)                             │
│  └── kbli_comprehensive (comprehensive KBLI data)                              │
│                                                                                 │
│  ⚖️ Legal & Compliance (2 collections)                                          │
│  ├── legal_architect (legal documents, procedures)                             │
│  └── legal_updates (legal updates, changes)                                    │
│                                                                                 │
│  🏠 Real Estate (2 collections)                                                │
│  ├── property_listings (property data)                                          │
│  └── property_knowledge (real estate knowledge)                                │
│                                                                                 │
│  💰 Tax System (2 collections)                                                   │
│  ├── tax_updates (tax regulation updates)                                       │
│  └── tax_knowledge (tax knowledge base)                                         │
│                                                                                 │
│  🎭 Cultural Intelligence (1 collection)                                        │
│  └── cultural_insights (Indonesian cultural knowledge)                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 DATA FLOW COMPLETO

### **User Query Flow**:
```
1. User Query → Frontend (chat.html)
2. Frontend → Railway Gateway
3. Gateway → RAG Backend (/bali-zero/chat-stream)
4. RAG Backend → IntelligentRouter
5. IntelligentRouter → ClaudeHaiku/Sonnet/DevAI
6. AI → ChromaDB Search (14 collections)
7. AI → PostgreSQL Memory (conversation save)
8. AI → TS Backend (handler execution if needed)
9. TS Backend → Google Workspace/Communication
10. Response → SSE Stream → Frontend
```

### **Handler Execution Flow**:
```
1. User Request → Frontend
2. Frontend → TS Backend (/call)
3. TS Backend → Handler Registry (122 handlers)
4. Handler → External Service (Gmail, Calendar, etc.)
5. Handler → PostgreSQL (save results)
6. Handler → RAG Backend (if RAG needed)
7. Response → Frontend
```

---

## 📊 STATISTICHE COMPLETE

### **Codebase Size**:
- **RAG Backend**: ~15,000 righe (Python)
- **TS Backend**: ~25,000 righe (TypeScript)
- **Frontend**: ~7,500 righe (JavaScript)
- **Total**: ~47,500 righe di codice

### **Database Size**:
- **PostgreSQL**: 19 Oracle tables + 15 core tables
- **ChromaDB**: 14 collections, 7,375+ documents
- **Total Storage**: ~100MB+ (Railway managed)

### **API Endpoints**:
- **RAG Backend**: 12 endpoints
- **TS Backend**: 8 endpoints
- **Total**: 20 API endpoints

### **Handlers & Agents**:
- **TS Handlers**: 122 handlers
- **RAG Agents**: 10 agentic functions
- **Total**: 132 executable functions

---

## 🎯 FEATURES IMPLEMENTATE

### **✅ COMPLETAMENTE IMPLEMENTATE**:
1. **SSE Streaming** (RAG Backend)
2. **122 Handlers** (TS Backend)
3. **10 Agenti Automatici** (RAG Backend)
4. **14 ChromaDB Collections** (Vector Search)
5. **PostgreSQL Memory** (Conversation Persistence)
6. **Multi-AI Routing** (Haiku + Sonnet + DevAI)
7. **Oracle System** (19 tables)
8. **Authentication** (JWT + Team Login)
9. **Analytics** (Team + Performance)
10. **Communication** (WhatsApp, Instagram, Slack)

### **⚠️ PARZIALMENTE IMPLEMENTATE**:
1. **Frontend Integration** (32 JS files non collegati)
2. **PWA Support** (codice pronto, non attivo)
3. **Advanced Caching** (codice pronto, non attivo)
4. **Error Handling** (codice pronto, non attivo)

### **❌ NON IMPLEMENTATE**:
1. **Fill-in-Middle RAG** (ricerca necessaria)
2. **Conversation State ML** (complesso)
3. **Multi-factor Selection** (complesso)
4. **MCP Integration** (framework esterno)
5. **Letta Integration** (framework esterno)

---

## 🚀 PIANO DI COLLEGAMENTO

### **FASE 1: COLLEGA FRONTEND** (3-4h)
- SSE Streaming → chat.html
- Storage Manager → chat.html
- Conversation Persistence → chat.html
- Cache Manager → chat.html
- Error Handler → chat.html
- PWA Installer → chat.html

### **FASE 2: FEATURES SEMPLICI** (50min)
- Dynamic Token Manager
- RAG Warmup Service

### **FASE 3: ADVANCED** (Future)
- Fill-in-Middle RAG
- Conversation State ML
- Multi-factor Selection

---

**TOTALE SISTEMA**: 47,500+ righe, 132 funzioni, 20 API, 2 database, 10 agenti automatici! 🎉
