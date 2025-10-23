---
name: api-docs
description: Generate or update comprehensive API documentation for all endpoints in backend-ts and backend-rag with OpenAPI/Swagger compatible format
---

# API Documentation Generation Protocol

Use this skill when adding new endpoints, updating existing APIs, or when user asks for API documentation.

## Documentation Generation Process

### 1. Scan Backend TypeScript Routes
Analyze all route files:
```
apps/backend-ts/src/routes/
├── auth/
├── users/
├── rag/
├── oracle/
├── admin/
└── ...
```

For each route file, extract:
- HTTP method (GET, POST, PUT, DELETE, PATCH)
- Endpoint path
- Request parameters (path, query, body)
- Response format
- Authentication requirements
- Rate limits
- Error responses

### 2. Scan Backend RAG (FastAPI) Routes
FastAPI automatically generates OpenAPI docs. Extract from:
```
apps/backend-rag/backend/app/main_cloud.py
```

FastAPI provides `/docs` (Swagger UI) and `/openapi.json` automatically.

### 3. Document Each Endpoint

**Standard Format**:

```markdown
## [HTTP Method] [Endpoint Path]

**Description**: Brief description of what the endpoint does

**Authentication**: Required/Optional (JWT, API Key, etc.)

**Rate Limit**: X requests per minute/hour

**Request**:
- Headers:
  - `Authorization: Bearer <token>` (required)
  - `Content-Type: application/json`
- Path Parameters:
  - `id` (string): User ID
- Query Parameters:
  - `limit` (number, optional): Max results (default: 10)
  - `tier` (number): Access tier (0-3)
- Body (JSON):
  ```json
  {
    "query": "string",
    "tier": 0
  }
  ```

**Response**:
- Status: 200 OK
- Body:
  ```json
  {
    "results": [...],
    "count": 10,
    "latencyMs": 234
  }
  ```

**Error Responses**:
- 400 Bad Request: Invalid input
  ```json
  {"error": "Invalid tier value"}
  ```
- 401 Unauthorized: Missing or invalid token
- 403 Forbidden: Insufficient permissions
- 429 Too Many Requests: Rate limit exceeded
- 500 Internal Server Error: Server error

**Example**:
```bash
curl -X POST https://api.nuzantara.com/api/rag/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "How to get KITAS?", "tier": 1}'
```
```

### 4. Key API Sections to Document

#### Authentication APIs
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

#### RAG System APIs
```
POST /api/rag/query
GET  /api/rag/health
POST /api/rag/embed
GET  /api/rag/collections
```

#### Oracle Agent APIs
```
POST /api/oracle/visa-oracle
POST /api/oracle/kbli-eye
POST /api/oracle/tax-genius
POST /api/oracle/legal-architect
POST /api/oracle/morgana
POST /api/oracle/collaborate (multi-agent)
```

#### Admin APIs
```
GET  /api/admin/users
POST /api/admin/users/:id/tier
GET  /api/admin/stats
GET  /api/admin/logs
```

#### Health & Monitoring
```
GET  /health
GET  /api/health/db
GET  /api/health/chromadb
```

### 5. Generate OpenAPI Specification

Create `docs/api/openapi.yaml`:

```yaml
openapi: 3.0.0
info:
  title: Nuzantara API
  version: 5.2.0
  description: Indonesian business consulting AI platform
  contact:
    name: Bali Zero
    url: https://nuzantara.com

servers:
  - url: https://api.nuzantara.com
    description: Production
  - url: http://localhost:8080
    description: Development

paths:
  /api/rag/query:
    post:
      summary: Query RAG system
      tags: [RAG]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [query, tier]
              properties:
                query:
                  type: string
                  example: "How to get KITAS in Bali?"
                tier:
                  type: integer
                  enum: [0, 1, 2, 3]
                  example: 1
                limit:
                  type: integer
                  default: 10
      responses:
        '200':
          description: Successful query
          content:
            application/json:
              schema:
                type: object
                properties:
                  results:
                    type: array
                    items:
                      type: object
                  count:
                    type: integer
                  latencyMs:
                    type: number
        '401':
          description: Unauthorized
        '429':
          description: Rate limit exceeded

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

### 6. Generate Markdown Documentation

Create `docs/api/README.md` with:
- Getting started guide
- Authentication flow
- Common use cases
- Code examples (curl, JavaScript, Python)
- Error handling guide
- Rate limiting details
- Webhook documentation (if applicable)

### 7. Add Code Examples

For each major endpoint, provide examples in multiple languages:

**JavaScript (Fetch)**:
```javascript
const response = await fetch('https://api.nuzantara.com/api/rag/query', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'How to get KITAS in Bali?',
    tier: 1
  })
});

const data = await response.json();
console.log(data.results);
```

**Python (requests)**:
```python
import requests

response = requests.post(
    'https://api.nuzantara.com/api/rag/query',
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    },
    json={
        'query': 'How to get KITAS in Bali?',
        'tier': 1
    }
)

data = response.json()
print(data['results'])
```

**curl**:
```bash
curl -X POST https://api.nuzantara.com/api/rag/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "How to get KITAS in Bali?", "tier": 1}'
```

### 8. Document Data Models

Create `docs/api/models.md`:

```markdown
## Data Models

### User
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  tier: 0 | 1 | 2 | 3;
  createdAt: Date;
  updatedAt: Date;
}
```

### RAG Result
```typescript
interface RAGResult {
  id: string;
  content: string;
  source: string;
  page?: number;
  score: number;
  tier: number;
  metadata: Record<string, any>;
}
```

### Oracle Agent Response
```typescript
interface OracleResponse {
  agent: string;
  response: string;
  sources: string[];
  confidence: number;
  tier: number;
  tokensUsed: number;
}
```
```

## Documentation Structure

Create/update these files:

```
docs/api/
├── README.md              # Main API documentation
├── openapi.yaml           # OpenAPI 3.0 specification
├── authentication.md      # Auth guide
├── rate-limiting.md       # Rate limit details
├── models.md              # Data models
├── errors.md              # Error codes and handling
├── examples/              # Code examples
│   ├── javascript.md
│   ├── python.md
│   └── curl.md
└── endpoints/             # Detailed endpoint docs
    ├── auth.md
    ├── rag.md
    ├── oracle.md
    └── admin.md
```

## Tools to Use

### FastAPI Auto-docs
Access at `http://localhost:8000/docs` for interactive Swagger UI.

### OpenAPI Generator
Generate client libraries:
```bash
openapi-generator generate \
  -i docs/api/openapi.yaml \
  -g typescript-fetch \
  -o clients/typescript
```

## Update Process

When endpoints change:

1. **Identify changes**: Compare with existing docs
2. **Update OpenAPI spec**: Modify `openapi.yaml`
3. **Update Markdown docs**: Sync with spec
4. **Add examples**: Include code samples for new endpoints
5. **Update changelog**: Document what changed
6. **Versioning**: Increment API version if breaking changes

## Validation

Verify documentation quality:

- ✅ All endpoints documented
- ✅ Request/response schemas complete
- ✅ Authentication requirements clear
- ✅ Error responses documented
- ✅ Examples provided and tested
- ✅ Data models defined
- ✅ Rate limits specified
- ✅ OpenAPI spec validates

## Key Files to Check
- `apps/backend-ts/src/routes/**/*.ts` - Route definitions
- `apps/backend-rag/backend/app/main_cloud.py` - FastAPI routes
- `apps/backend-ts/src/interfaces/**/*.ts` - TypeScript interfaces
- `docs/api/` - Existing documentation

## Success Criteria
✅ Complete API reference created/updated
✅ OpenAPI spec validates successfully
✅ Code examples tested and working
✅ All endpoints have clear descriptions
✅ Authentication flow documented
✅ Error handling explained
✅ Data models defined with types
✅ Rate limiting rules specified
✅ Documentation is easy to navigate

## Output Format

Present documentation updates as:

```markdown
## API Documentation Generated

### New Endpoints Documented
- [List new endpoints]

### Updated Endpoints
- [List changed endpoints]

### Files Created/Updated
- docs/api/README.md
- docs/api/openapi.yaml
- [etc.]

### Summary
[Brief summary of changes]

Documentation is available at: `docs/api/`
Interactive docs: http://localhost:8000/docs (FastAPI)
```
