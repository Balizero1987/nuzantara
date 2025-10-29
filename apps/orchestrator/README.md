# ZANTARA Orchestrator

Router-Only orchestrator that connects FLAN-T5 router with Claude Haiku for intelligent tool routing and response generation.

## 🌐 Deployed URLs

**Production (Fly.io)**:
- **Orchestrator**: https://nuzantara-orchestrator.fly.dev
- **FLAN Router**: https://nuzantara-flan-router.fly.dev

**Endpoints**:
- Query: `POST https://nuzantara-orchestrator.fly.dev/api/query`
- Health: `GET https://nuzantara-orchestrator.fly.dev/health`
- Metrics: `GET https://nuzantara-orchestrator.fly.dev/api/metrics`

## 📋 Quick Test

```bash
# Test query
curl -X POST https://nuzantara-orchestrator.fly.dev/api/query \
  -H 'Content-Type: application/json' \
  -d '{"query": "What is KITAS?"}'

# Check health
curl https://nuzantara-orchestrator.fly.dev/health
```

## 🚀 Architecture

```
User Query
    ↓
FLAN-T5 Router (tool selection)
    ↓
Claude Haiku (with selected tools)
    ↓
Tool Execution Loop:
    1. Haiku returns tool_use blocks
    2. Execute tools via SuperToolHandlers
    3. Send results back to Haiku
    4. Get final text response
    ↓
Final Response
```

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Start
npm start

# Dev mode (with hot reload)
npm run dev
```

## 🚢 Deployment

```bash
# Deploy to Fly.io
flyctl deploy

# View logs
flyctl logs

# Check status
flyctl status
```

## 📦 Environment Variables

Required:
- `ANTHROPIC_API_KEY`: Claude API key
- `FLAN_ROUTER_URL`: URL to FLAN router service (default: https://nuzantara-flan-router.fly.dev)

Optional:
- `PORT`: Port to run on (default: 3000)
- `TS_BACKEND_URL`: TypeScript backend URL
- `PYTHON_BACKEND_URL`: Python backend URL

## 🔧 Recent Updates

### 2025-10-29: Tool Execution Loop Fix
- **CRITICAL FIX**: Implemented tool execution loop
- Previously returned tool_use JSON instead of executing tools
- Now properly executes tools and generates complete responses
- Fixed 94% of test failures (47/50 incomplete responses)

## 📊 Performance

Current metrics:
- Router latency: ~250ms (FLAN-T5)
- Haiku latency: ~2-3s (with tool execution)
- Total latency: ~2.5-3.5s
- Fallback mode: ~16s (when router unavailable)

## 🔗 Related Documentation

- [Hosting Options](/ORCHESTRATOR_HOSTING_OPTIONS.md)
- [Router System Documentation](/apps/backend-ts/src/handlers/router-system/)
