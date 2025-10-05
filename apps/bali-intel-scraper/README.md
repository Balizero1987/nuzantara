# 🔍 Bali Intel Scraper

**Daily intelligence system for Bali expats**

---

## 📋 Overview

Multi-collaborator system for scraping, structuring and ingesting news relevant to expats in Bali.

**8 Topics Monitored**:
1. Immigration & Visas
2. BKPM/KBLI/Business Licensing
3. Tax & Compliance
4. Real Estate
5. Events & Culture
6. Social Media Trends
7. Competitors (visa/legal/tax consultants)
8. General Bali News

**Daily Workflow**: Scraping → AI Structuring → ChromaDB → ZANTARA

---

## 🏗️ Architecture

```
Collaborator (Mac)
    ↓
Python Script (automated scraping)
    ↓
CSV raw (data/raw/)
    ↓
Claude/ChatGPT (structuring)
    ↓
JSON structured (data/structured/)
    ↓
ChromaDB collection "bali_intel"
    ↓
ZANTARA query (intel.news.search)
```

---

## 🚀 Initial Setup

**Read**: `docs/SETUP_GUIDE_MAC.md` (Python + dependencies installation)

**Setup time**: ~10 minutes (one-time only)

---

## 👥 Collaborator Assignment

| Collaborator | Topic | Script | Sources (approx) |
|---------------|------|--------|----------------|
| TBD | Immigration & Visas | `scrape_immigration.py` | 30-40 sites |
| TBD | BKPM/KBLI/Tax | `scrape_bkpm_tax.py` | 30-40 sites |
| TBD | Real Estate | `scrape_realestate.py` | 30-40 sites |
| TBD | Events & Culture | `scrape_events.py` | 30-40 sites |
| TBD | Social Trends | `scrape_social.py` | 30-40 sites |
| TBD | Competitors | `scrape_competitors.py` | 30-40 sites |
| TBD | General Bali News | `scrape_bali_news.py` | 30-40 sites |
| TBD | Weekend Roundup | `scrape_roundup.py` | Top 30 sites |

---

## 📅 Daily Workflow

**Every morning (9:00-12:00)**:

### **Step 1: Scraping (9:00, 5 min)**
```bash
cd ~/Desktop/NUZANTARA-2/apps/bali-intel-scraper
python3 scripts/scrape_immigration.py
```

**Output**: `data/raw/immigration_raw_20250110.csv`

---

### **Step 2: Structuring (9:30, 30 min)**

1. Open Claude.ai or ChatGPT
2. Upload CSV from `data/raw/`
3. Copy prompt from `templates/prompt_immigration.md`
4. Paste into Claude
5. Download JSON → save to `data/structured/`

---

### **Step 3: Upload to ChromaDB (10:30, 10 min)**
```bash
python3 scripts/upload_to_chromadb.py immigration_structured_20250110.json
```

**Uploads to**: ChromaDB collection `bali_intel_immigration`

---

### **Step 4: Verify (11:00, 5 min)**
```bash
python3 scripts/verify_upload.py immigration 20250110
```

**Output**: "✅ 45 news items uploaded successfully"

---

## 📊 Daily Output KPIs

**Minimum targets**:
- ✅ 30+ sources scraped
- ✅ 20+ news items structured
- ✅ 80%+ freshness (<48h)
- ✅ Tier balance (20% T1, 50% T2, 30% T3)

---

## 🔗 ZANTARA Integration

**TypeScript Handler**: `intel.news.search`

**Query example**:
```typescript
{
  "handler": "intel.news.search",
  "params": {
    "query": "visa changes bali",
    "category": "immigration",
    "date_range": "last_7_days",
    "tier": "1,2"
  }
}
```

**RAG endpoint**: `/api/intel/search`

---

## 📁 Directory Structure

```
bali-intel-scraper/
├── README.md                    # This guide
├── docs/
│   ├── SETUP_GUIDE_MAC.md      # Python setup for Mac
│   ├── DAILY_WORKFLOW.md       # Detailed workflow
│   └── SOURCES_LIST.md         # Complete sources list (240+ sites)
├── scripts/
│   ├── scrape_immigration.py   # Topic 1 script
│   ├── scrape_bkpm_tax.py      # Topic 2 script
│   ├── scrape_realestate.py    # Topic 3 script
│   ├── scrape_events.py        # Topic 4 script
│   ├── scrape_social.py        # Topic 5 script
│   ├── scrape_competitors.py   # Topic 6 script
│   ├── scrape_bali_news.py     # Topic 7 script
│   ├── scrape_roundup.py       # Topic 8 script
│   ├── upload_to_chromadb.py   # Upload structured data
│   └── verify_upload.py        # Verify upload
├── templates/
│   ├── prompt_immigration.md   # Structuring prompt topic 1
│   ├── prompt_bkpm_tax.md      # Topic 2 prompt
│   └── ... (8 prompt files)
├── data/
│   ├── raw/                    # CSV scraping output
│   │   ├── immigration_raw_20250110.csv
│   │   └── ...
│   └── structured/             # Structured JSON
│       ├── immigration_structured_20250110.json
│       └── ...
└── requirements.txt            # Python dependencies
```

---

## 🛠️ Tech Stack

- **Scraping**: BeautifulSoup4 + Requests + Playwright (JS sites)
- **AI Structuring**: Claude 3.5 Sonnet / GPT-4
- **Storage**: ChromaDB (vector DB)
- **Integration**: ZANTARA TypeScript handlers + RAG backend

---

## 📝 Important Notes

### **Tier System**
- **Tier 1**: Government sources (imigrasi.go.id, BKPM, etc.) - TRUTH
- **Tier 2**: Accredited media (Jakarta Post, Coconuts, etc.) - OPINIONS
- **Tier 3**: Social media, unverified blogs - GOSSIP

### **Language**
- Scraping: Bahasa Indonesia + English
- Structuring: Always output in English + Italian summary
- Storage: English (bilingual metadata)

### **Privacy & Rate Limiting**
- Delay 2-5 sec between requests
- Realistic User-Agent
- Respect robots.txt
- No login/paywall bypass (public content only)

---

## 🚦 Status

**Version**: 1.0.0
**Created**: 2025-10-05
**Status**: Ready for deployment
**Next**: Assign collaborators + training

---

**Contact**: zero@balizero.com
