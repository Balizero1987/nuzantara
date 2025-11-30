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
| **webapp-next** | `apps/webapp-next` | Frontend | Next.js 14 application with React Server Components. |
| **backend-rag** | `apps/backend-rag` | Backend | AI/RAG service, Python + FastAPI + Qdrant. |

---

## 2. Data Flow & Dependencies

### Data Flow Diagram (Conceptual)

```mermaid
graph TD
    User[User Browser] -->|HTTPS| WebApp[WebApp (Next.js)]
    WebApp -->|/api/*| BackendRAG[Backend RAG (Python)]

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
- **Frontend -> Backend RAG**: The Next.js application calls the `nuzantara-rag.fly.dev` API.
- **Backend RAG -> AI Services**: Heavily relies on external AI APIs and Qdrant for vector storage.
- **Jaksel AI System**: Multi-tier fallback system ensuring 99%+ uptime for personality responses.

---

## 5. Jaksel AI System Architecture

### Overview
Jaksel AI is a custom personality module for the Zantara AI system that provides casual, friendly responses using Jakarta Selatan (Jaksel) slang. It is designed to be model-agnostic, currently utilizing a robust fallback mechanism to ensure availability.

### Core Components

#### 5.1 SimpleJakselCallerHF
**Location**: `apps/backend-rag/backend/app/routers/simple_jaksel_caller.py`

**Features**:
- **Routing Logic**:
  1.  **Primary**: Hugging Face Inference API (Currently disabled due to model format mismatch).
  2.  **Ultimate Fallback**: **Gemini 2.5** with style-transfer system prompt.
- **Style Transfer**: Converts professional AI responses into Jaksel slang (e.g., "jujurly", "basically", "lo/gue").
- **No-Info Handling**: Translates standard "I don't know" responses into character-appropriate apologies.
- **User Mapping**: Only authorized users get Jaksel responses:
  ```python
  jaksel_users = {
      "anton@balizero.com": "Anton",
      "amanda@balizero.com": "Amanda",
      "krisna@balizero.com": "Krisna",
  }
  ```

#### 5.2 Integration Points
- **Called From**: `IntelligentRouter` (`stream_chat` and `route_chat`) when user is in `jaksel_users`.
- **Mechanism**: Post-processing of the standard AI response.
- **Response Format**:
  ```json
  {
    "success": true,
    "response": "Halo bro! Basically ini jawabannya...",
    "metadata": {
      "model_used": "gemini-2.5-flash",
      "style_applied": true,
      "fallback_active": true
    }
  }
  ```

### Deployment Details
- **Current Status**: **Active via Production Endpoint**.
- **Primary Endpoint**: `https://jaksel.balizero.com` (Oracle Cloud VM + Ollama).
- **Model**: `zantara:latest` (Gemma 9B Fine-tuned).
- **Fallback**: Gemini 2.5 Flash.
- **Health Monitoring**: Logs track success/failure rates and fallback activation.

---

## 4. Technology Stack

### Frontend (`apps/webapp-next`)
- **Framework**: Next.js 14
- **Language**: TypeScript
- **UI**: React, Tailwind CSS, shadcn/ui
- **State Management**: React Context / Zustand (TBD)
- **Package Manager**: npm

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
2.  **Complex Monorepo Scripts**: The root `package.json` has many scripts, some of which might be obsolete or overlapping (e.g., `start` vs `start:dev`).
