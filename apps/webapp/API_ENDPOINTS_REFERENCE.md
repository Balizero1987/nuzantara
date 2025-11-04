# API ENDPOINTS REFERENCE SHEET
**ZANTARA Webapp v5.2.0** | Quick lookup guide

---

## AUTHENTICATION (3 Endpoints)

| # | Endpoint | Method | Auth | Purpose | Status |
|---|----------|--------|------|---------|--------|
| 1 | `/team.login` | POST | ❌ | PIN-based team login | ✅ |
| 2 | `/auth/refresh` | POST | ❌ | Refresh JWT token | ✅ |
| 3 | `/auth/logout` | POST | ✅ | Logout & invalidate | ✅ |

**Backend**: TS-BACKEND (`https://nuzantara-orchestrator.fly.dev`)

---

## CHAT & AI (2 Endpoints)

| # | Endpoint | Method | Auth | Purpose | Type |
|---|----------|--------|------|---------|------|
| 4 | `/bali-zero/chat` | POST | ✅ | Chat with AI + tools | Regular |
| 5 | `/chat` | POST | ✅ | Streaming chat (NDJSON) | Stream |

**Backend**: RAG-BACKEND (`https://nuzantara-rag.fly.dev`)  
**Features**: SSE, reconnection, tool execution

---

## KNOWLEDGE BASE (4 Endpoints)

| # | Endpoint | Method | Auth | Purpose | Collections |
|---|----------|--------|------|---------|-------------|
| 6 | `/api/oracle/query` | POST | ❌ | KB search (Oracle) | All 14 |
| 7 | `/rag/search` | POST | ✅ | RAG search (cached) | Specific + auto |
| 8 | `/api/memory/{docId}` | GET | ❌ | Get document by ID | - |
| 9 | `/api/memory/stats` | GET | ❌ | KB statistics | - |

**Backend**: RAG-BACKEND  
**Available Collections**:
- visa_oracle, tax_genius, legal_architect, kbli_eye
- zantara_books, kb_indonesian, kbli_comprehensive
- cultural_insights, tax_updates, tax_knowledge
- property_listings, property_knowledge, legal_updates
- bali_zero_pricing

---

## MEMORY (1 Endpoint)

| # | Endpoint | Method | Auth | Purpose | Cache |
|---|----------|--------|------|---------|-------|
| 10 | `/memory/get` | GET | ✅ | Fetch user facts + summary | 1 min |
| 11 | `/memory/save` | POST | ✅ | Save facts/summary | Invalidate |

**Backend**: RAG-BACKEND  
**Usage**: User profile facts, conversation summary, activity counters

---

## UNIFIED KNOWLEDGE (3 Endpoints)

| # | Endpoint | Method | Auth | Purpose | Returns |
|---|----------|--------|------|---------|---------|
| 12 | `/zantara.unified` | POST | ❌ | Multi-KB search | Unified answer |
| 13 | `/zantara.collective` | POST | ❌ | Shared memory/learning | Collective data |
| 14 | `/zantara.ecosystem` | POST | ❌ | Business scenario analysis | Ecosystem data |

**Backend**: TS-BACKEND

---

## SYSTEM/TOOLS (4 Endpoints)

| # | Endpoint | Method | Auth | Purpose | Returns |
|---|----------|--------|------|---------|---------|
| 15 | `/call` | POST | ❌ | Generic handler call | Any data |
| 16 | `/health` | GET | ❌ | Server health check | Status |
| 17 | `/system.handlers.list` | GET | ❌ | List all handlers | 164+ handlers |
| 18 | `/system.handler.execute` | POST | ❌ | Execute specific handler | Handler result |

**Backend**: TS-BACKEND  
**Key Handler Keys**:
- `system.handlers.tools` - Get all tools
- `system.handlers.list` - Get all handlers
- `pricing.official` - Get pricing
- `ai.chat` - Chat endpoint
- `team.list` - Team members
- `identity.resolve` - User identity

---

## TEAM (1 Endpoint)

| # | Endpoint | Method | Auth | Purpose | Returns |
|---|----------|--------|------|---------|---------|
| 19 | `/api/bali-zero/team/list` | POST | ❌ | Team roster | Members[] |

**Backend**: TS-BACKEND

---

## CRM/LEADS (2 Endpoints)

| # | Endpoint | Method | Auth | Purpose | Returns |
|---|----------|--------|------|---------|---------|
| 20 | `/contact.info` | GET | ❌ | Company contact details | Contact data |
| 21 | `/lead.save` | POST | ❌ | Save CRM lead | { success, leadId } |
| 22 | `/identity.resolve` | POST | ❌ | Verify user identity | Profile data |

**Backend**: TS-BACKEND

---

## TOTAL ENDPOINT COUNT: 22 Direct Endpoints

### By Type
- **Auth**: 3
- **Chat**: 2
- **KB**: 4
- **Memory**: 2
- **Unified**: 3
- **System**: 4
- **Team**: 1
- **CRM**: 3

### By Backend
- **TS-BACKEND**: 14 endpoints
- **RAG-BACKEND**: 8 endpoints

---

## REQUEST TEMPLATE BY CATEGORY

### 1. AUTHENTICATION
```javascript
// Team Login
POST /team.login
{
  "email": "user@balizero.com",
  "pin": "123456",
  "name": "Full Name"
}
→ { success, user, sessionId, token, personalizedResponse }
```

### 2. CHAT
```javascript
// Regular Chat
POST /bali-zero/chat
{
  "query": "What is KITAS?",
  "user_email": "user@balizero.com",
  "user_role": "member",
  "tools": [{name, description, input_schema}],
  "tool_choice": { "type": "auto" }
}
→ { success, response, model_used, ai_used, tools_used }

// Streaming Chat
POST /chat (application/x-ndjson)
{
  "sessionId": "sess_123...",
  "messages": [{role, content}],
  "continuityId": "stream_123...",
  "isReconnection": false
}
→ NDJSON stream
```

### 3. KNOWLEDGE BASE
```javascript
// KB Search
POST /api/oracle/query
{
  "query": "tax requirements for PT PMA",
  "collections": ["tax_genius", "kbli_eye"]
}
→ { success, results, answer, collection_used, total_results }

// RAG Search (with cache)
POST /rag/search
{
  "query": "visa duration for KITAS",
  "collection": null,  // auto-detect
  "limit": 5,
  "user_level": 0
}
→ { results, collection, confidence, sources, total }
```

### 4. MEMORY
```javascript
// Get Memory
GET /memory/get?userId=user@balizero.com
Header: Authorization: Bearer {token}
→ { userId, profile_facts, summary, counters, updated_at }

// Save Memory
POST /memory/save
{
  "userId": "user@balizero.com",
  "profile_facts": ["Speaks Italian", "Works in Bali"],
  "summary": "User looking for visa options"
}
→ { success }
```

### 5. GENERIC CALL
```javascript
// Generic Handler
POST /call
{
  "key": "system.handlers.tools",  // or any other handler
  "params": { /* handler specific */ }
}
→ { ok, data: {...} }
```

---

## COMMON FLOWS

### Flow 1: User Login → Chat
```
1. POST /team.login
   ↓ Store token in localStorage
2. POST /bali-zero/chat (with Bearer token)
   ↓
3. GET cached results or POST /api/oracle/query for KB
   ↓
4. Display response
```

### Flow 2: Streaming Chat with Reconnection
```
1. POST /chat (SSE stream)
   ↓ (chunks arrive)
2. Handle delta, tools, final events
   ↓ (connection drops)
3. Exponential backoff: 1s, 1.5s, 2.25s, 3.37s...
   ↓ (reconnect with continuityId)
4. Resume stream
```

### Flow 3: KB Search with Auto-Detection
```
1. User types "What is KBLI code for restaurant?"
   ↓ (system detects 'kbli' keyword)
2. POST /api/oracle/query with collection=kbli_eye
   ↓
3. Cache result for 5 minutes
   ↓
4. Display results
```

### Flow 4: Tool Discovery → Execution
```
1. Page load: POST /call { key: 'system.handlers.tools' }
   ↓ Cache 164+ tools
2. User message: filter tools for query
   ↓ (e.g., pricing query → 3 pricing tools)
3. POST /bali-zero/chat (include filtered tools)
   ↓
4. Claude uses tools if needed
   ↓
5. Return tool results in response
```

---

## RESPONSE STRUCTURES

### Standard Success Response
```javascript
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

### Standard Error Response
```javascript
{
  "success": false,
  "error": "Descriptive error message",
  "code": "ERROR_CODE"
}
```

### Chat Response
```javascript
{
  "success": true,
  "response": "The actual AI response text",
  "model_used": "claude-3-5-haiku",
  "ai_used": "zantara",
  "tools_used": ["pricing_lookup", "kb_search"]
}
```

### KB Search Response
```javascript
{
  "success": true,
  "query": "What is KITAS?",
  "results": [
    {
      "id": "doc_123",
      "title": "KITAS Overview",
      "snippet": "KITAS is a limited stay visa...",
      "score": 0.95,
      "source": "visa_oracle",
      "metadata": {...}
    }
  ],
  "answer": "KITAS is a limited stay visa valid for...",
  "collection_used": "visa_oracle",
  "total_results": 5
}
```

### Memory Response
```javascript
{
  "success": true,
  "userId": "user@example.com",
  "profile_facts": [
    "Works in Bali",
    "Interested in visa information"
  ],
  "summary": "User is a PT PMA investor...",
  "counters": {
    "conversations": 42,
    "searches": 128,
    "tasks": 7
  },
  "updated_at": "2025-11-05T10:30:00Z"
}
```

---

## CACHE CONFIGURATION

### Cacheable Endpoints
```javascript
contact.info           → 5 min TTL
team.list              → 2 min TTL
team.departments       → 5 min TTL
team.get               → 2 min TTL
bali.zero.pricing      → 10 min TTL
system.handlers.list   → 10 min TTL
config.flags           → 1 min TTL
dashboard.main         → 30 sec TTL
dashboard.health       → 30 sec TTL
memory.list            → 2 min TTL
memory.entities        → 2 min TTL
```

### Non-Cacheable Endpoints
```javascript
team.login             (auth)
auth.refresh          (auth)
auth.logout           (auth)
bali-zero/chat        (write)
memory.save           (write)
lead.save             (write)
```

---

## ERROR HANDLING

### Fallback Chain for API Calls
```
Try v1.2.0 endpoint
  ↓ (if 404 or timeout)
Try v1.1.0 endpoint
  ↓ (if 404 or timeout)
Try v1.0.0 endpoint
  ↓ (if all fail)
Return cached response (if exists)
  ↓ (if no cache)
Display error to user
```

### Streaming Reconnection Strategy
```
Connection drops
  ↓
Attempt 1: wait 1000ms
Attempt 2: wait 1500ms
Attempt 3: wait 2250ms
...
Attempt 10: wait 30000ms (max)
  ↓ (if all fail)
Show "Reconnection failed" message
```

---

## AUTHENTICATION HEADERS

### With Token (Required for most endpoints)
```javascript
Authorization: Bearer {jwt_token}
Content-Type: application/json
x-user-id: user@email.com (optional, for streaming)
x-session-id: sess_123... (optional, for streaming)
```

### Without Token (Public endpoints)
```javascript
Content-Type: application/json
X-Requested-With: XMLHttpRequest (for CORS)
```

---

## RATE LIMITS

Currently **NO rate limiting** documented.  
Backend may implement:
- Per-user limits on `/call` endpoint
- Per-IP limits on auth endpoints
- Per-session limits on streaming

**Monitor**: Check response headers for `X-RateLimit-*`

---

## PERFORMANCE TIPS

1. **Use streaming** for long-running queries
2. **Cache KB results** - 5 min TTL prevents duplicate calls
3. **Batch tool calls** - Send multiple tools in single request
4. **Deduplicate requests** - System automatically deduplicates
5. **Paginate large results** - Use `limit` parameter in RAG search

---

## SECURITY NOTES

- ❌ Never send password/tokens in query params
- ❌ Never log sensitive data
- ✅ Always use Bearer tokens for authenticated endpoints
- ✅ Validate user input before sending to API
- ✅ Handle CORS errors gracefully

---

## TESTING ENDPOINTS

### Quick Test
```bash
# Health check
curl https://nuzantara-orchestrator.fly.dev/health

# Team login
curl -X POST https://nuzantara-orchestrator.fly.dev/team.login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","pin":"123456","name":"Test"}'

# KB search
curl -X POST https://nuzantara-rag.fly.dev/api/oracle/query \
  -H "Content-Type: application/json" \
  -d '{"query":"KITAS","collections":["visa_oracle"]}'
```

---

## USEFUL LINKS

- OpenAPI Spec: `/config/openapi.yaml`
- API Layer: `/js/zantara-api.js`
- Contracts: `/js/api-contracts.js`
- KB Service: `/js/kb-service.js`
- Streaming: `/js/streaming-client.js`

---

Generated: November 2025 | Last Updated: Comprehensive
