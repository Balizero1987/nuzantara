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
**Status**: ✅ ACTIVE (Production - Official Voice)

Jaksel is the **official personality layer** for ALL Zantara responses. It provides casual, friendly responses using Jakarta Selatan (Jaksel) slang, adapted to the user's language (190+ languages supported).

### Architecture Flow

```
User Query
    ↓
┌─────────────────────────────────────┐
│   Jaksel reads query (context only) │  ← Extracts: language, tone, style
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   Gemini 2.5 Flash elaborates       │  ← RAG + reasoning (simple or complex)
│   response                           │
└─────────────────────────────────────┘
    ↓
    Professional answer from Gemini
    ↓
┌─────────────────────────────────────┐
│   Jaksel receives Gemini response    │
│   Applies: tone + personality        │  ← Gemma 9B via Oracle Cloud
│   Adapts to user's language          │
└─────────────────────────────────────┘
    ↓
    Final response with Jaksel style
```

### Core Components

#### 5.1 SimpleJakselCallerHF
**Location**: `apps/backend-rag/backend/app/routers/simple_jaksel_caller.py`

**Features**:
- **Context Analysis**: `analyze_query_context()` - Reads user query to extract language, formality, tone (NO response generation)
- **Style Application**: `apply_jaksel_style()` - Receives Gemini response and applies Jaksel personality + adapts language
- **Multilingual Support**: Detects and adapts to 190+ languages while maintaining Jaksel personality
- **Style Transfer**: Converts professional AI responses into Jaksel slang (e.g., "basically", "literally", "which is")
- **No-Info Handling**: Translates standard "I don't know" responses into character-appropriate apologies
- **Universal Activation**: Applied to ALL users (no whitelist)

#### 5.2 Integration Points
- **Called From**: `IntelligentRouter` (`stream_chat` and `route_chat`) - **ALWAYS** applied
- **Mechanism**: Two-step process:
  1. Context extraction from user query
  2. Post-processing of Gemini response with Jaksel personality
- **Response Format**:
  ```json
  {
    "success": true,
    "response": "Ciao! Praticamente, il contratto è basically un documento legale...",
    "language": "it",
    "model_used": "gemma-9b-jaksel",
    "connected_via": "https://jaksel.balizero.com"
  }
  ```

### Deployment Details
- **Current Status**: **Active via Production Endpoint**.
- **Primary Endpoint**: `https://jaksel.balizero.com` (Oracle Cloud VM + Ollama).
- **Model**: `zantara:latest` (Gemma 9B Fine-tuned - Sahabat AI → Jaksel custom).
- **Fallback**: Gemini 2.5 Flash with style-transfer prompt.
- **Health Monitoring**: Logs track success/failure rates and fallback activation.
- **Configuration**: Centralized in `apps/backend-rag/backend/app/core/config.py`:
  - `jaksel_oracle_url`: Production endpoint
  - `jaksel_tunnel_url`: Backup tunnel
  - `jaksel_enabled`: Feature flag

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

## 3. Qdrant Vector Database Structure

### Overview
The platform uses **Qdrant Cloud** as the vector database for RAG (Retrieval-Augmented Generation). All collections use **OpenAI text-embedding-3-small** embeddings (1536 dimensions) with **Cosine similarity**.

### Document Structure

Each document in Qdrant follows this structure:

```json
{
  "id": "uuid-or-number",
  "vector": [1536 float values],
  "payload": {
    "text": "chunk content...",
    "metadata": {}
  }
}
```

### Collections Overview

| Collection | Documents | Purpose | Metadata Structure |
|------------|-----------|---------|-------------------|
| `bali_zero_pricing` | 29 | Service pricing information | Empty `{}` - data in text |
| `bali_zero_team` | 43 | Team member profiles | **Rich structured** (26 fields) |
| `visa_oracle` | 1,612 | Visa and immigration regulations | Empty `{}` - JSON in text |
| `kbli_unified` | 8,886 | Business classification codes (KBLI) | Empty `{}` - Markdown in text |
| `tax_genius` | 895 | Indonesian tax regulations | Empty `{}` - Structured text |
| `legal_unified` | 5,041 | Indonesian laws and regulations | Empty `{}` - Legal text chunks |
| `knowledge_base` | 8,923 | General knowledge base | Empty `{}` - Mixed content |
| `property_unified` | 29 | Property and real estate info | Empty `{}` - Property descriptions |

**Total Documents**: ~25,458

### Metadata Structure: `bali_zero_team`

The `bali_zero_team` collection is unique with rich structured metadata:

```json
{
  "id": "dewaayu",
  "name": "Dewa Ayu",
  "email": "dewa.ayu.tax@balizero.com",
  "role": "Tax Lead",
  "department": "tax",
  "team": "tax",
  "age": 24,
  "religion": "Hindu",
  "languages": ["id", "ban"],
  "preferred_language": "id",
  "expertise_level": "advanced",
  "pin": "259176",
  "traits": ["sweet", "social"],
  "notes": "Balinese tax lead who loves TikTok...",
  "location": "Bali",
  "emotional_preferences": {
    "tone": "friendly_helpful",
    "formality": "medium",
    "humor": "light"
  }
}
```

### Other Collections: Data in Text

Most collections store structured data **within the text content** rather than metadata:

- **`visa_oracle`**: Contains JSON structures in text (visa types, requirements, fees)
- **`kbli_unified`**: Markdown-formatted business codes with descriptions
- **`tax_genius`**: Structured tax tables and regulations in text
- **`legal_unified`**: Legal text chunks (shortest average: 237 chars)

### Chunk Statistics

- **Average chunk length**: 237-917 characters (varies by collection)
- **Chunking strategy**: Semantic chunking with overlap (100 chars default)
- **Embedding model**: OpenAI `text-embedding-3-small` (1536-dim)

### Analysis Tools

A dedicated analysis script is available:

```bash
python scripts/analyze_qdrant_documents.py
```

This script:
- Analyzes all collections structure
- Extracts metadata patterns
- Generates JSON and Markdown reports
- Outputs to `scripts/qdrant_analysis_reports/`

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
