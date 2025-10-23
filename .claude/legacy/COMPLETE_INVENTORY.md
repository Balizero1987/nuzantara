# 📦 INVENTARIO COMPLETO - NUZANTARA
**Data**: 2025-10-04
**Scopo**: Mappare TUTTO prima della migrazione monorepo

---

## 🎯 COMPONENTI PRINCIPALI (7)

### 1. **Backend API** (TypeScript)
```
Path:     /Users/antonellosiano/Desktop/NUZANTARA/src/
Repo:     https://github.com/Balizero1987/zantara-webapp
Version:  5.2.0-alpha
Stack:    Node.js 20 + TypeScript + Express
Handlers: 136+ (visa, pricing, team, memory, tax, legal, etc.)
Deps:     73 npm packages
Size:     ~16KB (src only, 227MB con node_modules)
```

**Entry point**: `src/index.ts`
**Build**: `tsc --outDir dist --rootDir src`
**Dockerfile**: `Dockerfile.dist`

**Handler categories**:
- `/src/handlers/admin/` - Admin tools
- `/src/handlers/auth/` - Authentication
- `/src/handlers/communication/` - WhatsApp, Instagram
- `/src/handlers/kbli/` - KBLI business classification
- `/src/handlers/legal/` - Legal services
- `/src/handlers/memory/` - Firestore memory system
- `/src/handlers/pricing/` - Pricing calculations
- `/src/handlers/tax/` - Tax calculations
- `/src/handlers/team/` - Team management
- `/src/handlers/visa/` - Visa/KITAS services

---

### 2. **RAG Backend** (Python)
```
Path:     /Users/antonellosiano/Desktop/NUZANTARA/zantara-rag/backend/
Repo:     ❌ NONE (solo locale!)
Version:  2.3-reranker
Stack:    Python 3.11 + FastAPI + ChromaDB
Features: RAG search, re-ranker, multi-collection
Size:     29MB
```

**Entry points**:
- `app/main_cloud.py` (production, semplificato)
- `app/main_integrated.py` (locale, completo)

**Key services**:
- `services/chroma_service.py` - ChromaDB interface
- `services/reranker_service.py` - ⭐ NEW (non deployato, AMD64 only)
- `services/claude_service.py` - Anthropic integration

**ChromaDB collections**:
- `visa_oracle` (229 docs)
- `tax_genius` (0 docs)
- `legal_architect` (0 docs)
- `kbli_classifier` (0 docs)
- `bali_zero_kb` (12K+ embeddings)

**⚠️ CRITICO**: Re-ranker sviluppato ma NON in produzione (ARM64 issue)

---

### 3. **Webapp Frontend**
```
Path:     /Users/antonellosiano/Desktop/NUZANTARA/zantara_webapp/
Repo:     https://github.com/Balizero1987/zantara_webapp
URL:      https://zantara.balizero.com ✅
Stack:    Vanilla JS + HTML + CSS
Size:     32KB
```

**Main files**:
- `static/zantara-production.html`
- `js/api-config.js` (endpoint configuration)
- `js/chat-interface.js`
- `docs/PRICING_OFFICIAL_2025.json`

---

### 4. **Integrations Orchestrator** ⭐
```
Path:     /Users/antonellosiano/Desktop/NUZANTARA/integrations-orchestrator/
Repo:     ❌ NONE
Purpose:  Post-processing & job management microservice
Stack:    TypeScript + Express
Size:     4.2MB
Status:   ⚠️ Non menzionato nel report monorepo!
```

**Purpose**: "Handling post-processing and job management"

**Files**:
- `src/index.ts`
- `src/job-executor.ts`
- `src/registry.ts`
- `src/zantara-client.ts`
- `Dockerfile`

**⚠️ IMPORTANTE**: Microservizio separato, va preservato!

---

### 5. **Nuzantara Brain** 🧠
```
Path:     /Users/antonellosiano/Desktop/NUZANTARA/nuzantara-brain/
Repo:     ❌ NONE
Purpose:  Agent orchestration system
Size:     288KB
Status:   ⚠️ Non menzionato nel report!
```

**Structure**:
- `agents/` - Agent definitions
- `api/` - API interface
- `knowledge/` - Knowledge management
- `src/` - Core logic
- `tests/` - Test suite

---

### 6. **Oracle System** 🔮
```
Path:     /Users/antonellosiano/Desktop/NUZANTARA/oracle-system/
Repo:     ❌ NONE
Purpose:  Oracle prediction/simulation system
Size:     12KB
Status:   ⚠️ Non menzionato!
```

**Structure**:
- `agents/`
- `data/`
- `reports/`
- `scripts/`
- `tests/oracle-simulation.test.ts`

**Test command**: `npm run test:oracle-sim`

---

### 7. **Knowledge Base System**
```
Path 1:   /Users/antonellosiano/Desktop/NUZANTARA/nuzantara-kb/
Path 2:   /Users/antonellosiano/Desktop/NUZANTARA/nuzantara-kb-broken/
Path 3:   /Users/antonellosiano/Desktop/NUZANTARA/KB/
Repo:     ❌ NONE
Size:     48KB + contenuti
Status:   ⚠️ Parzialmente funzionante
```

**KB Content** (categorizzato):
- `/KB/AI/` - AI research
- `/KB/legal/` - Legal docs
- `/KB/indonesian-laws/` - Indonesian regulations
- `/KB/business/` - Business guides
- `/KB/science/`, `/KB/mathematics/`, `/KB/philosophy/` - Misc

**Scripts**:
- `nuzantara-kb/scripts/export_all_for_rag.py`
- `nuzantara-kb-broken/scripts/upload_to_chroma.py`

---

## 🛠️ TOOLS & UTILITIES

### Python Tools (`/tools/`)
- `zantara-bridge.py` - Bridge service
- `zantara-testing-framework.py` - Test framework
- `zantara-libgen-downloader.py` - LibGen integration
- `test-drive-access.py`, `test-drive-upload.py` - Google Drive

### Deploy Scripts (root)
- `deploy-quick.sh` - Cloud Build deploy
- `deploy-memory-fixes.sh` - Memory system deploy
- `deploy-all-fixes.sh` - Full deploy
- `deploy-m13.sh`, `deploy-hotfix-m13.sh` - M13 deploys
- `DEPLOY_NOW.sh`, `MIGRATION_PLAN.sh`

### Test Scripts
- `test-rag-comprehensive.sh` - 20 RAG tests
- `quick-test.sh`
- Test suites in `tests/`

---

## 📁 CONFIG & DATA

### Environment Variables (`.env`)
```
ANTHROPIC_API_KEY=***
GEMINI_API_KEY=***
COHERE_API_KEY=***
API_KEYS_INTERNAL=***
API_KEYS_EXTERNAL=***
FIREBASE_PROJECT_ID=***
GCP_PROJECT_ID=***
```

### Config Files (`/config/`)
- `config/app/` - App configurations
- `config/auth/` - Auth settings
- `config/cloud/` - Cloud settings
- `config/misc/` - Firebase keys, OAuth tokens, metrics

### Firebase/GCP Keys
- `config/misc/firebase-service-account.json`
- `config/misc/zantara-v2-key.json`
- `config/misc/oauth2-tokens.json`

---

## 📊 ANALYTICS & MONITORING

### Analytics (`/analytics/`)
- `bigquery/` - BigQuery integration
- `datastudio/` - Data Studio dashboards
- `ml-pipeline/` - ML pipeline
- `streaming/` - Streaming analytics

### Infrastructure (`/infrastructure/`)
- Infrastructure as code
- Deployment configs

### Performance (`/performance/`)
- Performance monitoring configs

---

## 📚 DOCUMENTATION

### Root-level Docs (20 files)
- `AI_START_HERE.md`
- `CLI_STARTUP_COMMAND.md`
- `DEPLOYMENT_FINAL_STATUS.md`
- `HANDLER_MIGRATION_COMPLETE.md`
- `INSTAGRAM_SETUP_GUIDE.md`
- `MEMORY_FIXES_README.md`
- `PATCH_3_TAX_2025_REPORT.md`
- `PROJECT_STATUS.md`
- `WEBAPP_STABILITY_REPORT.md`
- `WHATSAPP_SETUP_COMPLETE.md`
- `ZANTARA_COLLABORATIVE_INTELLIGENCE_HANDOVER.md`
- Etc.

### `/docs/` Structure
- `docs/adr/` - Architecture Decision Records
- `docs/api/` - API documentation
- `docs/architecture/` - Architecture docs
- `docs/best-practices/` - Best practices
- `docs/deployment/` - Deployment guides
- `docs/engineering/` - Engineering docs
- `docs/setup/` - Setup guides

---

## 🔒 ENHANCED FEATURES

### `/enhanced-features/`
- `calendar-integration/`
- `email-automation/`
- `multi-document/`
- `reports/`
- `templates/`

---

## 🗂️ ALTRI ASSETS

### `/assets/` - Static assets
### `/best practice/` (192KB) - Best practices documentation
### `/dashboard/` - Dashboard UI
### `/public/` - Public static files
### `/static/` - Static resources
### `/routes/` - Additional routes
### `/services/` - Shared services
### `/utils/` - Utilities
### `/widget/` - Widget component
### `/workspace-addon/` - Workspace addon

---

## ⚠️ COMPONENTI DA NON PERDERE

### 🔴 CRITICI (devono andare in monorepo)
1. **RAG backend** con re-ranker (NON ha repo!)
2. **Integrations Orchestrator** (microservizio separato)
3. **Nuzantara Brain** (orchestrazione agenti)
4. **Oracle System** (simulazioni)
5. **Knowledge Base scripts** (export/upload)
6. **Tools Python** (bridge, testing)
7. **Config files** (Firebase, OAuth, .env)

### 🟡 IMPORTANTI (valutare)
- Analytics pipeline
- Enhanced features
- Best practices docs
- Infrastructure configs

### 🟢 OPZIONALI (valutare se scartare)
- `zantara_webapp_backup_20251002_065942/` (backup vecchio)
- `nuzantara-kb-broken/` (se veramente broken)
- `zantara-complete/`, `zantara-performance/` (empty?)

---

## 📋 PROSSIMI PASSI

### Prima di migrare:
1. ✅ Inventario completo (questo doc)
2. ⏳ Decidere cosa migrare
3. ⏳ Decidere struttura monorepo
4. ⏳ Plan di migrazione passo-passo

### Domande da risolvere:
- **Integrations Orchestrator**: Va nel monorepo o repo separato?
- **Nuzantara Brain**: Stesso discorso
- **Oracle System**: Stesso discorso
- **KB content**: Va versionato in Git o storage esterno?
- **Analytics**: Va nel monorepo o repo separato?

---

**Inventario creato**: 2025-10-04 16:00 CET
**Location**: `.claude/COMPLETE_INVENTORY.md`
