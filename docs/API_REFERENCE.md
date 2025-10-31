# ZANTARA API Reference

## RAG Backend (Python/FastAPI)
**Base URL**: `https://nuzantara-rag.fly.dev`

### Endpoints

#### `POST /bali-zero/chat`
Main chat endpoint with RAG + AI

**Request**:
```json
{
  "messages": [
    {"role": "user", "content": "Query here"}
  ],
  "user_id": "unique_user_id",
  "conversation_history": [] // optional
}
```

**Response**:
```json
{
  "success": true,
  "response": "AI response here",
  "model_used": "claude-haiku-4-5-20251001",
  "used_rag": true,
  "sources": [...],
  "usage": {...}
}
```

#### `GET /health`
Health check endpoint

#### `POST /bali-zero/chat/stream`
SSE streaming endpoint for real-time responses

---

## TS Backend (Node.js/Express)
**Base URL**: `https://nuzantara-backend.fly.dev`

### Endpoints

#### `GET /health`
Health check

#### `GET /api/team/members`
List all team members

#### `POST /api/team/search`
Search team members by expertise

---

## Authentication
Currently using simple API keys. JWT coming soon.

## Rate Limits
- Free tier: 100 requests/hour
- Authenticated: 1000 requests/hour

