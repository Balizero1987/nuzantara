# Full-Stack Observability Suite

**Date:** 2025-11-29
**Status:** Active

## Overview
The Nuzantara Full-Stack Observability Suite provides a unified view of the system's health, covering Backend, Frontend, and the API Contract between them. It is designed to be "Intelligent Automation" that not only checks for uptime but also for code consistency and correctness.

## Components

### 1. Backend Sentinel
- **Script:** `apps/core/sentinel.py`
- **Purpose:** Verifies the health of the Backend API and its dependencies (Database, Vector DB, AI Services).
- **Checks:**
    - API Reachability (`/health`)
    - Database Connection
    - Vector Database Status
    - AI Service Availability
- **Usage:** `python3 apps/core/sentinel.py`

### 2. Frontend Sentinel
- **Script:** `apps/core/sentinel_frontend.py`
- **Purpose:** Performs Synthetic User Monitoring (SUM) on the live Frontend application.
- **Mechanism:** Uses Playwright (WebKit) to simulate a real user journey.
- **Checks:**
    - Homepage Load
    - Login Flow (using test credentials)
    - Chat Interface Load
- **Usage:** `python3 apps/core/sentinel_frontend.py`

### 3. Contract Sentinel (Intelligent Automation)
- **Script:** `apps/core/sentinel_contract.py`
- **Purpose:** Ensures the Frontend code is 100% compatible with the Backend API Contract.
- **Mechanism:**
    1.  Fetches live OpenAPI Spec from Backend (`/api/v1/openapi.json`).
    2.  Regenerates Frontend Client (`lib/api/generated`) using `openapi-typescript-codegen`.
    3.  Runs TypeScript Type Check (`tsc`) to detect mismatches.
- **Value:** Immediately detects if Frontend is using fields that don't exist in Backend (Contract Breaches).
- **Usage:** `python3 apps/core/sentinel_contract.py`

### 4. The Scribe (Automated Documentation)
- **Backend Script:** `apps/core/scribe.py`
- **Frontend Script:** `apps/core/scribe_frontend.py`
- **Purpose:** Automatically generates architecture documentation by reading the codebase.
- **Outputs:**
    - `docs/ARCHITECTURE.md` (Backend)
    - `docs/FRONTEND_ARCHITECTURE.md` (Frontend)

### 5. Evaluator (Judgement Day)
- **Script:** `apps/evaluator/judgement_day.py`
- **Purpose:** Evaluates the quality of the RAG (Retrieval-Augmented Generation) system.
- **Mechanism:**
    - Uses **Ragas** framework.
    - Uses **Google Gemini** as the "Judge" LLM.
    - Queries the live RAG API with test questions.
- **Metrics:**
    - **Faithfulness:** Does the answer stick to the retrieved context? (Avoids Hallucinations)
    - **Answer Relevancy:** Is the answer actually helpful for the user's question?
- **Usage:** `python3 apps/evaluator/judgement_day.py`

## Infrastructure (Passive Monitoring)
The system is supported by a robust containerized monitoring stack defined in `docker-compose.yml`.

### 1. Prometheus (Metrics)
- **Port:** `9090`
- **Config:** `config/prometheus/prometheus.yml`
- **Role:** Scrapes metrics from Backend (`host.docker.internal:8000`) and Qdrant (`qdrant:6333`).
- **Access:** `http://localhost:9090`

### 2. Grafana (Visualization)
- **Port:** `3001` (Mapped from 3000)
- **Role:** Visualizes metrics from Prometheus.
- **Credentials:** `admin` / `admin` (Default)
- **Access:** `http://localhost:3001`

### 3. Jaeger (Distributed Tracing)
- **Port:** `16686` (UI), `4317` (OTLP gRPC)
- **Role:** Traces requests across services (Backend -> Qdrant -> LLM).
- **Integration:** Backend is configured to send OTLP traces to Jaeger.
- **Access:** `http://localhost:16686`

### 4. Qdrant Dashboard
- **Port:** `6333`
- **Role:** Vector Database management and visualization.
- **Access:** `http://localhost:6333/dashboard`

## Recent Incidents & Resolutions
### Chat Stream Error (405/401)
- **Issue:** Chat stream was failing with 405 Method Not Allowed and 401 Unauthorized.
- **Root Cause:**
    - Frontend Proxy was sending POST, Backend expected GET.
    - JWT Token mismatch (`sub` vs `userId`).
- **Resolution:**
    - Updated Frontend Proxy to use GET.
    - Updated Backend Auth to support both `sub` and `userId`.
    - Verified with `curl` and Frontend Sentinel.

## How to Verify System Health
Run the following commands in order:
1.  `python3 apps/core/sentinel.py` (Check Backend)
2.  `python3 apps/core/sentinel_frontend.py` (Check Frontend User Flow)
3.  `python3 apps/core/sentinel_contract.py` (Check Code Consistency)
4.  `python3 apps/evaluator/judgement_day.py` (Check RAG Quality)

If all three pass, the system is **Healthy** and **Consistent**.
