# Streaming Debug Guide

## Overview
This guide explains how the chat streaming architecture works in Nuzantara and how to debug common issues.

## Architecture
The streaming implementation uses **Server-Sent Events (SSE)**.

### Frontend (`apps/webapp-next`)
- **File:** `lib/api/chat.ts`
- **Method:** `streamChat`
- **Protocol:** SSE (EventSource-like parsing)
- **Events Handled:**
    - `metadata`: Initial connection info and RAG context.
    - `token`: Text chunks of the AI response.
    - `done`: Stream completion signal.
    - `error`: Error messages.

### Backend (`apps/backend-rag`)
- **File:** `backend/app/main_cloud.py`
- **Endpoint:** `/bali-zero/chat-stream`
- **Logic:**
    - Validates JWT/API Key.
    - Calls `IntelligentRouter.stream_chat`.
    - Intercepts legacy `[METADATA]` tags and converts them to SSE `metadata` events.
    - Wraps text chunks in SSE `token` events.

## Common Issues & Fixes

### 1. "Failed to fetch" or Network Error
- **Cause:** CORS issues or wrong API URL.
- **Fix:** Check `NEXT_PUBLIC_API_URL` in `.env`. Ensure backend allows the frontend origin.

### 2. Garbage Output (e.g., `{"type": "token"...}`)
- **Cause:** Frontend is not parsing SSE format and displaying raw JSON.
- **Fix:** Ensure `chat.ts` uses the SSE parsing logic (checking for `data: ` prefix).

### 3. `[METADATA]` tags visible in chat
- **Cause:** Backend is sending raw metadata tags in the text stream.
- **Fix:** Ensure `main_cloud.py` intercepts `[METADATA]` and converts it to a `metadata` event.

### 4. 401 Unauthorized
- **Cause:** Missing or invalid JWT token.
- **Fix:** Ensure `chat.ts` includes `Authorization: Bearer <token>` header.

## Debugging Tools
Use the `verify_streaming.py` script in `apps/backend-rag` to test the endpoint directly:

```bash
cd apps/backend-rag
python3 verify_streaming.py
```