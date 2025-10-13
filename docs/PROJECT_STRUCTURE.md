# 📁 NUZANTARA Project Structure

> **Last Updated**: 2025-10-01
> **Reorganized**: Files cleaned and categorized for clarity

---

## 🎯 Directory Overview

```
NUZANTARA/
├── 📜 docs/                    # All documentation (86 files)
├── 🚀 scripts/                 # All scripts (59 files)
├── ⚙️ config/                   # All configuration (27 files)
├── 🧪 tools/                    # Utility tools (15 files)
├── 🏗️ src/                      # TypeScript backend source
├── 📦 dist/                    # Compiled TypeScript output
├── 🐍 zantara-rag/             # Python RAG backend
├── 🌐 zantara_webapp/          # Frontend web application
├── 🧪 tests/                   # Test suites
├── 🔧 infrastructure/          # IaC, K8s configs
└── [Essential config files]
```

---

## 📚 Detailed Structure

### 📜 `docs/` - Documentation (86 files)

All project documentation organized by category:

```
docs/
├── deployment/        # Deployment guides & status
│   ├── DEPLOY_COMPLETE.md
│   ├── FINAL_DEPLOYMENT_SUMMARY.md
│   ├── PRODUCTION_STATUS.md
│   └── API_KEY_STATUS.md
│
├── api/              # API documentation
│   ├── API_DOCUMENTATION.md
│   ├── ENDPOINTS_DOCUMENTATION.md
│   ├── PRICING_API_DOCUMENTATION.md
│   └── endpoint-summary.md
│
├── setup/            # Setup & configuration guides
│   ├── GOOGLE_ADMIN_CONFIG.md
│   ├── CHATGPT_CONFIGURATION.md
│   ├── CUSTOM_GPT_SETUP.md
│   ├── RAG_INTEGRATION_CHECKLIST.md
│   └── ENV_PRODUCTION_TEMPLATE.md
│
└── architecture/     # System architecture & design
    ├── ANTI_HALLUCINATION_SYSTEM.md
    ├── BALI_ZERO_COMPLETE_TEAM_SERVICES.md
    ├── PROJECT_STRUCTURE.md (this file)
    ├── ZANTARA_*.md (system docs)
    └── SESSION_*.md (development logs)
```

**When to use**:
- 📖 Learning how the system works → `architecture/`
- 🚀 Deploying to production → `deployment/`
- 🔧 Setting up integrations → `setup/`
- 📡 Understanding API endpoints → `api/`

---

### 🚀 `scripts/` - Shell Scripts (59 files)

Operational scripts organized by purpose:

```
scripts/
├── deploy/           # Deployment automation
│   ├── deploy-to-production.sh      # Main production deploy
│   ├── deploy-full-stack.sh         # Full stack deploy
│   ├── deploy-code-only.sh          # Code-only deploy
│   └── deploy-rebuild.sh            # Rebuild & deploy
│
├── setup/            # Initial setup & configuration
│   ├── setup-google-admin.sh
│   ├── setup-chat-app.sh
│   ├── install-ai-system-v2.sh
│   └── ngrok-setup.sh
│
├── monitoring/       # Health checks & monitoring
│   ├── performance-test.sh
│   ├── memory-tools.sh
│   └── monitor-zantara-production.sh
│
└── utils/            # Utility & helper scripts
    ├── fix-*.sh
    ├── test-*.sh
    └── quick-deploy-*.sh
```

**When to use**:
- 🚀 Deploying → `scripts/deploy/`
- ⚙️ Setting up environment → `scripts/setup/`
- 📊 Monitoring production → `scripts/monitoring/`
- 🔧 Quick fixes → `scripts/utils/`

---

### ⚙️ `config/` - Configuration Files (27 files)

All configuration files organized by type:

```
config/
├── cloud/            # Cloud & infrastructure config
│   ├── cloud-run-config.yaml
│   ├── cloudbuild*.yaml
│   ├── monitoring-config.json
│   └── scheduler-config.yaml
│
├── app/              # Application configuration
│   ├── chat-app-config.json
│   ├── chat-app-manifest.json
│   ├── openapi*.yaml
│   └── service-config.json
│
└── misc/             # Other configs
    ├── test-conversation.json
    ├── metrics.json
    └── *.txt files
```

**When to use**:
- ☁️ Cloud deployments → `config/cloud/`
- 🔧 App behavior → `config/app/`
- 🧪 Test configs → `config/misc/`

---

### 🧪 `tools/` - Utility Tools (15 files)

Python and JavaScript utilities:

```
tools/
├── api_simple.py              # Simple API tester
├── collector.py               # Data collector
├── upload_openapi.py          # OpenAPI uploader
├── test-*.mjs                 # Test utilities
└── refresh-oauth2-tokens.mjs  # OAuth token refresh
```

**When to use**:
- 🧪 Testing APIs → `api_simple.py`
- 🔄 OAuth management → `refresh-oauth2-tokens.mjs`
- 📊 Data collection → `collector.py`

---

### 🏗️ `src/` - TypeScript Backend

Main backend application source code:

```
src/
├── handlers/         # 136 business logic handlers
├── middleware/       # Auth, monitoring, validation
├── routes/           # API routes
├── services/         # Business services
├── types/            # TypeScript type definitions
└── legacy-js/        # Legacy JavaScript files (pre-TS)
```

**Entry point**: `src/index.ts` → compiles to `dist/index.js`

---

### 📦 `dist/` - Compiled Output

TypeScript compilation output (production-ready code):

```
dist/
├── index.js          # Main entry point
├── handlers/         # Compiled handlers
├── routes/           # Compiled routes
└── [mirrors src/ structure]
```

**Used by**: Docker container in production

---

### 🐍 `zantara-rag/` - Python RAG Backend

AI-powered search and retrieval system:

```
zantara-rag/
├── backend/
│   ├── app/          # FastAPI application
│   ├── services/     # ChromaDB, search services
│   ├── kb/           # Knowledge base (214 books, 239 PDFs)
│   └── data/         # ChromaDB data (local only)
└── scripts/          # RAG utilities
```

**Entry point**: `backend/app/main_simple.py` (production)

---

### 🌐 `zantara_webapp/` - Frontend

Web application frontend:

```
zantara_webapp/
├── js/
│   ├── api-config.js       # ⚠️ CRITICAL: API endpoints
│   └── [other JS modules]
├── css/                    # Styles
├── static/                 # HTML pages
│   ├── chat.html
│   ├── login-claude-style.html
│   └── dashboard.html
└── index.html              # Entry point
```

**Production URL**: https://balizero1987.github.io/zantara_webapp

---

## 🎯 Quick Reference

### Common Tasks

| Task | Location |
|------|----------|
| Deploy to production | `scripts/deploy/deploy-to-production.sh` |
| View API docs | `docs/api/API_DOCUMENTATION.md` |
| Configure cloud | `config/cloud/` |
| Run tests | `scripts/utils/test-*.sh` |
| Check architecture | `docs/architecture/` |
| Modify handlers | `src/handlers/` |
| Frontend config | `zantara_webapp/js/api-config.js` |
| RAG backend | `zantara-rag/backend/app/` |

---

## 📊 File Count Summary

| Category | Files | Purpose |
|----------|-------|---------|
| Documentation | 86 | Guides, architecture, APIs |
| Scripts | 59 | Deploy, setup, monitoring |
| Config | 27 | Cloud, app, test configs |
| Tools | 15 | Utilities, testers |
| **Root items** | **42** | Essential files only |

---

## 🧹 Maintenance

### Adding New Files

- **Documentation** → `docs/{category}/`
- **Scripts** → `scripts/{category}/`
- **Config** → `config/{type}/`
- **Tools** → `tools/`
- **Code** → `src/{module}/`

### Cleaning Up

Run periodic cleanup:
```bash
# Check for old files
find . -name "*.old" -o -name "*.bak" -o -name "*~"

# Check for large files
find . -type f -size +10M
```

---

## 🚨 Important Notes

1. **Never commit secrets** - Use `.env.template`, not `.env`
2. **API config is critical** - `zantara_webapp/js/api-config.js` controls frontend behavior
3. **Use git mv** - Preserves history when moving files
4. **Keep root clean** - Only essential config files in root

---

## 📝 Version History

- **2025-10-01**: Major reorganization - 150+ root files → 42 items
- **Pre-2025-10**: Unorganized structure with files scattered

---

**Maintained by**: NUZANTARA Team
**Questions?**: See `AI_START_HERE.md` or `docs/architecture/`
