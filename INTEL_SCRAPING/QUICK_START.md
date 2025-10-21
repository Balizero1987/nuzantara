# Quick Start Guide - Intel Scraping

**Get up and running in 5 minutes**

---

## ⚡ Prerequisites

- Python 3.11+
- pip
- Internet connection

---

## 🚀 Installation (One-Time)

```bash
# 1. Navigate to directory
cd INTEL_SCRAPING

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Install Playwright browser (for JS-heavy sites)
python3 -m playwright install chromium
```

**That's it!** You're ready to scrape.

---

## 🎯 Run Your First Scrape

### Test Run (Single Category)

```bash
# Scrape general news (52 sites, ~3-7 min)
CATEGORIES="news" python3 code/crawl4ai_scraper_advanced.py
```

**What happens**:
1. Loads 52 news sites from `sites/SITI_VINO_NEWS.txt`
2. Scrapes each site with Playwright + fallback
3. Applies intelligent filters
4. Saves to `data/INTEL_SCRAPING/news/`

### Check Results

```bash
# View report
cat data/INTEL_SCRAPING/scraping_report_*.json

# Count articles
ls data/INTEL_SCRAPING/news/filtered/*.json | wc -l

# Read first article
cat data/INTEL_SCRAPING/news/raw/*_001.md
```

---

## 📊 Output Structure

After running, you'll find:

```
data/INTEL_SCRAPING/
└── news/
    ├── raw/
    │   ├── 20251022_120000_raw.json        # All scraped articles
    │   ├── 20251022_120000_001.md          # Article 1 (markdown)
    │   ├── 20251022_120000_002.md          # Article 2
    │   └── ...
    ├── filtered/
    │   └── 20251022_120000_filtered.json   # Quality-filtered articles
    └── metrics/
        └── site_metrics_20251022.json      # Per-site performance
```

---

## 🔥 Common Commands

### Single Category
```bash
CATEGORIES="news" python3 code/crawl4ai_scraper_advanced.py
```

### Multiple Categories
```bash
CATEGORIES="news,visa_immigration,tax" python3 code/crawl4ai_scraper_advanced.py
```

### All Categories (259 sites)
```bash
python3 code/crawl4ai_scraper_advanced.py
```

### With Stage 2 (RAG + Content Generation)
```bash
RUN_STAGE2=true CATEGORIES="news" python3 code/crawl4ai_scraper_advanced.py
```

---

## 🛠️ Available Categories

**Use exact names** (case-sensitive):

**Team**: `news`, `visa_immigration`, `tax`, `regulatory_changes`, `business_setup`, `property_law`, `banking_finance`, `employment_law`, `cost_of_living`, `lifestyle`, `events_networking`, `health_safety`, `social_media`, `jobs`, `transport_connectivity`, `competitor_intel`, `macro_policy`

**Zero Personal**: `ai_tech`, `dev_code`, `future_trends`

---

## 📈 What to Expect

### News Category (52 sites):
- **Duration**: 3-7 minutes
- **Articles scraped**: 180-500
- **After filtering**: 50-150
- **Success rate**: 90-95%

### All Categories (259 sites):
- **Duration**: 12-30 minutes
- **Articles scraped**: 1000-2000+
- **After filtering**: 300-800

---

## 🐛 Quick Troubleshooting

### "playwright not found"
```bash
pip install playwright
python3 -m playwright install chromium
```

### "No sites found"
- Check you're in `INTEL_SCRAPING` directory
- Verify `sites/*.txt` files exist

### "0 articles found"
- Normal for some sites (anti-scraping)
- Check `metrics/` for per-site stats
- Try Standard version: `python3 code/crawl4ai_scraper.py`

### Slow performance
- Use fewer categories: `CATEGORIES="news"`
- Standard version is faster (but less content)

---

## 📚 Next Steps

1. ✅ **Done**: First successful run
2. 📖 **Read**: `README_MAIN.md` for full overview
3. 🔧 **Customize**: Edit `code/crawl4ai_scraper_advanced.py` config
4. 📊 **Monitor**: Check `data/INTEL_SCRAPING/metrics/`
5. 🚀 **Automate**: Set up daily cron/GitHub Actions

---

## 🎓 Learn More

- **Full docs**: `README.md`
- **Features**: `docs/ADVANCED_FEATURES.md`
- **Implementation**: `docs/IMPLEMENTATION_SUMMARY.md`

---

**Questions?** See `README_MAIN.md` or contact zero@balizero.com

**Status**: ✅ Ready to use in production
