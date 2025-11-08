# 🦙 Llama 4 Scout - Quick Start

## 30 Second Setup

```bash
# 1. Run setup script
cd apps/backend-rag
./scripts/setup-llama-scout.sh

# 2. Verify (wait 30s for deployment)
curl https://nuzantara-rag.fly.dev/health | jq '.features.ai.status'
# Output: "🦙 Llama 4 Scout ACTIVE"
```

## Benefits

- **95% cheaper**: $0.20 vs $1-5 per 1M tokens
- **22% faster**: 880ms vs 1100ms TTFT
- **50x context**: 10M vs 200k tokens
- **100% quality**: Same success rate

## Cost Savings (1000 queries/day)

| Model | Daily Cost | Monthly Cost | Savings |
|-------|-----------|--------------|---------|
| Haiku 4.5 | $8.00 | $240 | - |
| Llama 4 Scout | $0.40 | $12 | **$228/mese (95%)** |

## Manual Setup

```bash
# 1. Get OpenRouter key
open https://openrouter.ai/keys

# 2. Configure Fly.io
fly secrets set OPENROUTER_API_KEY_LLAMA="sk-or-v1-..." -a nuzantara-rag

# 3. Check logs
fly logs -a nuzantara-rag | grep "Llama Scout"
```

## Troubleshooting

### Still shows Haiku-only?

```bash
# Check secrets
fly secrets list -a nuzantara-rag

# Set key if missing
fly secrets set OPENROUTER_API_KEY_LLAMA="sk-or-v1-..." -a nuzantara-rag

# Wait 30-60s for restart
```

### Constant fallbacks to Haiku?

Invalid OpenRouter key. Check [openrouter.ai/keys](https://openrouter.ai/keys)

## Full Docs

See [LLAMA_SCOUT_MIGRATION.md](./LLAMA_SCOUT_MIGRATION.md) for complete guide.

---

**Setup time**: 2 minutes
**Monthly savings**: $228 (95%)
**Downtime**: Zero (automatic fallback)
