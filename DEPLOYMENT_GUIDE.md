# 🚀 DEPLOYMENT GUIDE - Autonomous Agents Tier 1

**Version**: 1.0.0
**Date**: 2025-01-07
**Branch**: `claude/analyze-frontend-backend-coordination-011CUu1coX6KFraX8AVtgein`
**Status**: Ready for Staging Deployment

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Code Review ✅
- [x] All critical issues fixed
- [x] TypeScript compilation errors resolved
- [x] Python-Node integration fixed (subprocess approach)
- [x] Security review passed
- [x] Test coverage 83% (target: 80%)

### Dependencies ✅
- [x] Python dependencies documented (`requirements-agents.txt`)
- [x] Node.js dependencies in package.json
- [x] Database migrations created
- [x] Environment variables documented

### Testing ✅
- [x] Quick tests passed (1.5 min)
- [x] Unit tests passed (25+ test cases)
- [x] Mock execution successful (5/5 agents)
- [x] Integration tests ready

---

## 🎯 DEPLOYMENT STRATEGY

### Phase 1: Staging (48 hours)
**Goal**: Validate agents work in cloud environment

1. Deploy to staging Fly.io apps
2. Monitor logs for 48 hours
3. Validate agent executions
4. Collect metrics
5. Fix any issues found

### Phase 2: Production (After validation)
**Goal**: Full production rollout

1. Deploy to production Fly.io apps
2. Enable orchestrator cron
3. Monitor closely for 1 week
4. Generate impact report
5. Iterate based on learnings

---

## 📦 STEP 1: Install Dependencies

### Backend-TS (Node.js)
```bash
cd apps/backend-ts
npm install
```

**Required packages** (check package.json):
- `@anthropic-ai/sdk`
- `pg` (PostgreSQL client)
- `node-fetch` (for webhooks)

### Backend-RAG (Python)
```bash
cd apps/backend-rag
pip install -r requirements-agents.txt
```

**Installed packages**:
- `anthropic>=0.18.0`
- `psycopg2-binary>=2.9.9`
- `python-dotenv>=1.0.0`
- `twilio>=8.10.0` (optional, for WhatsApp)
- `requests>=2.31.0` (optional, for webhooks)

---

## 🔐 STEP 2: Configure Environment Variables

### Required Variables

Run these commands for **EACH** Fly.io app:

#### Backend-TS (nuzantara-backend)
```bash
# Core
fly secrets set NODE_ENV=production --app nuzantara-backend
fly secrets set PORT=8080 --app nuzantara-backend

# Database
fly secrets set DATABASE_URL="postgresql://user:pass@your-postgres.fly.dev:5432/zantara" --app nuzantara-backend

# AI APIs
fly secrets set ANTHROPIC_API_KEY="sk-ant-your-key" --app nuzantara-backend
fly secrets set OPENROUTER_API_KEY="sk-or-your-key" --app nuzantara-backend

# Orchestrator
fly secrets set ENABLE_ORCHESTRATOR="true" --app nuzantara-backend

# Notifications (optional)
fly secrets set SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..." --app nuzantara-backend

# GitHub (for PR creation)
fly secrets set GITHUB_TOKEN="ghp_your-github-token" --app nuzantara-backend
```

#### Backend-RAG (nuzantara-rag)
```bash
# Core
fly secrets set OPENAI_API_KEY="sk-proj-your-key" --app nuzantara-rag
fly secrets set ANTHROPIC_API_KEY="sk-ant-your-key" --app nuzantara-rag

# Database
fly secrets set DATABASE_URL="postgresql://user:pass@your-postgres.fly.dev:5432/zantara" --app nuzantara-rag

# WhatsApp (for Client Predictor)
fly secrets set TWILIO_ACCOUNT_SID="ACxxxxxxxxxx" --app nuzantara-rag
fly secrets set TWILIO_AUTH_TOKEN="your-token" --app nuzantara-rag
fly secrets set TWILIO_WHATSAPP_NUMBER="+14155238886" --app nuzantara-rag

# Notifications
fly secrets set SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..." --app nuzantara-rag
```

### Verify Secrets
```bash
fly secrets list --app nuzantara-backend
fly secrets list --app nuzantara-rag
```

---

## 🗄️ STEP 3: Initialize Database

### 1. Enable pg_stat_statements Extension
```bash
# Connect to your PostgreSQL database
fly pg connect -a your-postgres-app

# Run migration
\i apps/backend-ts/migrations/004_enable_pg_stat_statements.sql

# Verify
SELECT installed_version FROM pg_available_extensions WHERE name = 'pg_stat_statements';
# Expected: 1.10 or higher

# Exit
\q
```

### 2. Initialize Knowledge Graph Schema
```bash
# SSH into backend-rag
fly ssh console --app nuzantara-rag

# Run initialization
python3 apps/backend-rag/backend/agents/run_knowledge_graph.py --init-schema

# Verify tables created
psql $DATABASE_URL -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'kg_%'"

# Expected output:
#  kg_entities
#  kg_relationships
#  kg_entity_mentions

# Exit
exit
```

---

## 🚀 STEP 4: Deploy Applications

### Deploy Backend-TS
```bash
cd apps/backend-ts

# Build and deploy
fly deploy --app nuzantara-backend

# Watch logs
fly logs --app nuzantara-backend
```

**Expected output**:
```
✅ Backend-TS deployed successfully
🎭 Multi-Agent Orchestrator initialized
📊 5 agents registered
```

### Deploy Backend-RAG
```bash
cd apps/backend-rag

# Deploy
fly deploy --app nuzantara-rag

# Watch logs
fly logs --app nuzantara-rag
```

**Expected output**:
```
✅ Backend-RAG deployed successfully
🧠 Knowledge Graph schema verified
💰 Client Predictor ready
```

---

## 🧪 STEP 5: Verify Deployment

### Test 1: Check Agent Registration
```bash
# SSH into backend-ts
fly ssh console --app nuzantara-backend

# Check orchestrator
node -e "
const { AgentOrchestrator } = require('./dist/agents/orchestrator.js');
const orchestrator = new AgentOrchestrator();
console.log('Agents registered:', orchestrator.agents.size);
"

# Expected: Agents registered: 5 (or more)
```

### Test 2: Run Manual Agent Test
```bash
# SSH into backend-rag
fly ssh console --app nuzantara-rag

# Test conversation trainer (dry run)
python3 apps/backend-rag/backend/agents/run_conversation_trainer.py --days 7

# Expected output:
# 🤖 Starting Conversation Trainer...
# 📊 Analyzing winning patterns...
# ✅ Analysis complete
```

### Test 3: Check Logs
```bash
# Monitor orchestrator activity
fly logs --app nuzantara-backend | grep "🎭"

# Monitor agent execution
fly logs --app nuzantara-rag | grep -E "🤖|💰|🕸️"
```

---

## ⏰ STEP 6: Configure Cron Jobs

Agents run automatically via the orchestrator. The orchestrator decides when to run each agent based on system state.

### Orchestrator Schedule
```bash
# Already configured in backend-ts
# Runs every hour and decides which agents to execute
# Cron: 0 * * * * (hourly)
```

**No additional cron configuration needed** - the orchestrator handles everything!

---

## 📊 STEP 7: Monitor First 48 Hours

### Metrics to Track

#### Orchestrator Metrics
- ✅ Number of orchestration cycles
- ✅ Agents selected per cycle
- ✅ Execution success rate
- ✅ Average cycle duration

#### Agent-Specific Metrics

**Conversation Trainer**:
- Conversations analyzed
- Patterns found
- PRs created
- Prompt improvement %

**Client Predictor**:
- Clients scored
- VIP clients nurtured
- WhatsApp messages sent
- Conversion rate

**Knowledge Graph**:
- Entities extracted
- Relationships created
- Graph size growth
- Query performance

**Performance Optimizer**:
- Bottlenecks detected
- Optimizations applied
- Response time improvement
- Cache hit rate improvement

### Monitoring Commands

```bash
# Watch orchestrator logs
fly logs --app nuzantara-backend --json | jq 'select(.message | contains("🎭"))'

# Watch all agent logs
fly logs --app nuzantara-rag --json | jq 'select(.message | contains("🤖") or contains("💰") or contains("🕸️"))'

# Check Slack notifications
# (Automatically sent to your Slack webhook)

# Query agent execution history
fly pg connect -a your-postgres-app
SELECT * FROM agent_orchestration_reports ORDER BY created_at DESC LIMIT 10;
```

---

## 🚨 TROUBLESHOOTING

### Issue 1: Agent Not Running
**Symptom**: No agent execution logs

**Diagnosis**:
```bash
# Check if orchestrator is enabled
fly secrets list --app nuzantara-backend | grep ENABLE_ORCHESTRATOR

# Check orchestrator logs
fly logs --app nuzantara-backend | grep "orchestrat"
```

**Fix**:
```bash
# Ensure orchestrator is enabled
fly secrets set ENABLE_ORCHESTRATOR=true --app nuzantara-backend

# Restart app
fly apps restart nuzantara-backend
```

### Issue 2: Python Agent Fails
**Symptom**: "ModuleNotFoundError" in logs

**Diagnosis**:
```bash
# SSH into app
fly ssh console --app nuzantara-rag

# Check Python packages
pip list | grep -E "anthropic|psycopg2|twilio"
```

**Fix**:
```bash
# Install missing dependencies
pip install -r requirements-agents.txt

# Restart app
fly apps restart nuzantara-rag
```

### Issue 3: Database Connection Error
**Symptom**: "Connection refused" or "Authentication failed"

**Diagnosis**:
```bash
# Check DATABASE_URL
fly secrets list --app nuzantara-backend | grep DATABASE_URL

# Test connection
fly ssh console --app nuzantara-backend
echo $DATABASE_URL
psql $DATABASE_URL -c "SELECT 1"
```

**Fix**:
```bash
# Update DATABASE_URL with correct credentials
fly secrets set DATABASE_URL="postgresql://..." --app nuzantara-backend
```

### Issue 4: WhatsApp Messages Not Sending
**Symptom**: "Twilio error" in Client Predictor logs

**Diagnosis**:
```bash
# Check Twilio credentials
fly secrets list --app nuzantara-rag | grep TWILIO
```

**Fix**:
```bash
# Update Twilio credentials
fly secrets set TWILIO_ACCOUNT_SID="ACxxxx" --app nuzantara-rag
fly secrets set TWILIO_AUTH_TOKEN="xxx" --app nuzantara-rag
fly secrets set TWILIO_WHATSAPP_NUMBER="+14155238886" --app nuzantara-rag
```

---

## 📈 SUCCESS METRICS (First Week)

### Expected Results

**Orchestrator**:
- ✅ 168 orchestration cycles (hourly)
- ✅ 90%+ success rate
- ✅ Average 3 agents per cycle

**Conversation Trainer** (runs weekly):
- ✅ 1 execution
- ✅ 10+ conversations analyzed
- ✅ 1 PR created with improvements

**Client Predictor** (runs daily):
- ✅ 7 executions
- ✅ 100+ clients scored
- ✅ 50+ messages sent
- ✅ 30%+ response rate

**Knowledge Graph** (runs daily):
- ✅ 7 executions
- ✅ 500+ entities extracted
- ✅ 300+ relationships created
- ✅ Graph size > 1000 nodes

**Performance Optimizer** (runs every 6 hours):
- ✅ 28 executions
- ✅ 10+ bottlenecks detected
- ✅ 5+ optimizations applied
- ✅ 20%+ response time improvement

---

## 🎯 ROLLBACK PLAN

If issues occur, rollback immediately:

```bash
# Disable orchestrator
fly secrets unset ENABLE_ORCHESTRATOR --app nuzantara-backend

# Rollback to previous version
fly releases --app nuzantara-backend
fly releases rollback <version-number> --app nuzantara-backend

fly releases --app nuzantara-rag
fly releases rollback <version-number> --app nuzantara-rag

# Notify team
curl -X POST $SLACK_WEBHOOK_URL \
  -d '{"text":"🚨 Agents rollback initiated"}'
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

After deployment:

- [ ] All secrets configured
- [ ] Database migrations applied
- [ ] Knowledge graph schema initialized
- [ ] Backend-TS deployed successfully
- [ ] Backend-RAG deployed successfully
- [ ] Orchestrator running (check logs)
- [ ] At least 1 agent executed successfully
- [ ] Monitoring dashboard updated
- [ ] Slack notifications working
- [ ] Team notified of deployment
- [ ] 48-hour monitoring plan active

---

## 📞 SUPPORT

### Documentation
- `AUTONOMOUS_AGENTS_MASTER_PLAN.md` - Full strategy
- `CODE_REVIEW.md` - Review findings
- `TEST_REPORT.md` - Test results
- `FLY_IO_ENV_VARS_GUIDE.md` - All env vars

### Monitoring
- Fly.io Dashboard: https://fly.io/dashboard
- Logs: `fly logs --app <app-name>`
- Metrics: `fly status --app <app-name>`

### Emergency Contact
- Disable all agents: `fly secrets set ENABLE_ORCHESTRATOR=false`
- Rollback: `fly releases rollback`
- Alert: Slack webhook (auto-configured)

---

**Deployment Guide Version**: 1.0.0
**Last Updated**: 2025-01-07
**Status**: ✅ Ready for Staging
**Next Review**: After 48h staging period

**Good luck with the deployment! 🚀**
