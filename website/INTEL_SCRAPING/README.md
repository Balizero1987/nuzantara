# Intel Scraping System - Bali Zero Intelligence

Automated intelligence gathering, AI processing, and content generation system for the Bali Zero team.

---

## 📁 Directory Structure

```
INTEL_SCRAPING/
├── config/
│   └── sources/              # Source URL configurations
│       ├── ai_tech.txt       # AI & Technology sources
│       ├── business.txt      # Business & Economy sources
│       ├── immigration.txt   # Visa & Immigration sources
│       ├── lifestyle.txt     # Lifestyle & Culture sources
│       ├── property.txt      # Real Estate sources
│       ├── safety.txt        # Safety & Security sources
│       └── tax_legal.txt     # Tax & Legal sources
│
├── data/
│   ├── chromadb/             # Vector database for RAG (Stage 2A)
│   ├── processed/            # AI-generated consolidated articles
│   │   ├── ai_tech_YYYYMMDD.md
│   │   ├── business_YYYYMMDD.md
│   │   └── ...
│   └── raw/                  # Scraped content by category
│       ├── ai_tech/*.md
│       ├── business/*.md
│       ├── immigration/*.md
│       └── ...
│
├── docs/                     # Documentation
│   ├── MANUAL_CURATION_WORKFLOW.md
│   └── ORCHESTRATOR_PRO.md
│
├── logs/                     # Execution logs
│
├── src/                      # Source code
│   ├── scraper.py           # Stage 1: Web scraping
│   ├── processor.py         # Stage 2: AI processing
│   ├── automation.py        # Standard orchestrator
│   └── orchestrator_pro.py  # PRO orchestrator with retry & quality validation
│
├── .gitignore
└── README.md                 # This file
```

---

## 🎬 Demo

![Intel Scraping Demo](docs/demo.gif)

> **Note**: GIF demo shows PRO orchestrator with parallel scraping, real-time progress bars, and quality validation.
> To record your own demo: `asciinema rec demo.cast && agg demo.cast demo.gif`

---

## 🎯 System Overview

The Intel Scraping System is a **3-stage pipeline** that transforms web content into intelligence reports:

### **Stage 1: Web Scraping** 🕷️
- Scrapes configured sources using Playwright (JavaScript support)
- Extracts content, metadata, publication dates
- Quality filters (min word count, date validation)
- Outputs raw markdown files by category

### **Stage 2A: RAG Processing** 🧠 (Optional)
- Extracts structured information from raw content
- Stores embeddings in ChromaDB for semantic search
- Quality scoring and filtering

### **Stage 2B: Content Generation** ✍️
- Processes all raw files for a category
- Generates consolidated markdown reports
- Includes metadata, table of contents, structured sections
- Uses local Llama (Ollama) or cloud LLMs (RunPod)

---

## 🚀 Three Ways to Run

### **1. Individual Scripts** (Manual Control)

```bash
# Step 1: Scrape specific categories
python3 src/scraper.py --categories business,immigration

# Step 2: Process the scraped content
python3 src/processor.py data/raw/
```

**When to use**: Testing, debugging, manual control over each stage

---

### **2. Standard Orchestrator** (Automated Pipeline)

```bash
# Run complete pipeline for all categories
python3 src/automation.py

# Run specific categories
python3 src/automation.py --categories business,ai_tech,immigration

# Skip stages (e.g., scraping already done)
python3 src/automation.py --skip-stage1
```

**Features**:
- Subprocess orchestration (Stage 1 → Stage 2)
- Stage 2A (RAG) + Stage 2B (Content) run in parallel
- Error handling and stats tracking
- Category filtering
- Skip stages for flexibility

**When to use**: Regular automated updates, scheduled runs, CI/CD integration

---

### **3. PRO Orchestrator** (Enterprise Features)

```bash
# Run PRO pipeline with all enhancements
python3 src/orchestrator_pro.py

# Custom quality threshold
python3 src/orchestrator_pro.py --threshold 0.9

# More retries for resilience
python3 src/orchestrator_pro.py --retries 5

# Specific categories
python3 src/orchestrator_pro.py --categories business,ai_tech
```

**PRO Features**:
- ✅ **Parallel scraping** - All 7 categories simultaneously (7x faster)
- ✅ **Retry logic** - 3 automatic retries with exponential backoff
- ✅ **Quality validation** - 80% threshold gate before deployment
- ✅ **Real-time progress** - Visual progress bars per category with emoji icons
- ✅ **Auto commit & deploy** - Automatic git push if quality passes
- ✅ **Error resilience** - Continues on failures, comprehensive error tracking

**Enhanced Features** (v3.1):
- 🎨 **Colored progress bars** - Green (>80%), Yellow (>50%), Red (<50%)
- 📊 **Health monitoring** - Auto-generated HEALTH.md and health.json
- 📧 **HTML email reports** - Beautiful summary emails with statistics
- 📈 **Performance metrics** - CSV logging for trend analysis
- 🔄 **Log rotation** - Automatic log rotation (10MB max, 5 backups)
- 🗑️ **Data retention** - Cleanup script with configurable retention policies
- 🔍 **Duplicate detection** - Hash-based URL tracking to avoid re-scraping
- 📅 **Source freshness** - Track when sources were last scraped
- 🎯 **Source priority** - Primary/secondary/fallback source configuration
- 📁 **Dated structure** - All data organized by date (YYYY-MM-DD)

**When to use**: Production deployments, scheduled daily updates, zero-intervention automation

**Slash Command**: `/intel-pro`

**Documentation**: See `docs/ORCHESTRATOR_PRO.md` for detailed comparison and examples

---

## 🔧 Configuration

### **Source URLs**

Each category has a `.txt` file in `config/sources/` with source URLs:

```txt
# config/sources/business.txt
# Business & Economy News
# Update Frequency: Daily

https://www.ft.com/world/asia-pacific
https://www.economist.com/asia
https://asia.nikkei.com/
https://www.bloomberg.com/asia
```

**Format**: One URL per line, `#` for comments

---

### **AI Backend**

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

---

### **Quality Thresholds**

Edit `src/processor.py` or `src/orchestrator_pro.py`:

```python
# Scraper quality
MIN_WORD_COUNT = 100
MAX_NEWS_AGE_DAYS = 5

# Orchestrator PRO quality gate
QUALITY_THRESHOLD = 0.8  # 80% of files must pass validation
```

---

## 📊 Data Flow

```
1. Source URLs (config/sources/*.txt)
   ↓
2. Web Scraping (src/scraper.py)
   ↓
3. Raw Content (data/raw/{category}/*.md)
   ↓
4. RAG Processing (src/processor.py - Stage 2A)
   ↓
5. Vector DB (data/chromadb/)
   ↓
6. Content Generation (src/processor.py - Stage 2B)
   ↓
7. Consolidated Reports (data/processed/{category}_YYYYMMDD.md)
   ↓
8. Manual Curation (see docs/MANUAL_CURATION_WORKFLOW.md)
   ↓
9. Bali Zero Journal (website/components/bali-zero-journal.tsx)
```

---

## 📈 Performance

### **Standard Pipeline** (automation.py)
- **Stage 1** (Scraping): ~4-8 minutes for all categories
- **Stage 2** (Processing): ~60-90 minutes (sequential)
- **Output**: One consolidated file per category

### **PRO Pipeline** (orchestrator_pro.py)
- **Stage 1** (Parallel Scraping): ~4-8 minutes (7 categories simultaneous)
- **Stage 2** (Parallel Processing): ~60-90 minutes
- **Retry logic**: Exponential backoff (1s, 2s, 4s)
- **Quality validation**: ~5 seconds
- **Auto deploy**: ~10-15 seconds

### **Benchmarks** (Immigration category, 2 articles)
- Scraping: **8 seconds**
- AI Processing: **8 minutes** (~240s per article)
- Output: **1 file**, 2,556 words total

---

## 🛠️ Requirements

### **System Dependencies**
```bash
# Python 3.11+
python3 --version

# Playwright for browser automation
pip install playwright
playwright install chromium

# Ollama for local LLM
brew install ollama
ollama serve
ollama pull llama3.1:8b
```

### **Python Packages**
```bash
pip install -r requirements.txt
```

**Key packages**: `playwright`, `crawl4ai`, `chromadb`, `anthropic`, `beautifulsoup4`

---

## 🔄 Recommended Schedule

### **Daily** (Automated - Cron)
```bash
# 6 PM daily - PRO orchestrator
0 18 * * * cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY && python3 website/INTEL_SCRAPING/src/orchestrator_pro.py
```

### **Weekly** (Manual)
1. Review `data/processed/` consolidated reports
2. Select top 4-5 articles for magazine
3. Generate cover images (ImagineArt)
4. Update `website/components/bali-zero-journal.tsx`
5. Deploy

### **Emergency** (Ad-hoc)
For critical breaking news: scrape → process → publish within 24h

---

## 🎨 Integration with Bali Zero Journal

**Component**: `/website/components/bali-zero-journal.tsx`

**Features**:
- McKinsey-style asymmetric grid
- Hero article (60% width), Featured (40%), Standard (50% each)
- Premium typography (text-5xl to text-8xl)
- Maximum 4-5 curated articles

**Manual Curation**: See `docs/MANUAL_CURATION_WORKFLOW.md`

---

## 🐛 Troubleshooting

### **Playwright Browser Not Installed**
```bash
playwright install chromium
```

### **Ollama Not Running**
```bash
# Start Ollama service
ollama serve

# Pull model
ollama pull llama3.1:8b

# Test
curl http://localhost:11434/api/generate -d '{"model":"llama3.1:8b","prompt":"Hello","stream":false}'
```

### **Quality Validation Failing**
- Check `data/raw/{category}/*.md` files have:
  - Title starting with `#`
  - URL metadata
  - Minimum 500 characters
- Lower threshold: `--threshold 0.6` (60%)

### **Scraping Timeouts**
- Increase timeout in `src/scraper.py`
- Check source URLs are accessible
- Verify Playwright is installed

### **Processing Errors**
- Check Ollama is running: `curl http://localhost:11434`
- Verify AI backend environment variables
- Check logs in `logs/` directory

---

## 📚 Documentation

- **PRO Orchestrator**: `docs/ORCHESTRATOR_PRO.md` - Detailed feature comparison and usage
- **Manual Curation**: `docs/MANUAL_CURATION_WORKFLOW.md` - Magazine publishing guide
- **Source Configuration**: `config/sources/*.txt` - URL lists by category
- **Slash Commands**: `.claude/commands/intel-pro.md` - Claude Code integration

---

## 🎯 Categories

1. **AI & Technology** (`ai_tech`) - Latest AI news, LLM updates, tech breakthroughs
2. **Business & Economy** (`business`) - Financial news, market trends, startups
3. **Visa & Immigration** (`immigration`) - Visa types, requirements, regulations
4. **Lifestyle & Culture** (`lifestyle`) - Expat life, culture, travel, dining
5. **Real Estate** (`property`) - Property market, rentals, buying guides
6. **Safety & Security** (`safety`) - Travel advisories, health, crime, emergencies
7. **Tax & Legal** (`tax_legal`) - Tax compliance, legal requirements, regulations

---

## 🔐 Git Integration

**Auto Commit** (PRO Orchestrator only):
- Automatically commits `data/processed/` if quality passes
- Message format:
  ```
  Intel Scraping: Auto-update 2025-10-25 18:00

  Categories: business, immigration, ai_tech
  Articles: 15

  🤖 Generated with Claude Code
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

**Auto Push**: Deploys to Railway after successful commit

**Manual Git**:
```bash
git add website/INTEL_SCRAPING/data/processed/
git commit -m "Intel update: business and immigration reports"
git push
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     INTEL SCRAPING SYSTEM                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Mode 1:    │    │   Mode 2:    │    │   Mode 3:    │
│  Individual  │    │   Standard   │    │     PRO      │
│   Scripts    │    │ Orchestrator │    │ Orchestrator │
└──────────────┘    └──────────────┘    └──────────────┘
      │                    │                    │
      │                    │                    │
      ↓                    ↓                    ↓
┌─────────────────────────────────────────────────────────┐
│              STAGE 1: WEB SCRAPING                       │
│  • Playwright browser automation                        │
│  • JavaScript rendering support                         │
│  • Quality filters (word count, date)                   │
│  • Output: data/raw/{category}/*.md                     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│         STAGE 2A: RAG PROCESSING (Optional)             │
│  • Semantic extraction                                  │
│  • ChromaDB embeddings                                  │
│  • Quality scoring                                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│         STAGE 2B: CONTENT GENERATION                    │
│  • Llama 3.1 8B (Ollama local or RunPod cloud)         │
│  • Consolidated reports (one per category)             │
│  • Structured sections, metadata, TOC                  │
│  • Output: data/processed/{category}_YYYYMMDD.md       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│            MANUAL CURATION & PUBLISHING                 │
│  • Review consolidated reports                          │
│  • Select top 4-5 articles                              │
│  • Generate cover images                                │
│  • Update Bali Zero Journal component                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🚦 Exit Codes

**Standard Orchestrator** (`automation.py`):
- `0` - Success (all stages completed)
- `1` - Failure (any stage failed)

**PRO Orchestrator** (`orchestrator_pro.py`):
- `0` - Success (quality passed, deployed)
- `1` - Failure (scraping failed OR quality below threshold)

---

## 📝 Version History

**Version 3.1** (2025-10-25)
- **Sprint 1: Quick Wins (6 improvements)**
  - Emoji icons for categories (💼 🛂 🤖 🏠 🌴 🛡️ ⚖️)
  - Health check file generator (HEALTH.md + health.json)
  - Slash command `/intel-status` for quick status checks
  - Config validation on startup
  - Performance metrics CSV auto-logging
  - Colored progress bars (green/yellow/red)
- **Sprint 2: Fundamentals (5 improvements)**
  - Data migration to dated structure (YYYY-MM-DD)
  - Log rotation (10MB max, 5 backups)
  - Duplicate detection (hash-based URL tracking)
  - Source freshness tracking
  - Cleanup script with retention policy (30/60/90 days)
- **Sprint 3: Professional (4 improvements)**
  - Source priority/fallback configuration system
  - HTML email report generator
  - README with demo section
  - Smart category tagging (keyword-based auto-detection)

**Version 3.0** (2025-10-25)
- Reorganized directory structure (src/, docs/, config/sources/)
- Added PRO orchestrator with retry logic and quality validation
- Parallel scraping for all categories
- Auto commit and deploy functionality
- Real-time progress tracking

**Version 2.0** (2025-10-24)
- Consolidated output (one file per category)
- Standard orchestrator with parallel Stage 2 processing
- ChromaDB integration for RAG
- Magazine component integration

**Version 1.0** (2025-10-20)
- Initial web scraping pipeline
- Basic AI processing
- Manual workflow

---

## 🤖 Claude Code Integration

**Slash Commands**:
- `/intel-pro` - Run PRO orchestrator with all enhancements

**Hooks**: Auto-commit on successful runs (PRO mode only)

**MCP Integration**: Browser automation via Puppeteer MCP server

---

## 👥 Maintainers

**Bali Zero Intelligence Team**
- Project: Nuzantara (Bali relocation intelligence platform)
- Contact: zero@balizero.com

---

**Last Updated**: 2025-10-25
**Version**: 3.1
