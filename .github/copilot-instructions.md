# NUZANTARA Railway - AI Coding Agent Instructions

NUZANTARA is a production Indonesian business services AI platform with TypeScript/Python backends, Oracle system for domain-specific queries, and comprehensive handler architecture.

## Architecture Overview

### Core Service Boundaries
- **TS Backend** (`apps/backend-ts`): Express API, 164+ handlers, business logic, authentication
- **RAG Backend** (`apps/backend-rag`): Python FastAPI, ChromaDB vector search, Oracle system, AI processing  
- **Frontend** (`apps/webapp`): Vanilla JS SPA with BFF proxy server
- **Dashboard** (`apps/dashboard`): Static monitoring interface

### Data Flow Pattern
```
User → Frontend → TS Backend → RAG Backend → [ChromaDB/PostgreSQL] → Claude Haiku/Llama → Response
```

Key integration: TS Backend proxies to RAG Backend via `/api/rag/*` routes for AI processing.

## Essential Development Workflows

### Build & Run Commands
```bash
# Root install (npm workspaces)
npm install

# Build TypeScript (uses shared/config/core/tsconfig.json)
npm run build          # Outputs to dist/
npm run build:fast     # Same but with echo confirmation

# Development
npm run dev            # tsx watch apps/backend-ts/src/index.ts
npm start              # node dist/index.js (requires build first)

# Health checks
npm run health-check   # Curl both backends + jq format
npm run test:working   # Quick handler verification
```

### Testing Patterns
- **Integration**: `scripts/test/test-*.sh` - Production endpoint testing
- **Unit**: Jest with auto-generated test templates (`generate-tests.py`)
- **E2E**: Playwright config in `.autofix/e2e-tests/`
- **Handler verification**: `test-working.sh` tests core handlers via `/call` endpoint
- **Live Feature Testing**: `test-all-features-live.py` - Playwright automation of production webapp

### Debug Commands
```bash
npm run typecheck      # TypeScript validation only
npm run lint           # ESLint (may not be installed) - run `npm install eslint` if needed
./scripts/onboarding_smoke.sh  # Quick system verification
python test-all-features-live.py  # Full frontend feature testing
```

## Handler Architecture (Critical Pattern)

### Handler Response Format (ALWAYS use)
```typescript
import { ok, err } from "../../utils/response.js";

export async function myHandler(params: any) {
  try {
    const result = processData(params);
    return ok(result);  // { ok: true, data: result }
  } catch (error) {
    return err(error.message);  // { ok: false, error: message }
  }
}
```

### Handler Registration (Auto-discovery)
- Place handlers in `src/handlers/*/` subdirectories
- Export functions directly - auto-loaded by `router.ts`
- Accessible via `/call` POST endpoint with `{"key": "handler.name", "params": {...}}`
- Handler registry managed in `src/core/handler-registry.ts`

### Oracle System Pattern
The RAG backend has domain-specific "Oracles" (tax, legal, property, visa, kbli). Use Universal Oracle:
```typescript
// TS Backend proxy to RAG
const response = await fetch(`${RAG_BACKEND_URL}/api/oracle/query`, {
  method: 'POST',
  body: JSON.stringify({
    query: "user question",
    domain_hint: "tax", // optional
    use_ai: true
  })
});
```

## TypeScript/ESM Conventions

### Module System
- **Strict ESM**: Use `.js` extensions in imports even for `.ts` files
- **Shared config**: TypeScript builds with `shared/config/core/tsconfig.json`
- **Bridge disabled**: Legacy bridge.js system removed - use direct implementations

### File Structure
```
src/
├── handlers/           # Business logic (164+ handlers)
│   ├── bali-zero/     # Oracle queries, pricing
│   ├── google-workspace/ # Gmail, Drive, Sheets  
│   └── system/        # Health, metrics, proxies
├── services/          # Shared services (logger, RAG, auth)
├── routing/           # Router with handler registry
└── utils/             # Response helpers, errors
```

### Error Handling Pattern
```typescript
import { BadRequestError } from "../utils/errors.js";

// In handlers - throw for validation
if (!params.required) {
  throw new BadRequestError("required parameter missing");
}

// In routes - catch and format
try {
  const result = await handler(params);
  return res.json(result);
} catch (error) {
  if (error instanceof BadRequestError) {
    return res.status(400).json(err(error.message));
  }
  return res.status(500).json(err(error.message));
}
```

## Integration Points

### RAG Backend Communication
```typescript
// Proxy pattern used throughout TS Backend
const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL;
const response = await fetch(`${RAG_BACKEND_URL}/api/endpoint`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(params)
});
```

### External APIs
- **Google Workspace**: OAuth2 via `google-auth-library`
- **PostgreSQL**: Direct queries for CRM/memory  
- **ChromaDB**: Vector search via RAG backend only
- **Claude/Ollama**: AI processing via RAG backend

### Authentication
- **API Key**: `x-api-key` header for handler access
- **JWT**: Team authentication for CRM features
- **Demo user**: Built-in demo account for testing

## Project-Specific Gotchas

1. **Handler paths**: Always include in router.ts imports with `.js` extension
2. **Build artifacts**: `dist/` directory at repo root, not in apps/backend-ts/
3. **Environment split**: `main_cloud.py` (prod) vs `main_integrated.py` (dev) in RAG backend
4. **Oracle collections**: 5 specialized domains (tax, legal, property, visa, kbli) - use universal endpoint
5. **ESM strict**: No CommonJS mixing - pure ESM with `"type": "module"`

When working on handlers, always test via `/call` endpoint and verify health checks pass before committing.