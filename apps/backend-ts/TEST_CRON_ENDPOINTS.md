# Testing Autonomous Agents Cron Endpoints

## Quick Test Suite

After starting the server with `npm run dev`, run these tests:

### 1. Check Cron Status

```bash
curl http://localhost:8080/api/monitoring/cron-status | jq
```

Expected response:
```json
{
  "success": true,
  "status": {
    "enabled": true,
    "timezone": "Asia/Singapore",
    "jobs": [
      {
        "name": "nightly-healing",
        "schedule": "0 2 * * *",
        "description": "Daily self-healing scan at 2:00 AM",
        "status": "active"
      },
      {
        "name": "nightly-tests",
        "schedule": "0 3 * * *",
        "description": "Auto-test generation at 3:00 AM",
        "status": "active"
      },
      {
        "name": "weekly-pr",
        "schedule": "0 4 * * 0",
        "description": "Weekly PR creation on Sunday at 4:00 AM",
        "status": "active"
      },
      {
        "name": "health-check",
        "schedule": "*/15 * * * *",
        "description": "System health check every 15 minutes",
        "status": "active"
      },
      {
        "name": "daily-report",
        "schedule": "0 9 * * *",
        "description": "Daily metrics report at 9:00 AM",
        "status": "active"
      }
    ],
    "orchestrator": {
      "initialized": true,
      "tasksCount": 0
    },
    "timestamp": "2025-11-08T02:00:00.000Z"
  }
}
```

### 2. Check Agent Tasks

```bash
curl http://localhost:8080/api/monitoring/agent-tasks | jq
```

Expected response:
```json
{
  "success": true,
  "tasks": [],
  "summary": {
    "total": 0,
    "pending": 0,
    "running": 0,
    "completed": 0,
    "failed": 0
  }
}
```

### 3. Manually Trigger Self-Healing Job

```bash
curl -X POST http://localhost:8080/api/monitoring/trigger-job \
  -H "Content-Type: application/json" \
  -d '{"jobName":"nightly-healing"}' | jq
```

Expected response:
```json
{
  "success": true,
  "message": "Job nightly-healing triggered successfully",
  "taskId": "task_1699488000000_abc123"
}
```

### 4. Check Task Status After Trigger

```bash
# Wait a few seconds, then check tasks
curl http://localhost:8080/api/monitoring/agent-tasks | jq '.summary'
```

Expected response:
```json
{
  "total": 1,
  "pending": 0,
  "running": 1,
  "completed": 0,
  "failed": 0
}
```

### 5. Monitor Logs in Real-Time

```bash
# In another terminal, watch the logs
tail -f logs/app.log | grep CRON

# You should see:
# 🕐 Starting Cron Scheduler for Autonomous Agents...
# 📅 Scheduled job: nightly-healing (0 2 * * *)
# ✅ Cron Scheduler started with 5 jobs
# 💓 [CRON] Running health check...
# ✅ [CRON] Health check completed
```

## Test Scenarios

### Scenario 1: Server Startup
```bash
npm run dev

# Expected output includes:
# 🕐 Starting Cron Scheduler...
# 📅 Scheduled job: nightly-healing
# ✅ Autonomous Agents Cron Scheduler activated
```

### Scenario 2: Health Check (Wait 15 Minutes)
```bash
# Monitor logs every 15 minutes
watch -n 900 "curl -s http://localhost:8080/api/monitoring/agent-tasks | jq '.summary'"
```

### Scenario 3: Graceful Shutdown
```bash
# Send SIGTERM
kill -TERM <server-pid>

# Expected output:
# SIGTERM signal received: starting graceful shutdown
# 🛑 Stopping Cron Scheduler...
# Stopped job: nightly-healing
# Cron Scheduler stopped
```

### Scenario 4: Disabled Cron
```bash
# In .env
ENABLE_CRON=false

npm run dev

# Expected output:
# 🕐 Cron Scheduler is DISABLED (set ENABLE_CRON=true to enable)
```

## Integration Tests

### Test 1: API Keys Not Set
```bash
# Remove API keys from .env
# OPENROUTER_API_KEY=
# DEEPSEEK_API_KEY=

npm run dev

# Expected:
# ⚠️  Agent orchestrator API keys not configured. Cron jobs will be limited.
# Status should show: "orchestrator": { "initialized": false }
```

### Test 2: Invalid Job Name
```bash
curl -X POST http://localhost:8080/api/monitoring/trigger-job \
  -H "Content-Type: application/json" \
  -d '{"jobName":"invalid-job"}' | jq
```

Expected response:
```json
{
  "success": false,
  "error": "Unknown job: invalid-job"
}
```

### Test 3: All Jobs Summary
```bash
curl -s http://localhost:8080/api/monitoring/cron-status | \
  jq '.status.jobs[] | {name: .name, schedule: .schedule}'
```

Expected output:
```json
{"name":"nightly-healing","schedule":"0 2 * * *"}
{"name":"nightly-tests","schedule":"0 3 * * *"}
{"name":"weekly-pr","schedule":"0 4 * * 0"}
{"name":"health-check","schedule":"*/15 * * * *"}
{"name":"daily-report","schedule":"0 9 * * *"}
```

## Troubleshooting Tests

### If status shows "inactive":
```bash
# Check environment
env | grep CRON

# Check logs
grep "CRON" logs/app.log | tail -20

# Verify dependencies
npm list node-cron
```

### If orchestrator not initialized:
```bash
# Check API keys
env | grep -E "OPENROUTER|DEEPSEEK"

# Should output:
# OPENROUTER_API_KEY=sk-...
# DEEPSEEK_API_KEY=sk-...
```

### If jobs not running:
```bash
# Check server is running
curl http://localhost:8080/health

# Check cron is enabled
curl http://localhost:8080/api/monitoring/cron-status | jq '.status.enabled'

# Should output: true
```

## Performance Tests

### Test Load with Multiple Triggers
```bash
# Trigger multiple jobs simultaneously
for job in nightly-healing nightly-tests weekly-pr; do
  curl -X POST http://localhost:8080/api/monitoring/trigger-job \
    -H "Content-Type: application/json" \
    -d "{\"jobName\":\"$job\"}" &
done
wait

# Check results
curl http://localhost:8080/api/monitoring/agent-tasks | jq '.summary'
```

## Automated Test Script

Create `test-cron-system.sh`:

```bash
#!/bin/bash
set -e

echo "🧪 Testing Autonomous Agents Cron System..."

BASE_URL="http://localhost:8080"

# Test 1: Health check
echo "1. Testing health endpoint..."
curl -s "$BASE_URL/health" | jq -e '.status == "healthy"'

# Test 2: Cron status
echo "2. Testing cron status..."
curl -s "$BASE_URL/api/monitoring/cron-status" | jq -e '.success == true'

# Test 3: Agent tasks
echo "3. Testing agent tasks..."
curl -s "$BASE_URL/api/monitoring/agent-tasks" | jq -e '.success == true'

# Test 4: Trigger job
echo "4. Testing job trigger..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/monitoring/trigger-job" \
  -H "Content-Type: application/json" \
  -d '{"jobName":"nightly-healing"}')
echo "$RESPONSE" | jq -e '.success == true'

echo "✅ All tests passed!"
```

Run with:
```bash
chmod +x test-cron-system.sh
./test-cron-system.sh
```
