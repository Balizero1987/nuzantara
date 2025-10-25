# Intel Scraping System - Bali Zero Intelligence

Sistema completo di intelligence gathering, processing AI, e pubblicazione magazine per il team Bali Zero.

---

## 📁 Struttura Directory

```
INTEL_SCRAPING/
├── raw/                          # Raw scraped content (Stage 1)
│   ├── immigration/*.md
│   ├── business/*.md
│   ├── tax_legal/*.md
│   ├── property/*.md
│   └── ...
│
├── output/                       # Processed output (Stage 2)
│   └── articles/                 # Consolidated reports per category
│       ├── immigration_20251024.md
│       ├── business_20251024.md
│       └── ...
│
├── scripts/                      # Processing scripts
│   ├── crawl4ai_scraper.py      # Stage 1: Web scraping
│   ├── stage2_parallel_processor.py  # Stage 2: AI processing
│   └── run_intel_automation.py  # Orchestrator
│
├── config/                       # Configuration files
│   └── sites/
│       └── SITI_*.txt           # Source URLs per category
│
├── data/                         # Databases
│   └── chroma/                  # ChromaDB for RAG (Stage 2A)
│
├── MANUAL_CURATION_WORKFLOW.md  # Magazine curation guide
└── README.md                     # This file
```

---

## 🚀 Quick Start

### 1. Run Complete Pipeline

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/INTEL_SCRAPING

# Stage 1: Scrape all sources
python3 scripts/crawl4ai_scraper.py --categories all

# Stage 2B: Generate consolidated articles (Journal disabled by default)
python3 scripts/stage2_parallel_processor.py raw/
```

### 2. Run Specific Category

```bash
# Scrape only immigration
python3 scripts/crawl4ai_scraper.py --categories immigration

# Process immigration raw files
python3 scripts/stage2_parallel_processor.py raw/immigration/
```

### 3. Enable Journal Generation (Optional)

```bash
# Run with magazine journal enabled (for testing)
python3 scripts/stage2_parallel_processor.py raw/ --enable-journal
```

---

## 📊 Pipeline Stages

### **Stage 1: Web Scraping** 🕷️

**Script**: `scripts/crawl4ai_scraper.py`

**What it does**:
- Scrapes configured sources from `config/sites/SITI_*.txt`
- Extracts content, publication dates, metadata
- Applies quality filters (min word count, date validation)
- Saves raw markdown files by category

**Output**: `raw/{category}/*.md`

**Performance**:
- ~8 seconds per source
- Playwright-based (JavaScript support)
- Automatic date extraction from HTML metadata

---

### **Stage 2A: RAG Processing** (Optional)

**What it does**:
- Extracts structured information from raw content
- Stores embeddings in ChromaDB for semantic search
- Quality scoring and filtering

**Output**: `data/chroma/` (vector database)

**Status**: Currently filtered (optional feature)

---

### **Stage 2B: Consolidated Article Generation** ✍️

**Script**: `scripts/stage2_parallel_processor.py`

**What it does**:
- Processes ALL raw files for a category
- Generates ONE consolidated markdown file per category
- Each article includes metadata (original date, source, scraping timestamp)
- Creates table of contents with anchor links

**Output Format**:
```markdown
# Intel Report - [CATEGORY]
**Generated**: 2025-10-24
**Total Articles**: 5
**Sources**: Source1, Source2, Source3

## TABLE OF CONTENTS
1. [Article 1](#article-1)
2. [Article 2](#article-2)
...

## Article 1: [Title] {#article-1}
**Original Publication**: 2025-10-20
**Source**: [URL]
**Scraped**: 2025-10-24T10:05:37

[Full article content...]
```

**Performance**:
- ~2-3 minutes per article (Llama 3.1 8B local)
- 800-1,100 words per article
- Sequential processing (no timeouts)

---

### **Stage 2C: Bali Zero Journal Magazine** 📰 (Manual)

**Status**: Disabled by default - Manual curation required

**Process**:
1. Read all consolidated reports from `output/articles/`
2. Manually select top 4-5 articles (see `MANUAL_CURATION_WORKFLOW.md`)
3. Generate cover images with ImagineArt
4. Update `/website/components/bali-zero-journal.tsx`

**Why Manual**:
- Quality control
- Editorial oversight
- Strategic content selection
- Premium magazine feel

---

## 🎯 Key Features

### ✅ Consolidated Output
- **ONE file per category** (no more scattered files)
- Table of contents with anchor links
- Metadata for each article (date, source, timestamp)
- No redundancy or repetition

### ✅ Quality Content
- **800-1,100 words** per article (professional depth)
- Structured sections: Executive Summary, Background, Impact Analysis, Action Items
- SEO-optimized for journal posts
- English language (Bali Zero team)

### ✅ Scalable Architecture
- Modular scripts (Stage 1, 2B separate)
- Category-based organization
- ChromaDB ready for RAG expansion
- Ollama local (no API costs) or RunPod cloud

---

## 🔧 Configuration

### AI Backend

**Ollama Local** (Default - Free):
```bash
export AI_BACKEND="ollama"
export OLLAMA_MODEL="llama3.1:8b"
export OLLAMA_BASE_URL="http://localhost:11434"
```

**RunPod Cloud** (Optional):
```bash
export AI_BACKEND="runpod"
export RUNPOD_LLAMA_ENDPOINT="https://..."
export RUNPOD_API_KEY="your-key"
```

### Quality Thresholds

Edit `scripts/stage2_parallel_processor.py`:
```python
MAX_NEWS_AGE_DAYS = 5
MIN_QUALITY_SCORE = 5.0
MIN_WORD_COUNT = 100
```

---

## 📈 Performance Benchmarks

**Immigration Category Test** (2 articles):
- Stage 1 (Scraping): **8 seconds**
- Stage 2B (AI Processing): **485 seconds** (~8 minutes)
- Output: **1 consolidated file** (2,556 total words)

**Expected Full Run** (6 categories, ~30 sources):
- Stage 1: **~4 minutes**
- Stage 2B: **~60 minutes** (sequential processing)
- Output: **6 consolidated files** (~20,000+ words total)

---

## 🎨 Magazine Component

**Location**: `/website/components/bali-zero-journal.tsx`

**Features**:
- McKinsey-style asymmetric grid layout
- Hero article (60% width)
- Featured article (40% width)
- Standard articles (50% width each)
- Premium typography (text-5xl to text-8xl)
- Breathing space design (gap-8, gap-10)
- Maximum 4-5 curated articles

**Integration**:
```tsx
import { BaliZeroJournal } from "@/components/bali-zero-journal"

export default function JournalPage() {
  return <BaliZeroJournal />
}
```

---

## 🔄 Recommended Schedule

**Daily** (Automated):
- Run Stage 1 + 2B for all categories
- Generate consolidated reports

**Weekly** (Manual):
- Review all category reports
- Select top 4-5 articles for magazine
- Generate cover images
- Update magazine component
- Deploy

**Emergency** (Ad-hoc):
- For CRITICAL news: scrape + process + publish within 24h

---

## 📚 Additional Documentation

- **Manual Curation**: See `MANUAL_CURATION_WORKFLOW.md`
- **Source Configuration**: See `config/sites/SITI_*.txt` examples
- **API Documentation**: See script headers in `scripts/`

---

## 🐛 Troubleshooting

### Playwright Browser Not Installed
```bash
playwright install chromium
```

### Ollama Not Running
```bash
ollama serve
ollama pull llama3.1:8b
```

### Category Detection Issues
Raw files must be organized: `raw/{category}/*.md`

### Timeout Errors
- Reduce `max_tokens` in `stage2_parallel_processor.py`
- Use sequential processing (already default)
- Check Ollama is running: `curl http://localhost:11434`

---

## 🎯 Next Steps

1. ✅ Setup SITI configuration files for all categories
2. ✅ Schedule daily scraping (cron or GitHub Actions)
3. ✅ Integrate ChromaDB RAG for semantic search
4. ✅ Build magazine archive page (`/journal/archive`)
5. ✅ Setup email distribution to Bali Zero team

---

**Version**: 2.0
**Last Updated**: 2025-10-24
**Maintainer**: Bali Zero Intelligence Team
