# Backend TypeScript - Deployment Guide

## 🚀 Deployment to Fly.io with AI Automation

This guide covers deploying the backend-ts application to Fly.io with AI automation enabled.

## Prerequisites

1. **Fly.io CLI installed**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Fly.io account and authentication**
   ```bash
   flyctl auth login
   ```

3. **OpenRouter API Key**
   - Sign up at https://openrouter.ai/
   - Get your API key from the dashboard

## Manual Deployment

### Step 1: Configure Secrets

Run the secrets configuration script from the project root:

```bash
cd /home/user/nuzantara
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE ./fly-set-secrets.sh
```

Or set the secret manually:

```bash
flyctl secrets set OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE \
  --app nuzantara-backend
```

### Step 2: Deploy the Application

```bash
cd apps/backend-ts
flyctl deploy --app nuzantara-backend
```

### Step 3: Verify Deployment

```bash
# Check deployment status
flyctl status --app nuzantara-backend

# View logs
flyctl logs --app nuzantara-backend

# Test health endpoint
curl https://nuzantara-backend.fly.dev/health

# Test AI health endpoint
curl https://nuzantara-backend.fly.dev/api/monitoring/ai-health
```

## Automated Deployment (CI/CD)

The project includes a GitHub Actions workflow that automatically deploys on:

- **Push to `main` branch** - Automatic deployment after all checks pass
- **Manual trigger** - Use workflow_dispatch with deploy: true

### Required GitHub Secrets

Set these in your GitHub repository settings (Settings → Secrets → Actions):

```
FLY_API_TOKEN=<your-fly-api-token>
```

To get your Fly.io API token:

```bash
flyctl auth token
```

### Trigger Manual Deployment

1. Go to Actions tab in GitHub
2. Select "🚀 ZANTARA CI/CD Pipeline"
3. Click "Run workflow"
4. Check "Deploy to production"
5. Click "Run workflow"

## Monitoring AI Automation

Once deployed, monitor AI automation with these endpoints:

### Health Check
```bash
curl https://nuzantara-backend.fly.dev/api/monitoring/ai-health
```

Response:
```json
{
  "ok": true,
  "data": {
    "healthy": true,
    "openRouter": {
      "callsThisHour": 0,
      "maxCallsPerHour": 100,
      "errorCount": 0,
      "circuitBreakerOpen": false
    },
    "cron": {
      "isRunning": true,
      "jobCount": 3,
      "jobs": [
        "ai-code-refactoring",
        "ai-test-generation",
        "ai-health-check"
      ]
    }
  }
}
```

### Cron Status
```bash
curl https://nuzantara-backend.fly.dev/api/monitoring/cron-status
```

### AI Statistics
```bash
curl https://nuzantara-backend.fly.dev/api/monitoring/ai-stats
```

### Refactoring Agent Stats
```bash
curl https://nuzantara-backend.fly.dev/api/monitoring/refactoring-stats
```

### Test Generator Stats
```bash
curl https://nuzantara-backend.fly.dev/api/monitoring/test-generator-stats
```

## AI Automation Schedule

The AI agents run on these schedules (configurable in `src/services/cron-scheduler.ts`):

- **Code Refactoring Agent**: Every day at 2:00 AM UTC
- **Test Generator Agent**: Every day at 3:00 AM UTC
- **Health Check**: Every hour

## Troubleshooting

### Deployment Fails

```bash
# Check build logs
flyctl logs --app nuzantara-backend

# SSH into the machine
flyctl ssh console --app nuzantara-backend

# Check running processes
flyctl ssh console --app nuzantara-backend -C "ps aux"
```

### AI Automation Not Working

1. **Check OpenRouter API key is set:**
   ```bash
   flyctl secrets list --app nuzantara-backend
   ```

2. **Check AI health endpoint:**
   ```bash
   curl https://nuzantara-backend.fly.dev/api/monitoring/ai-health
   ```

3. **Check application logs:**
   ```bash
   flyctl logs --app nuzantara-backend | grep -i "cron\|ai"
   ```

### Update OpenRouter API Key

```bash
flyctl secrets set OPENROUTER_API_KEY=sk-or-v1-NEW_KEY \
  --app nuzantara-backend
```

The app will automatically restart with the new secret.

## Scaling

### Increase Resources

```bash
# Scale to 2GB RAM
flyctl scale memory 2048 --app nuzantara-backend

# Add more CPU
flyctl scale vm shared-cpu-2x --app nuzantara-backend
```

### Monitor Resource Usage

```bash
# Real-time metrics
flyctl dashboard metrics --app nuzantara-backend

# Current VM status
flyctl status --app nuzantara-backend
```

## Cost Optimization

Current configuration:
- **Region**: Singapore (sin)
- **Memory**: 1GB
- **CPU**: 1 shared CPU
- **Estimated cost**: ~$5-10/month

The AI automation uses free/low-cost OpenRouter models:
- Llama 3.3 70B: ~$0.0006 per request
- DeepSeek Coder: ~$0.0002 per request
- Daily budget: $1 (configurable)

## Support

For issues or questions:
- GitHub Issues: https://github.com/Balizero1987/nuzantara/issues
- Fly.io Docs: https://fly.io/docs/
- OpenRouter Docs: https://openrouter.ai/docs
