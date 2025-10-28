# 🎯 DECISIONE MONOREPO - NUZANTARA

**Data**: 2025-10-04
**Decisione**: MONOREPO COMPLETO

---

## ✅ COMPONENTI DA INCLUDERE

### 1. **Backend API (TypeScript)** - CORE
```
Path:     src/
Handlers: 96 registrati
Files:    60 handlers, 141 funzioni
Stack:    Node.js + TypeScript + Express
Status:   ✅ Production (Cloud Run)
```

**Categorie handlers**:
- Google Workspace (18) - Presenti ma non usati
- AI Services (7) - Claude, OpenAI, Gemini, Cohere
- ZANTARA Intelligence (20) - Collaborative features
- Bali Zero Business (12) - Oracle, KBLI, Team, Pricing
- Memory & Analytics (12) - Firestore, Dashboards
- Communication (2) - Slack, Discord (WhatsApp/Instagram via webhook)
- RAG System (3) - rag.query, rag.search, bali.zero.chat
- Maps (3) - Google Maps integration
- Identity (2) - Onboarding, identity resolution
- WebSocket (3) - Stats, broadcast, send
- OAuth2 (3) - Status, refresh, available

---

### 2. **RAG Backend (Python)** - CORE
```
Path:     zantara-rag/backend/
Stack:    Python 3.11 + FastAPI + ChromaDB
Features: Re-ranker (AMD64), multi-collection
Status:   ✅ Production (Cloud Run)
Size:     29MB
```

**Key files**:
- `app/main_cloud.py` (production)
- `services/reranker_service.py` ⭐ (NON deployato, ARM64 issue)
- `services/chroma_service.py`
- `services/claude_service.py`

---

### 3. **Webapp Frontend** - CORE
```
Path:     zantara_webapp/
Stack:    Vanilla JS + HTML + CSS
Status:   ✅ Production (GitHub Pages)
URL:      https://zantara.balizero.com
Size:     32KB
```

---

### 4. **Landing Page** - CORE
```
Path:     ~/Desktop/zantara_landpage/
Repo:     github.com/Balizero1987/zantara_landpage
Status:   ✅ Production (GitHub Pages)
URL:      https://balizero.com
```

---

### 5. **Integrations Orchestrator** - INCLUDE
```
Path:     integrations-orchestrator/
Purpose:  Job management microservice
Stack:    TypeScript + Express
Status:   🚧 Development (non deployato)
Size:     4.2MB
```

**Endpoints**:
- POST /job - Execute async job
- GET /jobs - List jobs
- POST /cleanup - Clean old executions
- ⚠️ NO API KEY (pubblico!)

**Decisione**: Includere nel monorepo come `apps/orchestrator/`

---

### 6. **Nuzantara Brain** - INCLUDE
```
Path:     nuzantara-brain/
Purpose:  AI orchestrator per conversazioni eleganti + culturali
Stack:    Python + FastAPI + Supabase
Status:   🚧 Development (mai deployato)
Size:     288KB
```

**Features**:
- 7 specialized agents (VISA, TAX, LEGAL, PROPERTY, KBLI, FINANCE, OPS)
- Emotional detection (frustrazione, confusione, successo)
- Cultural adaptation (bambu, gotong royong)
- Response refining (tecnico → elegante)

**Decisione**: Includere nel monorepo come `apps/brain/`

---

### 7. **Oracle System** - INCLUDE
```
Path:     oracle-system/
Purpose:  Intelligence network + simulations
Stack:    TypeScript
Status:   🚧 Development (solo VISA + KBLI completi)
Size:     12KB
```

**Agents**:
- VISA ORACLE (scraping immigration)
- KBLI EYE (business classification + OSS)
- TAX GENIUS (tax optimization) - in dev
- LEGAL ARCHITECT (property law) - in dev
- MORGANA (content creation) - in dev

**Features**:
- Simulation Engine (multi-agent collaboration)
- Monte Carlo testing
- Learning feedback loop
- Intelligence classification (PUBLIC/INTERNAL/CONFIDENTIAL)

**Decisione**: Includere nel monorepo come `apps/oracle/`

---

### 8. **Agents (src/agents/)** - DA DECIDERE ⚠️
```
Path:     src/agents/
Files:    6 agents (visa-oracle.ts 84KB, tax-genius.ts 20KB, etc.)
Status:   ❓ Classi con dati hardcoded, NON registrate come handlers
```

**Contenuto**:
- `visa-oracle.ts` (84KB) - Tutti i dati visa/KITAS 2025
- `tax-genius.ts` (20KB) - Tax calculations
- `legal-architect.ts` (14KB) - Legal services
- `property-sage.ts` (16KB) - Property services
- `eye-kbli.ts` (17KB) - KBLI classification
- `bali-zero-services.ts` (17KB) - Bali Zero services

**⚠️ PROBLEMA**: Duplicano logica in `bali-zero/` handlers ma con più dati!

**Opzioni**:
- A) Integrarli come handlers nel router (`visa.*`, `tax.*`, etc.)
- B) Spostarli in Oracle System
- C) Eliminarli (usare solo handlers esistenti)

**Decisione**: ⏳ **DA VALUTARE** (chiedere all'utente)

---

### 9. **Knowledge Base** - INCLUDE (solo scripts)
```
Path 1:   nuzantara-kb/ (working)
Path 2:   nuzantara-kb-broken/ (broken)
Path 3:   KB/ (48KB content)
Status:   🟡 Parzialmente funzionante
```

**Decisione**:
- ✅ Includere scripts (`nuzantara-kb/scripts/`)
- ✅ Includere KB structure
- ❌ NON versionare contenuti pesanti in Git (→ GCS bucket)

---

### 10. **Tools Python** - INCLUDE
```
Path:     tools/
Files:    zantara-bridge.py, testing-framework.py, libgen-downloader.py
Size:     ~50KB
```

**Decisione**: Includere in `packages/tools/` (shared)

---

### 11. **Analytics & Infrastructure** - INCLUDE (configs only)
```
Paths:    analytics/, infrastructure/, performance/
Size:     ~30KB configs
```

**Decisione**: Includere solo config files, NON dati/logs

---

### 12. **Docs & Scripts** - INCLUDE
```
Files:    20+ markdown docs, 10+ deploy scripts
Size:     ~200KB
```

**Decisione**: Includere in `docs/` root

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
│       ├── brain.yml                # AI orchestrator deploy (futuro)
│       └── oracle.yml               # Intelligence deploy (futuro)
│
├── apps/
│   ├── backend-api/                 # Main TypeScript backend
│   │   ├── src/
│   │   │   ├── handlers/ (96)       # Tutti gli handlers
│   │   │   ├── agents/ (6)          # ⚠️ DA DECIDERE
│   │   │   ├── middleware/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   ├── dist/
│   │   ├── Dockerfile.dist
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
│   │   └── (da Desktop/zantara_landpage/)
│   │
│   ├── orchestrator/                # Job management
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
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
│   ├── tools/                       # Python tools
│   └── kb-scripts/                  # KB management scripts
│
├── docs/                            # Documentation
│   ├── adr/
│   ├── api/
│   ├── deployment/
│   └── *.md (20+ files)
│
├── scripts/                         # Deploy & utility scripts
│   ├── deploy/
│   └── setup/
│
├── .env.example
├── README.md
└── MONOREPO_GUIDE.md
```

---

## 🚀 MIGRATION PLAN

### Phase 1: Setup & Backup ✅
1. ✅ Backup completo progetti esistenti
2. ✅ Create GitHub repo `nuzantara` (pubblico)
3. ✅ Setup monorepo structure

### Phase 2: Migrate Core Apps (Priority)
1. **backend-rag** (PRIORITÀ: re-ranker AMD64!)
   - Copy `zantara-rag/backend/` → `apps/backend-rag/`
   - Create workflow AMD64
   - Deploy & test

2. **backend-api**
   - Copy `src/` → `apps/backend-api/src/`
   - Copy `dist/`, `Dockerfile.dist`, `package.json`
   - Create workflow
   - Deploy & test

3. **webapp**
   - Copy `zantara_webapp/` → `apps/webapp/`
   - Update API endpoints
   - Deploy to GitHub Pages

4. **landing**
   - Copy `~/Desktop/zantara_landpage/` → `apps/landing/`
   - Deploy to GitHub Pages

### Phase 3: Migrate Supporting Apps
5. **orchestrator**
   - Copy `integrations-orchestrator/` → `apps/orchestrator/`
   - Add security (API key!)
   - Deploy

6. **brain** (futuro)
   - Copy `nuzantara-brain/` → `apps/brain/`
   - Complete development
   - Deploy when ready

7. **oracle** (futuro)
   - Copy `oracle-system/` → `apps/oracle/`
   - Complete agents
   - Deploy when ready

### Phase 4: Shared Code
8. **packages**
   - Copy `tools/` → `packages/tools/`
   - Copy `nuzantara-kb/scripts/` → `packages/kb-scripts/`
   - Create `packages/types/` (shared TypeScript)

### Phase 5: Docs & Config
9. **docs** - Copy all markdown + architecture docs
10. **scripts** - Copy all deploy scripts
11. **config** - Copy config files (exclude secrets!)

### Phase 6: Cleanup
12. Update all inter-app references
13. Test full stack locally
14. Deploy all apps
15. Verify production
16. Archive old repos

---

## ⚠️ DECISIONI PENDING

### 1. **src/agents/** - Cosa fare?
- [ ] Opzione A: Registrare come handlers (`visa.*`, `tax.*`)
- [ ] Opzione B: Spostare in Oracle System
- [ ] Opzione C: Eliminare (duplicati)

### 2. **KB Content** - Dove mettere?
- [ ] Opzione A: Versionare in Git (piccolo)
- [ ] Opzione B: GCS bucket (grande)
- [ ] Opzione C: Misto (config in Git, dati in GCS)

### 3. **Service Account Keys** - Come gestire?
- [ ] Opzione A: GitHub Secrets (per CI/CD)
- [ ] Opzione B: Secret Manager (production)
- [ ] Opzione C: Entrambi

---

## 📊 TIMELINE STIMATA

- **Phase 1** (Setup): 30 min
- **Phase 2** (Core apps): 3 ore
- **Phase 3** (Supporting): 2 ore
- **Phase 4** (Shared): 1 ora
- **Phase 5** (Docs): 30 min
- **Phase 6** (Cleanup): 1 ora

**TOTALE**: ~8 ore di lavoro

---

## ✅ VANTAGGI MONOREPO

1. **Tutto in un posto** - Facile navigazione
2. **Shared types** - No duplicati
3. **CI/CD unificata** - Un workflow per tutto
4. **Versioning sincronizzato** - Deploy atomici
5. **Deploy AMD64** - Re-ranker finalmente in produzione! ⭐

---

## 🔗 REPOS DA MANTENERE/ARCHIVIARE

**Mantenere** (redirect a monorepo):
- `zantara_webapp` → Archive, link a `nuzantara/apps/webapp`
- `zantara_landpage` → Archive, link a `nuzantara/apps/landing`

**Nuovo repo**:
- `nuzantara` → Monorepo principale ⭐

---

**Decisione finale**: 2025-10-04
**Prossimo step**: Risolvere decisioni pending, poi procedere con migration
