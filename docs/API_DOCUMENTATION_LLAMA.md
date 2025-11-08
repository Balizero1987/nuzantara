# NUZANTARA RAG Backend - API Documentation

**Version**: v100-perfect
**Base URL**: `https://nuzantara-rag.fly.dev`
**AI System**: Llama 4 Scout PRIMARY + Claude Haiku 4.5 FALLBACK

---

## Table of Contents

1. [Authentication](#authentication)
2. [Health & Status](#health--status)
3. [RAG Search](#rag-search)
4. [AI Chat](#ai-chat)
5. [Session Management](#session-management)
6. [Collections Management](#collections-management)
7. [Error Handling](#error-handling)

---

## Authentication

### Demo Authentication (Development)

```http
POST /api/auth/demo
Content-Type: application/json
```

**Response**:
```json
{
  "token": "demo_test_user_1234567890",
  "expiresIn": 3600,
  "userId": "test_user"
}
```

**Example**:
```bash
curl -X POST https://nuzantara-rag.fly.dev/api/auth/demo
```

---

## Health & Status

### Health Check

```http
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-07T22:45:30.123Z",
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

**Example**:
```bash
curl https://nuzantara-rag.fly.dev/health
```

---

## RAG Search

### Search Documents

```http
POST /search
Content-Type: application/json
```

**Request Body**:
```json
{
  "query": "What is a PT PMA in Indonesia?",
  "collection_name": "legal_intelligence",
  "n_results": 3,
  "where": {},
  "where_document": {}
}
```

**Parameters**:
- `query` (required): Search query string
- `collection_name` (optional): Target collection (default: "legal_intelligence")
- `n_results` (optional): Number of results (default: 3, max: 10)
- `where` (optional): Metadata filters
- `where_document` (optional): Document content filters

**Response**:
```json
{
  "query": "What is a PT PMA in Indonesia?",
  "collection": "legal_intelligence",
  "results": [
    {
      "content": "License required for PT PMA to operate construction business in Indonesia (issued via OSS-RBA system after obtaining SBU).",
      "metadata": {
        "source": "legal_architect",
        "category": "business_licensing",
        "date": "2025"
      },
      "similarity": 0.6423
    },
    {
      "content": "PT PMA (Perseroan Terbatas Penanaman Modal Asing) is a foreign-owned limited liability company in Indonesia...",
      "metadata": {
        "source": "Indonesian Corporate Law 2025",
        "category": "company_formation"
      },
      "similarity": 0.6012
    }
  ],
  "total_results": 3,
  "processing_time_ms": 487
}
```

**Example**:
```bash
curl -X POST https://nuzantara-rag.fly.dev/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is a PT PMA in Indonesia?",
    "collection_name": "legal_intelligence",
    "n_results": 3
  }'
```

---

## AI Chat

### Standard Chat (Non-Streaming)

```http
POST /bali-zero/chat
Content-Type: application/json
```

**Request Body**:
```json
{
  "query": "What is the minimum capital for a PT PMA?",
  "mode": "SANTAI",
  "session_id": "optional-session-id",
  "collection": "legal_intelligence",
  "use_rag": true
}
```

**Parameters**:
- `query` (required): User question
- `mode` (optional): Chat mode - "SANTAI" (friendly), "FORMAL" (professional), "CHAT_ONLY" (no RAG)
- `session_id` (optional): Session identifier for conversation history
- `collection` (optional): RAG collection to search (default: "legal_intelligence")
- `use_rag` (optional): Enable RAG context (default: true)

**Response**:
```json
{
  "response": "For a PT PMA in Indonesia:\n\n**Minimum Capital Requirements:**\n- Authorized capital: > IDR 10 billion\n- Paid-up capital: IDR 2.5 billion (25% of authorized)\n- E31 KITAS requirement: Investor needs IDR 1 billion in personal shares\n\nThese are the official requirements under Indonesian Investment Law 2025.",
  "model_used": "meta-llama/llama-4-scout",
  "ai_used": "haiku",
  "mode": "SANTAI",
  "rag_used": true,
  "sources": [
    {
      "content": "Indonesian Corporate, Tax & Procedural Law 2025...",
      "metadata": {
        "source": "legal_updates",
        "year": "2025"
      },
      "similarity": 0.5642
    },
    {
      "content": "legal_architect_kb entry on PT PMA requirements...",
      "metadata": {
        "source": "legal_architect"
      },
      "similarity": 0.5459
    }
  ],
  "tokens": {
    "input": 1323,
    "output": 158,
    "total": 1481
  },
  "cost_usd": 0.0003,
  "processing_time_ms": 3542
}
```

**Example**:
```bash
curl -X POST https://nuzantara-rag.fly.dev/bali-zero/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the minimum capital for a PT PMA?",
    "mode": "SANTAI",
    "use_rag": true
  }'
```

### Streaming Chat (SSE)

```http
POST /bali-zero/chat-stream
Content-Type: application/json
```

**Request**: Same as standard chat

**Response**: Server-Sent Events stream

**Event Types**:

1. **Token Event** (response chunks):
```
data: {"type": "token", "content": "For a PT PMA"}
```

2. **Sources Event** (RAG sources):
```
data: {"type": "sources", "sources": [...]}
```

3. **Metadata Event** (response info):
```
data: {"type": "metadata", "model": "meta-llama/llama-4-scout", "tokens": {...}}
```

4. **Done Event** (stream completion):
```
data: {"type": "done"}
```

**Example (JavaScript)**:
```javascript
const response = await fetch('https://nuzantara-rag.fly.dev/bali-zero/chat-stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'What is the minimum capital for a PT PMA?',
    mode: 'SANTAI'
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));

      if (data.type === 'token') {
        appendToChat(data.content);
      } else if (data.type === 'sources') {
        displaySources(data.sources);
      } else if (data.type === 'done') {
        console.log('Stream complete');
      }
    }
  }
}
```

---

## Session Management

### Create Session

```http
POST /sessions
Content-Type: application/json
```

**Request**:
```json
{
  "session_id": "optional-custom-id",
  "ttl_hours": 24
}
```

**Response**:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-11-07T22:45:00Z",
  "expires_at": "2025-11-08T22:45:00Z"
}
```

### Get Session History

```http
GET /sessions/{session_id}
```

**Response**:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "messages": [
    {
      "role": "user",
      "content": "What is a PT PMA?",
      "timestamp": "2025-11-07T22:45:00Z"
    },
    {
      "role": "assistant",
      "content": "PT PMA is a foreign-owned company in Indonesia...",
      "timestamp": "2025-11-07T22:45:05Z"
    }
  ],
  "created_at": "2025-11-07T22:45:00Z",
  "updated_at": "2025-11-07T22:45:05Z"
}
```

### Update Session

```http
PUT /sessions/{session_id}
Content-Type: application/json
```

**Request**:
```json
{
  "messages": [
    {"role": "user", "content": "What is a PT PMA?"},
    {"role": "assistant", "content": "PT PMA is..."}
  ],
  "ttl_hours": 48
}
```

### Delete Session

```http
DELETE /sessions/{session_id}
```

**Response**:
```json
{
  "success": true,
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Collections Management

### List All Collections

```http
GET /api/collections
```

**Response**:
```json
{
  "collections": [
    "legal_intelligence",
    "legal_unified",
    "visa_oracle",
    "tax_genius",
    "kbli_comprehensive"
  ],
  "total": 5
}
```

### Get Collection Stats

```http
GET /api/collections/{collection_name}/stats
```

**Response**:
```json
{
  "collection": "legal_intelligence",
  "document_count": 3882,
  "embedding_dimension": 1536,
  "last_updated": "2025-11-07T22:45:00Z"
}
```

---

## Error Handling

### Error Response Format

```json
{
  "detail": "Error message describing what went wrong",
  "status_code": 400,
  "timestamp": "2025-11-07T22:45:00Z"
}
```

### Common HTTP Status Codes

- **200 OK**: Request successful
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Missing or invalid authentication
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: Service temporarily down

### Example Error Responses

**Invalid Query (400)**:
```json
{
  "detail": "Query parameter is required and cannot be empty",
  "status_code": 400
}
```

**Collection Not Found (404)**:
```json
{
  "detail": "Collection 'invalid_collection' does not exist",
  "status_code": 404
}
```

**AI Model Error (500)**:
```json
{
  "detail": "AI model temporarily unavailable. Retrying with fallback...",
  "status_code": 500
}
```

---

## Rate Limits

- **Standard endpoints**: 100 requests/minute
- **AI chat endpoints**: 20 requests/minute
- **Search endpoints**: 60 requests/minute

Exceeding rate limits returns `429 Too Many Requests`.

---

## Cost Breakdown

### Llama 4 Scout (PRIMARY)
- **Input**: $0.20 per 1M tokens
- **Output**: $0.20 per 1M tokens
- **Average query cost**: ~$0.0003

### Claude Haiku 4.5 (FALLBACK)
- **Input**: $1.00 per 1M tokens
- **Output**: $5.00 per 1M tokens
- **Average query cost**: ~$0.008

**Savings**: 92% cost reduction using Llama Scout as primary AI

---

## OpenAPI Specification

Full OpenAPI 3.0 spec available at:
```
GET https://nuzantara-rag.fly.dev/openapi.json
```

Interactive API docs:
```
GET https://nuzantara-rag.fly.dev/docs
```

---

## Support

- **Documentation**: This file
- **Health Status**: `GET /health`
- **OpenAPI Spec**: `GET /openapi.json`
- **Interactive Docs**: `GET /docs`

**Last Updated**: 2025-11-07
