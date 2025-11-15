# NUZANTARA - QUICK REFERENCE MAP

## File Service Mapping (Fly.io Correlation)

### PRODUCTION APPS ON FLY.IO

| Service | Directory | Fly.io App | Port | Tech | Entry Point |
|---------|-----------|-----------|------|------|-------------|
| Backend RAG | `apps/backend-rag/` | `nuzantara-rag` | 8000 | Python/FastAPI | `backend/app/main_cloud.py` |
| Backend API | `apps/backend-ts/` | `nuzantara-backend` | 8080 | Node/TypeScript | `src/server.ts` |
| Frontend | `apps/webapp/` | GitHub Pages | - | Vite/Vanilla JS | `index.html` |
| Docs | `apps/publication/` | Cloudflare Pages | - | Astro | `src/` |

### MICROSERVICES (Local/Docker)

| Service | Directory | Purpose | Tech | Port |
|---------|-----------|---------|------|------|
| Memory Service | `apps/memory-service/` | Distributed memory management | Node/TS | Variable |
| Intelligence Scraper | `apps/bali-intel-scraper/` | Web data scraping | Python | N/A |
| Dashboard | `apps/dashboard/` | Monitoring & analytics UI | Vanilla JS | N/A |
| Qdrant Service | `apps/qdrant-service/` | Vector search DB | Docker | 6333 |
| Vibe Dashboard | `apps/vibe-dashboard/` | Proto dashboard | WIP | - |
| Webapp Next | `apps/webapp-next/` | Frontend prototype | Next.js | - |

### INFRASTRUCTURE SERVICES (Docker)

| Service | Type | Port | Role |
|---------|------|------|------|
| PostgreSQL | postgres:15-alpine | 5432 | Primary database |
| Redis | redis:7-alpine | 6379 | Cache & session store |
| ChromaDB | chromadb:latest | 8000 | Vector embeddings |
| pgAdmin | pgAdmin4 | 5050 | Database UI |

---

## KEY TERMINOLOGY MAPPING

- **nuzantara-memory** → `apps/memory-service/` (microservice, not on Fly.io)
- **nuzantara-postgres** → PostgreSQL Docker container in `docker-compose.yml`
- **bali-zero-db** → Generic reference to PostgreSQL + Redis + ChromaDB stack
- **nuzantara-rag** → `apps/backend-rag/` (main Python FastAPI app on Fly.io)
- **nuzantara-backend** → `apps/backend-ts/` (TypeScript Express app on Fly.io)

---

## DIRECTORY STRUCTURE AT A GLANCE

```
/home/user/nuzantara/
├── apps/                    # 10 applications
│   ├── backend-ts/          → Fly.io: nuzantara-backend
│   ├── backend-rag/         → Fly.io: nuzantara-rag  
│   ├── memory-service/      → Microservice (Docker)
│   ├── webapp/              → Fly.io: GitHub Pages
│   ├── publication/         → Cloudflare Pages
│   ├── bali-intel-scraper/  → Python scraper
│   ├── dashboard/           → Dashboard UI
│   ├── qdrant-service/      → Vector DB
│   ├── vibe-dashboard/      → Proto (WIP)
│   └── webapp-next/         → Proto (WIP)
├── .github/workflows/       # CI/CD automation
├── monitoring/              # Prometheus + Grafana + Loki
├── docs/                    # Documentation
├── config/                  # Global config
├── docker-compose.yml       # Local orchestration
├── fly.toml                 # nuzantara-rag config
└── CODEBASE_STRUCTURE_MAP.md # FULL DOCUMENTATION (THIS FILE!)
```

---

## QUICK DEPLOY COMMANDS

```bash
# Deploy both Fly.io apps
cd apps/backend-ts && flyctl deploy --app nuzantara-backend
cd ../backend-rag && flyctl deploy --app nuzantara-rag

# View logs
flyctl logs --app nuzantara-backend
flyctl logs --app nuzantara-rag

# Local dev (all services)
docker-compose up -d

# Check service status
flyctl status --app nuzantara-backend
flyctl status --app nuzantara-rag
```

---

## FLY.IO ENV VARS BY APP

### nuzantara-backend (PORT=8080)
```
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
RAG_BACKEND_URL=https://nuzantara-rag.fly.dev
LOG_LEVEL=info
```

### nuzantara-rag (PORT=8000)
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
EMBEDDING_MODEL=text-embedding-3-small
CHROMA_DB_PATH=/data/chroma_db_FULL_deploy
```

---

## SERVICES INTERACTION DIAGRAM

```
┌──────────────────────────────────────────────────────┐
│                  ZANTARA ARCHITECTURE                │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Frontend (GitHub Pages)                            │
│  ↓                                                   │
│  webapp/ → nuzantara-backend (TS) ↔ PostgreSQL      │
│            ↓         ↓        ↓      ↓              │
│            RAG  Cache(Redis) Memory  ChromaDB       │
│            ↓                                         │
│  nuzantara-rag (Python FastAPI) ↔ Llama/Claude AI  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## IMPORTANT FILES LOCATIONS

| File | Location | Purpose |
|------|----------|---------|
| Backend Config | `apps/backend-ts/src/config/` | Express config |
| RAG Config | `apps/backend-rag/backend/app/config.py` | FastAPI config |
| Docker Compose | `/docker-compose.yml` | Local services |
| Fly.io Config (RAG) | `/fly.toml` | nuzantara-rag deployment |
| Fly.io Config (TS) | `apps/backend-ts/fly.toml` | nuzantara-backend deployment |
| GitHub Workflows | `.github/workflows/` | CI/CD pipelines |
| Environment Defaults | `.env.safe` | Default environment |

---

## FULL DOCUMENTATION

See **CODEBASE_STRUCTURE_MAP.md** for complete details:
- All 60+ services in backend-ts
- All 23 routers in backend-rag
- Complete dependency lists
- Integration patterns
- Deployment strategies
- Monitoring & logging setup

**File:** `/home/user/nuzantara/CODEBASE_STRUCTURE_MAP.md`

---

Generated: November 15, 2025  
Updated: Claude Code (Anthropic)
