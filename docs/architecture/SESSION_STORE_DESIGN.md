# 🗄️ ZANTARA Session Store Architecture
**Version**: 1.0
**Date**: November 5, 2025
**Goal**: Support 50+ message conversations by eliminating URL length constraints

---

## 📊 Current Architecture (Baseline)

### Flow
```
Client → GET /bali-zero/chat-stream?query=...&conversation_history=[...]
         ↓
Backend → Parse querystring conversation_history
         ↓ Decompress {r,c} → {role,content}
         ↓
IntelligentRouter → Claude API
```

### Limitations
- **URL size**: Max 5-8 KB (server/proxy limits)
- **Message limit**: 20 messages (compressed)
- **Fallback**: 15 messages if URL > 5 KB
- **Compression**: 80-90% reduction, but still limited

---

## 🎯 New Architecture (Session Store)

### Flow
```
Client → POST /sessions → {session_id}
         ↓
Client → PUT /sessions/{session_id} (save history)
         ↓
Client → GET /bali-zero/chat-stream?query=...&session_id={session_id}
         ↓
Backend → Read history from Redis using session_id
         ↓
IntelligentRouter → Claude API
```

### Benefits
- **No URL limits**: Session ID is ~32 chars
- **Message limit**: 50+ messages (or more)
- **Persistence**: 24h TTL (configurable)
- **Scalability**: Redis can handle millions of sessions

---

## 🏗️ Implementation Plan

### 1. Redis Setup (Fly.io)

**Option A**: Use Upstash Redis (Managed, Free Tier)
- 10,000 requests/day free
- 256 MB storage
- Global replication
- Simple setup: `flyctl ext create upstash-redis`

**Option B**: Self-hosted Redis on Fly.io
- Full control
- No rate limits
- Requires maintenance
- Setup: `fly.io/docs/reference/redis/`

**Decision**: **Option A (Upstash)** for simplicity and maintenance

### 2. Backend Changes

#### 2.1 Session Service (New)
**File**: `apps/backend-rag/backend/services/session_service.py`

```python
from typing import Optional, List, Dict
import redis.asyncio as redis
import json
import uuid
from datetime import timedelta

class SessionService:
    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.ttl = timedelta(hours=24)  # 24h session expiry

    async def create_session(self) -> str:
        """Create new session, return session_id"""
        session_id = str(uuid.uuid4())
        # Initialize empty history
        await self.redis.setex(
            f"session:{session_id}",
            self.ttl,
            json.dumps([])
        )
        return session_id

    async def get_history(self, session_id: str) -> Optional[List[Dict]]:
        """Get conversation history for session"""
        data = await self.redis.get(f"session:{session_id}")
        if not data:
            return None
        return json.loads(data)

    async def update_history(self, session_id: str, history: List[Dict]) -> bool:
        """Update conversation history for session"""
        await self.redis.setex(
            f"session:{session_id}",
            self.ttl,
            json.dumps(history)
        )
        return True

    async def delete_session(self, session_id: str) -> bool:
        """Delete session"""
        deleted = await self.redis.delete(f"session:{session_id}")
        return deleted > 0

    async def extend_ttl(self, session_id: str) -> bool:
        """Extend session TTL (reset to 24h)"""
        return await self.redis.expire(f"session:{session_id}", self.ttl)
```

#### 2.2 Session Endpoints (New)
**File**: `apps/backend-rag/backend/app/main_cloud.py`

```python
# Add to imports
from services.session_service import SessionService

# Add global service
session_service: Optional[SessionService] = None

# Initialize in startup
@app.on_event("startup")
async def startup_event():
    global session_service
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        session_service = SessionService(redis_url)
        logger.info("✅ Session service initialized")

# Endpoints
@app.post("/sessions")
async def create_session():
    """Create new conversation session"""
    if not session_service:
        raise HTTPException(503, "Session service unavailable")

    session_id = await session_service.create_session()
    return {"session_id": session_id}

@app.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """Get conversation history for session"""
    if not session_service:
        raise HTTPException(503, "Session service unavailable")

    history = await session_service.get_history(session_id)
    if history is None:
        raise HTTPException(404, "Session not found")

    return {"session_id": session_id, "history": history}

@app.put("/sessions/{session_id}")
async def update_session(session_id: str, request: Request):
    """Update conversation history for session"""
    if not session_service:
        raise HTTPException(503, "Session service unavailable")

    body = await request.json()
    history = body.get("history", [])

    success = await session_service.update_history(session_id, history)
    if not success:
        raise HTTPException(500, "Failed to update session")

    return {"session_id": session_id, "updated": True}

@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete session"""
    if not session_service:
        raise HTTPException(503, "Session service unavailable")

    deleted = await session_service.delete_session(session_id)
    return {"session_id": session_id, "deleted": deleted}
```

#### 2.3 Modify chat-stream Endpoint
**File**: `apps/backend-rag/backend/app/main_cloud.py:2013`

```python
@app.get("/bali-zero/chat-stream")
async def bali_zero_chat_stream(
    request: Request,
    query: str,
    user_email: Optional[str] = None,
    conversation_history: Optional[str] = None,  # DEPRECATED but kept for backward compat
    handlers_context: Optional[str] = None,
    session_id: Optional[str] = None  # NEW: Session ID for Redis-based history
):
    # ...

    async def generate():
        # ...

        # Parse conversation history - ENHANCED with session support
        parsed_history = None

        # PRIORITY 1: Try session_id (new method)
        if session_id and session_service:
            try:
                parsed_history = await session_service.get_history(session_id)
                if parsed_history:
                    logger.info(f"📚 [Stream] Loaded {len(parsed_history)} messages from session {session_id}")
                    # Extend session TTL on active use
                    await session_service.extend_ttl(session_id)
                else:
                    logger.warning(f"⚠️ [Stream] Session {session_id} not found or expired")
            except Exception as e:
                logger.error(f"❌ [Stream] Failed to load session: {e}")

        # PRIORITY 2: Fallback to querystring (backward compatibility)
        if not parsed_history and conversation_history:
            try:
                parsed_history = json.loads(conversation_history)
                # Apply decompression logic (existing code)
                # ...
                logger.info(f"📚 [Stream] Using querystring history: {len(parsed_history)} messages")
            except Exception as e:
                logger.warning(f"⚠️ [Stream] Failed to parse conversation_history: {e}")

        # Continue with existing logic...
```

### 3. Client Changes

#### 3.1 Session Management
**File**: `apps/webapp/js/sse-client.js`

```javascript
class ZantaraSSEClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.sessionId = null;
    this.maxHistorySize = 50; // Now we can support 50+ messages!
  }

  async ensureSession() {
    // Check if we have a session ID in memory or localStorage
    if (this.sessionId) {
      return this.sessionId;
    }

    const cached = localStorage.getItem('zantara-session-id');
    if (cached) {
      this.sessionId = cached;
      return cached;
    }

    // Create new session
    try {
      const response = await fetch(`${this.baseUrl}/sessions`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      this.sessionId = data.session_id;
      localStorage.setItem('zantara-session-id', this.sessionId);

      console.log('[ZantaraSSE] Created new session:', this.sessionId);
      return this.sessionId;
    } catch (error) {
      console.error('[ZantaraSSE] Failed to create session:', error);
      return null;
    }
  }

  async updateSession(conversationHistory) {
    const sessionId = await this.ensureSession();
    if (!sessionId) {
      console.warn('[ZantaraSSE] No session ID, skipping update');
      return false;
    }

    try {
      // Trim to max size (50 messages)
      let trimmed = conversationHistory;
      if (trimmed.length > this.maxHistorySize) {
        trimmed = trimmed.slice(-this.maxHistorySize);
        console.log(`[ZantaraSSE] Trimmed history from ${conversationHistory.length} to ${this.maxHistorySize}`);
      }

      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({history: trimmed})
      });

      if (!response.ok) {
        throw new Error('Failed to update session');
      }

      console.log(`[ZantaraSSE] Updated session with ${trimmed.length} messages`);
      return true;
    } catch (error) {
      console.error('[ZantaraSSE] Failed to update session:', error);
      return false;
    }
  }

  async stream(query, userEmail, conversationHistory = [], handlersContext = null) {
    // Update session with latest history BEFORE streaming
    await this.updateSession(conversationHistory);

    // Get session ID
    const sessionId = await this.ensureSession();

    // Build stream URL - now with session_id instead of conversation_history!
    const url = new URL(`${this.baseUrl}/bali-zero/chat-stream`);
    url.searchParams.append('query', query);

    if (userEmail) {
      url.searchParams.append('user_email', userEmail);
    }

    // NEW: Send session_id instead of full history
    if (sessionId) {
      url.searchParams.append('session_id', sessionId);
      console.log(`[ZantaraSSE] Using session: ${sessionId}`);
    } else {
      // FALLBACK: If session creation failed, use old method
      console.warn('[ZantaraSSE] Session unavailable, falling back to querystring');
      const trimmed = conversationHistory.slice(-15); // Conservative limit
      if (trimmed.length > 0) {
        url.searchParams.append('conversation_history', JSON.stringify(trimmed));
      }
    }

    // Add handlers context (unchanged)
    if (handlersContext) {
      url.searchParams.append('handlers_context', JSON.stringify(handlersContext));
    }

    const streamUrl = url.toString();
    console.log(`[ZantaraSSE] Stream URL: ${streamUrl.length} chars (session-based)`);

    // Rest of streaming logic unchanged...
  }

  clearSession() {
    this.sessionId = null;
    localStorage.removeItem('zantara-session-id');
    console.log('[ZantaraSSE] Session cleared');
  }
}
```

---

## 🧪 Testing Strategy

### Test 1: Session Creation
```bash
curl -X POST https://nuzantara-rag.fly.dev/sessions
# Expected: {"session_id": "uuid-here"}
```

### Test 2: Session Update
```bash
SESSION_ID="..."
curl -X PUT https://nuzantara-rag.fly.dev/sessions/$SESSION_ID \
  -H "Content-Type: application/json" \
  -d '{"history": [{"role":"user","content":"test"}]}'
# Expected: {"session_id": "...", "updated": true}
```

### Test 3: Session Retrieval
```bash
curl https://nuzantara-rag.fly.dev/sessions/$SESSION_ID
# Expected: {"session_id": "...", "history": [...]}
```

### Test 4: Chat Stream with Session
```bash
curl -N "https://nuzantara-rag.fly.dev/bali-zero/chat-stream?query=Hello&session_id=$SESSION_ID"
# Expected: SSE stream with context from session
```

### Test 5: 50+ Message Conversation
- Create conversation in browser with 50+ messages
- Verify session updates correctly
- Verify context preserved throughout
- Check DevTools for session logs

### Test 6: Backward Compatibility
- Test old clients (without session support)
- Verify querystring method still works
- Ensure no breaking changes

---

## 📦 Dependencies

### Python Requirements
Add to `apps/backend-rag/requirements-backend.txt`:
```
redis[asyncio]==5.0.1
```

### Environment Variables
Add to `apps/backend-rag/.env` and Fly.io secrets:
```bash
REDIS_URL=redis://default:password@host:port
```

---

## 🚀 Deployment Steps

### Step 1: Setup Upstash Redis
```bash
cd apps/backend-rag
flyctl ext create upstash-redis --app nuzantara-rag --name zantara-sessions
# Save REDIS_URL from output
```

### Step 2: Set Environment Variable
```bash
flyctl secrets set REDIS_URL="redis://..." -a nuzantara-rag
```

### Step 3: Update Dependencies
```bash
# Add redis to requirements-backend.txt
echo "redis[asyncio]==5.0.1" >> requirements-backend.txt
```

### Step 4: Implement Code Changes
- Create `session_service.py`
- Add session endpoints to `main_cloud.py`
- Modify `chat-stream` endpoint
- Update client `sse-client.js`

### Step 5: Deploy
```bash
HUSKY=0 flyctl deploy -a nuzantara-rag --remote-only
```

### Step 6: Test
- Run test scenarios
- Verify 50+ message support
- Check backward compatibility

---

## 📊 Performance Metrics

| Metric | Before (Compression) | After (Session Store) |
|--------|---------------------|----------------------|
| Max messages | 20 | 50+ |
| URL size | ~4-5 KB | ~100 bytes |
| Client overhead | Compression | Session API calls |
| Server overhead | Decompression | Redis reads |
| Latency | ~0ms | ~2-5ms (Redis) |
| Scalability | Limited | High |

---

## 🔒 Security Considerations

1. **Session ID**: Use UUID v4 (cryptographically random)
2. **TTL**: 24h expiry prevents abandoned sessions
3. **Validation**: Check session_id format before Redis calls
4. **Rate limiting**: Prevent session creation abuse
5. **CORS**: Ensure proper CORS headers for session endpoints

---

## 🔄 Backward Compatibility

- ✅ Old clients using `conversation_history` querystring still work
- ✅ Server checks `session_id` first, then falls back to `conversation_history`
- ✅ No breaking changes
- ✅ Gradual rollout possible (deploy backend, then update clients)

---

## 📈 Future Enhancements

1. **Session Analytics**: Track session lifetime, message count
2. **Session Sharing**: Allow multiple users to share session
3. **Persistent Storage**: Move important sessions to PostgreSQL
4. **Compression**: Still compress data in Redis for efficiency
5. **Clustering**: Redis cluster for high availability

---

**Next Steps**: Implement in order:
1. ✅ Setup Upstash Redis
2. Create SessionService
3. Add session endpoints
4. Modify chat-stream
5. Update client
6. Test & deploy
