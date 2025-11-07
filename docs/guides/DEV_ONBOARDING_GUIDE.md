# 👨‍💻 ZANTARA - Dev AI Onboarding Guide

**Version**: 1.0.0
**Last Updated**: November 5, 2025
**Estimated Onboarding Time**: 2-3 hours
**Status**: Complete ✅

---

## 🎯 WELCOME TO ZANTARA!

This guide will take you from **zero to productive** in 2-3 hours. By the end, you'll:
- ✅ Have a working local development environment
- ✅ Understand the complete system architecture
- ✅ Know how to deploy to production
- ✅ Be ready to implement new features

---

## 📋 PRE-FLIGHT CHECKLIST

### **Required Software**
```bash
# Check your versions
node --version          # Required: v20.x or higher
npm --version           # Required: v10.x or higher
python --version        # Required: v3.11 or higher
git --version           # Required: v2.x or higher
flyctl version         # Required: latest (for deployments)

# Redis (optional for local dev, required for production)
redis-cli --version    # Optional locally, Redis Cloud in production
```

### **Required Accounts**
- ✅ GitHub account with repo access
- ✅ Fly.io account (for deployments)
- ✅ Anthropic API key (for Claude AI)
- ✅ Redis Cloud account (for caching)

### **Optional Tools**
- VS Code with TypeScript/Python extensions
- Postman or similar (for API testing)
- Docker Desktop (if running services locally)

---

## 🚀 PHASE 1: INITIAL SETUP (30 minutes)

### **Step 1: Clone Repository**
```bash
# Clone the repo
git clone <repository-url>
cd NUZANTARA-FLY

# Check you're on main branch
git branch
# Should show: * main

# See recent activity
git log --oneline -10
```

### **Step 2: Explore Project Structure**
```bash
# Take 5 minutes to explore
ls -la
cat START_HERE.md  # Read this first!

# Key directories
ls apps/                 # backend-ts, backend-rag, webapp
ls docs/                 # documentation
ls scripts/              # utility scripts
```

### **Step 3: Read Essential Documentation**
**Read in this order (60 minutes total):**
1. `START_HERE.md` (15 min) - Overview and quick start
2. `INFRASTRUCTURE_OVERVIEW.md` (15 min) - Architecture details
3. `KNOWLEDGE_BASE_MAP.md` (10 min) - Database structure
4. `WORKFLOW_COMPLETO.md` (15 min) - Workflows and procedures
5. `SYSTEM_PROMPT_REFERENCE.md` (5 min) - AI configuration

---

## 🔧 PHASE 2: BACKEND SETUP (45 minutes)

### **TypeScript Backend Setup**

#### **Navigate to Backend**
```bash
cd apps/backend-ts
ls -la
```

#### **Install Dependencies**
```bash
# Install packages
npm install

# If you get peer dependency warnings
npm install --legacy-peer-deps

# Verify installation
ls node_modules/  # Should see many packages
```

#### **Setup Environment Variables**
```bash
# Create local environment file
touch .env.local

# Open in your editor
code .env.local  # or nano .env.local
```

**Add these variables** (ask team for actual values):
```bash
# AI Configuration
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Redis Cache (Redis Cloud)
REDIS_HOST=redis-19371.c295.ap-southeast-1-1.ec2.redns.redis-cloud.com
REDIS_PORT=19371
REDIS_PASSWORD=your_redis_password

# RAG Backend
RAG_BACKEND_URL=http://localhost:8000
# Or production: https://nuzantara-rag.fly.dev

# Server Config
PORT=8080
NODE_ENV=development

# Security
JWT_SECRET=your_local_jwt_secret_min_32_chars

# Optional: PostgreSQL (if needed)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

#### **Verify Configuration**
```bash
# Check if .env.local exists
ls -la .env.local

# Count lines (should have ~10-15)
wc -l .env.local
```

#### **Start Development Server**
```bash
# Method 1: Using npm script
npm run dev

# Method 2: Direct tsx command
npx tsx src/server-incremental.ts

# Expected output:
# 🚀 Starting Incremental Server...
# ✅ [INC] Body parsing configured
# ✅ [INC] Feature #1 ENABLED: CORS & Security
# ...
# ✅ [INC] Server listening on port 8080
```

#### **Test Backend Health**
Open new terminal:
```bash
# Test health endpoint
curl http://localhost:8080/health

# Expected response:
{
  "status": "healthy",
  "version": "5.2.1",
  "uptime": 123.45,
  "timestamp": "2025-11-05T...",
  "services": {
    "redis": "connected",
    "rag_backend": "connected"
  }
}
```

#### **Test Other Endpoints**
```bash
# Cache stats
curl http://localhost:8080/cache/stats

# Metrics
curl http://localhost:8080/metrics

# Team members
curl http://localhost:8080/api/auth/team/members

# If all work: ✅ Backend is ready!
```

---

### **Python RAG Backend Setup**

#### **Navigate to RAG Backend**
```bash
cd ../../apps/backend-rag  # From backend-ts
# Or: cd apps/backend-rag   # From root
```

#### **Setup Python Environment**
```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # On Mac/Linux
# venv\Scripts\activate   # On Windows

# Your prompt should now show (venv)
```

#### **Install Dependencies**
```bash
# Install requirements
pip install -r requirements-backend.txt

# This takes 2-3 minutes
# Expected packages: fastapi, chromadb, anthropic, sentence-transformers, etc.

# Verify installation
pip list | grep -E "fastapi|chromadb|anthropic"
```

#### **Setup Environment Variables**
```bash
# Create .env file
touch .env

# Open in editor
code .env  # or nano .env
```

**Add these variables:**
```bash
# ChromaDB
CHROMA_DB_PATH=/data/chroma_db_FULL_deploy
# For local dev, use: ./chroma_data

# AI Configuration
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Server Config
PORT=8000
HOST=0.0.0.0

# Optional: If using embeddings API
COHERE_API_KEY=your_cohere_key
```

#### **Verify ChromaDB Data**
```bash
# Check if data exists (production uses Fly.io volume)
# For local dev, you might need to download or use test data

# If you have production data:
ls -lh /data/chroma_db_FULL_deploy/  # Production
# Or local:
ls -lh ./chroma_data/

# Expected: SQLite files, ~161MB total
```

#### **Start RAG Server**
```bash
# Start with uvicorn
uvicorn backend.app.main:app --reload --port 8000

# Or using the production file
uvicorn backend.app.main_cloud:app --reload --port 8000

# Expected output:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Application startup complete
```

#### **Test RAG Backend**
Open new terminal:
```bash
# Test root endpoint
curl http://localhost:8000/

# Expected: JSON with KB info and collection counts

# Test health
curl http://localhost:8000/health

# Test docs (open in browser)
open http://localhost:8000/docs
# Should show FastAPI Swagger UI with all endpoints
```

---

## 📁 PHASE 3: CODEBASE TOUR (30 minutes)

### **Backend-TS Structure**
```
apps/backend-ts/
├── src/
│   ├── server-incremental.ts     # 🎯 MAIN SERVER (start here!)
│   │   # Line 1-50: Imports & setup
│   │   # Line 51-100: Middleware configuration
│   │   # Line 101-300: Feature loading (9 features)
│   │   # Line 301+: Server start & health
│   │
│   ├── routes/                    # 🛣️ API ENDPOINTS
│   │   ├── health.routes.ts      # GET /health
│   │   ├── cache.routes.ts       # 7 cache endpoints
│   │   ├── performance.routes.ts # Performance metrics
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── team-auth.routes.ts  # Team authentication (Feature #9)
│   │   │   ├── v2/
│   │   │   │   └── bali-zero.routes.ts  # KBLI, pricing (Feature #7)
│   │   │   └── v3/
│   │   │       └── zantara.routes.ts    # v3 Ω endpoints (Feature #8)
│   │
│   ├── handlers/                  # 🎯 BUSINESS LOGIC
│   │   ├── auth/
│   │   │   └── team-login.ts     # JWT auth, team members
│   │   ├── bali-zero/
│   │   │   ├── kbli.ts           # KBLI lookups
│   │   │   └── pricing.ts        # Pricing calculations
│   │   └── zantara/
│   │       ├── unified.ts        # Unified query handler
│   │       ├── collective.ts     # Collective intelligence
│   │       └── ecosystem.ts      # Business ecosystem
│   │
│   ├── services/                  # 🔧 INTERNAL SERVICES
│   │   ├── redis-client.ts       # Redis cache management
│   │   ├── v3-cache.ts           # V3 endpoint caching
│   │   ├── unified-logger.ts     # Logging service
│   │   └── claude-client.ts      # Anthropic API client
│   │
│   ├── middleware/                # 🔒 MIDDLEWARE
│   │   ├── cors.middleware.ts    # CORS configuration
│   │   ├── security.middleware.ts # Helmet, rate limiting
│   │   ├── metrics.middleware.ts  # Prometheus metrics
│   │   └── correlation.middleware.ts # Request tracking
│   │
│   ├── types/                     # 📝 TYPESCRIPT TYPES
│   │   ├── express.d.ts          # Express extensions
│   │   └── api.types.ts          # API request/response types
│   │
│   └── utils/                     # 🛠️ UTILITIES
│       ├── error-handler.ts      # Error handling
│       └── validation.ts         # Input validation
│
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript configuration
└── fly.toml                       # Fly.io deployment config
```

### **Backend-RAG Structure**
```
apps/backend-rag/
├── backend/
│   ├── app/
│   │   ├── main.py               # 🎯 LOCAL DEV SERVER
│   │   ├── main_cloud.py         # 🎯 PRODUCTION SERVER (Fly.io)
│   │   └── routers/              # FastAPI routers
│   │
│   ├── core/                      # 🔧 CORE SERVICES
│   │   ├── chroma_client.py      # ChromaDB connection
│   │   ├── embeddings.py         # Embedding generation
│   │   └── config.py             # Configuration
│   │
│   ├── services/                  # 🎯 BUSINESS LOGIC
│   │   ├── query_service.py      # Query processing
│   │   ├── pricing_service.py    # Pricing calculations
│   │   └── document_service.py   # Document management
│   │
│   └── models/                    # 📝 DATA MODELS
│       └── schemas.py             # Pydantic models
│
├── requirements-backend.txt       # Python dependencies
└── fly.toml                       # Fly.io deployment config
```

### **Key Files to Know**

#### **🔥 Most Important Files (Read These First!)**
1. **`apps/backend-ts/src/server-incremental.ts`**
   - Main server file
   - Feature loading logic
   - Middleware configuration
   - **READ LINES 1-100 first!**

2. **`apps/backend-ts/src/routes/api/v3/zantara.routes.ts`**
   - V3 Ω endpoints (unified, collective, ecosystem)
   - Shows defensive error handling pattern
   - **Good example of proper TypeScript error handling**

3. **`apps/backend-ts/src/routes/api/auth/team-auth.routes.ts`**
   - Team authentication implementation
   - JWT token generation
   - Shows proper request validation

4. **`apps/backend-ts/src/handlers/auth/team-login.ts`**
   - 22 team members defined
   - Authentication logic
   - Session management

5. **`apps/backend-rag/backend/app/main_cloud.py`**
   - Production RAG server
   - ChromaDB initialization
   - Collection verification

#### **📊 Configuration Files**
- **`apps/backend-ts/package.json`** - Dependencies and npm scripts
- **`apps/backend-ts/tsconfig.json`** - TypeScript configuration (ES modules!)
- **`apps/backend-ts/fly.toml`** - Fly.io deployment settings
- **`apps/backend-rag/fly.toml`** - RAG deployment settings

#### **🔒 Security Files**
- **`apps/backend-ts/src/middleware/security.middleware.ts`** - Helmet, rate limiting
- **`apps/backend-ts/src/middleware/cors.middleware.ts`** - CORS configuration

---

## 🎓 PHASE 4: UNDERSTAND THE PATTERNS (20 minutes)

### **Pattern 1: Incremental Feature Loading**

The server uses **Feature-by-Feature Loading** pattern:

```typescript
// From server-incremental.ts (simplified)

// FEATURE #1: CORS & Security
console.log('🔄 [INC] Loading Feature #1: CORS & Security...');
app.use(corsMiddleware);
app.use(applySecurity);
console.log('✅ [F1] Feature #1 ENABLED: CORS & Security');

// FEATURE #2: Metrics
console.log('🔄 [INC] Loading Feature #2: Metrics...');
let metricsRoutes: any;
try {
  const metricsModule = await import('./routes/metrics.routes.js');
  metricsRoutes = metricsModule.default;
} catch (error: any) {
  console.log('⚠️ [F2] Metrics routes failed:', error.message);
  metricsRoutes = null;
}
if (metricsRoutes) {
  app.use('/metrics', metricsRoutes);
  console.log('✅ [F2] Feature #2 ENABLED: Metrics');
}

// This pattern repeats for all 9 features
```

**Why this pattern?**
- ✅ Easy to enable/disable features
- ✅ Clear logging of what's loaded
- ✅ Graceful degradation if feature fails
- ✅ Good for debugging

### **Pattern 2: Defensive Error Handling**

All catch blocks use proper TypeScript error handling:

```typescript
// ❌ WRONG (TypeScript error)
try {
  // ... code
} catch (error) {
  res.status(500).json({
    error: error.message  // ❌ Error: 'error' is of type 'unknown'
  });
}

// ✅ CORRECT (Defensive)
try {
  // ... code
} catch (error: any) {
  logger.error('Operation failed:', error);
  res.status(500).json({
    ok: false,
    error: error?.message || 'Operation failed'
  });
}
```

**Where to see this pattern:**
- `apps/backend-ts/src/routes/cache.routes.ts` (all endpoints)
- `apps/backend-ts/src/routes/api/v3/zantara.routes.ts` (all endpoints)
- `apps/backend-ts/src/routes/api/auth/team-auth.routes.ts` (all endpoints)

### **Pattern 3: Handler Separation**

Routes are **thin**, handlers contain **business logic**:

```typescript
// ✅ Route file (thin)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body || {};
    if (!name) {
      return res.status(400).json({
        ok: false,
        error: 'Name is required'
      });
    }
    // Call handler
    const result = await teamLogin({ name, email });
    res.json(result);
  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || 'Login failed'
    });
  }
});

// ✅ Handler file (business logic)
export async function teamLogin(params: { name: string; email?: string }) {
  // 1. Find team member
  const member = TEAM_MEMBERS.find(m =>
    m.name.toLowerCase() === params.name.toLowerCase()
  );

  if (!member) {
    throw new Error('Team member not found');
  }

  // 2. Generate JWT token
  const token = jwt.sign(
    { userId: member.id, email: member.email, role: member.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // 3. Return result
  return {
    ok: true,
    token,
    user: member
  };
}
```

### **Pattern 4: Environment Configuration**

Always use environment variables with fallbacks:

```typescript
// ✅ Good pattern
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// Log configuration (never log secrets!)
console.log(`Redis: ${REDIS_HOST}:${REDIS_PORT}`);
console.log(`Environment: ${NODE_ENV}`);

// ❌ Never log secrets
// console.log(`API Key: ${API_KEY}`);  // DON'T DO THIS!
```

---

## 🐛 PHASE 5: COMMON ISSUES & SOLUTIONS (15 minutes)

### **Issue #1: "Cannot find module" errors**

**Symptoms:**
```bash
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
  '.../routes/cache.routes.js'
```

**Cause:** TypeScript ES modules require `.js` extension in imports

**Solution:**
```typescript
// ❌ WRONG
import cacheRoutes from './routes/cache.routes';

// ✅ CORRECT
import cacheRoutes from './routes/cache.routes.js';
// Note: .js extension even though file is .ts!
```

**Where it matters:** ALL imports in `server-incremental.ts`

---

### **Issue #2: req.body is undefined**

**Symptoms:**
```bash
POST /api/auth/team/login
req.body: undefined
```

**Cause:** Body parser not configured before routes

**Solution:** Body parser MUST be before route mounting
```typescript
// ✅ CORRECT ORDER
app.use(express.json({ limit: '10mb' }));           // FIRST
app.use(express.urlencoded({ extended: true }));    // SECOND
app.use('/api/auth/team', teamAuthRoutes);           // THEN ROUTES
```

**Fixed in:** `apps/backend-ts/src/server-incremental.ts:23-28`

---

### **Issue #3: TypeScript error in catch blocks**

**Symptoms:**
```
Property 'message' does not exist on type 'unknown'
```

**Cause:** TypeScript doesn't know error type

**Solution:**
```typescript
// ❌ WRONG
catch (error) {
  res.json({ error: error.message });
}

// ✅ CORRECT
catch (error: any) {
  res.json({ error: error?.message || 'Unknown error' });
}
```

**Fixed in:** All routes files (cache, v3, team-auth)

---

### **Issue #4: Redis connection fails**

**Symptoms:**
```
Error: Redis connection failed
ENOTFOUND redis-xxxxx.amazonaws.com
```

**Cause:** Missing/wrong Redis credentials

**Solution:**
```bash
# Check .env.local
cat apps/backend-ts/.env.local | grep REDIS

# Should have:
REDIS_HOST=redis-19371.c295.ap-southeast-1-1.ec2.redns.redis-cloud.com
REDIS_PORT=19371
REDIS_PASSWORD=your_password

# Test connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping
# Should return: PONG
```

---

### **Issue #5: Fly.io deployment fails**

**Symptoms:**
```
Error: health checks failing
```

**Cause:** Usually missing environment variables

**Solution:**
```bash
# Set secrets on Fly.io
flyctl secrets set ANTHROPIC_API_KEY=sk-ant-xxxxx -a nuzantara-backend
flyctl secrets set REDIS_HOST=xxxxx -a nuzantara-backend
flyctl secrets set REDIS_PASSWORD=xxxxx -a nuzantara-backend

# List current secrets
flyctl secrets list -a nuzantara-backend

# Check logs
fly logs -a nuzantara-backend
```

---

### **Issue #6: ChromaDB collection not found**

**Symptoms:**
```
Collection 'kbli_unified' not found
```

**Cause:** Database not initialized or wrong path

**Solution:**
```python
# Check ChromaDB path in .env
cat apps/backend-rag/.env | grep CHROMA

# List collections
python -c "
import chromadb
client = chromadb.PersistentClient(path='./chroma_data')
print(client.list_collections())
"

# For production, use Fly.io volume path:
# /data/chroma_db_FULL_deploy
```

---

## 🧪 PHASE 6: TESTING YOUR SETUP (15 minutes)

### **Test Checklist**

Run these commands to verify everything works:

```bash
# ========================================
# BACKEND-TS TESTS
# ========================================
cd apps/backend-ts

# 1. Health check
curl http://localhost:8080/health
# Expected: {"status":"healthy",...}

# 2. Cache stats
curl http://localhost:8080/cache/stats
# Expected: {"connected":true,"keys":...}

# 3. Team members
curl http://localhost:8080/api/auth/team/members | jq
# Expected: Array of 22 team members

# 4. Team login
curl -X POST http://localhost:8080/api/auth/team/login \
  -H "Content-Type: application/json" \
  -d '{"name":"Zero","email":"zero@balizero.com"}' | jq
# Expected: {"ok":true,"token":"eyJhb...",user:{...}}

# 5. V3 Unified query
curl -X POST http://localhost:8080/api/v3/zantara/unified \
  -H "Content-Type: application/json" \
  -d '{"query":"restaurant KBLI code","user_id":"test","mode":"quick"}' | jq
# Expected: {"ok":true,"result":{...}}

# 6. KBLI lookup
curl "http://localhost:8080/api/v2/bali-zero/kbli?query=restaurant" | jq
# Expected: {"ok":true,"results":[...]}

# ========================================
# BACKEND-RAG TESTS
# ========================================
cd ../backend-rag

# 7. RAG health
curl http://localhost:8000/health
# Expected: {"status":"healthy",...}

# 8. RAG root (KB info)
curl http://localhost:8000/ | jq
# Expected: {"message":"ZANTARA RAG Backend","collections":{...}}

# 9. Open API docs in browser
open http://localhost:8000/docs
# Should show Swagger UI

# ========================================
# REDIS TESTS
# ========================================

# 10. Test Redis directly
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping
# Expected: PONG

# 11. Set test key
curl -X POST http://localhost:8080/cache/set \
  -H "Content-Type: application/json" \
  -d '{"key":"test","value":"hello","ttl":60}'
# Expected: {"success":true}

# 12. Get test key
curl "http://localhost:8080/cache/get?key=test"
# Expected: {"success":true,"value":"hello"}
```

### **✅ All Tests Pass?**
If all 12 tests pass, **your setup is complete**! 🎉

---

## 🚀 PHASE 7: YOUR FIRST DEPLOYMENT (20 minutes)

### **Deploy to Fly.io**

#### **Prerequisites**
```bash
# 1. Login to Fly.io
flyctl auth login

# 2. Verify access to apps
flyctl apps list
# Should show: nuzantara-backend, nuzantara-rag

# 3. Check current status
flyctl status -a nuzantara-backend
flyctl status -a nuzantara-rag
```

#### **Deploy Backend-TS**
```bash
cd apps/backend-ts

# 1. Verify secrets are set
flyctl secrets list -a nuzantara-backend

# 2. Deploy (uses Depot for faster builds)
flyctl deploy --app nuzantara-backend --remote-only

# Expected output:
# ==> Building image
# ==> Pushing image to registry
# ==> Deploying...
# ==> Monitoring deployment
#  1 desired, 1 placed, 1 healthy, 0 unhealthy
# ✅ Deployment successful!

# 3. Verify health
curl https://nuzantara-backend.fly.dev/health

# 4. Check logs
fly logs -a nuzantara-backend
```

#### **Deploy Backend-RAG**
```bash
cd ../backend-rag

# 1. Verify secrets
flyctl secrets list -a nuzantara-rag

# 2. Deploy
flyctl deploy --app nuzantara-rag --remote-only

# 3. Verify health
curl https://nuzantara-rag.fly.dev/health

# 4. Check logs
fly logs -a nuzantara-rag
```

#### **Verify Production**
```bash
# Test all production endpoints
curl https://nuzantara-backend.fly.dev/health
curl https://nuzantara-backend.fly.dev/cache/stats
curl https://nuzantara-backend.fly.dev/api/auth/team/members
curl https://nuzantara-rag.fly.dev/health
curl https://nuzantara-rag.fly.dev/

# If all return 200 OK: ✅ Deployment successful!
```

---

## 💡 PHASE 8: YOUR FIRST TASKS (Pick One!)

### **Task 1: Add a New Team Member (EASY - 20 minutes)**

**Goal:** Add yourself to the team authentication system

**Steps:**
1. Open `apps/backend-ts/src/handlers/auth/team-login.ts`
2. Find `TEAM_MEMBERS` array (around line 20)
3. Add your entry:
```typescript
{
  id: 'yourname',
  name: 'Your Name',
  email: 'you@balizero.com',
  role: 'Developer',
  department: 'technology',
  language: 'english',
  permissions: ['tech', 'admin'],
  greeting: 'Welcome back! As a Developer, you have access to technical systems.'
}
```
4. Test locally:
```bash
curl -X POST http://localhost:8080/api/auth/team/login \
  -H "Content-Type: application/json" \
  -d '{"name":"Your Name","email":"you@balizero.com"}'
```
5. Should return JWT token + your profile
6. Deploy and test production

**Success Criteria:** Can login with your name and get a valid JWT token

---

### **Task 2: Add a New Cache Endpoint (MEDIUM - 30 minutes)**

**Goal:** Add `GET /cache/keys` endpoint to list all cache keys

**Steps:**
1. Open `apps/backend-ts/src/routes/cache.routes.ts`
2. Add new route before export:
```typescript
// GET /cache/keys - List all cache keys matching pattern
router.get('/keys', async (req: Request, res: Response) => {
  try {
    const pattern = req.query.pattern as string || '*';

    const keys = await redisClient.keys(pattern);

    res.json({
      success: true,
      pattern,
      count: keys.length,
      keys
    });
  } catch (error: any) {
    logger.error('Cache keys error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to list keys'
    });
  }
});
```
3. Test locally:
```bash
curl http://localhost:8080/cache/keys
curl "http://localhost:8080/cache/keys?pattern=zantara:*"
```
4. Should return list of cache keys
5. Deploy and verify in production

**Success Criteria:** New endpoint works and lists cache keys by pattern

---

### **Task 3: Improve Health Check (MEDIUM - 45 minutes)**

**Goal:** Add more detailed health information

**Steps:**
1. Open `apps/backend-ts/src/routes/health.routes.ts`
2. Enhance health check to include:
   - Redis connection latency
   - RAG backend latency
   - Memory usage percentage
   - Active connections count
3. Example enhancement:
```typescript
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();

  // Test Redis latency
  const redisStart = Date.now();
  const redisConnected = await testRedisConnection();
  const redisLatency = Date.now() - redisStart;

  // Test RAG latency
  const ragStart = Date.now();
  const ragStatus = await testRAGConnection();
  const ragLatency = Date.now() - ragStart;

  // Memory usage
  const memUsage = process.memoryUsage();
  const memPercent = (memUsage.heapUsed / memUsage.heapTotal * 100).toFixed(2);

  res.json({
    status: 'healthy',
    version: '5.2.1',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      redis: {
        status: redisConnected ? 'connected' : 'disconnected',
        latency_ms: redisLatency
      },
      rag_backend: {
        status: ragStatus ? 'connected' : 'disconnected',
        latency_ms: ragLatency
      }
    },
    memory: {
      heapUsed_mb: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
      heapTotal_mb: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
      usage_percent: memPercent
    },
    response_time_ms: Date.now() - startTime
  });
});
```

**Success Criteria:** Health endpoint shows detailed metrics with latencies

---

### **Task 4: Create New V3 Endpoint (ADVANCED - 90 minutes)**

**Goal:** Add `/api/v3/zantara/team` endpoint for team analytics

**Steps:**
1. Create handler: `apps/backend-ts/src/handlers/zantara/team-analytics.ts`
2. Implement logic to:
   - Count team members by department
   - List permissions distribution
   - Show language breakdown
3. Create route in `apps/backend-ts/src/routes/api/v3/zantara.routes.ts`
4. Add caching using V3Cache
5. Add to server-incremental.ts (already mounted)
6. Write tests
7. Deploy and document

**Success Criteria:** New endpoint returns team analytics with caching

---

## 📚 REFERENCE MATERIALS

### **Important URLs**

**Production:**
- Frontend: https://zantara.balizero.com
- Backend: https://nuzantara-backend.fly.dev
- RAG: https://nuzantara-rag.fly.dev
- API Docs: https://nuzantara-rag.fly.dev/docs

**Health Checks:**
- Backend: https://nuzantara-backend.fly.dev/health
- RAG: https://nuzantara-rag.fly.dev/health
- Cache: https://nuzantara-backend.fly.dev/cache/health
- Metrics: https://nuzantara-backend.fly.dev/metrics

### **Useful Commands**

```bash
# Development
npm run dev                    # Start backend-ts dev server
uvicorn backend.app.main:app --reload  # Start RAG dev server

# Testing
curl http://localhost:8080/health      # Test backend
curl http://localhost:8000/health      # Test RAG

# Deployment
flyctl deploy --app nuzantara-backend --remote-only
flyctl deploy --app nuzantara-rag --remote-only

# Logs
fly logs -a nuzantara-backend
fly logs -a nuzantara-rag

# Secrets
flyctl secrets list -a nuzantara-backend
flyctl secrets set KEY=value -a nuzantara-backend

# Database
fly ssh console -a nuzantara-rag  # SSH into RAG server
cd /data/chroma_db_FULL_deploy    # Navigate to ChromaDB
```

### **Team Contacts**

**Technical Issues:**
- Zero (AI Bridge/Tech Lead) - zero@balizero.com

**Management:**
- Zainal (CEO) - zainal@balizero.com
- Ruslana (Board Member) - ruslana@balizero.com

**Setup & Legal:**
- Amanda (Executive Consultant)
- Anton (Executive Consultant)
- Krisna (Executive Consultant)

**Tax:**
- Veronika (Tax Manager) - veronika@balizero.com

### **Documentation Files**

1. **START_HERE.md** - System overview and quick start
2. **INFRASTRUCTURE_OVERVIEW.md** - Complete architecture details
3. **WORKFLOW_COMPLETO.md** - All workflows and procedures
4. **KNOWLEDGE_BASE_MAP.md** - Database and collections
5. **SYSTEM_PROMPT_REFERENCE.md** - AI configuration
6. **DEV_ONBOARDING_GUIDE.md** - This file!

---

## 🎯 ONBOARDING CHECKLIST

Print this and check off as you complete:

### **Phase 1: Initial Setup**
- [ ] Cloned repository
- [ ] Read START_HERE.md
- [ ] Read INFRASTRUCTURE_OVERVIEW.md
- [ ] Read KNOWLEDGE_BASE_MAP.md
- [ ] Read WORKFLOW_COMPLETO.md
- [ ] Read SYSTEM_PROMPT_REFERENCE.md

### **Phase 2: Backend Setup**
- [ ] Installed Node.js v20+
- [ ] Installed Python 3.11+
- [ ] Created backend-ts/.env.local
- [ ] npm install successful
- [ ] Backend dev server runs
- [ ] Health endpoint works
- [ ] Created backend-rag/.env
- [ ] pip install successful
- [ ] RAG server runs
- [ ] RAG docs accessible

### **Phase 3: Codebase Understanding**
- [ ] Read server-incremental.ts (lines 1-100)
- [ ] Understand feature loading pattern
- [ ] Read team-auth.routes.ts
- [ ] Read v3 zantara.routes.ts
- [ ] Understand error handling pattern
- [ ] Explored project structure

### **Phase 4: Testing**
- [ ] All 12 local tests pass
- [ ] Can login as team member
- [ ] Can query v3 unified endpoint
- [ ] Redis connection works
- [ ] ChromaDB accessible

### **Phase 5: Deployment**
- [ ] Fly.io account configured
- [ ] Successfully deployed backend-ts
- [ ] Successfully deployed backend-rag
- [ ] Production health checks pass
- [ ] Verified in production

### **Phase 6: First Task**
- [ ] Completed Task 1, 2, 3, or 4
- [ ] Code reviewed (if applicable)
- [ ] Tested locally
- [ ] Deployed to production
- [ ] Verified working

### **🎉 ONBOARDING COMPLETE!**
- [ ] Feel confident to work on codebase
- [ ] Know where to find documentation
- [ ] Know who to contact for help
- [ ] Ready to implement features

---

## 🆘 GETTING HELP

### **Problem-Solving Flow**

1. **Check logs first:**
   ```bash
   # Local
   # Check terminal output where server is running

   # Production
   fly logs -a nuzantara-backend
   fly logs -a nuzantara-rag
   ```

2. **Test health endpoints:**
   ```bash
   curl https://nuzantara-backend.fly.dev/health
   curl https://nuzantara-rag.fly.dev/health
   ```

3. **Check Common Issues section** (above)

4. **Search documentation:**
   ```bash
   grep -r "your error message" *.md
   ```

5. **Ask team:**
   - Technical: Zero (zero@balizero.com)
   - General: Team Slack/Email

### **Debug Checklist**

When something doesn't work:
- [ ] Is the service running? (check logs)
- [ ] Are environment variables set? (check .env files)
- [ ] Is Redis connected? (check /cache/health)
- [ ] Is RAG backend reachable? (check RAG health)
- [ ] Are imports using .js extension? (TypeScript ES modules)
- [ ] Is body parser before routes? (server-incremental.ts)
- [ ] Are errors properly typed? (error: any in catch blocks)

---

## 🎓 NEXT STEPS AFTER ONBOARDING

### **Week 1-2: Get Familiar**
- Review all code in routes/ directory
- Read through handlers/ directory
- Understand middleware chain
- Practice deploying changes

### **Week 3-4: Small Features**
- Implement 2-3 small features from missing list
- Add tests for your features
- Improve documentation
- Optimize existing code

### **Month 2+: Major Features**
- Take ownership of a major feature (e.g., User Authentication)
- Design and implement from scratch
- Write comprehensive tests
- Update documentation

### **Ongoing: System Improvement**
- Monitor production metrics
- Optimize slow endpoints
- Improve error handling
- Enhance security
- Add monitoring/alerting

---

## 📊 FEATURE IMPLEMENTATION PRIORITY

Based on INFRASTRUCTURE_OVERVIEW.md, here's what's missing:

### **High Priority (Implement First)**
1. **User Authentication** (5 features) - Registration, password reset, etc.
2. **RAG Direct Access** (3 features) - Query, embeddings, completions
3. **Business Analysis** (3 features) - KBLI analysis, license checks

### **Medium Priority**
4. **Financial Features** (5 features) - Pricing plans, subscriptions
5. **Admin Tools** (4 features) - User management, analytics

### **Low Priority**
6. **File Operations** (3 features) - Upload, download, validation
7. **Additional Admin** (2 features) - Backup, feature flags

**Total: 29 features to implement (76.3% of system)**

---

**🎉 CONGRATULATIONS!**

You've completed the onboarding guide. You should now:
- ✅ Have a working development environment
- ✅ Understand the system architecture
- ✅ Know the code patterns used
- ✅ Be able to deploy to production
- ✅ Be ready to implement features

**Welcome to the ZANTARA team! 🚀**

---

**Document Version**: 1.0.0
**Last Updated**: November 5, 2025
**Feedback**: Report issues or suggestions to improve this guide
**Status**: Complete and tested ✅
