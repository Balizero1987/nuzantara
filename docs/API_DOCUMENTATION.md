# ZANTARA API Documentation
Production-Ready REST API Reference

**Base URLs:**
- RAG Backend: `https://nuzantara-rag.fly.dev`
- Backend TS: `https://nuzantara-backend.fly.dev`
- Core Backend: `https://nuzantara-core.fly.dev`
- **Memory Service:** `https://nuzantara-memory.fly.dev` ✨ *NEW*

**Version:** 6.0.0
**Last Updated:** 2025-11-19

---

## Table of Contents

1. [Authentication](#authentication)
2. [AI System](#ai-system)
3. [Health & Status](#health--status)
4. [Vector Search](#vector-search)
5. [SSE Streaming](#sse-streaming)
6. [Memory Management (Vector DB)](#memory-management-vector-db)
7. **[Conversation Memory Service](#conversation-memory-service)** ✨ *NEW*
8. [CRM Operations](#crm-operations)
9. [Rate Limiting](#rate-limiting)
10. [Error Handling](#error-handling)

---

## Authentication

Most endpoints require authentication via API key or session token.

### Headers

```http
Authorization: Bearer <your-api-key>
X-API-Key: <your-api-key>
```

### Rate Limits

| Tier | Requests/Hour | Burst Limit |
|------|---------------|-------------|
| Free | 100 | 10/sec |
| Basic | 1,000 | 20/sec |
| Pro | 10,000 | 50/sec |
| Enterprise | 100,000 | 100/sec |

---

## AI System

Our AI system uses a tiered approach to provide the best performance and cost-effectiveness.

- **Primary AI:** Llama 4 Scout (92% cheaper, 22% faster TTFT, 10M context)
- **Fallback AI:** Claude Haiku 4.5 (for tool calling and in case of primary AI failure)
- **Routing:** Intelligent Router that directs requests to the appropriate AI model.

This setup provides a 92% cost reduction compared to using only Claude Haiku.

---

## Health & Status

### GET /health

Check service health status.

**Request:**
```bash
curl https://nuzantara-rag.fly.dev/health
```

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2025-11-19T10:00:00.123Z",
  "version": "v100-perfect",
  "services": {
    "chromadb": {
      "status": "connected",
      "total_documents": 26036
    },
    "ai": {
      "primary": "Llama 4 Scout (92% cheaper, 22% faster TTFT, 10M context)",
      "fallback": "Claude Haiku 4.5 (tool calling, emergencies)",
      "routing": "Intelligent Router (Llama PRIMARY, Haiku FALLBACK)",
      "cost_savings": "92% cheaper than Haiku ($0.20/$0.20 vs $1/$5 per 1M tokens)"
    },
    "postgresql": {
      "status": "connected"
    },
    "crm": {
      "status": "available"
    },
    "reranker": {
      "status": "disabled"
    }
  }
}
```

---

## Vector Search

### POST /api/search

Semantic vector search across knowledge base.

**Request:**
```bash
curl -X POST https://nuzantara-rag.fly.dev/api/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "query": "What is PT PMA in Indonesia?",
    "top_k": 5,
    "collection": "visa_oracle",
    "filter": {}
  }'
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search query |
| top_k | integer | No | 3 | Number of results |
| collection | string | No | all | Specific collection to search |
| filter | object | No | {} | Metadata filters |
| threshold | float | No | 0.7 | Similarity threshold |

**Response:** `200 OK`
```json
{
  "results": [
    {
      "content": "PT PMA (Penanaman Modal Asing) is...",
      "metadata": {
        "source": "visa_oracle",
        "document": "PT_PMA_Guide.txt",
        "chunk_id": "123"
      },
      "similarity": 0.95,
      "distance": 0.05
    }
  ],
  "query": "What is PT PMA in Indonesia?",
  "total_results": 5,
  "search_time_ms": 45.3
}
```

---

## SSE Streaming

### GET /bali-zero/chat-stream

Real-time streaming chat responses using Server-Sent Events.

**Request:**
```bash
curl -N https://nuzantara-rag.fly.dev/bali-zero/chat-stream \
  -H "Accept: text/event-stream" \
  -H "Authorization: Bearer <token>" \
  -G \
  --data-urlencode "query=Tell me about Indonesian visas" \
  --data-urlencode "user_email=user@example.com"
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | User message/question |
| user_email | string | No | User email for personalization |
| conversation_history | JSON string | No | Previous messages |
| session_id | string | No | Session identifier |

**Response:** `200 OK` (text/event-stream)

```
data: {"text":"Hello","sequenceNumber":1,"timestamp":1730552400.123}

data: {"text":" there","sequenceNumber":2,"timestamp":1730552400.234}

data: {"text":"!","sequenceNumber":3,"timestamp":1730552400.345}

data: {"sources":[{"source":"Doc1","snippet":"...","similarity":0.95}]}

data: {"done":true,"sequenceNumber":3,"timestamp":1730552400.456,"streamDuration":0.333}
```

**Event Types:**

| Event | Description |
|-------|-------------|
| text | Text chunk from AI response |
| sources | Retrieved source documents |
| done | Stream completion signal |
| error | Error occurred |

**JavaScript Example:**
```javascript
const eventSource = new EventSource(
  'https://nuzantara-rag.fly.dev/bali-zero/chat-stream?query=Hello'
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.text) {
    console.log('Text:', data.text);
  }
  
  if (data.sources) {
    console.log('Sources:', data.sources);
  }
  
  if (data.done) {
    eventSource.close();
  }
};
```

---

## Memory Management (Vector DB)

### POST /api/memory/store

Store document in vector database.

**Request:**
```bash
curl -X POST https://nuzantara-rag.fly.dev/api/memory/store \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "visa_oracle",
    "content": "Document content here",
    "metadata": {
      "source": "manual_upload",
      "user": "admin@example.com"
    }
  }'
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "document_id": "doc_123456",
  "collection": "visa_oracle",
  "timestamp": "2025-11-02T15:30:00Z"
}
```

### GET /api/memory/collections

List available collections.

**Response:** `200 OK`
```json
{
  "collections": [
    {
      "name": "visa_oracle",
      "count": 1547,
      "description": "Visa and immigration knowledge"
    },
    {
      "name": "kbli_eye",
      "count": 892,
      "description": "KBLI business classification codes"
    }
  ],
  "total_collections": 14,
  "total_documents": 15432
}
```

---

## Conversation Memory Service

**New microservice for intelligent conversation memory management with PostgreSQL persistence and Redis caching.**

🌐 **Service URL:** `https://nuzantara-memory.fly.dev`
📊 **Admin Dashboard:** `https://nuzantara-memory.fly.dev/dashboard.html`
📖 **Full Documentation:** `apps/memory-service/README.md`

### Architecture

- **Storage:** PostgreSQL 16+ (sessions, messages, facts, summaries)
- **Caching:** Redis 7+ (1-hour TTL, automatic fallback)
- **Features:** Multi-user sessions, conversation history, AI summarization
- **Integration:** Seamlessly integrated with backend-ts

### GET /health

Check Memory Service health and database connections.

**Request:**
```bash
curl https://nuzantara-memory.fly.dev/health
```

**Response:** `200 OK`
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

### GET /api/stats

Get overall memory statistics.

**Request:**
```bash
curl https://nuzantara-memory.fly.dev/api/stats
```

**Response:** `200 OK`
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

### POST /api/conversation/store

Store a message in conversation history (automatically integrated in backend-ts).

**Request:**
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
      "model": "gpt-4"
    }
  }'
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message_id": 456,
  "cached": true
}
```

### GET /api/conversation/:session_id

Retrieve conversation history with Redis caching.

**Request:**
```bash
# Get last 10 messages (cached for 1 hour)
curl "https://nuzantara-memory.fly.dev/api/conversation/session_123?limit=10"
```

**Response:** `200 OK`
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

### POST /api/conversation/:session_id/summarize

Generate AI summary for long conversations (requires OpenAI API key).

**Request:**
```bash
curl -X POST https://nuzantara-memory.fly.dev/api/conversation/session_123/summarize
```

**Response:** `200 OK`
```json
{
  "success": true,
  "summary": "User inquired about B211A visa requirements...",
  "messages_summarized": 25,
  "tokens_saved": 1500
}
```

### Admin Operations

**Database Optimization:**
```bash
curl -X POST https://nuzantara-memory.fly.dev/api/admin/optimize-database
```

**Cleanup Preview:**
```bash
curl -X POST https://nuzantara-memory.fly.dev/api/admin/cleanup-old-sessions \
  -H "Content-Type: application/json" \
  -d '{"days": 30, "dryRun": true}'
```

**Live Dashboard:**
Visit `https://nuzantara-memory.fly.dev/dashboard.html` for real-time monitoring of:
- System health (PostgreSQL, Redis)
- Active sessions and messages
- Per-user activity statistics
- Database cleanup tools

---

## CRM Operations

### POST /api/crm/clients

Create new client profile.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Corp",
  "industry": "Technology",
  "notes": "Initial consultation scheduled"
}
```

**Response:** `201 Created`
```json
{
  "client_id": "client_789",
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2025-11-02T15:30:00Z"
}
```

### GET /api/crm/clients/{client_id}

Retrieve client information.

**Response:** `200 OK`
```json
{
  "client_id": "client_789",
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Corp",
  "interactions": 12,
  "last_contact": "2025-11-01T10:00:00Z",
  "status": "active"
}
```

---

## Rate Limiting

All requests are subject to rate limiting based on your tier.

### Rate Limit Headers

Every response includes rate limit headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1730552400
```

### Rate Limit Exceeded

**Response:** `429 Too Many Requests`
```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again later.",
  "retry_after": 3600,
  "limit": 1000,
  "window": "1 hour"
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing/invalid auth |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 502 | Bad Gateway - Upstream service error |
| 503 | Service Unavailable - Maintenance mode |

### Error Response Format

All errors follow this format:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional context"
  },
  "timestamp": "2025-11-02T15:30:00Z",
  "request_id": "req_abc123"
}
```

### Common Errors

**Invalid Query:**
```json
{
  "error": "invalid_query",
  "message": "Query parameter is required",
  "details": {
    "query": "This field is required"
  }
}
```

**Service Unavailable:**
```json
{
  "error": "service_unavailable",
  "message": "ChromaDB is temporarily unavailable",
  "retry_after": 60
}
```

---

## Webhooks

Subscribe to events via webhooks.

### POST /api/webhooks/subscribe

**Request:**
```json
{
  "url": "https://your-app.com/webhooks/zantara",
  "events": ["document.created", "search.completed"],
  "secret": "your_webhook_secret"
}
```

### Webhook Events

| Event | Description |
|-------|-------------|
| document.created | New document added |
| document.updated | Document modified |
| search.completed | Search query processed |
| client.created | New CRM client added |

---

## SDKs & Libraries

### Python

```python
from zantara import ZantaraClient

client = ZantaraClient(api_key="your_key")

# Vector search
results = client.search("What is PT PMA?", top_k=5)

# SSE streaming
for chunk in client.stream("Tell me about visas"):
    print(chunk.text)
```

### JavaScript/TypeScript

```typescript
import { ZantaraClient } from '@zantara/sdk';

const client = new ZantaraClient({ apiKey: 'your_key' });

// Vector search
const results = await client.search({
  query: 'What is PT PMA?',
  topK: 5
});

// SSE streaming
const stream = client.streamChat('Tell me about visas');
stream.on('data', (chunk) => console.log(chunk.text));
```

---

## Support

- **Documentation:** https://docs.zantara.balizero.com
- **API Status:** https://status.zantara.balizero.com
- **Support Email:** support@balizero.com
- **GitHub:** https://github.com/zantara/api

---

**Last Updated:** 2025-11-19
**Version:** 6.0.0
**Maintained by:** ZANTARA Team
