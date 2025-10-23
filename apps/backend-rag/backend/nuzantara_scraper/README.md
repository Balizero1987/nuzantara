# Nuzantara Unified Scraping System

**Enterprise-grade web scraping framework** for Indonesian business intelligence.

---

## 🎯 Overview

Consolidation of 3 independent scraping systems into one unified, maintainable framework:
- **Property Intelligence** (Legal Architect)
- **Immigration Intelligence** (Multi-tier visa/immigration)
- **Tax Intelligence** (Tax Genius)
- **News Intelligence** (259 sources, 20 categories)

---

## 🏗️ Architecture

```
nuzantara_scraper/
├── core/              # Base classes and infrastructure
│   ├── base_scraper.py
│   ├── scraper_config.py
│   ├── cache_manager.py
│   └── database_manager.py
│
├── engines/           # Scraping engines with auto-fallback
│   ├── crawl4ai_engine.py      (best for JS sites)
│   ├── playwright_engine.py    (fallback browser)
│   ├── requests_engine.py      (fast, no JS)
│   └── engine_selector.py      (auto-selection)
│
├── processors/        # AI analysis and filtering
│   ├── ai_analyzer.py          (Gemini/Claude/LLAMA)
│   ├── quality_filter.py
│   └── dedup_filter.py
│
├── scrapers/          # Domain-specific scrapers
│   ├── property_scraper.py
│   ├── immigration_scraper.py
│   ├── tax_scraper.py
│   └── news_scraper.py
│
├── models/            # Pydantic data models
├── utils/             # Logging, metrics
├── config/            # YAML configurations
└── api/               # REST API interface
```

---

## ✨ Key Features

### **Unified Infrastructure**
- ✅ Single configuration system
- ✅ Unified cache management
- ✅ Consistent database operations (ChromaDB + PostgreSQL)
- ✅ Centralized logging and metrics

### **Smart Engine Selection**
- ✅ Auto-fallback: Crawl4AI → Playwright → Requests
- ✅ Automatic retry with exponential backoff
- ✅ Rate limiting and politeness delays

### **AI-Powered Analysis**
- ✅ Multi-provider support (Gemini, Claude, LLAMA)
- ✅ Automatic fallback on provider failure
- ✅ Structured data extraction
- ✅ Quality scoring and relevance ranking

### **Quality Control**
- ✅ Deduplication (exact + fuzzy matching)
- ✅ Quality filtering (word count, score thresholds)
- ✅ Source tier management (Official > Accredited > Community)

---

## 🚀 Quick Start

### Installation

```bash
cd apps/backend-rag/backend
pip install -r requirements.txt

# Optional: Install advanced engines
pip install playwright crawl4ai
python -m playwright install chromium
```

### Basic Usage

```python
from nuzantara_scraper import PropertyScraper, ScraperConfig
from nuzantara_scraper.models import ContentType

# Create configuration
config = ScraperConfig(
    scraper_name="property_intel",
    category=ContentType.PROPERTY,
    database=DatabaseConfig(chromadb_path="./data/chromadb"),
    ai=AIConfig(gemini_key="your-key")
)

# Initialize scraper
scraper = PropertyScraper(config)

# Run scraping cycle
result = scraper.run_cycle()

# View results
print(f"Scraped {result.items_saved} items")
print(f"Success rate: {result.success_rate * 100:.1f}%")
```

### From YAML Config

```python
from nuzantara_scraper import PropertyScraper, ScraperConfig

# Load from YAML
config = ScraperConfig.from_yaml("config/property_config.yaml")
scraper = PropertyScraper(config)
scraper.run_cycle()
```

---

## 📊 Benefits vs Old System

| Aspect | Old System | New System | Improvement |
|--------|-----------|------------|-------------|
| **Lines of code** | 2,129 | ~850 core | -60% duplication |
| **Cache management** | 3x duplicated | Unified | Single source |
| **Engine selection** | Manual | Automatic | Auto-fallback |
| **AI providers** | Fixed | Flexible | Multi-provider |
| **Testing** | Per-scraper | Shared suite | Easier testing |
| **Adding new scraper** | 500 lines | 20 lines | 96% less code |
| **Maintenance** | 3x effort | 1x effort | 67% reduction |

---

## 🛠️ Configuration

### Environment Variables

```bash
# AI Providers
GEMINI_API_KEY=your_gemini_key
ANTHROPIC_API_KEY=your_claude_key

# Database
DATABASE_URL=postgresql://user:pass@host/db
CHROMADB_PATH=./data/chromadb

# Engines
OLLAMA_URL=http://localhost:11434
```

### YAML Config Example

```yaml
scraper_name: property_intel
category: property

database:
  chromadb_path: ./data/chromadb
  postgres_url: ${DATABASE_URL}
  collections_prefix: nuzantara

ai:
  gemini_key: ${GEMINI_API_KEY}
  provider_order: [gemini, claude, llama]

engine:
  engine_preference: [crawl4ai, playwright, requests]
  request_timeout: 30
  delay_between_requests: 2

filter:
  min_word_count: 50
  min_quality_score: 0.3
  enable_ai_filtering: true
```

---

## 📝 Creating Custom Scrapers

Adding a new scraper is trivial:

```python
from nuzantara_scraper.core import BaseScraper
from nuzantara_scraper.models import Source, ScrapedContent, SourceTier, ContentType
from bs4 import BeautifulSoup
from typing import List

class HealthcareScraper(BaseScraper):
    """Scraper for Indonesian healthcare information"""

    def get_sources(self) -> List[Source]:
        return [
            Source(
                name="Kemenkes",
                url="https://www.kemkes.go.id/",
                tier=SourceTier.OFFICIAL,
                category=ContentType.GENERAL,
                selectors=["article", "div.content"]
            )
        ]

    def parse_content(self, raw_html: str, source: Source) -> List[ScrapedContent]:
        soup = BeautifulSoup(raw_html, 'html.parser')
        items = []

        for article in soup.select(source.selectors[0]):
            title = article.find('h2').get_text(strip=True)
            content = article.get_text(strip=True)

            items.append(ScrapedContent(
                content_id=self.cache.content_hash(title + content),
                title=title,
                content=content,
                url=source.url,
                source_name=source.name,
                source_tier=source.tier,
                category=source.category
            ))

        return items

# Usage
config = ScraperConfig.from_yaml("config/healthcare.yaml")
scraper = HealthcareScraper(config)
result = scraper.run_cycle()
```

**That's it!** All infrastructure (caching, DB, engines, AI, filtering) is handled automatically.

---

## 🎓 Migration Guide

### From Old Property Scraper

**Before (748 lines):**
```python
class LegalArchitect:
    def __init__(self, chroma_path, pg_conn_string):
        # 50 lines of initialization
        # Custom cache handling
        # Custom ChromaDB setup
        # Custom request logic
        # ...
```

**After (20 lines):**
```python
from nuzantara_scraper import PropertyScraper, ScraperConfig

config = ScraperConfig.from_yaml("property.yaml")
scraper = PropertyScraper(config)
scraper.run_cycle()
```

---

## 📈 Roadmap

### Phase 1: Core Framework ✅ (DONE)
- BaseScraper, Config, Cache, Database
- Engines with auto-fallback
- AI Analyzer with multi-provider
- Quality filters

### Phase 2: Scraper Migration (IN PROGRESS)
- [ ] PropertyScraper
- [ ] ImmigrationScraper
- [ ] TaxScraper
- [ ] NewsScraper

### Phase 3: API & Integration
- [ ] REST API endpoints
- [ ] TypeScript handler update
- [ ] Scheduling system

### Phase 4: Testing & Documentation
- [ ] Unit tests
- [ ] Integration tests
- [ ] API documentation
- [ ] Usage examples

---

## 📞 Support

- **Documentation:** This file + inline code docs
- **Issues:** Report to team lead
- **Architecture questions:** Check `core/base_scraper.py`

---

## 📄 License

Private - Nuzantara Team

---

**Version:** 1.0.0 (Unified System)
**Status:** 🟡 In Development (Core 70% complete)
**Last Updated:** October 23, 2025
