# 🎯 ZANTARA Prompt Templates

> **For use with Prompt Optimizer** (`zp` command)
>
> These templates guide Haiku to transform natural language → detailed actionable prompts

---

## 📋 Template Format

Each template has:
- **Triggers**: Keywords that match this template
- **Template**: The expanded prompt structure

---

## 🔍 System Health & Monitoring

### system_health_check
**Triggers**: controlli, health, status, verifica sistema, check sistema, diagnostics
**Template**:
```
Esegui controlli completi del sistema ZANTARA:

1. Health checks:
   - Backend TS: curl https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/health
   - RAG Backend: curl https://zantara-rag-backend-himaadsxua-ew.a.run.app/health
   - WebApp: verifica https://zantara.balizero.com accessibile

2. System status:
   - Git: verifica branch, uncommitted changes, sync con remote
   - Active sessions: cat .claude/active-sessions.json
   - Active locks: ls -lh .claude/locks/
   - Recent deployments: git log --oneline -5

3. Service metrics:
   - Handlers count: POST /call {"key":"system.handlers.list"}
   - Tools available: POST /call {"key":"system.handlers.tools"}
   - ChromaDB collections: verifica numero collezioni

4. Report risultati in formato strutturato con ✅/❌
```

### logs_check
**Triggers**: logs, errori, error log, check logs, vedi logs
**Template**:
```
Analizza logs recenti del sistema:

1. Backend logs: gcloud logging read --limit 50 --format json
2. RAG logs: gcloud logging read --filter="resource.labels.service_name=zantara-rag-backend" --limit 50
3. Filtra per errori (4xx, 5xx, exceptions)
4. Identifica pattern ricorrenti
5. Report con:
   - Numero errori per tipo
   - Errori critici (se presenti)
   - Suggerimenti fix
```

---

## 🚀 Deployment

### deploy_backend
**Triggers**: deploy backend, rilascia backend, push backend, deploy ts
**Template**:
```
Deploy TypeScript backend to production:

1. Read deployment guide: .claude/handovers/deploy-backend.md
2. Verify git status (must be clean, synced with remote)
3. Build: npm run build
4. Docker: docker buildx build --platform linux/amd64 -f Dockerfile.dist
5. Push to GCR: docker push gcr.io/involuted-box-469105-r0/zantara-v520-nuzantara:TAG
6. Deploy: gcloud run deploy zantara-v520-nuzantara --region europe-west1
7. Verify: health check + smoke test (scripts/onboarding_smoke.sh)
8. Update diary with:
   - Deployment timestamp
   - Revision ID
   - Changes deployed
   - Verification results
```

### deploy_rag
**Triggers**: deploy rag, rilascia rag, push rag, deploy python
**Template**:
```
Deploy RAG backend to production:

1. Read: .claude/handovers/deploy-rag-backend.md
2. Verify ChromaDB ready (collections count, size)
3. Trigger GitHub Actions: .github/workflows/deploy-rag-amd64.yml
4. Monitor deployment: gh run watch
5. Verify: health check + test query to /bali-zero/chat
6. Update diary with deployment details
```

### deploy_webapp
**Triggers**: deploy webapp, rilascia frontend, push webapp, deploy ui
**Template**:
```
Deploy WebApp to GitHub Pages:

1. Read: .claude/handovers/deploy-webapp.md
2. Verify apps/webapp/ changes committed
3. Push to main → auto-triggers .github/workflows/sync-webapp-to-pages.yml
4. Wait 3-4 minutes for deployment
5. Verify: https://zantara.balizero.com accessible
6. Test key features (login, chat, intel dashboard)
7. Update diary
```

---

## 🐛 Bug Fixing & Debugging

### fix_bug
**Triggers**: fix, bug, errore, problema, issue, non funziona
**Template**:
```
Fix the issue described by user:

1. **Identify**:
   - Read error message/stacktrace
   - Identify affected file(s)
   - Check recent changes: git log --oneline -10

2. **Diagnose**:
   - Read relevant code
   - Identify root cause
   - Check if regression (compare with working version)

3. **Fix**:
   - Implement minimal fix
   - Add/update tests
   - Verify locally

4. **Deploy** (if critical):
   - Follow deployment protocol
   - Verify in production

5. **Document**:
   - Update diary with:
     - Problem description
     - Root cause
     - Solution implemented
     - Time spent
     - Files modified
```

### emergency_fix
**Triggers**: emergenza, urgente, critico, produzione down, emergency
**Template**:
```
🚨 EMERGENCY FIX MODE

1. **Triage** (2 min):
   - Read error logs immediately
   - Identify affected service (backend/RAG/webapp)
   - Assess impact (users affected, data loss risk)

2. **Hotfix** (10-15 min):
   - Implement MINIMAL fix (no refactoring)
   - Skip tests if time-critical
   - Deploy immediately

3. **Verify** (3 min):
   - Health check
   - Test affected functionality
   - Monitor logs for 5 minutes

4. **Document**:
   - Update diary with:
     - Incident start time
     - Root cause
     - Fix applied
     - Time to resolution
     - Follow-up tasks (proper fix, tests, etc.)
```

---

## 🧪 Testing

### run_tests
**Triggers**: test, tests, run tests, verifica tests, check tests
**Template**:
```
Run full test suite:

1. Unit tests: npm test
2. Smoke test: KEY=zantara-internal-dev-key-2025 ./scripts/onboarding_smoke.sh
3. Integration tests (if any): npm run test:integration
4. Report:
   - Total tests run
   - Passed/Failed counts
   - Failed tests details (if any)
   - Coverage (if available)
5. Fix any failures
6. Update diary with test results
```

### test_endpoint
**Triggers**: test endpoint, prova endpoint, verifica api
**Template**:
```
Test specific endpoint:

1. Identify endpoint details:
   - URL
   - Method (GET/POST)
   - Required headers/body

2. Test with curl:
   - Valid request → expect 200
   - Invalid request → expect 4xx
   - Missing auth → expect 401/403

3. Verify response:
   - Structure matches schema
   - Data correct
   - Performance (<2s)

4. Report results with examples
```

---

## 📊 Data & Analytics

### check_chromadb
**Triggers**: chromadb, vector db, collections, embeddings
**Template**:
```
Verifica stato ChromaDB:

1. Connect to RAG backend
2. List collections: POST /bali-zero/kb/collections
3. For each collection:
   - Document count
   - Size (MB)
   - Last updated
4. Verify reranker active: check ENABLE_RERANKER=true
5. Test search quality: sample query + check results
6. Report summary
```

### analytics
**Triggers**: analytics, statistiche, metriche, usage
**Template**:
```
Raccogli analytics sistema:

1. Handler usage:
   - POST /call {"key":"system.handlers.list"}
   - Identify most-used handlers

2. Tool use stats:
   - POST /call {"key":"system.handlers.tools"}
   - Count tool-enabled handlers

3. Recent activity:
   - Check .claude/diaries/ (last 7 days)
   - Count sessions per day
   - Identify busy periods

4. Report with charts/tables
```

---

## 👥 Team & Collaboration

### check_active_sessions
**Triggers**: chi lavora, sessioni attive, active sessions, other clis
**Template**:
```
Mostra sessioni CLI attive:

1. Read: cat .claude/active-sessions.json
2. For each session:
   - ID, model, started time
   - Task description
   - Categories locked
   - Files being edited
3. Check locks: ls -lh .claude/locks/
4. Identify conflicts (if any)
5. Report in table format
```

---

## 🤖 AI & ML

### llama_training
**Triggers**: llama, fine-tuning, training, train model, llama 3
**Template**:
```
Avvia fine-tuning Llama 3.1 8B:

1. Read: docs/llama3.1-8b/FINE_TUNING_REFERENCE.md
2. Verify dataset: ml/datasets/training/NUZANTARA_WITH_LEGAL_KB.jsonl (22,001 examples)
3. Check training script: ml/training-scripts/ (symlink to FINE TUNING/SCRIPTS/)
4. Launch training:
   - Platform: RunPod/Modal/Lambda (user choice)
   - GPU: H100 NVL 94GB
   - Cost estimate: $20-30
   - Duration: 12-14 hours
5. Monitor progress (loss, throughput, VRAM)
6. Update diary with training metrics
```

### test_model
**Triggers**: test model, prova modello, inference test
**Template**:
```
Test trained model:

1. Load model from ml/models/ or external path
2. Run inference tests:
   - Simple query: "What is KBLI?"
   - Complex query: "Explain visa C312 requirements"
   - Tool use: "Check team members"
3. Measure:
   - Latency (ms)
   - Quality (coherence, accuracy)
   - Tool use correctness
4. Compare with baseline (Claude Haiku/Sonnet)
5. Report results
```

---

## 📝 Documentation

### update_docs
**Triggers**: aggiorna docs, update documentation, write docs
**Template**:
```
Aggiorna documentazione:

1. Identify what changed (from user input)
2. Determine affected docs:
   - README.md (if architecture/overview)
   - .claude/PROJECT_CONTEXT.md (if major change)
   - .claude/handovers/{category}.md (if category-specific)
   - docs/ (if setup/guides)
3. Update with:
   - Clear, concise descriptions
   - Code examples (if relevant)
   - Last Updated timestamp
4. Cross-reference related docs
5. Update diary with docs modified
```

### generate_changelog
**Triggers**: changelog, release notes, what changed
**Template**:
```
Genera changelog da git commits:

1. Get commits since last release: git log --oneline v5.5.0..HEAD
2. Categorize by type:
   - Features (feat:)
   - Fixes (fix:)
   - Docs (docs:)
   - Chores (chore:)
3. Format as markdown with links to commits
4. Include breaking changes (if any)
5. Save to CHANGELOG.md or show output
```

---

## 🔐 Security

### security_audit
**Triggers**: security, audit, vulnerabilities, check security
**Template**:
```
Esegui security audit:

1. Check API keys:
   - Verify 100% in Secret Manager (not .env)
   - No hardcoded keys in code

2. Check dependencies:
   - npm audit
   - pip list --outdated (RAG backend)

3. Check configurations:
   - CORS origins (.env.example)
   - Rate limiting active
   - Auth middleware enabled

4. Check recent changes:
   - git log --oneline -20
   - Identify security-sensitive changes

5. Report findings with severity (Critical/High/Medium/Low)
```

---

## 🔧 Maintenance

### cleanup
**Triggers**: cleanup, pulizia, clean, remove old files
**Template**:
```
Cleanup sistema:

1. Git:
   - Remove obsolete branches: git branch -d
   - Clean untracked files: git clean -n (dry run first)

2. Node:
   - Remove node_modules: rm -rf node_modules
   - Fresh install: npm ci

3. Docker:
   - Remove unused images: docker image prune
   - Remove containers: docker container prune

4. Locks:
   - Remove stale locks: rm -f .claude/locks/*.lock
   - Clean active-sessions.json

5. Logs:
   - Archive old diaries (>30 days)
   - Compress if needed

6. Report space saved
```

---

## 🎓 Learning & Onboarding

### onboarding
**Triggers**: onboarding, new ai, start here, learn system
**Template**:
```
Onboarding completo per nuovo AI contributor:

1. Read in order:
   - README.md (project overview)
   - .claude/INIT.md (entry/exit protocol)
   - .claude/PROJECT_CONTEXT.md (architecture, state)
   - docs/setup/AI_START_HERE.md (quick start)

2. Explore structure:
   - ls -la (root files)
   - tree -L 2 -I 'node_modules|dist' (directory structure)

3. Check current state:
   - git status
   - cat .claude/active-sessions.json
   - Recent diaries (last 2 days)

4. Verify access:
   - curl backend health check
   - curl RAG health check

5. Confirm ready with summary of understanding
```

---

## 🎨 Custom (User-Specific)

### custom_task
**Triggers**: (fallback - if no other template matches)
**Template**:
```
Analyze user request and create detailed action plan:

1. **Understand**:
   - What is user asking for?
   - Which services/files affected?
   - What's the goal?

2. **Plan**:
   - Break down into steps (3-7 steps)
   - Identify required files/docs
   - Estimate time/complexity

3. **Check context**:
   - Read relevant handovers
   - Check recent diaries for related work
   - Verify no conflicts with active sessions

4. **Execute**:
   - Follow steps systematically
   - Log progress in real-time
   - Handle errors gracefully

5. **Document**:
   - Update diary with results
   - Update handovers if needed
   - Note any follow-up tasks
```

---

## 📚 Meta Commands

### list_templates
**Triggers**: templates, list templates, available commands
**Template**:
```
Show all available prompt templates from .claude/PROMPT_TEMPLATES.md with triggers and brief descriptions.
```

### help
**Triggers**: help, aiuto, how to use
**Template**:
```
Show Prompt Optimizer usage:

1. What it does
2. How to use: zp "your natural language request"
3. Available templates (top 10 most useful)
4. Examples
5. Cost ($0.0001 per request)
```

---

**Total Templates**: 25+
**Coverage**: System health, deployment, debugging, testing, ML, docs, security, maintenance, onboarding
**Version**: 1.0.0
**Created**: 2025-10-11
