# ⚡ QUICK REFERENCE - NUZANTARA

**1-page cheat sheet for DevAI**

---

## 🎯 I Am Window: ____ (W1/W2/W3/W4)

**My Session File:** `.claude/CURRENT_SESSION_W__.md`

---

## 📊 System at a Glance

```
NUZANTARA = AI Platform for Indonesian Business Services

Stack:
├── TS Backend :8080  (122 handlers, Express 5.1)
├── RAG Backend :8000 (Python FastAPI, Haiku 4.5)
├── Frontend (PWA on GitHub Pages)
└── Data (PostgreSQL 34 tables + ChromaDB 14 collections)

AI Models:
├── Claude Haiku 4.5 (100% user traffic, $8-15/month)
├── ZANTARA Llama 3.1 (nightly worker, €3-11/month)
└── DevAI Qwen 2.5 (backend dev, €1-3/month)

Performance:
├── Golden Answers: 10-20ms (50-60% hit rate) ⚡⚡⚡
└── Haiku + RAG: 1-2s (40-50% queries)
```

---

## 🚀 Quick Commands

### Git
```bash
git status                    # Check status
git add .                     # Stage all
git commit -m "msg"           # Commit
git push origin <branch>      # Push
```

### Railway (NO DEPLOY for 5h - maintenance!)
```bash
railway status                # Service health
railway logs --service TS-BACKEND --tail 100
railway logs --service "RAG BACKEND" --tail 100
```

### Testing
```bash
# Local
npm run dev                   # TS backend :8080
python main.py                # RAG backend :8000

# Production
curl https://ts-backend-production-568d.up.railway.app/health
curl https://scintillating-kindness-production-47e3.up.railway.app/health
```

---

## 📁 Key Locations

```
/home/user/nuzantara/
├── apps/
│   ├── backend-ts/           # TypeScript API
│   │   ├── src/handlers/     # 122 handlers (19 categories)
│   │   └── src/services/     # Core services
│   ├── backend-rag/          # Python RAG
│   │   ├── backend/services/ # RAG services
│   │   └── backend/data/     # ChromaDB
│   └── webapp/               # Frontend PWA
│
├── docs/                     # Documentation
│   ├── galaxy-map/           # 6 architecture docs ⭐
│   ├── examples/             # 4 code examples ⭐
│   ├── operations/           # Incident + Monitoring ⭐
│   ├── security/             # Security guide ⭐
│   ├── deployment/           # Deploy guides
│   ├── guides/               # Setup guides
│   └── api/                  # API docs
│
└── .claude/                  # AI workspace
    ├── START_HERE.md         # Read this first!
    ├── QUICK_REFERENCE.md    # This file
    ├── PROJECT_CONTEXT.md    # Full context
    └── CURRENT_SESSION_WX.md # Your session file
```

---

## 📖 Essential Docs (Priority Order)

**MUST READ (5 min):**
1. `.claude/START_HERE.md` - Quick start
2. `.claude/QUICK_REFERENCE.md` - This file
3. `.claude/CURRENT_SESSION_WX.md` - Your window

**ARCHITECTURE (10 min):**
4. `docs/galaxy-map/README.md` - System overview
5. `docs/galaxy-map/01-system-overview.md` - Architecture

**CODE EXAMPLES (when coding):**
6. `docs/examples/HANDLER_INTEGRATION.md` - Create handlers
7. `docs/examples/RAG_SEARCH_EXAMPLE.md` - Use RAG

**OPERATIONS (when deploying):**
8. `docs/operations/INCIDENT_RESPONSE.md` - If things break
9. `docs/deployment/RAILWAY_DEPLOYMENT_GUIDE.md` - Deploy steps

---

## 🎯 Common Tasks

### Task: Create New Handler
```typescript
// apps/backend-ts/src/handlers/my-category/my-handler.ts
import { globalRegistry } from '../../core/handler-registry.js';
import { ok, err } from '../../utils/response.js';

export async function myHandler(params: any, req?: any) {
  return ok({ success: true });
}

globalRegistry.registerModule('my-category', {
  'my-action': myHandler
}, { requiresAuth: true });

// See: docs/examples/HANDLER_INTEGRATION.md
```

### Task: Query RAG
```typescript
import { RAGService } from '../services/ragService.js';

const rag = new RAGService(process.env.RAG_BACKEND_URL);
const response = await rag.query({
  query: "What docs for KITAS?",
  user_id: "user_123"
});

// See: docs/examples/RAG_SEARCH_EXAMPLE.md
```

### Task: Update Session File
```bash
# Edit .claude/CURRENT_SESSION_WX.md
# Add completed task:
## ✅ Task Completati
### 1. Created new handler
- Status: ✅
- Files: apps/backend-ts/src/handlers/my-handler.ts
- Changes: Added handler for X

# Commit often!
git add .claude/CURRENT_SESSION_WX.md
git commit -m "docs: update session W2 progress"
```

---

## 🚨 When Things Break

### Backend Down
```bash
# 1. Check logs
railway logs --service TS-BACKEND --tail 100 | grep ERROR

# 2. Check health
curl https://ts-backend.railway.app/health

# 3. See: docs/operations/INCIDENT_RESPONSE.md
```

### Tests Failing
```bash
# Run tests
npm test                      # TS backend
pytest                        # RAG backend

# Check what changed
git diff HEAD~1
```

### Need Help
```bash
# Read incident response
cat docs/operations/INCIDENT_RESPONSE.md

# Check monitoring
cat docs/operations/MONITORING_GUIDE.md

# Ask user if still stuck!
```

---

## 📞 URLs

**Production:**
- Frontend: https://zantara.balizero.com
- TS Backend: https://ts-backend-production-568d.up.railway.app
- RAG Backend: https://scintillating-kindness-production-47e3.up.railway.app

**Railway:**
- Dashboard: https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9

**GitHub:**
- Repo: https://github.com/Balizero1987/nuzantara

---

## ✅ Session Workflow

### Start Session (2 min)
1. User tells you: "Sei W2, [task]"
2. Read: `.claude/START_HERE.md`
3. Read: `.claude/CURRENT_SESSION_W2.md`
4. Open: New session entry with template

### During Session (continuous)
1. Work on task
2. Update `.claude/CURRENT_SESSION_W2.md` after each sub-task
3. Commit frequently (`git add .claude/` + `git commit`)
4. Document decisions, files changed, problems solved

### End Session (5 min)
1. Complete all pending tasks in session file
2. Add handover notes
3. Archive session:
   ```bash
   cat .claude/CURRENT_SESSION_W2.md >> .claude/ARCHIVE_SESSIONS.md
   echo "\n---\n" >> .claude/ARCHIVE_SESSIONS.md
   ```
4. Reset for next AI:
   ```bash
   cp .claude/CURRENT_SESSION.template.md .claude/CURRENT_SESSION_W2.md
   ```
5. Final commit + push

---

## 🎯 Golden Rules

### ✅ DO
- ✅ Update YOUR session file often
- ✅ Commit frequently (every task completed)
- ✅ Read docs before coding
- ✅ Test locally before pushing
- ✅ Ask user if unclear
- ✅ Document decisions

### ❌ DON'T
- ❌ Touch other window files (W1-W4)
- ❌ Create new .md files in .claude/
- ❌ Deploy without testing
- ❌ Skip documentation updates
- ❌ Forget handover notes
- ❌ Push broken code

---

## 🔥 Emergency Contacts

**If stuck:**
1. Check: `docs/operations/INCIDENT_RESPONSE.md`
2. Check: `.claude/ARCHIVE_SESSIONS.md` (recent sessions)
3. Ask user for clarification

**Railway Maintenance:**
- ⚠️ Currently: 5 hours (South-East Asia)
- NO deploys until maintenance ends

---

## 📊 Quick Stats

```
Handlers: 122 total (19 categories)
Tools: 164 (for ZANTARA)
Agents: 15 (10 RAG + 5 Oracle)
DB Tables: 34 (PostgreSQL)
Collections: 14 (ChromaDB, 14,365 docs)
Docs: 48 files (~8,000 pages equivalent)
```

---

**You're ready! 🚀**

**Next:** Read `.claude/PROJECT_CONTEXT.md` for full system context.
