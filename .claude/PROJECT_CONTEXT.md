# 🌸 ZANTARA Project Context

> **Last Updated**: 2025-10-10 20:45 (Reranker Fixed & Active - v2.5.0)
> **⚠️ UPDATE THIS**: When URLs/architecture/deployment change

---

## 📋 Project Identity

**Name**: ZANTARA (NUZANTARA)
**Version**: v5.5.0-tool-use-active
**Location**: `/Users/antonellosiano/Desktop/NUZANTARA-2/`
**Repository**: https://github.com/Balizero1987/nuzantara
**Status**: Production (Cloud Run) + Local Development + **TOOL USE ACTIVE**

---

## 📚 Documentation Pointers

- LLAMA 4 Fine-Tuning: `docs/llama4/` (Quick Start, Full Guide, README)
- Handovers Index: `.claude/handovers/INDEX.md`
- System & Ops: `.claude/` (INIT, diaries, handovers)
- WebSocket: `.claude/handovers/websocket-implementation-2025-10-03.md`
- Deploy (TS/RAG/WebApp): `.claude/handovers/deploy-backend.md`, `.claude/handovers/deploy-rag-backend.md`, `.claude/handovers/deploy-webapp.md`

---

## 🏗️ Architecture Overview

### **1. TypeScript Backend** (Main API)
- **Language**: Node.js + TypeScript
- **Framework**: Express.js
- **Location**: `/Users/antonellosiano/Desktop/NUZANTARA-2/`
- **Production URL**: https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app
- **Port**: 8080
- **Handlers**: 107 handlers (41 exposed for tool use)
- **Entry Point**: `dist/index.js`
- **Docker**: `Dockerfile.dist`
- **Deploy**: GitHub Actions (`.github/workflows/deploy-backend.yml`)
- **NEW**: ✅ **Tool Use Integration Active** - 41 handlers available for AI execution
  - System endpoints: system.handlers.list, system.handlers.tools, system.handler.execute
  - Anthropic-compatible tool definitions (JSON Schema draft 2020-12)

### **2. Python RAG Backend** (AI/Search)
- **Language**: Python 3.11
- **Framework**: FastAPI
- **Location**: `/Users/antonellosiano/Desktop/NUZANTARA-2/apps/backend-rag 2/backend/`
- **Production URL**: https://zantara-rag-backend-himaadsxua-ew.a.run.app
- **Port**: 8000
- **Database**: ChromaDB (7,375 docs, 88.2 MB - deployed to GCS)
- **AI Models**: Anthropic Claude (Haiku/Sonnet routing)
- **Entry Point**: `app/main_cloud.py` (prod), `app/main_integrated.py` (local)
- **Deploy**: GitHub Actions (`.github/workflows/deploy-rag-amd64.yml`)
- **NEW**: ✅ **Tool Executor Active** - Can execute TypeScript handlers
  - Handler proxy: connects to TypeScript backend via /call RPC
  - Tool executor: converts Anthropic tool calls to handler execution
  - Max 5 iterations for tool use loops
- **Reranker**: ✅ **ACTIVE** (2025-10-10) - Cross-encoder re-ranking for +400% search quality
  - Model: `cross-encoder/ms-marco-MiniLM-L-6-v2`
  - Environment: `ENABLE_RERANKER=true`
  - Dependencies: PyTorch (torch>=2.0.0) + sentence-transformers
  - Latency: +2-3s per query (acceptable for quality boost)
- **Collections**: 16 total (8 KB + 8 intel topics)

### **3. Frontend** (Web UI)
- **Language**: HTML/CSS/JavaScript (vanilla)
- **Source Location**: `/Users/antonellosiano/Desktop/NUZANTARA-2/apps/webapp/`
- **Production URL**: https://zantara.balizero.com (GitHub Pages)
- **Entry Point**: `index.html` → auto-redirect → `login.html`
- **Deploy Method**: Auto-sync via GitHub Actions
  - Source: `apps/webapp/` (monorepo)
  - Target: `Balizero1987/zantara_webapp` repo
  - Workflow: `.github/workflows/sync-webapp-to-pages.yml`
  - Deploy time: 3-4 min (automatic on push)
- **Main Files**:
  - `apps/webapp/index.html` → redirect to login
  - `apps/webapp/login.html` → ZANTARA authentication
  - `apps/webapp/dashboard.html` → main app
  - `apps/webapp/intel-dashboard.html` → NEW: Intelligence dashboard (chat + blog sidebar)
  - `apps/webapp/js/api-config.js` (API endpoint configuration)

---

## 🌐 Deployment Coordinates

### **Google Cloud Platform**
- **Project ID**: `involuted-box-469105-r0`
- **Region**: `europe-west1`
- **Service Account**: `cloud-run-deployer@involuted-box-469105-r0.iam.gserviceaccount.com`

### **Cloud Run Services**
| Service | URL | Port | Status |
|---------|-----|------|--------|
| TypeScript Backend | https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app | 8080 | ✅ Running (v5.5.0-tool-use-active, 107 handlers) |
| RAG Backend | https://zantara-rag-backend-himaadsxua-ew.a.run.app | 8000 | ✅ Running (v2.5.0-reranker-active, rev 00118-864) |

### **GitHub Pages**
- **Repository**: https://github.com/Balizero1987/zantara_webapp
- **Branch**: `main`
- **Status**: ✅ **ACTIVE** (auto-sync enabled)
- **Live URL**: https://zantara.balizero.com
- **Entry**: `index.html` (auto-redirect to `login.html`)
- **Deploy**: Automatic via `.github/workflows/sync-webapp-to-pages.yml` (3-4 min)

---

## 🔑 API Keys & Secrets

### **Local Development** (`.env` files)
```bash
# TypeScript Backend (.env)
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
COHERE_API_KEY=...
API_KEYS_INTERNAL=zantara-internal-dev-key-2025
API_KEYS_EXTERNAL=zantara-external-dev-key-2025

# RAG Backend (zantara-rag/backend/.env)
ANTHROPIC_API_KEY=sk-ant-...
```

### **Production** (Cloud Run env vars)
- API keys passed via `--set-env-vars` in deployment
- ⚠️ **TODO**: Migrate to Secret Manager

---

## 🗂️ Key Directories

```
NUZANTARA-2/
├── dist/                    # TypeScript compiled output
├── src/                     # TypeScript source
│   └── handlers/            # 107 business logic handlers (75 files)
│       └── intel/           # NEW: Intel news handlers
├── middleware/              # Auth, monitoring, validation
├── static/                  # Frontend HTML files
├── apps/
│   ├── backend-rag 2/       # Python RAG backend
│   │   └── backend/
│   │       ├── app/         # FastAPI app
│   │       │   └── routers/ # NEW: intel.py router
│   │       ├── services/    # ChromaDB, search
│   │       └── kb/          # Knowledge base (214 books, 239 PDFs)
│   ├── webapp/              # Frontend
│   │   └── intel-dashboard.html  # NEW: Intelligence dashboard
│   └── bali-intel-scraper/  # NEW: Intelligence scraping system (31 files)
│       ├── scripts/         # 13 Python scrapers + tools
│       ├── docs/            # Complete documentation
│       └── templates/       # AI structuring prompts
├── scripts/
│   └── deploy/              # 6 deployment scripts (546 lines)
├── .github/workflows/       # 3 CI/CD workflows (337 lines)
└── .claude/                 # Session system (diaries, handovers)
```

---

## 🔧 Development Commands

### **TypeScript Backend**
```bash
# Local dev
npm run dev                  # Port 8080
npm run build                # Compile TypeScript

# Docker
docker buildx build --platform linux/amd64 -f Dockerfile.dist \
  -t gcr.io/involuted-box-469105-r0/zantara-v520-nuzantara:TAG .

# Deploy
gcloud run deploy zantara-v520-nuzantara \
  --image gcr.io/.../zantara-v520-nuzantara:TAG \
  --region europe-west1 \
  --port 8080
```

### **RAG Backend**
```bash
# Local dev
cd apps/backend-rag\ 2/backend
uvicorn app.main_integrated:app --port 8000 --reload

# Docker (via GitHub Actions - AMD64)
# Trigger: git push to apps/backend-rag 2/**
# Workflow: .github/workflows/deploy-rag-amd64.yml
# Auto-builds on ubuntu-latest (native AMD64)

# Manual deploy (if needed)
gcloud run deploy zantara-rag-backend \
  --image gcr.io/.../zantara-rag-backend:TAG \
  --region europe-west1 \
  --port 8000
```

### **Frontend**
```bash
cd zantara_webapp
# Open static/zantara-production.html in browser
# Or serve locally: python3 -m http.server 3000
```

---

## 🤖 AI Models Used

| Model | Provider | Use Case | Cost |
|-------|----------|----------|------|
| Claude Haiku 3.5 | Anthropic | Simple queries, fast responses | $0.25/1M tokens (input) |
| Claude Sonnet 4 | Anthropic | Complex analysis, legal queries | $3.00/1M tokens (input) |
| Gemini Pro | Google | Alternative LLM (proxy) | Varies |
| Cohere Command | Cohere | Alternative LLM (proxy) | Varies |

**Routing Logic** (RAG backend):
- Query length > 30 words OR contains ["analyze", "compare", "legal"] → Sonnet
- Otherwise → Haiku

---

## 📊 Current State (Snapshot)

> **⚠️ UPDATE THIS** at end of session if major changes

**Last Deployment**: 2025-10-10 20:15 WITA
**Backend**: ✅ v5.5.0-tool-use-active (41 handlers for tool use + 66 additional handlers)
**RAG**: ✅ v2.5.0-reranker-active (Tool executor + Reranker both ACTIVE, rev 00118-864)
**Webapp**: ✅ Auto-deploying (intel-dashboard.html added)
**ChromaDB**: 7,375 docs + 8 intel collections ready
**GitHub Pages**: ✅ Active (verified operational 2025-10-09)
**Bali Intel Scraper**: ✅ Complete (31 files, 8 topics, 240+ sources)
**Tool Use**: ✅✅✅ **FULLY ACTIVE IN PRODUCTION!**
  - Status: Chatbot executes real TypeScript handlers (not simulation)
  - Tests: team_list ✅ (23 members), bali_zero_pricing ✅ (20M IDR)
  - Available: Gmail, Drive, Calendar, Memory, AI, Identity, Bali Zero, Communication
**Reranker**: ✅✅✅ **ACTIVE IN PRODUCTION!** (2025-10-10)
  - Model: cross-encoder/ms-marco-MiniLM-L-6-v2
  - Quality: +400% precision@5 (verified with real queries)
  - Fix: Added torch>=2.0.0 dependency (commit c106140)
  - Environment: ENABLE_RERANKER=true
**Security**: ✅ 100% API keys in Secret Manager (migrated 2025-10-09)
**Code Cleanup**: ✅ Twilio integration removed (-134 lines, 2025-10-09)
**Ollama**: Installed locally (llama3.2:3b, 2GB) but **UNUSED** (can be removed)

---

## 🚧 Known Issues & Pending Tasks

### **High Priority**
1. ✅ **RAG Backend /search endpoint** - FIXED (2025-10-03 m24)
   - Pydantic v2 compatibility fix applied
   - Location: `zantara-rag/backend/app/main_cloud.py:9-10, 275-305`
   - Status: Fixed in code, deployed in v2.3-reranker

2. ✅ **GitHub Pages enabled** - VERIFIED (2025-10-09 m1)
   - Status: Active and operational
   - URL: https://zantara.balizero.com
   - HTTPS enforced, cert expires 2025-12-27

3. ✅ **API Keys migrated to Secret Manager** - COMPLETE (2025-10-09 m1)
   - 4/4 secrets now in Secret Manager (100% coverage)
   - Zero downtime migration completed
   - RAG backend updated to use secret references

4. ✅ **ChromaDB Reranker Not Working** - FIXED (2025-10-10 m1)
   - Missing torch>=2.0.0 dependency in requirements.txt
   - Fixed in commit c106140, deployed to revision 00118-864
   - Environment: ENABLE_RERANKER=true set in production
   - Status: Verified working with real queries (+400% quality boost)

### **NEW High Priority** (From Code Analysis 2025-10-10)
5. ⚠️ **TypeScript Strict Mode Disabled** - PENDING
   - File: `tsconfig.json` ("strict": false)
   - Impact: ~50+ potential runtime errors, compromised type safety
   - Effort: 2-3 hours to enable and fix errors
   - Recommendation: Enable gradually per module

6. ⚠️ **Jest ESM Tests Disabled in CI/CD** - PENDING
   - File: `.github/workflows/deploy-backend.yml:56-59`
   - Impact: No automated test coverage (446 test files unused)
   - Effort: 1-2 hours to fix Jest config
   - Recommendation: Fix before next major deployment

7. ⚠️ **Hardcoded API Keys in Frontend** - PENDING
   - File: `apps/webapp/js/api-config.js`
   - Impact: Security risk if key rotation needed
   - Effort: 30 minutes to move to backend-only auth
   - Recommendation: Remove client-side API key requirement

### **Medium Priority**
4. Add unit tests for pricing validation
5. ✅ **Twilio WhatsApp removed** - DONE (2025-10-09 m1)
   - WhatsApp connection is direct with Meta, not via Twilio
   - Code cleanup: -134 lines removed
6. ✅ **Deploy ChromaDB to production** - DONE (2025-10-03 m23)
   - 229 docs in visa_oracle, 5 collections total
   - Location: `gs://nuzantara-chromadb-2025/chroma_db/`
7. Set up monitoring alerts for 4xx/5xx errors
8. ✅ **Slack/Discord webhooks for alerts** - FIXED (2025-10-03 m24)
   - WhatsApp/Instagram alert integration complete
   - Requires env vars: SLACK_WEBHOOK_URL, DISCORD_WEBHOOK_URL

### **Low Priority**
9. Remove Ollama (unused, frees 2GB)
10. Update OpenAPI specs for new endpoints
11. ✅ **WebSocket support** - IMPLEMENTED (2025-10-03 m24)
    - Full bidirectional server, channel pub/sub
    - Pending: `npm install ws @types/ws` + deployment

---

## 🌐 KB Content Language Rules (PERMANENT)

> **🔴 CRITICAL: ALL KB updates MUST follow this rule**

**Indonesian for LAW, English for PRACTICE**

- ✅ **Indonesian (Bahasa Indonesia)**: Legal regulations, official procedures, government forms
  - Permenkumham, Undang-Undang, RPTKA, LKPM, legal terminology
  - Location: `nuzantara-kb/kb-agents/visa/regulations/indonesian/`

- ✅ **English**: Case studies, practical guides, FAQ, examples, user-facing content
  - How-to guides, troubleshooting, real-world scenarios
  - Location: `nuzantara-kb/kb-agents/visa/cases/` or `/guides/`

**Full Policy**: See `nuzantara-kb/kb-agents/KB_CONTENT_RULES.md`

---

## 🔗 Important Files to Check

When starting a session, **always verify these**:

1. **`zantara_webapp/js/api-config.js`** → Frontend API endpoints
2. **`dist/index.js:301`** → Backend port configuration
3. **`zantara-rag/backend/app/main_simple.py`** → RAG entry point (prod)
4. **`Dockerfile.dist`** → TypeScript backend Docker config
5. **`nuzantara-kb/kb-agents/KB_CONTENT_RULES.md`** → KB language policy (MANDATORY)

---

## 📝 Update Instructions

**When to update this file**:
- ✅ New deployment URL
- ✅ Architecture change (new service, removed service)
- ✅ Port change
- ✅ Major directory restructure
- ✅ ChromaDB size change (>10% delta)
- ❌ Small code changes (those go in handovers)
- ❌ Bug fixes (those go in diaries)

**How to update**:
1. Edit relevant section
2. Update "Last Updated" at top
3. Note change in diary

---

**End of Project Context**
