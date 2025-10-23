# 🔄 Data Flow & Sequence Diagrams

**Version:** 5.2.0
**Last Updated:** 23 October 2025
**Purpose:** Detailed sequence diagrams for all critical system flows

This document provides **accurate, detailed sequence diagrams** for understanding how data flows through nuzantara.

---

## 📋 Table of Contents

1. [RAG Query Flow](#1-rag-query-flow)
2. [Authentication Flow](#2-authentication-flow)
3. [Oracle Multi-Agent Collaboration](#3-oracle-multi-agent-collaboration)
4. [Google Workspace Integration](#4-google-workspace-integration)
5. [Memory Management](#5-memory-management)
6. [WebSocket Real-Time Communication](#6-websocket-real-time-communication)
7. [Deployment Pipeline](#7-deployment-pipeline)

---

## 1. RAG Query Flow

**Complete end-to-end flow for semantic search queries.**

```mermaid
sequenceDiagram
    participant U as User Browser
    participant W as WebApp (8081)
    participant G as Gateway
    participant M as Middleware Stack
    participant H as RAG Handler
    participant RS as RAG Service
    participant RB as RAG Backend (8000)
    participant C as ChromaDB
    participant E as Embeddings Model
    participant L as LLM (Anthropic)
    participant F as Firestore

    U->>W: Enter query: "How to get KITAS?"
    W->>W: Prepare request payload
    W->>G: POST /api/rag/query<br/>{query, tier}

    Note over G: index.ts entry point

    G->>M: Pass to middleware

    rect rgb(255, 240, 240)
        Note over M: Middleware Pipeline
        M->>M: 1. correlationId<br/>Add request ID
        M->>M: 2. JWT Auth<br/>Validate token
        M->>M: 3. Monitoring<br/>Log request start
        M->>M: 4. Rate Limit<br/>Check limits
        M->>M: 5. Validation<br/>Sanitize input
        M->>M: 6. Reality Check<br/>Pre-validation
    end

    M->>H: Route to RAG handler
    Note over H: handlers/rag/rag.ts

    H->>H: Extract tier from user
    H->>RS: queryRAG(query, tier, limit)
    Note over RS: services/ragService.ts

    RS->>RB: POST http://localhost:8000/api/rag/query<br/>{query, tier, limit}

    rect rgb(240, 255, 240)
        Note over RB,L: RAG Backend Processing

        RB->>RB: Validate tier (0-3)
        RB->>E: Generate query embedding
        E->>E: sentence-transformers<br/>encode(query)
        E-->>RB: embedding vector [384d]

        RB->>C: Semantic search<br/>where tier <= user_tier
        C->>C: Vector similarity search
        C-->>RB: Top 10 chunks<br/>(sorted by relevance)

        RB->>RB: Format context<br/>from chunks

        RB->>L: Anthropic API call<br/>messages.create()
        Note over L: claude-3-5-sonnet-20241022

        alt Streaming Mode
            L-->>RB: Stream tokens (SSE)
            RB-->>RS: Stream response
            RS-->>H: Stream chunks
            H-->>W: Server-Sent Events
            W-->>U: Real-time display
        else Non-Streaming
            L-->>RB: Complete response
            RB-->>RS: RAG result
            RS-->>H: Formatted response
            H-->>W: JSON response
            W-->>U: Display answer
        end
    end

    H->>F: Log query metrics
    F-->>H: Stored

    Note over U,F: Total time: ~1-2 seconds
```

### Key Components

| Component | File | Responsibility |
|-----------|------|----------------|
| Gateway | `index.ts` | Request entry |
| Middleware | `middleware/*` | Auth, validation, monitoring |
| RAG Handler | `handlers/rag/rag.ts` | Request handling |
| RAG Service | `services/ragService.ts` | Backend proxy |
| RAG Backend | `apps/backend-rag/backend/app/main_cloud.py` | RAG logic |
| ChromaDB | External | Vector storage |
| Anthropic | External API | LLM generation |

### Performance Targets

- **Query embedding**: < 200ms
- **Vector search**: < 500ms
- **LLM generation**: < 1-2s
- **Total end-to-end**: < 2-3s

---

## 2. Authentication Flow

**JWT-based authentication with Firebase integration.**

```mermaid
sequenceDiagram
    participant U as User
    participant W as WebApp
    participant A as Auth Handler
    participant FB as Firebase Service
    participant FS as Firestore
    participant DB as PostgreSQL

    Note over U,DB: Login Flow

    U->>W: Enter credentials
    W->>A: POST /api/auth/team-login<br/>{email, password}

    A->>FB: Verify credentials
    FB->>FS: Query user document
    FS-->>FB: User data

    alt User exists in Firebase
        FB-->>A: User verified
        A->>A: Check tier permissions
        A->>DB: Fetch user profile
        DB-->>A: Profile data

        A->>A: Generate JWT token<br/>payload: {userId, email, tier}
        A->>A: Sign with JWT_SECRET

        A-->>W: {token, user, tier, expiresIn}
        W->>W: Store token (localStorage)
        W-->>U: Login successful

    else User not found
        FB-->>A: User not found
        A-->>W: 401 Unauthorized
        W-->>U: Invalid credentials
    end

    Note over U,DB: Authenticated Request Flow

    U->>W: Click "Query RAG"
    W->>W: Get token from storage
    W->>A: GET /api/rag/query<br/>Header: Authorization: Bearer <token>

    rect rgb(255, 250, 240)
        Note over A: JWT Middleware (middleware/jwt-auth.ts)

        A->>A: Extract token from header
        A->>A: Verify token signature
        A->>A: Check expiration

        alt Token valid
            A->>A: Decode payload
            A->>A: Attach user to request
            A->>A: Continue to handler
        else Token invalid/expired
            A-->>W: 401 Unauthorized
            W->>W: Clear token
            W-->>U: Redirect to login
        end
    end
```

### Authentication Stack

**Middleware Chain:**
```
Request
  → correlationId (add request ID)
  → jwt-auth (verify token)
  → monitoring (log authenticated user)
  → rate-limit (per-user limits)
  → handler
```

**Key Files:**
- `handlers/auth/team-login.ts` - Login handler
- `middleware/jwt-auth.ts` - JWT verification
- `services/firebase.ts` - Firebase integration
- `services/logger.ts` - Audit logging

---

## 3. Oracle Multi-Agent Collaboration

**Complex query requiring multiple domain experts.**

```mermaid
sequenceDiagram
    participant U as User
    participant H as Zantara Handler<br/>zantara-brilliant.ts
    participant O as Orchestrator<br/>zantara-orchestrator.ts
    participant V as VISA Oracle
    participant K as KBLI Eye
    participant T as Tax Genius
    participant L as Legal Architect
    participant R as RAG Backend
    participant C as ChromaDB
    participant M as Memory (Firestore)

    U->>H: POST /api/zantara/brilliant<br/>"Setup PT PMA with 2 foreign directors"

    H->>O: orchestrate(query, tier, mode)

    rect rgb(240, 248, 255)
        Note over O: Query Classification

        O->>O: Analyze query keywords
        O->>O: Detect domains:<br/>• Legal (PT PMA)<br/>• Business (KBLI)<br/>• Tax (corporate)<br/>• Immigration (foreign directors)

        O->>O: Select agents:<br/>[legal, kbli, tax, visa]

        O->>O: Determine strategy:<br/>PARALLEL (4 agents)
    end

    rect rgb(255, 248, 240)
        Note over O,C: Parallel Agent Execution

        par Legal Architect Query
            O->>L: "PT PMA formation requirements"
            L->>L: Build prompt with tier=2
            L->>R: POST /api/rag/query<br/>{query: "PT PMA setup", tier: 2}
            R->>C: Search legal documents
            C-->>R: Chunks (legal framework)
            R-->>L: Context chunks
            L->>L: Generate legal response
            L-->>O: {<br/>  response: "PT PMA requires...",<br/>  timeline: "2-3 months",<br/>  cost: "IDR 60-80M"<br/>}

        and KBLI Eye Query
            O->>K: "KBLI codes for tech company"
            K->>K: Build prompt with tier=1
            K->>R: POST /api/rag/query<br/>{query: "tech business KBLI", tier: 1}
            R->>C: Search KBLI database
            C-->>R: Chunks (KBLI codes)
            R-->>K: Context chunks
            K->>K: Generate KBLI response
            K-->>O: {<br/>  response: "Recommended codes...",<br/>  codes: ["62013", "62021"],<br/>  licenses: ["OSS", "NIB"]<br/>}

        and Tax Genius Query
            O->>T: "Tax structure for PT PMA"
            T->>T: Build prompt with tier=2
            T->>R: POST /api/rag/query<br/>{query: "PT PMA tax", tier: 2}
            R->>C: Search tax regulations
            C-->>R: Chunks (tax law)
            R-->>T: Context chunks
            T->>T: Generate tax response
            T-->>O: {<br/>  response: "Corporate tax rate...",<br/>  rates: {corporate: "22%", VAT: "11%"},<br/>  obligations: ["PPh 25", "PPN"]<br/>}

        and VISA Oracle Query
            O->>V: "KITAS for foreign directors"
            V->>V: Build prompt with tier=1
            V->>R: POST /api/rag/query<br/>{query: "KITAS foreign director", tier: 1}
            R->>C: Search immigration docs
            C-->>R: Chunks (KITAS procedures)
            R-->>V: Context chunks
            V->>V: Generate VISA response
            V-->>O: {<br/>  response: "KITAS application...",<br/>  requirements: ["passport", "sponsor"],<br/>  timeline: "4-6 weeks"<br/>}
        end
    end

    rect rgb(240, 255, 240)
        Note over O: Response Synthesis

        O->>O: Collect all agent responses
        O->>O: Check for conflicts
        O->>O: Merge information
        O->>O: Generate unified structure:<br/>{<br/>  summary: "...",<br/>  legal: {...},<br/>  business: {...},<br/>  tax: {...},<br/>  immigration: {...},<br/>  action_plan: [...]<br/>}
    end

    O->>M: Store conversation context
    M-->>O: Context stored

    O-->>H: Combined response
    H-->>U: Comprehensive setup guide

    Note over U,M: Total time: ~3-5 seconds (parallel)
```

### Orchestration Strategy

**Decision Tree:**
```
1 domain detected → Single agent (1-2s)
2-3 domains → Parallel execution (3-5s)
4+ domains → Prioritized parallel (5-8s)
```

**Conflict Resolution:**
- Time conflicts → Take longest estimate
- Cost conflicts → Take highest estimate
- Process conflicts → Merge unique steps
- Legal conflicts → Legal Architect has priority

---

## 4. Google Workspace Integration

**Example: Creating a Google Drive document.**

```mermaid
sequenceDiagram
    participant U as User
    participant H as Drive Handler<br/>drive.ts
    participant GA as Google Auth Service
    participant O as OAuth2 Client
    participant TP as Token Path
    participant BP as Bridge Proxy
    participant G as Google Drive API

    U->>H: POST /api/google/drive/create<br/>{name: "Report.docx"}

    H->>GA: getAuthenticatedClient(userId)

    rect rgb(255, 250, 245)
        Note over GA,G: OAuth Token Management

        GA->>O: getOAuth2Client()
        O->>TP: getTokenPath(userId)
        TP-->>O: ~/.credentials/token-{userId}.json

        O->>O: Read token from file

        alt Token valid
            O-->>GA: Authenticated client
        else Token expired
            O->>G: Refresh token
            G-->>O: New access token
            O->>TP: Save new token
            TP-->>O: Token saved
            O-->>GA: Authenticated client
        else Token invalid
            O-->>GA: Error: Re-authentication needed
            GA-->>H: 401 Unauthorized
            H-->>U: Redirect to OAuth flow
        end
    end

    H->>BP: Call with authenticated client
    BP->>G: POST /drive/v3/files<br/>{name, mimeType}

    G->>G: Create document
    G-->>BP: {id, webViewLink}

    BP-->>H: File metadata
    H->>H: Log operation
    H-->>U: {fileId, link}
```

### Google Workspace Handlers

All 7 Google services follow same pattern:

| Service | Handler | Key Operations |
|---------|---------|----------------|
| Drive | `handlers/google-workspace/drive.ts` | list, create, upload, download |
| Docs | `handlers/google-workspace/docs.ts` | get, update, batchUpdate |
| Sheets | `handlers/google-workspace/sheets.ts` | get, update, batchUpdate |
| Gmail | `handlers/google-workspace/gmail.ts` | list, send, get |
| Calendar | `handlers/google-workspace/calendar.ts` | list, create, update, delete |
| Contacts | `handlers/google-workspace/contacts.ts` | list, create, update |
| Slides | `handlers/google-workspace/slides.ts` | get, create, update |

**Common Dependencies:**
```
Handler
  → google-auth-service.ts (OAuth management)
  → oauth2-client.ts (Token handling)
  → bridgeProxy.ts (API calls)
```

---

## 5. Memory Management

**Session and conversation context storage.**

```mermaid
sequenceDiagram
    participant U as User
    participant H as Handler
    participant M as Memory Firestore<br/>memory-firestore.ts
    participant V as Memory Vector<br/>memory-vector.ts
    participant C as Memory Cache
    participant F as Firestore
    participant E as Embeddings

    Note over U,F: Store Memory

    U->>H: POST /api/memory/store<br/>{content, type, metadata}

    H->>M: storeMemory(userId, content)

    M->>E: Generate embedding
    E-->>M: Embedding vector

    par Store in Firestore
        M->>F: Store document:<br/>{<br/>  userId,<br/>  content,<br/>  embedding,<br/>  timestamp,<br/>  metadata<br/>}
        F-->>M: Document ID
    and Store in Vector Cache
        M->>V: addToVectorCache(embedding, content)
        V->>C: Cache entry
        C-->>V: Cached
    end

    M-->>H: Memory stored
    H-->>U: Success

    Note over U,F: Retrieve Memory

    U->>H: POST /api/memory/search<br/>{query}

    H->>M: searchMemory(userId, query)

    M->>E: Generate query embedding
    E-->>M: Query vector

    alt Cache hit
        M->>V: Search vector cache
        V->>C: Vector similarity search
        C-->>V: Top matches
        V-->>M: Cached results
    else Cache miss
        M->>F: Query Firestore<br/>with vector similarity
        F-->>M: Matching documents
        M->>V: Update cache
    end

    M-->>H: Memory results
    H-->>U: Relevant memories
```

### Memory Types

```typescript
type MemoryType =
  | 'conversation'   // Chat history
  | 'preference'     // User preferences
  | 'context'        // Session context
  | 'episode'        // Significant events
  | 'fact'           // Learned facts
```

### Memory Retrieval Strategy

1. **Cache Layer** (in-memory)
   - LRU cache with 1000 items
   - TTL: 1 hour
   - Fast retrieval < 10ms

2. **Vector Search** (Firestore)
   - Semantic similarity
   - User-scoped
   - Retrieval < 100ms

3. **Fallback** (Full scan)
   - Keyword matching
   - Date-based filtering
   - Retrieval < 500ms

---

## 6. WebSocket Real-Time Communication

**Real-time updates and notifications.**

```mermaid
sequenceDiagram
    participant U as User Browser
    participant W as WebApp
    participant WS as WebSocket Server<br/>websocket-server.ts
    participant H as Handler
    participant F as Firestore

    Note over U,F: Connection Establishment

    U->>W: Load page
    W->>W: Initialize WebSocket client

    W->>WS: Connect ws://localhost:8080/ws
    WS->>WS: Upgrade HTTP to WebSocket
    WS->>WS: Assign connection ID
    WS-->>W: Connection established

    W->>WS: {type: 'auth', token: JWT}
    WS->>WS: Verify JWT
    WS->>WS: Map userId → connectionId
    WS-->>W: {type: 'auth_success'}

    Note over U,F: Real-Time Updates

    U->>W: Trigger long operation
    W->>H: POST /api/analytics/weekly-report

    H->>H: Start background job
    H-->>W: 202 Accepted {jobId}

    loop Progress Updates
        H->>WS: sendToUser(userId, {<br/>  type: 'progress',<br/>  jobId,<br/>  percent: X<br/>})
        WS->>WS: Lookup connectionId
        WS-->>W: {type: 'progress', percent: X}
        W->>W: Update progress bar
        W-->>U: Visual update
    end

    H->>F: Complete job, store result
    F-->>H: Stored

    H->>WS: sendToUser(userId, {<br/>  type: 'complete',<br/>  jobId,<br/>  result<br/>})
    WS-->>W: {type: 'complete', result}
    W-->>U: Show result

    Note over U,F: Connection Cleanup

    U->>W: Close tab
    W->>WS: Close connection
    WS->>WS: Remove connectionId mapping
    WS->>WS: Log disconnect
```

### WebSocket Events

**Client → Server:**
```typescript
type ClientMessage =
  | { type: 'auth', token: string }
  | { type: 'ping' }
  | { type: 'subscribe', channel: string }
  | { type: 'unsubscribe', channel: string }
```

**Server → Client:**
```typescript
type ServerMessage =
  | { type: 'auth_success' | 'auth_failed' }
  | { type: 'pong' }
  | { type: 'progress', jobId: string, percent: number }
  | { type: 'notification', title: string, message: string }
  | { type: 'complete', jobId: string, result: any }
  | { type: 'error', error: string }
```

---

## 7. Deployment Pipeline

**Automated deployment to Railway.**

```mermaid
sequenceDiagram
    participant D as Developer
    participant G as Git
    participant R as Railway
    participant D1 as Docker Build
    participant D2 as Health Check
    participant S1 as Backend TS (8080)
    participant S2 as Backend RAG (8000)

    D->>D: Make code changes
    D->>D: Run local tests

    D->>G: git add .
    D->>G: git commit -m "..."
    D->>G: git push origin branch

    G-->>R: Webhook trigger

    rect rgb(245, 245, 255)
        Note over R,D2: Railway Build Process

        R->>R: Detect railway.json
        R->>R: Read build config

        par Build Backend TS
            R->>D1: Build from apps/backend-ts/Dockerfile
            D1->>D1: FROM node:18-alpine
            D1->>D1: npm install
            D1->>D1: npm run build
            D1-->>R: Image built: backend-ts:latest

        and Build Backend RAG
            R->>D1: Build from apps/backend-rag/backend/Dockerfile
            D1->>D1: FROM python:3.11-slim
            D1->>D1: pip install requirements.txt
            D1->>D1: Copy application code
            D1-->>R: Image built: backend-rag:latest
        end

        R->>R: Deploy to containers

        par Start Backend TS
            R->>S1: docker run backend-ts:latest
            S1->>S1: Load environment vars
            S1->>S1: Start Express (port 8080)
            S1->>S1: Load handlers (11 modules)
            S1->>S1: Initialize services

        and Start Backend RAG
            R->>S2: docker run backend-rag:latest
            S2->>S2: Load environment vars
            S2->>S2: Start FastAPI (port 8000)
            S2->>S2: Initialize ChromaDB
            S2->>S2: Load embedding model
        end

        R->>D2: Wait 30 seconds for startup

        rect rgb(240, 255, 240)
            Note over D2,S2: Health Checks

            D2->>S1: GET /health
            alt Healthy
                S1-->>D2: 200 OK {status: "healthy"}
            else Unhealthy
                S1-->>D2: 500 Error
                D2->>R: Rollback to previous version
            end

            D2->>S2: GET /health
            alt Healthy
                S2-->>D2: 200 OK {status: "healthy"}
            else Unhealthy
                S2-->>D2: 500 Error
                D2->>R: Rollback to previous version
            end
        end

        alt All health checks pass
            R-->>D: ✅ Deployment successful
        else Any health check fails
            R->>R: Rollback to previous deployment
            R-->>D: ❌ Deployment failed, rolled back
        end
    end
```

### Deployment Configuration

**File:** `railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "apps/backend-rag/backend/Dockerfile"
  },
  "deploy": {
    "startCommand": "uvicorn app.main_cloud:app --host 0.0.0.0 --port 8000",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### Health Check Endpoints

**Backend TypeScript:**
```typescript
// apps/backend-ts/src/index.ts
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
```

**Backend RAG:**
```python
# apps/backend-rag/backend/app/main_cloud.py
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "chromadb": "connected",
        "timestamp": datetime.now().isoformat()
    }
```

---

## 📊 Performance Summary

| Flow | Components | Avg Time | Max Time |
|------|-----------|----------|----------|
| RAG Query | 8 | 1.5s | 3s |
| Authentication | 4 | 200ms | 500ms |
| Multi-Agent (3) | 10+ | 3.5s | 6s |
| Multi-Agent (5) | 15+ | 5s | 8s |
| Google Workspace | 5 | 800ms | 2s |
| Memory Search | 4 | 150ms | 500ms |
| WebSocket Message | 2 | 10ms | 50ms |
| Deployment | 10+ | 3min | 5min |

---

## 🔗 Related Documentation

- [Architecture Overview](./01-overview.md) - High-level system architecture
- [Backend TypeScript Components](./02-backend-ts-components.md) - Component details
- [Oracle System](./03-oracle-system.md) - Multi-agent architecture

---

**Generated from:** Real code analysis of handler dependencies and service interactions
**Accuracy:** Based on actual component relationships from madge analysis
**Diagrams:** Mermaid sequence diagrams with real component names and file paths
