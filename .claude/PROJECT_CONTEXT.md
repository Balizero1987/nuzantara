# 🌸 ZANTARA Project Context

> **Last Updated**: 2025-10-05 06:42 (Webapp deployment fix - login screen restored)
> **⚠️ UPDATE THIS**: When URLs/architecture/deployment change

---

## 📋 Project Identity

**Name**: ZANTARA (NUZANTARA)
**Version**: v5.2.0
**Location**: `/Users/antonellosiano/Desktop/NUZANTARA-2/`
**Repository**: https://github.com/Balizero1987/nuzantara
**Status**: Production (Cloud Run) + Local Development

---

## 🏗️ Architecture Overview

### **1. TypeScript Backend** (Main API)
- **Language**: Node.js + TypeScript
- **Framework**: Express.js
- **Location**: `/Users/antonellosiano/Desktop/NUZANTARA-2/`
- **Production URL**: https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app
- **Port**: 8080
- **Handlers**: 104 handlers (RPC-style `/call` endpoint)
- **Entry Point**: `dist/index.js`
- **Docker**: `Dockerfile.dist`
- **Deploy**: GitHub Actions (`.github/workflows/deploy-backend.yml`)

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
| TypeScript Backend | https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app | 8080 | ✅ Running (v5.2.0, 104 handlers) |
| RAG Backend | https://zantara-rag-backend-himaadsxua-ew.a.run.app | 8000 | ✅ Running (v2.3.0-reranker, all endpoints passing) |

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
│   └── handlers/            # 96 business logic handlers (71 files)
├── middleware/              # Auth, monitoring, validation
├── static/                  # Frontend HTML files
├── apps/
│   └── backend-rag 2/       # Python RAG backend
│       └── backend/
│           ├── app/         # FastAPI app
│           ├── services/    # ChromaDB, search
│           └── kb/          # Knowledge base (214 books, 239 PDFs)
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

**Last Deployment**: 2025-10-05 00:00 UTC
**Backend**: ✅ v5.2.0 (revision 00043-nrf, deployed 22:22 UTC)
**RAG**: ✅ v2.3.0-reranker (revision 00068-nvn, deployed 23:31 UTC)
**Webapp**: ✅ Auto-sync active (deployed 23:49 UTC)
**ChromaDB**: 7,375 docs, 88.2 MB (deployed to GCS: `gs://nuzantara-chromadb-2025/chroma_db/`)
**GitHub Pages**: ✅ Active (auto-sync on every webapp push)
**Ollama**: Installed locally (llama3.2:3b, 2GB) but **UNUSED** (can be removed)

---

## 🚧 Known Issues & Pending Tasks

### **High Priority**
1. ✅ **RAG Backend /search endpoint** - FIXED (2025-10-03 m24)
   - Pydantic v2 compatibility fix applied
   - Location: `zantara-rag/backend/app/main_cloud.py:9-10, 275-305`
   - Status: Fixed in code, deployed in v2.3-reranker

2. ⚠️ **Enable GitHub Pages** - Manual action required
   - Settings → Pages → Source: `main` branch
   - Custom domain: zantara.balizero.com

3. ⚠️ **Migrate API Keys to Secret Manager** - Currently using env vars

### **Medium Priority**
4. Complete Twilio WhatsApp deployment (handler created, not deployed)
5. Add unit tests for pricing validation
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
