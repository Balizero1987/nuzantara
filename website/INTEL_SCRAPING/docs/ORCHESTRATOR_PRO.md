# Intel Scraping PRO Orchestrator

Enhanced automation orchestrator with advanced features.

## Features

### 🔄 Retry Logic
- **3 automatic retries** with exponential backoff (1s, 2s, 4s)
- Resilient to temporary failures (network, rate limits)

### ✅ Quality Validation
- **80% quality threshold** (configurable)
- Validates: title presence, URL metadata, content length
- Blocks deployment if quality below threshold

### ⚡ Parallel Execution
- **All 7 categories scrape simultaneously**
- 7x faster than sequential execution
- Independent category processing

### 📊 Real-Time Progress
- Live progress bars per category
- Completion percentage tracking
- Visual status indicators

### 🚀 Auto Commit & Deploy
- Automatic git commit if quality passes
- Auto-push to Railway
- Skips if no changes or low quality

## Usage

### Basic (All Categories)
```bash
python3 website/INTEL_SCRAPING/src/orchestrator_pro.py
```

### Specific Categories
```bash
python3 website/INTEL_SCRAPING/src/orchestrator_pro.py --categories business,ai_tech,immigration
```

### Custom Quality Threshold
```bash
python3 website/INTEL_SCRAPING/src/orchestrator_pro.py --threshold 0.9
```

### More Retries
```bash
python3 website/INTEL_SCRAPING/src/orchestrator_pro.py --retries 5
```

### Slash Command
```bash
/intel-pro
```

## Output Example

```
================================================================================
INTEL SCRAPING PRO ORCHESTRATOR
================================================================================
Categories: business, immigration, lifestyle, property, safety, tax_legal, ai_tech
Quality threshold: 80%
Max retries: 3

================================================================================
PARALLEL SCRAPING - 7 CATEGORIES SIMULTANEOUS
================================================================================
[business] Attempt 1/3
[immigration] Attempt 1/3
[ai_tech] Attempt 1/3
...

================================================================================
SCRAPING RESULTS
================================================================================
business        [██████████] 100.0% (12/12)
immigration     [██████████] 100.0% (15/15)
lifestyle       [████████░░]  80.0% (8/10)
property        [██████████] 100.0% (11/11)
safety          [██████████] 100.0% (9/9)
tax_legal       [██████████] 100.0% (13/13)
ai_tech         [█████████░]  90.9% (20/22)

================================================================================
QUALITY VALIDATION
================================================================================
✅ business        Quality: 100% (12/12 files)
✅ immigration     Quality: 93% (14/15 files)
✅ lifestyle       Quality: 88% (7/8 files)
✅ property        Quality: 100% (11/11 files)
✅ safety          Quality: 100% (9/9 files)
✅ tax_legal       Quality: 92% (12/13 files)
✅ ai_tech         Quality: 85% (17/20 files)

================================================================================
PARALLEL PROCESSING (STAGE 2)
================================================================================
✅ Processing complete

================================================================================
AUTO COMMIT & DEPLOY
================================================================================
✅ Committed and deployed to Railway

================================================================================
PIPELINE COMPLETE
================================================================================
Duration: 287.3s (4.8 minutes)
Categories processed: 7/7
Quality validation: ✅ Passed
Deployment: ✅ Success
================================================================================
```

## Comparison: automation.py vs orchestrator_pro.py

| Feature | automation.py | orchestrator_pro.py |
|---------|---------------|---------------------|
| Parallel scraping | ❌ Sequential | ✅ All categories simultaneous |
| Retry logic | ❌ None | ✅ 3x with exponential backoff |
| Quality validation | ❌ None | ✅ Threshold-based |
| Progress tracking | ❌ Logs only | ✅ Real-time bars |
| Auto deploy | ❌ Manual | ✅ Automatic if quality OK |
| Error resilience | ⚠️ Stops on first error | ✅ Retries and continues |

## When to Use

**Use `orchestrator_pro.py` when:**
- Running daily/scheduled updates
- Need reliability (retry on failures)
- Want quality assurance before deploy
- Need parallel speed (7x faster)
- Want zero-intervention automation

**Use `automation.py` when:**
- Testing single categories
- Debugging issues
- Need manual control over each stage
- Running quick experiments

## Scheduling with Cron

```bash
# Daily at 6 PM
0 18 * * * cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY && python3 website/INTEL_SCRAPING/src/orchestrator_pro.py

# Twice daily (6 AM & 6 PM)
0 6,18 * * * cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY && python3 website/INTEL_SCRAPING/src/orchestrator_pro.py
```

## Exit Codes

- `0` - Success (all passed, deployed)
- `1` - Failure (scraping failed or quality below threshold)
