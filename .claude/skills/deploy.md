---
name: deploy
description: Deploy nuzantara full-stack to Railway with automated health checks, build validation, and rollback on failure
---

# Nuzantara Deployment Protocol

Use this skill when deploying to Railway or Google Cloud, or when user asks to push to production.

## Pre-Deployment Checks

### 1. Build Validation
```bash
# TypeScript backend build
npm run build

# Verify no TypeScript errors
npm run typecheck
```

Expected: Clean build with no errors.

### 2. Test Suite Execution
```bash
# Run all tests with coverage
npm test

# Ensure 70% coverage threshold met
npm run test:coverage
```

Expected: All tests pass, coverage >= 70%.

### 3. Lint & Format Check
```bash
# Check code style (if configured)
npm run lint
```

Expected: No linting errors.

### 4. Environment Variables Validation
Verify all required env vars are set in Railway/Cloud:

**Backend TypeScript (Port 8080)**:
- `NODE_ENV=production`
- `PORT=8080`
- `JWT_SECRET`
- `DATABASE_URL` (PostgreSQL)
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `REDIS_URL` (optional)
- `CLOUDFLARE_R2_*` (storage)

**Backend RAG (Port 8000)**:
- `ANTHROPIC_API_KEY`
- `CHROMA_DB_PATH=/data/chroma`
- `EMBEDDING_MODEL=sentence-transformers/...`
- `POSTGRES_URL`
- `TIER_ACCESS_ENABLED=true`

## Deployment Process

### Step 1: Git Operations
```bash
# Ensure we're on the correct branch
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "deploy: [description]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to deployment branch
git push -u origin claude/document-skills-info-011CUQ9yv4uJ4AzJ511d3EUu
```

### Step 2: Railway Deployment
Railway auto-deploys on push if configured. Monitor:

```bash
# Check deployment status (if Railway CLI installed)
railway status

# View logs
railway logs
```

**Alternative: Manual Deploy Script**
```bash
./scripts/deploy/deploy-backend.sh
```

### Step 3: Docker Build (if manual)
```bash
# Build TypeScript backend
cd apps/backend-ts
docker build -t nuzantara-backend-ts:latest .

# Build Python RAG backend
cd apps/backend-rag/backend
docker build -t nuzantara-backend-rag:latest .
```

### Step 4: Health Checks
Wait 60-90 seconds for services to start, then verify:

```bash
# Backend TypeScript health check
curl https://your-railway-domain.railway.app/health

# Backend RAG health check
curl https://your-rag-domain.railway.app/health
```

Expected response: `{"status": "healthy"}` or similar.

### Step 5: Smoke Tests
Run critical path tests:

1. **Auth Test**: Login endpoint works
2. **RAG Test**: Semantic search returns results
3. **Oracle Agent Test**: At least one agent responds
4. **Database Test**: Can read/write to PostgreSQL

### Step 6: Monitoring Setup
Verify monitoring is active:
- Railway dashboard shows green status
- Logs are streaming properly
- No immediate errors in logs
- Memory/CPU usage within normal range

## Rollback Procedure

If health checks fail or critical issues found:

```bash
# Revert to previous commit
git revert HEAD

# Force push to trigger redeployment
git push -f origin [branch]
```

Or use Railway dashboard to rollback to previous deployment.

## Post-Deployment Validation

### 1. Functional Tests
- Login/logout works
- Chat interface responds
- RAG queries return results
- Oracle agents accessible
- Dashboard loads correctly

### 2. Performance Check
- API response times < 500ms
- RAG query latency acceptable
- No memory leaks
- Database connections stable

### 3. User Notification
Inform team that deployment is complete and system is healthy.

## Key Files
- `railway.json` - Railway configuration
- `apps/backend-ts/Dockerfile` - TS backend container
- `apps/backend-rag/backend/Dockerfile` - RAG backend container
- `scripts/deploy/deploy-backend.sh` - Deployment script
- `docs/deployment/` - Deployment documentation

## Common Issues
- **Build fails**: Check TypeScript errors, missing dependencies
- **Health check timeout**: Services may need more startup time
- **Database connection error**: Verify DATABASE_URL is correct
- **ChromaDB not found**: Ensure data volume is mounted correctly
- **API keys invalid**: Verify environment variables in Railway

## Success Criteria
✅ All tests pass before deployment
✅ Build completes successfully
✅ Both services deploy without errors
✅ Health checks return 200 OK
✅ Smoke tests pass
✅ No errors in production logs
✅ Previous version can be rolled back if needed

## Emergency Contacts
If deployment fails critically:
1. Rollback immediately
2. Check Railway logs for errors
3. Notify team in Slack/communication channel
4. Document issue for post-mortem
