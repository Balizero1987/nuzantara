# 🧪 ZANTARA POC: Gemini 2.0 Flash vs Claude Haiku 4.5

## Overview

Comprehensive benchmark comparing **Gemini 2.0 Flash** vs **Claude Haiku 4.5** on **100 real ZANTARA queries** across 10 categories.

## Test Categories (100 queries)

1. **KBLI Lookup** (10 queries) - Business classification codes
2. **PT PMA Setup** (10 queries) - Foreign investment company setup
3. **Visa & Immigration** (10 queries) - Work permits, KITAS, visas
4. **Tax Compliance** (10 queries) - Corporate tax, NPWP, VAT
5. **Legal Compliance** (10 queries) - OSS, licenses, regulations
6. **Property Investment** (10 queries) - Foreign ownership, land rights
7. **Banking & Finance** (10 queries) - Bank accounts, transfers, forex
8. **Employment & HR** (10 queries) - Labor law, payroll, benefits
9. **Quick Facts** (10 queries) - General knowledge about Indonesia
10. **Conversational** (10 queries) - Chat interactions, clarifications

## Metrics Measured

### Performance
- **TTFT** (Time To First Token) - Real-time responsiveness
- **Total Time** - Complete response generation
- **Response Length** - Output verbosity

### Cost
- **Input Tokens** - Query processing cost
- **Output Tokens** - Response generation cost
- **Total Cost (USD)** - Per-query and total

### Reliability
- **Success Rate** - % queries completed without errors
- **Error Count** - Failed requests by model

## Setup

### 1. Install Dependencies

```bash
pip install anthropic google-generativeai
```

### 2. Set API Keys

Create `.env` file in `/benchmarks` directory:

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-xxx...xxx
GOOGLE_API_KEY=AIzaSy...xxx
```

**Get API Keys:**
- **Anthropic**: https://console.anthropic.com/settings/keys
- **Google AI**: https://aistudio.google.com/apikey

### 3. Run Benchmark

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-FLY/benchmarks
python3 gemini_vs_haiku_poc.py
```

## Expected Output

### Console Output

```
🚀 ZANTARA POC BENCHMARK: Gemini 2.0 Flash vs Claude Haiku 4.5
================================================================================

📊 Testing category: kbli_lookup (10 queries)
  [1/100] Testing: What KBLI code for software development company?...
  [2/100] Testing: KBLI category for restaurant and catering business...
  ...

📊 BENCHMARK SUMMARY
================================================================================

🔵 CLAUDE HAIKU 4.5:
   Avg TTFT: 245ms
   Avg Total Time: 1850ms
   Avg Response Length: 520 chars
   Total Cost: $0.0245
   Success Rate: 100%

🟢 GEMINI 2.0 FLASH:
   Avg TTFT: 182ms
   Avg Total Time: 890ms
   Avg Response Length: 480 chars
   Total Cost: $0.0012
   Success Rate: 98%

⚡ COMPARISON:
   Cost Savings: $0.0233 (95.1%)
   TTFT Improvement: 25.7%
   Total Time Improvement: 51.9%
```

### JSON Output

Results saved to `benchmark_results_YYYYMMDD_HHMMSS.json`:

```json
{
  "timestamp": "2025-11-05T18:00:00",
  "overall_stats": {
    "total_queries": 100,
    "haiku": {
      "avg_ttft_ms": 245,
      "avg_total_time_ms": 1850,
      "total_cost": 0.0245,
      "success_rate": 100
    },
    "gemini": {
      "avg_ttft_ms": 182,
      "avg_total_time_ms": 890,
      "total_cost": 0.0012,
      "success_rate": 98
    },
    "comparison": {
      "cost_savings_usd": 0.0233,
      "cost_savings_pct": 95.1,
      "ttft_improvement_pct": 25.7,
      "total_time_improvement_pct": 51.9
    }
  },
  "categories_stats": {...},
  "detailed_results": [...]
}
```

## Decision Framework

### ✅ Recommend Gemini 2.0 Flash IF:
- Cost savings > 80%
- TTFT improvement > 0%
- Success rate > 95%

### ⚠️ Recommend Hybrid Approach IF:
- Cost savings 50-80%
- Gemini struggles with specific categories (e.g., legal, tools)

### ❌ Keep Haiku 4.5 IF:
- Cost savings < 50%
- Gemini success rate < 90%
- Gemini quality significantly lower

## Pricing Reference

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Claude Haiku 4.5 | $1.00 | $5.00 |
| Gemini 2.0 Flash | $0.075 | $0.30 |

**Expected Savings:** 93-95% cost reduction if quality is comparable

## Next Steps After POC

### If Gemini Wins (>80% savings + quality):
1. **Phase 1**: Integrate Gemini SDK into webapp
2. **Phase 2**: A/B test 10% traffic Gemini vs Haiku
3. **Phase 3**: Gradual rollout 25% → 50% → 75% → 100%

### If Hybrid Recommended (50-80% savings):
1. **Intelligent Routing**:
   - Gemini: KBLI, tax, visa, quick facts, conversational
   - Haiku: PT PMA, legal, tools, multi-step reasoning

2. **Cost Distribution**:
   - 70% queries → Gemini (cheap)
   - 30% queries → Haiku (critical)
   - Expected: 60-65% overall cost savings

### If Haiku Wins (<50% savings OR quality issues):
1. Explore other alternatives:
   - GPT-4o mini ($0.15/$0.60)
   - DeepSeek V3 ($0.14/$0.28)
   - Llama 4 Scout ($0.18/$0.59)

## Quality Evaluation (Manual)

After benchmark, manually review 10 random responses from each category:

```bash
# Extract sample responses for review
cat benchmark_results_*.json | jq '.detailed_results[] | select(.category=="pt_pma_setup") | {query, model, response_preview}'
```

**Quality Checklist:**
- [ ] Factual accuracy (Indonesian regulations)
- [ ] Response completeness
- [ ] Formatting (structured vs unstructured)
- [ ] Tone appropriateness (professional)
- [ ] Cultural sensitivity (Indonesia-specific)

## Troubleshooting

### Error: "API key not found"
```bash
# Check .env file exists
ls -la .env

# Check environment variables
echo $ANTHROPIC_API_KEY
echo $GOOGLE_API_KEY

# Reload .env
export $(cat .env | xargs)
```

### Error: "Rate limit exceeded"
- Gemini free tier: 15 RPM (requests per minute)
- Haiku tier 1: 5 RPM

**Solution**: Increase `await asyncio.sleep(0.5)` to `await asyncio.sleep(2.0)` in script (line 330)

### Error: "Model not available"
- Gemini 2.0 Flash is experimental (gemini-2.0-flash-exp)
- Fallback: Use gemini-1.5-flash (production stable)

## Support

For issues or questions:
- Check [Gemini API docs](https://ai.google.dev/docs)
- Check [Anthropic API docs](https://docs.anthropic.com/)
- Review benchmark results JSON for detailed error messages

---

**Created:** November 2025
**Version:** 1.0
**Purpose:** Data-driven AI model selection for ZANTARA production deployment
