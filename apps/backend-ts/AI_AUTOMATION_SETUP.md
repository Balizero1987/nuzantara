# AI Automation Setup Guide

## 🚀 Quick Start

### 1. Set OpenRouter API Key

```bash
# Edit .env and add your OpenRouter API key
nano .env

# Replace YOUR_KEY_HERE with your actual key:
# OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

### 2. Test AI Agents (IMPORTANT: Do this first!)

```bash
# Test all agents before enabling cron jobs
./test-ai-agents.sh
```

This will test:
- ✅ OpenRouter client connection
- ✅ Refactoring agent (dry run on logger.ts)
- ✅ Test generator agent (dry run on logger.ts)

### 3. Review Results

Check the following:

1. **Generated PRs** (if any):
   ```bash
   gh pr list --author "app/"
   ```

2. **History Files**:
   ```bash
   ls -la .ai-automation/
   cat .ai-automation/refactoring-history.json
   cat .ai-automation/test-generation-history.json
   ```

3. **Agent Stats**:
   - Calls made this hour
   - Error rate
   - Cost today
   - Circuit breaker status

### 4. Integrate with Cron (After Testing)

```bash
# Only run this AFTER manual testing is successful
./integrate-ai-cron.sh
```

This will:
- ✅ Install node-cron dependency
- ✅ Create monitoring endpoints
- ✅ Show integration instructions for server.ts

### 5. Manual Server Integration

Add to your `src/server.ts` or `src/index.ts`:

```typescript
import { cronScheduler } from './services/cron-scheduler.js';
import aiMonitoring from './routes/ai-monitoring.js';

// Add monitoring routes
app.use('/api/monitoring', aiMonitoring);

// Start cron scheduler after server starts
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);

  // Start AI automation
  cronScheduler.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  cronScheduler.stop();
  server.close(() => process.exit(0));
});
```

### 6. Deploy & Monitor

```bash
# Build and restart
npm run build
pm2 restart nuzantara-backend

# Monitor logs
pm2 logs nuzantara-backend --lines 100

# Check cron status
curl http://localhost:8080/api/monitoring/cron-status

# Check AI stats
curl http://localhost:8080/api/monitoring/ai-stats

# Health check
curl http://localhost:8080/api/monitoring/ai-health
```

---

## 📋 Cron Schedule

| Job | Schedule | Model | Cost |
|-----|----------|-------|------|
| **AI Code Refactoring** | Daily 4 AM | DeepSeek Coder (FREE) | $0 |
| **AI Test Generation** | Daily 5 AM | Qwen 2.5 (FREE) | $0 |
| **Health Check** | Every Hour | Mistral 7B (FREE) | $0 |

**Total Daily Cost**: ~$0.10 (mostly free models)

---

## 🛡️ Safety Limits (Anti-Loop)

| Protection | Limit | Purpose |
|------------|-------|---------|
| **API Calls/Hour** | 100 | Rate limit protection |
| **Daily Budget** | $1.00 | Cost control |
| **Refactoring Cooldown** | 7 days | No re-refactoring |
| **Test Gen Cooldown** | 7 days | No re-generation |
| **Max Files Per Run** | 5 (refactor), 10 (tests) | Batch limit |
| **Circuit Breaker** | 20% error rate | Auto-pause on failures |
| **Max Errors Per File** | 3 | Then blacklist |

---

## 📊 Monitoring

### View Current Stats

```typescript
import { openRouterClient } from './src/services/ai/openrouter-client.js';
import { RefactoringAgent } from './src/agents/refactoring-agent.js';
import { TestGeneratorAgent } from './src/agents/test-generator-agent.js';

// OpenRouter stats
console.log(openRouterClient.getStats());
// {
//   callsThisHour: 12,
//   errorRate: 0,
//   costToday: 0.0042,
//   circuitBreakerOpen: false,
//   budgetRemaining: 0.9958
// }

// Agent stats
const refactor = new RefactoringAgent();
console.log(refactor.getStats());

const testGen = new TestGeneratorAgent();
console.log(testGen.getStats());
```

### Monitoring Endpoints

```bash
# Cron status
GET /api/monitoring/cron-status

# AI stats
GET /api/monitoring/ai-stats

# Health check
GET /api/monitoring/ai-health
```

---

## 🚨 Troubleshooting

### Circuit Breaker Opens

If you see "Circuit breaker opened":

1. **Check error rate**: `curl http://localhost:8080/api/monitoring/ai-stats`
2. **Wait 5 minutes** for automatic reset
3. **Review logs** to identify root cause
4. **Adjust limits** if needed in `openrouter-client.ts`

### Budget Exceeded

If daily budget exceeded:

1. **Wait until next day** (resets at midnight)
2. **Review usage**: Check which models were used
3. **Optimize**: Use more free models
4. **Increase budget**: Adjust `dailyBudget` in `openrouter-client.ts`

### Tests Fail After Refactoring

If refactoring breaks tests:

1. **Automatic rollback** restores original file
2. **File gets error count++**
3. **After 3 errors** → blacklisted
4. **Review** `.ai-automation/refactoring-history.json`

### Generated Tests Don't Pass

If test generator creates failing tests:

1. **Generated file is deleted** automatically
2. **File gets error count++**
3. **After 3 errors** → blacklisted
4. **Review** `.ai-automation/test-generation-history.json`

---

## 📁 File Structure

```
apps/backend-ts/
├── .env                           # Your OpenRouter API key
├── .ai-automation/
│   ├── .gitignore                 # Excludes history from git
│   ├── refactoring-history.json   # Refactoring tracking
│   └── test-generation-history.json # Test gen tracking
├── src/
│   ├── services/
│   │   ├── ai/
│   │   │   └── openrouter-client.ts  # OpenRouter client
│   │   └── cron-scheduler.ts      # Cron jobs
│   ├── agents/
│   │   ├── refactoring-agent.ts   # Refactoring agent
│   │   └── test-generator-agent.ts # Test generator
│   └── routes/
│       └── ai-monitoring.ts       # Monitoring API
├── test-ai-agents.sh             # Test script
└── integrate-ai-cron.sh          # Integration script
```

---

## ⚙️ Configuration

### Adjust Limits

Edit `apps/backend-ts/src/services/ai/openrouter-client.ts`:

```typescript
// Rate limiting
private maxCallsPerHour = 100; // Adjust this

// Budget
private dailyBudget = 1.0; // Adjust this

// Circuit breaker
private circuitBreakerThreshold = 0.2; // 20% error rate
```

### Adjust Cooldown Periods

Edit agent files:

```typescript
// Refactoring cooldown (7 days)
private cooldownPeriod = 7 * 24 * 60 * 60 * 1000;

// Max files per run
private maxFilesPerRun = 5; // Adjust this
```

---

## 🎯 Best Practices

1. **Test First**: Always run `./test-ai-agents.sh` before enabling cron
2. **Monitor Daily**: Check `/api/monitoring/ai-health` daily
3. **Review PRs**: Never auto-merge AI-generated PRs
4. **Track History**: Review `.ai-automation/*.json` files weekly
5. **Adjust Limits**: Fine-tune based on your usage patterns
6. **Budget Alert**: Set up alerts when approaching $0.80/day

---

## 📞 Support

If you encounter issues:

1. Check logs: `pm2 logs nuzantara-backend`
2. Review history files in `.ai-automation/`
3. Check monitoring endpoints
4. Verify OpenRouter API key is correct
5. Ensure all dependencies installed: `npm install`

---

**Ready to automate!** 🚀
