# 🌸 ZANTARA Project Context

> **Last Updated**: 2025-10-14 (GCP + RunPod Cost Optimization: 88-99% GCP savings, RunPod config locked)
> **⚠️ UPDATE THIS**: When URLs/architecture/deployment change
> **🚨 CRITICAL**: DO NOT modify RunPod configs without asking! See "RunPod Configuration Rules" below

---

## 📋 Project Identity

**Name**: ZANTARA (NUZANTARA)
**Version**: v5.5.0-tool-use-active + rate-limiting + Llama 3.1 primary
**Location**: `/Users/antonellosiano/Desktop/NUZANTARA-2/`
**Repository**: https://github.com/Balizero1987/nuzantara
**Status**: Production (Cloud Run) + Local Development + **ZANTARA Llama 3.1 PRIMARY + TOOL USE + RATE LIMITING ACTIVE**

---

## 📚 Documentation Pointers

- **🚨 RunPod Cost + Config**: `RUNPOD_OPTIMAL_CONFIG_2025-10-14.md` ⭐⭐⭐ CRITICAL - READ FIRST!
  - Cost spike analysis: `RUNPOD_COST_ANALYSIS_2025-10-14.md`
  - Root cause: `RUNPOD_COST_SPIKE_ROOT_CAUSE_2025-10-14.md`
- **GCP Cost Optimization**: `.claude/handovers/gcp-cost-optimization.md` ⭐ NEW (2025-10-14)
- **Security + Rate Limiting**: `.claude/handovers/security-rate-limiting-2025-10-10.md`
- **Multi-Agent Architecture**: `.claude/handovers/multi-agent-architecture-2025-10-10.md`
- **ZANTARA Llama 3.1 Integration**: `ZANTARA_INTEGRATION_COMPLETE_REPORT.md`, `apps/backend-rag 2/backend/README_LLM_INTEGRATION.md`
- **Session Diaries (2025-10-14)**:
  - m1: `.claude/diaries/2025-10-14_sonnet-4.5_m1.md` (GCP cost optimization)
  - m7: `.claude/diaries/2025-10-14_sonnet-4.5_m7.md` (DevAI/Qwen analysis + RunPod cost spike)
- Handovers Index: `.claude/handovers/INDEX.md`
- System & Ops: `.claude/` (INIT, diaries, handovers)
- WebSocket: `.claude/handovers/websocket-implementation-2025-10-03.md`
- Deploy (TS/RAG/WebApp): `.claude/handovers/deploy-backend.md`, `.claude/handovers/deploy-rag-backend.md`, `.claude/handovers/deploy-webapp.md`

---

## 🎯 AI Architecture Status & Roadmap

> **2025-10-14**: ZANTARA Llama 3.1 (RunPod vLLM) is the **ONLY** model in production - all other AIs removed.

### Current Stack (Live)
- **ONLY Model**: `zeroai87/zantara-llama-3.1-8b-merged` (RunPod Serverless vLLM)
- **Fallback**: HuggingFace Inference API (same LoRA merge)
- **NO External AI**: Anthropic Claude, OpenAI, Gemini, Cohere removed
- **Tool Use**: Not yet supported (ZANTARA doesn't support tool use - planned for future)
- **Memory**: Firestore (long-term) + ChromaDB (vector) + in-memory cache
- **Quality Enhancer**: Cross-encoder reranker (`ms-marco-MiniLM-L-6-v2`)

### Special-Purpose Models (Kept)
- **Llama 3.2** (3B): Used for intel scraping scripts
- **Qwen/DevAI**: Used for development tools

**Current Stack**: ZANTARA Llama 3.1 ONLY - No external AI dependencies

**Supporting Docs**: `.claude/handovers/multi-agent-architecture-2025-10-10.md`

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
- **Tool Use Integration**: ✅ **ACTIVE** - 41 handlers available for AI execution
  - System endpoints: system.handlers.list, system.handlers.tools, system.handler.execute
  - Anthropic-compatible tool definitions (JSON Schema draft 2020-12)
- **Rate Limiting**: ✅ **ACTIVE** (2025-10-10) - Abuse protection for expensive endpoints
  - 4-tier system: Bali Zero (20/min), AI Chat (30/min), RAG (15/min), Batch (5/min)
  - Middleware: `src/middleware/rate-limit.ts` (154 LOC) + `selective-rate-limit.ts` (47 LOC)
  - Internal API keys bypass rate limits
  - Protection: 98% cost reduction in abuse scenarios ($115k/day → $2.3k/day max)

### **2. Python RAG Backend** (AI/Search + ZANTARA ONLY)
- **Language**: Python 3.11
- **Framework**: FastAPI
- **Location**: `/Users/antonellosiano/Desktop/NUZANTARA-2/apps/backend-rag 2/backend/`
- **Production URL**: https://zantara-rag-backend-himaadsxua-ew.a.run.app
- **Port**: 8000
- **Database**: ChromaDB (7,375 docs, 88.2 MB - deployed to GCS)
- **AI Model**: **ZANTARA Llama 3.1 ONLY** (RunPod vLLM) + HuggingFace Inference fallback
- **Entry Point**: `app/main_cloud.py` (prod), `app/main_integrated.py` (local)
- **Deploy**: GitHub Actions (`.github/workflows/deploy-rag-amd64.yml`)
- **Tool Use**: ❌ **NOT SUPPORTED** - ZANTARA doesn't support tool use yet (planned for future)
- **Reranker**: ✅ **ACTIVE** (2025-10-10) - Cross-encoder re-ranking for +400% search quality
  - Model: `cross-encoder/ms-marco-MiniLM-L-6-v2`
  - Environment: `ENABLE_RERANKER=true`
  - Dependencies: PyTorch (torch>=2.0.0) + sentence-transformers
  - Latency: +2-3s per query (acceptable for quality boost)
- **Collections**: 16 total (8 KB + 8 intel topics)
- **Critical ENV**: `RUNPOD_LLAMA_ENDPOINT`, `RUNPOD_API_KEY`, `HF_API_KEY`
- **Logs**: Startup logs confirm ZANTARA-only mode with `"✅ ZANTARA Llama 3.1 client ready (ONLY AI)"`

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
- **Security Fix** (2025-10-10): ✅ Removed hardcoded API key exposure
  - File: `apps/webapp/js/api-config.js:166`
  - Commit: `fc99ce4`
  - Auth: Origin-based bypass (`src/middleware/auth.ts:17-24`)
- **Main Files**:
  - `apps/webapp/index.html` → redirect to login
  - `apps/webapp/login.html` → ZANTARA authentication
  - `apps/webapp/dashboard.html` → main app
  - `apps/webapp/intel-dashboard.html` → Intelligence dashboard (chat + blog sidebar)
  - `apps/webapp/js/api-config.js` (API endpoint configuration, no API keys)

---

## 🌐 Deployment Coordinates

### **Google Cloud Platform**
- **Project ID**: `involuted-box-469105-r0`
- **Region**: `europe-west1`
- **Service Account**: `cloud-run-deployer@involuted-box-469105-r0.iam.gserviceaccount.com`
- **Monthly Cost**: IDR 170k-800k (was IDR 7M) - **88-99% savings** ✅

### **Cloud Run Services**
| Service | URL | Port | Resources | Status |
|---------|-----|------|-----------|--------|
| TypeScript Backend | https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app | 8080 | 1 CPU, 512Mi, minScale=0, maxScale=5, throttle=ON | ✅ Optimized (2025-10-14) |
| RAG Backend | https://zantara-rag-backend-himaadsxua-ew.a.run.app | 8000 | 1 CPU, 1Gi, minScale=0, maxScale=2, throttle=ON | ✅ Optimized (2025-10-14) |

### **GitHub Pages**
- **Repository**: https://github.com/Balizero1987/zantara_webapp
- **Branch**: `main`
- **Status**: ✅ **ACTIVE** (manual deploy only)
- **Live URL**: https://zantara.balizero.com
- **Entry**: `index.html` (auto-redirect to `login.html`)
- **Deploy**: Manual trigger via `gh workflow run "Sync Webapp to GitHub Pages"`
- **Latest**: Security fix deployed (commit `fc99ce4`, 2025-10-10)

### **GitHub Actions**
- **Status**: 14/14 workflows **DISABLED** (2025-10-14)
- **Trigger**: Manual only (`workflow_dispatch`) - no automatic runs
- **Cost Savings**: IDR 3-5M/month → IDR 0/month ✅
- **Deploy Commands**:
  ```bash
  gh workflow run "Deploy Backend API (TypeScript)"
  gh workflow run "Deploy RAG Backend (AMD64)"
  gh workflow run "Sync Webapp to GitHub Pages"
  ```

---

## 🔑 API Keys & Secrets

### **Local Development** (`.env` files)
```bash
# TypeScript Backend (.env)
API_KEYS_INTERNAL=zantara-internal-dev-key-2025
API_KEYS_EXTERNAL=zantara-external-dev-key-2025

# RAG Backend (apps/backend-rag 2/backend/.env)
RUNPOD_LLAMA_ENDPOINT=https://...
RUNPOD_API_KEY=...
HF_API_KEY=hf_...
```

### **Production** (Cloud Run env vars)
- ZANTARA-specific keys: `RUNPOD_LLAMA_ENDPOINT`, `RUNPOD_API_KEY`, `HF_API_KEY`
- ✅ Migrated to Secret Manager (2025-10-09)

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
| **ZANTARA Llama 3.1** (8B) | RunPod vLLM (itz2q5gmid4cyt) | Internal testing - ALL queries | €2-8/month (optimized!) |
| ZANTARA Llama 3.1 (HF) | HuggingFace Inference | Fallback if RunPod unavailable | Free (rate limited) |
| **DevAI Qwen 2.5 Coder** (7B) | RunPod vLLM (5g2h6nbyls47i7) | Internal dev - Code analysis | €1-3/month (ultra-low!) |
| Llama 3.2 (3B) | Ollama (local) | Intel scraping only | Free (local) |

**AI Architecture**: Dual-AI (ZANTARA + DevAI) - INTERNAL USE ONLY
- ZANTARA: 22,009 Indonesian business conversations, 98.74% accuracy
- DevAI: Code analysis, bug detection, development assistant
- **Total RunPod cost: €3-11/month for BOTH models** ✅ (single user, ultra-optimized)

**🚨 RunPod Configuration Warning**: See "RunPod Configuration Rules" section below!

---

## 📊 Current State (Snapshot)

> **⚠️ UPDATE THIS** at end of session if major changes

**Last Deployment**: 2025-10-14 (ZANTARA-ONLY mode - all external AIs removed)
**Backend**: ✅ v5.5.0 + rate-limiting (commit 2a1b5fb, 107 handlers)
**RAG**: ✅ v3.0.0-zantara-only (ZANTARA Llama 3.1 ONLY + Reranker ACTIVE)
**Webapp**: ✅ Security fixed (commit fc99ce4, no hardcoded API keys)
**ChromaDB**: 7,375 docs + 8 intel collections ready
**GitHub Pages**: ✅ Active (verified operational 2025-10-09)
**Bali Intel Scraper**: ✅ Complete (31 files, 8 topics, 240+ sources)

**AI Status**: ✅✅✅ **ZANTARA-ONLY MODE!**
  - Primary: ZANTARA Llama 3.1 (22,009 conversations, 98.74% accuracy)
  - Fallback: HuggingFace Inference API (same model)
  - Removed: Anthropic Claude, OpenAI, Gemini, Cohere
  - Tool Use: ❌ Not supported yet (planned for future)

**Reranker**: ✅✅✅ **ACTIVE IN PRODUCTION!** (2025-10-10 m1)
  - Model: cross-encoder/ms-marco-MiniLM-L-6-v2
  - Quality: +400% precision@5 (verified with real queries)
  - Fix: Added torch>=2.0.0 dependency (commit c106140)
  - Environment: ENABLE_RERANKER=true

**Rate Limiting**: ✅✅✅ **ACTIVE IN PRODUCTION!** (2025-10-10 m3)
  - 4-tier system: Bali Zero (20/min), AI Chat (30/min), RAG (15/min), Batch (5/min)
  - Files: `src/middleware/rate-limit.ts` (154 LOC) + `selective-rate-limit.ts` (47 LOC)
  - Protection: 98% cost reduction in abuse scenarios ($115k/day → $2.3k/day max)
  - Internal API keys bypass rate limits
  - Zero impact on legitimate usage

**Security**: ✅✅✅ **ENHANCED!** (2025-10-10 m3)
  - Frontend: Hardcoded API key removed (commit fc99ce4)
  - Backend: Origin-based auth bypass for webapp
  - Secret Manager: 100% API keys migrated (2025-10-09)
  - Rate Limiting: Abuse protection active

**Code Cleanup**: ✅ Twilio integration removed (-134 lines, 2025-10-09)
**Ollama**: Installed locally (llama3.2:3b, 2GB) but **UNUSED** (can be removed)

**Multi-Agent Architecture**: 📐 **DESIGNED** (2025-10-10 m2)
  - Session: Complete architecture design with 3 cost-optimized options
  - Analysis: 107 handlers mapped across 12 categories
  - Cost Reduction: 81-91% savings potential ($450/mo → $42-84/mo)
  - LLAMA 4: Training ready ($15-20, 6-8 hours)
  - Status: Awaiting user decision on architecture choice
  - Documentation: Complete handover + session diary + executive summary created

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

7. ✅ **Hardcoded API Keys in Frontend** - FIXED (2025-10-10 m3)
   - File: `apps/webapp/js/api-config.js:166`
   - Fix: Removed hardcoded key, using origin-based auth bypass
   - Commit: `fc99ce4`
   - Status: Deployed to GitHub Pages

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

## ⚡ CRITICAL: SYSTEM_PROMPT Maintenance Rule

> **🔴 MANDATORY**: When ZANTARA acquires new powers, update the SYSTEM_PROMPT!

**File**: `apps/backend-rag 2/backend/app/main_cloud.py` (lines 70-236)

**When to update**:
- ✅ New handlers added (Gmail, Calendar, Maps, Memory, etc.)
- ✅ New tools integrated (communication, identity, business services)
- ✅ New capabilities enabled (reranker, tool use, multi-agent, etc.)
- ✅ Changed behavior expectations (typo handling, user recognition, etc.)

**What to update**:
1. **"WHAT YOU CAN DO" section**: List new tools/capabilities
2. **"HOW TO USE YOUR CAPABILITIES" section**: Add practical examples
3. **Knowledge base info**: Update if KB content significantly changed

**Why this matters**:
The SYSTEM_PROMPT is ZANTARA's "brain instructions". If we add new powers but don't document them in the prompt, ZANTARA won't know to use them! This causes "stupid chatbot" behavior where capabilities exist but aren't utilized.

**Example**: Adding Gmail integration without updating SYSTEM_PROMPT means ZANTARA will say "I can't send emails" even though the capability exists.

**Deployment**: After updating SYSTEM_PROMPT, RAG backend must be redeployed for changes to take effect

---

## 🚨 RunPod Configuration Rules

> **CRITICAL**: Config changes caused €7 spike on 2025-10-14. Follow these rules STRICTLY!

### ⚠️ DO NOT CHANGE (Without Asking)

**NEVER modify these settings**:
- ❌ **Idle Timeout** (caused €7 crash when increased to 120s)
- ❌ **Max Workers** (risk of zombie billing multiplication)
- ❌ **GPU Type** (causes OOM or wastes money)

**If you think you need to change these → ASK FIRST!**

---

### ✅ Approved Configurations (2025-10-14)

#### ZANTARA Endpoint (INTERNAL ONLY)
```
Endpoint: itz2q5gmid4cyt
Idle Timeout: 5s     ← LOCKED (DO NOT CHANGE) - Ultra-optimized!
Max Workers: 1       ← LOCKED (DO NOT CHANGE) - Single user only
GPU: 2× RTX 80GB Pro ← LOCKED (DO NOT CHANGE)
Expected Cost: €2-8/month ✅
```

#### DevAI Endpoint (INTERNAL ONLY)
```
Endpoint: 5g2h6nbyls47i7
Idle Timeout: 5s     ← LOCKED (DO NOT CHANGE) - Ultra-optimized!
Max Workers: 1       ← LOCKED (DO NOT CHANGE) - Single user only
GPU: 2× RTX 80GB Pro ← LOCKED (DO NOT CHANGE)
Expected Cost: €1-3/month ✅
```

**Combined Total**: €3-11/month for BOTH AI models (internal use)

---

### 📖 Full Documentation

**READ BEFORE touching RunPod**: `RUNPOD_OPTIMAL_CONFIG_2025-10-14.md`

**Cost Spike Analysis**:
- Analysis: `RUNPOD_COST_ANALYSIS_2025-10-14.md`
- Root Cause: `RUNPOD_COST_SPIKE_ROOT_CAUSE_2025-10-14.md`
- Session Diary: `.claude/diaries/2025-10-14_sonnet-4.5_m7.md`

**What Happened**:
- 2025-10-14 03:25: User increased idle timeout 5s → 120s
- 2025-10-14 03:40: Worker crashed during config reload
- 2025-10-14 03:40-07:00: Zombie worker billing for 3.5 hours
- **Total damage**: €7 in few hours

**Lesson**: High idle timeout = crash risk = zombie billing = surprise costs

---

**End of Project Context**
