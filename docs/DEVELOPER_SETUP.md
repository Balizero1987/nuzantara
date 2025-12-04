# Developer Setup Guide

Guida completa per configurare l'ambiente di sviluppo NUZANTARA.

## Prerequisiti

### Software Richiesto

| Software | Versione | Note |
|----------|----------|------|
| Node.js | >= 18.x | LTS raccomandato |
| Python | >= 3.11 | Per backend-rag |
| pnpm | >= 8.x | Package manager (opzionale, npm funziona) |
| Docker | >= 24.x | Per servizi locali (Qdrant, Redis) |
| Git | >= 2.x | Version control |

### Verifica Installazione

```bash
node --version    # v18.x o superiore
python --version  # Python 3.11+
docker --version  # Docker 24.x+
git --version     # git 2.x+
```

---

## Quick Start (5 minuti)

### 1. Clone Repository

```bash
git clone https://github.com/Balizero1987/nuzantara.git
cd nuzantara
```

### 2. Setup Environment Variables

```bash
# Backend
cp apps/backend-rag/.env.example apps/backend-rag/.env

# Frontend
cp apps/webapp-next/.env.example apps/webapp-next/.env.local
```

**Variabili RICHIESTE (minimo per funzionare):**

```bash
# Backend (.env)
JWT_SECRET_KEY=your_secret_key_minimum_32_characters_here
API_KEYS=dev-api-key-12345
OPENAI_API_KEY=sk-your-openai-key
WHATSAPP_VERIFY_TOKEN=dev-verify-token
INSTAGRAM_VERIFY_TOKEN=dev-verify-token

# Frontend (.env.local)
NUZANTARA_API_URL=http://localhost:8000
NUZANTARA_API_KEY=dev-api-key-12345
```

### 3. Avvia Servizi Docker

```bash
# Avvia Qdrant (vector database)
docker-compose up -d qdrant

# Verifica che sia attivo
curl http://localhost:6333/health
```

### 4. Setup Backend

```bash
cd apps/backend-rag

# Crea virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# oppure: venv\Scripts\activate  # Windows

# Installa dipendenze
pip install -r requirements.txt

# Avvia server
uvicorn backend.app.main_cloud:app --reload --port 8000
```

### 5. Setup Frontend

```bash
cd apps/webapp-next

# Installa dipendenze
npm install

# Avvia dev server
npm run dev
```

### 6. Verifica

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Backend Docs: http://localhost:8000/docs
- Qdrant UI: http://localhost:6333/dashboard

---

## Struttura Progetto

```
nuzantara/
├── apps/
│   ├── backend-rag/           # Python FastAPI backend
│   │   ├── backend/
│   │   │   ├── app/           # FastAPI application
│   │   │   │   ├── main_cloud.py   # Entry point
│   │   │   │   ├── core/           # Config, health
│   │   │   │   ├── routers/        # API endpoints (25 router)
│   │   │   │   ├── modules/        # Domain modules (identity, knowledge)
│   │   │   │   └── models.py       # Pydantic models
│   │   │   ├── services/      # Business logic (60+ servizi)
│   │   │   ├── llm/           # LLM client wrappers
│   │   │   └── utils/         # Utilities
│   │   ├── tests/             # pytest tests
│   │   └── requirements.txt   # Python dependencies
│   │
│   └── webapp-next/           # Next.js 14 frontend
│       ├── src/
│       │   ├── app/           # Next.js App Router
│       │   │   ├── api/       # API routes (proxy)
│       │   │   ├── login/     # Login page
│       │   │   ├── chat/      # Chat interface
│       │   │   └── dashboard/ # Dashboard
│       │   ├── components/    # React components
│       │   ├── lib/
│       │   │   ├── api/       # API clients
│       │   │   │   ├── generated/  # OpenAPI client (auto-gen)
│       │   │   │   └── *.ts        # Manual API wrappers
│       │   │   └── store/     # Zustand stores
│       │   └── context/       # React contexts
│       └── package.json
│
├── docs/                      # Documentazione
├── config/                    # Config profiles
├── scripts/                   # Automation scripts
└── docker-compose.yml         # Local services
```

---

## Workflow di Sviluppo

### Backend (Python)

```bash
cd apps/backend-rag

# Attiva venv
source venv/bin/activate

# Avvia con hot-reload
uvicorn backend.app.main_cloud:app --reload --port 8000

# Esegui test
pytest tests/ -v

# Lint
ruff check backend/
black backend/ --check

# Type check
mypy backend/
```

### Frontend (Next.js)

```bash
cd apps/webapp-next

# Dev server
npm run dev

# Build production
npm run build

# Test
npm test

# Lint
npm run lint

# Type check
npx tsc --noEmit

# Rigenera client OpenAPI (dopo modifiche backend)
npm run generate:client
```

---

## API Development

### Aggiungere un Nuovo Endpoint Backend

1. **Crea router** in `apps/backend-rag/backend/app/routers/`:

```python
# my_feature.py
from fastapi import APIRouter, Depends
from pydantic import BaseModel

router = APIRouter(prefix="/api/my-feature", tags=["my-feature"])

class MyRequest(BaseModel):
    field: str

class MyResponse(BaseModel):
    result: str

@router.post("/action", response_model=MyResponse)
async def my_action(request: MyRequest):
    return MyResponse(result=f"Processed: {request.field}")
```

2. **Registra router** in `main_cloud.py`:

```python
from app.routers import my_feature
# ...
app.include_router(my_feature.router)
```

3. **Rigenera client frontend**:

```bash
cd apps/webapp-next
npm run generate:client
```

4. **Usa nel frontend**:

```typescript
import { client } from '@/lib/api/client';

const result = await client.myFeature.myActionApiMyFeatureActionPost({
  requestBody: { field: 'test' }
});
```

---

## Database & Servizi

### PostgreSQL (per CRM, Auth, Memory)

```bash
# Via Docker
docker-compose up -d postgres

# Connessione
psql postgresql://user:password@localhost:5432/nuzantara_dev
```

### Redis (per caching, sessioni)

```bash
# Via Docker
docker-compose up -d redis

# Test connessione
redis-cli ping
```

### Qdrant (Vector Database)

```bash
# Via Docker
docker-compose up -d qdrant

# UI Dashboard
open http://localhost:6333/dashboard

# API
curl http://localhost:6333/collections
```

---

## Debugging

### Backend Logs

```bash
# Con uvicorn
uvicorn backend.app.main_cloud:app --reload --log-level debug

# Filtra per modulo
LOG_LEVEL=DEBUG python -m uvicorn backend.app.main_cloud:app
```

### Frontend Debug

```typescript
// In browser console
localStorage.setItem('debug', 'nuzantara:*');

// In codice
console.log('[ChatClient]', data);
```

### API Testing

```bash
# Health check
curl http://localhost:8000/health

# Login
curl -X POST http://localhost:8000/api/auth/team/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "pin": "123456"}'

# Chat (con token)
curl "http://localhost:8000/bali-zero/chat-stream?query=hello" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Troubleshooting

### Errore: "JWT_SECRET_KEY must be set"

```bash
# Verifica .env
grep JWT_SECRET_KEY apps/backend-rag/.env

# Deve essere almeno 32 caratteri
JWT_SECRET_KEY=your_very_long_secret_key_at_least_32_chars
```

### Errore: "Cannot find module 'zustand'"

```bash
cd apps/webapp-next
rm -rf node_modules
npm install
```

### Errore: "Connection refused" su Qdrant

```bash
# Verifica che Docker sia attivo
docker ps | grep qdrant

# Se non c'e', avvialo
docker-compose up -d qdrant
```

### Errore: "422 Validation Error" su API

```bash
# Verifica il body della richiesta
# Esempio: createClient richiede created_by come query param
curl -X POST "http://localhost:8000/api/crm/clients?created_by=admin" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Test"}'
```

---

## Script Utili

```bash
# Root package.json scripts
npm run lint          # Lint tutto
npm run format        # Formatta codice
npm run typecheck     # TypeScript check
npm run test          # Test suite
npm run health-check  # Verifica backend

# Backend
npm run test:auto-generate  # Genera test automatici

# Documentazione
npm run docs:generate       # Genera docs da codice
```

---

## Risorse

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architettura sistema
- [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md) - Dettagli frontend
- [FULL_STACK_OBSERVABILITY.md](./FULL_STACK_OBSERVABILITY.md) - Monitoring
- [API Docs](http://localhost:8000/docs) - Swagger UI (quando backend attivo)

---

## Contatti

- **Repository**: https://github.com/Balizero1987/nuzantara
- **Issues**: https://github.com/Balizero1987/nuzantara/issues
