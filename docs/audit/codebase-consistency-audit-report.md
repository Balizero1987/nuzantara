# NUZANTARA - Audit Completo Coerenza Codebase

**Data**: 2025-12-04
**Versione**: v5.2.0
**Auditor**: Claude AI

---

## Executive Summary

Questo report presenta l'analisi completa della coerenza tra backend (Python/FastAPI) e webapp (Next.js/TypeScript) del progetto Nuzantara. L'audit ha identificato **7 problemi critici**, **12 problemi di media priorità** e **8 miglioramenti consigliati**.

### Stato Complessivo: 🟡 PARZIALMENTE COERENTE

| Area | Stato | Note |
|------|-------|------|
| Struttura Progetto | ✅ Eccellente | Monorepo ben organizzato |
| API Endpoints | 🟡 Parziale | Discrepanze nei parametri |
| Modelli Dati | 🟡 Parziale | Duplicazioni e inconsistenze |
| Configurazioni | 🟡 Parziale | Porte e URL non allineati |
| Dipendenze | ✅ Buono | Versioni controllate |
| Docker | 🟡 Parziale | Mismatch porte dev/prod |

---

## 1. Architettura del Progetto

### 1.1 Struttura Generale

```
nuzantara/
├── apps/
│   ├── backend-rag/          # Python 3.11 + FastAPI
│   ├── webapp-next/          # Next.js 14 + React 18 + TypeScript
│   ├── bali-intel-scraper/   # Scraper intelligence
│   ├── scraper/              # Web scraper legale
│   ├── evaluator/            # Quality evaluation
│   └── core/                 # Utilities (Scribe, Sentinel)
├── config/                   # Configurazioni globali
├── scripts/                  # Script automazione
├── docs/                     # Documentazione
└── docker-compose.yml        # Orchestrazione servizi
```

### 1.2 Stack Tecnologico

| Componente | Backend | Frontend |
|------------|---------|----------|
| **Runtime** | Python 3.11.9 | Node.js 20 |
| **Framework** | FastAPI 0.104.1 | Next.js 14.2.16 |
| **Type System** | Pydantic 2.5.0 | TypeScript 5.9.3 |
| **State Management** | N/A | Zustand |
| **UI Components** | N/A | Radix UI + shadcn/ui |
| **HTTP Client** | httpx 0.27.2 | Axios |
| **Database** | PostgreSQL + Qdrant | N/A (via API) |

---

## 2. Analisi Coerenza API

### 2.1 Endpoint Backend (165 totali)

| Router | Endpoint Count | Stato |
|--------|---------------|-------|
| `/api/auth` | 5 | ✅ Coerente |
| `/api/oracle` | 10 | ✅ Coerente |
| `/api/crm/clients` | 8 | 🔴 Problemi |
| `/api/crm/interactions` | 8 | 🟡 Parziale |
| `/api/crm/practices` | 8 | ✅ Coerente |
| `/api/memory` | 8 | 🟡 Non tutti usati |
| `/api/agents` | 16 | 🟡 Parziale |
| `/api/productivity` | 4 | 🟡 Parziale |
| `/bali-zero/conversations` | 4 | ✅ Coerente |
| Altri | ~94 | Vari |

### 2.2 Problemi Critici API

#### 🔴 CRITICO 1: Parametro Mancante POST /api/crm/clients

**Backend** (`crm_clients.py:93`):
```python
@router.post("/")
async def create_client(
    client: ClientCreate,
    created_by: str = Query(..., description="Team member email"),  # OBBLIGATORIO
    db: AsyncSession = Depends(get_db)
):
```

**Frontend** (`crm.ts:69`):
```typescript
export const createClient = async (client: Partial<CRMClient>) => {
  const res = await axios.post('/api/crm/clients', client)  // MANCA created_by!
  return res.data
}
```

**Impatto**: Errore 422 Validation Error alla creazione di clienti.

**Fix Richiesto**:
```typescript
export const createClient = async (client: Partial<CRMClient>, createdBy: string) => {
  const res = await axios.post(`/api/crm/clients?created_by=${encodeURIComponent(createdBy)}`, client)
  return res.data
}
```

---

#### 🔴 CRITICO 2: Metodo HTTP Errato per Update

**Backend** (`crm_clients.py`):
```python
@router.patch("/{client_id}")  # USA PATCH
async def update_client(...):
```

**Frontend** (`crm.ts`):
```typescript
const res = await axios.put(`/api/crm/clients/${id}`, ...)  // USA PUT
```

**Impatto**: Il server potrebbe non riconoscere la richiesta o comportarsi diversamente.

**Fix Richiesto**: Cambiare `axios.put` in `axios.patch`.

---

#### 🔴 CRITICO 3: SaveConversationRequest Discrepanza

**Backend** (`conversations.py`):
```python
class SaveConversationRequest(BaseModel):
    messages: list[dict]
    session_id: str | None = None
    metadata: dict | None = None
    # user_email RIMOSSO per sicurezza JWT
```

**Frontend Generated** (`SaveConversationRequest.ts`):
```typescript
export type SaveConversationRequest = {
    user_email: string;  // ESISTE NEL GENERATO!
    messages: Array<Record<string, any>>;
    session_id?: (string | null);
    metadata?: (Record<string, any> | null);
};
```

**Impatto**: Il frontend potrebbe inviare un campo che il backend ignora, o peggio, causare errori.

**Fix Richiesto**: Rigenerare i tipi TypeScript dal backend OpenAPI.

---

### 2.3 Problemi Medi API

| # | Problema | File | Severity |
|---|----------|------|----------|
| 1 | Trailing slash inconsistente `/api/crm/clients/` vs `/api/crm/clients` | crm.ts:46 | 🟡 |
| 2 | Mancano parametri `skip`/`limit` nel GET clients | crm.ts:44 | 🟡 |
| 3 | `team_member` non sempre fornito in POST interactions | zantara-integration.ts | 🟡 |
| 4 | Formato data inconsistente (ISO Z vs +00:00) | calendar.ts, productivity.py | 🟡 |

### 2.4 Endpoint Non Utilizzati nel Frontend

```
1. GET  /api/memory/similar          - Ricerca memorie simili
2. DELETE /api/memory/{memory_id}    - Elimina memoria
3. POST /api/productivity/gmail/draft - Bozze Gmail
4. GET  /api/productivity/drive/search - Ricerca Drive
5. GET  /api/oracle/personalities     - Selezione personalità
6. POST /api/oracle/personality/test  - Test personalità
7. GET  /api/agents/journey/{id}/next-steps - Prossimi step journey
8. POST /api/agents/research/autonomous - Ricerca autonoma
```

---

## 3. Analisi Coerenza Modelli Dati

### 3.1 Modelli Corrispondenti ✅

| Backend (Pydantic) | Frontend (TypeScript) | Stato |
|--------------------|----------------------|-------|
| `LoginRequest` | `LoginRequest` | ✅ Match |
| `LoginResponse` | `LoginResponse` | ✅ Match |
| `OracleQueryRequest` | `OracleQueryRequest` | ✅ Match |
| `OracleQueryResponse` | `OracleQueryResponse` | ✅ Match |
| `ClientResponse` | `ClientResponse` | ✅ Match |
| `SearchQuery` | `SearchQuery` | ✅ Match |
| `SearchResult` | `SearchResult` | ✅ Match |
| `TierLevel` | `TierLevel` | ✅ Match |
| `ChunkMetadata` | `ChunkMetadata` | ✅ Match |

### 3.2 Modelli con Discrepanze 🔴

#### UserProfile Duplicato

**Versione 1** (`auth.py`):
```python
class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    role: str
    status: str
    metadata: dict[str, Any] | None = None
    language_preference: str | None = None
```

**Versione 2** (`oracle_universal.py`):
```python
class UserProfile(BaseModel):
    user_id: str           # DIVERSO: id vs user_id
    email: str
    name: str
    language: str          # DIVERSO: language_preference vs language
    tone: str              # NUOVO
    complexity: str        # NUOVO
    timezone: str          # NUOVO
    role_level: str        # NUOVO
    meta_json: dict        # DIVERSO: metadata vs meta_json
```

**Impatto**: Due modelli UserProfile incompatibili, confusione nel frontend.

**Fix Richiesto**: Unificare in un singolo modello in `models.py`.

---

#### Message/ChatMessage Mancante nel Backend

**Frontend** (`chat-store.ts`):
```typescript
export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  metadata?: {
    memory_used?: boolean
    rag_sources?: Array<{...}>
    intent?: string
    model_used?: string
    execution_time_ms?: number
  }
}
```

**Backend**: Usa `list[dict]` generico, nessuna validazione schema.

**Fix Richiesto**: Creare modello Pydantic `ChatMessage`.

---

### 3.3 Naming Convention Mismatch

| Contesto | Backend | Frontend Custom | Problema |
|----------|---------|-----------------|----------|
| Timestamps | `created_at` | `createdAt` | camelCase vs snake_case |
| Timestamps | `updated_at` | `updatedAt` | camelCase vs snake_case |
| CRM | `client_id` | `clientId` | camelCase vs snake_case |
| CRM | `client_name` | `clientName` | camelCase vs snake_case |

**Nota**: I modelli generati mantengono snake_case (coerente). Il problema è nei tipi scritti manualmente in `/lib/api/types.ts` e `/lib/store/chat-store.ts`.

### 3.4 Modelli Mancanti nel Frontend

```
- InteractionCreate
- InteractionResponse
- EmbedRequest
- EmbedResponse
- StoreMemoryRequest
- SearchMemoryRequest
- MemorySearchResponse
- HealthResponse
```

---

## 4. Analisi Configurazioni

### 4.1 Variabili d'Ambiente

#### Discrepanze URL Backend

| File | Variabile | Valore |
|------|-----------|--------|
| Root `.env.example` | `RAG_BACKEND_URL` | `https://nuzantara-rag.fly.dev` |
| Backend `.env.example` | `TS_BACKEND_URL` | `https://nuzantara-backend.fly.dev` |
| Frontend constants.ts | default | `https://nuzantara-rag.fly.dev` |

**Problema**: Due URL Fly.io diverse (`nuzantara-rag` vs `nuzantara-backend`). Non è chiaro quale sia l'URL principale.

#### Discrepanze Porte

| Componente | docker-compose | Fly.io | Dockerfile |
|------------|---------------|--------|------------|
| Backend | 8000 | 8080 | 8080 |
| Frontend | N/A | 3000 | 3000 |
| Qdrant | 6333 | cloud | N/A |

**Problema**: Docker-compose usa porta 8000, Fly.io usa 8080. Comportamento diverso tra sviluppo e produzione.

### 4.2 Frontend .env.example Incompleto

**Attuale** (11 righe):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_KEY=your-api-key
NUZANTARA_API_URL=http://localhost:8000
```

**Mancanti**:
```bash
NUZANTARA_API_KEY=           # Usato in route.ts
NEXT_PUBLIC_GOOGLE_AI_API_KEY=  # Usato in Dockerfile
```

### 4.3 Docker Configuration

#### docker-compose.yml

```yaml
services:
  backend:
    ports: "8000:8000"       # DIVERSO da Fly.io (8080)
    environment:
      PORT: 8000             # Override default
      QDRANT_URL: http://qdrant:6333
```

#### Backend Dockerfile

```dockerfile
EXPOSE 8080                   # Hardcoded 8080
ENV PORT=${PORT:-8080}        # Default 8080
```

**Conflitto**: Docker-compose override a 8000, ma Dockerfile e Fly.io usano 8080.

---

## 5. Analisi Dipendenze

### 5.1 Backend Python (95+ packages)

**Versioni Critiche Pinnate** ✅:
```
fastapi==0.104.1
pydantic==2.5.0
openai==1.55.0
anthropic==0.7.8
httpx==0.27.2
```

**Potenziali Conflitti Risolti**:
- `protobuf` rimosso per conflitto con `google-cloud-aiplatform`
- `httpx` pinnato per compatibilità con `openai`

### 5.2 Frontend Node.js

**Problema Identificato**:

```json
// webapp-next/package.json
{
  "axios": "latest"  // 🔴 PROBLEMATICO: versione floating
}

// root package.json
{
  "axios": "^1.12.2"  // ✅ Versione specifica
}
```

**Impatto**: Build non deterministici, potenziali breaking changes inattesi.

**Fix Richiesto**:
```json
"axios": "^1.12.2"
```

### 5.3 Inconsistenza @types/node

| File | Versione |
|------|----------|
| Root package.json | `@types/node": "^24.10.0"` |
| webapp-next package.json | `@types/node": "^22"` |

---

## 6. Riepilogo Problemi per Priorità

### 🔴 CRITICI (7)

| # | Problema | File Interessati |
|---|----------|------------------|
| 1 | Manca `created_by` in POST /api/crm/clients | crm.ts, crm_clients.py |
| 2 | PUT vs PATCH per update CRM | crm.ts |
| 3 | SaveConversationRequest `user_email` discrepanza | conversations.py, generated TS |
| 4 | UserProfile duplicato con campi diversi | auth.py, oracle_universal.py |
| 5 | Porte inconsistenti 8000 vs 8080 | docker-compose.yml, fly.toml |
| 6 | URL Backend ambigue (2 URL diverse) | .env.example files |
| 7 | `axios: latest` versione floating | webapp-next/package.json |

### 🟡 MEDI (12)

| # | Problema |
|---|----------|
| 1 | Trailing slash inconsistente |
| 2 | Mancano parametri skip/limit |
| 3 | team_member non sempre fornito |
| 4 | Formato data ISO inconsistente |
| 5 | Message senza modello Pydantic |
| 6 | CRMContext solo nel frontend |
| 7 | camelCase vs snake_case nei tipi custom |
| 8 | Frontend .env.example incompleto |
| 9 | @types/node versioni diverse |
| 10 | Modelli mancanti nel frontend |
| 11 | next.config.mjs senza proxy config |
| 12 | Docker healthcheck mancante per frontend |

### 🟢 MIGLIORAMENTI (8)

| # | Suggerimento |
|---|--------------|
| 1 | Documentare tutti gli endpoint non utilizzati |
| 2 | Aggiungere validazione ChatMessage nel backend |
| 3 | Creare script per rigenerare tipi TS |
| 4 | Unificare configurazione porte |
| 5 | Documentare architettura Fly.io |
| 6 | Aggiungere E2E test per API critiche |
| 7 | Implementare API versioning |
| 8 | Creare schema JSON condiviso |

---

## 7. Piano di Remediation

### Fase 1: Fix Critici (Immediato)

```bash
# 1. Fix crm.ts - Aggiungere created_by
# 2. Fix crm.ts - Cambiare PUT in PATCH
# 3. Rigenerare tipi TypeScript
# 4. Unificare UserProfile in models.py
# 5. Standardizzare porte (scegliere 8000 o 8080)
# 6. Documentare URL backend principale
# 7. Pinnare axios a versione specifica
```

### Fase 2: Fix Medi (1 settimana)

```bash
# 1. Normalizzare naming convention
# 2. Aggiungere modelli mancanti
# 3. Completare .env.example
# 4. Aggiungere ChatMessage Pydantic
# 5. Configurare next.config.mjs proxy
```

### Fase 3: Miglioramenti (Ongoing)

```bash
# 1. Documentazione API completa
# 2. Test di integrazione
# 3. CI/CD per validazione tipi
# 4. Schema sharing mechanism
```

---

## 8. Conclusioni

Il codebase Nuzantara presenta una struttura ben organizzata con separazione chiara tra frontend e backend. Tuttavia, sono stati identificati problemi di coerenza che richiedono attenzione:

1. **API**: Parametri mancanti e metodi HTTP errati possono causare errori runtime
2. **Modelli**: Duplicazioni e inconsistenze nei tipi richiedono unificazione
3. **Configurazioni**: Porte e URL non allineati tra ambienti
4. **Dipendenze**: Versioning floating da correggere

**Raccomandazione**: Prioritizzare i fix critici prima del prossimo deploy in produzione.

---

## Appendice A: File Analizzati

### Backend
- `/apps/backend-rag/backend/app/main_cloud.py`
- `/apps/backend-rag/backend/app/models.py`
- `/apps/backend-rag/backend/app/routers/*.py` (26 file)
- `/apps/backend-rag/backend/app/services/*.py` (54 file)
- `/apps/backend-rag/backend/app/core/config.py`
- `/apps/backend-rag/requirements.txt`
- `/apps/backend-rag/Dockerfile`
- `/apps/backend-rag/fly.toml`
- `/apps/backend-rag/.env.example`

### Frontend
- `/apps/webapp-next/src/lib/api/*.ts`
- `/apps/webapp-next/src/lib/store/*.ts`
- `/apps/webapp-next/src/app/api/**/*.ts`
- `/apps/webapp-next/src/types/*.ts`
- `/apps/webapp-next/package.json`
- `/apps/webapp-next/Dockerfile`
- `/apps/webapp-next/fly.toml`
- `/apps/webapp-next/.env.example`

### Root
- `/docker-compose.yml`
- `/.env.example`
- `/package.json`
- `/pnpm-workspace.yaml`

---

*Report generato automaticamente - Nuzantara Codebase Audit v1.0*
