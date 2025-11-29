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

    %% Jaksel AI System
    BackendRAG -->|Jaksel Users Only| JakselSystem[Jaksel AI System]
    JakselSystem -->|Primary| HF_Inference[Hugging Face Inference API]
    JakselSystem -->|Fallback 1| HF_Spaces[Hugging Face Spaces]
    JakselSystem -->|Fallback 2| OllamaTunnel[Ollama via Tunnel]
    JakselSystem -->|Fallback 3| OllamaLocal[Local Ollama]
    JakselSystem -->|Italian Queries| TranslationLayer[Translation Layer ID→IT]
```

### Critical Dependencies
- **Frontend -> Backend RAG**: The Nginx configuration explicitly proxies `/api/` and `/bali-zero/chat-stream` to `https://nuzantara-rag.fly.dev`.
- **Backend TS -> Database**: Uses Prisma for PostgreSQL interaction.
- **Backend RAG -> AI Services**: Heavily relies on external AI APIs and Qdrant for vector storage.
- **Jaksel AI System**: Multi-tier fallback system ensuring 99%+ uptime for personality responses.

---

## 5. Jaksel AI System Architecture

### Overview
Jaksel AI is a custom Gemma 9B model fine-tuned with Jakarta Selatan personality, providing casual and friendly responses with Indonesian slang. The system includes automatic translation capabilities for Italian queries.

### Core Components

#### 5.1 SimpleJakselCallerTranslation
**Location**: `apps/backend-rag/backend/app/routers/simple_jaksel_caller_translation.py`

**Features**:
- **Multi-level Fallback System**:
  1. **Primary**: Hugging Face Inference API (`api-inference.huggingface.co`)
  2. **Fallback 1**: Hugging Face Spaces (`zeroai87-jaksel-ai.hf.space`)
  3. **Fallback 2**: Ollama via Tunnel (`jaksel-ollama.nuzantara.com`)
  4. **Fallback 3**: Local Ollama (`127.0.0.1:11434`)

- **Translation Layer**: Automatic Indonesian → Italian translation for Italian queries
- **User Mapping**: Only authorized users get Jaksel responses:
  ```python
  jaksel_users = {
      "anton@balizero.com": "Anton",
      "amanda@balizero.com": "Amanda",
      "krisna@balizero.com": "Krisna",
  }
  ```

#### 5.2 Integration Points
- **Called From**: `oracle_universal.py` when user is in jaksel_users mapping
- **API Endpoint**: `/api/oracle/universal-chat` in backend-rag
- **Response Format**:
  ```json
  {
    "success": true,
    "response": "Jaksel-style response (translated if needed)",
    "model_used": "huggingface-jaksel-ai",
    "connected_via": "huggingface-inference-api",
    "translated": true
  }
  ```

#### 5.3 Language Support
- **Native**: Bahasa Indonesia with Jakarta Selatan slang
- **Translated**: Automatic translation to Italian for Italian queries
- **Preserved**: Jaksel personality maintained in all languages

### Deployment Details
- **Hugging Face Model**: `zeroai87/jaksel-ai` (Gemma 9B fine-tuned)
- **Production Status**: ✅ Deployed and active on Fly.io
- **Health Monitoring**: Logs track success/failure rates and response times
- **Error Handling**: Graceful fallback to professional responses if all endpoints fail

---

## 4. Technology Stack

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
- **AI Providers**: OpenAI, Anthropic, Google Gemini, **Jaksel AI (Hugging Face)**.
- **Special Features**:
  - **Jaksel AI System**: Custom Gemma 9B model fine-tuned with Jakarta Selatan personality
  - **Multi-level Fallback**: HF Inference API → Tunnel Endpoints → Local Ollama
  - **Translation Layer**: Automatic Indonesian → Italian translation for Italian queries
  - **Personality Integration**: Users in jaksel_users mapping get Jaksel-style responses

---

## 6. Observability & Automation

The project employs a "Full-Stack Observability" approach, ensuring health and consistency across Backend, Frontend, and API Contracts.

- **Detailed Documentation:** [FULL_STACK_OBSERVABILITY.md](./FULL_STACK_OBSERVABILITY.md)
- **Key Components:**
    - **Backend Sentinel:** `apps/core/sentinel.py`
    - **Frontend Sentinel:** `apps/core/sentinel_frontend.py`
    - **Contract Sentinel:** `apps/core/sentinel_contract.py`
    - **The Scribe:** Automated documentation generation.

---

## 7. Known Issues & Risks

1.  **`fly.toml` Gitignored**: The `fly.toml` configuration files are present in `.gitignore` or effectively ignored. This is a **HIGH RISK** for deployment consistency. If the local file is lost, deployment configuration is lost.
2.  **Port Conflicts**: Both backends default to port `8080` internally. While Docker isolates them, confusion may arise during local development if not managed carefully.
3.  **Complex Monorepo Scripts**: The root `package.json` has many scripts, some of which might be obsolete or overlapping (e.g., `start` vs `start:dev`).
4.  **Hardcoded Proxies**: Nginx configuration hardcodes `https://nuzantara-rag.fly.dev`. This makes testing against a staging environment difficult without changing code.
