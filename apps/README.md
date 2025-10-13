# NUZANTARA Apps

## 🎯 Core Applications

### backend-api
**TypeScript Express API** with 96 handlers

- **Port**: 8080
- **Tech**: Express.js, Firebase, Google Workspace APIs
- **Deploy**: Cloud Run (AMD64)
- **Handlers**: AI services, Google Workspace, Memory, Analytics, Bali Zero
- **URL**: https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app

```bash
cd apps/backend-api
npm install
npm run dev
```

### backend-rag
**Python FastAPI RAG** with ChromaDB

- **Port**: 8000
- **Tech**: FastAPI, ChromaDB, Cohere re-ranker
- **Deploy**: Cloud Run (AMD64) ← **PRIORITY**
- **Features**: 229 docs, pricing service, query routing
- **URL**: https://zantara-rag-backend-himaadsxua-ew.a.run.app

```bash
cd apps/backend-rag/backend
pip install -r requirements.txt
uvicorn app.main_cloud:app --reload
```

### webapp
**Frontend** - vanilla JS

- **Tech**: HTML/CSS/JS (no framework)
- **Deploy**: GitHub Pages
- **URL**: https://zantara.balizero.com

```bash
cd apps/webapp
npm run serve
```

### landing
**Landing page** (future)

---

## 🔧 Supporting Apps

### orchestrator
**Integration Orchestrator** - Microservice for job management

- **Port**: 3000
- **Tech**: TypeScript, Express
- **Features**: Post-processing, job executor, registry

```bash
cd apps/orchestrator
npm install
npm run dev
```

### workspace-addon
**Google Workspace Add-on** - ZANTARA integration

- **Tech**: Google Apps Script
- **Deploy**: clasp
- **Features**: Gmail, Calendar, Drive integration

```bash
cd apps/workspace-addon
npm run deploy
```

### dashboard
**Operations Dashboard** - Monitoring UI

- **Tech**: Vanilla JS
- **Port**: 8001
- **Features**: Real-time metrics, logs viewer

```bash
cd apps/dashboard
npm start
```

### landing
**Landing Page** - Product overview (planned)

- **Status**: 🚧 Not implemented
- **Tech**: Next.js (planned)

---

## 🚧 Future Apps

- `brain/` - AI orchestrator (planned)

---

**Last Updated**: 2025-10-04
