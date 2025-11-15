# 🔄 REDEPLOY WITH FIXES - CYCLE 1

## ✅ Fixes Applied and Committed

### Fix 1: Rate Limiter Trust Proxy Configuration
**Commit**: `e5c34e5` - "fix: Configure rate limiters to trust Fly.io proxy"

**Problem**:
- `ERR_ERL_PERMISSIVE_TRUST_PROXY` errors on deployment
- express-rate-limit v8+ rejects `trust proxy: true` without explicit trust config
- Security issue: anyone could spoof IP addresses

**Solution**: Added `trust: 1` to all rate limiters:
- `apps/backend-ts/src/middleware/security.middleware.ts`
  - globalRateLimiter (line 48)
  - apiRateLimiter (line 67)
  - strictRateLimiter (line 85)
- `apps/backend-ts/src/middleware/rate-limit.ts`
  - baliZeroChatLimiter (line 39)
  - aiChatLimiter (line 94)
  - ragQueryLimiter (line 131)
  - strictLimiter (line 168)
- `apps/backend-ts/src/middleware/prioritized-rate-limit.ts`
  - createRateLimiter (line 88)
  - createEndpointRateLimiter (line 193)

**Effect**: Rate limiters now trust only Fly.io's single proxy hop, preventing IP spoofing while working correctly behind Fly.io's proxy.

---

### Fix 2: Cron Scheduler Timezone Configuration
**Commit**: `d27466c` - "fix: Use UTC timezone for cron scheduler reliability"

**Problem**:
- Cron scheduler showed `"isRunning": false`, `"jobCount": 0`
- Timezone 'Asia/Singapore' may not be recognized by node-cron
- Jobs weren't being scheduled on deployment

**Solution**: Changed timezone from 'Asia/Singapore' to 'UTC'
- `apps/backend-ts/src/services/cron-scheduler.ts` (line 189)
- Adjusted job schedules:
  - Code Refactoring: 4 AM SGT → 2 AM UTC (10 AM SGT)
  - Test Generation: 5 AM SGT → 3 AM UTC (11 AM SGT)
  - Health Check: Every hour (unchanged)

**Effect**: Cron scheduler should now start and schedule all 3 AI automation jobs correctly.

---

## ⚠️ Known Blocker: Invalid OpenRouter API Key

**Issue**: The OpenRouter API key configured is **INVALID**

**Evidence from logs**:
```json
{
  "level": "warn",
  "message": "OpenRouter API error (attempt 1/3) User not found.",
  "model": "mistralai/mistral-7b-instruct",
  "status": 401
}
```

**Current key** (in `deploy-backend.sh`):
```
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
```

**Required Action**:
1. Get a **new valid API key** from https://openrouter.ai/
2. Update the key in `deploy-backend.sh` line 40
3. OR set it manually during deployment with:
   ```bash
   flyctl secrets set OPENROUTER_API_KEY=sk-or-v1-YOUR_NEW_KEY \
     --app nuzantara-backend
   ```

**Impact**: AI automation features will NOT work until a valid key is provided:
- ❌ Code refactoring agent
- ❌ Test generation agent
- ❌ AI health checks
- ✅ Basic server health still works
- ✅ Rate limiting still works

---

## 🚀 REDEPLOYMENT INSTRUCTIONS

### On Your Mac (Where flyctl is Installed)

#### Step 1: Pull Latest Changes
```bash
cd ~/Desktop/NUZANTARA
git pull origin claude/verify-generate-report-011CUthqT5HvcACjNgyibCix
```

Verify you have the fixes:
```bash
# Should show both fix commits
git log --oneline -5
```

Expected output:
```
d27466c fix: Use UTC timezone for cron scheduler reliability
e5c34e5 fix: Configure rate limiters to trust Fly.io proxy
```

---

#### Step 2: Update OpenRouter API Key (REQUIRED)

**Option A: Update deploy-backend.sh**
```bash
# Edit the deploy script
nano deploy-backend.sh

# Change line 40 to your new valid key:
OPENROUTER_API_KEY="sk-or-v1-YOUR_NEW_VALID_KEY_HERE"
```

**Option B: Set secret manually before deploying**
```bash
flyctl secrets set OPENROUTER_API_KEY=sk-or-v1-YOUR_NEW_KEY \
  --app nuzantara-backend
```

---

#### Step 3: Deploy with Fixes
```bash
# Quick deploy using the script
./deploy-backend.sh
```

OR manual deployment:
```bash
cd apps/backend-ts
flyctl deploy --app nuzantara-backend --remote-only
```

---

## ✅ VERIFICATION CHECKLIST

After deployment completes, verify each fix:

### 1. Server Health (Should Pass)
```bash
curl https://nuzantara-backend.fly.dev/health
```

**Expected**:
```json
{
  "ok": true,
  "data": {
    "status": "healthy",
    "uptime": <number>,
    "timestamp": "2025-11-08T..."
  }
}
```

---

### 2. No Rate Limiter Errors (Should Pass)
```bash
flyctl logs --app nuzantara-backend -n 100 | grep -i "ERR_ERL_PERMISSIVE_TRUST_PROXY"
```

**Expected**: NO OUTPUT (error is fixed)

---

### 3. Cron Scheduler Running (Should Pass IF API key is valid)
```bash
curl https://nuzantara-backend.fly.dev/api/monitoring/cron-status | jq .
```

**Expected**:
```json
{
  "ok": true,
  "data": {
    "isRunning": true,
    "jobCount": 3,
    "jobs": [
      "ai-code-refactoring",
      "ai-test-generation",
      "ai-health-check"
    ],
    "lastRun": {
      "ai-health-check": "2025-11-08T..."
    }
  }
}
```

**If still shows `"isRunning": false`**: Check logs for timezone or cron errors

---

### 4. AI Health Check (Requires Valid API Key)
```bash
curl https://nuzantara-backend.fly.dev/api/monitoring/ai-health | jq .
```

**Expected with VALID key**:
```json
{
  "ok": true,
  "data": {
    "healthy": true,
    "openRouter": {
      "callsThisHour": 0,
      "maxCallsPerHour": 100,
      "errorCount": 0,
      "circuitBreakerOpen": false,
      "costToday": 0,
      "dailyBudget": 1,
      "budgetRemaining": 1
    },
    "cron": {
      "isRunning": true,
      "jobCount": 3,
      "jobs": [...]
    }
  }
}
```

**If API key is INVALID**:
```json
{
  "ok": true,
  "data": {
    "healthy": false,
    "warnings": ["OpenRouter API key not configured or invalid"],
    ...
  }
}
```

---

### 5. Check Logs for Errors
```bash
flyctl logs --app nuzantara-backend -n 100 | grep -i "error\|warn"
```

**Should NOT see**:
- ❌ `ERR_ERL_PERMISSIVE_TRUST_PROXY`
- ❌ Timezone-related errors

**MAY still see** (if API key invalid):
- ⚠️ `OpenRouter API error (attempt 1/3) User not found` (401 status)
- ⚠️ `OpenRouter API key not configured or invalid`

---

## 📊 SUCCESS CRITERIA

### Minimum Success (Rate Limiter + Timezone Fixes)
- ✅ Server health endpoint responds 200
- ✅ NO `ERR_ERL_PERMISSIVE_TRUST_PROXY` errors in logs
- ✅ Cron scheduler shows `"isRunning": true, "jobCount": 3`
- ✅ Rate limiting works correctly behind Fly.io proxy

### Full Success (Requires Valid OpenRouter Key)
- ✅ All above criteria met
- ✅ AI health endpoint shows `"healthy": true`
- ✅ NO OpenRouter 401 errors in logs
- ✅ AI agents can make API calls successfully
- ✅ Monitoring endpoints show valid AI statistics

---

## 🐛 TROUBLESHOOTING

### Issue: Cron Scheduler Still Shows "isRunning": false

**Diagnosis**:
```bash
# Check for cron-related errors
flyctl logs --app nuzantara-backend | grep -i "cron\|scheduler"
```

**Possible causes**:
1. Code didn't deploy correctly - verify commit hash in logs
2. Server startup error - check full logs
3. Timezone still not recognized - check node-cron version

**Fix**:
```bash
# SSH into the machine
flyctl ssh console --app nuzantara-backend

# Check running processes
ps aux | grep node

# Check environment
env | grep NODE
```

---

### Issue: OpenRouter Still Returns 401

**Diagnosis**:
```bash
# Verify secret is set
flyctl secrets list --app nuzantara-backend
```

Should show:
```
NAME                  DIGEST                          CREATED AT
OPENROUTER_API_KEY    <hash>                          <timestamp>
```

**Fix**:
```bash
# Get a new key from https://openrouter.ai/
# Then update:
flyctl secrets set OPENROUTER_API_KEY=sk-or-v1-NEW_KEY \
  --app nuzantara-backend
```

App will automatically restart with new secret.

---

### Issue: Rate Limiting Still Shows Errors

**Diagnosis**:
```bash
# Check which version is deployed
flyctl logs --app nuzantara-backend | grep "express-rate-limit"
```

**Fix**:
Ensure you pulled the latest changes with commit `e5c34e5` before deploying.

---

## 📝 DEPLOYMENT LOG TEMPLATE

Use this to track your deployment:

```
=== DEPLOYMENT CYCLE 1 ===
Date: ___________
Time: ___________

[ ] Step 1: Pulled latest changes
    Commit hash: __________

[ ] Step 2: Updated OpenRouter API key
    Method: [ ] deploy-backend.sh  [ ] flyctl secrets

[ ] Step 3: Deployed to Fly.io
    Deployment ID: __________

[ ] Verification 1: Server health
    Status: [ ] PASS  [ ] FAIL
    Response: __________

[ ] Verification 2: No rate limiter errors
    Status: [ ] PASS  [ ] FAIL
    Errors found: __________

[ ] Verification 3: Cron scheduler running
    Status: [ ] PASS  [ ] FAIL
    jobCount: ____
    isRunning: ____

[ ] Verification 4: AI health check
    Status: [ ] PASS  [ ] FAIL
    healthy: ____
    Errors: __________

[ ] Verification 5: Log review
    Status: [ ] PASS  [ ] FAIL
    Issues found: __________

=== RESULT ===
[ ] Minimum Success Achieved
[ ] Full Success Achieved
[ ] Needs Another Cycle

Next Steps:
__________________________________________
__________________________________________
```

---

## 🎯 NEXT STEPS

### If Minimum Success Achieved:
1. Obtain valid OpenRouter API key from https://openrouter.ai/
2. Update secret: `flyctl secrets set OPENROUTER_API_KEY=<key>`
3. Wait for automatic restart
4. Re-verify AI health endpoint

### If Full Success Achieved:
1. Monitor AI automation jobs running at scheduled times
2. Check daily cost reports on OpenRouter dashboard
3. Set up alerting for budget overruns
4. Test AI refactoring and test generation features

### If Deployment Failed:
1. Review full logs: `flyctl logs --app nuzantara-backend -n 500`
2. Check build logs for errors
3. Verify Docker build succeeds locally
4. Create GitHub issue with error details

---

## 📞 SUPPORT

- **Logs**: `flyctl logs --app nuzantara-backend`
- **Status**: `flyctl status --app nuzantara-backend`
- **SSH**: `flyctl ssh console --app nuzantara-backend`
- **Metrics**: `flyctl dashboard metrics --app nuzantara-backend`

---

**READY TO DEPLOY!**

Run on your Mac:
```bash
cd ~/Desktop/NUZANTARA && \
git pull origin claude/verify-generate-report-011CUthqT5HvcACjNgyibCix && \
./deploy-backend.sh
```
