# 🚀 ZANTARA Self-Healing System - Deployment Guide

## Prerequisites

1. **Fly.io CLI** installed and authenticated
2. **OpenAI API Key** for AI decision-making
3. **Redis** (already running: nuzantara-redis)

## Deployment Steps

### 1. Deploy Central Orchestrator

```bash
cd apps/self-healing/orchestrator

# Create Fly.io app
fly apps create nuzantara-orchestrator --org personal

# Set secrets
fly secrets set OPENAI_API_KEY="your-openai-api-key" -a nuzantara-orchestrator

# Deploy
fly deploy -a nuzantara-orchestrator

# Check status
fly status -a nuzantara-orchestrator
fly logs -a nuzantara-orchestrator
```

### 2. Integrate Frontend Agent

Add to `apps/webapp/chat.html`:

```html
<!-- Self-Healing Agent -->
<script type="module" src="js/self-healing/frontend-agent.js"></script>
```

Copy agent file:

```bash
mkdir -p apps/webapp/js/self-healing
cp apps/self-healing/agents/frontend-agent.js apps/webapp/js/self-healing/
```

### 3. Integrate Backend Agents

For each backend service (RAG, Memory, etc.):

#### Option A: Add to existing service

```python
# Add to main.py startup
from self_healing.backend_agent import BackendSelfHealingAgent
import asyncio

@app.on_event("startup")
async def start_agent():
    agent = BackendSelfHealingAgent(
        service_name=os.getenv('SERVICE_NAME', 'rag'),
        orchestrator_url="https://nuzantara-orchestrator.fly.dev"
    )
    asyncio.create_task(agent.start())
```

#### Option B: Run as sidecar process

Add to `fly.toml`:

```toml
[processes]
  app = "python main.py"
  agent = "python -m self_healing.backend_agent"
```

### 4. Update Backend Services

```bash
# Copy agent to each service
cp apps/self-healing/agents/backend_agent.py apps/backend-rag/backend/self_healing/
cp apps/self-healing/agents/backend_agent.py apps/memory-service/self_healing/

# Add requirements
echo "psutil==5.9.6" >> apps/backend-rag/requirements.txt
echo "httpx==0.25.1" >> apps/backend-rag/requirements.txt

# Redeploy services
flyctl deploy -a nuzantara-rag
flyctl deploy -a nuzantara-memory
```

## Configuration

### Environment Variables

**Orchestrator:**
- `OPENAI_API_KEY` - OpenAI API key for AI decisions
- `LOG_LEVEL` - Logging level (default: INFO)

**Backend Agents:**
- `SERVICE_NAME` - Name of the service (rag, memory, etc.)
- `ORCHESTRATOR_URL` - URL of orchestrator (default: https://nuzantara-orchestrator.fly.dev)
- `CHECK_INTERVAL` - Health check interval in seconds (default: 30)
- `AUTO_FIX_ENABLED` - Enable auto-fixing (default: true)

**Frontend Agent:**
```javascript
window.zantaraAgent = new ZantaraFrontendAgent({
  orchestratorUrl: 'https://nuzantara-orchestrator.fly.dev',
  autoFixEnabled: true,
  reportingEnabled: true
});
```

## Testing

### 1. Test Frontend Agent

```javascript
// In browser console
getAgentStatus()

// Trigger test error
throw new Error('Test error for self-healing')

// Check if agent detected and reported
getAgentStatus()
```

### 2. Test Backend Agent

```bash
# Check agent logs
fly logs -a nuzantara-rag | grep "Backend Agent"

# Trigger test issue (simulate high memory)
# Agent should detect and attempt fix
```

### 3. Test Orchestrator

```bash
# Check orchestrator status
curl https://nuzantara-orchestrator.fly.dev/api/status

# View recent reports
curl https://nuzantara-orchestrator.fly.dev/api/status | jq .recent_reports

# View fix decisions
curl https://nuzantara-orchestrator.fly.dev/api/status | jq .recent_decisions
```

## Dashboard

Create a simple dashboard to monitor the system:

```bash
# Coming soon: https://health.zantara.balizero.com
# WebSocket connection to /ws/dashboard for real-time updates
```

## Auto-Fix Strategies

| Error Type | Detection | Auto-Fix | Manual Escalation |
|------------|-----------|----------|-------------------|
| **Frontend** | | | |
| Import Error | Console | Reload page | If persists > 3x |
| Syntax Error | Console | Report only | Always |
| 404 File | Network | Ignore/retry | If critical |
| Network Error | Fetch | Retry 3x | If all fail |
| Memory Leak | Performance | Suggest reload | If > 90% |
| UI Missing | DOM Check | Reload page | If persists |
| **Backend** | | | |
| High CPU | psutil | Monitor | If > 90% |
| High Memory | psutil | GC + restart | If > 90% |
| API Down | Health Check | Restart | If restart fails |
| DB Down | Health Check | Reconnect | If reconnect fails |
| Cache Down | Health Check | Reconnect | If reconnect fails |

## AI Decision Making

The orchestrator uses GPT-4 to make intelligent decisions:

1. **Analyze Error Context**
   - Error type, severity, frequency
   - Past fix success rates
   - Current system state
   - Similar errors in history

2. **Select Fix Strategy**
   - Choose from available strategies
   - Estimate impact and risk
   - Determine if auto-apply safe
   - Plan rollback if needed

3. **Apply or Escalate**
   - Auto-apply if confidence > 80% and low risk
   - Escalate to admin if uncertain
   - Learn from outcome

## Monitoring & Alerts

### Logs

```bash
# Orchestrator logs
fly logs -a nuzantara-orchestrator

# Backend agent logs (within service logs)
fly logs -a nuzantara-rag | grep "Backend Agent"

# Frontend agent logs (browser console)
# Filter: [Frontend Agent]
```

### Metrics

Track in orchestrator `/api/status`:
- Total errors detected
- Total fixes applied
- Fix success rate
- Error rate (errors/minute)
- Agents online
- Critical issues

### Alerts

Set up alerts for:
- Fix success rate < 50%
- Error rate > 10/minute
- Critical issue detected
- Agent offline > 5 minutes
- Auto-fix failed 3x in a row

## Troubleshooting

### Agent not starting

```bash
# Check logs
fly logs -a nuzantara-orchestrator

# Check secrets
fly secrets list -a nuzantara-orchestrator

# Restart
fly apps restart nuzantara-orchestrator
```

### Agent not reporting

```bash
# Check network
curl https://nuzantara-orchestrator.fly.dev/api/health

# Check agent config
# Verify orchestratorUrl is correct

# Check CORS
# Orchestrator allows all origins by default
```

### AI not making decisions

```bash
# Check OpenAI API key
fly secrets list -a nuzantara-orchestrator

# Check OpenAI credits
# Verify account has credits

# Check logs for OpenAI errors
fly logs -a nuzantara-orchestrator | grep -i openai
```

## Cost Estimation

### Orchestrator
- **Fly.io**: ~$5/month (shared-cpu-1x)
- **OpenAI**: ~$1-5/month (GPT-4 calls, ~100-500 decisions/month)

### Backend Agents
- **No additional cost** (runs within existing services)

### Frontend Agent
- **No cost** (runs in browser)

**Total**: ~$6-10/month

## Rollback

If needed, rollback the system:

```bash
# Stop orchestrator
fly apps suspend nuzantara-orchestrator

# Remove frontend agent
# Comment out script tag in chat.html

# Remove backend agents
# Comment out startup code in services

# Redeploy services
flyctl deploy -a nuzantara-rag
flyctl deploy -a nuzantara-memory
```

## Future Enhancements

1. **Dashboard UI** - Web interface for monitoring
2. **Slack Integration** - Alerts and notifications
3. **Advanced Learning** - ML model for pattern recognition
4. **Auto-Scaling** - Dynamically scale services based on load
5. **Predictive Healing** - Fix issues before they happen
6. **Multi-Region** - Coordinate agents across regions
7. **A/B Testing Fixes** - Test different strategies
8. **Rollback Automation** - Auto-rollback failed fixes
