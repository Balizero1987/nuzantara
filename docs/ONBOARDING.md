# NUZANTARA Developer Onboarding Guide

**Welcome to the NUZANTARA team!** 🎉

This guide will help you get up and running with the codebase in **under 60 minutes**.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (15 minutes)](#quick-start-15-minutes)
3. [Repository Structure](#repository-structure)
4. [Development Workflow](#development-workflow)
5. [Common Tasks](#common-tasks)
6. [Troubleshooting](#troubleshooting)
7. [Resources](#resources)

---

## Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 20+ | Backend-TS runtime |
| **Python** | 3.11+ | Backend-RAG runtime |
| **PostgreSQL** | 15+ | Database |
| **Redis** | 7+ | Cache & sessions |
| **Git** | Latest | Version control |

### Recommended Tools

| Tool | Purpose |
|------|---------|
| **VS Code** | Primary editor (with extensions below) |
| **Docker** | Local services (PostgreSQL, Redis) |
| **Postman** | API testing |
| **TablePlus** | Database management |

### VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-python.python",
    "ms-python.vscode-pylance",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Access & Credentials

You'll need access to:
- **GitHub Repository:** `Balizero1987/nuzantara`
- **Fly.io Account:** For deployment
- **API Keys:**
  - Anthropic API key (Claude)
  - OpenAI API key (GPT, Embeddings)
  - OpenRouter API key (Qwen, DeepSeek, MiniMax)
- **Database URLs:**
  - PostgreSQL connection string
  - Redis connection string

---

## Quick Start (15 minutes)

### Step 1: Clone Repository (2 min)

```bash
# Clone the repository
git clone https://github.com/Balizero1987/nuzantara.git
cd nuzantara

# Check out main branch
git checkout main
```

### Step 2: Install Dependencies (5 min)

```bash
# Install Node.js dependencies (root + workspaces)
npm install

# Navigate to backend-rag and install Python dependencies
cd apps/backend-rag
pip install -r requirements.txt
cd ../..
```

### Step 3: Configure Environment (3 min)

#### Backend-TS (.env)

```bash
# Copy example and edit
cp apps/backend-ts/.env.example apps/backend-ts/.env
```

**Edit `apps/backend-ts/.env`:**
```bash
# Server
PORT=8080
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nuzantara
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=24h

# External Services
RAG_BACKEND_URL=http://localhost:8000

# API Keys (get from team lead)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...

# Feature Flags
ENABLE_ENHANCED_REDIS_CACHE=true
ENABLE_SSE_STREAMING=true
```

#### Backend-RAG (.env)

```bash
# Copy example and edit
cp apps/backend-rag/.env.example apps/backend-rag/.env
```

**Edit `apps/backend-rag/.env`:**
```bash
# Server
PORT=8000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nuzantara
REDIS_URL=redis://localhost:6379

# ChromaDB
CHROMADB_URL=http://localhost:8001
CHROMA_DB_PATH=./data/chroma

# API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY_LLAMA=sk-or-...
OPENROUTER_API_KEY_GEMINI=sk-or-...

# Embeddings
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
```

### Step 4: Start Services (3 min)

#### Option A: Docker (Recommended)

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Start ChromaDB
docker run -p 8001:8000 -v ./chroma_data:/chroma/chroma chromadb/chroma
```

#### Option B: Local Installation

```bash
# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql@15

# Start Redis
brew services start redis

# ChromaDB will start with backend-rag
```

### Step 5: Run Database Migrations (2 min)

```bash
# PostgreSQL migrations
cd apps/backend-rag/backend/db/migrations
psql $DATABASE_URL -f 001_golden_answers_schema.sql
psql $DATABASE_URL -f 002_memory_system_schema.sql
psql $DATABASE_URL -f 003_work_sessions_schema.sql
psql $DATABASE_URL -f 005_oracle_knowledge_bases.sql
psql $DATABASE_URL -f 007_crm_system_schema.sql
cd ../../../../..
```

### Step 6: Start Development Servers (2 min)

**Terminal 1: Backend-TS**
```bash
cd apps/backend-ts
npm run dev
# Server starts at http://localhost:8080
```

**Terminal 2: Backend-RAG**
```bash
cd apps/backend-rag
uvicorn backend.app.main_cloud:app --reload --host 0.0.0.0 --port 8000
# Server starts at http://localhost:8000
```

**Terminal 3: Frontend (Optional - Static Files)**
```bash
# Simple HTTP server for development
cd apps/webapp
python -m http.server 3000
# Frontend available at http://localhost:3000
```

### Step 7: Verify Installation (1 min)

```bash
# Test Backend-TS health
curl http://localhost:8080/health

# Test Backend-RAG health
curl http://localhost:8000/health

# Expected responses: {"status": "ok", ...}
```

**✅ You're ready to develop!**

---

## Repository Structure

```
nuzantara/
├── apps/                      # Main applications (monorepo)
│   ├── backend-ts/           # TypeScript backend (Express)
│   │   ├── src/
│   │   │   ├── server.ts     # Main entry point
│   │   │   ├── handlers/     # 136+ business logic handlers
│   │   │   ├── agents/       # 5 autonomous AI agents
│   │   │   ├── services/     # Business services
│   │   │   ├── middleware/   # Security, caching, monitoring
│   │   │   └── routes/       # API routes
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── backend-rag/          # Python RAG system (FastAPI)
│   │   └── backend/
│   │       ├── app/
│   │       │   ├── main_cloud.py  # FastAPI app
│   │       │   └── routers/       # 23 API routers
│   │       ├── services/          # 58 business services
│   │       ├── llm/               # LLM clients
│   │       ├── core/              # Vector DB, embeddings
│   │       ├── db/                # Database migrations
│   │       └── requirements.txt
│   │
│   └── webapp/               # Frontend (Vanilla JavaScript)
│       ├── index.html        # Entry point
│       ├── login.html        # Login page
│       ├── chat.html         # Main chat interface
│       ├── js/               # 100+ JavaScript modules
│       ├── styles/           # CSS architecture
│       └── assets/           # Images, fonts
│
├── scripts/                  # Automation scripts (402 files)
│   ├── deploy.sh            # Main deployment
│   ├── test-webapp-e2e.sh   # E2E tests
│   └── ...
│
├── docs/                     # Documentation
│   ├── ARCHITECTURE.md      # System architecture (THIS DOC)
│   ├── ONBOARDING.md        # Developer onboarding
│   ├── API_REFERENCE.md     # API documentation
│   └── ...
│
├── DATABASE/                 # Knowledge base data
├── oracle-data/              # Oracle system data (PP28)
├── chroma_data/              # ChromaDB vector storage
├── package.json              # Root package (workspaces)
└── README.md                 # Project overview
```

### Key Directories to Know

**For Backend Development:**
- `apps/backend-ts/src/handlers/` - Add new business logic here
- `apps/backend-ts/src/agents/` - AI agent implementations
- `apps/backend-rag/backend/services/` - Python services

**For Frontend Development:**
- `apps/webapp/js/` - JavaScript modules
- `apps/webapp/styles/` - CSS files
- `apps/webapp/*.html` - HTML pages

**For Infrastructure:**
- `fly.toml` - Fly.io deployment config
- `Dockerfile` - Container images
- `scripts/` - Automation scripts

---

## Development Workflow

### 1. Create a Feature Branch

```bash
# Always branch from main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Examples:
# git checkout -b feature/add-kbli-search
# git checkout -b bugfix/fix-auth-token
# git checkout -b docs/update-api-reference
```

### 2. Make Changes

**Backend-TS Example: Add New Handler**

```typescript
// apps/backend-ts/src/handlers/new-feature/my-handler.ts

import { Request, Response } from 'express';
import { logger } from '../../logging/unified-logger';

export async function myNewHandler(req: Request, res: Response) {
  try {
    logger.info('myNewHandler called', { params: req.body });

    // Your logic here
    const result = await someBusinessLogic(req.body);

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('myNewHandler error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}
```

**Register Handler:**

```typescript
// apps/backend-ts/src/core/handler-registry.ts

import { myNewHandler } from '../handlers/new-feature/my-handler';

// In loadHandlers() or constructor
registry.register('my_new_handler', myNewHandler, {
  module: 'new-feature',
  description: 'My new handler description',
  version: '1.0.0'
});
```

**Backend-RAG Example: Add New Service**

```python
# apps/backend-rag/backend/services/my_new_service.py

from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class MyNewService:
    def __init__(self):
        self.initialized = False

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process data with my new service"""
        try:
            logger.info(f"MyNewService processing: {data}")

            # Your logic here
            result = await self._business_logic(data)

            return {"success": True, "data": result}
        except Exception as e:
            logger.error(f"MyNewService error: {e}")
            raise
```

**Add Router:**

```python
# apps/backend-rag/backend/app/routers/my_new_router.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/my-new-feature", tags=["My New Feature"])

class MyRequest(BaseModel):
    param1: str
    param2: int

@router.post("/process")
async def process_request(request: MyRequest):
    """Process request with my new service"""
    try:
        result = await my_new_service.process(request.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**Frontend Example: Add New Component**

```javascript
// apps/webapp/js/components/MyNewComponent.js

class MyNewComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="my-component">
        <h2>My New Component</h2>
        <button id="myButton">Click Me</button>
      </div>
    `;
  }

  attachEventListeners() {
    document.getElementById('myButton').addEventListener('click', () => {
      this.handleClick();
    });
  }

  async handleClick() {
    try {
      const response = await fetch('/api/my-endpoint');
      const data = await response.json();
      console.log('Response:', data);
    } catch (error) {
      console.error('Error:', error);
    }
  }
}

// Export for use in other modules
window.MyNewComponent = MyNewComponent;
```

### 3. Test Your Changes

**Backend-TS Tests:**

```bash
cd apps/backend-ts

# Run all tests
npm test

# Run specific test file
npm test -- handlers/new-feature/my-handler.test.ts

# Run with coverage
npm run test:coverage
```

**Backend-RAG Tests:**

```bash
cd apps/backend-rag

# Run all tests
pytest

# Run specific test file
pytest tests/services/test_my_new_service.py

# Run with coverage
pytest --cov=backend --cov-report=html
```

**Frontend E2E Tests:**

```bash
# Run E2E tests
npm run test:e2e

# Or manually with Playwright
npx playwright test
```

### 4. Commit Your Changes

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat: add my new feature

- Added new handler for feature X
- Implemented service Y
- Added tests

Closes #123"

# Commit message format:
# feat: new feature
# fix: bug fix
# docs: documentation
# test: tests
# refactor: code refactoring
# style: code style
# chore: maintenance
```

### 5. Push and Create Pull Request

```bash
# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
# https://github.com/Balizero1987/nuzantara/compare
```

**Pull Request Template:**

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactoring

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)

## Screenshots (if applicable)
[Add screenshots here]
```

### 6. Code Review Process

**What Reviewers Look For:**
- Code quality and readability
- Test coverage
- Documentation
- Performance implications
- Security considerations
- Breaking changes

**Common Review Comments:**
- "Add tests for edge cases"
- "Extract this into a separate function"
- "Update documentation"
- "Consider error handling here"

---

## Common Tasks

### Task 1: Add a New API Endpoint

**Backend-TS:**

```typescript
// 1. Create handler
// apps/backend-ts/src/handlers/my-module/my-endpoint.ts
export async function myEndpoint(req: Request, res: Response) {
  // Implementation
}

// 2. Register handler
// apps/backend-ts/src/core/handler-registry.ts
registry.register('my_endpoint', myEndpoint, {...});

// 3. Add route
// apps/backend-ts/src/routing/router.ts
router.post('/api/my-endpoint', myEndpoint);
```

**Backend-RAG:**

```python
# 1. Create router
# apps/backend-rag/backend/app/routers/my_router.py
@router.post("/my-endpoint")
async def my_endpoint(request: MyRequest):
    # Implementation

# 2. Include router
# apps/backend-rag/backend/app/main_cloud.py
from app.routers.my_router import router as my_router
app.include_router(my_router)
```

### Task 2: Add a New Database Table

**Create Migration:**

```sql
-- apps/backend-rag/backend/db/migrations/008_my_new_table.sql

CREATE TABLE IF NOT EXISTS my_new_table (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_my_table_name ON my_new_table(name);
```

**Apply Migration:**

```bash
psql $DATABASE_URL -f apps/backend-rag/backend/db/migrations/008_my_new_table.sql
```

### Task 3: Add a New Knowledge Base Collection

**Ingest Data:**

```python
# scripts/ingest_my_collection.py

import chromadb
from chromadb.config import Settings

# Initialize ChromaDB
client = chromadb.Client(Settings(
    chroma_db_impl="duckdb+parquet",
    persist_directory="./chroma_data"
))

# Create collection
collection = client.create_collection(
    name="my_collection",
    metadata={"description": "My new knowledge base"}
)

# Add documents
documents = [
    {"id": "doc1", "text": "Document 1 content"},
    {"id": "doc2", "text": "Document 2 content"},
]

for doc in documents:
    collection.add(
        ids=[doc["id"]],
        documents=[doc["text"]],
        metadatas=[{"source": "my_source"}]
    )

print("✅ Collection created and populated")
```

**Run Ingestion:**

```bash
python scripts/ingest_my_collection.py
```

### Task 4: Deploy to Production

**Using CLI:**

```bash
# Deploy backend-rag to Fly.io
fly deploy --config fly.toml

# Deploy frontend to Cloudflare Pages
npm run deploy:frontend
```

**Using GitHub Actions:**

```bash
# Push to main triggers automatic deployment
git push origin main

# Or manually trigger workflow
gh workflow run deploy.yml
```

### Task 5: Debug Production Issues

**Check Logs:**

```bash
# Fly.io logs
fly logs -a nuzantara-rag

# Filter by level
fly logs -a nuzantara-rag | grep ERROR

# Tail logs
fly logs -a nuzantara-rag --follow
```

**Check Health:**

```bash
# Backend-TS health
curl https://nuzantara-backend.fly.dev/health

# Backend-RAG health
curl https://nuzantara-rag.fly.dev/health
```

**SSH into Container:**

```bash
fly ssh console -a nuzantara-rag
```

---

## Troubleshooting

### Issue: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::8080`

**Solution:**
```bash
# Find process using port
lsof -i :8080

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=8081
```

### Issue: Database Connection Failed

**Error:** `ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
brew services start postgresql@15

# Or using Docker
docker-compose up -d postgres
```

### Issue: ChromaDB Not Found

**Error:** `Connection refused: http://localhost:8001`

**Solution:**
```bash
# Start ChromaDB with Docker
docker run -p 8001:8000 -v ./chroma_data:/chroma/chroma chromadb/chroma

# Or install locally
pip install chromadb
chroma run --path ./chroma_data --port 8001
```

### Issue: Missing API Keys

**Error:** `ANTHROPIC_API_KEY is not set`

**Solution:**
```bash
# Get API keys from team lead
# Add to .env file
echo "ANTHROPIC_API_KEY=sk-ant-..." >> apps/backend-ts/.env
echo "OPENAI_API_KEY=sk-..." >> apps/backend-ts/.env
```

### Issue: Module Not Found

**Error:** `Cannot find module './my-module'`

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Or for Python
pip install -r requirements.txt
```

### Issue: Tests Failing

**Error:** `Test suite failed to run`

**Solution:**
```bash
# Clear Jest cache
npm run test -- --clearCache

# Run specific test
npm test -- path/to/test.ts

# Debug test
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## Resources

### Documentation

- **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **API Reference:** [API_REFERENCE.md](./API_REFERENCE.md)
- **Development Guide:** [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
- **Database Schema:** [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- **Deployment:** [DEPLOYMENT_INFRASTRUCTURE.md](./DEPLOYMENT_INFRASTRUCTURE.md)

### External Resources

- **Express.js:** https://expressjs.com/
- **FastAPI:** https://fastapi.tiangolo.com/
- **ChromaDB:** https://docs.trychroma.com/
- **Fly.io:** https://fly.io/docs/
- **Anthropic Claude:** https://docs.anthropic.com/
- **OpenAI:** https://platform.openai.com/docs

### Team Contacts

- **Tech Lead:** [Add contact]
- **DevOps:** [Add contact]
- **Product Manager:** [Add contact]

### Slack Channels

- `#nuzantara-dev` - Development discussions
- `#nuzantara-deploys` - Deployment notifications
- `#nuzantara-bugs` - Bug reports
- `#nuzantara-help` - Ask for help

---

## Next Steps

Now that you're set up:

1. ✅ Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system
2. ✅ Review [API_REFERENCE.md](./API_REFERENCE.md) for API details
3. ✅ Check [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for best practices
4. ✅ Pick a starter task from the backlog
5. ✅ Join the team standup!

**Welcome aboard! Happy coding! 🚀**
