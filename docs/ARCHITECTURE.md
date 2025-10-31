# ZANTARA System Architecture

## Overview
ZANTARA uses a dual-backend architecture with separated concerns:

```
┌─────────────────────────────────────────────────────────┐
│                   Webapp (GitHub Pages)                 │
│              https://zantara.balizero.com               │
└────────────────┬───────────────────────┬────────────────┘
                 │                       │
        ┌────────▼────────┐     ┌───────▼────────┐
        │  RAG Backend    │     │  TS Backend    │
        │   (Fly.io)      │     │  (Railway)     │
        │  Python/FastAPI │     │ Node.js/Express│
        └────────┬────────┘     └───────┬────────┘
                 │                       │
        ┌────────▼────────┐     ┌───────▼────────┐
        │   ChromaDB      │     │  Firebase DB   │
        │  (13K docs)     │     │   (team data)  │
        └─────────────────┘     └────────────────┘
```

## Components

### 1. RAG Backend (Python)
- **Location**: `apps/backend-rag/`
- **Hosting**: Fly.io
- **Purpose**: AI chat with RAG (Retrieval Augmented Generation)
- **Tech Stack**:
  - FastAPI
  - ChromaDB (vector database)
  - Claude Haiku 4.5
  - Sentence Transformers

### 2. TS Backend (Node.js)
- **Location**: `apps/backend-ts/`
- **Hosting**: Railway
- **Purpose**: Team management, authentication, Google integrations
- **Tech Stack**:
  - Express.js
  - Firebase Admin
  - Google APIs (Gmail, Drive, Calendar)
  - TypeScript

### 3. Webapp (Frontend)
- **Location**: `website/zantara webapp/`
- **Hosting**: GitHub Pages
- **Tech Stack**:
  - Vanilla JS
  - SSE (Server-Sent Events)
  - Custom ZANTARA theme

### 4. Intel Scraping Pipeline
- **Location**: `website/INTEL_SCRAPING/`
- **Purpose**: Automated knowledge base updates
- **Features**:
  - Parallel scraping (7 categories)
  - Auto-retry with exponential backoff
  - Quality validation (80% threshold)
  - Auto-commit & deploy

## Data Flow

### Chat Request Flow
1. User sends message via Webapp
2. Frontend calls RAG Backend via SSE
3. RAG Backend:
   - Queries ChromaDB for relevant docs
   - Sends context + query to Claude Haiku
   - Streams response back via SSE
4. Frontend displays response in real-time

### Knowledge Base Update Flow
1. Intel Scraping runs (manual or cron)
2. Scrapes latest data from sources
3. Processes and validates content
4. Updates ChromaDB embeddings
5. Syncs to Cloudflare R2
6. Fly.io downloads updated DB on next deploy

## Deployment

### RAG Backend
```bash
cd apps/backend-rag
fly deploy --remote-only
```

### TS Backend
```bash
cd apps/backend-ts
git push origin main  # Auto-deploys via Railway
```

### Webapp
```bash
cd website/zantara webapp
git push origin main  # Auto-deploys via GitHub Pages
```

## Monitoring
- **Fly.io**: `fly logs -a nuzantara-rag`
- **Railway**: `railway logs`
- **GitHub Pages**: GitHub Actions dashboard

