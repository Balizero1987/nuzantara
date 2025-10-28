# ⚡ Quick Start - ZANTARA Router-Only System

**Get up and running in 5 minutes**

## Prerequisites Check

```bash
# Check Python (need 3.8+)
python3 --version

# Check Node (need 18+)
node --version

# Check if you have ANTHROPIC_API_KEY
echo $ANTHROPIC_API_KEY
```

## Step 1: Set API Key

```bash
export ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

**Important:** Without this, the orchestrator won't work!

## Step 2: One-Command Deploy

```bash
cd ~/Desktop/NUZANTARA-RAILWAY
./scripts/deploy-router-only.sh
```

**What happens:**
1. ✅ Creates Python virtual environment
2. ✅ Downloads FLAN-T5 model (~900MB, first time only)
3. ✅ Installs all dependencies
4. ✅ Starts router on port 8000
5. ✅ Starts orchestrator on port 3000
6. ✅ Runs automated tests
7. ✅ Shows you monitoring info

**Expected output:**
```
🚀 Starting Router-Only Deployment...
=======================================
Checking prerequisites...
✅ Prerequisites OK
Starting FLAN-T5 Router...
✅ Router started (PID: 12345)
✅ TypeScript backend router-system ready
Starting Orchestrator...
✅ Orchestrator started (PID: 12346)

=======================================
  Running Tests
=======================================
Testing router health... ✅
Testing orchestrator health... ✅
Testing end-to-end query...
✅ End-to-end test passed
Total latency: 245ms
Testing tool selection...
✅ Tools selected: universal.query

=======================================
  ✅ DEPLOYMENT SUCCESSFUL
=======================================

System is running with:
- FLAN Router: http://localhost:8000
- Orchestrator: http://localhost:3000
- Metrics: http://localhost:3000/api/metrics
```

## Step 3: Test It!

```bash
# Simple test
curl -X POST http://localhost:3000/api/query \
  -H 'Content-Type: application/json' \
  -d '{"query": "What is the price of KITAS?"}'

# Should return JSON with response and metadata
```

## Step 4: Monitor (Optional)

```bash
# Real-time dashboard
./scripts/monitor-system.sh

# Or check metrics manually
curl http://localhost:3000/api/metrics | jq
```

## Step 5: Run Full Validation (Optional)

```bash
# Run 12 test cases
./tests/validate-migration.py
```

---

## Troubleshooting

### Problem: "Router failed to start"

**Solution:**
```bash
# Check Python packages
cd apps/flan-router
source venv/bin/activate
pip install --upgrade -r requirements.txt
```

### Problem: "ANTHROPIC_API_KEY not set"

**Solution:**
```bash
# Set it permanently in your shell config
echo 'export ANTHROPIC_API_KEY=sk-ant-api03-your-key' >> ~/.zshrc
source ~/.zshrc
```

### Problem: "Port already in use"

**Solution:**
```bash
# Kill existing processes
lsof -ti:8000 | xargs kill  # Kill router
lsof -ti:3000 | xargs kill  # Kill orchestrator

# Then retry deploy
./scripts/deploy-router-only.sh
```

---

## Rollback

If anything goes wrong:

```bash
./scripts/rollback.sh
```

This stops the new system and leaves your original backends running.

---

## What's Next?

1. **Read full docs:** See `ROUTER_SYSTEM_README.md` for details
2. **Integrate with frontend:** Point your webapp to `http://localhost:3000/api/query`
3. **Monitor performance:** Watch metrics to ensure goals are met
4. **Customize:** Add more keywords to router if tool selection needs improvement

---

## Expected Performance

| Metric | Target | Typical |
|--------|--------|---------|
| **Total Latency** | <250ms | 230-270ms |
| **Router Latency** | <100ms | 80-120ms |
| **Accuracy** | >90% | 90-95% |
| **Success Rate** | >95% | 96-99% |

If you see different numbers, check the troubleshooting guide in `ROUTER_SYSTEM_README.md`.

---

**🎉 That's it! You now have an intelligent router-only system running.**
