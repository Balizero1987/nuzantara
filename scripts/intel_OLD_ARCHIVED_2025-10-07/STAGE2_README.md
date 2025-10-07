# 🕷️ STAGE 2: Web Scraping with Crawl4AI - Documentation

**Created**: 2025-10-07
**Status**: ✅ Ready to Use
**Tool**: Crawl4AI (Open Source, FREE)

---

## 🎯 Overview

Stage 2 implements the **web scraping system** that:
- Reads 161 seed URLs from JSON configs (14 categories)
- Scrapes all sites with Crawl4AI (async, fast)
- Saves clean markdown files ready for LLAMA processing
- Handles errors gracefully with retry logic

---

## 📊 Architecture

```
📁 Sources (JSON configs)
        ↓
   🕷️ Crawl4AI
        ↓
📄 Markdown Files + Metadata
        ↓
   Ready for Stage 3 (LLAMA)
```

---

## 🔧 Component

### **stage2_scraper.py**

Main scraping script with JSON config support.

**Features**:
- ✅ Reads all 14 category JSON configs automatically
- ✅ Extracts URLs from tier structures
- ✅ Concurrent scraping (5 at a time, polite)
- ✅ Markdown output with metadata
- ✅ Error handling & reporting
- ✅ Progress tracking per category
- ✅ Dual pipeline awareness (public/email)

**URL Extraction**:
- Automatically finds all `tier1_*`, `tier2_*`, `tier3_*` sections
- Handles `direct_competitors` (category 06)
- Extracts metadata (name, language, priority, tier)

**Politeness**:
- Semaphore limit: 5 concurrent requests
- Respects site load (no flooding)
- Fresh content (bypass_cache=True)

---

## 📁 Output Structure

```
THE SCRAPING/scraped/
├── 01_immigration/
│   └── raw/
│       ├── 2025-10-07_Direktorat_Jenderal_Imigrasi.md
│       ├── 2025-10-07_Direktorat_Jenderal_Imigrasi.meta.json
│       ├── 2025-10-07_Kemenkumham.md
│       ├── 2025-10-07_Kemenkumham.meta.json
│       └── ... (35 files total)
├── 02_business_bkpm/
│   └── raw/
│       └── ... (17 files)
├── ... (14 categories)
└── 14_future_innovation/
    └── raw/
        └── ... (11 files)
```

---

## 📄 Markdown File Format

```markdown
# New KITAS Regulations Announced

**Source**: https://www.imigrasi.go.id/news/regulations-2025
**Scraped**: 2025-10-07T10:00:00
**Category**: 01_immigration
**Language**: id

---

[Clean markdown content from Crawl4AI]

The Directorate General of Immigration announced...

## Key Changes

1. Online Application Mandatory
2. Biometric Requirements
3. Processing Time Reduced

...
```

---

## 📋 Metadata JSON Format

```json
{
  "url": "https://www.imigrasi.go.id/news/regulations-2025",
  "source_name": "Direktorat Jenderal Imigrasi",
  "title": "New KITAS Regulations Announced",
  "category": "01_immigration",
  "category_name": "Immigration & Visas",
  "language": "id",
  "priority": "critical",
  "tier": "tier1_government",
  "scraped_at": "2025-10-07T10:00:00",
  "word_count": 456,
  "content_hash": "abc123def456...",
  "links": [
    "https://www.imigrasi.go.id/forms",
    "https://www.imigrasi.go.id/contact"
  ],
  "media": [
    "https://www.imigrasi.go.id/images/announcement.jpg"
  ]
}
```

---

## 🚀 Usage

### **Scrape All Categories**

```bash
# Scrape all 161 seed sites (14 categories)
python scripts/intel/stage2_scraper.py

# Expected output:
# ✅ Loaded 14 category configs
# 
# 🚀 Starting Intel Scraping - All 14 Categories
# ============================================================
# 📊 Total sources: 161 across 14 categories
# 📁 Output: /path/to/THE SCRAPING/scraped
# 
# 📥 Scraping: Immigration & Visas (35 sources, public)
#   ✅ Success: 33/35 sources
#     💾 Direktorat_Jenderal_Imigrasi...
#     💾 Kemenkumham...
#     ...
# 
# 📥 Scraping: Business & BKPM (17 sources, public)
#   ✅ Success: 16/17 sources
#     ...
# 
# ...
# 
# ============================================================
# ✅ Scraping complete!
# 📊 Scraped: 153/161 sources (95.0%)
# ⏱️  Duration: 480.3s (3.0s per source)
# 📁 Output: /path/to/THE SCRAPING/scraped
# 
# 📈 By Pipeline:
#   • Immigration & Visas: 33 files (public)
#   • Business & BKPM: 16 files (public)
#   ...
#   • AI & Technology: 12 files (email_only)
#   ...
```

### **Scrape Single Category**

```bash
# Scrape only immigration
python scripts/intel/stage2_scraper.py 01_immigration

# Scrape only AI technology
python scripts/intel/stage2_scraper.py 12_ai_technology
```

---

## ⚙️ Configuration

### **Source Configs**

Located in `THE SCRAPING/sources/`:
- `bali_indonesia/01_immigration.json`
- `bali_indonesia/02_business_bkpm.json`
- ... (11 Bali configs)
- `global_intelligence/12_ai_technology.json`
- ... (3 Global configs)

### **Scraping Settings**

In `stage2_scraper.py`:

```python
# Concurrency limit (polite scraping)
semaphore = asyncio.Semaphore(5)  # Max 5 concurrent

# Crawl4AI options
async with AsyncWebCrawler(
    verbose=False,  # Quiet mode
    headless=True   # No browser window
) as crawler:
    result = await crawler.arun(
        url=url,
        word_count_threshold=10,  # Min words
        remove_overlay_elements=True,  # Clean UI
        bypass_cache=True  # Always fresh
    )
```

---

## 📊 Performance

### **Speed**

- **Per source**: ~3-5 seconds (depends on site)
- **All 161 sources**: ~8-10 minutes (with 5 concurrent)
- **Success rate**: ~95% (some sites may be down/blocked)

### **Resource Usage**

- **RAM**: ~500MB (Crawl4AI + browser instances)
- **CPU**: Moderate (async processing)
- **Network**: ~50-100MB download (depends on content)
- **Storage**: ~2MB per scraped file (markdown + JSON)

### **Output Size**

- **161 sources**: ~320 files (md + json pairs)
- **Total storage**: ~300-500MB

---

## 🐛 Troubleshooting

### **Issue**: "Crawl4AI not installed"
**Solution**:
```bash
pip install 'crawl4ai[all]'
```

### **Issue**: "No URLs found in category"
**Solution**: Check JSON config has tier structures:
```json
{
  "tier1_government": [
    {"url": "...", "name": "..."}
  ]
}
```

### **Issue**: "Failed to scrape" errors
**Causes**:
- Site is down/unreachable
- Site blocks bots
- Network timeout

**Solution**: Script continues with other sites. Check failed URLs manually.

### **Issue**: Browser/Playwright errors
**Solution**:
```bash
# Install Playwright browsers
playwright install
```

---

## 🔄 Integration with Pipeline

### **Feed to Stage 3 (LLAMA)**

```bash
# 1. Scrape (Stage 2)
python scripts/intel/stage2_scraper.py

# 2. Process (Stage 3)
python scripts/intel/stage3_llama_processor.py

# LLAMA reads from: THE SCRAPING/scraped/*/raw/*.md
```

### **Automated Schedule**

In GitHub Actions:
```yaml
- name: Daily Scraping
  run: python scripts/intel/stage2_scraper.py
  schedule:
    - cron: '0 6 * * *'  # 06:00 UTC daily
```

---

## 📈 Monitoring

### **Check Results**

```bash
# Count scraped files
find "THE SCRAPING/scraped" -name "*.md" | wc -l

# Check specific category
ls -lah "THE SCRAPING/scraped/01_immigration/raw/"

# View sample
cat "THE SCRAPING/scraped/01_immigration/raw/2025-10-07_*.md" | head -50
```

### **Success Rate**

```bash
# Count by category
for dir in "THE SCRAPING/scraped"/*/raw; do
    count=$(ls -1 "$dir"/*.md 2>/dev/null | wc -l)
    echo "$(basename $(dirname $dir)): $count files"
done
```

---

## 🔧 Advanced Features

### **Custom User Agent**

```python
async with AsyncWebCrawler(
    headers={'User-Agent': 'ZANTARA-Intel-Bot/1.0'}
) as crawler:
    ...
```

### **Retry Logic**

```python
max_retries = 3
for attempt in range(max_retries):
    try:
        result = await scrape_url(url_info, category_id, category_name)
        if result:
            break
    except Exception as e:
        if attempt == max_retries - 1:
            raise
        await asyncio.sleep(2 ** attempt)  # Exponential backoff
```

### **Rate Limiting**

```python
# Per-domain rate limit
domain_semaphores = {}
domain = urlparse(url).netloc
if domain not in domain_semaphores:
    domain_semaphores[domain] = asyncio.Semaphore(2)

async with domain_semaphores[domain]:
    result = await scrape_url(...)
```

---

## 📋 Source Summary

### **By Category**

| Category | Sources | Type | Pipeline |
|----------|---------|------|----------|
| Immigration | 35 | Government, News, Community | Public |
| Business/BKPM | 17 | Government, Media, Industry | Public |
| Real Estate | 15 | Government, Portals, Blogs | Public |
| Events/Culture | 15 | Government, Media, Events | Public |
| Social Media | 13 | Platforms, Influencers | Public |
| Competitors | 17 | Direct, Regional, Legal | Public |
| General News | 15 | Major, Regional, International | Public |
| Health/Wellness | 14 | Government, Hospitals, Insurance | Public |
| Tax/DJP | 13 | Government, Media, Consultants | Public |
| Jobs | 13 | Government, Portals, Expat | Public |
| Lifestyle | 14 | Government, Media, Community | Public |
| AI/Tech | 13 | Leaders, Media, Research | Email |
| Dev Libraries | 12 | GitHub, Awesome Lists | Email |
| Future/Innovation | 11 | Think Tanks, Visionaries | Email |
| **TOTAL** | **161** | **Mixed** | **11 Public, 3 Email** |

---

## 🎯 Next Steps

After Stage 2:

1. **Verify Output**:
   ```bash
   ls -R "THE SCRAPING/scraped"
   ```

2. **Run Stage 3** (LLAMA Processing):
   ```bash
   python scripts/intel/stage3_llama_processor.py
   ```

3. **Check Quality**:
   - Open sample markdown files
   - Verify content is clean
   - Check metadata accuracy

---

## 🔗 Related

- **Stage 3**: LLAMA Processing (`STAGE3_README.md`)
- **Source Configs**: `THE SCRAPING/sources/README.md`
- **Architecture**: `THE SCRAPING/FINAL_ARCHITECTURE.md`

---

**Status**: ✅ Stage 2 Complete and Ready!
**Next**: Run scraper → Feed to Stage 3 (LLAMA)
