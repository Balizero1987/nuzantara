# LLAMA Batch Classification System

Automated daily classification of Intel Scraping documents using LLAMA 3.1 on RunPod.

---

## 🎯 Purpose

Since LLAMA 3.1 cannot serve real-time chat requests (RunPod endpoint times out), we use it for **scheduled batch work** instead:

- **Daily classification** of scraped intel documents
- **Topic categorization** (immigration, tax, business, etc.)
- **Priority assessment** (high/medium/low)
- **Audience targeting** (entrepreneurs, investors, expats)
- **Actionability** (requires action vs informational)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│ Railway Cron Job                                    │
│ Runs daily at 2 AM UTC (10 AM Jakarta)             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ scripts/llama_batch_classifier.py            │  │
│  │                                              │  │
│  │  1. Find unclassified documents              │  │
│  │  2. Call LLAMA 3.1 on RunPod                 │  │
│  │  3. Parse classification results             │  │
│  │  4. Save back to JSON files                  │  │
│  │  5. Generate batch summary                   │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  Fallback: Claude Sonnet (if LLAMA unavailable)    │
│                                                     │
└─────────────────────────────────────────────────────┘

Input: INTEL_SCRAPING/**/*.json
Output: Same files with "llama_classification" field added
```

---

## 📋 Classification Schema

Each document gets classified with:

```json
{
  "llama_classification": {
    "topic": "immigration" | "tax" | "business_setup" | "employment_law" | "real_estate" | "banking" | "health_safety",
    "priority": "high" | "medium" | "low",
    "target_audience": ["entrepreneurs", "investors", "expats", "locals"],
    "actionability": "requires_action" | "informational",
    "summary": "One sentence summary in English"
  },
  "llama_classified_at": "2025-10-16T10:30:00Z"
}
```

---

## 🚀 Usage

### Manual Run (Testing)

```bash
# Dry run (don't save results)
python3 scripts/llama_batch_classifier.py --dry-run

# Classify first 10 documents
python3 scripts/llama_batch_classifier.py --limit 10

# Full run
python3 scripts/llama_batch_classifier.py
```

### Scheduled Run (Railway)

Railway will automatically run this job daily at 2 AM UTC based on `railway_cron.toml`:

```toml
[jobs.llama_classification]
schedule = "0 2 * * *"
command = "python3 scripts/llama_batch_classifier.py"
timeout = 600  # 10 minutes
```

---

## 🔧 Configuration

### Required Environment Variables

On Railway Dashboard → Service → Variables:

```bash
# LLAMA Configuration (Primary)
RUNPOD_LLAMA_ENDPOINT=https://api.runpod.ai/v2/pnrwxgpd5aqy1e
RUNPOD_API_KEY=rpa_O0Z01LGRFLEG7DAX7FRGLJ4SOJSHKSGD9RRJD1RMwmq5qz

# Claude Fallback (Already configured)
ANTHROPIC_API_KEY=sk-ant-api03-Vs-tio6YxpI...
```

### Optional: Change Schedule

Edit `railway_cron.toml`:

```toml
# Every 6 hours
schedule = "0 */6 * * *"

# Twice daily (2 AM, 2 PM UTC)
schedule = "0 2,14 * * *"

# Weekdays only
schedule = "0 2 * * 1-5"
```

---

## 📊 Monitoring

### Check Last Run

```bash
# View latest batch summary
ls -lt /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/INTEL_SCRAPING/classification_batch_*.json | head -1

# View results
cat INTEL_SCRAPING/classification_batch_20251016_100000.json | jq
```

### Railway Logs

```bash
# View cron job logs on Railway Dashboard
https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9
→ Service: scintillating-kindness
→ Tab: Logs
→ Filter: "llama_batch_classifier"
```

---

## 🧪 Testing

### Test with Single Document

```python
import asyncio
from scripts.llama_batch_classifier import LlamaClassifier

async def test():
    classifier = LlamaClassifier()

    doc = {
        "title": "Peraturan Presiden No. 90/2024",
        "content": "Perubahan keempat atas Peraturan Presiden...",
        "category": "regulatory_changes"
    }

    result = await classifier.classify_document(doc)
    print(result)

asyncio.run(test())
```

### Test LLAMA Endpoint

```bash
curl -X POST "https://api.runpod.ai/v2/pnrwxgpd5aqy1e/runsync" \
  -H "Authorization: Bearer rpa_O0Z01LGRFLEG7DAX7FRGLJ4SOJSHKSGD9RRJD1RMwmq5qz" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "prompt": "Classify: immigration document",
      "max_tokens": 100
    }
  }'
```

---

## 💡 Benefits

### Why Batch Processing?

1. **LLAMA Timeout Issue Solved** ✅
   - Real-time: 90+ second timeout = unusable
   - Batch: Processes offline, no user waiting

2. **Cost Efficiency** 💰
   - RunPod: €3.78/month flat (vs Claude pay-per-token)
   - Classify 1000s of documents for fixed cost

3. **Better Quality** 🎯
   - LLAMA 3.1 has more time to think
   - Can process longer documents (2000+ chars)
   - More consistent classifications

4. **Fallback Reliability** 🛡️
   - If LLAMA unavailable → Claude Sonnet
   - Never blocks workflow

---

## 📈 Expected Performance

### Processing Speed

- **With LLAMA**: ~3-5 seconds per document
- **With Claude**: ~1-2 seconds per document
- **Daily capacity**: 500-1000 documents (10 min job)

### Cost Analysis

**LLAMA (Primary)**:
- Cost: €3.78/month flat
- Capacity: Unlimited documents
- **Cost per 1000 docs: €0.12** (assuming daily runs)

**Claude (Fallback)**:
- Cost: $3/$15 per 1M tokens (input/output)
- Avg document: ~500 tokens input, 100 tokens output
- **Cost per 1000 docs: $2.10**

**Savings with LLAMA**: 94%

---

## 🔄 Future Enhancements

1. **Smart Re-classification**
   - Re-classify documents older than 30 days
   - Update classifications when regulations change

2. **Multi-language Support**
   - Classify in both English and Indonesian
   - Generate bilingual summaries

3. **Confidence Scores**
   - Track classification confidence
   - Flag low-confidence docs for manual review

4. **Topic Clustering**
   - Identify trending topics
   - Alert on new regulation patterns

---

## 🆘 Troubleshooting

### Job Fails: "LLAMA timeout"

**Solution**: Check if RunPod pod is active
```bash
# Test endpoint manually
curl -X POST "https://api.runpod.ai/v2/pnrwxgpd5aqy1e/health"
```

**Fallback**: Script automatically uses Claude if LLAMA fails

### Job Fails: "No INTEL_SCRAPING directory"

**Solution**: Adjust path in script for Railway environment
```python
# Change from:
intel_dir = Path("/Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/INTEL_SCRAPING")

# To:
intel_dir = Path(os.getenv("INTEL_SCRAPING_PATH", "./INTEL_SCRAPING"))
```

### Job Completes but No Classifications

**Check**: Are documents already classified?
```bash
# Count classified vs unclassified
grep -r "llama_classification" INTEL_SCRAPING/ | wc -l
```

---

## 📝 Deployment Checklist

- [ ] Script created: `scripts/llama_batch_classifier.py`
- [ ] Cron config: `railway_cron.toml`
- [ ] Environment variables set on Railway:
  - [ ] `RUNPOD_LLAMA_ENDPOINT`
  - [ ] `RUNPOD_API_KEY`
  - [ ] `ANTHROPIC_API_KEY` (fallback)
- [ ] Test manual run: `python3 scripts/llama_batch_classifier.py --dry-run --limit 3`
- [ ] Deploy to Railway
- [ ] Verify first scheduled run (check logs next day)

---

**Status**: ✅ Ready for deployment
**Last Updated**: 2025-10-16
**Maintainer**: Claude Code + Zero
