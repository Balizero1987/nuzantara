# CLAUDE.md - AI Assistant Guide for NUZANTARA

> **Purpose**: This document provides comprehensive guidance for AI assistants (Claude, GitHub Copilot, etc.) working on the NUZANTARA codebase. It explains the project structure, development workflows, architectural patterns, and conventions to follow.

**Version**: 5.2.0
**Last Updated**: November 17, 2025
**Repository**: https://github.com/Balizero1987/nuzantara

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start for AI Assistants](#quick-start-for-ai-assistants)
3. [Repository Structure](#repository-structure)
4. [Technology Stack](#technology-stack)
5. [Development Workflows](#development-workflows)
6. [Architecture Patterns](#architecture-patterns)
7. [Code Conventions](#code-conventions)
8. [Testing Strategy](#testing-strategy)
9. [Common Tasks](#common-tasks)
10. [Security Guidelines](#security-guidelines)
11. [Performance Best Practices](#performance-best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

**NUZANTARA** is a production-ready AI platform powered by ZANTARA - Bali Zero's intelligent business assistant. It's designed to help Indonesian businesses with:

- Business advisory and consulting
- Document management (Google Workspace integration)
- Client relationship management (CRM)
- Multi-lingual support (20+ languages, specialized in Indonesian/Sundanese)
- Real-time communication (WhatsApp, Instagram, email)
- Cultural intelligence for Indonesian business context

### Key Capabilities

- **Advanced RAG (Retrieval-Augmented Generation)**: 8,122+ embedded documents across 14 specialized collections
- **Multi-AI Architecture**: Llama 4 Scout (primary, 92% cheaper), Claude Haiku 4.5 (fallback)
- **Microservices Architecture**: Independent, scalable services
- **Full Observability**: Prometheus + Grafana + Alertmanager stack
- **Production-Ready**: Deployed on Fly.io with comprehensive CI/CD

---

## Quick Start for AI Assistants

### Understanding the Codebase

When you start working on this codebase, **always**:

1. **Read this file first** to understand the structure and conventions
2. **Check `/docs/` directory** for detailed architecture documentation
3. **Review recent commits** to understand ongoing work
4. **Run health checks** before making changes: `make health-check`
5. **Follow the established patterns** - consistency is critical

### Making Changes

**Before modifying code:**

1. ✅ Understand which service you're working in (TypeScript backend, RAG backend, or frontend)
2. ✅ Check if handlers/routes already exist for similar functionality
3. ✅ Follow the auto-registration pattern (see [Architecture Patterns](#architecture-patterns))
4. ✅ Write tests for new functionality
5. ✅ Run linting and type checks: `npm run lint && npm run typecheck`

**After making changes:**

1. ✅ Run tests: `npm test`
2. ✅ Check build succeeds: `npm run build`
3. ✅ Verify local health: `make health-check`
4. ✅ Update documentation if needed
5. ✅ Create meaningful commit messages (Conventional Commits format)

---

## Repository Structure

### Monorepo Layout

```
nuzantara/
├── apps/                          # Application modules (microservices)
│   ├── backend-ts/                # TypeScript backend (Node.js/Express)
│   │   ├── src/
│   │   │   ├── server.ts          # Main entry (24,674 lines)
│   │   │   ├── handlers/          # 136+ API handlers (auto-registered)
│   │   │   ├── middleware/        # 25 middleware components
│   │   │   ├── services/          # 50+ services
│   │   │   ├── routes/            # Route definitions
│   │   │   ├── config/            # Environment config with Zod
│   │   │   └── core/              # Core utilities
│   │   ├── tests/                 # 60+ test files
│   │   └── package.json           # Independent package
│   │
│   ├── backend-rag/               # Python RAG backend (FastAPI)
│   │   ├── backend/
│   │   │   ├── app/
│   │   │   │   ├── main_cloud.py  # Main entry (211,960 lines)
│   │   │   │   ├── routers/       # API routers
│   │   │   │   └── config.py      # Configuration
│   │   │   ├── services/          # 50+ RAG services
│   │   │   ├── llm/               # LLM integrations
│   │   │   ├── db/                # Database layer
│   │   │   └── tests/             # Python tests
│   │   ├── requirements.txt       # Python dependencies
│   │   └── Dockerfile.fly         # Production container
│   │
│   ├── webapp/                    # Frontend PWA (Vanilla JS)
│   │   ├── index.html             # Entry point
│   │   ├── login.html             # Authentication (8,839 lines)
│   │   ├── chat.html              # Main interface (44,607 lines)
│   │   ├── js/
│   │   │   ├── app.js             # Main app (26,777 lines)
│   │   │   ├── sse-client.js      # Server-Sent Events (10,111 lines)
│   │   │   └── zantara-client.js  # API client (19,286 lines)
│   │   ├── css/                   # Design system
│   │   ├── assets/                # Images, i18n (20+ languages)
│   │   └── manifest.json          # PWA manifest
│   │
│   └── [other services]/          # Additional microservices
│
├── docs/                          # 20+ documentation files
│   ├── ARCHITECTURE.md            # System architecture
│   ├── API_DOCUMENTATION.md       # API reference
│   ├── DATABASE_SCHEMA.md         # Database design
│   ├── DEPLOYMENT_GUIDE.md        # Deployment instructions
│   └── DEVELOPMENT_GUIDE.md       # Development setup
│
├── shared/                        # Shared configuration
│   └── config/                    # TypeScript config, categories
│
├── monitoring/                    # Observability stack
│   ├── prometheus/                # Metrics collection
│   ├── grafana/                   # Visualization
│   └── alertmanager/              # Alerts
│
├── .github/
│   ├── workflows/                 # 8 CI/CD pipelines
│   └── copilot-instructions.md    # Code review guidelines
│
├── config/
│   └── Makefile                   # Command center (see `make help`)
│
├── package.json                   # Monorepo workspace config
├── tsconfig.json                  # TypeScript root config
├── docker-compose.yml             # Local dev stack
├── fly.toml                       # Production deployment
└── .pre-commit-config.yaml        # 10+ pre-commit hooks
```

### Key Entry Points

| Service | Entry Point | Port | Command |
|---------|-------------|------|---------|
| **TypeScript Backend** | `apps/backend-ts/src/server.ts` | 8080 | `make dev` |
| **RAG Backend** | `apps/backend-rag/backend/app/main_cloud.py` | 8000 | `make dev-rag` |
| **Frontend** | `apps/webapp/index.html` | 3000 | `cd apps/webapp && python -m http.server 3000` |

---

## Technology Stack

### Backend - TypeScript (Node.js/Express)

**Runtime & Framework:**
- Node.js 20.x
- Express.js 5.1.0
- TypeScript 5.8.3 (ES2020 target, CommonJS modules)

**Key Dependencies:**
```json
{
  "AI/LLM": {
    "@anthropic-ai/sdk": "0.62.0",
    "openai": "5.20.2",
    "@google/generative-ai": "0.24.1"
  },
  "Database": {
    "pg": "PostgreSQL client",
    "chromadb": "1.10.5",
    "redis": "5.8.2"
  },
  "Authentication": {
    "jsonwebtoken": "9.0.2",
    "bcryptjs": "3.0.2",
    "firebase-admin": "13.5.0"
  },
  "Real-time": {
    "ws": "8.18.3",
    "socket.io": "4.8.1"
  },
  "Validation": "zod 3.25.76",
  "Monitoring": "prom-client 15.1.0",
  "Logging": "winston 3.18.3"
}
```

### Backend - Python (FastAPI)

**Runtime & Framework:**
- Python 3.11+
- FastAPI
- Uvicorn (ASGI server)

**Key Dependencies:**
- ChromaDB (vector database)
- PostgreSQL (via psycopg2)
- Redis (caching)
- OpenAI SDK (embeddings)
- Anthropic SDK (Claude)

### Frontend (Vanilla JavaScript)

**Technology Choice**: Deliberately **NO React/TypeScript** for performance
- 85% bundle size reduction (1.3MB → 192KB)
- 90% fewer files
- 40% faster load time (<1.5s)

**Stack:**
- Vanilla JavaScript (ES6+)
- HTML5 + CSS3
- Server-Sent Events (SSE) for real-time
- Progressive Web App (PWA)

### Databases

1. **PostgreSQL 15**: Relational data (CRM, users, sessions)
2. **ChromaDB**: Vector embeddings (8,122+ chunks, 14 collections)
3. **Redis 7**: Caching, rate limiting, session storage

### AI Models

**Primary**: Llama 4 Scout (via OpenRouter)
- Cost: $0.20/$0.20 per 1M tokens (92% cheaper than Claude Haiku)
- Fast response times
- High quality

**Fallback**: Claude Haiku 4.5 (Anthropic)
- Used when Llama fails or for specific tasks
- Intelligent routing via `IntelligentRouter`

**Additional Models**: DeepSeek V3.1, GPT-4, Gemini Pro, Qwen3, MiniMax

**Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)

---

## Development Workflows

### Local Development Setup

**1. Install dependencies:**
```bash
npm install
```

**2. Configure environment:**
Create `.env` file with required variables (see `.env.example`)

**3. Start services:**

```bash
# Option A: Full stack with Docker Compose
docker-compose up -d

# Option B: Individual services
make dev          # TypeScript backend (port 8080)
make dev-rag      # RAG backend (port 8000)
cd apps/webapp && python -m http.server 3000  # Frontend
```

**4. Verify health:**
```bash
make health-check          # Local backend
make health-prod           # Production services
```

### Development Commands (Makefile)

The `config/Makefile` is your command center. Run `make help` to see all commands.

**Most used commands:**

| Command | Description |
|---------|-------------|
| `make dev` | Start TypeScript backend with hot reload |
| `make dev-rag` | Start Python RAG backend |
| `make test` | Run all tests |
| `make test-watch` | Run tests in watch mode |
| `make build` | Compile TypeScript |
| `make deploy-backend` | Deploy to Fly.io (TypeScript) |
| `make deploy-rag` | Deploy to Fly.io (RAG) |
| `make logs` | Tail backend logs |
| `make health-prod` | Check production health |
| `make rollback` | Emergency rollback |

### NPM Scripts (package.json)

**Development:**
```bash
npm run dev              # Start with tsx watch
npm run typecheck        # TypeScript type checking
npm run lint             # ESLint with auto-fix
npm run format           # Prettier formatting
```

**Testing:**
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
npm run test:handlers    # Test handlers only
```

**Build & Deploy:**
```bash
npm run build            # Compile TypeScript
npm run build:fast       # Fast build (tsc only)
```

**Documentation:**
```bash
npm run docs:generate    # Generate handler docs
npm run docs:handlers    # Extract handler documentation
```

**AI Coordination** (for multi-agent workflows):
```bash
npm run ai:enter         # Enter coordination window
npm run ai:exit          # Exit coordination window
npm run ai:sync          # Sync coordination state
npm run ai:check-lock    # Check lock status
```

### Git Workflow

**Branch Naming:**
```bash
feature/handler-name      # New features
fix/issue-description     # Bug fixes
refactor/component-name   # Refactoring
docs/documentation-update # Documentation
test/test-description     # Test additions
```

**Commit Messages** (Conventional Commits enforced):
```bash
feat: add KBLI handler with complete data
fix: resolve CORS issue in RAG backend
refactor: migrate to handler registry pattern
docs: update architecture documentation
test: add unit tests for pricing service
chore: update dependencies
perf: optimize database queries
ci: update GitHub Actions workflow
```

**Pre-commit Hooks** (automatic):
- ESLint + Prettier (via lint-staged)
- TypeScript type checking
- Secret detection
- YAML/JSON validation
- Large file check (max 1000KB)

### CI/CD Pipelines

**GitHub Actions** (`.github/workflows/`):

1. **ci.yml**: Continuous Integration (on every push)
   - Install dependencies
   - Lint code
   - Type check
   - Run tests

2. **deploy-pages.yml**: Deploy frontend to GitHub Pages
   - Trigger: Push to `main` with `apps/webapp/**` changes
   - Deploys to: https://balizero1987.github.io/nuzantara

3. **deploy-production.yml**: Full stack deployment
   - Health checks
   - Automatic rollback on failure

4. **copilot-review.yml**: AI code review
   - Automated PR reviews
   - Security and quality checks

5. **rollback.yml**: Emergency rollback
   - Quick revert to previous version

---

## Architecture Patterns

### 1. Handler Registry Pattern (TypeScript Backend)

**Auto-registration system** - Handlers register themselves without manual router updates.

**Location**: `apps/backend-ts/src/handlers/`

**How it works:**
```typescript
// 1. Handler function (in any file in handlers/)
export async function exampleHandler(params: any, req?: any) {
  // Validation
  if (!params.requiredField) {
    return err('missing_params: requiredField is required');
  }

  // Business logic
  const result = await doSomething(params);

  // Response
  return ok(result);
}

// 2. Auto-registration happens via globalRegistry
// The function name becomes the handler key: "example-handler"
// Or explicitly register with custom name:
// globalRegistry.register('custom.name', exampleHandler);

// 3. Call from frontend:
// POST /call
// { "key": "example-handler", "params": { ... } }
```

**Best Practices:**
- ✅ Use descriptive function names (they become handler keys)
- ✅ Always validate params first
- ✅ Use `ok()` for success, `err()` for errors
- ✅ Add JSDoc comments
- ✅ Write unit tests in `__tests__/` directory
- ❌ Don't manually add to router.ts
- ❌ Don't skip parameter validation

**Example Handler Structure:**
```typescript
/**
 * Send email via Gmail API
 * @param params - Email parameters
 * @param req - Optional Express request object
 */
export async function sendEmail(params: any, req?: any) {
  // 1. Validation
  if (!params.to || !params.subject || !params.body) {
    return err('missing_params: to, subject, and body are required');
  }

  // 2. Authentication (if needed)
  const userId = req?.user?.id;
  if (!userId) {
    return err('unauthorized: user not authenticated');
  }

  // 3. Business Logic
  try {
    const result = await gmailService.send({
      to: params.to,
      subject: params.subject,
      body: params.body,
      from: params.from
    });

    // 4. Success Response
    return ok({
      messageId: result.id,
      status: 'sent',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // 5. Error Handling
    logger.error('Email send failed', { error, params });
    return err(`email_send_failed: ${error.message}`);
  }
}
```

### 2. Service Registry Pattern (v3 Omega)

**Service discovery and load balancing** for distributed services.

**Location**: `apps/backend-ts/src/services/architecture/service-registry.ts`

```typescript
import { serviceRegistry } from './services/architecture/service-registry.js';

// Register service
serviceRegistry.register({
  id: 'service-1',
  name: 'unified',
  version: '1.0.0',
  host: 'localhost',
  port: 8080,
  health: 'healthy',
  metadata: { weight: 10 }
});

// Get service with load balancing
const service = await serviceRegistry.getService('unified');

// Health check
const isHealthy = await serviceRegistry.checkHealth('service-1');
```

### 3. Middleware Chain Pattern

**Express middleware stack** for request processing.

**Location**: `apps/backend-ts/src/server.ts`

**Order matters!** The middleware stack is executed in this order:

```typescript
// 1. CORS (must be first)
app.use(corsMiddleware);

// 2. Security headers
app.use(applySecurity);

// 3. Rate limiting
app.use(globalRateLimiter);

// 4. Metrics collection
app.use(metricsMiddleware);

// 5. Performance monitoring
app.use(performanceMiddleware);

// 6. Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 7. Authentication (optional per route)
// app.use(authMiddleware);  // Applied selectively

// 8. Routes
app.use(attachRoutes);

// 9. Error handler (must be last)
app.use(errorHandler);
```

**Adding new middleware:**
1. Create in `apps/backend-ts/src/middleware/`
2. Import in `server.ts`
3. Add to stack in correct order
4. Write tests in `middleware/__tests__/`

### 4. Circuit Breaker Pattern

**Resilience for external service calls** - prevents cascading failures.

**Location**: `apps/backend-ts/src/services/architecture/circuit-breaker.ts`

```typescript
import { circuitBreaker } from './services/architecture/circuit-breaker.js';

// Wrap external API calls
const result = await circuitBreaker.execute(
  'external-api-name',
  () => fetch('https://api.example.com/data'),
  {
    timeout: 5000,
    errorThreshold: 50,  // Open after 50% failures
    volumeThreshold: 10, // Min requests before calculating
    resetTimeout: 30000  // Try again after 30s
  }
);
```

**States:**
- **CLOSED**: Normal operation
- **OPEN**: Failing fast (service down)
- **HALF_OPEN**: Testing if service recovered

### 5. Intelligent Routing Pattern (RAG Backend)

**Primary + Fallback AI routing** for cost optimization and reliability.

**Location**: `apps/backend-rag/backend/services/intelligent_router.py`

```python
from services.intelligent_router import IntelligentRouter

# Initialize with primary and fallback clients
intelligent_router = IntelligentRouter(
    primary_client=llama_client,      # Llama 4 Scout (cheap, fast)
    fallback_client=claude_client     # Claude Haiku (reliable)
)

# Route query with automatic fallback
response = await intelligent_router.route(
    query=user_query,
    context=rag_context,
    fallback_on_error=True
)
```

**Routing Logic:**
1. Try Llama 4 Scout (92% cheaper)
2. If fails → Claude Haiku 4.5
3. Track success rates
4. Adjust routing based on performance

### 6. Repository Pattern (Database)

**Data access abstraction** - separates business logic from data access.

**Example:**
```typescript
// Define interface
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: CreateUserDto): Promise<User>;
  update(id: string, data: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
}

// Implementation
class PostgresUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }
  // ... other methods
}

// Usage in handler
const userRepo = new PostgresUserRepository();
const user = await userRepo.findById(params.userId);
```

### 7. Observer Pattern (Frontend)

**Event-driven UI updates** for reactive interfaces.

```javascript
// Event emitter
class EventBus {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }
}

// Usage
const eventBus = new EventBus();

// Subscribe
eventBus.on('message:received', (message) => {
  updateUI(message);
});

// Publish
eventBus.emit('message:received', { text: 'Hello!', from: 'AI' });
```

---

## Code Conventions

### File and Directory Naming

**Files:**
- `kebab-case` for files: `service-name.ts`, `handler-proxy.ts`
- `PascalCase` for React components (if used): `UserProfile.tsx`
- Test files: `*.test.ts`, `*.spec.ts`
- Config files: `index.ts` for directory exports
- Private files: `_private-helper.ts` (underscore prefix)

**Directories:**
- `kebab-case`: `google-workspace/`, `ai-services/`
- Plural for collections: `handlers/`, `services/`, `routes/`
- Singular for single item: `config/`, `middleware/`

### Variable and Function Naming

```typescript
// camelCase for variables and functions
const userName = 'John';
const userEmail = 'john@example.com';

async function getUserData(userId: string) {
  return await database.findUser(userId);
}

// PascalCase for classes, interfaces, types
class ServiceRegistry {}
interface UserProfile {}
type ResponseData = {
  status: string;
  data: any;
};

// SCREAMING_SNAKE_CASE for constants
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_TIMEOUT_MS = 5000;

// Prefix booleans with is/has/should
const isAuthenticated = true;
const hasPermission = false;
const shouldRetry = true;

// Handler naming: verbNoun or noun.verb
async function sendEmail() {}       // Good
async function getUserProfile() {}  // Good
async function kbliLookup() {}      // Good

// Registration names
'gmail.send'
'user.get.profile'
'kbli.lookup'
```

### Code Formatting (Prettier + ESLint)

**Prettier config** (`.prettierrc.json`):
```json
{
  "semi": true,           // Semicolons required
  "singleQuote": true,    // Single quotes for strings
  "printWidth": 100,      // Max line length
  "tabWidth": 2,          // 2-space indentation
  "arrowParens": "always" // Parens around arrow function params
}
```

**Examples:**
```typescript
// ✅ Good
const result = await service.doSomething({ param: 'value' });

const handler = (params: any) => {
  return ok(result);
};

import { logger } from '../services/logger.js'; // .js extension for ESM

// ❌ Bad
const result = await service.doSomething({param: "value"})  // No semicolon, double quotes

const handler = params => {  // Missing parens
  return ok(result)  // No semicolon
}

import { logger } from '../services/logger'  // Missing .js extension
```

### TypeScript Conventions

**Type Safety:**
```typescript
// ✅ Use explicit types for parameters and return values
async function getUser(userId: string): Promise<User | null> {
  // Implementation
}

// ✅ Use interfaces for object shapes
interface EmailParams {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

// ✅ Use type for unions and complex types
type ResponseStatus = 'success' | 'error' | 'pending';

// ❌ Avoid 'any' unless absolutely necessary
function process(data: any) { } // Bad - too permissive

// ✅ Use 'unknown' for truly unknown types
function process(data: unknown) {
  if (typeof data === 'string') {
    // Type guard narrows type
    console.log(data.toUpperCase());
  }
}
```

**Import/Export:**
```typescript
// ✅ Named exports (preferred)
export async function sendEmail() {}
export const MAX_RETRIES = 3;

// ✅ Default export for main module
export default class UserService {}

// ✅ Re-exports for index files
export * from './user.js';
export * from './auth.js';

// ✅ ESM imports with .js extension
import { logger } from '../services/logger.js';
import type { User } from '../types/user.js'; // Type-only import
```

### Response Conventions

**Success Response:**
```typescript
import { ok } from '../utils/response.js';

return ok({
  data: result,
  metadata: {
    timestamp: Date.now(),
    version: '1.0.0'
  }
});

// Response format:
// {
//   status: 'success',
//   data: { ... },
//   metadata: { timestamp: ..., version: ... }
// }
```

**Error Response:**
```typescript
import { err } from '../utils/response.js';

// Simple error
return err('missing_params: email is required');

// Detailed error
return err({
  code: 'VALIDATION_ERROR',
  message: 'Invalid email format',
  field: 'email'
});

// Response format:
// {
//   status: 'error',
//   error: 'missing_params: email is required'
// }
```

### API Conventions

**RESTful Routes:**
```typescript
GET    /api/users           // List users (with pagination)
GET    /api/users/:id       // Get single user
POST   /api/users           // Create user
PUT    /api/users/:id       // Update user (full)
PATCH  /api/users/:id       // Update user (partial)
DELETE /api/users/:id       // Delete user
```

**Handler-Based Routes (Zantara Pattern):**
```typescript
POST /call
Body: {
  "key": "gmail.send",
  "params": {
    "to": "user@example.com",
    "subject": "Hello",
    "body": "Message content"
  }
}

Response: {
  "status": "success",
  "data": {
    "messageId": "msg_123",
    "status": "sent"
  }
}
```

### Environment Variables

**Naming Convention:**
```bash
# Service-specific prefix
API_KEYS_INTERNAL=key1,key2
API_KEYS_EXTERNAL=key3,key4
RAG_BACKEND_URL=https://nuzantara-rag.fly.dev

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://localhost:6379
CHROMA_HOST=localhost
CHROMA_PORT=8000

# Third-party services
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
GOOGLE_OAUTH_CLIENT_ID=...

# Configuration
PORT=8080
NODE_ENV=development
LOG_LEVEL=info

# Cron
ENABLE_CRON=true
CRON_TIMEZONE=Asia/Singapore
```

**Validation** (using Zod in `apps/backend-ts/src/config/index.ts`):
```typescript
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('8080'),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  ANTHROPIC_API_KEY: z.string().min(1),
  DATABASE_URL: z.string().url()
});

export const config = envSchema.parse(process.env);
```

### Documentation (JSDoc/TSDoc)

**Function Documentation:**
```typescript
/**
 * Send email via Gmail API
 *
 * @param params - Email parameters
 * @param params.to - Recipient email address
 * @param params.subject - Email subject line
 * @param params.body - Email body content (HTML or plain text)
 * @param params.from - Optional sender email (defaults to authenticated user)
 * @param req - Express request object (for authentication)
 * @returns Promise resolving to email send status
 *
 * @example
 * ```typescript
 * const result = await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome!',
 *   body: '<h1>Hello</h1><p>Welcome to ZANTARA</p>'
 * }, req);
 *
 * if (result.status === 'success') {
 *   console.log('Email sent:', result.data.messageId);
 * }
 * ```
 *
 * @throws {Error} If Gmail API is unavailable
 */
export async function sendEmail(
  params: EmailParams,
  req?: Request
): Promise<Response> {
  // Implementation
}
```

**Type Documentation:**
```typescript
/**
 * Represents a user in the system
 */
interface User {
  /** Unique user identifier */
  id: string;

  /** User's email address (must be unique) */
  email: string;

  /** User's full name */
  fullName: string;

  /** User's role (determines permissions) */
  role: 'admin' | 'user' | 'guest';

  /** Account creation timestamp */
  createdAt: Date;
}
```

---

## Testing Strategy

### Test Structure

**Location**: Tests live alongside source code in `__tests__/` directories

```
handlers/
├── gmail/
│   ├── send.ts
│   └── __tests__/
│       └── send.test.ts
├── auth/
│   ├── login.ts
│   └── __tests__/
│       └── login.test.ts
```

### Unit Tests (Jest)

**Configuration**: `apps/backend-ts/jest.config.js`

**Coverage Thresholds:**
- Statements: 50%
- Branches: 40%
- Functions: 50%
- Lines: 50%

**Test Pattern:**
```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { sendEmail } from '../send';

describe('sendEmail', () => {
  beforeEach(() => {
    // Setup (mocks, database state, etc.)
  });

  afterEach(() => {
    // Cleanup
  });

  describe('with valid parameters', () => {
    it('should send email successfully', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Hello'
      });

      expect(result.status).toBe('success');
      expect(result.data).toHaveProperty('messageId');
    });

    it('should return messageId in response', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Hello'
      });

      expect(result.data.messageId).toMatch(/^msg_/);
    });
  });

  describe('with invalid parameters', () => {
    it('should return error for missing recipient', async () => {
      const result = await sendEmail({
        subject: 'Test',
        body: 'Hello'
      });

      expect(result.status).toBe('error');
      expect(result.error).toContain('missing_params');
    });

    it('should return error for invalid email', async () => {
      const result = await sendEmail({
        to: 'not-an-email',
        subject: 'Test',
        body: 'Hello'
      });

      expect(result.status).toBe('error');
      expect(result.error).toContain('invalid_email');
    });
  });

  describe('error handling', () => {
    it('should handle Gmail API errors', async () => {
      // Mock Gmail API to throw error
      jest.spyOn(gmailService, 'send').mockRejectedValue(new Error('API Error'));

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Hello'
      });

      expect(result.status).toBe('error');
      expect(result.error).toContain('email_send_failed');
    });
  });
});
```

### Integration Tests

**Test full request/response cycle:**
```typescript
import supertest from 'supertest';
import { app } from '../server';

describe('POST /call', () => {
  it('should send email via handler', async () => {
    const response = await supertest(app)
      .post('/call')
      .send({
        key: 'gmail.send',
        params: {
          to: 'test@example.com',
          subject: 'Test',
          body: 'Hello'
        }
      })
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(response.body.status).toBe('success');
  });
});
```

### E2E Tests (Playwright)

**Frontend tests** in `apps/webapp/`:

```javascript
const { test, expect } = require('@playwright/test');

test('user can login and send message', async ({ page }) => {
  // Navigate to login
  await page.goto('http://localhost:3000/login');

  // Fill login form
  await page.fill('#email', 'test@example.com');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');

  // Wait for redirect to chat
  await expect(page).toHaveURL(/chat/);

  // Send message
  await page.fill('#message-input', 'Hello ZANTARA');
  await page.click('#send-button');

  // Verify message appears
  await expect(page.locator('.message')).toContainText('Hello ZANTARA');
});
```

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- handlers/gmail/__tests__/send.test.ts

# Handlers only
npm run test:handlers

# Integration tests
npm run test:integration

# E2E tests (Playwright)
cd apps/webapp && npm test
```

### Mocking Best Practices

**External APIs:**
```typescript
import { jest } from '@jest/globals';

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mocked response' } }]
        })
      }
    }
  }))
}));

// Mock database
jest.mock('../db/pool', () => ({
  query: jest.fn().mockResolvedValue({ rows: [] })
}));
```

**Redis:**
```typescript
jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1)
  })
}));
```

---

## Common Tasks

### Adding a New Handler

**1. Create handler file:**
```bash
# In apps/backend-ts/src/handlers/your-category/
touch apps/backend-ts/src/handlers/my-category/my-handler.ts
```

**2. Implement handler:**
```typescript
import { ok, err } from '../../utils/response.js';
import { logger } from '../../services/logger.js';

/**
 * Description of what this handler does
 * @param params - Handler parameters
 * @param req - Express request object
 */
export async function myHandler(params: any, req?: any) {
  // 1. Validation
  if (!params.requiredField) {
    return err('missing_params: requiredField is required');
  }

  // 2. Business logic
  try {
    const result = await doSomething(params);
    return ok(result);
  } catch (error) {
    logger.error('Handler failed', { error, params });
    return err(`handler_failed: ${error.message}`);
  }
}
```

**3. Create test:**
```bash
mkdir -p apps/backend-ts/src/handlers/my-category/__tests__
touch apps/backend-ts/src/handlers/my-category/__tests__/my-handler.test.ts
```

```typescript
import { describe, it, expect } from '@jest/globals';
import { myHandler } from '../my-handler';

describe('myHandler', () => {
  it('should return success with valid params', async () => {
    const result = await myHandler({ requiredField: 'value' });
    expect(result.status).toBe('success');
  });

  it('should return error with missing params', async () => {
    const result = await myHandler({});
    expect(result.status).toBe('error');
    expect(result.error).toContain('missing_params');
  });
});
```

**4. Test locally:**
```bash
# Run tests
npm test -- handlers/my-category/__tests__/my-handler.test.ts

# Start server
make dev

# Test endpoint
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -d '{"key": "my-handler", "params": {"requiredField": "test"}}'
```

**That's it!** The handler auto-registers via the handler registry.

### Adding a New Service

**1. Create service file:**
```bash
touch apps/backend-ts/src/services/my-service.ts
```

**2. Implement service:**
```typescript
import { logger } from './logger.js';

export class MyService {
  private config: any;

  constructor(config: any = {}) {
    this.config = config;
    logger.info('MyService initialized', { config });
  }

  async doSomething(params: any): Promise<any> {
    // Implementation
  }
}

// Export singleton instance
export const myService = new MyService();
```

**3. Use in handler:**
```typescript
import { myService } from '../../services/my-service.js';

export async function myHandler(params: any) {
  const result = await myService.doSomething(params);
  return ok(result);
}
```

### Adding a New Middleware

**1. Create middleware file:**
```bash
touch apps/backend-ts/src/middleware/my-middleware.ts
```

**2. Implement middleware:**
```typescript
import type { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.js';

export function myMiddleware(req: Request, res: Response, next: NextFunction) {
  // Pre-processing
  logger.debug('myMiddleware processing request', {
    method: req.method,
    path: req.path
  });

  // Modify request/response if needed
  req.customData = { timestamp: Date.now() };

  // Continue to next middleware
  next();
}

// Or async middleware
export async function myAsyncMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Async operations
    const data = await fetchSomething();
    req.customData = data;
    next();
  } catch (error) {
    next(error); // Pass error to error handler
  }
}
```

**3. Add to server:**
```typescript
// In apps/backend-ts/src/server.ts
import { myMiddleware } from './middleware/my-middleware.js';

// Add to middleware stack (order matters!)
app.use(myMiddleware);
```

### Adding a New Route

**1. Create route file:**
```bash
touch apps/backend-ts/src/routes/my-routes.ts
```

**2. Define routes:**
```typescript
import { Router } from 'express';
import type { Request, Response } from 'express';
import { myHandler } from '../handlers/my-category/my-handler.js';

export const myRouter = Router();

myRouter.get('/my-endpoint', async (req: Request, res: Response) => {
  try {
    const result = await myHandler(req.query, req);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

myRouter.post('/my-endpoint', async (req: Request, res: Response) => {
  try {
    const result = await myHandler(req.body, req);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**3. Register in server:**
```typescript
// In apps/backend-ts/src/server.ts
import { myRouter } from './routes/my-routes.js';

app.use('/api', myRouter);
```

### Deploying to Production

**Backend (Fly.io):**
```bash
# TypeScript backend
make deploy-backend

# RAG backend
make deploy-rag

# Both services
make deploy-full

# Verify deployment
make health-prod
```

**Frontend (GitHub Pages):**
```bash
# Automatic: Push to main branch
git add apps/webapp/
git commit -m "feat: update frontend"
git push origin main

# GitHub Actions will automatically deploy
# Wait ~40 seconds for deployment
```

**Verify deployment:**
```bash
# Check production health
make health-prod

# View logs
make logs          # TypeScript backend
make logs-rag      # RAG backend

# Monitor metrics
make metrics
```

---

## Security Guidelines

### OWASP Top 10 Prevention

**1. SQL Injection:**
```typescript
// ✅ Good - Use parameterized queries
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ Bad - String concatenation
const result = await pool.query(
  `SELECT * FROM users WHERE email = '${email}'` // Vulnerable!
);
```

**2. XSS (Cross-Site Scripting):**
```typescript
// ✅ Good - Sanitize user input
import sanitizeHtml from 'sanitize-html';

const cleanHtml = sanitizeHtml(userInput, {
  allowedTags: ['b', 'i', 'em', 'strong'],
  allowedAttributes: {}
});

// Frontend - Use textContent, not innerHTML
element.textContent = userInput; // Safe
element.innerHTML = userInput;   // Dangerous!
```

**3. Authentication:**
```typescript
// ✅ Use JWT with short expiration
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET!,
  { expiresIn: '1h' } // Short-lived tokens
);

// ✅ Hash passwords with bcrypt
import bcrypt from 'bcryptjs';

const hashedPassword = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, hashedPassword);
```

**4. Rate Limiting:**
```typescript
// Already implemented in middleware/rate-limit.ts
// Customize per endpoint if needed

import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later'
});

app.post('/api/auth/login', loginLimiter, loginHandler);
```

**5. CORS Configuration:**
```typescript
// ✅ Specific origins in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://zantara.balizero.com']
    : ['http://localhost:3000'],
  credentials: true
};

app.use(cors(corsOptions));

// ❌ Avoid wildcard in production
app.use(cors({ origin: '*' })); // Only for development!
```

### API Key Management

**Never commit secrets:**
```typescript
// ✅ Use environment variables
const apiKey = process.env.ANTHROPIC_API_KEY;

// ✅ Validate at startup
if (!apiKey) {
  throw new Error('ANTHROPIC_API_KEY is required');
}

// ❌ Never hardcode
const apiKey = 'sk-ant-123456'; // NEVER DO THIS!
```

**Secret detection** is enforced via pre-commit hooks:
- `.secrets.baseline` - Baseline of known secrets
- `detect-secrets` - Scans for new secrets

### Input Validation

**Always validate user input:**
```typescript
import { z } from 'zod';

// Define schema
const emailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
  from: z.string().email().optional()
});

// Validate
export async function sendEmail(params: any) {
  try {
    const validated = emailSchema.parse(params);
    // Use validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(`validation_error: ${error.errors[0].message}`);
    }
  }
}
```

### HTTPS Enforcement

**Production only serves HTTPS:**
- Fly.io provides automatic HTTPS
- GitHub Pages uses HTTPS by default
- Redirect HTTP to HTTPS in middleware

---

## Performance Best Practices

### Database Optimization

**1. Connection Pooling:**
```typescript
// Already configured in services/connection-pool.ts
import { pool } from '../services/connection-pool.js';

// ✅ Use pooled connections
const result = await pool.query('SELECT * FROM users');

// ❌ Don't create new connections
const client = new pg.Client(); // Avoid!
```

**2. Avoid N+1 Queries:**
```typescript
// ❌ Bad - N+1 queries
const users = await pool.query('SELECT * FROM users');
for (const user of users.rows) {
  const posts = await pool.query('SELECT * FROM posts WHERE user_id = $1', [user.id]);
}

// ✅ Good - Single query with JOIN
const result = await pool.query(`
  SELECT u.*, p.*
  FROM users u
  LEFT JOIN posts p ON p.user_id = u.id
`);
```

**3. Indexing:**
```sql
-- Create indexes for foreign keys and frequently queried columns
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_users_email ON users(email);
```

**4. Pagination:**
```typescript
// ✅ Always paginate large result sets
async function getUsers(page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const result = await pool.query(
    'SELECT * FROM users LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  return {
    users: result.rows,
    page,
    limit,
    total: await getUserCount()
  };
}
```

### Caching Strategy

**1. Redis Caching:**
```typescript
import { redisClient } from '../services/redis.js';

async function getCachedData(key: string) {
  // Try cache first
  const cached = await redisClient.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch from database
  const data = await database.fetch();

  // Cache for 5 minutes
  await redisClient.set(key, JSON.stringify(data), 'EX', 300);

  return data;
}
```

**2. Semantic Caching (RAG):**
```python
# Already implemented in backend-rag/backend/services/semantic_cache.py
# Automatically caches RAG queries with similarity threshold 0.95
```

**3. Cache Invalidation:**
```typescript
async function updateUser(userId: string, data: any) {
  // Update database
  await database.updateUser(userId, data);

  // Invalidate cache
  await redisClient.del(`user:${userId}`);
  await redisClient.del(`users:list`);
}
```

### Frontend Performance

**1. Lazy Loading:**
```javascript
// ✅ Lazy load heavy components
const loadDashboard = () => import('./dashboard.js');

document.getElementById('dashboard-button').addEventListener('click', async () => {
  const { Dashboard } = await loadDashboard();
  new Dashboard().render();
});
```

**2. Debouncing:**
```javascript
// ✅ Debounce search inputs
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const searchInput = document.getElementById('search');
searchInput.addEventListener('input', debounce(async (e) => {
  const results = await search(e.target.value);
  displayResults(results);
}, 300));
```

**3. Virtual Scrolling:**
```javascript
// For large lists, only render visible items
// See apps/webapp/js/virtual-scroll.js for implementation
```

### API Optimization

**1. Response Compression:**
```typescript
import compression from 'compression';

app.use(compression()); // Gzip responses
```

**2. Field Selection:**
```typescript
// ✅ Allow clients to select fields
async function getUser(userId: string, fields: string[] = []) {
  const selectedFields = fields.length > 0
    ? fields.join(', ')
    : '*';

  const result = await pool.query(
    `SELECT ${selectedFields} FROM users WHERE id = $1`,
    [userId]
  );

  return result.rows[0];
}

// Usage: /api/users/123?fields=id,name,email
```

**3. Batch Requests:**
```typescript
// ✅ Support batch operations
async function batchGetUsers(userIds: string[]) {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = ANY($1)',
    [userIds]
  );

  return result.rows;
}
```

---

## Troubleshooting

### Common Issues

**1. "Server not running on port 8080"**

```bash
# Check if server is running
lsof -i :8080

# Start server
make dev

# Check logs
make logs
```

**2. "Database connection failed"**

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Start database
docker-compose up -d postgres

# Test connection
psql $DATABASE_URL
```

**3. "Redis connection error"**

```bash
# Check Redis is running
docker ps | grep redis

# Start Redis
docker-compose up -d redis

# Test connection
redis-cli ping
```

**4. "ChromaDB not found"**

```bash
# Check ChromaDB is running
curl http://localhost:8000/api/v1/heartbeat

# Start ChromaDB
docker-compose up -d chromadb
```

**5. "TypeScript errors"**

```bash
# Run type check
npm run typecheck

# Fix common issues
npm run lint:fix
npm run format
```

**6. "Tests failing"**

```bash
# Run tests with verbose output
npm test -- --verbose

# Clear Jest cache
npx jest --clearCache

# Run specific test
npm test -- path/to/test.test.ts
```

**7. "Deployment failed"**

```bash
# Check production health
make health-prod

# View deployment logs
make logs
make logs-rag

# Rollback if needed
make rollback
```

### Debug Mode

**Backend:**
```bash
# Start with debug logging
NODE_ENV=development LOG_LEVEL=debug npm run dev

# Or use debug server
npm run dev -- apps/backend-ts/src/server-debug.ts
```

**Frontend:**
```javascript
// Enable debug mode in browser console
localStorage.setItem('DEBUG', 'true');
location.reload();
```

### Health Checks

**Local:**
```bash
make health-check
```

**Production:**
```bash
make health-prod
```

**Manual checks:**
```bash
# TypeScript backend
curl https://nuzantara-backend.fly.dev/health

# RAG backend
curl https://nuzantara-rag.fly.dev/health

# Metrics
curl https://nuzantara-backend.fly.dev/metrics
```

### Monitoring

**Grafana Dashboards:**
```bash
cd monitoring
./START_MONITORING.sh

# Open Grafana
open http://localhost:3000
```

**Prometheus Metrics:**
```bash
# View metrics
curl http://localhost:9090/metrics

# Query metrics
curl 'http://localhost:9090/api/v1/query?query=up'
```

---

## Additional Resources

### Documentation

- **Architecture**: `docs/ARCHITECTURE.md`
- **API Reference**: `docs/API_DOCUMENTATION.md`
- **Database Schema**: `docs/DATABASE_SCHEMA.md`
- **Deployment Guide**: `docs/DEPLOYMENT_GUIDE.md`
- **Development Guide**: `docs/DEVELOPMENT_GUIDE.md`

### External Links

- **Repository**: https://github.com/Balizero1987/nuzantara
- **Production Frontend**: https://zantara.balizero.com
- **TypeScript Backend**: https://nuzantara-backend.fly.dev
- **RAG Backend**: https://nuzantara-rag.fly.dev

### Getting Help

1. **Check documentation** in `/docs/` directory
2. **Search issues** on GitHub
3. **Review recent commits** for context
4. **Run health checks** to diagnose issues
5. **Check logs** for error details

---

## Summary for AI Assistants

**When working on this codebase:**

### ✅ DO:
- Read this file first to understand the structure
- Follow established patterns (handler registry, service registry, etc.)
- Write tests for new code
- Use TypeScript types properly
- Validate all user input
- Run linting and type checks before committing
- Update documentation when making significant changes
- Use the Makefile commands (`make help`)
- Follow Conventional Commits format
- Check health endpoints after changes

### ❌ DON'T:
- Commit secrets or API keys
- Skip parameter validation
- Manually modify router.ts (use auto-registration)
- Use `any` type unless absolutely necessary
- Create new patterns without justification
- Deploy without running tests
- Push to main without CI passing
- Ignore ESLint/Prettier warnings
- Hard-code configuration values
- Skip writing tests

### Priority Order:
1. **Security** - Never compromise security
2. **Reliability** - Code must be robust and handle errors
3. **Performance** - Optimize database queries and API calls
4. **Maintainability** - Follow conventions, write clear code
5. **Features** - Add new functionality only after above are satisfied

---

**Last Updated**: November 17, 2025
**Version**: 5.2.0
**Maintained by**: Bali Zero Team

For questions or improvements to this documentation, please open an issue or submit a PR.
