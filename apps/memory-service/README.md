# 🧠 Nuzantara Memory Service

Standalone microservice for intelligent AI memory management.

## Architecture

```
Memory Service (Standalone)
├── Phase 1: PostgreSQL Foundation ✅
│   ├── Session management
│   ├── Conversation history
│   ├── Collective memory
│   └── User facts
├── Phase 2: Vector Search (TODO)
│   └── ChromaDB semantic memory
├── Phase 3: Knowledge Graph (TODO)
│   └── Neo4j entity relationships
└── Phase 4: Intelligence (TODO)
    ├── Auto-summarization
    ├── Importance scoring
    └── Memory consolidation
```

## API Endpoints

### Health & Stats
- `GET /health` - Service health check
- `GET /api/stats` - Memory statistics

### Session Management
- `POST /api/session/create` - Create or update session
- `GET /api/session/:session_id` - Get session details

### Conversation Storage
- `POST /api/conversation/store` - Store message
- `GET /api/conversation/:session_id` - Get conversation history

### Collective Memory
- `POST /api/memory/collective/store` - Store shared knowledge
- `GET /api/memory/collective/search` - Search collective memory

### User Facts
- `POST /api/memory/fact/store` - Store user fact
- `GET /api/memory/fact/:user_id` - Get user facts

## Local Development

```bash
# Install dependencies
npm install

# Run in dev mode
npm run dev

# Build
npm run build

# Start production
npm start
```

## Deployment (Fly.io)

```bash
# Deploy
flyctl deploy

# Set secrets
flyctl secrets set DATABASE_URL="postgres://..."
flyctl secrets set REDIS_URL="redis://..."

# Scale
flyctl scale count 2

# Monitor
flyctl logs
```

## Database Schema

### Tables
1. `memory_sessions` - Active user sessions
2. `conversation_history` - All messages
3. `collective_memory` - Shared knowledge
4. `memory_facts` - Important user facts
5. `memory_summaries` - Consolidated conversations (Phase 2)

## Integration

```typescript
// From Backend-TS or Webapp
const response = await fetch('https://nuzantara-memory.fly.dev/api/conversation/store', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_id: 'session_123',
    user_id: 'zero',
    message_type: 'user',
    content: 'Hello Zantara!',
    metadata: {}
  })
});
```

## Roadmap

- [x] Phase 1: PostgreSQL Foundation
- [ ] Phase 2: ChromaDB Vector Search
- [ ] Phase 3: Neo4j Knowledge Graph
- [ ] Phase 4: GPT-4 Summarization
- [ ] Phase 5: Proactive Memory
- [ ] Phase 6: Team Memory
- [ ] Phase 7: GDPR Compliance
- [ ] Phase 8: Analytics Dashboard
