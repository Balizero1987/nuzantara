# 🧠 ZANTARA Memory Service

**Production-ready microservice for intelligent AI memory management with Redis caching, PostgreSQL persistence, and real-time admin dashboard.**

🌐 **Live Service:** https://nuzantara-memory.fly.dev
📊 **Admin Dashboard:** https://nuzantara-memory.fly.dev/dashboard.html
🔧 **Version:** 1.0 (Production)

## Architecture

```
Memory Service (Production)
├── ✅ Phase 1: PostgreSQL Foundation (COMPLETE)
│   ├── Session management with user tracking
│   ├── Conversation history with metadata
│   ├── Collective memory storage
│   ├── User facts persistence
│   └── Database optimization (indexes + statistics)
├── ✅ Phase 1.5: Redis Caching (COMPLETE)
│   ├── 1-hour TTL conversation cache
│   ├── Fallback to PostgreSQL on cache miss
│   └── Automatic cache invalidation
├── ✅ Phase 1.8: Admin Dashboard (COMPLETE)
│   ├── Real-time health monitoring
│   ├── Session and user statistics
│   ├── Database cleanup tools
│   └── Growth projections
└── 🔄 Phase 2: Intelligence (IN PROGRESS)
    ├── OpenAI GPT-4 summarization
    ├── Importance scoring
    └── Memory consolidation
```

## 🚀 Quick Start

### Access Dashboard
Open https://nuzantara-memory.fly.dev/dashboard.html to view:
- System health (PostgreSQL, Redis)
- Active sessions and messages
- User activity tracking
- Cleanup statistics

### Test Integration
```bash
# Run integration test
bash /tmp/test-integration.sh

# Expected output:
# ✅ First message stored
# ✅ Session found in Memory Service
# ✅ Follow-up message with memory
# ✅ Total messages: 4 (2 user + 2 assistant)
```

## 📡 API Reference

### Health & Monitoring

#### `GET /health`
Check service health and database connections.

```bash
curl https://nuzantara-memory.fly.dev/health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0",
  "timestamp": "2025-11-06T02:00:00.000Z",
  "databases": {
    "postgres": "connected",
    "redis": "connected"
  }
}
```

#### `GET /api/stats`
Get overall memory statistics.

```bash
curl https://nuzantara-memory.fly.dev/api/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "active_sessions": 184,
    "total_messages": 1109,
    "unique_users": 8,
    "collective_memories": 0,
    "total_facts": 0
  }
}
```

#### `GET /api/stats/users`
Get per-user activity statistics.

```bash
curl https://nuzantara-memory.fly.dev/api/stats/users
```

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "user_id": "zero",
      "member_name": "Zero",
      "session_count": 45,
      "last_active": "2025-11-06T01:30:00.000Z"
    }
  ]
}
```

### Session Management

#### `POST /api/session/create`
Create or update a session.

```bash
curl -X POST https://nuzantara-memory.fly.dev/api/session/create \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session_123",
    "user_id": "zero",
    "member_name": "Zero",
    "metadata": {
      "mode": "santai",
      "language": "id"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "session_id": "session_123",
  "created_at": "2025-11-06T02:00:00.000Z"
}
```

#### `GET /api/session/:session_id`
Get session details.

```bash
curl https://nuzantara-memory.fly.dev/api/session/session_123
```

### Conversation Storage

#### `POST /api/conversation/store`
Store a message in conversation history.

```bash
curl -X POST https://nuzantara-memory.fly.dev/api/conversation/store \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session_123",
    "user_id": "zero",
    "message_type": "user",
    "content": "What visa do I need for Bali?",
    "metadata": {
      "tokens": 8,
      "model": "gpt-4",
      "language": "en"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message_id": 456,
  "cached": true
}
```

#### `GET /api/conversation/:session_id`
Get conversation history with pagination and caching.

```bash
# Get last 10 messages (cached for 1 hour)
curl "https://nuzantara-memory.fly.dev/api/conversation/session_123?limit=10"

# Get specific page
curl "https://nuzantara-memory.fly.dev/api/conversation/session_123?limit=20&offset=20"
```

**Response:**
```json
{
  "success": true,
  "session_id": "session_123",
  "messages": [
    {
      "id": 456,
      "message_type": "user",
      "content": "What visa do I need for Bali?",
      "created_at": "2025-11-06T02:00:00.000Z",
      "metadata": {
        "tokens": 8,
        "model": "gpt-4"
      }
    }
  ],
  "total": 10,
  "source": "cache"
}
```

### Collective Memory

#### `POST /api/memory/collective/store`
Store shared knowledge accessible by all users.

```bash
curl -X POST https://nuzantara-memory.fly.dev/api/memory/collective/store \
  -H "Content-Type: application/json" \
  -d '{
    "category": "visa_rules",
    "content": "B211A visa allows 60-day stay extendable twice (30 days each)",
    "importance": 9,
    "metadata": {
      "source": "official_regulation",
      "last_updated": "2024-01-15"
    }
  }'
```

#### `GET /api/memory/collective/search`
Search collective memory by category.

```bash
curl "https://nuzantara-memory.fly.dev/api/memory/collective/search?category=visa_rules&limit=5"
```

### User Facts

#### `POST /api/memory/fact/store`
Store important facts about a specific user.

```bash
curl -X POST https://nuzantara-memory.fly.dev/api/memory/fact/store \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "zero",
    "fact_key": "preferred_visa",
    "fact_value": "B211A for digital nomads",
    "importance": 8
  }'
```

#### `GET /api/memory/fact/:user_id`
Get all facts for a user.

```bash
curl https://nuzantara-memory.fly.dev/api/memory/fact/zero
```

### Admin Operations (Protected)

#### `POST /api/conversation/:session_id/summarize`
Generate AI summary for long conversations (requires OpenAI API key).

```bash
curl -X POST https://nuzantara-memory.fly.dev/api/conversation/session_123/summarize
```

**Response:**
```json
{
  "success": true,
  "summary": "User inquired about B211A visa requirements...",
  "messages_summarized": 25,
  "tokens_saved": 1500
}
```

#### `POST /api/admin/optimize-database`
Apply performance indexes and update statistics.

```bash
curl -X POST https://nuzantara-memory.fly.dev/api/admin/optimize-database
```

**Response:**
```json
{
  "success": true,
  "optimizations_applied": 4,
  "indexes_created": ["idx_memory_sessions_user_id", "idx_memory_sessions_created_at"],
  "statistics_updated": ["memory_sessions", "memory_summaries"]
}
```

#### `POST /api/admin/cleanup-old-sessions`
Preview or execute cleanup of old sessions.

```bash
# Dry run (preview only)
curl -X POST https://nuzantara-memory.fly.dev/api/admin/cleanup-old-sessions \
  -H "Content-Type: application/json" \
  -d '{"days": 30, "dryRun": true}'

# Execute cleanup
curl -X POST https://nuzantara-memory.fly.dev/api/admin/cleanup-old-sessions \
  -H "Content-Type: application/json" \
  -d '{"days": 30, "dryRun": false}'
```

#### `GET /api/admin/cleanup-stats`
Get statistics about old sessions eligible for cleanup.

```bash
curl https://nuzantara-memory.fly.dev/api/admin/cleanup-stats
```

## 🔧 Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+ (optional, for caching)

### Setup

```bash
# Navigate to memory service directory
cd apps/memory-service

# Install dependencies
npm install

# Set environment variables
export DATABASE_URL="postgresql://user:pass@localhost:5432/memory_db"
export REDIS_URL="redis://localhost:6379"
export OPENAI_API_KEY="sk-..."
export PORT=8080

# Run database migrations (if needed)
psql $DATABASE_URL < schema.sql

# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ⚠️ | Redis connection (optional, falls back to DB) |
| `OPENAI_API_KEY` | ⚠️ | Required for summarization features |
| `PORT` | ❌ | Server port (default: 8080) |
| `NODE_ENV` | ❌ | Environment (development/production) |

## 🚀 Deployment (Fly.io)

### Initial Setup

```bash
# Login to Fly.io
flyctl auth login

# Create app (first time only)
flyctl apps create nuzantara-memory

# Create PostgreSQL database
flyctl postgres create --name nuzantara-postgres
flyctl postgres attach --app nuzantara-memory nuzantara-postgres

# Create Redis (optional)
flyctl redis create --name nuzantara-redis
flyctl redis attach --app nuzantara-memory nuzantara-redis
```

### Set Secrets

```bash
# OpenAI API key for summarization
flyctl secrets set OPENAI_API_KEY="sk-proj-..." -a nuzantara-memory

# Database URLs are auto-configured via attachments
```

### Deploy

```bash
cd apps/memory-service

# Deploy to production
flyctl deploy --ha=false

# Monitor deployment
flyctl logs -a nuzantara-memory

# Check health
curl https://nuzantara-memory.fly.dev/health
```

### Scaling

```bash
# Scale to 2 instances (high availability)
flyctl scale count 2 -a nuzantara-memory

# Scale VM resources
flyctl scale vm shared-cpu-1x -a nuzantara-memory
flyctl scale memory 512 -a nuzantara-memory
```

## 📊 Database Schema

### Tables

#### `memory_sessions`
Active user sessions with metadata.

```sql
CREATE TABLE memory_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  member_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX idx_memory_sessions_user_id ON memory_sessions(user_id);
CREATE INDEX idx_memory_sessions_created_at ON memory_sessions(created_at);
```

#### `memory_messages`
All conversation messages with full history.

```sql
CREATE TABLE memory_messages (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  message_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  FOREIGN KEY (session_id) REFERENCES memory_sessions(session_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_memory_messages_session_id ON memory_messages(session_id);
CREATE INDEX idx_memory_messages_created_at ON memory_messages(created_at);
```

#### `collective_memory`
Shared knowledge across all users.

```sql
CREATE TABLE collective_memory (
  id SERIAL PRIMARY KEY,
  category VARCHAR(255),
  content TEXT NOT NULL,
  importance INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);
```

#### `memory_facts`
Important user-specific facts.

```sql
CREATE TABLE memory_facts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  fact_key VARCHAR(255) NOT NULL,
  fact_value TEXT NOT NULL,
  importance INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, fact_key)
);
```

#### `memory_summaries`
AI-generated conversation summaries.

```sql
CREATE TABLE memory_summaries (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  messages_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (session_id) REFERENCES memory_sessions(session_id)
);
```

## 🔗 Backend Integration

### From Backend-TS

The Memory Service is automatically integrated into backend-ts via the `MEMORY_SERVICE_URL` environment variable.

**Configuration (apps/backend-ts/.env):**
```bash
MEMORY_SERVICE_URL=https://nuzantara-memory.fly.dev
```

**Usage in Chat Handler:**
```typescript
// apps/backend-ts/src/handlers/ai/chat.handler.ts

// 1. Store user message
await fetch(`${process.env.MEMORY_SERVICE_URL}/api/conversation/store`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_id: req.sessionId,
    user_id: req.userId,
    message_type: 'user',
    content: req.prompt,
    metadata: { mode: req.mode }
  })
});

// 2. Retrieve conversation history
const history = await fetch(
  `${process.env.MEMORY_SERVICE_URL}/api/conversation/${req.sessionId}?limit=10`
).then(r => r.json());

// 3. Send to AI with context
const aiResponse = await callOpenAI(req.prompt, history.messages);

// 4. Store AI response
await fetch(`${process.env.MEMORY_SERVICE_URL}/api/conversation/store`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_id: req.sessionId,
    user_id: req.userId,
    message_type: 'assistant',
    content: aiResponse,
    metadata: { model: 'gpt-4', tokens: 150 }
  })
});
```

### From Webapp

```javascript
// Store message from frontend
async function sendMessage(sessionId, userId, message) {
  const response = await fetch('https://nuzantara-memory.fly.dev/api/conversation/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      user_id: userId,
      message_type: 'user',
      content: message,
      metadata: { source: 'webapp' }
    })
  });
  return response.json();
}

// Retrieve conversation history
async function getHistory(sessionId) {
  const response = await fetch(
    `https://nuzantara-memory.fly.dev/api/conversation/${sessionId}?limit=20`
  );
  const data = await response.json();
  return data.messages;
}
```

## ⚡ Performance & Caching

### Redis Caching Strategy

**Conversation History:**
- **TTL:** 1 hour (3600 seconds)
- **Key Format:** `conversation:{session_id}:{limit}:{offset}`
- **Invalidation:** Automatic on new message storage
- **Fallback:** PostgreSQL if Redis unavailable

**Cache Hit Rates:**
- Typical: 70-85% (conversation retrieval)
- Dashboard: 90%+ (statistics with 30s refresh)

### Database Optimization

**Indexes Applied:**
```sql
-- Session lookups
CREATE INDEX idx_memory_sessions_user_id ON memory_sessions(user_id);
CREATE INDEX idx_memory_sessions_created_at ON memory_sessions(created_at);

-- Message retrieval
CREATE INDEX idx_memory_messages_session_id ON memory_messages(session_id);
CREATE INDEX idx_memory_messages_created_at ON memory_messages(created_at);

-- Composite index for session + time queries
CREATE INDEX idx_memory_messages_session_created
  ON memory_messages(session_id, created_at DESC);

-- Update statistics for query planner
ANALYZE memory_sessions;
ANALYZE memory_messages;
ANALYZE memory_summaries;
```

## 🐛 Troubleshooting

### Redis Connection Failed

**Symptom:** `databases.redis: "disconnected"` in /health endpoint

**Solution:** Redis is optional. Service falls back to PostgreSQL. To fix:
```bash
# Check Redis status
flyctl redis status -a nuzantara-redis

# Restart Redis
flyctl redis restart -a nuzantara-redis

# Verify connection
flyctl secrets list -a nuzantara-memory
```

### OpenAI Rate Limiting

**Symptom:** `429 Too Many Requests` on summarization

**Solution:** OpenAI has rate limits. Wait or upgrade plan.
```bash
# Check current usage
curl https://api.openai.com/v1/usage \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Test with backoff
curl -X POST https://nuzantara-memory.fly.dev/api/conversation/session_123/summarize
```

### Slow Query Performance

**Symptom:** Conversation retrieval takes >500ms

**Solution:** Apply database optimization
```bash
# Run optimization endpoint
curl -X POST https://nuzantara-memory.fly.dev/api/admin/optimize-database

# Check PostgreSQL logs
flyctl logs -a nuzantara-postgres | grep "duration:"
```

### Memory/Disk Full

**Symptom:** PostgreSQL health failing

**Solution:** Clean up old sessions
```bash
# Preview cleanup
curl -X POST https://nuzantara-memory.fly.dev/api/admin/cleanup-old-sessions \
  -H "Content-Type: application/json" \
  -d '{"days": 30, "dryRun": true}'

# Execute if safe
curl -X POST https://nuzantara-memory.fly.dev/api/admin/cleanup-old-sessions \
  -H "Content-Type: application/json" \
  -d '{"days": 30, "dryRun": false}'
```

## 📈 Monitoring

### Key Metrics

**Health Endpoint:** `GET /health`
- PostgreSQL: connected/disconnected
- Redis: connected/disconnected (optional)
- Version: deployment tracking

**Statistics:** `GET /api/stats`
- Active sessions (current conversations)
- Total messages (all time)
- Unique users (distinct user_ids)

**Dashboard:** https://nuzantara-memory.fly.dev/dashboard.html
- Real-time system health
- Per-user activity
- Growth projections
- Cleanup statistics

### Alerts

Monitor these thresholds:
- **Sessions > 10,000:** Consider cleanup or scaling
- **Messages > 100,000:** Database optimization needed
- **Response time > 1s:** Check indexes and caching
- **PostgreSQL disk > 80%:** Immediate cleanup required

## 🗺️ Roadmap

### ✅ Completed
- [x] Phase 1: PostgreSQL Foundation
  - [x] Session management
  - [x] Conversation history
  - [x] Collective memory
  - [x] User facts
  - [x] Database optimization
- [x] Phase 1.5: Redis Caching
  - [x] Conversation cache (1h TTL)
  - [x] Cache invalidation
  - [x] Fallback to PostgreSQL
- [x] Phase 1.8: Admin Dashboard
  - [x] Real-time monitoring
  - [x] Statistics tracking
  - [x] Cleanup tools

### 🔄 In Progress
- [ ] Phase 2: Intelligence
  - [x] OpenAI GPT-4 summarization (API ready, rate limit testing)
  - [ ] Importance scoring
  - [ ] Memory consolidation

### 📋 Planned
- [ ] Phase 3: Vector Search
  - [ ] Semantic memory search
  - [ ] Similar conversation retrieval
  - [ ] Context-aware suggestions
- [ ] Phase 4: Neo4j Knowledge Graph
  - [ ] Entity relationships
  - [ ] User preference mapping
  - [ ] Team knowledge networks
- [ ] Phase 5: Proactive Memory
  - [ ] Auto-summarization triggers
  - [ ] Memory importance decay
  - [ ] Context-aware recall
- [ ] Phase 6: GDPR Compliance
  - [ ] Right to be forgotten
  - [ ] Data export
  - [ ] Audit logging
- [ ] Phase 7: Team Memory
  - [ ] Multi-tenant isolation
  - [ ] Shared team knowledge
  - [ ] Permission management

## 📄 License

Proprietary - Bali Zero / ZANTARA

## 🆘 Support

- **Dashboard:** https://nuzantara-memory.fly.dev/dashboard.html
- **Health:** https://nuzantara-memory.fly.dev/health
- **Logs:** `flyctl logs -a nuzantara-memory`
- **Integration Test:** `/tmp/test-integration.sh`
