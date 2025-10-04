# NUZANTARA Monorepo

**Version**: 5.2.0
**Architecture**: Multi-app monorepo with npm workspaces

## 📁 Structure

```
nuzantara/
├── apps/               # Applications (8)
│   ├── backend-api/    # TypeScript Express API (96 handlers)
│   ├── backend-rag/    # Python FastAPI RAG (ChromaDB)
│   ├── webapp/         # Frontend (vanilla JS)
│   ├── landing/        # Landing page
│   ├── orchestrator/   # Integration orchestrator
│   ├── workspace-addon/# Google Workspace Add-on
│   ├── dashboard/      # Ops monitoring
│   └── brain/          # Future AI orchestrator
│
├── packages/           # Shared packages (6)
│   ├── types/          # Shared TypeScript types
│   ├── tools/          # OAuth2 refresh + utils
│   ├── widget/         # Embeddable chat widget
│   ├── kb-scripts/     # Knowledge base scripts
│   ├── utils-legacy/   # Legacy utilities
│   └── assets/         # Brand assets (logos)
│
├── infra/              # Infrastructure (3)
│   ├── analytics/      # BigQuery + ML pipeline
│   ├── terraform/      # IaC
│   └── .github/        # CI/CD workflows
│
├── docs/               # Documentation (4)
│   ├── api/            # API docs + OpenAPI
│   ├── best-practices/ # 192 KB, 27 files
│   ├── adr/            # Architecture decisions
│   └── architecture/   # System design
│
├── scripts/            # Automation (3)
│   ├── deploy/         # Deployment scripts
│   ├── monitoring/     # Monitoring tools
│   └── utils/          # Utility scripts
│
├── tests/              # Cross-app tests
│   └── integration/    # E2E tests
│
└── configs/            # Shared configs (5)
    ├── docker/         # Dockerfiles
    ├── cloud/          # GCP configs
    └── misc/           # Jest, Pa11y, etc.
```

## 🚀 Quick Start

```bash
# Install all dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Start development
npm run dev
```

## 🔧 Development

### Adding a new app
```bash
mkdir -p apps/my-app
cd apps/my-app
npm init -y
```

### Adding a new package
```bash
mkdir -p packages/my-package
cd packages/my-package
npm init -y
```

## 📦 Apps

### backend-api
- **Tech**: TypeScript, Express.js, Firebase
- **Port**: 8080
- **Features**: 96 handlers, Google Workspace integration, Memory system

### backend-rag
- **Tech**: Python, FastAPI, ChromaDB
- **Port**: 8000
- **Features**: RAG, Re-ranker, Pricing service (229 docs)

### webapp
- **Tech**: Vanilla JS, HTML/CSS
- **Deploy**: GitHub Pages
- **URL**: https://zantara.balizero.com

## 🏗️ Infrastructure

### CI/CD (GitHub Actions)
- **Build**: ubuntu-latest (AMD64)
- **Deploy**: Cloud Run (automatic)
- **Duration**: ~3 minutes

### Workflow
```
Desktop → git push → GitHub Actions (AMD64) → Cloud Run → Live
```

## 📚 Documentation

- **API Docs**: `docs/api/`
- **Best Practices**: `docs/best-practices/` (192 KB!)
- **Architecture**: `docs/architecture/`
- **Setup Guides**: `docs/setup/`

## 🔐 Secrets Management

Secrets are managed via:
- `.env.example` (template)
- GitHub Secrets (CI/CD)
- Google Secret Manager (production)

**Never commit**:
- `.env` files
- Service account keys
- API keys
- OAuth tokens

## 🎯 Migration Status

1. ✅ Phase 1: Setup complete (30 min)
2. ✅ Phase 2: Core apps migrated (3h)
3. ✅ Phase 3: Supporting apps migrated (2h)
4. ✅ Phase 4: Packages migrated (1h)
5. ✅ Phase 5: Docs/scripts organized (1h)
6. ✅ Phase 6: Config cleanup complete (1h)

**Total**: 8.5 hours → **COMPLETE** ✅

## 🔗 Links

- **Repository**: https://github.com/Balizero1987/nuzantara
- **Backend API**: https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app
- **RAG Backend**: https://zantara-rag-backend-himaadsxua-ew.a.run.app
- **Webapp**: https://zantara.balizero.com

---

**Last Updated**: 2025-10-04
**Status**: Phase 1 Complete ✅
