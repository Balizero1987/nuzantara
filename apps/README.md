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

## 🚧 Supporting Apps (Future)

- `orchestrator/` - Integration orchestrator
- `workspace-addon/` - Google Workspace Add-on
- `dashboard/` - Ops monitoring
- `brain/` - AI orchestrator

---

**Last Updated**: 2025-10-04
