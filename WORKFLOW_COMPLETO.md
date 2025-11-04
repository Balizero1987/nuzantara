# 🔄 ZANTARA - Workflow Completo

**Last Updated**: November 5, 2025
**Version**: 5.2.1
**Status**: Production Verified ✅

---

## 📋 INDICE

1. [Deployment Workflow](#deployment-workflow)
2. [Development Workflow](#development-workflow)
3. [Feature Implementation Workflow](#feature-implementation-workflow)
4. [Bug Fix Workflow](#bug-fix-workflow)
5. [Testing Workflow](#testing-workflow)
6. [Knowledge Base Update Workflow](#knowledge-base-update-workflow)
7. [Team Authentication Workflow](#team-authentication-workflow)
8. [API Request Workflow](#api-request-workflow)

---

## 🚀 DEPLOYMENT WORKFLOW

### Step 1: Code Changes
```bash
# 1. Make changes in apps/backend-ts/src/
vim src/handlers/...
vim src/routes/...
vim src/middleware/...
```

### Step 2: Type Check (Optional)
```bash
cd apps/backend-ts
npx tsc --noEmit
# Note: May show errors for known issues, check if new errors introduced
```

### Step 3: Build
```bash
npm run build
# Copies src/* to dist/*
```

### Step 4: Commit
```bash
git add -A
git commit -m "feat: Description of changes"
```

### Step 5: Deploy to Fly.io
```bash
flyctl deploy --app nuzantara-backend --remote-only
```

**Deployment Process**:
1. ✅ Verify app config
2. ✅ Build Docker image with Depot
3. ✅ Push image to Fly.io registry
4. ✅ Update machine configuration
5. ✅ Rolling update (zero downtime)
6. ✅ Health check verification
7. ✅ DNS configuration check

**Typical Duration**: 45-90 seconds

### Step 6: Verify Deployment
```bash
# Wait 5 seconds for deployment to stabilize
sleep 5

# Test health endpoint
curl https://nuzantara-backend.fly.dev/health

# Test specific endpoint
curl -X POST https://nuzantara-backend.fly.dev/api/auth/team/login \
  -H "Content-Type: application/json" \
  -d '{"name":"Zero","email":"zero@balizero.com"}'
```

---

## 💻 DEVELOPMENT WORKFLOW

### Local Development Setup

**1. Environment Setup**:
```bash
cd apps/backend-ts

# Copy environment variables
cp .env.example .env.local

# Install dependencies
npm install --legacy-peer-deps
```

**2. Required Environment Variables**:
```env
# Redis
REDIS_URL=redis://username:password@host:port

# OpenAI/Anthropic
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# JWT
JWT_SECRET=your-secret-key

# Backend RAG
RAG_BACKEND_URL=https://nuzantara-rag.fly.dev
```

**3. Run Development Server**:
```bash
# Option 1: Full server (server.ts)
npm run dev

# Option 2: Incremental server (server-incremental.ts)
npx tsx watch src/server-incremental.ts

# Option 3: Minimal server (server-minimal.ts)
npx tsx watch src/server-minimal.ts
```

**4. Test Endpoints Locally**:
```bash
# Test health
curl http://localhost:8080/health

# Test team login
curl -X POST http://localhost:8080/api/auth/team/login \
  -H "Content-Type: application/json" \
  -d '{"name":"Zero","email":"zero@balizero.com"}'
```

---

## ⚙️ FEATURE IMPLEMENTATION WORKFLOW

### Template: Adding a New Feature

**Example: Feature #10 - User Registration**

#### Step 1: Create Handler
```bash
# Create handler file
mkdir -p src/handlers/auth
touch src/handlers/auth/user-registration.ts
```

```typescript
// src/handlers/auth/user-registration.ts
import { Request, Response } from 'express';
import { ok } from '../../utils/response.js';

export async function userRegistration(req: Request, res: Response) {
  try {
    const { email, password, name } = req.body || {};

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        ok: false,
        error: 'Email, password, and name are required'
      });
    }

    // Implementation logic here
    // ...

    res.json(ok({
      success: true,
      message: 'User registered successfully'
    }));
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      error: error?.message || 'Registration failed'
    });
  }
}
```

#### Step 2: Create Route
```bash
# Create or update route file
touch src/routes/api/auth/user-auth.routes.ts
```

```typescript
// src/routes/api/auth/user-auth.routes.ts
import { Router } from 'express';
import { userRegistration } from '../../../handlers/auth/user-registration.js';

const router = Router();

router.post('/register', userRegistration);

export default router;
```

#### Step 3: Mount Route in Server
```typescript
// src/server-incremental.ts

// Add in the appropriate feature section
console.log('🔄 [INC] Loading Feature #10: User Registration...');

let userAuthRoutes: any;

try {
  const userAuthModule = await import('./routes/api/auth/user-auth.routes.js');
  userAuthRoutes = userAuthModule.default;
  console.log('  ✅ [F10] User Auth routes loaded');
} catch (error: any) {
  console.log('  ⚠️ [F10] User Auth routes failed:', error.message);
  userAuthRoutes = null;
}

if (userAuthRoutes) {
  try {
    app.use('/api/auth', userAuthRoutes);
    console.log('✅ [F10] Feature #10 ENABLED: User Registration');
  } catch (error: any) {
    console.error('❌ [F10] Failed to mount User Auth routes:', error.message);
  }
}
```

#### Step 4: Test Locally
```bash
# Start server
npx tsx watch src/server-incremental.ts

# Test endpoint
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

#### Step 5: Deploy to Production
```bash
git add -A
git commit -m "feat: Add user registration endpoint (Feature #10)"
flyctl deploy --app nuzantara-backend --remote-only

# Verify
curl -X POST https://nuzantara-backend.fly.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

---

## 🐛 BUG FIX WORKFLOW

### Example: Recent Bug Fix (Cache POST Endpoints)

**Problem**: `/cache/set` and `/cache/invalidate` returning 500 Internal Server Error

#### Step 1: Identify Issue
```bash
# Test endpoint
curl -X POST https://nuzantara-backend.fly.dev/cache/set \
  -H "Content-Type: application/json" \
  -d '{"key":"test","value":"data","ttl":300}'
# Result: 500 Internal Server Error
```

#### Step 2: Debug Locally
```typescript
// Check error in code
// Issue found: TypeScript error handling

// BEFORE (causing 500 error):
} catch (error) {
  res.status(500).json({
    error: error.message  // TypeScript error: 'error' is unknown
  });
}

// AFTER (fixed):
} catch (error: any) {
  res.status(500).json({
    error: error?.message || 'Unknown error'
  });
}
```

#### Step 3: Fix Code
```bash
# Edit file
vim src/routes/cache.routes.ts

# Apply fix to all catch blocks
```

#### Step 4: Test Fix Locally
```bash
npx tsx watch src/server-incremental.ts

curl -X POST http://localhost:8080/cache/set \
  -H "Content-Type: application/json" \
  -d '{"key":"test","value":"data","ttl":300}'
# Should return success
```

#### Step 5: Deploy Fix
```bash
git add -A
git commit -m "fix: Fix cache POST endpoints error handling"
flyctl deploy --app nuzantara-backend --remote-only
```

#### Step 6: Verify Fix in Production
```bash
curl -X POST https://nuzantara-backend.fly.dev/cache/set \
  -H "Content-Type: application/json" \
  -d '{"key":"test_fix","value":"working_now","ttl":300}'
# Should return: {"status":"success",...}
```

---

## 🧪 TESTING WORKFLOW

### Manual API Testing

**1. Health Check**:
```bash
curl https://nuzantara-backend.fly.dev/health
```

**2. Cache Endpoints**:
```bash
# Stats
curl https://nuzantara-backend.fly.dev/cache/stats

# Set value
curl -X POST https://nuzantara-backend.fly.dev/cache/set \
  -H "Content-Type: application/json" \
  -d '{"key":"test","value":"data","ttl":60}'

# Get value
curl https://nuzantara-backend.fly.dev/cache/get?key=test

# Delete
curl -X DELETE https://nuzantara-backend.fly.dev/cache/clear/test

# Invalidate pattern
curl -X POST https://nuzantara-backend.fly.dev/cache/invalidate \
  -H "Content-Type: application/json" \
  -d '{"pattern":"test*"}'
```

**3. Team Authentication**:
```bash
# Login
curl -X POST https://nuzantara-backend.fly.dev/api/auth/team/login \
  -H "Content-Type: application/json" \
  -d '{"name":"Zero","email":"zero@balizero.com"}'

# Get Members
curl https://nuzantara-backend.fly.dev/api/auth/team/members

# Validate Session
curl "https://nuzantara-backend.fly.dev/api/auth/team/validate?sessionId=SESSION_ID"

# Logout
curl -X POST https://nuzantara-backend.fly.dev/api/auth/team/logout \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"SESSION_ID"}'
```

**4. ZANTARA v3 Ω Endpoints**:
```bash
# Unified Query
curl -X POST https://nuzantara-backend.fly.dev/api/v3/zantara/unified \
  -H "Content-Type: application/json" \
  -d '{"query":"restaurant","domain":"kbli","mode":"quick"}'

# Ecosystem Analysis
curl -X POST https://nuzantara-backend.fly.dev/api/v3/zantara/ecosystem \
  -H "Content-Type: application/json" \
  -d '{"scenario":"business_setup","business_type":"restaurant","ownership":"foreign"}'

# Collective Intelligence
curl -X POST https://nuzantara-backend.fly.dev/api/v3/zantara/collective \
  -H "Content-Type: application/json" \
  -d '{"action":"stats"}'
```

### Automated Testing (Future)

```bash
# Run tests (when implemented)
npm test

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

---

## 📚 KNOWLEDGE BASE UPDATE WORKFLOW

### Adding Documents to ChromaDB

**Option 1: Via Python Script (RAG Backend)**
```bash
# SSH into Fly.io machine
flyctl ssh console -a nuzantara-rag

# Navigate to scripts
cd /app

# Run migration script
python scripts/add_documents.py --collection legal_unified --file /path/to/new_law.md
```

**Option 2: Via API (Future)**
```bash
# Upload document via API (when implemented)
curl -X POST https://nuzantara-rag.fly.dev/documents/upload \
  -F "file=@document.pdf" \
  -F "collection=legal_unified"
```

**Verify Document Count**:
```bash
flyctl ssh console -a nuzantara-rag

python3 << 'EOF'
import chromadb
client = chromadb.PersistentClient(path="/data/chroma_db_FULL_deploy")
collections = client.list_collections()
for col in collections:
    print(f"{col.name}: {col.count()} documents")
EOF
```

---

## 🔐 TEAM AUTHENTICATION WORKFLOW

### User Journey

**1. Login**:
```bash
POST /api/auth/team/login
Body: {"name":"Zero","email":"zero@balizero.com"}

Response:
{
  "ok": true,
  "data": {
    "sessionId": "session_1762275942304_zero",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "zero",
      "name": "Zero",
      "role": "AI Bridge/Tech Lead",
      "department": "technology",
      "email": "zero@balizero.com"
    },
    "permissions": ["all", "tech", "admin", "finance"],
    "personalizedResponse": "Ciao Zero! Bentornato...",
    "loginTime": "2025-11-04T17:05:42.304Z"
  }
}
```

**2. Use JWT Token for Authenticated Requests**:
```bash
# Store token
TOKEN="eyJhbGciOiJIUzI1NiIs..."

# Make authenticated request
curl -X POST https://nuzantara-backend.fly.dev/api/some-protected-endpoint \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data":"value"}'
```

**3. Validate Session**:
```bash
GET /api/auth/team/validate?sessionId=session_1762275942304_zero

Response:
{
  "ok": true,
  "data": {
    "valid": true,
    "session": {
      "id": "session_1762275942304_zero",
      "user": {...},
      "permissions": [...],
      "loginTime": "...",
      "lastActivity": "..."
    }
  }
}
```

**4. Logout**:
```bash
POST /api/auth/team/logout
Body: {"sessionId":"session_1762275942304_zero"}

Response:
{
  "ok": true,
  "data": {
    "success": true,
    "message": "Logged out successfully"
  }
}
```

---

## 🔄 API REQUEST WORKFLOW

### Standard Request Flow

**1. Client Request**:
```
Browser/App → Cloudflare CDN → nuzantara-backend.fly.dev
```

**2. Backend Processing**:
```
Request → Middleware Chain → Route Handler → Response
```

**Middleware Chain**:
1. ✅ **Body Parser** - Parse JSON/URL-encoded bodies
2. ✅ **Trust Proxy** - Extract real client IP (Fly.io proxy)
3. ✅ **CORS** - Validate origin (zantara.balizero.com allowed)
4. ✅ **Security Headers** - Helmet.js (CSP, XSS, Frame-Options)
5. ✅ **Rate Limiter** - 100 req/min per endpoint
6. ✅ **Correlation ID** - Add X-Correlation-ID header
7. ✅ **Performance Tracking** - Measure response time
8. ✅ **Metrics Collection** - Prometheus metrics

**3. Route Handler**:
- Validate input
- Call internal services/handlers
- Query RAG backend if needed
- Query cache (Redis) if applicable
- Format response

**4. Response**:
```json
{
  "ok": true,
  "data": {...}
}
```

**Headers Added**:
- `X-Correlation-ID`: Request tracking ID
- `X-Cache`: HIT or MISS (for cached endpoints)
- `Access-Control-Allow-Origin`: CORS header
- Various security headers (CSP, XSS-Protection, etc.)

---

## 📦 RELEASE WORKFLOW (Future)

### Versioning Strategy

**Current**: Incremental deployments (v0.8)
**Target**: Semantic versioning (v1.0.0)

**Version Format**: MAJOR.MINOR.PATCH
- **MAJOR**: Breaking API changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Tag created in Git
- [ ] Deployed to production
- [ ] Health checks verified
- [ ] Rollback plan prepared

---

## 🚨 INCIDENT RESPONSE WORKFLOW

### Production Issue Response

**1. Detect Issue**:
- Health check failure
- User report
- Monitoring alert

**2. Assess Impact**:
```bash
# Check health
curl https://nuzantara-backend.fly.dev/health

# Check specific endpoints
curl https://nuzantara-backend.fly.dev/api/v3/zantara/unified \
  -X POST -H "Content-Type: application/json" \
  -d '{"query":"test"}'

# Check logs
flyctl logs -a nuzantara-backend
```

**3. Quick Fix Options**:

**Option A: Rollback Deployment**:
```bash
# List recent releases
flyctl releases -a nuzantara-backend

# Rollback to previous version
flyctl releases rollback v123 -a nuzantara-backend
```

**Option B: Hot Fix**:
```bash
# Make fix
git add -A
git commit -m "hotfix: Fix critical issue"

# Deploy immediately
flyctl deploy --app nuzantara-backend --remote-only --strategy immediate
```

**4. Verify Fix**:
```bash
# Test affected endpoint
curl https://nuzantara-backend.fly.dev/[affected-endpoint]

# Monitor logs
flyctl logs -a nuzantara-backend --follow
```

**5. Post-Mortem**:
- Document issue
- Identify root cause
- Implement preventive measures
- Update monitoring/alerts

---

## 📊 MONITORING WORKFLOW

### Daily Health Check

```bash
#!/bin/bash
# daily-health-check.sh

echo "=== ZANTARA Daily Health Check ==="
echo ""

# Backend Health
echo "1. Backend Health:"
curl -s https://nuzantara-backend.fly.dev/health | jq '.ok, .data.uptime'

# RAG Health
echo "2. RAG Backend Health:"
curl -s https://nuzantara-rag.fly.dev/health | jq '.status'

# Cache Health
echo "3. Redis Cache:"
curl -s https://nuzantara-backend.fly.dev/cache/health | jq '.status'

# Sample API Test
echo "4. Sample API Test:"
curl -s -X POST https://nuzantara-backend.fly.dev/api/auth/team/members | jq '.data.total'

echo ""
echo "=== Health Check Complete ==="
```

---

**Document Version**: 1.0.0
**Last Updated**: November 5, 2025
**Maintained By**: ZANTARA DevOps Team
