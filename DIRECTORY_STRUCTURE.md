# 📁 NUZANTARA Directory Structure

**Organized:** October 22, 2025
**Status:** ✅ Clean and Organized

---

## 🏗️ Root Directory Structure

```
NUZANTARA-RAILWAY/
├── apps/                    # Main applications
│   ├── backend-rag/        # Python RAG backend (FastAPI + ChromaDB)
│   ├── backend-ts/         # TypeScript backend (Express)
│   └── webapp/             # Frontend web application
│
├── config/                  # Configuration files
│   ├── .env.example        # Environment variables template
│   ├── railway.toml        # Railway deployment config
│   ├── .eslintrc.js        # ESLint configuration
│   ├── tsconfig.json       # TypeScript configuration
│   └── package-webapp.json # Webapp package config
│
├── docs/                    # Documentation
│   ├── reports/            # System reports and summaries
│   ├── deployment/         # Deployment guides and reports
│   ├── testing/            # Testing documentation
│   ├── archive/            # Archived/old documentation
│   ├── *.md                # General documentation files
│   └── ossatura.png        # Architecture diagram
│
├── tests/                   # Test files
│   ├── integration/        # Integration test scripts
│   │   ├── test_*.py      # Python integration tests
│   │   └── test_*.sh      # Shell test scripts
│   └── manual/             # Manual test files
│       ├── test_*.js      # JavaScript tests
│       └── *.html         # HTML test pages
│
├── testsprite_tests/        # Sprite testing suite
│
├── scripts/                 # Utility scripts
│
├── projects/                # Project-specific code
│
├── shared/                  # Shared code/libraries
│
├── data/                    # Data directory (gitignored)
│
├── logs/                    # Log files (gitignored)
│
├── dist/                    # Build output (gitignored)
│
├── node_modules/            # Node dependencies (gitignored)
│
├── archive/                 # Archived files
│
├── INTEL_SCRAPING/         # Intelligence scraping module
│
├── package.json            # Main Node.js package config
├── package-lock.json       # Node.js lockfile
├── README.md               # Main project README
└── global.d.ts             # TypeScript global declarations

```

---

## 📋 Principal Files (Root Level)

These files remain in root as they are essential:

- **package.json** - Main Node.js configuration
- **package-lock.json** - Dependency lockfile
- **README.md** - Project documentation
- **global.d.ts** - TypeScript definitions
- **.env** - Environment variables (not in git)
- **.gitignore** - Git ignore rules
- **.dockerignore** - Docker ignore rules
- **.python-version** - Python version specification
- **.railway** - Railway deployment state

---

## 📊 Documentation Organization

### docs/reports/
Contains all system reports:
- Session summaries
- Implementation reports
- Status reports
- Test results
- Italian documentation (_IT.md files)

### docs/deployment/
Deployment-related documentation:
- Deployment checklists
- Deployment reports
- Deployment guides

### docs/testing/
Testing documentation:
- Test instructions
- Test plans
- Test results

### docs/archive/
Old or superseded documentation:
- Historical reports
- Deprecated guides
- Old summaries

---

## 🧪 Test Organization

### tests/integration/
Automated integration tests:
- **test_*.py** - Python integration tests
- **test_*.sh** - Shell script tests

### tests/manual/
Manual testing files:
- **test_*.js** - JavaScript test code
- **test_*.html** - HTML test pages

---

## ⚙️ Configuration Organization

### config/
All configuration files centralized:
- Environment templates
- Build configurations
- Linting rules
- Deployment configs

---

## 🎯 Benefits of This Structure

### Before Cleanup:
- ❌ 70+ files in root directory
- ❌ Mixed documentation, tests, configs
- ❌ Hard to find specific files
- ❌ Confusing for new developers

### After Cleanup:
- ✅ ~10 essential files in root
- ✅ Organized by purpose (docs, tests, configs)
- ✅ Easy navigation
- ✅ Clear structure for developers

---

## 📝 File Naming Conventions

### Documentation Files:
- `*_REPORT.md` → docs/reports/
- `*_SUMMARY.md` → docs/reports/
- `*_GUIDE.md` → docs/
- `*_IT.md` → docs/reports/ (Italian)
- `*DEPLOYMENT*.md` → docs/deployment/

### Test Files:
- `test_*.py` → tests/integration/
- `test_*.sh` → tests/integration/
- `test_*.js` → tests/manual/
- `test_*.html` → tests/manual/

### Config Files:
- `*.config.js` → config/
- `tsconfig.json` → config/
- `.eslintrc.*` → config/
- `railway.toml` → config/

---

## 🔍 Quick Find Guide

**Looking for...**

- **Reports?** → `docs/reports/`
- **Deployment docs?** → `docs/deployment/`
- **Test files?** → `tests/integration/` or `tests/manual/`
- **Config files?** → `config/`
- **Old docs?** → `docs/archive/`
- **Architecture diagram?** → `docs/ossatura.png`
- **Main code?** → `apps/backend-rag/` or `apps/backend-ts/` or `apps/webapp/`

---

## 📦 What's in Each App

### apps/backend-rag/ (Python)
- FastAPI backend
- ChromaDB vector store
- RAG search service
- 13 API routers
- 37 service modules
- Core RAG modules (embeddings, chunker, parsers)

### apps/backend-ts/ (TypeScript)
- Express.js backend
- PostgreSQL integration
- Session management
- CRM system
- Team tracking

### apps/webapp/ (Frontend)
- HTML/CSS/JavaScript
- PWA support
- Chat interface
- Dashboard
- Client-side features

---

## 🚀 Next Steps

### To add new files:
1. **Documentation?** → Put in `docs/` (or appropriate subdirectory)
2. **Tests?** → Put in `tests/integration/` or `tests/manual/`
3. **Config?** → Put in `config/`
4. **Keep root clean!** → Only essential project files

### To find files:
1. Check this document first
2. Use the Quick Find Guide above
3. Follow naming conventions

---

## ✅ Cleanup Complete

**Date:** October 22, 2025
**Files organized:** 70+
**Root directory:** Clean and minimal
**Documentation:** Properly categorized
**Tests:** Centralized
**Configs:** Unified

**Status:** 🟢 **PRODUCTION READY**

