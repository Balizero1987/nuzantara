# 🚀 GitHub Actions Workflows

**Automazione completa: Test, Quality, Coverage e Deploy**

---

## 📋 Workflows Disponibili

### 1. **test-automation.yml** - Test Automation CI
**Trigger**:
- Push su `main`, `develop`
- Pull Request
- Schedule: Daily 2 AM UTC

**Jobs**:
- ✅ Test Quality Check
- 📊 Coverage Analysis
- 🤖 Auto-Generate Tests
- 🧪 Run Complete Test Suite

**Output**:
- Coverage report su PR
- GitHub Issue se test mancanti
- Artifacts (reports)

---

### 2. **deploy.yml** - Deploy Automatico
**Trigger**:
- Push su `main`
- Manual dispatch (GitHub UI)

**Jobs**:
1. **test** - Esegue test + coverage check
2. **deploy** - Deploy a Fly.io (solo se test passano)
3. **notify** - Notifica risultato

**Output**:
- Deploy automatico a https://nuzantara-rag.fly.dev
- Health check post-deploy
- Comment su commit con status

---

### 3. **security-scan.yml** - Security Scanning
**Trigger**: Push, Pull Request

**Jobs**:
- Security vulnerability scan
- Dependency audit

---

## ⚙️ SETUP COMPLETO

### Step 1: Configura Fly.io Token

```bash
# 1. Ottieni token Fly.io
flyctl auth token

# Output: FlyV1 fm2_xxxxxxxxxxxxxxxxxxxxx
```

### Step 2: Aggiungi Secret a GitHub

```bash
# Vai su GitHub Repository
https://github.com/Balizero1987/nuzantara

# Navigate to:
Settings → Secrets and variables → Actions → New repository secret

# Aggiungi:
Name: FLY_API_TOKEN
Value: [il token da Step 1]
```

### Step 3: Verifica Workflows

```bash
# Vai su:
https://github.com/Balizero1987/nuzantara/actions

# Dovresti vedere:
- Test Automation CI
- Deploy to Production
- Security Scan
```

### Step 4: Test Deploy Manuale

```bash
# Su GitHub:
Actions → Deploy to Production → Run workflow

# Seleziona branch: main
# Click: Run workflow

# Verifica:
- ✅ Jobs: test → deploy → notify
- ⏱️ Durata: ~5-8 minuti
- 🌐 URL: https://nuzantara-rag.fly.dev
```

---

## 🔄 FLUSSO AUTOMATICO

### Scenario 1: Push su Main

```
git push origin main
  ↓
[Parallelo]
  ↓                           ↓
Test Automation           Deploy Workflow
  ↓                           ↓
Quality Check            Run Tests (80% coverage min)
Coverage Analysis              ↓
Auto-Generate            ✅ Tests Pass
Run Tests                      ↓
  ↓                      Deploy to Fly.io
Upload Reports                 ↓
                         Health Check
                               ↓
                         ✅ Deployment Success
                               ↓
                         Comment su Commit:
                         "🚀 Deployed to production"
```

### Scenario 2: Pull Request

```
Create/Update PR
  ↓
Test Automation triggera
  ↓
Quality Check ✅
Coverage Analysis ✅
  ↓
Comment automatico su PR:
"📊 Coverage: 89.5%
 ✅ All tests passed!"
  ↓
Review → Merge
  ↓
Push su main triggera Deploy (vedi Scenario 1)
```

### Scenario 3: Test Falliscono

```
Push su main
  ↓
Deploy Workflow: test job
  ↓
❌ Tests fail (coverage <80% o test failed)
  ↓
Deploy job: SKIPPED
  ↓
Notify: ❌ Deployment failed
  ↓
Check logs link in notification
```

---

## 📊 MONITORING

### GitHub Actions UI

```
Repository → Actions

Vedi:
- ✅ Workflow runs (success/failure)
- ⏱️ Duration
- 📝 Logs completi
- 📦 Artifacts (reports)
```

### Fly.io Dashboard

```
https://fly.io/apps/nuzantara-rag/monitoring

Vedi:
- 📈 Request rate
- ⏱️ Response time
- 💾 Memory usage
- 🔄 Recent deployments
```

---

## 🛡️ PROTEZIONI ABILITATE

### Branch Protection (Consigliato)

```bash
# Settings → Branches → Add rule

Branch name pattern: main

Protezioni:
✅ Require status checks to pass before merging
  - test-automation / test-quality
  - test-automation / coverage-analysis
  - test-automation / run-tests
  - deploy / test

✅ Require branches to be up to date before merging

✅ Require linear history (optional)
```

Questo previene:
- ❌ Merge di codice con test falliti
- ❌ Deploy di codice con coverage <80%
- ❌ Bypass dei check automatici

---

## 🔧 CUSTOMIZATION

### Cambiare Coverage Target

```yaml
# .github/workflows/deploy.yml

- name: Check Coverage
  run: |
    cd apps/backend-rag
    pytest tests/unit --cov=backend --cov-fail-under=85  # era 80
```

### Aggiungere Notifiche Slack

```yaml
# Aggiungi a deploy.yml

- name: Notify Slack
  if: needs.deploy.result == 'success'
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "🚀 Deployed to production: https://nuzantara-rag.fly.dev"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Deploy Multi-Environment

```yaml
# Aggiungi job per staging

deploy-staging:
  name: Deploy to Staging
  if: github.ref == 'refs/heads/develop'
  steps:
    - name: Deploy to Staging
      run: flyctl deploy --app nuzantara-rag-staging
```

---

## 📝 WORKFLOW FILES

```
.github/workflows/
├── test-automation.yml    # Test automation (push/PR/schedule)
├── deploy.yml             # Auto-deploy (main branch)
└── security-scan.yml      # Security scanning
```

---

## 🎯 CHECKLIST ATTIVAZIONE

- [x] Workflow files creati
- [ ] **FLY_API_TOKEN** configurato su GitHub
- [ ] Test manuale deploy workflow
- [ ] Branch protection configurato (opzionale ma consigliato)
- [ ] Slack webhook configurato (opzionale)
- [ ] Team notificato dei nuovi workflow

---

## 🚨 TROUBLESHOOTING

### Deploy fallisce: "FLY_API_TOKEN not found"

```bash
# Verifica secret configurato:
GitHub → Settings → Secrets → FLY_API_TOKEN

# Se manca, aggiungi:
1. flyctl auth token
2. Copia token
3. Aggiungi su GitHub Secrets
```

### Deploy fallisce: "App not found"

```bash
# Verifica app name in deploy.yml
# Deve corrispondere a fly.toml

# fly.toml
app = 'nuzantara-rag'

# deploy.yml
flyctl deploy --app nuzantara-rag  # ✅ Match
```

### Test passano localmente ma falliscono su CI

```bash
# Possibili cause:
1. Missing dependencies in requirements.txt
2. Environment variables mancanti
3. Different Python version

# Fix:
# Aggiungi env vars a workflow:
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

---

## 📈 METRICHE

### Target Performance

- **Build Time**: <5 min
- **Test Time**: <3 min
- **Deploy Time**: <2 min
- **Total Time**: <10 min

### Monitoring

```bash
# Vedi tempi medi:
GitHub → Actions → Workflows → Deploy to Production

# Check:
- Average duration
- Success rate
- Failure patterns
```

---

## 🎉 BENEFITS

✅ **Deploy Automatico**: Push su main → deploy in 8 min
✅ **Quality Gates**: Solo codice testato va in production
✅ **Fast Feedback**: PR comments con coverage
✅ **Zero Downtime**: Fly.io rolling deploys
✅ **Health Checks**: Verifica automatica post-deploy
✅ **Rollback Facile**: `flyctl releases rollback`

---

**Ready to ship! 🚀**
