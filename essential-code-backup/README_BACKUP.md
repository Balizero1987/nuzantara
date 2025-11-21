# 📦 ZANTARA - Codice Essenziale per Analisi

**Data backup:** $(date +%Y-%m-%d)  
**Versione:** 1.0.0  
**Dimensione archivio:** ~3MB

---

## 📋 Contenuto del Backup

Questo archivio contiene il codice essenziale del progetto ZANTARA per l'analisi e la comprensione dell'architettura.

### 🏗️ Struttura

```
essential-code-backup/
├── README.md                    # Documentazione principale
├── package.json                 # Dipendenze Node.js
├── tsconfig.json                # Configurazione TypeScript
├── fly.toml                     # Configurazione Fly.io
├── docker-compose.yml           # Configurazione Docker
│
├── apps/
│   ├── backend-ts/              # Backend TypeScript (Fly.io)
│   │   └── src/                  # Codice sorgente completo
│   │       ├── routing/          # Router e endpoint API
│   │       ├── handlers/         # Handler per business logic
│   │       ├── services/         # Servizi (auth, memory, etc.)
│   │       ├── middleware/       # Middleware (CORS, auth, etc.)
│   │       └── core/             # Core system
│   │
│   ├── backend-rag/               # Backend Python RAG (Fly.io)
│   │   └── backend/              # Codice sorgente Python
│   │       ├── app/               # FastAPI application
│   │       ├── services/         # Servizi RAG e AI
│   │       ├── llm/               # AI clients (ZANTARA AI)
│   │       └── prompts/          # System prompts
│   │
│   └── webapp/                   # Frontend (GitHub Pages)
│       ├── js/                   # JavaScript modules
│       ├── css/                  # Stili
│       ├── chat.html             # Pagina chat principale
│       └── login.html             # Pagina login
│
└── docs/                         # Documentazione essenziale
```

---

## 🎯 Componenti Principali

### 1. **Backend TypeScript** (`apps/backend-ts/`)
- **Stack:** Node.js + Express + TypeScript
- **Deploy:** Fly.io (`nuzantara-backend.fly.dev`)
- **Funzioni:**
  - API RESTful per frontend
  - Gestione autenticazione (JWT, demo users)
  - Integrazione Google Workspace (Drive, Gmail, Calendar)
  - Sistema di handlers modulare
  - Memory service integration

### 2. **Backend RAG Python** (`apps/backend-rag/`)
- **Stack:** Python + FastAPI + Qdrant
- **Deploy:** Fly.io (`nuzantara-rag.fly.dev`)
- **Funzioni:**
  - RAG (Retrieval-Augmented Generation)
  - Chat streaming (SSE)
  - ZANTARA AI (configurable via env)
  - Knowledge base queries
  - Team member recognition

### 3. **Frontend Webapp** (`apps/webapp/`)
- **Stack:** Vanilla JavaScript + HTML/CSS
- **Deploy:** GitHub Pages (`zantara.balizero.com`)
- **Funzioni:**
  - Chat interface
  - Login/authentication
  - Real-time streaming
  - CRM integration
  - Collective memory

---

## 🔑 File Chiave da Analizzare

### Architettura
- `apps/backend-ts/src/routing/router.ts` - Router principale e endpoint
- `apps/backend-ts/src/server.ts` - Server setup e middleware
- `apps/backend-rag/backend/app/main_cloud.py` - FastAPI app principale

### AI & RAG
- `apps/backend-rag/backend/llm/zantara_ai_client.py` - ZANTARA AI client (PRIMARY)
- `apps/backend-rag/backend/services/intelligent_router.py` - AI routing logic
- `apps/backend-rag/backend/services/context/context_builder.py` - Context building

### Frontend
- `apps/webapp/js/app.js` - Main application logic
- `apps/webapp/js/zantara-client.js` - Chat client
- `apps/webapp/js/api-config.js` - API configuration

### Configurazione
- `apps/backend-ts/src/middleware/cors.ts` - CORS configuration
- `apps/backend-rag/backend/app/config.py` - RAG backend config
- `fly.toml` - Fly.io deployment config

---

## 🚀 Setup Locale

### Backend TypeScript
```bash
cd apps/backend-ts
npm install
npm run dev
```

### Backend RAG
```bash
cd apps/backend-rag
pip install -r requirements.txt
python -m backend.app.main_cloud
```

### Frontend
```bash
cd apps/webapp
# Serve con qualsiasi HTTP server
python -m http.server 8002
```

---

## 📊 Statistiche

- **Backend TypeScript:** ~327 file TypeScript
- **Backend RAG:** ~65 servizi Python
- **Frontend:** ~73 file JavaScript
- **Totale linee di codice:** ~50,000+

---

## 🔐 Note Sicurezza

⚠️ **IMPORTANTE:** Questo backup NON include:
- File `.env` o variabili d'ambiente
- Chiavi API o credenziali
- Database o dati sensibili
- `node_modules/` o dipendenze compilate

---

## 📞 Supporto

Per domande o chiarimenti sull'architettura:
- Repository: https://github.com/Balizero1987/nuzantara
- Live site: https://zantara.balizero.com

---

**Generato automaticamente dal sistema ZANTARA**

