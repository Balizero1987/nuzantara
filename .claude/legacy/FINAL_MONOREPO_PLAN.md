# 🎯 FINAL MONOREPO PLAN - NUZANTARA (Aggiornato)

**Data**: 2025-10-04 17:15 CET
**Versione**: 2.0 (post-VERIFICATION)
**Status**: ✅ Complete - Ready for execution

---

## 📊 EXECUTIVE SUMMARY

**Componenti totali identificati**: **38** (era 31)
- ✅ 8 apps (era 7)
- ✅ 6 packages (era 4)
- ✅ 3 infrastructure components
- ✅ Documentation completa (+ 192 KB best practices!)
- ✅ Scripts & tools
- ❌ 4 componenti obsoleti esclusi

**Nuovi componenti trovati** (post-VERIFICATION):
1. `/best practice/` → 192 KB, 27 files ⭐⭐⭐
2. `openapi-rag-pricing.yaml` → API spec
3. `/tests/` → 2 cache tests (18 KB)
4. Root configs → `.pa11yci`, `.chat-local-config`

**Correzioni verificate**:
- ✅ `/utils/` root ≠ `src/utils/` (FILES DIVERSI, entrambi da includere)
- ✅ `/tests/` ha 2 test files (cache tests)
- ✅ Git commit count: 749 totali (non 35!)
- ✅ `/dashboard/` NON è duplicato di `/static/dashboard.html`

---

## 🗂️ STRUTTURA MONOREPO FINALE

```
nuzantara/  (NUOVO repo pubblico)
├── .github/
│   └── workflows/
│       ├── backend-api.yml          # TypeScript backend deploy
│       ├── backend-rag.yml          # ⭐ Python RAG AMD64 deploy
│       ├── webapp.yml               # Frontend deploy
│       ├── landing.yml              # Landing deploy
│       ├── orchestrator.yml         # Job system deploy
│       ├── workspace-addon.yml      # ⭐ Workspace add-on deploy
│       ├── dashboard.yml            # ⭐ Dashboard deploy
│       ├── brain.yml                # AI orchestrator (futuro)
│       └── oracle.yml               # Intelligence (futuro)
│
├── apps/
│   ├── backend-api/                 # Main TypeScript backend
│   │   ├── src/
│   │   │   ├── handlers/ (96)       # Tutti gli handlers
│   │   │   ├── agents/ (6)          # ⭐ Da migrare come domain-experts
│   │   │   ├── middleware/
│   │   │   ├── services/
│   │   │   ├── utils/               # Utils PRODUCTION (diversi da /utils/)
│   │   │   └── legacy-js/           # Legacy (da migrare)
│   │   ├── enhanced-features/       # Calendar, email, reports, templates
│   │   ├── dist/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── backend-rag/                 # Python RAG + Re-ranker
│   │   ├── app/
│   │   │   ├── main_cloud.py
│   │   │   └── main_integrated.py
│   │   ├── services/
│   │   │   ├── reranker_service.py  # ⭐ AMD64
│   │   │   ├── chroma_service.py
│   │   │   └── claude_service.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── webapp/                      # Frontend
│   │   ├── static/
│   │   ├── js/
│   │   └── styles/
│   │
│   ├── landing/                     # Landing page
│   │   └── (da ~/Desktop/zantara_landpage/)
│   │
│   ├── orchestrator/                # Job management
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── workspace-addon/             # ⭐ AGGIUNTO (Google Workspace)
│   │   ├── Code.js (14 KB)
│   │   ├── appsscript.json
│   │   └── DEPLOYMENT_GUIDE.md
│   │
│   ├── dashboard/                   # ⭐ CONFERMATO (Ops monitoring)
│   │   ├── index.html (22 KB)
│   │   ├── dashboard.js
│   │   └── styles.css
│   │
│   ├── brain/                       # AI orchestrator (futuro)
│   │   ├── src/
│   │   ├── agents/
│   │   └── knowledge/
│   │
│   └── oracle/                      # Intelligence system (futuro)
│       ├── agents/
│       ├── simulation-engine/
│       └── learning/
│
├── packages/                        # Shared code
│   ├── types/                       # Shared TypeScript types
│   ├── tools/                       # ⭐ CONFERMATO (14 scripts)
│   │   ├── test-v520-production.mjs
│   │   ├── refresh-oauth2-tokens.mjs  # ⭐ CRITICO
│   │   ├── zantara-bridge.py
│   │   ├── zantara-testing-framework.py
│   │   └── ... (10+ test scripts)
│   │
│   ├── widget/                      # ⭐ AGGIUNTO (Embeddable SDK)
│   │   ├── zantara-widget.html (21 KB)
│   │   ├── zantara-sdk.js (9.7 KB)
│   │   └── demo.html
│   │
│   ├── kb-scripts/                  # KB management scripts
│   ├── utils/                       # ⭐ ROOT utils (LEGACY - diversi da src/utils/)
│   │   ├── errors.ts (BridgeError, ValidationError)
│   │   ├── retry.ts
│   │   └── hash.ts
│   │
│   └── assets/                      # ⭐ CONFERMATO (Brand assets)
│       └── brand/
│           ├── zantara-logo-512.png
│           ├── zantara-final-logo.svg
│           └── ... (8 assets)
│
├── infra/                           # Infrastructure
│   ├── analytics/                   # BigQuery, ML, streaming
│   │   ├── bigquery/
│   │   │   ├── dataset-setup.sql
│   │   │   └── ml-models.sql
│   │   ├── datastudio/
│   │   ├── ml-pipeline/
│   │   └── streaming/
│   │
│   └── terraform/                   # IaC (se presente)
│
├── docs/                            # Documentation
│   ├── api/
│   │   └── openapi-rag-pricing.yaml  # ⭐ AGGIUNTO
│   │
│   ├── best-practices/              # ⭐⭐ AGGIUNTO (192 KB!)
│   │   ├── BEST_PRACTICES_2025.md (29 KB)
│   │   ├── BEST_PRACTICES_ZANTARA_BRIDGE.md (11 KB)
│   │   ├── perf-and-observability.md (12 KB)
│   │   ├── search-and-cms-best-practices.md (11 KB)
│   │   ├── REALTIME_BEST_PRACTICES.md (7.8 KB)
│   │   ├── api-playbook.md (4.7 KB)
│   │   └── ... (21+ altri files)
│   │
│   ├── adr/
│   ├── architecture/
│   ├── deployment/
│   ├── engineering/
│   ├── setup/
│   └── *.md (24 root markdown files)
│
├── scripts/
│   ├── deploy/                      # Deploy scripts
│   │   ├── deploy-quick.sh
│   │   ├── deploy-all-fixes.sh
│   │   ├── deploy-memory-fixes.sh
│   │   └── ... (10+ scripts)
│   │
│   └── testing/                     # Test scripts
│       ├── test-rag-comprehensive.sh
│       ├── quick-test.sh
│       └── ... (5+ scripts)
│
├── tests/                           # ⭐ AGGIUNTO (Root tests)
│   ├── cache-performance.test.cjs
│   └── cache-simple.test.cjs
│
├── .env.example                     # Consolidated env template
├── .dockerignore
├── .gcloudignore
├── .pa11yci                         # ⭐ AGGIUNTO (Accessibility config)
├── .chat-local-config               # ⭐ AGGIUNTO (Local dev config)
├── jest.config.js
├── global.d.ts
├── README.md
└── MONOREPO_GUIDE.md
```

---

## ✅ COMPONENTI INCLUSI (38 totali)

### Apps (8):
1. backend-api (TypeScript, 96 handlers)
2. backend-rag (Python, re-ranker AMD64)
3. webapp (frontend)
4. landing (landing page)
5. orchestrator (job management)
6. workspace-addon ⭐ (Google Workspace)
7. dashboard ⭐ (Ops monitoring)
8. brain (AI orchestrator - futuro)
9. oracle (intelligence - futuro)

### Packages (6):
10. types (shared TypeScript)
11. tools ⭐ (14 scripts, incluso `refresh-oauth2-tokens.mjs` CRITICO)
12. widget ⭐ (embeddable SDK)
13. kb-scripts (KB management)
14. utils ⭐ (legacy root utils, diversi da src/utils/)
15. assets ⭐ (brand assets)

### Infrastructure (3):
16. analytics (BigQuery, ML, streaming)
17. terraform (IaC)
18. .github/workflows (5 workflows, 606 lines)

### Documentation (4):
19. docs/api ⭐ (+ openapi-rag-pricing.yaml)
20. docs/best-practices ⭐⭐ (192 KB, 27 files!)
21. docs/adr, architecture, deployment, etc.
22. Root markdown (24 files)

### Scripts & Tests (3):
23. scripts/deploy (10+ scripts)
24. scripts/testing (5+ scripts)
25. tests/ ⭐ (2 cache tests)

### Config Files (5):
26. .env.example
27. .dockerignore, .gcloudignore
28. jest.config.js, global.d.ts
29. .pa11yci ⭐ (accessibility)
30. .chat-local-config ⭐ (local dev)

---

## ❌ COMPONENTI ESCLUSI (4 obsoleti)

1. `/routes/` (50 KB) - Legacy server only
2. `/services/` (10 KB) - Duplicato obsoleto
3. `/static/*.html` (107 KB) - Test files obsoleti
4. `backend_clean/` (20 KB) - Experimental

**Totale eliminato**: ~187 KB + complexity reduction

---

## 🔍 VERIFICHE COMPLETATE

### 1. `/utils/` vs `src/utils/` ✅ VERIFICATO
```
RISULTATO: FILES DIVERSI! Entrambi da includere

/utils/ (ROOT - LEGACY):
  - errors.ts: BridgeError, ValidationError, AuthenticationError, NotFoundError
  - retry.ts: Retry logic legacy
  - hash.ts: Hashing utilities legacy

src/utils/ (PRODUCTION):
  - errors.ts: ForbiddenError, BadRequestError, UnauthorizedError
  - retry.ts: Retry logic production (diverso)
  - hash.ts: Hashing production (diverso)
  - response.ts: Response utilities (SOLO in src/)

DECISIONE:
  - ✅ src/utils/ → apps/backend-api/src/utils/ (production)
  - ✅ /utils/ → packages/utils-legacy/ (legacy, per reference)
```

### 2. `/tests/` ✅ VERIFICATO
```
RISULTATO: 2 test files (cache tests)

Files:
  - cache-performance.test.cjs (9.6 KB)
  - cache-simple.test.cjs (8.6 KB)

DECISIONE: ✅ Includere in tests/ root (18 KB totali)
```

### 3. Git Commit Count ✅ VERIFICATO
```
RISULTATO: 749 commit totali (non 35!)

VERIFICATION diceva: 7 commit locali dal 2025-10-01
FINAL_DEEP_ANALYSIS diceva: 35 commit
REALTÀ: 749 commit totali nel repository

NOTA: Discrepanza era su commit "locali non pushati" vs "totali"
```

### 4. `/dashboard/` vs `/static/dashboard.html` ✅ VERIFICATO
```
RISULTATO: DIVERSI!

/dashboard/ (COMPLETO):
  - index.html (22 KB) - Full dashboard UI
  - dashboard.js (5.5 KB)
  - styles.css (7.5 KB)
  - Features: Real-time monitoring, Chart.js, Socket.io

/static/dashboard.html (SINGOLO FILE):
  - dashboard.html (22 KB) - Versione standalone/test

DECISIONE: ✅ Includere /dashboard/ completo, escludere /static/
```

---

## 🎯 MIGRATION PLAN - 6 Fasi

### Phase 1: Setup & Backup (30 min)
```bash
# 1. Backup progetti
cd ~/Desktop
tar -czf NUZANTARA_BACKUP_$(date +%Y%m%d_%H%M).tar.gz \
  NUZANTARA/ zantara_landpage/

# 2. Create GitHub repo
gh repo create Balizero1987/nuzantara --public --clone
cd nuzantara

# 3. Setup monorepo structure
mkdir -p apps/{backend-api,backend-rag,webapp,landing,orchestrator,workspace-addon,dashboard,brain,oracle}
mkdir -p packages/{types,tools,widget,kb-scripts,utils-legacy,assets}
mkdir -p infra/{analytics,terraform}
mkdir -p docs/{api,best-practices,adr,architecture,deployment,engineering,setup}
mkdir -p scripts/{deploy,testing}
mkdir -p tests
mkdir -p .github/workflows
```

### Phase 2: Migrate Core Apps (3 ore)

#### 2.1 Backend RAG (PRIORITÀ AMD64!)
```bash
# Copy RAG backend
cp -r ~/Desktop/NUZANTARA/zantara-rag/backend/* apps/backend-rag/

# Create AMD64 workflow
cat > .github/workflows/backend-rag.yml << 'EOF'
name: Deploy RAG AMD64
on:
  push:
    paths: ['apps/backend-rag/**']
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest  # ⭐ AMD64!
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - name: Build & Deploy
        run: |
          cd apps/backend-rag
          docker build -t gcr.io/involuted-box-469105-r0/backend-rag:$GITHUB_SHA .
          docker push gcr.io/involuted-box-469105-r0/backend-rag:$GITHUB_SHA
          gcloud run deploy zantara-rag-backend \
            --image gcr.io/involuted-box-469105-r0/backend-rag:$GITHUB_SHA \
            --region europe-west1 \
            --port 8000 \
            --update-env-vars ENABLE_RERANKER=true
EOF

# Setup GCP secret
gh secret set GCP_SA_KEY < ~/path/to/service-account-key.json

# Deploy!
git add apps/backend-rag .github/workflows/backend-rag.yml
git commit -m "feat: backend-rag with AMD64 re-ranker"
git push origin main
```

#### 2.2 Backend API
```bash
cp -r ~/Desktop/NUZANTARA/src apps/backend-api/
cp -r ~/Desktop/NUZANTARA/dist apps/backend-api/
cp ~/Desktop/NUZANTARA/Dockerfile.dist apps/backend-api/Dockerfile
cp ~/Desktop/NUZANTARA/package.json apps/backend-api/
cp ~/Desktop/NUZANTARA/tsconfig.json apps/backend-api/
# ... create workflow, deploy
```

#### 2.3 Webapp & Landing
```bash
cp -r ~/Desktop/NUZANTARA/zantara_webapp/* apps/webapp/
cp -r ~/Desktop/zantara_landpage/* apps/landing/
# ... update API endpoints, deploy
```

### Phase 3: Migrate Supporting Apps (2 ore)

#### 3.1 Orchestrator
```bash
cp -r ~/Desktop/NUZANTARA/integrations-orchestrator/* apps/orchestrator/
# Add API key security!
# Create workflow, deploy
```

#### 3.2 Workspace Add-on ⭐
```bash
cp -r ~/Desktop/NUZANTARA/workspace-addon/* apps/workspace-addon/
# Review appsscript.json
# Deploy to Google Workspace (manual via clasp)
```

#### 3.3 Dashboard ⭐
```bash
cp -r ~/Desktop/NUZANTARA/dashboard/* apps/dashboard/
# Update Socket.io endpoints
# Deploy as static site or Cloud Run
```

#### 3.4 Brain (futuro)
```bash
cp -r ~/Desktop/NUZANTARA/nuzantara-brain/* apps/brain/
# Mark as WIP
```

#### 3.5 Oracle (futuro)
```bash
cp -r ~/Desktop/NUZANTARA/oracle-system/* apps/oracle/
# Mark as WIP
```

### Phase 4: Migrate Packages (1 ora)

#### 4.1 Tools ⭐
```bash
cp -r ~/Desktop/NUZANTARA/tools/* packages/tools/
# CRITICAL: Verify refresh-oauth2-tokens.mjs works
```

#### 4.2 Widget ⭐
```bash
cp -r ~/Desktop/NUZANTARA/widget/* packages/widget/
# Update API endpoints in zantara-sdk.js
```

#### 4.3 Assets ⭐
```bash
cp -r ~/Desktop/NUZANTARA/assets/* packages/assets/brand/
```

#### 4.4 Utils Legacy ⭐
```bash
cp -r ~/Desktop/NUZANTARA/utils/* packages/utils-legacy/
# Add README.md explaining it's legacy (use src/utils/ instead)
```

#### 4.5 KB Scripts
```bash
cp -r ~/Desktop/NUZANTARA/nuzantara-kb/scripts/* packages/kb-scripts/
```

### Phase 5: Migrate Docs, Scripts, Tests (1 ora)

#### 5.1 Best Practices ⭐⭐
```bash
cp -r ~/Desktop/NUZANTARA/"best practice"/* docs/best-practices/
# 192 KB, 27 files!
```

#### 5.2 API Docs ⭐
```bash
cp ~/Desktop/NUZANTARA/openapi-rag-pricing.yaml docs/api/
cp -r ~/Desktop/NUZANTARA/docs/api/* docs/api/
```

#### 5.3 Other Docs
```bash
cp -r ~/Desktop/NUZANTARA/docs/* docs/
cp ~/Desktop/NUZANTARA/*.md docs/
```

#### 5.4 Scripts
```bash
cp ~/Desktop/NUZANTARA/deploy-*.sh scripts/deploy/
cp ~/Desktop/NUZANTARA/test-*.sh scripts/testing/
cp ~/Desktop/NUZANTARA/scripts/* scripts/
```

#### 5.5 Tests ⭐
```bash
cp ~/Desktop/NUZANTARA/tests/*.test.cjs tests/
```

### Phase 6: Config & Cleanup (1 ora)

#### 6.1 Root Configs
```bash
cp ~/Desktop/NUZANTARA/.env.example .
cp ~/Desktop/NUZANTARA/.dockerignore .
cp ~/Desktop/NUZANTARA/.gcloudignore .
cp ~/Desktop/NUZANTARA/jest.config.js .
cp ~/Desktop/NUZANTARA/global.d.ts .
cp ~/Desktop/NUZANTARA/.pa11yci .
cp ~/Desktop/NUZANTARA/.chat-local-config .
cp ~/Desktop/NUZANTARA/package.json .  # Root package.json
```

#### 6.2 GitHub Workflows ⭐
```bash
cp ~/Desktop/NUZANTARA/.github/workflows/* .github/workflows/
# REVIEW ci-cd.yml (391 lines!) - adapt for monorepo paths
```

#### 6.3 README & Guide
```bash
# Create comprehensive README.md
# Create MONOREPO_GUIDE.md
# Update all docs with new structure
```

#### 6.4 Final Commit
```bash
git add .
git commit -m "feat: complete monorepo migration

- 8 apps (backend-api, backend-rag, webapp, landing, orchestrator, workspace-addon, dashboard, brain, oracle)
- 6 packages (types, tools, widget, kb-scripts, utils-legacy, assets)
- 192 KB best practices docs
- Complete infrastructure & workflows
- All tests, scripts, configs

BREAKING CHANGES:
- New repo structure
- New import paths
- Separate app deployments
"
git push origin main
```

---

## 🔐 SECRETS & ENV VARS

### GitHub Secrets (per CI/CD):
```bash
gh secret set GCP_SA_KEY < service-account-key.json
gh secret set ANTHROPIC_API_KEY
gh secret set GEMINI_API_KEY
gh secret set COHERE_API_KEY
gh secret set SLACK_WEBHOOK_URL
gh secret set DISCORD_WEBHOOK_URL
```

### .env.example Template:
```bash
# ===  API KEYS ===
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
COHERE_API_KEY=...
OPENAI_API_KEY=...

# === ZANTARA INTERNAL ===
API_KEYS_INTERNAL=zantara-internal-dev-key-2025
API_KEYS_EXTERNAL=zantara-external-dev-key-2025

# === FIREBASE / GCP ===
FIREBASE_PROJECT_ID=involuted-box-469105-r0
GOOGLE_APPLICATION_CREDENTIALS=./config/service-account.json
GCP_PROJECT_ID=involuted-box-469105-r0

# === GOOGLE WORKSPACE ===
IMPERSONATE_USER=zero@balizero.com
GDRIVE_AMBARADAM_DRIVE_ID=...

# === WEBHOOKS ===
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# === OAUTH2 ===
# (tokens in config/misc/oauth2-tokens.json)
```

---

## 📊 TOTALE COMPONENTI FINALI

| Categoria | Count | Note |
|-----------|-------|------|
| Apps | 8 | backend-api, backend-rag, webapp, landing, orchestrator, workspace-addon, dashboard, brain, oracle |
| Packages | 6 | types, tools, widget, kb-scripts, utils-legacy, assets |
| Infra | 3 | analytics, terraform, workflows |
| Docs | 4 | api, best-practices (192KB!), adr, architecture, etc. |
| Scripts | 2 | deploy, testing |
| Tests | 1 | root tests/ |
| Configs | 5 | .env, docker, gcloud, jest, pa11y, chat-local |

**TOTALE**: **38 componenti** (vs 31 iniziale, +7 da VERIFICATION)

---

## ✅ CHECKLIST FINALE

### Pre-Migration
- [x] Inventory completo (38 componenti)
- [x] Decisioni pending risolte (routes, services, static, backend_clean obsoleti)
- [x] Verifiche duplicazioni (utils, tests, dashboard)
- [x] Struttura monorepo definita
- [ ] Backup progetti ⏳

### Migration
- [ ] Phase 1: Setup & Backup (30 min)
- [ ] Phase 2: Core apps (3 ore) - **PRIORITÀ: backend-rag AMD64!**
- [ ] Phase 3: Supporting apps (2 ore)
- [ ] Phase 4: Packages (1 ora)
- [ ] Phase 5: Docs, scripts, tests (1 ora)
- [ ] Phase 6: Config & cleanup (1 ora)

### Post-Migration
- [ ] Deploy all apps
- [ ] Verify production
- [ ] Archive old repos
- [ ] Update documentation
- [ ] Team notification

---

## 📈 TIMELINE

- **Prep**: 30 min
- **Core migration**: 3 ore
- **Supporting**: 2 ore
- **Packages**: 1 ora
- **Docs/Scripts**: 1 ora
- **Config/Cleanup**: 1 ora

**TOTALE STIMATO**: **8.5 ore**

---

## 🎯 SUCCESS METRICS

1. ✅ Re-ranker AMD64 deployed (PRIORITÀ #1)
2. ✅ Tutti i 96 handlers funzionanti
3. ✅ Frontend connesso a backend
4. ✅ Workspace add-on deployabile
5. ✅ Dashboard monitoring attivo
6. ✅ Widget embeddable pronto
7. ✅ CI/CD workflows funzionanti
8. ✅ Zero downtime production

---

**Plan finalized**: 2025-10-04 17:20 CET
**Ready for execution**: ✅ YES
**Approval needed**: User confirmation to proceed
