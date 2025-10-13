# 📚 ZANTARA API ENDPOINTS DOCUMENTATION

**Base URL**: `http://localhost:8080` (local) | `https://zantara-bridge-v2-prod-1064094238013.europe-west1.run.app` (production)
**Authentication**: Required for `/call` endpoint via header `x-api-key`

## 🔐 Authentication

All `/call` endpoint requests require:
```
Headers:
  x-api-key: your-api-key-here
  Content-Type: application/json
```

## 📊 System Endpoints

### Health Check
**GET** `/health`
```json
Response: {
  "status": "HEALTHY",
  "message": "Zantara Enhanced Bridge",
  "version": "4.0.0",
  "timestamp": "ISO-8601",
  "uptime": seconds,
  "bridge": "initialized",
  "environment": "development|production"
}
```

### Cache Statistics
**GET** `/cache/stats`
```json
Response: {
  "memory": {
    "entries": number,
    "maxEntries": 1000,
    "hits": number,
    "misses": number
  },
  "redis": "connected|disconnected"
}
```

### Rate Limit Statistics
**GET** `/rate-limit/stats`
```json
Response: {
  "blocked": number,
  "endpoints": {
    "/path": { "requests": number, "blocked": number }
  }
}
```

## 🤖 AI Handlers

### Unified AI Chat
**POST** `/call`
```json
{
  "key": "ai.chat",
  "params": {
    "prompt": "Your question here",
    "context": "Optional context",
    "provider": "auto|gemini|claude|openai|cohere"
  }
}
```
Status: ✅ OPERATIONAL - Auto-selects best AI provider

### Gemini Chat
**POST** `/call`
```json
{
  "key": "gemini.chat",
  "params": {
    "prompt": "Your question here",
    "model": "gemini-1.5-flash" // default
  }
}
```
Status: ✅ OPERATIONAL

### Claude Chat
**POST** `/call`
```json
{
  "key": "claude.chat",
  "params": {
    "prompt": "Your question here",
    "model": "claude-3-haiku-20240307" // default
  }
}
```
Status: ✅ OPERATIONAL

### OpenAI Chat
**POST** `/call`
```json
{
  "key": "openai.chat",
  "params": {
    "prompt": "Your question here",
    "model": "gpt-4" // default
  }
}
```
Status: ✅ OPERATIONAL

### Cohere Chat
**POST** `/call`
```json
{
  "key": "cohere.chat",
  "params": {
    "prompt": "Your question here",
    "model": "command-r-08-2024" // updated model
  }
}
```
Status: ✅ OPERATIONAL (Fixed model version)

## 💾 Memory Handlers

### Save Memory
**POST** `/call`
```json
{
  "key": "memory.save",
  "params": {
    "content": "Information to save",
    "tags": ["optional", "tags"]
  }
}
```
Status: ✅ OPERATIONAL

### Search Memory
**POST** `/call`
```json
{
  "key": "memory.search",
  "params": {
    "query": "search terms"
  }
}
```
Status: ✅ OPERATIONAL

### Retrieve Memory
**POST** `/call`
```json
{
  "key": "memory.retrieve",
  "params": {
    "key": "memory-key-id"
  }
}
```
Status: ✅ OPERATIONAL

## 📄 Google Workspace Handlers

### Create Document
**POST** `/call`
```json
{
  "key": "docs.create",
  "params": {
    "title": "Document Title",
    "content": "Initial content"
  }
}
```
Status: ⚠️ REQUIRES OAuth2 tokens

### Create Spreadsheet
**POST** `/call`
```json
{
  "key": "sheets.create",
  "params": {
    "title": "Spreadsheet Title",
    "data": [[...]] // optional initial data
  }
}
```
Status: ⚠️ REQUIRES OAuth2 tokens

### Create Presentation
**POST** `/call`
```json
{
  "key": "slides.create",
  "params": {
    "title": "Presentation Title"
  }
}
```
Status: ⚠️ REQUIRES OAuth2 tokens

## 🌐 Google Services

### List Calendars
**POST** `/call`
```json
{
  "key": "calendar.list",
  "params": {}
}
```
Status: ⚠️ REQUIRES OAuth2 authentication

### Upload to Drive
**POST** `/call`
```json
{
  "key": "drive.upload",
  "params": {
    "name": "filename.txt",
    "content": "file content",
    "mimeType": "text/plain"
  }
}
```
Status: ⚠️ REQUIRES media.body

## 💬 Communication Handlers

### Slack Notification
**POST** `/call`
```json
{
  "key": "slack.notify",
  "params": {
    "text": "Message text",
    "channel": "channel-name"
  }
}
```
Status: ❌ NEEDS SLACK_WEBHOOK_URL in .env

### Discord Notification
**POST** `/call`
```json
{
  "key": "discord.notify",
  "params": {
    "content": "Message content"
  }
}
```
Status: ❌ NEEDS DISCORD_WEBHOOK_URL in .env

### Google Chat Notification
**POST** `/call`
```json
{
  "key": "googlechat.notify",
  "params": {
    "text": "Message text",
    "space": "space-id"
  }
}
```
Status: ⚠️ REQUIRES proper message format

## 🎯 Custom GPT Handlers

### Contact Information
**POST** `/call`
```json
{
  "key": "contact.info",
  "params": {}
}
```
Status: ✅ OPERATIONAL - Returns Bali Zero contact details

### Save Lead
**POST** `/call`
```json
{
  "key": "lead.save",
  "params": {
    "name": "Customer Name",
    "email": "email@example.com",
    "service": "visa|company|tax|real-estate",
    "details": "Additional details"
  }
}
```
Status: ✅ OPERATIONAL

### Generate Quote
**POST** `/call`
```json
{
  "key": "quote.generate",
  "params": {
    "service": "visa|company|tax|real-estate",
    "type": "specific-service-type"
  }
}
```
Status: ✅ OPERATIONAL

## 📊 Handler Summary

| Category | Total | Operational | Configuration Needed |
|----------|-------|------------|---------------------|
| AI | 5 | 5 ✅ | - |
| Memory | 3 | 3 ✅ | - |
| Google Workspace | 3 | 0 | 3 (OAuth2 tokens) |
| Google Services | 2 | 0 | 2 (OAuth2 auth) |
| Communication | 3 | 0 | 3 (Webhook URLs) |
| Custom GPT | 3 | 3 ✅ | - |
| **TOTAL** | **19** | **11** | **8** |

## 🔒 Rate Limiting

- AI endpoints: 50 requests per 15 minutes
- Communication: 30 requests per 10 minutes
- Data endpoints: 200 requests per 5 minutes
- Auth endpoints: 5 requests per 15 minutes
- General: 60 requests per minute

## 💾 Caching

- AI responses: 1 hour TTL
- Memory searches: 10 minutes TTL
- Calendar events: 5 minutes TTL
- Max memory cache: 1000 entries

## 🚀 Quick Test Commands

```bash
# Test health
curl http://localhost:8080/health

# Test memory save (with auth)
curl -X POST http://localhost:8080/call \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "memory.save", "params": {"content": "Test memory"}}'

# Test AI chat
curl -X POST http://localhost:8080/call \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "ai.chat", "params": {"prompt": "Hello"}}'
```

---
**Last Updated**: 2025-09-24
**Version**: 4.0.0
**Status**: 58% Operational (11/19 handlers working)