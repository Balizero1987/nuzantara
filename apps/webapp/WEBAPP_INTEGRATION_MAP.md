# 🗺️ NUZANTARA WebApp - Complete Integration Map

**Date**: 2025-11-08
**Backend**: https://nuzantara-rag.fly.dev
**Frontend**: https://zantara.balizero.com

---

## 📊 Integration Status Legend

- ✅ **INTEGRATED** - Actively used by webapp
- 🟡 **AVAILABLE** - Backend ready, webapp NOT using yet
- ⚠️ **PARTIAL** - Partially integrated
- ❌ **NOT AVAILABLE** - Not implemented

---

## 🎯 BACKEND CAPABILITIES (from OpenAPI Spec)

### 1️⃣ AUTHENTICATION & AUTH

| Endpoint | Method | Status | Usage in WebApp |
|----------|--------|--------|-----------------|
| `/api/auth/demo` | POST | ✅ INTEGRATED | `login.js` - Demo login |
| `/auth/login` | POST | 🟡 AVAILABLE | Alternative (mock login) |
| `/auth/refresh` | POST | 🟡 AVAILABLE | Token refresh |
| `/auth/logout` | POST | 🟡 AVAILABLE | Logout endpoint |
| `/auth/me` | GET | 🟡 AVAILABLE | Current user info |

**WebApp Integration**:
```javascript
// login.js (line 179)
fetch('https://nuzantara-rag.fly.dev/api/auth/demo', {
  method: 'POST',
  body: JSON.stringify({ email, pin })
})
```

**Available But NOT Used**:
- Token refresh mechanism
- Server-side logout
- User profile fetching

---

### 2️⃣ CHAT & RAG (Core Feature)

| Endpoint | Method | Status | Usage in WebApp |
|----------|--------|--------|-----------------|
| `/bali-zero/chat` | POST | ✅ INTEGRATED | `app.js`, `zantara-client.js` |
| `/bali-zero/chat-stream` | GET | ✅ INTEGRATED | `sse-client.js` (EventSource) |
| `/bali-zero/conversations/save` | POST | ⚠️ PARTIAL | Via `conversation-client.js` |
| `/bali-zero/conversations/history` | GET | ⚠️ PARTIAL | Via `conversation-client.js` |
| `/bali-zero/conversations/clear` | DELETE | ⚠️ PARTIAL | Via `conversation-client.js` |
| `/bali-zero/conversations/stats` | GET | 🟡 AVAILABLE | Not used |

**WebApp Integration**:

**1. Non-Streaming Chat** (`zantara-client.js`):
```javascript
// Default endpoint: /bali-zero/chat
chatEndpoint: config.chatEndpoint || '/bali-zero/chat'
```

**2. SSE Streaming** (`sse-client.js`):
```javascript
// Line 10: streamEndpoint = '/bali-zero/chat-stream'
// Line 49: new EventSource(url)
// Handles events: token, sources, metadata, done, error
```

**3. Conversation Management** (`conversation-client.js`):
- Loaded in both `login.html` and `chat.html`
- Saves messages to memory service
- Retrieves conversation history

**Request Format** (Chat):
```json
{
  "query": "user message",
  "session_id": "optional",
  "user_email": "optional"
}
```

**Response Format** (SSE Stream):
```javascript
// Event types:
{ "type": "token", "content": "..." }        // Each token
{ "type": "sources", "sources": [...] }       // RAG sources
{ "type": "metadata", "model": "...", ... }   // Model info
{ "type": "done" }                            // Stream complete
{ "type": "error", "message": "..." }         // Error
```

---

### 3️⃣ CRM SYSTEM (10 Features)

#### 🟡 **AVAILABLE - NOT INTEGRATED**

**CRM Clients**:
| Endpoint | Method | Feature | Status |
|----------|--------|---------|--------|
| `POST /crm/clients/` | POST | Create client | 🟡 AVAILABLE |
| `GET /crm/clients/` | GET | List clients | 🟡 AVAILABLE |
| `GET /crm/clients/{id}` | GET | Get client | 🟡 AVAILABLE |
| `PATCH /crm/clients/{id}` | PATCH | Update client | 🟡 AVAILABLE |
| `DELETE /crm/clients/{id}` | DELETE | Delete client | 🟡 AVAILABLE |
| `GET /crm/clients/by-email/{email}` | GET | Find by email | 🟡 AVAILABLE |
| `GET /crm/clients/{id}/summary` | GET | Full summary | 🟡 AVAILABLE |
| `GET /crm/clients/stats/overview` | GET | Statistics | 🟡 AVAILABLE |

**CRM Practices**:
| Endpoint | Method | Feature | Status |
|----------|--------|---------|--------|
| `POST /crm/practices/` | POST | Create practice | 🟡 AVAILABLE |
| `GET /crm/practices/` | GET | List practices | 🟡 AVAILABLE |
| `GET /crm/practices/active` | GET | Active only | 🟡 AVAILABLE |
| `GET /crm/practices/renewals/upcoming` | GET | Renewals (90d) | 🟡 AVAILABLE |
| `GET /crm/practices/{id}` | GET | Get practice | 🟡 AVAILABLE |
| `PATCH /crm/practices/{id}` | PATCH | Update practice | 🟡 AVAILABLE |
| `POST /crm/practices/{id}/documents/add` | POST | Attach doc | 🟡 AVAILABLE |
| `GET /crm/practices/stats/overview` | GET | Statistics | 🟡 AVAILABLE |

**Practice Types**:
- `KITAS` - Work permit
- `PT_PMA` - Foreign investment company
- `INVESTOR_VISA` - Investor visa

**CRM Interactions**:
| Endpoint | Method | Feature | Status |
|----------|--------|---------|--------|
| `POST /crm/interactions/` | POST | Log interaction | 🟡 AVAILABLE |
| `GET /crm/interactions/` | GET | List interactions | 🟡 AVAILABLE |
| `GET /crm/interactions/{id}` | GET | Get interaction | 🟡 AVAILABLE |
| `GET /crm/interactions/client/{id}/timeline` | GET | Client timeline | 🟡 AVAILABLE |
| `GET /crm/interactions/practice/{id}/history` | GET | Practice history | 🟡 AVAILABLE |
| `POST /crm/interactions/from-conversation` | POST | Auto-create | 🟡 AVAILABLE |
| `GET /crm/interactions/stats/overview` | GET | Statistics | 🟡 AVAILABLE |

**Interaction Types**:
- `chat`, `email`, `whatsapp`, `call`, `meeting`, `note`

**CRM Shared Memory**:
| Endpoint | Method | Feature | Status |
|----------|--------|---------|--------|
| `GET /crm/shared-memory/search` | GET | NL CRM search | 🟡 AVAILABLE |
| `GET /crm/shared-memory/upcoming-renewals` | GET | Renewal overview | 🟡 AVAILABLE |
| `GET /crm/shared-memory/client/{id}/full-context` | GET | Full context | 🟡 AVAILABLE |
| `GET /crm/shared-memory/team-overview` | GET | Team dashboard | 🟡 AVAILABLE |

**Integration Potential**:
```javascript
// EXAMPLE: Auto-create CRM interaction from chat
// Could be integrated in conversation-client.js

async function saveChatTocrm(userEmail, messages) {
  const response = await fetch(
    'https://nuzantara-rag.fly.dev/crm/interactions/from-conversation',
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        user_email: userEmail,
        messages: messages,
        interaction_type: 'chat',
        channel: 'web_chat'
      })
    }
  );
  return response.json();
}
```

---

### 4️⃣ AGENTIC FUNCTIONS (10 AI Agents)

#### 🟡 **ALL AVAILABLE - NOT INTEGRATED**

**Agent Status**:
| Endpoint | Agent | Status |
|----------|-------|--------|
| `GET /api/agents/status` | All agents status | 🟡 AVAILABLE |

**Agent 1 - Client Journey Orchestrator**:
| Endpoint | Method | Feature | Status |
|----------|--------|---------|--------|
| `POST /api/agents/journey/create` | POST | Create journey | 🟡 AVAILABLE |
| `GET /api/agents/journey/{id}` | GET | Get journey | 🟡 AVAILABLE |
| `POST /api/agents/journey/{id}/step/{step_id}/complete` | POST | Mark complete | 🟡 AVAILABLE |
| `GET /api/agents/journey/{id}/next-steps` | GET | Next steps | 🟡 AVAILABLE |

**Agent 2 - Compliance Monitor**:
| Endpoint | Method | Feature | Status |
|----------|--------|---------|--------|
| `POST /api/agents/compliance/track` | POST | Track deadlines | 🟡 AVAILABLE |
| `GET /api/agents/compliance/alerts` | GET | Get alerts | 🟡 AVAILABLE |
| `GET /api/agents/compliance/client/{id}` | GET | Client items | 🟡 AVAILABLE |

**Agent 3 - Knowledge Graph Builder**:
| Endpoint | Method | Feature | Status |
|----------|--------|---------|--------|
| `POST /api/agents/knowledge-graph/extract` | POST | Extract entities | 🟡 AVAILABLE |
| `GET /api/agents/knowledge-graph/export` | GET | Export graph | 🟡 AVAILABLE |

**Agent 4 - Auto Ingestion Orchestrator**:
| Endpoint | Method | Feature | Status |
|----------|--------|---------|--------|
| `POST /api/agents/ingestion/run` | POST | Monitor sources | 🟡 AVAILABLE |
| `GET /api/agents/ingestion/status` | GET | Status | 🟡 AVAILABLE |

**Agent 5 - Cross-Oracle Synthesis**:
| Endpoint | Method | Feature | Status |
|----------|--------|---------|--------|
| `POST /api/agents/synthesis/cross-oracle` | POST | Multi-domain | 🟡 AVAILABLE |

**Agent 6 - Dynamic Pricing Service**:
| Endpoint | Method | Feature | Status |
|----------|--------|---------|--------|
| `POST /api/agents/pricing/calculate` | POST | Calculate price | 🟡 AVAILABLE |

**Agent 7 - Autonomous Research**:
| Endpoint | Method | Feature | Status |
|----------|--------|---------|--------|
| `POST /api/agents/research/autonomous` | POST | Research | 🟡 AVAILABLE |

**Agents 8-10 - Analytics**:
| Endpoint | Method | Feature | Status |
|----------|--------|---------|--------|
| `GET /api/agents/analytics/summary` | GET | Summary (cached) | 🟡 AVAILABLE |

**Integration Example**:
```javascript
// EXAMPLE: Get compliance alerts for user
async function getComplianceAlerts(token) {
  const response = await fetch(
    'https://nuzantara-rag.fly.dev/api/agents/compliance/alerts',
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  return response.json();
}

// Could display in chat sidebar or notification banner
```

---

### 5️⃣ SEMANTIC MEMORY (Vector Store)

#### 🟡 **AVAILABLE - NOT INTEGRATED**

| Endpoint | Method | Feature | Status |
|----------|--------|---------|--------|
| `POST /api/memory/init` | POST | Init collection | 🟡 AVAILABLE |
| `POST /api/memory/embed` | POST | Generate embedding | 🟡 AVAILABLE |
| `POST /api/memory/store` | POST | Store vector | 🟡 AVAILABLE |
| `POST /api/memory/search` | POST | Semantic search | 🟡 AVAILABLE |
| `POST /api/memory/similar` | POST | Find similar | 🟡 AVAILABLE |
| `DELETE /api/memory/{id}` | DELETE | Delete memory | 🟡 AVAILABLE |
| `GET /api/memory/stats` | GET | Statistics | 🟡 AVAILABLE |
| `GET /api/memory/health` | GET | Health check | 🟡 AVAILABLE |

**Use Case**:
- Store user preferences as vectors
- Semantic search across user history
- Find similar past conversations

---

### 6️⃣ SEMANTIC CACHING

#### 🟡 **AVAILABLE - NOT INTEGRATED**

| Endpoint | Method | Feature | Status |
|----------|--------|---------|--------|
| `GET /api/cache/stats` | GET | Cache stats | 🟡 AVAILABLE |
| `POST /api/cache/clear` | POST | Clear cache (admin) | 🟡 AVAILABLE |
| `GET /api/cache/health` | GET | Health check | 🟡 AVAILABLE |

**Note**: Caching is automatic on backend for repeated queries.

---

### 7️⃣ INTEL MANAGEMENT

#### 🟡 **AVAILABLE - NOT INTEGRATED**

| Endpoint | Method | Feature | Status |
|----------|--------|---------|--------|
| `POST /api/intel/search` | POST | Semantic search | 🟡 AVAILABLE |
| `POST /api/intel/store` | POST | Store intel | 🟡 AVAILABLE |
| `GET /api/intel/critical` | GET | Critical items | 🟡 AVAILABLE |
| `GET /api/intel/trends` | GET | Trending topics | 🟡 AVAILABLE |
| `GET /api/intel/stats/{collection}` | GET | Statistics | 🟡 AVAILABLE |

---

### 8️⃣ ORACLE SYSTEM (RAG Knowledge)

#### ✅ **USED INDIRECTLY** (via /bali-zero/chat)

| Endpoint | Method | Feature | Status |
|----------|--------|---------|--------|
| `POST /api/oracle/query` | POST | Universal query | ⚠️ USED INDIRECTLY |
| `GET /api/oracle/collections` | GET | List collections | 🟡 AVAILABLE |
| `GET /api/oracle/routing/test` | GET | Test routing | 🟡 AVAILABLE |
| `POST /api/oracle/ingest` | POST | Bulk ingest (1000) | 🟡 AVAILABLE |
| `POST /api/oracle/populate-now` | POST | Sample data | 🟡 AVAILABLE |

**Collections Available**:
- Check via: `GET /api/oracle/collections`

---

### 9️⃣ SESSION MANAGEMENT

#### 🟡 **AVAILABLE - NOT INTEGRATED**

| Endpoint | Method | Feature | Status |
|----------|--------|---------|--------|
| `POST /sessions` | POST | Create session | 🟡 AVAILABLE |
| `GET /sessions/{id}` | GET | Get session | 🟡 AVAILABLE |
| `PUT /sessions/{id}` | PUT | Update session | 🟡 AVAILABLE |
| `DELETE /sessions/{id}` | DELETE | Delete session | 🟡 AVAILABLE |
| `PUT /sessions/{id}/ttl` | PUT | Update TTL | 🟡 AVAILABLE |
| `GET /sessions/{id}/export` | GET | Export (JSON/MD) | 🟡 AVAILABLE |
| `GET /analytics/sessions` | GET | Analytics | 🟡 AVAILABLE |

**Note**: WebApp uses localStorage for sessions, not backend API.

---

### 🔟 NOTIFICATIONS HUB

#### 🟡 **AVAILABLE - NOT INTEGRATED**

| Endpoint | Method | Feature | Status |
|----------|--------|---------|--------|
| `GET /api/notifications/status` | GET | Hub status | 🟡 AVAILABLE |
| `GET /api/notifications/templates` | GET | Templates | 🟡 AVAILABLE |
| `POST /api/notifications/send` | POST | Send custom | 🟡 AVAILABLE |
| `POST /api/notifications/send-template` | POST | Send template | 🟡 AVAILABLE |
| `POST /api/notifications/test` | POST | Test channels | 🟡 AVAILABLE |

**Notification Priorities**:
- `low` → in-app only
- `normal` → email + in-app
- `high` → email + WhatsApp + in-app
- `urgent` → all channels
- `critical` → all channels

**Integration Example**:
```javascript
// Display in-app notifications
async function checkNotifications(userEmail, token) {
  // Could poll or use WebSocket
  // Display badge count in header
}
```

---

### 1️⃣1️⃣ SEARCH & RAG (Legacy/Alternative)

#### 🟡 **AVAILABLE - NOT USED** (using /bali-zero instead)

| Endpoint | Method | Feature | Status |
|----------|--------|---------|--------|
| `POST /search` | POST | RAG search + LLM | 🟡 AVAILABLE |

**Request Schema**:
```json
{
  "query": "string",
  "collection": "optional",
  "limit": 5
}
```

---

### 1️⃣2️⃣ ADMIN & TOOLS

#### 🟡 **AVAILABLE - NOT INTEGRATED**

| Endpoint | Method | Feature | Status |
|----------|--------|---------|--------|
| `GET /api/tools/verify` | GET | Diagnose tools | 🟡 AVAILABLE |
| `GET /admin/check-crm-tables` | GET | CRM tables check | 🟡 AVAILABLE |
| `POST /admin/apply-migration-007` | POST | Schema migration | 🟡 AVAILABLE |

---

### 1️⃣3️⃣ HEALTH & MONITORING

#### ✅ **AVAILABLE** (verified working)

| Endpoint | Method | Feature | Status |
|----------|--------|---------|--------|
| `GET /health` | GET | Service health | ✅ VERIFIED |
| `GET /cache/health` | GET | Cache health | 🟡 AVAILABLE |
| `GET /warmup/stats` | GET | Warmup stats | 🟡 AVAILABLE |

---

## 📊 WEBAPP CURRENT INTEGRATION SUMMARY

### ✅ **ACTIVELY USED** (5 features)

1. **Authentication** - `/api/auth/demo`
2. **Chat (Non-Streaming)** - `/bali-zero/chat`
3. **Chat (SSE Streaming)** - `/bali-zero/chat-stream`
4. **Conversation Save** - `/bali-zero/conversations/save` (via client)
5. **Conversation History** - `/bali-zero/conversations/history` (via client)

### 🟡 **AVAILABLE BUT NOT USED** (50+ endpoints)

- ❌ CRM System (8 endpoints × 3 modules = 24 endpoints)
- ❌ Agentic Functions (10 agents, ~15 endpoints)
- ❌ Semantic Memory (8 endpoints)
- ❌ Notifications (5 endpoints)
- ❌ Session Management (7 endpoints)
- ❌ Intel Management (5 endpoints)
- ❌ Advanced Analytics

---

## 🎯 INTEGRATION OPPORTUNITIES

### 🔥 **HIGH VALUE - Easy to Add**

#### 1. **CRM Auto-Population from Chat**
**Endpoint**: `POST /crm/interactions/from-conversation`
**Effort**: Low
**Impact**: High
**Integration Point**: `conversation-client.js` - add after saving conversation

```javascript
// Add to conversation-client.js
async saveToCRM(messages, userEmail) {
  await fetch(`${this.apiUrl}/crm/interactions/from-conversation`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_email: userEmail,
      messages: messages,
      interaction_type: 'chat',
      channel: 'web_chat'
    })
  });
}
```

#### 2. **Compliance Alerts Banner**
**Endpoint**: `GET /api/agents/compliance/alerts`
**Effort**: Low
**Impact**: High
**Integration Point**: Add banner in `chat.html` header

```javascript
// Add to app.js
async function loadComplianceAlerts() {
  const response = await fetch(
    `${API_CONFIG.rag.url}/api/agents/compliance/alerts`,
    { headers: getAuthHeaders() }
  );
  const alerts = await response.json();
  displayAlertsBanner(alerts.data);
}
```

#### 3. **Client Quick Search**
**Endpoint**: `GET /crm/shared-memory/search?q={query}`
**Effort**: Medium
**Impact**: High
**Integration Point**: Add search box in header

#### 4. **Notification Badge**
**Endpoint**: `GET /api/notifications/status`
**Effort**: Low
**Impact**: Medium
**Integration Point**: User avatar area

---

### 🎨 **UI COMPONENTS TO ADD**

#### **Sidebar Menu** (New)
```
📊 Dashboard
💬 Chat (current)
👥 Clients
📋 Practices
📅 Compliance Alerts
🔔 Notifications
⚙️ Settings
```

#### **Chat Enhancements**
- [ ] Display RAG sources (already in HTML, needs JS)
- [ ] Display metadata (model, tokens, cost) - already in HTML
- [ ] Show related clients in sidebar when detected
- [ ] Compliance deadline warnings

---

## 🏗️ WEBAPP ARCHITECTURE

### **Current File Structure**:

```
apps/webapp/
├── js/
│   ├── api-config.js           ✅ Backend URLs
│   ├── api-client.js           ✅ Helper functions (basic)
│   ├── core/
│   │   └── api-client.js       🟡 Advanced client (unused?)
│   ├── auth-auto-login.js      ✅ Auto-login
│   ├── auth-guard.js           ✅ Protected pages
│   ├── login.js                ✅ Login flow
│   ├── user-context.js         ✅ User state
│   ├── app.js                  ✅ Main chat app
│   ├── zantara-client.js       ✅ Chat client
│   ├── sse-client.js           ✅ SSE streaming
│   ├── conversation-client.js  ⚠️ Partial (could add CRM)
│   └── message-search.js       🟡 Message search
├── css/
│   ├── design-system.css       ✅ Main styles
│   ├── production.css          ✅ Production overrides
│   └── ai-info.css             ✅ AI banner + sources
├── login.html                  ✅ Login page
└── chat.html                   ✅ Chat page
```

### **Missing Components**:
- ❌ CRM UI (clients list, create, edit)
- ❌ Dashboard page
- ❌ Notifications UI
- ❌ Compliance alerts UI
- ❌ Admin panel
- ❌ Settings page

---

## 📝 RECOMMENDED NEXT STEPS

### Phase 1 - Quick Wins (1-2 hours)
1. ✅ Enable RAG sources display (already in HTML)
2. ✅ Enable metadata display (already in HTML)
3. 🔲 Add CRM auto-save from conversations
4. 🔲 Add compliance alerts banner

### Phase 2 - CRM Integration (1 day)
1. 🔲 Create clients list page
2. 🔲 Add client search
3. 🔲 Create client profile view
4. 🔲 Add practice tracking

### Phase 3 - Advanced Features (2-3 days)
1. 🔲 Notification center
2. 🔲 Dashboard with analytics
3. 🔲 Agent status monitoring
4. 🔲 Admin panel

---

## 🔗 QUICK REFERENCE

**Backend Base URL**: `https://nuzantara-rag.fly.dev`

**Auth Header Format**:
```javascript
{
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Get Token**:
```javascript
const tokenData = JSON.parse(localStorage.getItem('zantara-token'));
const token = tokenData.token;
```

**OpenAPI Spec**: https://nuzantara-rag.fly.dev/docs
**Health Check**: https://nuzantara-rag.fly.dev/health

---

**Summary**:
- **Backend**: 60+ endpoints ready
- **WebApp**: Using only 5 endpoints
- **Potential**: 90%+ features available but not integrated
- **Easiest Wins**: CRM auto-save, compliance alerts, notifications

Vuoi che implementi qualcuna di queste feature? Posso partire dalle più facili (CRM auto-save, alerts banner, sources/metadata display).
