# 🌸 ZANTARA (NUZANTARA) - Multi-Agent AI Platform

> **Version**: v5.5.0 + rate-limiting
> **Status**: ✅ Production Active
> **Last Updated**: 2025-10-11

---

## 🎯 Quick Start

### **New AI Session**
```bash
# Read entry protocol
cat .claude/INIT.md

# Follow Step 1-5 for session initialization
```

### **Key Documentation**
- **Project Context**: `.claude/PROJECT_CONTEXT.md` (Architecture, URLs, coordinates)
- **Session System**: `.claude/README.md` (Multi-CLI diaries & handovers)
- **AI Start Here**: `docs/setup/AI_START_HERE.md` (Operational bootstrap)
- **Handovers Index**: `.claude/handovers/INDEX.md` (Area-specific guides)

---

## 🏗️ Architecture Overview

### **Production Services**

| Service | URL | Port | Status |
|---------|-----|------|--------|
| **Backend (TypeScript)** | https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app | 8080 | ✅ Running |
| **RAG Backend (Python)** | https://zantara-rag-backend-himaadsxua-ew.a.run.app | 8000 | ✅ Running |
| **WebApp (Frontend)** | https://zantara.balizero.com | - | ✅ Live |

### **Key Features**
- **107 Handlers**: RPC-style business logic (41 exposed for tool use)
- **Tool Use Active**: Anthropic AI can execute handlers dynamically
- **Rate Limiting**: 4-tier abuse protection (98% cost reduction)
- **Reranker**: Cross-encoder search (+400% quality boost)
- **Security**: 100% API keys in Secret Manager
- **ChromaDB**: 7,375 docs (88.2 MB), 16 collections

---

## 📁 Project Structure

```
NUZANTARA-2/
├── .claude/                      # Session system (diaries, handovers, context)
│   ├── PROJECT_CONTEXT.md        # WHO WE ARE (read first!)
│   ├── INIT.md                   # Entry/exit protocol
│   ├── README.md                 # System documentation
│   ├── diaries/                  # Session logs (YYYY-MM-DD_model_mN.md)
│   └── handovers/                # Micro-handovers per category
├── apps/
│   ├── backend-rag 2/backend/    # Python RAG (FastAPI + ChromaDB)
│   ├── webapp/                   # Frontend (HTML/CSS/JS, synced to GitHub Pages)
│   └── bali-intel-scraper/       # Intelligence scraping system
├── src/
│   ├── handlers/                 # 107 business logic handlers
│   ├── middleware/               # Auth, rate-limit, monitoring
│   ├── services/                 # Core services (WebSocket, AI, DB)
│   ├── app-gateway/              # Unified event gateway (P0 in progress)
│   └── router.ts                 # Main API router
├── dist/                         # TypeScript compiled output
├── scripts/                      # Deployment & maintenance scripts
├── docs/                         # Documentation (setup, ADRs, guides)
├── configs/                      # Build configs (tsconfig, jest, etc.)
└── .github/workflows/            # CI/CD (backend, RAG, webapp sync)
```

---

## 🔧 Development

### **Local Development**

**Backend TypeScript**:
```bash
npm run dev          # Port 8080
npm run build        # Compile TypeScript
npm test             # Run tests (Jest)
```

**RAG Backend**:
```bash
cd apps/backend-rag\ 2/backend
uvicorn app.main_integrated:app --port 8000 --reload
```

**Frontend**:
```bash
cd apps/webapp
# Serve locally
python3 -m http.server 3000
# Or open HTML files directly in browser
```

### **Environment Variables**

**Backend TypeScript** (`.env`):
```bash
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
COHERE_API_KEY=...
API_KEYS_INTERNAL=zantara-internal-dev-key-2025
API_KEYS_EXTERNAL=zantara-external-dev-key-2025
```

**RAG Backend** (`apps/backend-rag 2/backend/.env`):
```bash
ANTHROPIC_API_KEY=sk-ant-...
ENABLE_RERANKER=true
```

---

## 🚀 Deployment

### **Backend (TypeScript)**
```bash
# Automated via GitHub Actions (.github/workflows/deploy.yml)
git push origin main

# Manual deploy
docker buildx build --platform linux/amd64 -f Dockerfile.dist \
  -t gcr.io/involuted-box-469105-r0/zantara-v520-nuzantara:TAG .
gcloud run deploy zantara-v520-nuzantara \
  --image gcr.io/.../zantara-v520-nuzantara:TAG \
  --region europe-west1 --port 8080
```

### **RAG Backend (Python)**
```bash
# Automated via GitHub Actions (.github/workflows/deploy-rag-amd64.yml)
# Triggers on push to apps/backend-rag 2/**
git push origin main
```

### **Frontend (WebApp)**
```bash
# Automated via GitHub Actions (.github/workflows/sync-webapp-to-pages.yml)
# Auto-syncs apps/webapp/ → Balizero1987/zantara_webapp → GitHub Pages
git push origin main
# Deploy time: 3-4 minutes
```

---

## 🤖 AI Models & Routing

| Model | Provider | Use Case | Cost |
|-------|----------|----------|------|
| Claude Haiku 3.5 | Anthropic | Fast responses | $0.25/1M input |
| Claude Sonnet 4 | Anthropic | Complex analysis | $3.00/1M input |
| Gemini Flash 2.0 | Google | Budget queries | $0.105/1M input |
| Cohere Command | Cohere | Alternative LLM | Varies |

**RAG Routing Logic**: Query >30 words OR contains ["analyze","compare","legal"] → Sonnet, else Haiku

---

## 📊 Current State

**Last Deployment**: 2025-10-10 (Security + Rate Limiting)

**Backend**: ✅ v5.5.0 + rate-limiting (commit 2a1b5fb, 107 handlers)
**RAG**: ✅ v2.5.0-reranker-active (rev 00118-864, Tool executor + Reranker ACTIVE)
**WebApp**: ✅ Security fixed (commit fc99ce4, no hardcoded API keys)
**Rate Limiting**: ✅ 4-tier active (Bali Zero 20/min, AI Chat 30/min, RAG 15/min, Batch 5/min)
**Security**: ✅ 100% API keys in Secret Manager
**ChromaDB**: 7,375 docs (88.2 MB), 16 collections
**Tool Use**: ✅✅✅ FULLY ACTIVE (41 handlers, verified)

---

## 🔑 GCP Coordinates

- **Project ID**: `involuted-box-469105-r0`
- **Region**: `europe-west1`
- **Service Account**: `cloud-run-deployer@involuted-box-469105-r0.iam.gserviceaccount.com`

---

## 🚧 Known Issues & Pending Tasks

### **High Priority**
1. ⚠️ **TypeScript Strict Mode Disabled** - Enable gradually (2-3 hours effort)
2. ⚠️ **Jest Tests Disabled in CI/CD** - Fix ESM config (1-2 hours effort)
3. 🔄 **App-Gateway P0** - In progress (branch: feature/gateway-p0-security-clean)

### **Medium Priority**
4. Multi-agent architecture decision pending (3 scenarios designed, 81-91% cost savings)
5. LLAMA 4 Scout 17B training ready ($15-20, 6-8 hours, 22K examples ready)
6. Add unit tests for pricing validation
7. Set up monitoring alerts for 4xx/5xx errors

### **Low Priority**
8. Remove Ollama (unused, frees 2GB)
9. Update OpenAPI specs for new endpoints

---

## 📚 Documentation & Support

### **System Documentation**
- **Entry Protocol**: `.claude/INIT.md` (how to start/end sessions)
- **Project Context**: `.claude/PROJECT_CONTEXT.md` (architecture, state)
- **Handovers**: `.claude/handovers/` (category-specific guides)
- **Diaries**: `.claude/diaries/` (session logs with timestamps)

### **Technical Docs**
- **ADRs**: `docs/adr/` (Architecture Decision Records)
- **Setup Guides**: `docs/setup/` (Google Workspace, WhatsApp, etc.)
- **LLAMA 4 Fine-Tuning**: `docs/llama4/` (training guides, scripts)
- **Onboarding**: `docs/onboarding/` (AI-first onboarding system, 15/15 score)

### **Key Files to Check**
- `apps/webapp/js/api-config.js` → Frontend API endpoints
- `src/router.ts` → Backend routes & handler registry
- `apps/backend-rag 2/backend/app/main_cloud.py` → RAG production entry
- `Dockerfile.dist` → Backend Docker config (production)
- `package.json` → Dependencies & scripts

---

## 🌐 External Links

- **GitHub**: https://github.com/Balizero1987/nuzantara
- **WebApp Repo**: https://github.com/Balizero1987/zantara_webapp
- **Live WebApp**: https://zantara.balizero.com

---

## 📝 File Organization

**Root folder cleanup** (2025-10-11): 85 obsolete files moved to:
```
~/Desktop/NUZANTARA_OBSOLETE_FILES_2025-10-11/
├── session-reports/          # Completed session docs (10 files)
├── old-deploy-scripts/       # Legacy deploy scripts (6 files)
├── old-dockerfiles/          # Unused Dockerfiles (4 files)
├── draft-html/               # UI prototypes (12 files)
├── test-scripts/             # Old test scripts (4 files)
├── completed-migrations/     # Done tasks (4 files)
├── llama4-docs/              # LLAMA4 docs (8 files, see docs/llama4/)
├── old-architecture-docs/    # Superseded by .claude/ (7 files)
├── old-guides/               # Consolidated guides (13 files)
├── intel-scraping/           # Intel docs (6 files, see apps/bali-intel-scraper/)
├── misc/                     # Misc docs (9 files)
└── json-metadata/            # Training metadata (2 files)
```

**Root folder now contains only**:
- Essential config files (`.env.example`, `.gitignore`, `.dockerignore`, etc.)
- Build files (`Dockerfile`, `Dockerfile.dist`, `package.json`, `tsconfig.json`, etc.)
- CI/CD files (`.github/workflows/`, `cloudbuild-gateway.yaml`, etc.)
- Core scripts (`Makefile`, `jest.config.js`, `global.d.ts`)
- Critical scripts (`DEPLOY_NOW.sh`)
- New documentation system (`.claude/`, `docs/`)

---

## ⚡ Quick Commands

### **Start New Session**
```bash
cat .claude/INIT.md  # Read entry protocol
```

### **Check Production Status**
```bash
curl https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/health
curl https://zantara-rag-backend-himaadsxua-ew.a.run.app/health
```

### **Run Smoke Test**
```bash
./scripts/onboarding_smoke.sh
```

### **Deploy All Services**
```bash
git add . && git commit -m "your message" && git push origin main
# Triggers all GitHub Actions workflows
```

---

**System Version**: 1.1.0 (Post-Cleanup)
**Created**: 2025-10-11
**Maintained by**: Claude Code Sessions

For detailed architecture and current state, always check `.claude/PROJECT_CONTEXT.md` first.
