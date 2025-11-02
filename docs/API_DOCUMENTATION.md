# ZANTARA API Documentation
Production-Ready REST API Reference

**Base URLs:**
- RAG Backend: `https://nuzantara-rag.fly.dev`
- Backend TS: `https://nuzantara-backend.fly.dev`
- Core Backend: `https://nuzantara-core.fly.dev`

**Version:** 5.2.1  
**Last Updated:** 2025-11-02

---

## Table of Contents

1. [Authentication](#authentication)
2. [Health & Status](#health--status)
3. [Vector Search](#vector-search)
4. [SSE Streaming](#sse-streaming)
5. [Memory Management](#memory-management)
6. [CRM Operations](#crm-operations)
7. [Rate Limiting](#rate-limiting)
8. [Error Handling](#error-handling)

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
  "service": "ZANTARA RAG",
  "version": "v100-perfect",
  "mode": "full",
  "available_services": [
    "chromadb",
    "claude_haiku",
    "postgresql",
    "crm_system"
  ],
  "chromadb": true,
  "ai": {
    "claude_haiku_available": true,
    "has_ai": true
  },
  "memory": {
    "postgresql": true,
    "vector_db": true
  },
  "crm": {
    "enabled": true,
    "endpoints": 41,
    "features": [
      "auto_extraction",
      "client_tracking",
      "practice_management",
      "shared_memory"
    ]
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

## Memory Management

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

**Last Updated:** 2025-11-02  
**Version:** 5.2.1  
**Maintained by:** ZANTARA Team
