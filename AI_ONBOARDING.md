# 🧠 AI ONBOARDING PROTOCOL - NUZANTARA PROJECT

**ATTENTION NEW AI AGENT:**
You have been instantiated as a core contributor to the **Nuzantara** platform. This document defines your operational parameters, the system architecture, and the standards you must uphold.

---

## 1. 🌍 PROJECT MISSION
**Nuzantara** is an enterprise-grade **Intelligent Business Operating System** designed for **Bali Zero**.
It is not merely a chatbot; it is a comprehensive platform integrating RAG (Retrieval-Augmented Generation), complex business logic, CRM capabilities, and multi-channel communication (WhatsApp, Web, API).

**Core Objectives:**
- **Reliability:** Systems must be robust, fail-safe, and self-healing.
- **Scalability:** Architecture must support growing data and user loads.
- **Maintainability:** Code must be clean, typed, and well-documented.

---

## 2. 🏗️ SYSTEM ARCHITECTURE

The project is a **Monorepo** managed with `npm workspaces` and Docker.

### 2.1 Core Services

| Service | Path | Stack | Status | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Backend RAG** | `apps/backend-rag` | **Python 3.11+** (FastAPI) | ✅ **PRIMARY** | The central intelligence engine. Handles RAG, AI orchestration, Vector DB (Qdrant), and business logic. |
| **Frontend** | `apps/webapp-next` | **Next.js 16** (React 19) | ✅ **PRIMARY** | The modern user interface. Uses Tailwind CSS and TypeScript. |


### 2.2 Infrastructure
- **Database:** PostgreSQL (Relational), Qdrant (Vector), Redis (Cache/Queue).
- **Deployment:** Fly.io (Docker-based).
- **Observability:** Prometheus, Grafana, Jaeger.

---

## 3. 📜 OPERATIONAL STANDARDS

### 3.1 Coding Guidelines
- **Python:**
    -   Use **Type Hints** everywhere (`def func(x: int) -> str:`).
    -   Use `async/await` for I/O bound operations (FastAPI).
    -   Follow PEP 8.
-   **TypeScript:**
    -   Strict typing required (no `any`).
    -   Use Functional Components with Hooks for React.
-   **General:**
    -   **No Hardcoding:** Use `os.getenv()` or `process.env`.
    -   **Error Handling:** Fail gracefully. Use try/catch and log errors.

### 3.2 File System Discipline
-   **Root (`/`) is Restricted:** Do not create files in the root unless explicitly instructed.
-   **Documentation:** Place docs in `docs/`.
-   **Scripts:** Place utility scripts in `scripts/` or service-specific `scripts/` folders.

### 3.3 Testing & Verification
-   **Sentinel:** The project uses a `sentinel` script for quality control.
    -   Run `./sentinel` to verify integrity before requesting review.
-   **Logs:** Check logs (`fly logs` or local output) to verify behavior.

---

## 4. 🧩 KEY FEATURES & MODULES

### 4.1 RAG Engine
Located in `apps/backend-rag/backend/services/`. Handles context retrieval from Qdrant to ground AI responses in business data.

### 4.2 Intelligent Router
Located in `apps/backend-rag/backend/services/intelligent_router.py`. Orchestrates incoming requests, routing them to the appropriate AI model or tool based on intent.

### 4.3 Jaksel Personality Module
A specialized module (`SimpleJakselCallerHF`) that applies a specific "Jakarta Selatan" persona to responses for authorized users.
*Note: Operates via a dedicated production endpoint (`https://jaksel.balizero.com`) with Gemini as a robust fallback.*

---

## 5. 🚀 IMMEDIATE ACTION PROTOCOL

1.  **Context Acquisition:** Read `task.md` (if present) to understand the current objective.
2.  **Environment Check:** Verify that critical environment variables (API keys, DB URLs) are loaded.
3.  **Execution:** Proceed with your task, adhering strictly to the standards above.

**Maintain the standard. Build for the future.**
