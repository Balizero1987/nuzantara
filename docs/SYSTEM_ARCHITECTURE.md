# NUZANTARA System Architecture

This document provides a clear and up-to-date overview of the NUZANTARA production architecture.

## Production Deployed Applications

The system consists of three core applications deployed to production environments.

### 1. Webapp (Frontend)

-   **Codebase:** `apps/webapp`
-   **Purpose:** The primary user-facing web application. It provides the user interface and interacts with the Core Backend.
-   **Technology:** React/TypeScript
-   **Deployment:** Automatically deployed from the `main` branch to **Cloudflare Pages**.
-   **Workflow:** `.github/workflows/deploy-webapp.yml`
-   **Live URL:** [https://zantara.balizero.com](https://zantara.balizero.com)

### 2. Core Backend (`backend-ts`)

-   **Codebase:** `apps/backend-ts`
-   **Purpose:** The main backend service that handles business logic, user authentication, and orchestrates communication between the frontend and the RAG backend.
-   **Technology:** Node.js/TypeScript
-   **Deployment:** Automatically deployed from the `main` branch to **Fly.io**.
-   **Workflow:** `.github/workflows/deploy-production.yml`
-   **Fly.io App Name:** `nuzantara-core`
-   **Production URL:** `https://nuzantara-backend.fly.dev`

### 3. RAG Backend (`backend-rag`)

-   **Codebase:** `apps/backend-rag`
-   **Purpose:** A specialized service for all Retrieval-Augmented Generation (RAG) tasks. It manages the ChromaDB vector database, handles document ingestion, provides embedding services, and runs semantic searches.
-   **Technology:** Python
-   **Deployment:** Deployed to **Fly.io** via manual or semi-automated scripts. This deployment is **not** part of the main automated CI/CD pipeline.
-   **Scripts:** Deployment is handled by scripts in the `/scripts` directory (e.g., `maestro-deploy-chromadb.sh`, `monitoring/fix-deployment.sh`).
-   **Fly.io App Name:** `nuzantara-rag`
-   **Production URL:** `https://nuzantara-rag.fly.dev`

---

## Internal Services & Tools

These components are essential to the system but are not deployed as standalone, public-facing applications.

### 1. Bali Intel Scraper

-   **Codebase:** `apps/bali-intel-scraper`
-   **Purpose:** A Python-based web scraping tool that gathers data and feeds it to the backend services (`backend-ts` and `backend-rag`).
-   **Role:** An internal data provider, likely run as a scheduled task (cron job).

### 2. Memory Service

-   **Codebase:** `apps/memory-service`
-   **Purpose:** A Node.js/TypeScript component that provides conversation memory and context management.
-   **Role:** It is used as an internal service or library by the **Core Backend (`backend-ts`)**. Documentation explicitly states it is not deployed separately on Fly.io.
