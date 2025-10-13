# NUZANTARA Scripts

> **Purpose**: Automation scripts for deployment, setup, testing, and maintenance
> **Quick Access**: Use `make` commands for most common tasks (see root `Makefile`)
> **Total Scripts**: ~62 automation scripts

---

## 📁 Directory Structure

```
scripts/
├── deploy/ (6 scripts)       # Production deployment
├── setup/ (6 scripts)        # Initial configuration
├── (root scripts)            # Testing, utilities
└── README.md                 # This file
```

---

## 🚀 Deployment Scripts (`deploy/`)

### `deploy-production.sh` (5,172 lines) ⭐

**Purpose**: Full production deployment to Cloud Run

**Usage**:
```bash
# Via Makefile (recommended)
make deploy-backend

# Direct
./scripts/deploy/deploy-production.sh
```

**What it does**: Tests → Build → Docker → Push to GCR → Deploy → Verify

**Runtime**: ~8-10 minutes

---

### `deploy-full-stack.sh` (5,322 lines)

**Purpose**: Deploy entire stack (Backend + RAG + Frontend)

**Usage**:
```bash
make deploy-full
```

**Runtime**: ~15-20 minutes

---

### `deploy-code-only.sh` (977 lines)

**Purpose**: Quick deploy (skip tests) ⚡

**Usage**:
```bash
make deploy-backend-quick
```

**Runtime**: ~5 minutes

**⚠️ Warning**: Skips tests!

---

### `deploy-rebuild.sh` (2,641 lines)

**Purpose**: Clean rebuild + deploy

**When**: After dependency changes, corrupted build

**Runtime**: ~12-15 minutes

---

### `deploy-to-production.sh` (2,217 lines)

**Purpose**: Alternative production deploy (simplified)

**Runtime**: ~8 minutes

---

### `deploy-direct.sh` (934 lines)

**Purpose**: Emergency direct deploy (minimal checks)

**Runtime**: ~3 minutes

**⚠️ Use with caution**: No tests, no verification!

---

## 🔧 Setup Scripts (`setup/`)

### `setup-google-admin.sh`

**Purpose**: Setup Google Workspace Admin SDK

**Steps**: Enable API → Create service account → Grant delegation → Download credentials

---

### `setup-chat-app.sh`

**Purpose**: Initialize Google Chat app integration

---

### `setup-google-chat-local.sh`

**Purpose**: Configure Google Chat for local development (with ngrok)

---

### `ngrok-setup.sh`

**Purpose**: Setup ngrok tunnel for webhook testing

**Usage**:
```bash
./scripts/setup/ngrok-setup.sh
# Output: Forwarding https://abc123.ngrok.io -> http://localhost:8080
```

---

### `install-ai-system-v2.sh`

**Purpose**: Install AI system dependencies (npm + Python)

---

## 🧪 Testing Scripts (Root Level)

### `test-rag-comprehensive.sh`

**Purpose**: Comprehensive RAG backend testing

**Tests**: FAISS search, re-ranker, ChromaDB, latency

**Runtime**: ~5 minutes

**Usage**:
```bash
./test-rag-comprehensive.sh
```

---

### `test-all-30-handlers.sh`

**Purpose**: Test 30 most-used handlers

**Runtime**: ~2 minutes

**Usage**:
```bash
npm run test:all
# OR
./test-all-30-handlers.sh
```

---

### `test-new-handlers.sh`

**Purpose**: Test recently added handlers (via git diff)

**Usage**:
```bash
npm run test:handlers
```

---

### `test-integrations.sh` (`scripts/`)

**Purpose**: Integration tests for external services

**Tests**: Google Workspace, WhatsApp, Instagram, RAG, Firestore

**Runtime**: ~3 minutes

---

## 🚨 Emergency Scripts

### `deploy-hotfix-m13.sh`

**Purpose**: Emergency hotfix deploy

**Runtime**: ~4 minutes

---

### `disaster-recovery-test.sh` (`scripts/`)

**Purpose**: Test disaster recovery procedures

**Runtime**: ~10 minutes

**⚠️ Warning**: Run only in non-production!

---

## 🔄 CI/CD Scripts

### `blue-green-deploy.sh` (`scripts/`)

**Purpose**: Blue-green deployment (zero downtime)

**Runtime**: ~15 minutes (gradual traffic shift)

**How**: Deploy green → Health check → Shift traffic (10% → 50% → 100%) → Keep blue for rollback

---

## 📊 Monitoring Scripts

### `check_all_repos.sh` (Root)

**Purpose**: Check status of all project repos

---

### `clean_and_push.sh` (Root)

**Purpose**: Clean workspace + commit + push

**Usage**:
```bash
./clean_and_push.sh "commit message"
```

---

## 🎯 Quick Reference

### Most Common Tasks

| Task | Command | Runtime |
|------|---------|---------|
| **Full deploy** | `make deploy-backend` | ~8 min |
| **Quick deploy** | `make deploy-backend-quick` | ~5 min |
| **Full stack** | `make deploy-full` | ~15 min |
| **Test handlers** | `npm run test:all` | ~2 min |
| **Test RAG** | `./test-rag-comprehensive.sh` | ~5 min |
| **Setup webhooks** | `./scripts/setup/ngrok-setup.sh` | ~1 min |

### Emergency Procedures

| Issue | Command | Notes |
|-------|---------|-------|
| **Service down** | `make rollback` | Rollback to previous revision |
| **Hotfix needed** | `./deploy-hotfix-m13.sh` | Emergency deploy |
| **Build corrupted** | `./scripts/deploy/deploy-rebuild.sh` | Clean rebuild |
| **Webhook broken** | `./scripts/setup/ngrok-setup.sh` | Reset webhooks |

---

## 🔗 Related Documentation

- **Makefile**: Root `Makefile` (command center, use `make help`)
- **Architecture**: `ARCHITECTURE.md` (deployment architecture)
- **Decisions**: `DECISIONS.md` (ADR-001: GitHub Actions AMD64)
- **Workflows**: `.github/workflows/` (CI/CD automation)

---

## 🆘 Troubleshooting

### Permission denied
```bash
chmod +x scripts/path/to/script.sh
```

### Can't find files (wrong directory)
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA\ 2/
./scripts/deploy/deploy-production.sh
```

### Docker build fails
```bash
docker ps  # Check Docker is running
docker system prune -a  # Clean cache
make rebuild
```

### GCP auth fails
```bash
gcloud auth login
gcloud config set project involuted-box-469105-r0
gcloud auth list
```

---

## 📊 Script Statistics

- **deploy/**: 6 scripts (~16,000 lines)
- **setup/**: 6 scripts
- **testing**: 4+ scripts (root)
- **utilities**: 10+ scripts
- **Total**: ~62 scripts

---

**Version**: 1.1.0 (Updated with real script analysis)
**Created**: 2025-10-04 by Claude Sonnet 4.5 (m3)
**Last Updated**: 2025-10-04
**Maintained by**: All project contributors
