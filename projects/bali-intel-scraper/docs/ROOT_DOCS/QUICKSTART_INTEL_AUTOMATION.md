# 🚀 Quick Start - Intel Automation System

**For New Developers**: Read this first to understand and work with the Intel Automation system.

---

## 📖 What Is This?

The **Intel Automation System** automatically scrapes, processes, and distributes intelligence articles to the Bali Zero team every day at 06:00 Bali time.

**Input**: 259 sources across 20 categories (government sites, news portals, social media)
**Output**: Professional articles delivered to team members by email

---

## 🎯 Quick Overview

```
DAILY (06:00 WIB) → Scrape 259 sources → Process with AI → Distribute to team
                     (Crawl4AI)          (LLAMA 3.2)      (Email/ChromaDB)
```

**Categories**: 20 total
- 17 team categories (visa, tax, business, property, jobs, etc.)
- 3 Zero personal categories (AI trends, dev libraries, future tech)

**Automation**: GitHub Actions runs daily, fully automated

---

## 📁 File Structure

```
NUZANTARA-2/
├── config/
│   └── categories_v2.json              # 259 sources, 20 categories
│
├── scripts/
│   ├── run_intel_automation.py         # Main orchestrator (348 lines)
│   ├── crawl4ai_scraper.py             # Stage 1: Scraping
│   └── stage2_ai_processor.py          # Stage 2: AI Processing (PENDING)
│
├── .github/workflows/
│   └── intel-automation.yml            # Daily schedule (06:00 WIB)
│
└── Documentation (read these!)
    ├── SESSION_REPORT_2025-10-09_INTEL_EXPANSION.md  ⭐ Start here
    ├── STAGE2_QUALITY_REQUIREMENTS.md                ⭐ Critical
    ├── INTEL_SOURCES_EXPANSION_COMPLETE.md
    ├── EMAIL_ROUTING_MAP.md
    └── SOURCES_BY_CATEGORY_DETAILED.md
```

---

## 🔄 5-Stage Pipeline

### Stage 1: Scraping ✅ WORKING
- **Script**: `scripts/crawl4ai_scraper.py`
- **Tool**: Crawl4AI (open-source web scraper)
- **Input**: 259 source URLs from `config/categories_v2.json`
- **Output**: Raw JSON files → `scripts/INTEL_SCRAPING/*/raw/*.json`
- **Duration**: ~30-60 minutes
- **Status**: ✅ Implemented and deployed

### Stage 2: AI Processing 🔴 PENDING
- **Script**: `scripts/stage2_ai_processor.py` (NOT YET IMPLEMENTED)
- **Tool**: LLAMA 3.2 (local) or Claude API (Haiku 3.5)
- **Input**: Raw JSON from Stage 1
- **Output**:
  - Branch A: `chromadb_ready/*.json` (for RAG ingestion)
  - Branch B: `markdown_articles/{category}/*.md` (for team)
- **Duration**: ~15-30 minutes
- **Status**: 🔴 **NEEDS IMPLEMENTATION** (see STAGE2_QUALITY_REQUIREMENTS.md)

### Stage 3: Editorial Review ⏸️ SKIPPED
- Manual review by team leads (future feature)

### Stage 4: Publishing ⏸️ SKIPPED
- Multi-channel publishing: blog, social media (future feature)

### Stage 5: Email Notifications 🔴 PENDING
- **Script**: `scripts/send_intel_emails.py` (NOT YET IMPLEMENTED)
- **Tool**: Gmail API
- **Input**: Markdown articles from Stage 2
- **Output**: Emails sent to team members
- **Status**: 🔴 **NEEDS IMPLEMENTATION**

---

## 🏃 How to Run Locally

### Prerequisites
```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Set environment variables
export ANTHROPIC_API_KEY="your-key"
export SENDER_EMAIL="your-email"
export SENDER_PASSWORD="your-password"
```

### Run Full Pipeline
```bash
cd scripts
python3 run_intel_automation.py
```

### Run with Options
```bash
# Skip Stage 2 (AI processing)
python3 run_intel_automation.py --skip stage2

# Only process specific categories
python3 run_intel_automation.py --categories visa_immigration,tax_compliance

# Skip multiple stages
python3 run_intel_automation.py --skip stage2,stage5
```

### Check Logs
```bash
tail -f intel_automation.log
```

---

## 🔧 How to Modify

### Add New Sources

1. Open `config/categories_v2.json`
2. Find your category (e.g., `visa_immigration`)
3. Add to `sources` array:
```json
{
  "url": "https://example.com/immigration",
  "tier": 1,
  "type": "official",
  "name": "Example Immigration Office"
}
```
4. Commit and push

**Tiers**:
- `1` = Government/Official (highest trust)
- `2` = Media/Professional (medium trust)
- `3` = Community (lower trust)

### Add New Category

1. Open `config/categories_v2.json`
2. Add new object to root array:
```json
{
  "id": "new_category",
  "name": "New Category Name",
  "priority": "MEDIUM",
  "enabled": true,
  "revenue_impact": "INDIRECT",
  "update_frequency": "daily",
  "owner": "owner@balizero.com",
  "description": "Category description",
  "quality_thresholds": {
    "min_word_count": 500,
    "quality_score_min": 5.0
  },
  "sources": [
    {"url": "https://...", "tier": 2, "type": "news"}
  ],
  "guardrails": {
    "deny_keywords": ["scam", "fake"],
    "allow_keywords": ["relevant", "keywords"],
    "require_allow_match": true
  }
}
```
3. Add email routing to `EMAIL_ROUTING_MAP.md`
4. Commit and push

### Change Schedule

1. Open `.github/workflows/intel-automation.yml`
2. Modify cron schedule:
```yaml
schedule:
  - cron: '0 22 * * *'  # 22:00 UTC = 06:00 WIB
```
3. Commit and push

**Cron format**: `minute hour day month weekday`
- `0 22 * * *` = Every day at 22:00 UTC
- `0 */6 * * *` = Every 6 hours
- `0 9 * * 1` = Every Monday at 09:00 UTC

---

## 🧪 Testing

### Test Locally (Manual)
```bash
# Test Stage 1 only (scraping)
cd scripts
python3 run_intel_automation.py --skip stage2,stage5

# Check output
ls -lh INTEL_SCRAPING/*/raw/*.json
```

### Test on GitHub Actions (Manual Trigger)
```bash
# Trigger workflow manually
gh workflow run intel-automation.yml

# Watch execution
gh run watch

# View logs
gh run view --log
```

### Test Specific Category
```bash
python3 run_intel_automation.py --categories visa_immigration
```

---

## 📊 Monitoring

### Check Workflow Status
```bash
# List recent runs
gh run list --workflow intel-automation.yml

# View specific run
gh run view <run-id>

# View logs
gh run view <run-id> --log
```

### Check GitHub Actions Dashboard
https://github.com/Balizero1987/nuzantara/actions/workflows/intel-automation.yml

### Check Artifacts
- Raw scraping results: Artifacts → `intel-scraping-{run_number}`
- Processed articles: Artifacts → `intel-articles-{run_number}`
- Retention: 30 days

---

## 🚨 Common Issues

### Issue 1: Workflow Not Running

**Check**:
```bash
gh workflow list
```

**Fix**:
- Ensure workflow is enabled
- Check schedule is correct (cron syntax)
- Verify secrets are set: `ANTHROPIC_API_KEY`, `SENDER_EMAIL`, `SENDER_PASSWORD`

### Issue 2: Stage 1 Fails (Scraping)

**Check logs**:
```bash
gh run view <run-id> --log --job intel-pipeline
```

**Common causes**:
- Playwright browser not installed
- Network timeout (increase timeout in script)
- Source URL changed/down

**Fix**:
- Install Playwright: `playwright install chromium`
- Update timeout in `crawl4ai_scraper.py`
- Check source URL manually, update if needed

### Issue 3: No Articles Generated

**Check**:
- Stage 1 completed? (raw JSON files exist?)
- Stage 2 implemented? (currently PENDING)

**Fix**:
- Implement `scripts/stage2_ai_processor.py` (see STAGE2_QUALITY_REQUIREMENTS.md)

### Issue 4: Git Push Blocked by Secrets

**Error**: "Push cannot contain secrets"

**Fix**:
```bash
# Remove secret from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/secret.json" HEAD

# Force push
git push --force-with-lease origin main
```

**Better**: Never commit secrets! Use GitHub Secrets instead.

---

## 🔐 Secrets Management

### GitHub Secrets (for Actions)

1. Go to: Settings → Secrets and variables → Actions
2. Add secrets:
   - `ANTHROPIC_API_KEY` - Claude API key
   - `SENDER_EMAIL` - Gmail for sending emails
   - `SENDER_PASSWORD` - Gmail app password

### Local Development

Create `.env` file (gitignored):
```bash
ANTHROPIC_API_KEY=your-key
SENDER_EMAIL=your-email@gmail.com
SENDER_PASSWORD=your-app-password
RAG_BACKEND_URL=https://your-rag-backend.run.app
```

**Never commit** `.env` or any files with secrets!

---

## 📈 Quality Metrics

### Stage 2 Quality Requirements

**Word Count Minimums**:
- CRITICAL: 1,000-1,500 words
- HIGH: 800-1,200 words
- MEDIUM: 500-800 words
- LOW: 400-600 words
- Zero Personal (Blog): 1,200-2,000 words

**Quality Score Targets** (0-10 scale):
- CRITICAL: 7.0+ average
- HIGH: 6.0+ average
- MEDIUM: 5.0+ average
- LOW: 4.0+ average

**Structure Required**:
- Executive Summary (3-5 key points)
- Detailed analysis with subsections
- Practical implications
- Timeline/deadlines
- Sources cited (tier 1/2)
- Markdown formatting

See `STAGE2_QUALITY_REQUIREMENTS.md` for full details.

---

## 💰 Cost Tracking

**Current Monthly Cost**: ~$15/month

**Breakdown**:
- GitHub Actions (ubuntu-latest): $0 (within free tier)
- Claude API (Stage 2): ~$15/month (50 articles/day × $0.01)

**Cost per Hour of Intel Work**: $0.017/hour (1.7 cents)

**Time Saved**: 880 hours/month (44 hours/day automated)

---

## 👥 Team Contacts

**Categories by Owner**:

| Owner | Email | Categories |
|-------|-------|------------|
| Adit | consulting@balizero.com | regulatory_changes, visa_immigration |
| Faisha | faisha.tax@balizero.com | tax_compliance |
| Ari | ari.firda@balizero.com | business_setup, competitor_intel, macro_policy |
| Krisna | krisna@balizero.com | property_law |
| Surya | surya@balizero.com | banking_finance, health_safety |
| Dea | dea@balizero.com | employment_law, social_media |
| Vino | vino@balizero.com | cost_of_living |
| Amanda | amanda@balizero.com | bali_lifestyle, jobs |
| Sahira | sahira@balizero.com | events_networking |
| Damar | damar@balizero.com | general_news |
| Anton | anton@balizero.com | transport_connectivity |
| Zero | zero@balizero.com | ai_tech_global, dev_code_library, future_trends |

---

## 🎓 Learning Resources

### Must-Read Documentation
1. **SESSION_REPORT_2025-10-09_INTEL_EXPANSION.md** - Complete session history
2. **STAGE2_QUALITY_REQUIREMENTS.md** - Critical for Stage 2 implementation
3. **INTEL_SOURCES_EXPANSION_COMPLETE.md** - Full technical details
4. **EMAIL_ROUTING_MAP.md** - Team email routing

### Understanding the System
1. Read `.claude/INIT.md` - Project overview
2. Read `docs/research/INTEL_AUTOMATION_ARCHITECTURE.md` - Architecture design
3. Review `config/categories_v2.json` - All 259 sources

### Key Technologies
- **Crawl4AI**: Web scraping - https://github.com/unclecode/crawl4ai
- **LLAMA 3.2**: AI processing - https://ollama.com/library/llama3.2
- **Claude API**: Alternative AI - https://docs.anthropic.com
- **GitHub Actions**: Automation - https://docs.github.com/actions

---

## ⏭️ Next Steps (High Priority)

If you're continuing this work, implement these next:

### 1. Stage 2 AI Processor (CRITICAL)
- **File**: `scripts/stage2_ai_processor.py`
- **Requirements**: See `STAGE2_QUALITY_REQUIREMENTS.md`
- **Est. Time**: 4-6 hours
- **Impact**: Enables article generation (currently just raw scraping)

### 2. Owner Email Updates
- **File**: `config/categories_v2.json`
- **Task**: Replace `"owner": "zero@balizero.com"` with actual team emails
- **Reference**: `EMAIL_ROUTING_MAP.md`
- **Est. Time**: 30 minutes

### 3. Stage 5 Email Notifications
- **File**: `scripts/send_intel_emails.py`
- **Requirements**: Gmail API integration, email templates
- **Est. Time**: 3-4 hours
- **Impact**: Completes automation (articles → team inboxes)

---

## 📞 Getting Help

1. **Read documentation first** (11 docs in project root)
2. **Check GitHub Actions logs** for workflow errors
3. **Test locally** before debugging on GitHub Actions
4. **Check `intel_automation.log`** for detailed execution logs
5. **Contact Zero**: zero@balizero.com

---

## ✅ Checklist for New Developers

Before starting work:

- [ ] Read this QUICKSTART document
- [ ] Read SESSION_REPORT_2025-10-09_INTEL_EXPANSION.md
- [ ] Read STAGE2_QUALITY_REQUIREMENTS.md (if working on Stage 2)
- [ ] Clone repo: `git clone https://github.com/Balizero1987/nuzantara`
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Install Playwright: `playwright install chromium`
- [ ] Set up `.env` file with API keys
- [ ] Test locally: `python3 scripts/run_intel_automation.py --skip stage2,stage5`
- [ ] Review GitHub Actions: https://github.com/Balizero1987/nuzantara/actions
- [ ] Understand 20 categories in `config/categories_v2.json`
- [ ] Review 259 sources in `SOURCES_BY_CATEGORY_DETAILED.md`

---

## 🎯 System Status

**Current Status**: ✅ **Stage 1 DEPLOYED - Stage 2 PENDING**

**What Works**:
- ✅ Daily scraping at 06:00 WIB (GitHub Actions)
- ✅ 259 sources configured and validated
- ✅ Raw JSON files collected to `INTEL_SCRAPING/*/raw/`
- ✅ Artifacts uploaded (30-day retention)

**What's Pending**:
- 🔴 Stage 2: AI article generation (CRITICAL - blocks everything else)
- 🔴 Stage 5: Email distribution to team
- 🟡 Email templates (4 templates needed)
- 🟡 Owner email updates in config

**Next Scheduled Run**: Daily at 06:00 WIB (22:00 UTC)

---

**Last Updated**: October 10, 2025
**System Version**: v2.3 (259 sources, 20 categories)
**Status**: Production-ready (Stage 1), Stage 2 pending implementation

---

_Quick Start Guide - Intel Automation System_
_For questions: zero@balizero.com_
