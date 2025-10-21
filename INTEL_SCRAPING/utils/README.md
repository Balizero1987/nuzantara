# Utility Scripts

**Optional helper scripts for development and debugging.**

These scripts are not required for normal operation but can be useful for:
- Debugging individual sites
- Running tests
- Legacy analytics

---

## 📁 Available Utilities

### `diagnose_source.py`
Debug a single site to see what's being scraped.

```bash
python3 utils/diagnose_source.py https://example.com
```

### `analytics_dashboard.py`
Legacy analytics dashboard (use metrics/ output instead).

### `test_*.py`
Unit tests for filter systems.

```bash
python3 utils/test_filter_system.py
python3 utils/test_news_filter.py
python3 utils/test_integration.py
```

---

## 💡 Note

For production use, rely on the main scrapers in `code/`:
- `code/crawl4ai_scraper_advanced.py` - Production scraper
- Metrics are automatically saved to `data/INTEL_SCRAPING/metrics/`

These utils are preserved for reference and occasional debugging only.
