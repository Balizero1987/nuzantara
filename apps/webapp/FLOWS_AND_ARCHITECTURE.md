# APPLICATION FLOWS & ARCHITECTURE
**ZANTARA Webapp v5.2.0** | System Architecture & Data Flows

---

## SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                      BROWSER / WEBAPP                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐     │
│  │  UI Layer   │  │ State Mgmt   │  │  Localization  │     │
│  │ (HTML/CSS)  │  │ (Redux-like) │  │  (i18n)        │     │
│  └──────┬──────┘  └──────┬───────┘  └────────┬───────┘     │
│         │                │                    │               │
│  ┌──────▼──────────────┬─▼──────┬────────────▼────┐          │
│  │ js/app.js (MAIN)    │        │ Chat Components  │          │
│  │ js/zantara-api.js   │        │ KB Search UI     │          │
│  │ js/team-login.js    │        │ Memory Panel UI  │          │
│  └──────┬──────────────┴────────┴────────────┬─────┘          │
│         │                                    │                 │
│  ┌──────▼────────────────────────────────────▼─────────────┐  │
│  │         API LAYER (API_CONTRACTS)                       │  │
│  │  - Request deduplication                               │  │
│  │  - Version fallback (v1.2 → v1.1 → v1.0)              │  │
│  │  - Health check monitoring (every 30s)                │  │
│  │  - Retry logic (exponential backoff)                  │  │
│  └──────────────────┬─────────────────────────────────────┘  │
│                     │                                          │
│  ┌──────────────────▼──────────────────────┐                 │
│  │     CORE SERVICES LAYER                 │                 │
│  │  ┌─────────────────────────────────┐    │                 │
│  │  │ • Cache Manager (1-10min TTL)   │    │                 │
│  │  │ • Streaming Client (SSE)        │    │                 │
│  │  │ • KB Service (14 collections)   │    │                 │
│  │  │ • Memory Client                 │    │                 │
│  │  │ • Tool Manager (164+ tools)     │    │                 │
│  │  │ • Auth/JWT Service              │    │                 │
│  │  └─────────────────────────────────┘    │                 │
│  └──────────────────┬──────────────────────┘                 │
│                     │                                          │
│  ┌──────────────────▼──────────────────────┐                 │
│  │   STORAGE LAYER                         │                 │
│  │  ┌─────────────────────────────────┐    │                 │
│  │  │ • localStorage (session, cache) │    │                 │
│  │  │ • IndexedDB (offline data)      │    │                 │
│  │  │ • SessionStorage                │    │                 │
│  │  └─────────────────────────────────┘    │                 │
│  └─────────────────────────────────────────┘                 │
│                                                               │
└───────────────────────────┬───────────────────────────────────┘
                            │
                NETWORK LAYER (HTTPS)
                            │
      ┌─────────────────────┴──────────────────────┐
      │                                            │
      ▼                                            ▼
 TS-BACKEND                                  RAG-BACKEND
 (Orchestrator)                              (Knowledge)
 nuzantara-orchestrator                      nuzantara-rag
 .fly.dev                                    .fly.dev
      │                                            │
 ┌────▼──────────────────┐              ┌─────────▼──────────┐
 │ • Auth endpoints      │              │ • Chat endpoint    │
 │ • Team management     │              │ • KB search        │
 │ • Handler discovery   │              │ • Memory API       │
 │ • Tool management     │              │ • Streaming        │
 │ • CRM (leads)         │              │ • 14 Collections   │
 │ • Contact info        │              │                    │
 │ • System utilities    │              │                    │
 └───────────────────────┘              └────────────────────┘
      │                                            │
      └─────────────┬──────────────────────────────┘
                    │
      ┌─────────────▼──────────────────┐
      │   BACKEND SERVICES             │
      │ ┌──────────────────────────┐   │
      │ │ • PostgreSQL (memory)    │   │
      │ │ • ChromaDB (14 KB)       │   │
      │ │ • Claude API (AI)        │   │
      │ │ • Google APIs            │   │
      │ │ • OpenAI API             │   │
      │ │ • LLM Providers          │   │
      │ └──────────────────────────┘   │
      └────────────────────────────────┘
```

---

## DATA FLOW DIAGRAM

### Flow 1: User Login

```
┌─────────┐
│  User   │
└────┬────┘
     │ (email + PIN)
     ▼
┌──────────────────────┐
│ Team Login Form      │
│ (js/team-login.js)   │
└────┬─────────────────┘
     │ POST /team.login
     ▼
┌──────────────────────────┐
│ TS-BACKEND               │
│ /team.login endpoint     │
└────┬─────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│ Validate PIN                     │
│ Check attempts/rate limit        │
└────┬─────────────────────────────┘
     │
     ├─ Success ──▶ Generate JWT
     │             ├─ accessToken
     │             ├─ refreshToken
     │             └─ user profile
     │
     └─ Failure ──▶ Return error
                   + remaining attempts
     │
     ▼
┌─────────────────────────────────────┐
│ Store in localStorage               │
│ • zantara-auth-token (JWT)          │
│ • zantara-user (profile JSON)       │
│ • zantara-user-email               │
│ • zantara-permissions              │
└─────────────────────────────────────┘
     │
     ▼
┌──────────────┐
│ Redirect     │
│ chat.html    │
└──────────────┘
```

---

### Flow 2: Chat Message Processing

```
┌──────────────┐
│ User types   │ "What is KITAS?"
│ message      │
└────┬─────────┘
     │
     ▼
┌────────────────────────────┐
│ Validate input             │
│ Detect language            │
│ Save to message array      │
└────┬───────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ Check if streaming enabled   │
│ (ZANTARA_STREAMING_CLIENT)   │
└────┬───────────────────────┬─┘
     │ YES                   │ NO
     ▼                       ▼
 SSE Streaming          Regular HTTP
     │                       │
     │              ┌────────▼──────────┐
     │              │ POST /bali-zero/  │
     │              │ chat              │
     │              │ (Params: query,   │
     │              │  user_email,      │
     │              │  tools[])         │
     │              └────────┬──────────┘
     │                       │
     │              ┌────────▼──────────────┐
     │              │ RAG-BACKEND processes │
     │              │ - Route to Claude     │
     │              │ - Select tools        │
     │              │ - Execute if needed   │
     │              │ - Format response     │
     │              └────────┬──────────────┘
     │                       │
     │              ┌────────▼──────────────┐
     │              │ Return full response  │
     │              │ {response, tools_used}
     │              └────────┬──────────────┘
     │                       │
     ▼                       ▼
 ┌─────────────────────────────────┐
 │ Display streamed/full response   │
 │ Update UI                        │
 │ Save to message history          │
 └─────────────────────────────────┘
```

---

### Flow 3: Knowledge Base Search (Auto-Detection)

```
┌────────────────────────┐
│ User message:          │
│ "What is KBLI code     │
│  for restaurant?"      │
└────┬───────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│ Tool Manager (zantara-tool-      │
│ manager.js)                      │
│                                  │
│ Check if KB search needed        │
└────┬─────────────────────────────┘
     │
     ├─ Detect keyword: 'kbli'
     │
     ▼
┌──────────────────────────────────┐
│ Select collection:               │
│ 'kbli_eye' (KBLI codes)         │
└────┬─────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│ POST /api/oracle/query           │
│ {                                │
│   query: "restaurant KBLI",      │
│   collections: ["kbli_eye"]      │
│ }                                │
└────┬─────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│ RAG-BACKEND                      │
│ - Search ChromaDB (kbli_eye)     │
│ - Score results                  │
│ - Extract answer                 │
│ - Return sources                 │
└────┬─────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│ Cache result (5 min TTL)         │
│ localStorage[query:kbli_eye]     │
└────┬─────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│ Display results:                 │
│ - Document snippets              │
│ - Confidence score               │
│ - Source links                   │
│ - Suggested questions            │
└──────────────────────────────────┘
```

---

### Flow 4: Streaming Chat with Reconnection

```
┌──────────────┐
│ Send message │ (enable streaming)
└────┬─────────┘
     │
     ▼
┌────────────────────────────────────┐
│ StreamingClient.streamChat()        │
│ - Create sessionId                 │
│ - Create continuityId              │
│ - Initialize abort controller      │
│ - Start heartbeat monitor          │
└────┬───────────────────────────────┘
     │
     ▼
┌────────────────────────────────────┐
│ POST /chat (application/x-ndjson)  │
│ {                                  │
│   sessionId, messages, continuity  │
│ }                                  │
└────┬───────────────────────────────┘
     │
     ▼ (SSE stream begins)
┌────────────────────────────────────┐
│ NDJSON chunks arrive:              │
│ {"type":"delta","content":"..."}   │
│ {"type":"tool","status":"..."}     │
│ {"type":"final","content":"..."}   │
└────┬───────────────────────────────┘
     │
     ├─ Success path ──────────────────┐
     │                                 │
     │  ▼ (stream complete)            │
     │  Emit 'done' event              │
     │  Display response               │
     │                                 │
     └─────────────┬───────────────────┘
                   │
     ┌─────────────┴──────────────────┐
     │ (Network error/disconnect)     │
     │                                │
     ▼                                │
┌──────────────────────────────────┐ │
│ handleDisconnection()             │ │
│ - Emit 'disconnection' event     │ │
│ - Stop heartbeat                │ │
│ - Clear abort controller        │ │
└────┬─────────────────────────────┘ │
     │                               │
     ▼                               │
┌──────────────────────────────────┐ │
│ Attempt Reconnection (Attempt 1) │ │
│ Wait: 1000ms (1s)               │ │
│ Resume streamChat() with context │ │
└────┬─────────────────────────────┘ │
     │                               │
     ├─ Success ──────────────────┐  │
     │  Resume stream              │  │
     │  Emit 'reconnection_success'│  │
     │                             │  │
     └──────────────┬──────────────┘  │
                    │ (Network error) │
                    │                 │
                    ▼                 │
     ┌──────────────────────────────┐ │
     │ Attempt 2 (wait 1500ms)     │ │
     │ ... (exponential backoff)    │ │
     │ Max 10 attempts             │ │
     └──────────────┬───────────────┘ │
                    │                 │
                    └─ All fail ──────┘
                         │
                         ▼
                    Emit 'reconnection_failed'
                    Show error to user
```

---

### Flow 5: Tool Discovery & Execution

```
┌──────────┐
│ Page load│
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────┐
│ ZANTARA_TOOLS.initialize()          │
│ (zantara-tool-manager.js)           │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Check localStorage for cached tools │
│ (zantara_tools)                     │
└────┬────┬──────────────────────────┘
     │    │
  CACHE   │ MISS
     │    │
     ▼    ▼
  ✅    ┌─────────────────────────────────┐
      │ POST /call                        │
      │ {                                 │
      │   key: 'system.handlers.tools',  │
      │   params: {}                      │
      │ }                                 │
      └────┬────────────────────────────┘
           │
           ▼
      ┌─────────────────────────────────┐
      │ TS-BACKEND returns 164+ tools   │
      │ {                               │
      │   ok: true,                     │
      │   data: {                       │
      │     tools: [{name, description}]│
      │   }                             │
      │ }                               │
      └────┬────────────────────────────┘
           │
           ▼
      ┌─────────────────────────────────┐
      │ Cache in localStorage           │
      │ 5-minute auto-refresh          │
      │ Emit 'tools-loaded' event       │
      └─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ User sends chat message             │
│ "What's the pricing for C1?"        │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Tool Manager.getToolsForQuery()     │
│ - Detect: 'pricing' keyword        │
│ - Filter tools: pricing_* (3-5)    │
│ - Return filtered tools[]           │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ POST /bali-zero/chat                │
│ {                                   │
│   query: "pricing for C1",         │
│   tools: [{pricing_lookup, ...}],  │
│   tool_choice: {type: 'auto'}      │
│ }                                   │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Claude decides: "Use pricing tool"  │
│ Executes: pricing_lookup("C1")      │
│ Returns: "$XXX for service C1"     │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Response includes:                  │
│ - Pricing answer                    │
│ - tools_used: ["pricing_lookup"]   │
│ - Citation sources                  │
└─────────────────────────────────────┘
```

---

## STREAMING FORMAT (NDJSON)

Each line is a JSON object:

```json
// Chunk 1: Streaming content
{"type":"delta","content":"KITAS is a limited","sequenceNumber":0}

// Chunk 2: Continue
{"type":"delta","content":" stay visa valid for","sequenceNumber":1}

// Chunk 3: Tool starts (e.g., web search)
{"type":"tool","status":"start","name":"web_search","args":{"query":"KITAS requirements"},"sequenceNumber":2}

// Chunk 4: Tool results
{"type":"tool","status":"result","name":"web_search","data":[{"title":"KITAS...","url":"..."}],"sequenceNumber":3}

// Chunk 5: Final content
{"type":"final","content":"KITAS is a limited stay visa...","sequenceNumber":4}

// Chunk 6: Completion
{"event":"done"}
```

---

## CACHE STRATEGY

```
Request comes in
     │
     ▼
CacheManager.get(endpoint, params)
     │
     ├─ Is endpoint cacheable? (whitelist)
     │  NO  → Skip cache, make API call
     │  YES → Continue
     │
     ├─ Check localStorage
     │  MISS → Make API call
     │  HIT  → Check expiry
     │
     ├─ Is expired? (TTL check)
     │  YES → Delete from cache, make API call
     │  NO  → Return cached value ✓
     │
     └─ On API success:
        CacheManager.set(endpoint, params, data)
        │
        └─ Cache size > 100?
           YES → LRU evict oldest entry
           NO  → Just cache
```

### Cacheable Endpoints & TTL
```
contact.info            → 5 min
team.list               → 2 min
team.departments        → 5 min
team.get                → 2 min
bali.zero.pricing       → 10 min
system.handlers.list    → 10 min
config.flags            → 1 min
dashboard.main          → 30 sec
dashboard.health        → 30 sec
memory.list             → 2 min
memory.entities         → 2 min
```

---

## ERROR HANDLING CHAIN

```
API Call fails
     │
     ▼
┌──────────────────────────────┐
│ Is it a versioning issue?    │
│ (404 status)                 │
└────┬──────────────────────────┘
     │
     ├─ YES: Try API_CONTRACTS fallback
     │   ├─ Try v1.2.0
     │   ├─ Try v1.1.0
     │   ├─ Try v1.0.0
     │   └─ All fail → Continue to step 2
     │
     └─ NO: Continue to step 2
           │
           ▼
      ┌──────────────────────────────┐
      │ Return cached response?      │
      │ (if data was cached before)  │
      └────┬───────────────────────┬─┘
           │ YES                   │ NO
           ▼                       ▼
        Display cache          Show error
        (may be stale)         to user
```

---

## MESSAGE VIRTUALIZATION

```
┌─────────────────────────────┐
│ All messages in memory      │
│ [msg1, msg2, ..., msg1000]  │
└────────────────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Determine visible viewport  │
│ (container scroll position) │
└────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Render only visible + buffer:       │
│ - 20 messages above scroll          │
│ - Current viewport messages         │
│ - 20 messages below scroll          │
│ Total: ~50-100 DOM nodes           │
└────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Performance benefit:                │
│ - Smooth scrolling                 │
│ - Low memory usage                 │
│ - Fast rendering                   │
└────────────────────────────────────┘
```

---

## STATE MANAGEMENT FLOW

```
User Action
     │
     ├─ Type message      → Update input state
     ├─ Send message      → Add to messages array
     ├─ Receive response  → Update last message
     ├─ Click theme       → Update theme state
     ├─ Select language   → Update language state
     └─ Scroll            → Update scroll position
           │
           ▼
┌──────────────────────────────────┐
│ State change detected            │
│ (messages, theme, language, etc) │
└────┬─────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│ Trigger re-render of affected UI │
│ (React-like pattern)             │
└────┬─────────────────────────────┘
     │
     ├─ Update DOM elements
     ├─ Apply CSS transitions
     ├─ Emit analytics events
     └─ Save to localStorage
           │
           ▼
┌──────────────────────────────────┐
│ Persist state (if applicable):   │
│ - localStorage (theme, language) │
│ - Server (chat, memory)          │
│ - IndexedDB (offline)            │
└──────────────────────────────────┘
```

---

## AUTHENTICATION FLOW (DETAILED)

```
┌──────────────────────────┐
│ 1. User enters           │
│    email + PIN           │
└────┬─────────────────────┘
     │
     ▼
┌──────────────────────────┐
│ 2. Client-side validation│
│    - Email format        │
│    - PIN = 6 digits      │
└────┬─────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│ 3. POST /team.login              │
│    Headers: Content-Type: json   │
│    Body: {email, pin, name}      │
└────┬─────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│ 4. TS-Backend processing:        │
│    - Hash PIN                    │
│    - Check attempts              │
│    - Verify credentials          │
│    - Generate JWT                │
│    - Generate refresh token      │
│    - Create session              │
└────┬─────────────────────────────┘
     │
     ├─ Success ──────────────────┐
     │                            │
     │  ▼                         │
     │  Return:                   │
     │  {                         │
     │    success: true,         │
     │    sessionId: ABC123,     │
     │    token: JWT,           │
     │    user: {               │
     │      email, name, role   │
     │      department, badge   │
     │    }                     │
     │  }                       │
     │                         │
     │  ▼                       │
     │  Client stores:          │
     │  localStorage[           │
     │    'zantara-auth-token'  │
     │  ] = token              │
     │                         │
     │  localStorage[           │
     │    'zantara-user'        │
     │  ] = user               │
     │                         │
     │  ▼                       │
     │  Redirect to chat.html   │
     │                         │
     └────┬────────────────────┘
          │
     └─ Failure ─────────────────┐
                                 │
        ▼                        │
        Return error:            │
        {                        │
          success: false,        │
          error: msg,           │
          remaining_attempts: 2 │
        }                       │
                               │
        ▼                       │
        Show error to user      │
        Update PIN indicator    │
        Show warning            │
                               │
        └──────────────────────┘
```

---

## SUBSEQUENT REQUESTS (WITH AUTH TOKEN)

```
Every API call (after login):
     │
     ├─ Check token expiry
     │  - Expires in < 5 min?
     │    YES → Refresh token first
     │    NO  → Proceed with current token
     │
     ├─ Build request headers:
     │  Authorization: Bearer {token}
     │  Content-Type: application/json
     │  x-user-id: {email}
     │  x-session-id: {sessionId}
     │
     ├─ Send to backend
     │
     └─ On 401 (Unauthorized):
        → Refresh token
        → Retry request
        → If refresh fails → Redirect to login
```

---

## RECONNECTION STRATEGY (EXPONENTIAL BACKOFF)

```
Stream disconnects
     │
     ▼
Attempt 1: Wait 1000ms
Attempt 2: Wait 1500ms (1000 * 1.5)
Attempt 3: Wait 2250ms (1500 * 1.5)
Attempt 4: Wait 3375ms
Attempt 5: Wait 5062ms
Attempt 6: Wait 7593ms
Attempt 7: Wait 11390ms
Attempt 8: Wait 17085ms
Attempt 9: Wait 25627ms
Attempt 10: Wait 30000ms (capped at 30s)

Max 10 attempts total
If all fail → Show error message
User can manually retry
```

---

## FEATURE DISCOVERY FLOW

```
User sends message:
"I want to generate content"
     │
     ▼
┌──────────────────────────────────┐
│ Feature Discovery System:        │
│ - Analyze message intent         │
│ - Check available tools          │
│ - Suggest relevant features      │
└────┬─────────────────────────────┘
     │
     ├─ Detect: content generation
     │
     ▼
┌──────────────────────────────────┐
│ Show discovery UI:               │
│ "I can help you with:"          │
│ - Generate blog post            │
│ - Create social media post      │
│ - Write email                   │
└────────────────────────────────┘
```

---

## SUMMARY

- **22+ Endpoints** across 2 backends
- **Resilient Architecture** with fallback versioning
- **Smart Caching** with LRU eviction
- **Stream Reconnection** with exponential backoff
- **Tool Discovery** with intelligent filtering
- **Message Virtualization** for performance
- **Multi-Language** support (20 languages)
- **Progressive Enhancement** with offline support

---

**Generated**: November 2025  
**Last Updated**: Complete architecture documented
