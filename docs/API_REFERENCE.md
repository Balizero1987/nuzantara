# API Reference

Documentazione delle API principali di NUZANTARA.

## Base URL

| Environment | URL |
|-------------|-----|
| Production | `https://nuzantara-rag.fly.dev` |
| Development | `http://localhost:8000` |

## Authentication

Tutte le API protette richiedono uno dei seguenti metodi:

```bash
# JWT Token (preferito)
Authorization: Bearer <jwt_token>

# API Key (server-to-server)
X-API-Key: <api_key>
```

---

## Chat API

### Stream Chat

Endpoint principale per chat con RAG e AI.

```
GET /bali-zero/chat-stream
GET /api/v2/bali-zero/chat-stream
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Messaggio utente |
| `user_email` | string | No | Email utente (override) |
| `user_role` | string | No | Ruolo utente (default: "member") |
| `conversation_history` | string | No | JSON array storia conversazione |

**Response:** Server-Sent Events (SSE)

```
data: {"type": "metadata", "data": {"status": "connected"}}

data: {"type": "token", "data": "Ciao"}

data: {"type": "token", "data": "!"}

data: {"type": "done", "data": null}

```

**Event Types:**

| Type | Description |
|------|-------------|
| `metadata` | Info connessione, RAG sources |
| `token` | Chunk di testo risposta |
| `done` | Fine streaming |
| `error` | Errore durante elaborazione |

**Example:**

```bash
curl "http://localhost:8000/bali-zero/chat-stream?query=Ciao" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Authentication API

### Team Login

```
POST /api/auth/team/login
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "pin": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "sessionId": "session_1234567890_uuid",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "User Name",
    "email": "user@example.com",
    "role": "member",
    "department": "operations",
    "language": "en"
  },
  "permissions": ["read", "write"],
  "personalizedResponse": true,
  "loginTime": "2024-12-04T10:30:00Z"
}
```

**Errors:**

| Status | Description |
|--------|-------------|
| 400 | Invalid PIN format |
| 401 | Invalid email or PIN |
| 500 | Authentication service unavailable |

### Get Profile

```
GET /api/auth/profile
```

**Headers:** `Authorization: Bearer <token>` (required)

**Response:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "role": "member",
  "status": "active",
  "language_preference": "en"
}
```

### Check Auth

```
GET /api/auth/check
```

**Response:**

```json
{
  "valid": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "member"
  }
}
```

---

## CRM API

### List Clients

```
GET /api/crm/clients
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | all | Filter by status |
| `limit` | int | 100 | Max results |
| `offset` | int | 0 | Pagination offset |

**Response:**

```json
[
  {
    "id": 1,
    "uuid": "client-uuid",
    "full_name": "Client Name",
    "email": "client@example.com",
    "phone": "+62123456789",
    "status": "active",
    "client_type": "individual",
    "assigned_to": "agent@balizero.com",
    "tags": ["visa", "priority"],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-12-01T00:00:00Z"
  }
]
```

### Create Client

```
POST /api/crm/clients?created_by=<email>
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `created_by` | string | Yes | Email of creator |

**Request Body:**

```json
{
  "full_name": "New Client",
  "email": "new@example.com",
  "phone": "+62123456789",
  "client_type": "individual",
  "status": "lead"
}
```

### Update Client

```
PATCH /api/crm/clients/{client_id}?updated_by=<email>
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `updated_by` | string | Yes | Email of updater |

**Request Body:**

```json
{
  "status": "active",
  "assigned_to": "agent@balizero.com"
}
```

### Get Client

```
GET /api/crm/clients/{client_id}
```

### Delete Client

```
DELETE /api/crm/clients/{client_id}
```

---

## CRM Practices API

### List Practices

```
GET /api/crm/practices
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `client_id` | int | Filter by client |
| `practice_type` | string | Filter by type |
| `status` | string | Filter by status |

### Create Practice

```
POST /api/crm/practices?created_by=<email>
```

**Request Body:**

```json
{
  "client_id": 1,
  "practice_type": "visa_application",
  "status": "in_progress",
  "start_date": "2024-12-01",
  "expected_end_date": "2024-12-31",
  "notes": "KITAS application"
}
```

### Update Practice

```
PATCH /api/crm/practices/{practice_id}?updated_by=<email>
```

### Upcoming Renewals

```
GET /api/crm/practices/renewals/upcoming?_days=90
```

**Response:**

```json
[
  {
    "id": 1,
    "client_id": 123,
    "practice_type": "visa_renewal",
    "expiry_date": "2025-03-01",
    "days_until_expiry": 87
  }
]
```

---

## CRM Interactions API

### List Interactions

```
GET /api/crm/interactions
```

### Create Interaction

```
POST /api/crm/interactions
```

**Request Body:**

```json
{
  "client_id": 1,
  "interaction_type": "email",
  "direction": "outbound",
  "subject": "Follow-up",
  "content": "Message content...",
  "team_member": "agent@balizero.com"
}
```

### Sync Gmail

```
POST /api/crm/interactions/sync-gmail
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | int | 5 | Max emails to sync |
| `team_member` | string | "system" | Assignee |

**Response:**

```json
{
  "emails_processed": 5,
  "new_clients": 1,
  "updated_clients": 2,
  "new_interactions": 5,
  "status": "success"
}
```

---

## Knowledge API

### Search Knowledge Base

```
POST /api/knowledge/search
```

**Request Body:**

```json
{
  "query": "visa requirements Indonesia",
  "collections": ["visa_oracle", "legal_unified"],
  "limit": 10,
  "score_threshold": 0.7
}
```

**Response:**

```json
{
  "results": [
    {
      "id": "doc-uuid",
      "collection": "visa_oracle",
      "text": "Document content...",
      "score": 0.85,
      "metadata": {}
    }
  ],
  "total": 10,
  "query_time_ms": 45
}
```

### Ingest Document

```
POST /api/ingest/book
```

**Request Body:**

```json
{
  "title": "Document Title",
  "content": "Full document content...",
  "collection": "knowledge_base",
  "metadata": {
    "author": "Author Name",
    "category": "legal"
  }
}
```

---

## Memory API

### Store Memory

```
POST /api/memory/store
```

**Request Body:**

```json
{
  "user_id": "user@example.com",
  "content": "User prefers formal communication",
  "memory_type": "preference",
  "importance": 0.8
}
```

### Search Memories

```
POST /api/memory/search
```

**Request Body:**

```json
{
  "user_id": "user@example.com",
  "query": "communication preferences",
  "limit": 5
}
```

---

## Health API

### Health Check

```
GET /health
```

**Response:**

```json
{
  "status": "healthy",
  "services": {
    "search": "healthy",
    "ai": "healthy",
    "database": "healthy",
    "memory": "healthy"
  },
  "version": "5.2.0",
  "uptime": 3600
}
```

### Service Status

```
GET /api/health/services
```

**Response:**

```json
{
  "overall": "healthy",
  "services": {
    "search": {"status": "healthy", "latency_ms": 12},
    "ai": {"status": "healthy", "latency_ms": 150},
    "database": {"status": "healthy", "latency_ms": 5},
    "redis": {"status": "healthy", "latency_ms": 2}
  }
}
```

---

## Productivity API

### Get Calendar Events

```
GET /api/productivity/calendar/events
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `start_date` | string | Start date (ISO 8601) |
| `end_date` | string | End date (ISO 8601) |
| `user_email` | string | Filter by user |

### Create Calendar Event

```
POST /api/productivity/calendar/events
```

**Request Body:**

```json
{
  "title": "Meeting",
  "description": "Team sync",
  "start_time": "2024-12-04T10:00:00Z",
  "end_time": "2024-12-04T11:00:00Z",
  "attendees": ["user1@example.com", "user2@example.com"]
}
```

---

## Team Activity API

### Clock In

```
POST /api/team/clock-in
```

**Request Body:**

```json
{
  "user_email": "user@example.com",
  "location": "office"
}
```

### Clock Out

```
POST /api/team/clock-out
```

### Get Status

```
GET /api/team/status/{user_email}
```

**Response:**

```json
{
  "user_email": "user@example.com",
  "status": "working",
  "clock_in_time": "2024-12-04T09:00:00Z",
  "total_hours_today": 4.5
}
```

---

## Error Responses

Tutti gli errori seguono questo formato:

```json
{
  "detail": "Error message describing what went wrong"
}
```

**HTTP Status Codes:**

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid auth) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 422 | Unprocessable Entity (validation error) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## Rate Limiting

Default limits:
- 60 requests per minute per IP
- 10 burst requests

Headers returned:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1701680400
```

---

## OpenAPI Specification

Full API spec disponibile a:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **OpenAPI JSON:** `http://localhost:8000/api/v1/openapi.json`

### Generate TypeScript Client

```bash
cd apps/webapp-next
npm run generate:client
```

Questo genera client tipizzato in `src/lib/api/generated/`.
