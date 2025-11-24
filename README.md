# 🌟 NUZANTARA - ZANTARA AI Platform

**Indonesian Business Intelligence & Legal Advisory Platform**

[![Deploy Status](https://github.com/Balizero1987/nuzantara/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Balizero1987/nuzantara/actions/workflows/deploy-pages.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Live Site:** https://zantara.balizero.com

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/Balizero1987/nuzantara.git
cd nuzantara

# Install dependencies
npm install

# Start development
npm run dev
```

---

## 📦 Repository Structure

```
nuzantara/
├── apps/
│   ├── webapp/          # Frontend (GitHub Pages)
│   ├── backend-ts/      # TypeScript backend (OpenRouter Gateway)
│   └── backend-rag/     # Python RAG service (Gemini 1.5 Flash + Qdrant)
├── docs/                # Documentation
│   ├── reports/         # Status reports & analytics
│   ├── guides/          # Setup & development guides
│   ├── architecture/    # System architecture docs
│   └── sessions/        # Development session logs
└── .github/workflows/   # CI/CD automation
```

---

## 🎯 Key Features

### 🧠 Ultra Hybrid AI Architecture
- **Reasoning Engine:** Google Gemini 1.5 Flash (via Google AI)
- **Code & Logic:** DeepSeek Coder & Llama 3.3 (via OpenRouter)
- **Testing:** Qwen 2.5 (via OpenRouter)
- **Conversational:** Mistral 7B / Llama 4 Scout
- **Fallback:** GPT-4 Turbo (Premium)

### 🌐 Production Deployment
- **Frontend:** GitHub Pages (auto-deploy on push)
- **Backend:** Fly.io (TypeScript + Python)
- **HTTPS:** Enforced with auto SSL

### ⚡ Performance
- **Bundle Size:** 192KB (optimized)
- **Load Time:** <1.5s (40% improvement)
- **Files:** 10 JS files (90% reduction)

---

## 🛠️ Technology Stack

### Frontend
- Vanilla JavaScript (ES6+)
- HTML5 + CSS3
- GitHub Pages deployment

### Backend (TypeScript)
- **Runtime:** Node.js (Express.js)
- **AI Gateway:** OpenRouter Unified Client
- **Resilience:** Circuit Breaker, Rate Limiting, Budgeting

### Backend (Python RAG)
- **Framework:** FastAPI
- **Reasoning:** Google Gemini 1.5 Flash
- **Vector DB:** Qdrant (Semantic Search)
- **Storage:** Google Drive (Full PDF Analysis)
- **Orchestration:** LangChain / LangGraph

---

## 📚 Documentation

### Core Documentation
- **[Architecture](ARCHITECTURE.md)** - Complete system architecture v5.3
- **[System Architecture v5.3](docs/architecture/SYSTEM_ARCHITECTURE_v5_3.md)** - Ultra Hybrid design
- **[Deployment Guide](docs/deployment/DEPLOYMENT_GUIDE_v5_3_ULTRA_HYBRID.md)** - Production deployment

### Status & Reports
- **[Manual Fixes Required](MANUAL_FIXES_REQUIRED.md)** - Known issues & fixes
- **[QA Validation Report](docs/reports/QA_VALIDATION_REPORT_v5.2.1.md)** - Test results
- **[Cleanup Release Notes](docs/reports/CLEANUP_RELEASE_NOTES.md)** - v5.2.1 changelog

### Additional Resources
- **[ADR (Architecture Decision Records)](docs/adr/)** - Design decisions
- **[Deployment Validation](docs/deployment/DEPLOYMENT_VALIDATION_v5_3.md)** - Verification steps

---

## 🚀 Deployment

### Automatic Deployment
The repository uses GitHub Actions for automatic deployment:
- **Trigger:** Push to `main` branch (changes in `apps/webapp`)
- **Workflow:** `.github/workflows/deploy-pages.yml`
- **Target:** GitHub Pages → https://zantara.balizero.com
- **Duration:** ~40 seconds

### Manual Deployment
```bash
# Deploy backend services
make deploy-backend

# Deploy RAG service
make deploy-rag

# Full deployment
make deploy-full
```

---

## 🧪 Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- Git

### Local Development
```bash
# Frontend
cd apps/webapp
python -m http.server 3000

# Backend TypeScript
cd apps/backend-ts
npm run dev

# Backend RAG
cd apps/backend-rag
uvicorn backend.app.main_cloud:app --reload
```

### Testing
```bash
# Run all tests
npm test

# Lint code
npm run lint

# Type check
npm run typecheck
```

---

## 📊 Recent Updates (Nov 2025)

### ✅ v5.3 Ultra Hybrid Architecture (Nov 24, 2025)
- **Status:** Production Ready (minor blockers - see below)
- **Oracle v5.3:** Qdrant + Google Drive + Gemini 1.5 Flash
- **Smart Oracle:** Full PDF analysis with user localization
- **Multi-language:** 97% accuracy across 10+ languages
- **Endpoint Alignment:** All backend APIs now use `/api/*` prefix
- **Bug Fixes:** Pydantic validation errors resolved

### ✅ AI Architecture Upgrade
- Integrated **Gemini 1.5 Flash** as primary reasoning engine
- Implemented **OpenRouter Client** with multi-model fallback
- Added **DeepSeek Coder** for specialized code tasks

### ✅ Performance Optimization
- Frontend bundle: 1.3MB → 192KB (-85%)
- Removed 96 unused JavaScript files
- Improved load time by 40%
- Query response: 1.5s average (industry: 3.2s)

### ✅ Repository Cleanup (v5.2.1)
- Organized 94 docs into subdirectories
- Reduced root clutter by 92.5%
- Clean Git repository (2.1GB)
- Removed 100% legacy code (Firestore, ChromaDB, etc.)

---

## ⚠️ Current Status & Known Issues

### 🟢 Operational
- ✅ Frontend (GitHub Pages)
- ✅ Backend TypeScript (Fly.io)
- ✅ PostgreSQL Database
- ✅ Qdrant Vector DB (17 collections, 7,500+ docs)

### 🟡 Partial / Blockers
- ⚠️ **Backend Python RAG:** OpenAI API key invalid (embeddings fail)
- ⏸️ **Memory Service:** Suspended (needs restart)

### 🔧 Fixes Applied (2025-11-24)
- ✅ Pydantic validation errors (oracle_universal.py)
- ✅ CRM endpoints aligned (`/api/crm/*`)
- ✅ Search endpoint aligned (`/api/search`)
- ✅ Ingest endpoint aligned (`/api/ingest`)

**For detailed fixes and remaining work, see:** [MANUAL_FIXES_REQUIRED.md](MANUAL_FIXES_REQUIRED.md)

---

## 🤝 Contributing

We welcome contributions! Key points:
- Follow code standards (ESLint, Black, Prettier)
- Add tests for new features
- Update documentation
- Use conventional commits

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🔗 Links

- **Production:** https://zantara.balizero.com
- **GitHub:** https://github.com/Balizero1987/nuzantara
- **Documentation:** [docs/](docs/)

---

**Version:** v5.3.0 (Ultra Hybrid)  
**Last Updated:** November 24, 2025  
**Maintained by:** Balizero Team  
**Status:** Production Ready (with minor blockers)
