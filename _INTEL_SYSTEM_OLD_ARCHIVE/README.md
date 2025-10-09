# Intel Automation System - Organized Files

**Last organized**: October 9, 2025

## 📁 Directory Structure

```
_INTEL_SYSTEM/
├── docs/           # Documentation (13 files)
├── logs/           # Automation logs (17 files)
├── reports/        # Session reports (6 files)
├── scripts/        # Python/Shell scripts (8 files)
├── output/         # Generated content (267 files)
│   ├── INTEL_SCRAPING/      # Raw scraped data + RAG processed
│   └── INTEL_ARTICLES/      # Generated articles
└── archive/        # Old/deprecated systems
```

---

## 📂 Contents

### `/docs` - Documentation (13 files)
System documentation, configuration, and implementation guides:
- Intel automation README
- Intel sources inventory
- Intel categories configuration
- Scraping system documentation
- V2 migration guides
- Twitter intel integration
- Workflow documentation

### `/logs` - Automation Logs (17 files)
All execution logs from intel automation runs:
- `intel_automation_YYYYMMDD_HHMMSS.log` - Scraping execution logs
- `.health_server.log` - Health check logs

**Date range**: October 8-9, 2025

### `/reports` - Session Reports (6 files)
Comprehensive session summaries and reports:
- `SESSION_SUMMARY_20251009.md` - Latest complete session report
- `SESSION_REPORT_*.md` - Previous session reports
- `*_REPORT.md` - Test and execution reports

### `/scripts` - Automation Scripts (8 files)
Python and shell scripts for automation:
- `send_gmail_direct.py` - Gmail API email sending
- `send_to_all_collaborators.py` - Batch email distribution
- `send_drive_link.py` - Google Drive link distribution
- `send_intel_email.py` - Intel report email sender
- `upload_to_drive.py` - Google Drive file upload
- `test_*.py/sh` - Testing scripts

### `/output` - Generated Content (267 files)

#### `output/INTEL_SCRAPING/` - Scraped & Processed Data
**Format**:
- `raw/` - Original scraped JSON files
- `rag/` - RAG-processed JSON with metadata
- `articles_md/` - Generated markdown articles
- `articles_json/` - Article metadata

**Categories** (40+ categories):
- visa_immigration
- regulatory_changes
- tax_compliance
- business_setup
- employment_law
- health_safety
- transport_connectivity
- competitor_intel
- macro_policy
- real_estate
- banking_finance
- social_media
- events_culture
- And 27 more...

#### `output/INTEL_ARTICLES/` - Final Articles
Latest generated articles (October 9, 2025):
- 16 professional markdown articles
- 16 JSON metadata files
- INDEX.md - Article index
- EMAIL_PREVIEW_*.html - Email preview
- **ZIP**: Available on Google Drive

### `/archive` - Archived Systems
Old/deprecated scraping systems and data:
- `INTEL_SCRAPING_OLD/` - Previous scraping structure
- `_ARCHIVED_SCRAPING_SYSTEMS/` - Legacy systems

---

## 🔄 Workflow Overview

```
1. SCRAPING → raw/ files
2. RAG PROCESSING → rag/ files + ChromaDB
3. ARTICLE GENERATION → INTEL_ARTICLES/
4. EMAIL DISTRIBUTION → Team notifications
5. DRIVE UPLOAD → Shared access
```

---

## 📊 Statistics

- **Total files organized**: 311
- **Scraped documents**: 84+
- **RAG processed**: 84+
- **Generated articles**: 16
- **Email sent**: 48 (24 people × 2 emails)
- **Categories covered**: 40+
- **Archive size**: 200+ legacy files

---

## 🚀 Quick Access

### Latest Outputs (Oct 9, 2025)
- **Articles**: `output/INTEL_ARTICLES/`
- **Article Index**: `output/INTEL_ARTICLES/INDEX.md`
- **Google Drive ZIP**: https://drive.google.com/file/d/1ccqQUcf58c8NMZOaKnJTH6ITPkS8O48D/view

### Latest Reports
- **Session Summary**: `reports/SESSION_SUMMARY_20251009.md`
- **Scraping Report**: `docs/INTEL_SCRAPING_REPORT_20251009.md`
- **Automation Complete**: `docs/INTEL_AUTOMATION_COMPLETE_20251009.md`

### Key Scripts
- **Email Distribution**: `scripts/send_to_all_collaborators.py`
- **Drive Upload**: `scripts/upload_to_drive.py`

### ChromaDB
- **Location**: `../data/chroma_db/`
- **Collections**: 16 collections
- **Documents**: 84+ with embeddings

---

## 🔧 Maintenance

### Cleanup Recommendations
1. ✅ Logs older than 30 days → Archive or delete
2. ✅ Old reports → Keep latest 5, archive rest
3. ✅ Test scripts → Move to archive after validation
4. ✅ Duplicate files → Already removed

### Next Organization Tasks
- [ ] Set up log rotation (keep latest 20)
- [ ] Archive reports older than 3 months
- [ ] Create separate folder for production vs test scripts
- [ ] Set up automated cleanup cron job

---

## 📝 Notes

### What Was Moved
- ✅ All intel automation logs → `/logs`
- ✅ All documentation → `/docs`
- ✅ All session reports → `/reports`
- ✅ All email/upload scripts → `/scripts`
- ✅ All scraping output → `/output`
- ✅ Old systems → `/archive`

### What Stayed in Root
- ✅ Active system scripts in `/scripts`
- ✅ ChromaDB data in `/data`
- ✅ Main documentation (README.md, ARCHITECTURE.md, etc.)
- ✅ Configuration files
- ✅ Application code (`/apps`, `/packages`)

---

**🤖 Organized by NUZANTARA Intel Automation System**
*Keeping your intel workflow clean and efficient*
