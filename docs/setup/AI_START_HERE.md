# 🚀 AI OPERATIONAL BOOTSTRAP - ZANTARA v5.2.0

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
**Version**: v5.2.0
**Location**: `/Users/antonellosiano/Desktop/NUZANTARA/`
**Status**: Production (Cloud Run) + Local Development

---

## 🌐 Production Deployments

**TypeScript Backend**:
- URL: https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app
- Port: 8080
- Handlers: 136 RPC-style handlers via `/call`

**Python RAG Backend**:
- URL: https://zantara-rag-backend-1064094238013.europe-west1.run.app
- Port: 8000
- AI: Anthropic Claude (Haiku/Sonnet routing)

**Frontend**:
- GitHub Pages: https://balizero1987.github.io/zantara_webapp
- Custom Domain: https://zantara.balizero.com (⚠️ not enabled yet)

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
NUZANTARA/
├── .claude/                 # 🆕 Session system (diaries, handovers)
├── dist/                    # TypeScript compiled
├── src/                     # TypeScript source
├── routes/                  # API routes
├── handlers/                # 136 business logic handlers
├── middleware/              # Auth, monitoring, validation
├── static/                  # Frontend HTML
├── zantara_webapp/          # GitHub Pages source
│   └── js/api-config.js     # **CRITICAL**: API endpoints
└── zantara-rag/
    └── backend/
        ├── app/             # FastAPI
        ├── services/        # ChromaDB, search
        ├── kb/              # 214 books, 239 PDFs
        └── data/chroma_db/  # 12,907 embeddings (325MB, local only)
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

**Last Deployment**: 2025-10-01 18:00
**Backend**: ✅ Healthy
**RAG**: ✅ Healthy
**ChromaDB**: 12,907 embeddings (local only)
**GitHub Pages**: ⚠️ Not enabled yet
**Ollama**: Installed but UNUSED (can remove, frees 2GB)

---

## 🚧 Pending Tasks

### High Priority
1. ⚠️ Enable GitHub Pages (manual: Settings → Pages → main branch)
2. ⚠️ Migrate API keys to Secret Manager

### Medium Priority
3. Add unit tests for pricing validation
4. Deploy ChromaDB to production
5. Set up monitoring alerts

### Low Priority
6. Remove Ollama (unused)
7. Update OpenAPI specs

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

**System Version**: 1.0.0 (Multi-CLI Session Tracking)
**Last Updated**: 2025-10-01 20:00
