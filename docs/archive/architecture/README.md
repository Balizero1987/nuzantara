# 📚 NUZANTARA Architecture Documentation

> **Last Updated**: 2025-10-17
> **Status**: ✅ Organized & Current
> **Total Files**: 51 active documentation files

---

## 📁 Folder Structure

This documentation is organized into **6 main categories** for easy navigation:

```
docs/architecture/
├── core/           # System architecture & AI models (4 files)
├── components/     # Backend components & handlers (10 files)
├── features/       # AI features & integrations (12 files)
├── business/       # Bali Zero business logic (8 files)
├── guides/         # Setup & operation guides (16 files)
└── testing/        # Test suite documentation (1 file)
```

---

## 🎯 Quick Start

### **New to NUZANTARA?** Start here:
1. 📖 **[core/ARCHITECTURE_REAL.md](core/ARCHITECTURE_REAL.md)** - **PRIMARY REFERENCE** (verified Oct 17, 2025)
2. 🧠 **[core/AI_MODELS_GUIDE.md](core/AI_MODELS_GUIDE.md)** - AI models & routing
3. 🚀 **[guides/ZANTARA_SETUP_GUIDE.md](guides/ZANTARA_SETUP_GUIDE.md)** - Initial setup
4. 📋 **[components/HANDLERS_REFERENCE.md](components/HANDLERS_REFERENCE.md)** - All 104+ handlers

### **Need specific info?**
- **Architecture details** → `/core/`
- **Handler documentation** → `/components/`
- **AI feature docs** → `/features/`
- **Business logic** → `/business/`
- **Setup instructions** → `/guides/`
- **Testing info** → `/testing/`

---

## 📂 Category Details

### 📊 **core/** - System Architecture (4 files)

The **single source of truth** for system architecture and AI configuration.

| File | Description | Status |
|------|-------------|--------|
| **ARCHITECTURE_REAL.md** | ✅ **PRIMARY REFERENCE** - Verified system architecture | 🟢 Current (Oct 17) |
| AI_ROUTING_REAL.md | AI routing logic & pattern-based classification | 🟢 Current |
| AI_MODELS_GUIDE.md | AI models configuration (Claude Haiku/Sonnet) | 🟢 Current (Oct 17) |
| SERVICE_IDENTIFICATION.md | Service identification & boundaries | 🟢 Current |

**Start Here**: If you need to understand the system, start with `ARCHITECTURE_REAL.md`.

---

### 🔧 **components/** - Backend Components (10 files)

Documentation for backend components, handlers, and system modules.

| File | Description | Lines |
|------|-------------|-------|
| **HANDLERS_REFERENCE.md** | Complete reference for all 104 handlers | 3278 |
| HANDLER_REGISTRY_PHASE1.md | Handler registry system | 153 |
| HANDLER_EXPORTS_MAP.md | Handler export mappings | 364 |
| backend-handlers.md | Backend handler architecture | 194 |
| backend-typescript.md | TypeScript backend details | 47 |
| backend-testing.md | Backend testing approach | 38 |
| memory-system.md | PostgreSQL + ChromaDB memory | 284 |
| EMAIL_ROUTING_MAP.md | Email routing configuration | 140 |
| frontend-ui.md | Frontend UI architecture | 27 |
| MONOREPO.md | Monorepo structure | 327 |

**Most Used**: `HANDLERS_REFERENCE.md` (auto-generated handler list)

---

### 🧠 **features/** - AI Features & Integrations (12 files)

AI-powered features, RAG integration, and intelligent systems.

| File | Description | Focus |
|------|-------------|-------|
| AI_IMPROVEMENTS_IMPLEMENTATION_PLAN.md | AI system improvements roadmap | Planning (1525 lines) |
| RAG_INTEGRATION_COMPLETE.md | RAG system integration | Implementation |
| RAG_QUICK_START.md | Quick start guide for RAG | Getting Started |
| RERANKER_MONITORING.md | Reranker monitoring system | Observability |
| ANTI_HALLUCINATION_SYSTEM.md | Anti-hallucination mechanisms | Quality |
| PARALLEL_PROCESSING_OPTIMIZATION.md | Parallel processing patterns | Performance |
| ZANTARA_ARTICLES_INTEGRATION_DESIGN.md | Articles integration design | Feature Design |
| ZANTARA_COLLABORATIVE_INTELLIGENCE.md | Collaborative AI patterns | AI Orchestration |
| ZANTARA_INTELLIGENCE_V6_COMPLETE.md | Intelligence system v6 | Architecture |
| multi-agent-architecture-2025-10-10.md | Multi-agent patterns | Architecture |
| security-rate-limiting-2025-10-10.md | Rate limiting & security | Security (1090 lines) |
| LLAMA_NIGHTLY_WORKER_IMPLEMENTATION.md | Llama worker (may be obsolete) | Legacy |

**Key Files**: RAG integration docs, anti-hallucination system

---

### 💼 **business/** - Bali Zero Business Logic (8 files)

Business operations, compliance, and Bali Zero platform integration.

| File | Description | Focus |
|------|-------------|-------|
| BALI_ZERO_COMPLETE_TEAM_SERVICES.md | Complete team services | Team Management |
| ZANTARA_BALI_ZERO_COMPLETE_INFO.md | Complete Bali Zero integration | Integration (467 lines) |
| ZANTARA_SCRAPING_BALI_ZERO_COMPLETE.md | Bali Zero scraping system | Data Collection (676 lines) |
| SCRAPING_BALI_ZERO_SUMMARY.md | Scraping summary | Summary |
| balizero-integration-plan.md | Integration plan | Planning |
| ZANTARA_CORPUS_PRIORITY_S.md | Corpus priority system | Knowledge Management |
| ZANTARA_FIX_LLM_INTEGRATION.md | LLM integration fixes | Implementation |
| ZANTARA_LLM_INDEX.md | LLM index system | Indexing |

**Business Critical**: Bali Zero integration & scraping systems

---

### 📖 **guides/** - Setup & Operation Guides (16 files)

Step-by-step guides for setup, deployment, and operations.

| File | Description | Use Case |
|------|-------------|----------|
| **ZANTARA_SETUP_GUIDE.md** | Initial setup guide | Setup (619 lines) |
| ZANTARA_ACTIVATION_NOW.md | Activation steps | Activation |
| ZANTARA_SOLUTIONS_GUIDE.md | Solutions & troubleshooting | Problem Solving |
| ZANTARA_BEST_PRACTICES_2025.md | Best practices guide | Development |
| WEBAPP_DEPLOYMENT_GUIDE.md | Webapp deployment | Deployment |
| WEBAPP_REFACTOR_COMPLETE.md | Webapp refactor details | Refactoring |
| WEBAPP_BACKEND_ALIGNMENT_REPORT.md | Backend alignment | Architecture |
| WHERE_TO_USE_BACKENDS.md | Backend selection guide | Architecture (487 lines) |
| STARTUP_PROCEDURE.md | System startup procedure | Operations |
| SAFE_CLEANUP_PLAN.md | Safe cleanup guidelines | Maintenance |
| SYSTEM_AUDIT_PLAN.md | System audit process | Auditing |
| TODO_CURRENT.md | Current TODO list | Planning |
| ZANTARA_EVOLUTION_PLAN.md | Evolution roadmap | Planning |
| ZANTARA_COHERENCE_ANALYSIS.md | Coherence analysis | Quality |
| ZANTARA_V6_PRODUCTION_READY.md | Production readiness | Deployment |
| ZANTARA_LLM_PATCH_SUMMARY.md | LLM patches summary | Updates |
| ZANTARA_SYSTEM_PROMPT_v1.0.md | System prompts v1.0 | Configuration |
| SYSTEM_PROMPTS_UPGRADE_2025-10-14.md | Prompts upgrade | Configuration |

**Start Here**: `ZANTARA_SETUP_GUIDE.md` for initial setup

---

### 🧪 **testing/** - Test Suite (1 file)

Testing documentation and test suite information.

| File | Description | Lines |
|------|-------------|-------|
| TEST_SUITE.md | Complete test suite documentation | 1112 |

---

## 📋 Quick Reference

### **By Task**:

| Task | File |
|------|------|
| Understand the system | `core/ARCHITECTURE_REAL.md` |
| Configure AI models | `core/AI_MODELS_GUIDE.md` |
| Find a handler | `components/HANDLERS_REFERENCE.md` |
| Setup RAG system | `features/RAG_QUICK_START.md` |
| Deploy webapp | `guides/WEBAPP_DEPLOYMENT_GUIDE.md` |
| Troubleshoot issues | `guides/ZANTARA_SOLUTIONS_GUIDE.md` |
| Understand Bali Zero | `business/ZANTARA_BALI_ZERO_COMPLETE_INFO.md` |
| Run tests | `testing/TEST_SUITE.md` |

### **By Role**:

| Role | Start With |
|------|------------|
| **New Developer** | `core/ARCHITECTURE_REAL.md` → `guides/ZANTARA_SETUP_GUIDE.md` |
| **Backend Dev** | `components/HANDLERS_REFERENCE.md` → `components/backend-handlers.md` |
| **AI Engineer** | `core/AI_MODELS_GUIDE.md` → `features/RAG_INTEGRATION_COMPLETE.md` |
| **DevOps** | `guides/WEBAPP_DEPLOYMENT_GUIDE.md` → `guides/STARTUP_PROCEDURE.md` |
| **Business Analyst** | `business/ZANTARA_BALI_ZERO_COMPLETE_INFO.md` |

---

## 📊 Documentation Stats

- **Total Files**: 51 active files
- **Total Size**: ~640 KB
- **Total Lines**: ~20,000 lines
- **Categories**: 6 main categories
- **Last Cleanup**: 2025-10-17
- **Largest File**: `components/HANDLERS_REFERENCE.md` (3278 lines)

---

## 🗂️ Archived Documentation

Historical documentation has been archived to preserve project history:

- **`docs/history/sessions-2025/`** - 17 session reports (Sep-Oct 2025)
- **`docs/history/architecture-old/`** - 6 superseded architecture files

**Note**: These files are kept for historical reference but are no longer current.

---

## ⚠️ Important Notes

### **Single Source of Truth**:
- **`core/ARCHITECTURE_REAL.md`** is the **PRIMARY** architecture reference (verified Oct 17, 2025)
- All other architecture files are supplementary or archived

### **Current System State** (Oct 17, 2025):
- **Platform**: Railway (migrated from GCP)
- **Primary AI**: Claude Haiku + Sonnet
- **Routing**: Pattern-based (NOT AI classification)
- **Backend**: TypeScript (main) + Python RAG
- **Handlers**: 104+ registered handlers
- **Memory**: PostgreSQL + ChromaDB dual-layer

### **Obsolete/Deprecated**:
- Llama-based systems (replaced with Claude)
- Triple-AI architecture (simplified to dual-AI)
- GCP deployment (migrated to Railway)
- AI-based routing (replaced with pattern-based)

---

## 🔄 Maintenance

### **Regular Updates**:
- `HANDLERS_REFERENCE.md` is auto-generated - DO NOT edit manually
- `ARCHITECTURE_REAL.md` should be updated when architecture changes
- `AI_MODELS_GUIDE.md` updated when AI configuration changes

### **Adding New Documentation**:
1. Choose the appropriate category folder
2. Follow existing naming conventions
3. Update this README if adding major documentation
4. Use markdown format with clear structure

### **Deprecating Documentation**:
1. Move to `docs/history/` with appropriate subfolder
2. Update this README to remove references
3. Keep in git history for tracking

---

## 📞 Support

- **Architecture Questions**: Start with `core/ARCHITECTURE_REAL.md`
- **Handler Questions**: Check `components/HANDLERS_REFERENCE.md`
- **Setup Issues**: Follow `guides/ZANTARA_SETUP_GUIDE.md`
- **Business Logic**: See `business/` folder

---

**Documentation Organized**: 2025-10-17
**Cleanup Report**: `docs/analysis/DOCS_ARCHITECTURE_AUDIT.md`
**Status**: ✅ Clean & Organized

*From Zero to Infinity ∞* 🌸
