# 🚀 INTEL SCRAPING - CLI COMMANDS

Complete manual commands for running the Intel Scraping system.

---

## 🎯 QUICK START (Full Pipeline)

```bash
# Complete pipeline: Scrape → Process → Store
python3 scripts/run_intel_automation.py
```

This runs:
- **Stage 1**: Web scraping (Playwright)
- **Stage 2**: AI processing with ZANTARA Llama (parallel RAG + Content)
- **Output**: Raw MD files + ChromaDB JSON + Markdown articles

---

## 📋 ENVIRONMENT VARIABLES REQUIRED

Before running, ensure these are set:

```bash
export RUNPOD_LLAMA_ENDPOINT="https://api.runpod.ai/v2/YOUR_ENDPOINT/runsync"
export RUNPOD_API_KEY="YOUR_RUNPOD_API_KEY"
export ANTHROPIC_API_KEY="YOUR_ANTHROPIC_KEY"  # For fallback
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
```

Add to `.env` file in project root or export in your shell.

---

## 🔧 INDIVIDUAL COMMANDS

### 1. Generate SITI Config Files

Generate `SITI_*.txt` files from `categories_v2.json`:

```bash
python3 scripts/generate_siti_files.py
```

**Output**: `scripts/INTEL_SCRAPING/config/SITI_*.txt` (20 files, 259 sources)

**When to run**: Once initially, or after updating `categories_v2.json`

---

### 2. Stage 1: Web Scraping

Scrape all configured sources:

```bash
python3 scripts/crawl4ai_scraper.py
```

**Options**:
```bash
# Scrape specific categories only
python3 scripts/crawl4ai_scraper.py --categories visa_immigration,tax_compliance

# Example: scrape 3 categories
python3 scripts/crawl4ai_scraper.py --categories regulatory_changes,business_setup,property_law
```

**Output**: `scripts/INTEL_SCRAPING/{category}/raw/*.md`

**Quality filters applied**:
- Min 100 words
- Min 200 characters
- Deduplication (SHA256 hash)
- Content fragmentation check

**Performance**:
- 12 concurrent scrapes per category
- 20 second timeout per page
- Deduplication cache saved to `scripts/scraper_cache.json`

---

### 3. Stage 2: AI Processing (Parallel)

Process raw files with ZANTARA Llama:

```bash
# Test stage 2 on specific directory
python3 scripts/stage2_parallel_processor.py scripts/INTEL_SCRAPING/visa_immigration/raw/
```

**What it does**:
- **Stage 2A** (RAG): Extract structured data → ChromaDB JSON
- **Stage 2B** (Content): Generate markdown articles → Email-ready

**Quality filters**:
- Max 5 days old (news freshness)
- Min quality score 5.0/10
- Min 100 words
- Tier validation (T1/T2/T3)

**Output**:
- `scripts/INTEL_SCRAPING/{category}/rag/*.json`
- `scripts/INTEL_SCRAPING/markdown_articles/*.md`

**AI Model**: ZANTARA Llama 3.1 via RunPod vLLM

---

### 4. Complete Pipeline

Run full automation:

```bash
# All categories
python3 scripts/run_intel_automation.py

# Specific categories
python3 scripts/run_intel_automation.py --categories visa_immigration,tax_compliance

# Skip stages
python3 scripts/run_intel_automation.py --skip stage1  # Skip scraping, only process
python3 scripts/run_intel_automation.py --skip stage2  # Skip processing, only scrape
```

**Stages**:
- **Stage 1**: Web scraping (crawl4ai_scraper.py)
- **Stage 2**: AI processing (stage2_parallel_processor.py)
- **Stage 3**: Editorial review (⏸️ standby, manual)
- **Stage 4**: Publishing (⏸️ standby, multi-channel)

**Duration**:
- Stage 1: 10-30 min (depends on sources)
- Stage 2: 5-15 min (depends on files)
- **Total**: ~15-45 minutes

---

## 🎛️ ADVANCED OPTIONS

### Filter by Priority

```bash
# Only CRITICAL categories
python3 scripts/run_intel_automation.py --categories regulatory_changes,visa_immigration,tax_compliance

# Only HIGH priority
python3 scripts/run_intel_automation.py --categories business_setup,property_law

# Zero's personal categories (internal-only)
python3 scripts/run_intel_automation.py --categories ai_tech_global,dev_code_library,future_trends
```

### Test Single Category

```bash
# Test pipeline with 1 category
python3 scripts/run_intel_automation.py --categories visa_immigration
```

### Skip Slow Stages

```bash
# Only scrape (skip AI processing)
python3 scripts/run_intel_automation.py --skip stage2

# Only process (use existing raw files)
python3 scripts/run_intel_automation.py --skip stage1
```

---

## 📊 QUALITY FILTERS

### Scraping Filters (Stage 1)

| Filter | Threshold | Rejects |
|--------|-----------|---------|
| **Word count** | Min 100 | Too short articles |
| **Character count** | Min 200 | Empty/nav-only pages |
| **Fragmentation** | < 10% newlines | Menu/navigation content |
| **Deduplication** | SHA256 hash | Already scraped content |

### AI Processing Filters (Stage 2)

| Filter | Threshold | Rejects |
|--------|-----------|---------|
| **News age** | Max 5 days | Old articles |
| **Quality score** | Min 5.0/10 | Low-quality content |
| **Word count** | Min 100 | Too short |
| **Tier validation** | T1/T2/T3 | Invalid tier |
| **Date required** | For CRITICAL | Undated critical news |

### Quality Score Calculation

```
Base score: 5.0
+ Tier bonus: T1=2.0, T2=1.4, T3=0.8
+ Word count: 300+=2.0, 150+=1.0
+ Has date: +0.5
+ Impact level: critical=+1.5, high=+1.0
+ Has source URL: +0.5
= Total score (max 10.0)
```

---

## 🗂️ OUTPUT STRUCTURE

```
scripts/INTEL_SCRAPING/
├── config/
│   ├── SITI_visa_immigration.txt      # 25 sources
│   ├── SITI_tax_compliance.txt        # 20 sources
│   └── ... (20 files total)
│
├── visa_immigration/
│   ├── raw/
│   │   └── 20251023_120000_site_001.md    # Stage 1 output
│   └── rag/
│       └── 20251023_120000_site_001.json  # Stage 2A output
│
├── tax_compliance/
│   ├── raw/
│   └── rag/
│
├── markdown_articles/
│   └── 20251023_visa_immigration_article.md  # Stage 2B output
│
└── ... (20 categories)
```

---

## 🔍 MONITORING

### Check Logs

```bash
# View scraping log
cat intel_automation.log

# View last 50 lines
tail -50 intel_automation.log

# Follow live
tail -f intel_automation.log
```

### Check Cache

```bash
# Deduplication cache
cat scripts/scraper_cache.json | jq '.seen_hashes | length'

# Run statistics
cat scripts/intel_run_stats.json | jq '.[].stages'
```

### Check Output

```bash
# Count raw files
find scripts/INTEL_SCRAPING/*/raw/ -name "*.md" | wc -l

# Count processed files
find scripts/INTEL_SCRAPING/*/rag/ -name "*.json" | wc -l

# Count articles
ls scripts/INTEL_SCRAPING/markdown_articles/*.md | wc -l
```

---

## ⚠️ TROUBLESHOOTING

### Issue: No SITI files found

```bash
# Solution: Generate them first
python3 scripts/generate_siti_files.py
```

### Issue: RUNPOD_LLAMA_ENDPOINT not set

```bash
# Solution: Export environment variables
export RUNPOD_LLAMA_ENDPOINT="https://api.runpod.ai/v2/YOUR_ENDPOINT/runsync"
export RUNPOD_API_KEY="YOUR_KEY"
```

### Issue: Playwright not installed

```bash
# Solution: Install Playwright
pip install playwright
playwright install chromium
```

### Issue: Stage 2 import error

```bash
# Solution: Ensure stage2_parallel_processor.py is in scripts/
ls scripts/stage2_parallel_processor.py

# Should exist. If not, check installation.
```

### Issue: Too many filtered results

```bash
# Check quality thresholds in stage2_parallel_processor.py:
# MAX_NEWS_AGE_DAYS = 5
# MIN_QUALITY_SCORE = 5.0
# MIN_WORD_COUNT = 100

# Adjust if needed for your use case
```

---

## 🎯 RECOMMENDED WORKFLOW

### Daily Run (Manual)

```bash
# 1. Generate configs (first time only)
python3 scripts/generate_siti_files.py

# 2. Full pipeline (all categories)
python3 scripts/run_intel_automation.py

# 3. Check results
ls scripts/INTEL_SCRAPING/markdown_articles/
```

### Test Run (New Category)

```bash
# Test single category
python3 scripts/run_intel_automation.py --categories visa_immigration

# Review output
cat scripts/INTEL_SCRAPING/visa_immigration/raw/*.md | head -100
```

### Debug Run (Isolate Stages)

```bash
# Stage 1 only
python3 scripts/crawl4ai_scraper.py --categories visa_immigration

# Check raw files
ls scripts/INTEL_SCRAPING/visa_immigration/raw/

# Stage 2 only
python3 scripts/stage2_parallel_processor.py scripts/INTEL_SCRAPING/visa_immigration/raw/

# Check processed files
ls scripts/INTEL_SCRAPING/visa_immigration/rag/
ls scripts/INTEL_SCRAPING/markdown_articles/
```

---

## 📈 PERFORMANCE METRICS

| Metric | Value | Notes |
|--------|-------|-------|
| **Sources** | 259 total | Across 20 categories |
| **Categories** | 20 | 14 business + 3 social + 3 internal |
| **Concurrent scrapes** | 12 | Per category batch |
| **Scraping speed** | ~20s/page | With 20s timeout |
| **Processing speed** | ~10s/article | ZANTARA Llama |
| **Full pipeline** | 15-45 min | Depends on source count |
| **Quality rejection** | ~20-30% | Typical filter rate |
| **Deduplication** | ~10-15% | Typical duplicate rate |

---

## 🚀 PRODUCTION SETUP

### GitHub Actions (Scheduled)

```yaml
# .github/workflows/intel-scraping.yml
name: Intel Scraping

on:
  schedule:
    - cron: '0 22 * * *'  # 06:00 AM Bali time
  workflow_dispatch:       # Manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          playwright install chromium

      - name: Run scraping
        env:
          RUNPOD_LLAMA_ENDPOINT: ${{ secrets.RUNPOD_LLAMA_ENDPOINT }}
          RUNPOD_API_KEY: ${{ secrets.RUNPOD_API_KEY }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          python3 scripts/run_intel_automation.py

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: intel-results
          path: scripts/INTEL_SCRAPING/markdown_articles/
```

---

## 📚 RELATED DOCUMENTATION

- **Architecture**: `docs/galaxy-map/03-ai-intelligence.md`
- **Categories Config**: `shared/config/core/categories_v2.json`
- **Session Report**: `.claude/CURRENT_SESSION_W4.md`

---

**Last Updated**: 2025-10-23
**Version**: 1.0.0
**Author**: W4 (Claude Code Agent)
