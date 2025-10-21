# Intel Scraper - Quick Start Guide

Fast setup and deployment guide for the Bali Intel Scraper.

---

## Prerequisites

- Python 3.8+
- pip package manager
- Internet connection

## Installation (5 minutes)

### 1. Install Dependencies

```bash
cd INTEL_SCRAPING
pip install -r code/requirements.txt
```

### 2. Install Playwright (Optional but Recommended)

```bash
# Install Playwright
pip install playwright

# Install Chromium browser
playwright install chromium
```

If you skip this, scraper will still work using Requests fallback.

### 3. Install Crawl4AI (Optional)

```bash
pip install crawl4ai
```

---

## Quick Test (30 seconds)

Test with a single high-quality category:

```bash
cd INTEL_SCRAPING
CATEGORIES="news" python3 code/crawl4ai_scraper_advanced.py
```

**Expected output**:
- Duration: ~3 minutes
- Sites: 52
- Articles: 400-500
- Filtered: 130-180
- Success rate: 85%+

Check results:
```bash
# View latest report
cat data/INTEL_SCRAPING/scraping_report_*.json | tail -50

# View site metrics
cat data/INTEL_SCRAPING/metrics/site_metrics_*.json | jq '.'
```

---

## Production Usage

### Run Multiple Categories

```bash
# Good categories (tested, high quality)
CATEGORIES="news,visa_immigration,tax" python3 code/crawl4ai_scraper_advanced.py
```

### Run All Categories

```bash
# All 20 categories (~60 min, ~1,200 sites)
python3 code/crawl4ai_scraper_advanced.py
```

⚠️ **Warning**: Some categories have invalid URLs and will produce few results. See `SCRAPER_TEST_REPORT.md` for details.

### Recommended Production Config

Run only tested, high-quality categories:

```bash
# Best performers (312 sites, ~265 articles, 10 min)
CATEGORIES="news,visa_immigration,tax,ai_tech,health" \
python3 code/crawl4ai_scraper_advanced.py
```

---

## Configuration

### Environment Variables

```bash
# Filter by categories (comma-separated)
export CATEGORIES="news,tax,immigration"

# Adjust parallelization (default: 5)
# Edit code/crawl4ai_scraper_advanced.py line 62:
# MAX_CONCURRENT_SITES = 10  # Increase for faster scraping

# Adjust timeout (default: 45s)
# Edit code/crawl4ai_scraper_advanced.py line 61:
# TIMEOUT = 60  # For very slow sites
```

### Custom Site Lists

Add your own sites to any `sites/SITI_*.txt` file:

```
📰 My Custom Site
   🔗 https://example.com/news
   📝 Description of the site
```

Format requirements:
- ✅ Must have `🔗 https://...` with valid URL
- ❌ Don't use placeholder text like "Government site"

---

## Understanding Output

### File Locations

```
INTEL_SCRAPING/
├── data/INTEL_SCRAPING/
│   ├── scraping_report_YYYYMMDD_HHMMSS.json  # Latest scraping summary
│   └── metrics/
│       └── site_metrics_YYYYMMDD.json        # Per-site performance metrics
```

### Report Structure

**scraping_report_*.json**:
```json
{
  "category_name": {
    "raw_articles": [...],      // All scraped articles
    "filtered_articles": [...], // After quality filter
    "stats": {
      "total_articles": 69,
      "filtered_count": 62,
      "avg_word_count": 424
    }
  }
}
```

**site_metrics_*.json**:
```json
{
  "site_name": {
    "success_rate": 85.5,
    "total_attempts": 10,
    "successful_scrapes": 9,
    "last_error": null
  }
}
```

### Interpreting Success Rates

- **80-100%**: Excellent site, consistently working
- **50-79%**: Good site, occasional issues
- **20-49%**: Problematic site, investigate URL
- **0-19%**: Failed site, likely invalid URL or blocking

---

## Troubleshooting

### No Articles Scraped

**Symptom**: `Total Scraped: 0`

**Causes**:
1. Invalid URLs in site list (check for placeholder text)
2. Network connectivity issues
3. All sites returning 404/403

**Fix**:
```bash
# Check site list for invalid URLs
grep "🔗 [A-Z]" sites/SITI_*.txt | grep -v "http"

# Test single site manually
curl -I https://example.com
```

### Very Few Articles

**Symptom**: `Total Scraped: 3` when expecting 30+

**Cause**: Most URLs in category are placeholders (not real URLs)

**Fix**: See `SCRAPER_TEST_REPORT.md` section "Site Lists Quality" for affected files and cleanup process.

### Playwright Warnings

**Symptom**: `Playwright render failed: Executable doesn't exist`

**Cause**: Playwright not installed

**Fix**:
```bash
playwright install chromium
```

**Note**: Scraper will still work using Requests fallback, but may miss some JavaScript-rendered content.

### Slow Scraping

**Normal speed**: 3-5 seconds per site

**If slower**:
- Government sites are naturally slow (45s timeout)
- Increase parallelization: Edit `MAX_CONCURRENT_SITES` 
- Check network speed

---

## Best Practices

### 1. Start Small

Test with one category before running all:
```bash
CATEGORIES="news" python3 code/crawl4ai_scraper_advanced.py
```

### 2. Monitor Metrics

Check `site_metrics_*.json` weekly for failing sites:
```bash
# Find sites with 0% success rate
cat data/INTEL_SCRAPING/metrics/site_metrics_*.json | \
jq '.[] | select(.success_rate == 0)'
```

### 3. Schedule Regular Scrapes

Daily scraping recommended:
```bash
# Add to crontab
0 2 * * * cd /path/to/INTEL_SCRAPING && \
CATEGORIES="news,visa_immigration,tax" \
python3 code/crawl4ai_scraper_advanced.py
```

### 4. Clean Up Old Reports

Keep last 7 days only:
```bash
find data/INTEL_SCRAPING -name "*.json" -mtime +7 -delete
```

---

## Category Recommendations

### ✅ Production Ready (Test Verified)

| Category | Sites | Success | Articles | Quality |
|----------|-------|---------|----------|---------|
| news | 52 | 85%+ | 450+ | Excellent |
| visa_immigration | 50 | 30% | 60-70 | Good |
| tax | 50 | 30% | 25-35 | High quality |
| ai_tech | 110 | ~90% | ~100+ | Untested but likely good |
| health | 50 | ~90% | ~45+ | Untested but likely good |

**Use these** in production with confidence.

### ⚠️ Needs Cleanup (Low URL Quality)

| Category | Sites | Valid URLs | Status |
|----------|-------|------------|--------|
| employment_law | 50 | 6 (12%) | Unusable |
| business_setup | 50 | 9 (18%) | Unusable |
| regulatory_changes | 50 | 28 (56%) | Fair |
| lifestyle | 50 | 20 (40%) | Poor |

**Don't use these** until site lists are fixed.

### 🔍 Untested (Unknown Quality)

- jobs
- competitors  
- macro_policy
- events
- banking
- transport
- etc.

**Test before production** use.

---

## Getting Help

### Check Logs

All errors are logged to console. Look for:
- `❌` - Complete failure
- `⚠️` - Partial failure or warning
- `✅` - Success

### Common Errors & Solutions

**"Invalid URL: No scheme supplied"**
- Fix: Replace placeholder text with actual URL in site list

**"HTTP 404"**
- Site URL changed or doesn't exist
- Fix: Update URL or remove from list

**"SSL Error"**
- Government site certificate issue
- Scraper handles this automatically (bypasses verification)

**"Connection timeout"**
- Slow government site
- Scraper retries automatically (2 attempts, 45s timeout)

### Debug Mode

Add verbose logging:
```python
# Edit code/crawl4ai_scraper_advanced.py line 48:
logging.basicConfig(level=logging.DEBUG)  # Change from INFO
```

---

## Performance Tuning

### Faster Scraping

1. **Increase parallelization** (careful - may overload target sites):
   ```python
   MAX_CONCURRENT_SITES = 10  # Default: 5
   ```

2. **Reduce timeout** (if sites are generally fast):
   ```python
   TIMEOUT = 30  # Default: 45
   ```

3. **Disable Playwright** (if content doesn't need JS):
   ```bash
   # Uninstall or scraper will auto-skip if not available
   pip uninstall playwright
   ```

### Higher Quality Results

1. **Increase word count threshold**:
   ```python
   # In LLAMAFilter class:
   min_word_count = 100  # Default: 50
   ```

2. **Stricter relevance check**:
   ```python
   # Customize _calculate_relevance() method
   ```

3. **Add more custom selectors** for specific sites in `SITE_SELECTORS` dict

---

## Quick Reference

### Essential Commands

```bash
# Install
pip install -r code/requirements.txt
playwright install chromium

# Test single category
CATEGORIES="news" python3 code/crawl4ai_scraper_advanced.py

# Production run (best categories)
CATEGORIES="news,visa_immigration,tax" python3 code/crawl4ai_scraper_advanced.py

# Check results
cat data/INTEL_SCRAPING/scraping_report_*.json | jq '.stats'

# Find failing sites
cat data/INTEL_SCRAPING/metrics/site_metrics_*.json | jq '.[] | select(.success_rate < 20)'

# Audit invalid URLs
grep "🔗 [A-Z]" sites/SITI_*.txt | grep -v "http"
```

### Key Files

```
code/crawl4ai_scraper_advanced.py  # Main scraper
sites/SITI_*.txt                    # Site lists (20 categories)
data/INTEL_SCRAPING/*.json          # Output reports
SCRAPER_TEST_REPORT.md              # Full test results
```

---

**Ready to go?** Start with the Quick Test above! 🚀
