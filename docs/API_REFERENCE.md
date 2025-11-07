# NUZANTARA API Reference

**Version:** 5.2.0
**Base URLs:**
- Backend-TS: `https://nuzantara-backend.fly.dev`
- Backend-RAG: `https://nuzantara-rag.fly.dev`

**Last Updated:** 2025-11-07

---

## Table of Contents

1. [Authentication](#authentication)
2. [Backend-TS API](#backend-ts-api)
3. [Backend-RAG API](#backend-rag-api)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Webhooks](#webhooks)

---

## Authentication

### JWT Token Authentication

All API requests (except public endpoints) require a JWT token in the `Authorization` header.

**Header Format:**
```http
Authorization: Bearer <your_jwt_token>
```

### Get JWT Token

**Endpoint:** `POST /api/auth/team/login`

**Request:**
```json
{
  "email": "user@balizero.com",
  "pin": "123456",
  "name": "User Name"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "sessionId": "sess_abc123",
  "user": {
    "id": 1,
    "email": "user@balizero.com",
    "name": "User Name",
    "role": "member"
  },
  "personalizedResponse": "Welcome back, User Name!"
}
```

### Refresh Token

**Endpoint:** `POST /auth/refresh`

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}
```

---

## Backend-TS API

Base URL: `https://nuzantara-backend.fly.dev`

### System Endpoints

#### Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "version": "5.2.0",
  "timestamp": "2025-11-07T10:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "chromadb": "connected"
  }
}
```

#### Performance Metrics

**Endpoint:** `GET /performance`

**Response:**
```json
{
  "requestCount": 15234,
  "avgResponseTime": 145,
  "p95ResponseTime": 320,
  "p99ResponseTime": 580,
  "errorRate": 0.002,
  "uptime": 2592000
}
```

### Authentication Endpoints

#### Team Login

**Endpoint:** `POST /api/auth/team/login`

**Request:**
```json
{
  "email": "user@balizero.com",
  "pin": "123456",
  "name": "User Name"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "sessionId": "sess_abc123",
  "user": {
    "id": 1,
    "email": "user@balizero.com",
    "name": "User Name",
    "role": "member",
    "ambaradam": "Exec"
  }
}
```

#### Get Team Members

**Endpoint:** `GET /api/auth/team/members`

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "members": [
    {
      "id": 1,
      "email": "dea@execops.balizero.com",
      "name": "Dea Exec",
      "role": "Operations Manager",
      "ambaradam": "Exec",
      "active": true
    }
  ]
}
```

### Google Workspace Endpoints

#### Gmail - Send Email

**Endpoint:** `POST /api/gmail/send`

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "to": "recipient@example.com",
  "subject": "Hello from ZANTARA",
  "body": "Email body content",
  "html": false
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_abc123",
  "threadId": "thread_xyz789"
}
```

#### Drive - Upload File

**Endpoint:** `POST /api/drive/upload`

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request:**
```
file: <binary>
folderId: "folder_abc123"
fileName: "document.pdf"
```

**Response:**
```json
{
  "success": true,
  "fileId": "file_abc123",
  "name": "document.pdf",
  "mimeType": "application/pdf",
  "webViewLink": "https://drive.google.com/file/d/..."
}
```

#### Calendar - Create Event

**Endpoint:** `POST /api/calendar/create`

**Request:**
```json
{
  "summary": "Client Meeting",
  "description": "Discuss PT PMA setup",
  "start": {
    "dateTime": "2025-11-10T14:00:00+08:00",
    "timeZone": "Asia/Singapore"
  },
  "end": {
    "dateTime": "2025-11-10T15:00:00+08:00",
    "timeZone": "Asia/Singapore"
  },
  "attendees": [
    {"email": "client@example.com"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "event_abc123",
  "htmlLink": "https://calendar.google.com/event?eid=...",
  "hangoutLink": "https://meet.google.com/..."
}
```

### Bali Zero Services

#### Oracle - Query

**Endpoint:** `POST /api/oracle/query`

**Request:**
```json
{
  "query": "What are the requirements for KITAS?",
  "domain": "immigration",
  "userEmail": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "response": "For KITAS (Limited Stay Permit), you need...",
  "sources": [
    {
      "title": "Immigration Law 2011",
      "chunk": "KITAS requirements include...",
      "confidence": 0.95
    }
  ],
  "processingTime": 1.234
}
```

#### Pricing - Get Quote

**Endpoint:** `POST /api/pricing/quote`

**Request:**
```json
{
  "category": "kitas",
  "subType": "limited_stay",
  "ownership": "foreign",
  "additionalServices": ["translation", "expedite"]
}
```

**Response:**
```json
{
  "success": true,
  "pricing": {
    "basePrice": 15000000,
    "currency": "IDR",
    "breakdown": [
      {"item": "KITAS Limited Stay", "amount": 15000000},
      {"item": "Translation Services", "amount": 500000},
      {"item": "Expedite Processing", "amount": 2000000}
    ],
    "totalPrice": 17500000,
    "processingTime": "90 days"
  }
}
```

#### KBLI - Lookup Business Code

**Endpoint:** `POST /api/kbli/lookup`

**Request:**
```json
{
  "query": "IT consulting services",
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "code": "62010",
      "name": "Computer Programming Activities",
      "category": "Information and Communication",
      "description": "Development of software, consulting...",
      "requirements": ["KBLI certificate", "Business license"]
    },
    {
      "code": "62020",
      "name": "Computer Consultancy Activities",
      "category": "Information and Communication",
      "description": "IT consulting, system analysis..."
    }
  ]
}
```

#### Team - Get Member Info

**Endpoint:** `POST /api/team/search`

**Request:**
```json
{
  "query": "Dea",
  "includeSkills": true
}
```

**Response:**
```json
{
  "success": true,
  "member": {
    "id": 1,
    "name": "Dea Exec",
    "email": "dea@execops.balizero.com",
    "role": "Operations Manager",
    "ambaradam": "Exec",
    "department": "Operations",
    "skills": ["Project Management", "Client Relations", "Process Optimization"],
    "contact": {
      "whatsapp": "+62 859 0436 9574",
      "email": "info@balizero.com"
    }
  }
}
```

### AI Services

#### AI Chat

**Endpoint:** `POST /api/ai/chat`

**Request:**
```json
{
  "message": "Explain PT PMA requirements",
  "userEmail": "user@example.com",
  "conversationId": "conv_abc123",
  "useRAG": true
}
```

**Response:**
```json
{
  "success": true,
  "response": "PT PMA (Foreign Investment Company) requires...",
  "conversationId": "conv_abc123",
  "model": "claude-haiku-4.5",
  "tokensUsed": 1234,
  "sources": [
    {
      "title": "Investment Law 2007",
      "relevance": 0.92
    }
  ]
}
```

#### AI Embeddings

**Endpoint:** `POST /api/ai/embeddings`

**Request:**
```json
{
  "texts": [
    "First text to embed",
    "Second text to embed"
  ],
  "model": "text-embedding-3-small"
}
```

**Response:**
```json
{
  "success": true,
  "embeddings": [
    [0.123, -0.456, 0.789, ...],
    [0.234, -0.567, 0.891, ...]
  ],
  "dimensions": 1536,
  "model": "text-embedding-3-small"
}
```

### Analytics Endpoints

#### Get Analytics Dashboard

**Endpoint:** `GET /api/analytics/dashboard`

**Query Parameters:**
- `startDate`: ISO 8601 date (default: 30 days ago)
- `endDate`: ISO 8601 date (default: today)
- `metrics`: Comma-separated list (default: all)

**Response:**
```json
{
  "success": true,
  "period": {
    "start": "2025-10-01T00:00:00Z",
    "end": "2025-11-01T00:00:00Z"
  },
  "metrics": {
    "totalRequests": 125430,
    "uniqueUsers": 1234,
    "avgResponseTime": 145,
    "errorRate": 0.002,
    "topEndpoints": [
      {
        "endpoint": "/api/ai/chat",
        "requests": 45230,
        "avgTime": 1234
      }
    ]
  }
}
```

### Cache Endpoints

#### Get Cache Health

**Endpoint:** `GET /cache/health`

**Response:**
```json
{
  "status": "ok",
  "redisConnected": true,
  "cacheSize": 1234567,
  "hitRate": 0.87,
  "evictionRate": 0.02
}
```

#### Clear Cache

**Endpoint:** `POST /cache/clear`

**Headers:**
```http
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "pattern": "user:*",
  "confirm": true
}
```

**Response:**
```json
{
  "success": true,
  "keysDeleted": 1234,
  "message": "Cache cleared successfully"
}
```

---

## Backend-RAG API

Base URL: `https://nuzantara-rag.fly.dev`

### Chat Endpoints

#### Bali Zero Chat (Streaming)

**Endpoint:** `GET /bali-zero/chat-stream`

**Query Parameters:**
- `query`: User message (required)
- `user_email`: User email (optional)
- `session_id`: Session ID for continuity (optional)

**Headers:**
```http
Accept: text/event-stream
Authorization: Bearer <token>
```

**Response:** (Server-Sent Events)
```
event: chunk
data: {"content": "PT ", "type": "text"}

event: chunk
data: {"content": "PMA ", "type": "text"}

event: chunk
data: {"content": "requires ", "type": "text"}

event: done
data: {"model": "claude-haiku-4.5", "tokens": 1234}
```

#### Bali Zero Chat (Standard)

**Endpoint:** `POST /bali-zero/chat`

**Request:**
```json
{
  "query": "What is the cost of PT PMA?",
  "user_email": "user@example.com",
  "user_role": "member",
  "tools": [],
  "tool_choice": {"type": "auto"}
}
```

**Response:**
```json
{
  "success": true,
  "response": "PT PMA setup costs vary based on...",
  "model_used": "claude-haiku-4.5",
  "ai_used": "anthropic",
  "tools_used": ["get_pricing", "kbli.lookup"],
  "sources": [
    {
      "title": "Investment Law 2007",
      "relevance": 0.95
    }
  ],
  "processingTime": 2.345
}
```

### Search Endpoints

#### Semantic Search

**Endpoint:** `POST /api/search/semantic`

**Request:**
```json
{
  "query": "visa requirements for business owners",
  "collections": ["visa_oracle", "legal_architect"],
  "top_k": 10,
  "min_similarity": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "doc_abc123",
      "content": "For business owners, KITAS requirements include...",
      "metadata": {
        "source": "Immigration Law 2011",
        "collection": "visa_oracle",
        "timestamp": "2025-01-15"
      },
      "similarity": 0.94
    }
  ],
  "queryTime": 0.123
}
```

#### Hybrid Search

**Endpoint:** `POST /api/search/hybrid`

**Request:**
```json
{
  "query": "PT PMA capital requirements",
  "keywords": ["foreign investment", "minimum capital"],
  "collections": ["legal_architect", "investment_regulations"],
  "top_k": 10
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "doc_xyz789",
      "content": "PT PMA minimum capital requirement is IDR 10 billion...",
      "scores": {
        "semantic": 0.89,
        "keyword": 0.76,
        "combined": 0.83
      }
    }
  ]
}
```

### Oracle Endpoints

#### Universal Oracle Query

**Endpoint:** `POST /api/oracle/universal`

**Request:**
```json
{
  "query": "What are tax obligations for PT PMA?",
  "domains": ["tax", "legal", "corporate"],
  "synthesize": true
}
```

**Response:**
```json
{
  "success": true,
  "synthesis": "PT PMA has multiple tax obligations including...",
  "domainResults": {
    "tax": {
      "response": "Corporate tax rate is 22%...",
      "confidence": 0.95
    },
    "legal": {
      "response": "Legal requirements include...",
      "confidence": 0.92
    }
  },
  "recommendations": [
    "Register for NPWP within 1 month",
    "File monthly VAT returns",
    "Submit annual tax return"
  ]
}
```

#### Tax Oracle

**Endpoint:** `POST /api/oracle/tax/query`

**Request:**
```json
{
  "query": "What is the corporate tax rate in Indonesia?",
  "entityType": "pt_pma",
  "year": 2025
}
```

**Response:**
```json
{
  "success": true,
  "answer": "Corporate tax rate for PT PMA in 2025 is 22%",
  "details": {
    "baseRate": 0.22,
    "reductions": [
      {"condition": "Listed on stock exchange", "rate": 0.19},
      {"condition": "SME with revenue < IDR 4.8B", "rate": 0.11}
    ],
    "deadlines": {
      "monthly": "20th of following month",
      "annual": "April 30th"
    }
  },
  "sources": ["Tax Law 2008", "PP 55/2022"]
}
```

#### Property Oracle

**Endpoint:** `POST /api/oracle/property/query`

**Request:**
```json
{
  "query": "Can foreigners buy land in Bali?",
  "location": "Bali",
  "propertyType": "land"
}
```

**Response:**
```json
{
  "success": true,
  "answer": "Foreigners cannot directly own land in Indonesia, but have alternatives...",
  "options": [
    {
      "method": "Hak Pakai (Right to Use)",
      "duration": "30 years (renewable)",
      "restrictions": "Residential use only"
    },
    {
      "method": "PT PMA (Company Ownership)",
      "duration": "Unlimited",
      "requirements": ["Minimum capital IDR 10B", "Business purpose"]
    },
    {
      "method": "Nominee Structure",
      "duration": "Varies",
      "risks": ["Legal risks", "Not recommended"]
    }
  ]
}
```

### CRM Endpoints

#### Create Client

**Endpoint:** `POST /api/crm/clients`

**Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "whatsapp": "+1234567890",
  "nationality": "USA",
  "passportNumber": "US123456",
  "clientType": "individual",
  "assignedTo": 1,
  "tags": ["investor", "pt_pma"]
}
```

**Response:**
```json
{
  "success": true,
  "client": {
    "id": 123,
    "uuid": "client_abc123xyz",
    "fullName": "John Doe",
    "email": "john@example.com",
    "status": "active",
    "createdAt": "2025-11-07T10:00:00Z"
  }
}
```

#### Get Client Practices

**Endpoint:** `GET /api/crm/clients/{clientId}/practices`

**Response:**
```json
{
  "success": true,
  "practices": [
    {
      "id": 456,
      "uuid": "practice_xyz789",
      "practiceType": "KITAS",
      "status": "in_progress",
      "startDate": "2025-10-01",
      "expectedCompletion": "2025-12-30",
      "quotedPrice": 15000000,
      "currency": "IDR",
      "assignedTo": {
        "id": 1,
        "name": "Dea Exec",
        "email": "dea@execops.balizero.com"
      }
    }
  ]
}
```

#### Add Interaction

**Endpoint:** `POST /api/crm/interactions`

**Request:**
```json
{
  "clientId": 123,
  "practiceId": 456,
  "interactionType": "chat",
  "channel": "whatsapp",
  "subject": "Document submission",
  "summary": "Client sent passport copies",
  "fullContent": "Full conversation text...",
  "sentiment": "positive",
  "actionItems": ["Verify passport", "Request bank statement"]
}
```

**Response:**
```json
{
  "success": true,
  "interaction": {
    "id": 789,
    "clientId": 123,
    "practiceId": 456,
    "interactionDate": "2025-11-07T10:30:00Z",
    "nextAction": "Verify passport within 24 hours"
  }
}
```

### Memory Endpoints

#### Save Conversation

**Endpoint:** `POST /api/memory/conversations`

**Request:**
```json
{
  "userId": "user_abc123",
  "sessionId": "sess_xyz789",
  "messages": [
    {
      "role": "user",
      "content": "What is PT PMA?",
      "timestamp": "2025-11-07T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "PT PMA is a Foreign Investment Company...",
      "timestamp": "2025-11-07T10:00:02Z"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "conversationId": "conv_abc123",
  "messageCount": 2,
  "savedAt": "2025-11-07T10:00:03Z"
}
```

#### Retrieve Conversation

**Endpoint:** `GET /api/memory/conversations/{sessionId}`

**Response:**
```json
{
  "success": true,
  "conversation": {
    "sessionId": "sess_xyz789",
    "userId": "user_abc123",
    "messages": [
      {
        "role": "user",
        "content": "What is PT PMA?",
        "timestamp": "2025-11-07T10:00:00Z"
      },
      {
        "role": "assistant",
        "content": "PT PMA is a Foreign Investment Company...",
        "timestamp": "2025-11-07T10:00:02Z"
      }
    ],
    "createdAt": "2025-11-07T10:00:00Z",
    "updatedAt": "2025-11-07T10:00:03Z"
  }
}
```

### Ingestion Endpoints

#### Ingest Document

**Endpoint:** `POST /api/ingest/document`

**Headers:**
```http
Content-Type: multipart/form-data
Authorization: Bearer <admin_token>
```

**Request:**
```
file: <binary>
collection: "legal_architect"
metadata: {"source": "Law 2025", "category": "corporate"}
chunkSize: 1000
overlapSize: 200
```

**Response:**
```json
{
  "success": true,
  "documentId": "doc_abc123",
  "chunksCreated": 45,
  "collection": "legal_architect",
  "processingTime": 12.345
}
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {},
    "timestamp": "2025-11-07T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### HTTP Status Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Temporary issue |

### Common Error Codes

| Error Code | Description |
|------------|-------------|
| `AUTH_TOKEN_INVALID` | JWT token is invalid or expired |
| `AUTH_TOKEN_EXPIRED` | JWT token has expired |
| `AUTH_INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `VALIDATION_ERROR` | Request validation failed |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `RATE_LIMIT_EXCEEDED` | API rate limit exceeded |
| `DATABASE_ERROR` | Database operation failed |
| `EXTERNAL_SERVICE_ERROR` | External API call failed |
| `INTERNAL_ERROR` | Unexpected internal error |

### Error Examples

**400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_TOKEN_INVALID",
    "message": "Authentication token is invalid or expired"
  }
}
```

**429 Rate Limit:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 60 seconds.",
    "details": {
      "retryAfter": 60,
      "limit": 100,
      "remaining": 0
    }
  }
}
```

---

## Rate Limiting

### Default Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Authentication | 10 requests | 15 minutes |
| AI Chat | 30 requests | 1 minute |
| Search | 60 requests | 1 minute |
| CRM Operations | 100 requests | 1 minute |
| Analytics | 30 requests | 1 minute |
| Other APIs | 100 requests | 15 minutes |

### Rate Limit Headers

Every response includes rate limit headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699362000
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 45 seconds.",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetAt": "2025-11-07T10:15:00Z"
    }
  }
}
```

---

## Webhooks

### Webhook Events

NUZANTARA can send webhooks for the following events:

| Event | Description |
|-------|-------------|
| `client.created` | New client created |
| `practice.status_changed` | Practice status updated |
| `document.uploaded` | Document uploaded |
| `renewal.alert` | Renewal alert triggered |
| `interaction.created` | New interaction logged |

### Webhook Payload

```json
{
  "event": "practice.status_changed",
  "timestamp": "2025-11-07T10:00:00Z",
  "data": {
    "practiceId": 456,
    "clientId": 123,
    "oldStatus": "in_progress",
    "newStatus": "completed",
    "completedBy": "dea@execops.balizero.com"
  },
  "signature": "sha256=abc123..."
}
```

### Webhook Verification

Verify webhook signature using HMAC SHA256:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

---

## API Changelog

### Version 5.2.0 (2025-11-07)
- Added autonomous agent system
- Added cross-oracle synthesis endpoint
- Improved RAG search accuracy to 94%
- Added session store for 50+ message conversations

### Version 5.1.0 (2025-11-02)
- Added CRM endpoints
- Added memory vector endpoints
- Improved streaming performance
- Added PP28 oracle support

### Version 5.0.0 (2025-10-15)
- Complete API redesign
- Added handler registry system
- Introduced modular route architecture
- Breaking changes in authentication

---

## Support

For API support:
- **Documentation:** [https://docs.nuzantara.com](https://docs.nuzantara.com)
- **Email:** dev@balizero.com
- **Slack:** #nuzantara-api-support

---

**Last Updated:** 2025-11-07
**Version:** 5.2.0
