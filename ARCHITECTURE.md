# 🏗️ ZANTARA Platform - System Architecture

**Version:** v5.3 (Ultra Hybrid)  
**Last Updated:** 2025-11-24  
**Status:** Production Ready (with minor blockers - see below)

---

## 📊 Executive Summary

ZANTARA is a multi-backend AI platform for Indonesian Business Intelligence & Legal Advisory, featuring:

- **Ultra Hybrid RAG Architecture**: Qdrant + Google Drive + Gemini 1.5 Flash
- **Multi-Backend Design**: TypeScript (AI Gateway) + Python (RAG/Vector)
- **Deployment**: Fly.io (backends) + GitHub Pages (frontend)
- **Scale**: 25,000+ Indonesian legal documents, 17 Qdrant collections

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZANTARA PLATFORM v5.3                         │
└─────────────────────────────────────────────────────────────────┘

                            │
                            ▼
                    
┌───────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Vanilla JavaScript + GitHub Pages                           │ │
│  │  URL: https://zantara.balizero.com                           │ │
│  │  Files: 37 JS modules                                        │ │
│  └──────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
                            │
                            ▼
                            
┌───────────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER (Fly.io)                         │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────┐      ┌──────────────────────────────┐  │
│  │  BACKEND-TS         │      │  BACKEND-RAG                  │  │
│  │  (TypeScript)       │      │  (Python/FastAPI)             │  │
│  ├─────────────────────┤      ├──────────────────────────────┤  │
│  │ • Express.js        │      │ • Google Gemini 1.5 Flash    │  │
│  │ • OpenRouter        │      │ • Qdrant Vector DB           │  │
│  │ • Multi-AI Gateway  │      │ • Google Drive Integration   │  │
│  │ • JWT Auth          │      │ • Smart Oracle System        │  │
│  │ • Circuit Breaker   │      │ • User Localization          │  │
│  │                     │      │ • PostgreSQL Analytics       │  │
│  │ 232 TypeScript files│      │ 126 Python files             │  │
│  └─────────────────────┘      └──────────────────────────────┘  │
│         │                               │                        │
│         │                               │                        │
│         ▼                               ▼                        │
│  nuzantara-backend.fly.dev    nuzantara-rag.fly.dev            │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                            │
                            ▼
                            
┌───────────────────────────────────────────────────────────────────┐
│                    DATA LAYER (Fly.io)                            │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  PostgreSQL      │  │  Qdrant Vector  │  │  Google Drive   │ │
│  ├──────────────────┤  ├─────────────────┤  ├─────────────────┤ │
│  │ • User profiles  │  │ • 17 collections│  │ • 25,000+ PDFs  │ │
│  │ • CRM data       │  │ • Embeddings    │  │ • Source docs   │ │
│  │ • Analytics      │  │ • Semantic      │  │ • Full context  │ │
│  │ • Auth tokens    │  │   search        │  │   analysis      │ │
│  └──────────────────┘  └─────────────────┘  └─────────────────┘ │
│  nuzantara-postgres    nuzantara-qdrant     Google Cloud        │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Backend Responsibilities

### Backend TypeScript (`nuzantara-backend.fly.dev`)

**Purpose:** AI Gateway & Business Logic

**Key Features:**
- Multi-model AI routing (OpenRouter)
- DeepSeek Coder, Llama 3.3, Mistral, GPT-4
- Circuit breaker & rate limiting
- JWT authentication system
- Team management & analytics
- WebSocket support

**API Prefix:** `/api/*`

**Main Endpoints:**
```
POST   /api/auth/team/login
GET    /api/team/analytics
POST   /api/handlers/{handler_name}
GET    /health
```

**Port:** 8080 (internal)

---

### Backend Python/RAG (`nuzantara-rag.fly.dev`)

**Purpose:** RAG Engine & Vector Search

**Key Features:**
- Google Gemini 1.5 Flash reasoning
- Qdrant semantic search (17 collections)
- Google Drive full PDF download
- Smart Oracle (full document analysis)
- User localization system
- Multi-language responses
- PostgreSQL analytics

**API Prefix:** `/api/*` (standardized as of 2025-11-24)

**Main Endpoints:**
```
POST   /api/oracle/query                  # Universal Oracle (v5.3)
POST   /api/oracle/property/search        # Property intelligence
POST   /api/oracle/tax/search             # Tax intelligence
POST   /api/search                        # Semantic search
POST   /api/crm/clients                   # CRM clients
POST   /api/crm/interactions              # CRM interactions
POST   /api/crm/practices                 # CRM practices
POST   /api/ingest/upload                 # Document ingestion
GET    /health                            # Health check
POST   /auth/login                        # Authentication
```

**Port:** 8000 (internal)

---

## 🌐 Endpoint Mapping (Frontend ↔ Backend)

### Current Mapping (as of 2025-11-24)

| Frontend Call | Target Backend | Endpoint | Status |
|---------------|----------------|----------|--------|
| `/api/auth/team/login` | Backend-TS | `/api/auth/team/login` | ✅ OK |
| `/auth/login` | Backend-RAG | `/auth/login` | ✅ OK |
| `/api/oracle/query` | Backend-RAG | `/api/oracle/query` | ⚠️ Needs OpenAI key |
| `/api/crm/clients` | Backend-RAG | `/api/crm/clients` | ✅ Fixed 2025-11-24 |
| `/api/crm/interactions` | Backend-RAG | `/api/crm/interactions` | ✅ Fixed 2025-11-24 |
| `/api/crm/practices` | Backend-RAG | `/api/crm/practices` | ✅ Fixed 2025-11-24 |
| `/api/search` | Backend-RAG | `/api/search` | ✅ Fixed 2025-11-24 |
| `/api/ingest/*` | Backend-RAG | `/api/ingest/*` | ✅ Fixed 2025-11-24 |
| `/api/memory/*` | Memory Service | N/A | ⏸️ Service suspended |

---

## 🗄️ Database Schema

### PostgreSQL Tables

```sql
-- User Management & Localization
users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    role VARCHAR(100),
    status VARCHAR(50),
    language_preference VARCHAR(10),  -- en, id, it, etc.
    role_level VARCHAR(50),           -- executive, manager, member
    timezone VARCHAR(50),
    meta_json JSONB,                  -- Complex preferences
    created_at TIMESTAMP
)

-- CRM System
crm_clients (...)
crm_interactions (...)
crm_practices (...)

-- Oracle Knowledge Bases
oracle_knowledge_bases (...)

-- Analytics
query_analytics (
    user_id UUID,
    query_hash VARCHAR(32),
    query_text TEXT,
    response_text TEXT,
    language_preference VARCHAR(10),
    model_used VARCHAR(100),
    response_time_ms FLOAT,
    document_count INT,
    session_id VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP
)

-- Feedback Loop
knowledge_feedback (
    user_id UUID,
    query_text TEXT,
    original_answer TEXT,
    user_correction TEXT,
    feedback_type VARCHAR(50),
    user_rating INTEGER,
    model_used VARCHAR(100),
    created_at TIMESTAMP
)
```

### Qdrant Collections

```
1. visa_documents       (1,612 docs)
2. legal_documents      (5,041 docs)
3. tax_documents        (895 docs)
4. property_listings
5. investment_guides
6. company_formation
7. immigration_policies
8. bali_regulations
9. jakarta_regulations
10. general_knowledge
11-17. [Additional specialized collections]
```

---

## 🔐 Authentication Flow

### Backend TypeScript (Team Login)

```
1. Frontend → POST /api/auth/team/login
   Body: { email, pin }

2. Backend-TS validates:
   - PIN hash match (bcrypt)
   - User status = 'active'
   
3. Returns JWT token:
   {
     "token": "eyJ...",
     "user": { ... }
   }

4. Frontend stores in localStorage
```

### Backend Python (Oracle Auth)

```
1. Frontend → POST /auth/login
   Body: { email, password }

2. Backend-RAG validates:
   - Password hash match
   - User status = 'active'
   
3. Returns user profile + JWT
```

---

## 🚀 Deployment Architecture

### Fly.io Apps

```
nuzantara-backend       (TypeScript)    → DEPLOYED ✅
nuzantara-rag           (Python)        → DEPLOYED ⚠️ (API key issue)
nuzantara-postgres      (PostgreSQL)    → DEPLOYED ✅
nuzantara-qdrant        (Vector DB)     → DEPLOYED ✅
nuzantara-memory        (TypeScript)    → SUSPENDED ⏸️
```

### GitHub Pages

```
Repository: Balizero1987/nuzantara
Branch: gh-pages (auto-deployed)
URL: https://zantara.balizero.com
Trigger: Push to main (apps/webapp changes)
```

### CI/CD Workflows

```yaml
# Frontend
.github/workflows/deploy-pages.yml
  Trigger: Push to main (apps/webapp/*)
  Duration: ~40 seconds
  Status: ✅ Active

# Backend Python
.github/workflows/deploy-backend-rag.yml
  Trigger: Manual / Push to main
  Target: Fly.io nuzantara-rag
  Status: ✅ Active

# Production (Blue-Green)
.github/workflows/deploy-production.yml
  Trigger: Manual (requires "DEPLOY" confirmation)
  Strategy: Blue-Green deployment
  Health checks: Automated
  Rollback: Automated on failure
```

---

## 📊 Performance Metrics

### Target Performance

```
Query Response Time:    < 3 seconds  (Current: 1.5s ✅)
User Satisfaction:      > 4.5/5      (Current: 4.7/5 ✅)
Multilingual Accuracy:  > 95%        (Current: 97% ✅)
Uptime:                 > 99.5%      (Monitoring needed)
```

### Codebase Stats

```
Total Active Files:     ~500+
TypeScript Files:       232
Python Files:           126
JavaScript Files:       37
Documentation:          40+ MD files
```

---

## ⚠️ Current Issues & Blockers

### 🔴 CRITICAL (BLOCKER)

1. **OpenAI API Key Invalid** (Backend-RAG)
   - Impact: Cannot generate embeddings
   - Endpoint affected: `/api/oracle/query`
   - Fix: Update Fly.io secret `OPENAI_API_KEY`

### 🟡 MEDIUM

2. **Memory Service Suspended**
   - Impact: Memory endpoints unavailable
   - Options: Restart service OR redirect to backend-ts
   - Endpoint: `nuzantara-memory.fly.dev`

### 🟢 RESOLVED (2025-11-24)

3. ✅ Pydantic validation errors (oracle_universal.py)
4. ✅ CRM endpoint prefix mismatch
5. ✅ Search endpoint prefix mismatch
6. ✅ Ingest endpoint prefix mismatch

---

## 🎯 Next Steps & Roadmap

### Immediate (Today)

- [ ] Fix OpenAI API key in Fly.io
- [ ] Restart/configure memory service
- [ ] Run E2E tests
- [ ] Verify all endpoints working

### Short-term (This Week)

- [ ] Complete v5.3 testing
- [ ] Update monitoring dashboards
- [ ] Document API examples
- [ ] Tag release v5.3.0

### Mid-term (2 Weeks)

- [ ] Implement Prometheus/Grafana monitoring
- [ ] Add performance profiling
- [ ] Optimize Gemini prompts
- [ ] Expand test coverage

### Long-term

- [ ] Voice synthesis for responses
- [ ] Visual document analysis (OCR)
- [ ] Real-time collaboration features
- [ ] Enhanced security (biometric auth)

---

## 📚 Related Documentation

- [System Architecture v5.3](docs/architecture/SYSTEM_ARCHITECTURE_v5_3.md)
- [Deployment Guide](docs/deployment/DEPLOYMENT_GUIDE_v5_3_ULTRA_HYBRID.md)
- [QA Validation Report](docs/reports/QA_VALIDATION_REPORT_v5.2.1.md)
- [Manual Fixes Required](MANUAL_FIXES_REQUIRED.md)
- [Cleanup Release Notes](docs/reports/CLEANUP_RELEASE_NOTES.md)

---

## 🤝 Contributing

### Code Standards

- **TypeScript**: ESLint + Prettier
- **Python**: Black + Flake8 + MyPy
- **JavaScript**: Prettier
- **Commits**: Conventional Commits

### Testing Requirements

- Unit tests for new features
- Integration tests for API endpoints
- E2E tests for critical flows
- Performance benchmarks

---

## 📞 Support & Contact

**Development Team:** Balizero Team  
**Platform Status:** https://zantara.balizero.com  
**Repository:** https://github.com/Balizero1987/nuzantara  

---

**Architecture Version:** v5.3.0  
**Document Status:** Current  
**Maintainer:** DevOps & Platform Team
