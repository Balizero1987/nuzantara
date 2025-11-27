# ARCHITECTURE.md

## 1. High-Level Structure

The project is a **Monorepo** containing multiple applications and packages, managed via npm workspaces.

### Root Directory
- **`apps/`**: Contains the main applications.
- **`packages/`**: Shared libraries (if any).
- **`deploy/`**: Static deployment artifacts (likely for a landing page or documentation).
- **`scripts/`**: Global maintenance and analysis scripts.

### Key Applications (`apps/`)

| App Name | Path | Type | Description |
| :--- | :--- | :--- | :--- |
| **webapp** | `apps/webapp` | Frontend | Static SPA (Single Page Application) served via Nginx. |
| **backend-ts** | `apps/backend-ts` | Backend | Main application logic, Node.js + TypeScript + Express. |
| **backend-rag** | `apps/backend-rag` | Backend | AI/RAG service, Python + FastAPI + Qdrant. |
| **bali-intel-scraper** | `apps/bali-intel-scraper` | Service | Scraper service (likely Node.js). |
| **memory-service** | `apps/memory-service` | Service | Memory management service. |

---

## 2. Data Flow & Dependencies

### Data Flow Diagram (Conceptual)

```mermaid
graph TD
    User[User Browser] -->|HTTPS| Nginx[Webapp Nginx]
    Nginx -->|Static Files| User
    Nginx -->|/api/* Proxy| BackendRAG[Backend RAG (Python)]
    Nginx -->|/bali-zero/chat-stream Proxy| BackendRAG

    BackendTS[Backend TS (Node.js)] <-->|Internal API| BackendRAG
    BackendTS -->|DB Access| Postgres[(PostgreSQL)]
    BackendTS -->|Cache| Redis[(Redis)]

    BackendRAG -->|Vector Search| Qdrant[(Qdrant Cloud)]
    BackendRAG -->|LLM API| AI_Providers[OpenAI / Anthropic / Google]
```

### Critical Dependencies
- **Frontend -> Backend RAG**: The Nginx configuration explicitly proxies `/api/` and `/bali-zero/chat-stream` to `https://nuzantara-rag.fly.dev`.
- **Backend TS -> Database**: Uses Prisma for PostgreSQL interaction.
- **Backend RAG -> AI Services**: Heavily relies on external AI APIs and Qdrant for vector storage.

---

## 3. Technology Stack

### Frontend (`apps/webapp`)
- **Core**: HTML5, CSS3, JavaScript (Vanilla/ES6+).
- **Server**: Nginx (Alpine Slim).
- **Build**: Static file serving, no complex build step visible in Dockerfile.

### Backend TS (`apps/backend-ts`)
- **Runtime**: Node.js 20 (Alpine).
- **Language**: TypeScript.
- **Framework**: Express (inferred from `server.ts` usage).
- **ORM**: Prisma.
- **Build Tool**: `tsc` (TypeScript Compiler), `esbuild`.

### Backend RAG (`apps/backend-rag`)
- **Runtime**: Python 3.11 (Slim).
- **Framework**: FastAPI + Uvicorn.
- **AI/ML**: Qdrant Client, Sentence Transformers.
- **Package Manager**: pip (`requirements.txt`).

---

## 4. Known Issues & Risks

1.  **`fly.toml` Gitignored**: The `fly.toml` configuration files are present in `.gitignore` or effectively ignored. This is a **HIGH RISK** for deployment consistency. If the local file is lost, deployment configuration is lost.
2.  **Port Conflicts**: Both backends default to port `8080` internally. While Docker isolates them, confusion may arise during local development if not managed carefully.
3.  **Complex Monorepo Scripts**: The root `package.json` has many scripts, some of which might be obsolete or overlapping (e.g., `start` vs `start:dev`).
4.  **Hardcoded Proxies**: Nginx configuration hardcodes `https://nuzantara-rag.fly.dev`. This makes testing against a staging environment difficult without changing code.
