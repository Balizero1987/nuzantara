# Crawl4AI Migration Guide

**Migration from scrape_all_categories.py to crawl4ai_scraper.py**

This guide documents the transition to a more robust scraping system using Crawl4AI + Playwright.

---

## 🎯 Why Migrate?

### Old System (scrape_all_categories.py)
- **Tech**: requests + BeautifulSoup only
- **JS Support**: ❌ None (misses dynamic content)
- **Big Media**: ⚠️ Often returns 0 articles (layout changes)
- **Reliability**: ~50-60% success rate on complex sites

### New System (crawl4ai_scraper.py)
- **Tech**: Crawl4AI → Playwright → requests+BS4 (3-tier fallback)
- **JS Support**: ✅ Full rendering via Playwright
- **Big Media**: ✅ Custom selectors for 7 major outlets
- **Reliability**: ~75% success rate with better data quality

---

## 📊 Test Results Comparison

### Test Run: general_news category (52 sites, 3.6 minutes)

| Metric | Old System* | New System |
|--------|-------------|------------|
| Sites with data | ~25 (48%) | 39 (75%) |
| Articles scraped | ~80 | 165 |
| After filtering | ~25 | 53 |
| JS-heavy sites | 0 articles | Working |
| Playwright warnings | N/A | Fixed (async) |

*Estimated based on previous runs with similar configs

---

## 🔄 Migration Steps

### 1. Install Dependencies

```bash
# Already in requirements.txt (now uncommented)
pip install playwright

# Install browser
python3 -m playwright install chromium

# Optional: Install Crawl4AI if available
pip install crawl4ai
```

### 2. Update Your Workflow

**Old command**:
```bash
python3 scripts/scrape_all_categories.py
```

**New command**:
```bash
python3 scripts/crawl4ai_scraper.py
```

**With category filter** (new feature):
```bash
CATEGORIES="news,visa_immigration" python3 scripts/crawl4ai_scraper.py
```

### 3. Verify Outputs

Outputs remain in the same location:
```
data/INTEL_SCRAPING/
  ├── {category}/
  │   ├── raw/
  │   │   ├── YYYYMMDD_HHMMSS_raw.json
  │   │   └── YYYYMMDD_HHMMSS_001.md
  │   └── filtered/
  │       └── YYYYMMDD_HHMMSS_filtered.json
  └── scraping_report_YYYYMMDD_HHMMSS.json
```

### 4. Update CI/CD (if applicable)

**GitHub Actions**:
```yaml
# Before
- name: Scrape
  run: python3 scripts/scrape_all_categories.py

# After
- name: Install Playwright
  run: python3 -m playwright install chromium

- name: Scrape
  run: python3 scripts/crawl4ai_scraper.py
```

---

## 🆕 New Features

### 1. Category Filtering
```bash
# Old: Always processes all categories
python3 scripts/scrape_all_categories.py

# New: Filter by category
CATEGORIES="news" python3 scripts/crawl4ai_scraper.py
CATEGORIES="news,tax,visa_immigration" python3 scripts/crawl4ai_scraper.py
```

### 2. Custom Selectors for Big Media

Pre-configured selectors for sites that previously returned 0 articles:
- detik.com
- tempo.co
- cnnindonesia.com
- liputan6.com
- thejakartapost.com
- jakartaglobe.id
- idntimes.com

**How it works**:
```python
# Auto-detects domain and uses custom config
CUSTOM_SELECTORS = {
    'detik.com': {
        'container': 'article.list-content__item',
        'title': 'h3.media__title a',
        'link': 'h3.media__title a',
        'date': 'div.media__date span',
    },
    # ... more configs
}
```

### 3. Async Playwright (No Warnings)

**Old Issue**:
```
WARNING: Playwright Sync API inside the asyncio loop
```

**New**: Properly uses `async_playwright` with `await` syntax.

### 4. Three-Tier Fallback

```
1. Crawl4AI (if installed)
   ↓ fails
2. Playwright async (JS rendering)
   ↓ fails
3. Requests + BeautifulSoup (static)
```

---

## 🔧 Configuration Changes

### Environment Variables

**New in crawl4ai_scraper.py**:
```bash
# Filter categories (comma-separated)
CATEGORIES="news,visa_immigration,tax"

# Run Stage 2 after Stage 1
RUN_STAGE2=true

# Skip emails in Stage 2
SKIP_EMAILS=true
```

**Unchanged** (for Stage 2):
```bash
ANTHROPIC_API_KEY=your_key
RAG_BACKEND_URL=https://your-backend.run.app
```

---

## 🐛 Known Issues & Solutions

### Issue 1: Some Big Media Still Return 0 Articles

**Why**: Custom selector may be outdated (sites change layouts)

**Solution**: Update `CUSTOM_SELECTORS` in `crawl4ai_scraper.py`:
```python
CUSTOM_SELECTORS = {
    'yoursite.com': {
        'container': 'article.new-class',  # Update this
        'title': 'h2.new-title',
        # ...
    }
}
```

**How to find selectors**:
1. Open site in browser
2. Inspect element (right-click → Inspect)
3. Find article container, title, link selectors
4. Test with browser console: `document.querySelectorAll('your.selector')`

### Issue 2: Playwright Takes Longer

**Why**: Rendering JS is slower than static requests

**Trade-off**: 
- Old: Fast but misses ~50% of content
- New: ~2x slower but gets ~75% of content

**Mitigation**:
- Use `CATEGORIES` to limit scope
- Adjust `DELAY_MIN/MAX` in code if needed
- Playwright caches browser, reuse across runs

### Issue 3: Memory Usage Higher

**Why**: Playwright + browser instances

**Solution**:
- Process categories in batches (use `CATEGORIES`)
- Increase system RAM if running all 20 categories
- Close unused apps during scraping

---

## 📈 Performance Optimization

### Tips for Faster Runs

1. **Use Category Filtering**:
   ```bash
   CATEGORIES="news" python3 scripts/crawl4ai_scraper.py
   ```

2. **Adjust Delays** (in code):
   ```python
   DELAY_MIN, DELAY_MAX = 1, 3  # Faster (risk: rate limits)
   ```

3. **Skip Problematic Sites**: Edit `sites/SITI_*.txt` and comment out 403/401 sites

4. **Use Crawl4AI**: Install `crawl4ai` for best performance

---

## 🔍 Debugging

### Enable Debug Logging

```python
# In crawl4ai_scraper.py, change:
logging.basicConfig(level=logging.DEBUG, ...)
```

### Check Which Method Was Used

Logs show:
```
INFO: Using custom selector for detik.com: article.list-content__item
WARNING: Playwright render failed: ...
INFO: Requests fallback succeeded
```

### Test Single Site

```python
# Add to bottom of crawl4ai_scraper.py
if __name__ == "__main__":
    test_site = {
        'url': 'https://www.detik.com',
        'name': 'Detik Test',
        'tier': 'T2'
    }
    scraper = Crawl4AIScraper()
    articles = asyncio.run(scraper.scrape_site(test_site, 'test'))
    print(f"Found {len(articles)} articles")
```

---

## 🚀 Rollback Plan (if needed)

If the new system has issues:

1. **Keep old script**:
   ```bash
   # Old script still works
   python3 scripts/scrape_all_categories.py
   ```

2. **Compare outputs**:
   ```bash
   # Run both, compare JSON
   diff data/INTEL_SCRAPING/news/raw/old.json \
        data/INTEL_SCRAPING/news/raw/new.json
   ```

3. **Report issues**: Document which sites fail and error messages

---

## 📝 Checklist for Migration

- [ ] Install Playwright: `python3 -m playwright install chromium`
- [ ] Test single category: `CATEGORIES="news" python3 scripts/crawl4ai_scraper.py`
- [ ] Compare outputs with old system (if available)
- [ ] Check filter efficiency (~30-35% is healthy)
- [ ] Update CI/CD workflows (if applicable)
- [ ] Monitor first full run (all 20 categories)
- [ ] Update custom selectors if needed (for 0-article sites)
- [ ] Document any site-specific issues

---

## 🎓 Learning Resources

1. **Playwright Docs**: https://playwright.dev/python/docs/intro
2. **Crawl4AI**: https://github.com/unclecode/crawl4ai (if available)
3. **CSS Selectors**: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors

---

## 📞 Support

Questions? Issues?

1. Check logs for specific errors
2. Test with `CATEGORIES` to isolate problems
3. Review custom selectors for 0-article sites
4. Contact: zero@balizero.com

---

**Migration Guide Version**: 1.0  
**Date**: October 2025  
**Status**: Tested and Production Ready
