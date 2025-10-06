# 🚀 AI OPERATIONAL BOOTSTRAP - ZANTARA v5.4.0-tool-use

---

## 🎯 QUICK START (New CLI Session)

### **Step 1: Read Project Context**
```bash
cat .claude/PROJECT_CONTEXT.md
```
**Contains**: Architecture, deployment URLs, coordinates, current state

### **Step 2: Read Recent Sessions**
```bash
# Today's sessions
ls -lt .claude/diaries/$(date +%Y-%m-%d)_*.md

# Yesterday's sessions
ls -lt .claude/diaries/$(date -v-1d +%Y-%m-%d)_*.md
```
**Contains**: What was done in last sessions (all models)

### **Step 3: Start Working**
- System will auto-detect: Model, Date, Matricola
- System will ask: "Su cosa lavori?"
- System will read relevant handovers based on your task

---

## 📁 New Session System

All session tracking now in `.claude/` directory:

```
.claude/
├── PROJECT_CONTEXT.md          # WHO WE ARE (architecture, URLs)
├── README.md                   # How the system works
├── handovers/                  # Micro-categories (auto-created)
│   └── [category].md
└── diaries/                    # Session logs (1 per CLI per day)
    └── YYYY-MM-DD_model_mN.md
```

**See**: `.claude/README.md` for complete documentation

---

## 📋 Project Identity

**Name**: ZANTARA (NUZANTARA)
**Version**: v5.4.0-tool-use
**Location**: `/Users/antonellosiano/Desktop/NUZANTARA-2/`
**Repository**: https://github.com/Balizero1987/nuzantara
**Status**: Production (Cloud Run) + Local Development

---

## 🌐 Production Deployments

**TypeScript Backend**:
- URL: https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app
- Port: 8080
- Handlers: 107 RPC-style handlers via `/call` (104 core + 3 intel + tool proxy)
- Tool Use: Anthropic tool execution via `system.handler.execute` + handler proxy (41 tools live).

**Python RAG Backend**:
- URL: https://zantara-rag-backend-himaadsxua-ew.a.run.app
- Port: 8000
- AI: Anthropic Claude (Haiku/Sonnet routing)
- Memory: Phase 2 vector endpoints (`/api/memory/*`) with semantic + hybrid search (ensure `/api/memory/init` ran after deploy).

**Frontend**:
- Source: `apps/webapp/` (monorepo) → auto-sync → `Balizero1987/zantara_webapp`
- Live URL: https://zantara.balizero.com (GitHub Pages, auto-deploy ~3-4 min)
- Entry flow: `index.html` → redirect → `login.html`

---

## 🔧 Development Commands

### **TypeScript Backend**
```bash
npm run dev          # Local dev (port 8080)
npm run build        # Compile TypeScript
```

### **RAG Backend**
```bash
cd zantara-rag/backend
uvicorn app.main_integrated:app --port 8000 --reload
```

### **Docker Build & Deploy**
```bash
# TypeScript Backend
docker buildx build --platform linux/amd64 -f Dockerfile.dist \
  -t gcr.io/involuted-box-469105-r0/zantara-v520-nuzantara:TAG .

gcloud run deploy zantara-v520-nuzantara \
  --image gcr.io/.../zantara-v520-nuzantara:TAG \
  --region europe-west1 --port 8080

# RAG Backend
docker buildx build --platform linux/amd64 \
  -t gcr.io/involuted-box-469105-r0/zantara-rag-backend:TAG .

gcloud run deploy zantara-rag-backend \
  --image gcr.io/.../zantara-rag-backend:TAG \
  --region europe-west1 --port 8000
```

---

## 🔑 API Keys (Local Development)

### **TypeScript Backend** (`.env`)
```bash
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
COHERE_API_KEY=...
API_KEYS_INTERNAL=zantara-internal-dev-key-2025
API_KEYS_EXTERNAL=zantara-external-dev-key-2025
```

### **RAG Backend** (`zantara-rag/backend/.env`)
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 🗂️ Key Directories

```
NUZANTARA-2/
├── .claude/                  # Session system (diaries, handovers, context)
├── apps/
│   ├── backend-rag 2/backend/ # FastAPI RAG backend (ChromaDB, memory vector API)
│   └── webapp/                # Frontend synced to GitHub Pages
├── dist/                     # TypeScript compiled output
├── src/
│   └── handlers/             # 104 business logic handlers (RPC via /call)
├── middleware/               # Auth, monitoring, validation layers
├── scripts/                  # Deployment & maintenance automation
├── static/                   # Legacy static assets / redirects
└── .github/workflows/        # CI/CD (backend, RAG, webapp sync)
```

---

## 🤖 AI Models

| Model | Provider | Use Case | Cost |
|-------|----------|----------|------|
| Claude Haiku 3.5 | Anthropic | Fast responses | $0.25/1M input tokens |
| Claude Sonnet 4 | Anthropic | Complex analysis | $3.00/1M input tokens |
| Gemini Pro | Google | Alt LLM | Varies |
| Cohere | Cohere | Alt LLM | Varies |

**RAG Routing**: Query >30 words OR ["analyze","compare","legal"] → Sonnet, else Haiku

---

## 📊 Current State

**Last Deployment**: 2025-10-06 14:10 CET
**Backend**: ✅ v5.4.0-tool-use (Cloud Run latest; 107 handlers + Anthropic tool execution)
**RAG**: ✅ v2.4.0-tool-use (revision 00095-vd7, tool loop active)
**Tool Use Bridge**: ✅ RAG ↔ TS handler proxy online (41 tools).
**ChromaDB**: 7,564 docs, 91 MiB (`gs://nuzantara-chromadb-2025/chroma_db/`)
**Memory Phase 2**: ⚠️ `/api/memory/store` requires init (run `/api/memory/init` or ensure startup log `Memory vector collection prepared`).
**GitHub Pages**: ✅ Active (auto-sync via `sync-webapp-to-pages.yml`)
**Ollama**: Installed locally (unused; optional removal)

---

## 🚧 Pending Tasks

### High Priority
1. 🧠 Memory Phase 2: ensure `zantara_memories` collection initializes at startup (new `/api/memory/init` endpoint available).
2. ⚠️ Migrate API keys to Secret Manager (currently env vars on Cloud Run).
3. 🛰️ Enable GitHub Pages monitoring for sync workflow failures.

### Medium Priority
4. Expand tool registry beyond initial 41 handlers (TS ↔ RAG).
5. Add unit tests for pricing validation and memory handlers.
6. Set up monitoring & alerting for 4xx/5xx spikes.

### Low Priority
7. Remove Ollama (unused, frees ~2GB).
8. Update OpenAPI specs for new handlers/routes.

---

## 🔗 Important Files

When working, always check:
- `zantara_webapp/js/api-config.js` → Frontend API endpoints
- `dist/index.js:301` → Backend port config
- `zantara-rag/backend/app/main_simple.py` → RAG prod entry
- `Dockerfile.dist` → Backend Docker config

---

## 📚 Legacy Documentation

Old handover logs archived in:
- `archive/handovers-2025-10-01/`
- `HANDOVER_LOG.md` (185KB, archived)

**Use new system instead**: `.claude/diaries/` and `.claude/handovers/`

---

## ℹ️ More Info

- **Session System**: `.claude/README.md`
- **Project Details**: `.claude/PROJECT_CONTEXT.md`
- **Architecture**: See PROJECT_CONTEXT.md

---

**System Version**: 1.0.1 (Multi-CLI Session Tracking)
**Last Updated**: 2025-10-06 21:45 WITA (Tool use + memory init updates)
