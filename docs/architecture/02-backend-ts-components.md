# 🔧 Backend TypeScript Components Deep Dive

**Version:** 5.2.0
**Last Updated:** 23 October 2025
**Total Files:** 96 handlers + 24 services + middleware + routing

This document provides detailed breakdown of the TypeScript backend architecture, based on **real code analysis**.

---

## 📊 Component Statistics (REAL DATA)

```
Total TypeScript Files: ~200+
├── Handlers: 96 files
├── Services: 24 files
├── Middleware: 8 files
├── Routing: 2 files
├── Config: 3 files
├── Utils: 2 files
└── Types/Interfaces: 5+ files
```

**Lines of Code:** ~60,000 total (backend-ts portion: ~15,000-20,000)

---

## 🏗️ Architecture Layers

### Layer 1: Entry Point (`index.ts`)

**File:** `apps/backend-ts/src/index.ts` (12,341 bytes / ~300 lines)

**Dependencies:**
```typescript
import app-gateway/app-bootstrap
import app-gateway/app-events
import config/flags
import core/load-all-handlers
import middleware/* (5 middleware)
import routing/index
import services/* (5 core services)
```

**Responsibilities:**
- Initialize Express app
- Load feature flags
- Bootstrap app gateway
- Configure middleware stack
- Load all handlers dynamically
- Start HTTP server (port 8080)
- Initialize WebSocket server
- Setup graceful shutdown

---

## 🌐 Layer 2: App Gateway

Gateway layer handles application bootstrap and event management.

### Components

#### `app-gateway/app-bootstrap.ts`
**Dependencies:**
- `session-store.ts` - Session management
- `types.ts` - Type definitions
- `config/flags.ts` - Feature flags

**Responsibilities:**
- Application initialization
- Session store setup
- Configuration loading

#### `app-gateway/app-events.ts`
**Dependencies:**
- `capability-map.ts` - Capability mappings
- `param-normalizer.ts` - Parameter normalization
- `session-store.ts` - Session management
- `core/handler-registry.ts` - Handler registry
- `services/logger.ts` - Logging

**Responsibilities:**
- Event handling
- Request routing coordination
- Session lifecycle management

#### `app-gateway/capability-map.ts`
Maps user capabilities to available features.

#### `app-gateway/param-normalizer.ts`
Normalizes request parameters across different handlers.

#### `app-gateway/session-store.ts`
**Dependencies:**
- `services/firebase.ts` - Firebase integration
- `services/logger.ts` - Logging

Manages user sessions with Firebase backend.

---

## 📦 Layer 3: Handler Modules (11 Modules, 96 Files)

Handlers are organized by feature domain. Each module has a `registry.ts` that registers all handlers.

### 1. **AI Services Module** (`handlers/ai-services/`)

**Handler Files (6):**
- `ai.ts` - Core AI handler (base for all AI interactions)
- `advanced-ai.ts` - Advanced AI features
- `ai-bridge.ts` - Bridge to external AI services
- `creative.ts` - Creative AI tools (image generation, etc.)
- `imagine-art-handler.ts` - ImagineArt API integration
- `zantara-llama.ts` - Llama model integration
- `registry.ts` - Module registration

**Key Dependencies:**
```
ai.ts → zantara-llama.ts, logger
advanced-ai.ts → ai.ts
creative.ts → google-auth-service
imagine-art-handler.ts → imagine-art-service
```

**Endpoints Provided:**
- `/api/ai/query` - Basic AI query
- `/api/ai/advanced` - Advanced AI features
- `/api/ai/creative` - Creative generation
- `/api/ai/imagine` - ImagineArt generation

---

### 2. **Analytics Module** (`handlers/analytics/`)

**Handler Files (5):**
- `analytics.ts` - General analytics
- `daily-drive-recap.ts` - Daily Drive activity summary
- `dashboard-analytics.ts` - Dashboard metrics
- `weekly-report.ts` - Weekly activity reports
- `registry.ts` - Module registration

**Key Dependencies:**
```
daily-drive-recap.ts → google-auth-service, logger
dashboard-analytics.ts → firebase, logger
weekly-report.ts → firebase, google-auth-service, logger
```

**Endpoints Provided:**
- `/api/analytics` - General analytics
- `/api/analytics/daily-recap` - Daily recap
- `/api/analytics/dashboard` - Dashboard data
- `/api/analytics/weekly` - Weekly report

---

### 3. **Bali Zero Module** (`handlers/bali-zero/`)

**Handler Files (7):**
- `advisory.ts` - Business advisory services
- `bali-zero-pricing.ts` - Pricing calculator
- `kbli.ts` - KBLI code lookup
- `oracle.ts` - Oracle agent interface
- `team-activity.ts` - Team activity tracking
- `team.ts` - Team management
- `registry.ts` - Module registration

**Key Dependencies:**
```
oracle.ts → bridgeProxy (to Backend RAG)
team-activity.ts → logger, session-tracker
kbli.ts → logger
```

**Endpoints Provided:**
- `/api/bali-zero/advisory` - Advisory services
- `/api/bali-zero/pricing` - Pricing info
- `/api/bali-zero/kbli` - KBLI lookup
- `/api/bali-zero/oracle` - Oracle agent query
- `/api/bali-zero/team` - Team management

**Critical Integration:** Oracle.ts bridges to Backend RAG for RAG queries.

---

### 4. **Communication Module** (`handlers/communication/`)

**Handler Files (6):**
- `communication.ts` - General communication
- `instagram.ts` - Instagram integration
- `translate.ts` - Translation service
- `twilio-whatsapp.ts` - Twilio WhatsApp integration
- `whatsapp.ts` - WhatsApp handler
- `registry.ts` - Module registration

**Key Dependencies:**
```
instagram.ts → ai.ts, memory-firestore, logger
whatsapp.ts → ai.ts, memory-firestore, logger
translate.ts → logger
```

**Endpoints Provided:**
- `/api/communication` - General communication
- `/api/communication/instagram` - Instagram webhook
- `/api/communication/whatsapp` - WhatsApp webhook
- `/api/communication/translate` - Translation

---

### 5. **DevAI Module** (`handlers/devai/`)

**Handler Files (4):**
- `devai-bridge.ts` - Bridge to DevAI service
- `devai-qwen.ts` - Qwen 2.5 Coder integration
- `devai-warmup.ts` - Model warmup
- `registry.ts` - Module registration

**Key Dependencies:**
```
devai-bridge.ts → ai-communication, logger
devai-qwen.ts → logger
```

**Endpoints Provided:**
- `/api/devai/query` - DevAI query
- `/api/devai/warmup` - Warmup model

---

### 6. **Google Workspace Module** (`handlers/google-workspace/`)

**Handler Files (8):**
- `calendar.ts` - Google Calendar
- `contacts.ts` - Google Contacts
- `docs.ts` - Google Docs
- `drive.ts` - Google Drive
- `gmail.ts` - Gmail
- `sheets.ts` - Google Sheets
- `slides.ts` - Google Slides
- `registry.ts` - Module registration

**Key Dependencies:**
```
All handlers → google-auth-service, bridgeProxy
drive.ts → logger (most complex)
gmail.ts → oauth2-client
```

**Endpoints Provided:**
- `/api/google/calendar/*` - Calendar operations
- `/api/google/contacts/*` - Contacts management
- `/api/google/docs/*` - Docs operations
- `/api/google/drive/*` - Drive operations
- `/api/google/gmail/*` - Email operations
- `/api/google/sheets/*` - Sheets operations
- `/api/google/slides/*` - Slides operations

---

### 7. **Identity Module** (`handlers/identity/`)

**Handler Files (2):**
- `identity.ts` - Identity management
- `registry.ts` - Module registration

**Key Dependencies:**
```
identity.ts → monitoring, cacheProxy, logger
```

**Endpoints Provided:**
- `/api/identity` - User identity info

---

### 8. **Maps Module** (`handlers/maps/`)

**Handler Files (2):**
- `maps.ts` - Google Maps integration
- `registry.ts` - Module registration

**Key Dependencies:**
```
maps.ts → bridgeProxy
```

**Endpoints Provided:**
- `/api/maps/*` - Maps operations

---

### 9. **Memory Module** (`handlers/memory/`)

**Handler Files (6):**
- `conversation-autosave.ts` - Auto-save conversations
- `episodes-firestore.ts` - Episode storage
- `memory-cache-stats.ts` - Cache statistics
- `memory-firestore.ts` - Firestore memory storage
- `user-memory.ts` - User memory management
- `registry.ts` - Module registration

**Key Dependencies:**
```
memory-firestore.ts → firebase, logger, memory-vector
conversation-autosave.ts → daily-drive-recap, drive
episodes-firestore.ts → firebase, logger
```

**Endpoints Provided:**
- `/api/memory` - Memory operations
- `/api/memory/episodes` - Episode management
- `/api/memory/stats` - Cache stats
- `/api/memory/autosave` - Auto-save

---

### 10. **RAG Module** (`handlers/rag/`)

**Handler Files (2):**
- `rag.ts` - RAG query handler
- `registry.ts` - Module registration

**Key Dependencies:**
```
rag.ts → logger, ragService
```

**Endpoints Provided:**
- `/api/rag/query` - RAG query endpoint

**Critical:** This is the **main entry point** for RAG queries from frontend.

---

### 11. **Zantara Module** (`handlers/zantara/`)

**Handler Files (6):**
- `knowledge.ts` - Knowledge base
- `zantara-brilliant.ts` - Brilliant mode
- `zantara-dashboard.ts` - Dashboard
- `zantara-test.ts` - Testing endpoint
- `zantara-v2-simple.ts` - Simplified v2
- `registry.ts` - Module registration

**Key Dependencies:**
```
zantara-brilliant.ts → core/zantara-orchestrator
```

**Endpoints Provided:**
- `/api/zantara/knowledge` - Knowledge query
- `/api/zantara/brilliant` - Orchestrated multi-agent
- `/api/zantara/dashboard` - Dashboard data
- `/api/zantara/test` - Test endpoint

**Critical:** `zantara-brilliant.ts` is the **entry point for Oracle multi-agent system**.

---

## 🛠️ Layer 4: Core Services (24 Files)

Services provide reusable business logic across handlers.

### Critical Services

#### `services/logger.ts`
**Dependencies:** None (base service)
**Used by:** Nearly EVERY handler (80+ files)

Winston-based structured logging.

#### `services/firebase.ts`
**Dependencies:** `logger.ts`
**Used by:** 15+ handlers

Firestore, Firebase Auth integration.

#### `services/ragService.ts`
**Dependencies:** `logger.ts`
**Used by:** `handlers/rag/rag.ts`

**Critical:** Proxy to Backend RAG (port 8000).

```typescript
// Simplified interface
async function queryRAG(query: string, tier: number): Promise<RAGResult> {
  // Calls http://localhost:8000/api/rag/query
  const response = await axios.post('http://localhost:8000/api/rag/query', {
    query,
    tier
  });
  return response.data;
}
```

#### `services/oauth2-client.ts`
**Dependencies:** `logger.ts`, `token-path.ts`
**Used by:** Google Workspace handlers

OAuth2 token management for Google APIs.

#### `services/websocket-server.ts`
**Dependencies:** `logger.ts`
**Used by:** `index.ts`, `handlers/admin/websocket-admin.ts`

WebSocket server for real-time communication.

#### `services/google-auth-service.ts`
**Dependencies:** `logger.ts`, `oauth2-client.ts`
**Used by:** All Google Workspace handlers

Google authentication and authorization.

#### `services/memory-vector.ts`
**Dependencies:** `logger.ts`, `memory-cache.ts`
**Used by:** `handlers/memory/memory-firestore.ts`

Vector-based memory search.

#### `services/anti-hallucination.ts` & `services/reality-anchor.ts`
**Dependencies:** `firebase.ts`, `logger.ts`
**Used by:** `middleware/validation.ts`, `middleware/reality-check.ts`

AI response validation and grounding.

### All 24 Services

```
services/
├── ai-communication.ts        # AI service communication
├── anti-hallucination.ts      # AI validation
├── bridgeProxy.ts             # Service bridge proxy
├── cacheProxy.ts              # Cache proxy
├── firebase.ts                # Firebase integration ⭐
├── google-auth-service.ts     # Google OAuth ⭐
├── imagine-art-service.ts     # ImagineArt API
├── logger.ts                  # Winston logger ⭐⭐⭐
├── memory-cache.ts            # Memory caching
├── memory-vector.ts           # Vector memory
├── oauth2-client.ts           # OAuth2 client ⭐
├── rag-warmup.ts              # RAG warmup
├── ragService.ts              # RAG proxy ⭐⭐
├── reality-anchor.ts          # Reality grounding
├── session-tracker.ts         # Session tracking
├── token-path.ts              # Token management
└── websocket-server.ts        # WebSocket server ⭐
```

⭐ = Critical service
⭐⭐ = Very critical
⭐⭐⭐ = Used everywhere

---

## 🛡️ Layer 5: Middleware Stack (8 Files)

Middleware forms a processing pipeline for every request.

### Middleware Execution Order

```
1. correlationId      → Add request ID
2. auth/jwt-auth      → Authenticate user
3. monitoring         → Track request metrics
4. flagGate           → Feature flag checks
5. rate-limit         → Rate limiting
6. validation         → Input validation
7. reality-check      → AI grounding
→ Handler execution
```

### Middleware Details

#### `middleware/correlationId.ts`
**Dependencies:** None
Adds unique request ID for tracing.

#### `middleware/auth.ts` & `middleware/jwt-auth.ts`
**Dependencies:** `config/index.ts`, `logger.ts`
JWT token validation and user authentication.

#### `middleware/monitoring.ts`
**Dependencies:** `firebase.ts`, `logger.ts`, `session-tracker.ts`
**Critical:** Logs every request with metrics.

#### `middleware/rate-limit.ts` & `middleware/selective-rate-limit.ts`
**Dependencies:** `logger.ts`
Rate limiting per user/IP.

#### `middleware/validation.ts`
**Dependencies:** `anti-hallucination.ts`, `logger.ts`
Input validation and sanitization.

#### `middleware/reality-check.ts`
**Dependencies:** `anti-hallucination.ts`, `reality-anchor.ts`, `logger.ts`
Validates AI responses for hallucinations.

---

## 🗺️ Layer 6: Routing (`routing/`)

### `routing/router.ts` (The Central Router)

**This file is MASSIVE** - it imports and registers **50+ handlers**.

**Dependencies:** ALL handlers + middleware + services

**Structure:**
```typescript
// Import all handlers
import { aiHandler } from 'handlers/ai-services/ai';
import { ragHandler } from 'handlers/rag/rag';
// ... 50+ more imports

// Register routes
router.post('/api/ai/query', authMiddleware, aiHandler);
router.post('/api/rag/query', authMiddleware, ragHandler);
// ... 50+ more routes
```

**Critical:** This is the **single source of truth** for all API endpoints.

### `routing/index.ts`
Simple re-export of `router.ts`.

---

## 🧠 Layer 7: Core Orchestration

### `core/handler-registry.ts`
**Dependencies:** `logger.ts`

Handler registration system. Allows dynamic loading of handlers.

### `core/load-all-handlers.ts`
**Dependencies:** `handler-registry.ts` + ALL handler registries (11)

Loads all 11 handler modules at startup.

```typescript
import { registerAIServices } from 'handlers/ai-services/registry';
import { registerAnalytics } from 'handlers/analytics/registry';
// ... 11 imports

loadAllHandlers() {
  registerAIServices();
  registerAnalytics();
  // ... 11 registrations
}
```

### `core/zantara-orchestrator.ts` ⭐⭐⭐
**Dependencies:** All 5 Oracle agents + `memory-firestore.ts` + `logger.ts`

**CRITICAL COMPONENT:** Multi-agent orchestrator.

```typescript
// Orchestrates 5 Oracle agents
import { visaOracle } from 'agents/visa-oracle';
import { kbliEye } from 'agents/eye-kbli';
import { taxGenius } from 'agents/tax-genius';
import { legalArchitect } from 'agents/legal-architect';
import { propertySage } from 'agents/property-sage';

async function orchestrate(query: string, tier: number) {
  // Determine which agents needed
  // Query agents in parallel
  // Synthesize responses
  // Return combined result
}
```

---

## 🤖 Layer 8: Oracle Agents (5 Files)

### Agent Files

```
agents/
├── visa-oracle.ts       # Immigration & KITAS
├── eye-kbli.ts          # Business classification (KBLI codes)
├── tax-genius.ts        # Tax consulting
├── legal-architect.ts   # Legal consulting
└── property-sage.ts     # Real estate consulting
```

**Dependencies:** None (leaf nodes)

Each agent:
- Has specialized system prompt
- Queries RAG for domain knowledge
- Returns structured advice

---

## 🔧 Configuration & Utils

### `config/flags.ts`
Feature flag system.

### `config/index.ts`
**Dependencies:** `logger.ts`
Application configuration.

### `utils/errors.ts`
Custom error classes.

### `utils/response.ts`
Standardized API responses.

---

## 📈 Dependency Complexity

**Most depended-upon services:**
1. `services/logger.ts` - Used by 80+ files
2. `services/firebase.ts` - Used by 15+ files
3. `services/google-auth-service.ts` - Used by 8 files
4. `utils/response.ts` - Used by 50+ files
5. `utils/errors.ts` - Used by 40+ files

**Most complex handlers:**
1. `routing/router.ts` - Imports 50+ handlers
2. `core/load-all-handlers.ts` - Imports 11 modules
3. `core/zantara-orchestrator.ts` - Orchestrates 5 agents
4. `handlers/google-workspace/drive.ts` - Complex Drive operations
5. `handlers/memory/memory-firestore.ts` - Vector + Firestore

---

## 🎯 Critical Integration Points

### 1. **Backend RAG Integration**
- **Entry:** `services/ragService.ts`
- **Calls:** `http://localhost:8000/api/rag/query`
- **Used by:** `handlers/rag/rag.ts`, all Oracle agents

### 2. **Firebase Integration**
- **Entry:** `services/firebase.ts`
- **Used for:** Firestore, Auth, Analytics
- **Used by:** 15+ handlers

### 3. **Google Workspace Integration**
- **Entry:** `services/google-auth-service.ts`
- **OAuth:** `services/oauth2-client.ts`
- **Used by:** 8 Google Workspace handlers

### 4. **Oracle Multi-Agent System**
- **Entry:** `core/zantara-orchestrator.ts`
- **Agents:** 5 domain specialists
- **Accessed via:** `handlers/zantara/zantara-brilliant.ts`

---

## 📊 Summary Statistics

```
Total Components: 200+ files
├── Handlers: 96 files (11 modules)
├── Services: 24 files
├── Middleware: 8 files
├── Routing: 2 files
├── Core: 3 files
├── Agents: 5 files
├── Config: 3 files
├── Utils: 2 files
└── Types: 5+ files

API Endpoints: 50+
Dependencies: 300+ inter-module connections
Lines of Code: ~15,000-20,000 (backend-ts)
```

---

**Generated from:** Real madge analysis + file counting
**Accuracy:** Based on actual code structure, not estimates
