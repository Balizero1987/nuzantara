# 🔄 Intel Automation - Dual Workflow System

**Updated**: 2025-10-07
**Status**: ✅ Implemented & Ready for Testing

---

## 📋 Overview

The Intel Automation system now supports **two distinct workflows**:

1. **Standard Workflow** (11 categories) → Full pipeline with social media publishing
2. **Special Workflow** (3 categories) → Intelligence-only, email alerts to zero@balizero.com

---

## 🎯 Category Configuration

### Standard Categories (→ Social Media + Email)

These categories go through the full pipeline: Scraping → LLAMA → Claude Opus → Social Media + Email

| # | Category | Owner | Email | Min Sites | Status |
|---|----------|-------|-------|-----------|--------|
| 1 | `immigration` | Adit | adit@balizero.com | 50 | ⚠️ Expand (8→50) |
| 2 | `business_bkpm` | Dea | dea@balizero.com | 50 | ⚠️ Expand (6→50) |
| 3 | `real_estate` | Krisna | krisna@balizero.com | 50 | ⚠️ Expand (6→50) |
| 4 | `events_culture` | Surya | surya@balizero.com | 50 | ⚠️ Expand (4→50) |
| 5 | `social_media` | Sahira | sahira@balizero.com | Auto | ✅ AI decides |
| 6 | `competitors` | Damar | damar@balizero.com | All | ⚠️ Expand worldwide |
| 7 | `general_news` | Vino | vino@balizero.com | 50 | ⚠️ Expand (4→50) |
| 8 | `health_wellness` | Ari | ari@balizero.com | 50 | ❌ New category |
| 9 | `tax_djp` | Veronika | veronika@balizero.com | 50 | ❌ New category |
| 10 | `jobs` | Anton | anton@balizero.com | 30-50 | ❌ New category |
| 11 | `lifestyle` | Dewa Ayu | dewaayu@balizero.com | 30-50 | ❌ New category |

### Special Categories (→ Email Only)

These categories **SKIP** Claude Opus and social media, going directly to email

| # | Category | Recipient | Min Sites | Purpose |
|---|----------|-----------|-----------|---------|
| 12 | `ai_tech_global` | zero@balizero.com | 50 | Global AI/tech news for strategic intelligence |
| 13 | `dev_code_library` | zero@balizero.com | 50 | Best code worldwide for dev library enrichment |
| 14 | `future_trends` | zero@balizero.com | 50 | Cutting-edge future trends and ideas |

---

## 🔀 Workflow Comparison

### Standard Workflow (11 Categories)

```
Stage 1: Web Scraping (Crawl4AI)
    ↓
Stage 2A: RAG Processing (LLAMA 3.2) → ChromaDB
    ↓
Stage 2B: Content Creation (LLAMA 3.2) → Draft articles
    ↓
Stage 3B: Editorial Review (Claude Opus 4) → Quality scoring + Multi-channel adaptation
    ↓
Stage 4: Multi-Channel Publishing
    - Blog (GitHub Pages)
    - Instagram (carousel)
    - Facebook (post)
    - X/Twitter (thread)
    - WhatsApp (broadcast)
    - Telegram (channel)
    ↓
Stage 5: Email to Category Owner
    - Approved articles sent to responsible person
    - Beautiful HTML email with article content
```

**Cost**: ~$5-10/month (Claude Opus for editorial)
**Output**: Professional multi-channel content for expat audience

---

### Special Workflow (3 Categories)

```
Stage 1: Web Scraping (Crawl4AI)
    ↓
Stage 2A: RAG Processing (LLAMA 3.2) → ChromaDB
    ↓
Stage 2B: Content Creation (LLAMA 3.2) → Draft articles
    ↓
Stage 3A: Email to zero@balizero.com
    - LLAMA-generated intelligence alerts
    - HTML email format
    - Marked as "Intelligence Alert (Email Only)"
    ↓
STOP (No Claude Opus, No Social Media)
```

**Cost**: $0 (fully free - LLAMA only)
**Output**: Daily intelligence digest for decision-making

---

## 📧 Email System

### Email Configuration

Set these environment variables:

```bash
export SENDER_EMAIL="intel@balizero.com"
export SENDER_PASSWORD="your-app-password"
export SMTP_SERVER="smtp.gmail.com"  # default
export SMTP_PORT="587"  # default
```

### Email Templates

**Standard Categories** (after publishing):
- Subject: `[New Article] Category Name - Article Title`
- Contains: Full article with metadata, publication status
- Badge: "Content Pipeline (Social Media + Email)"

**Special Categories** (skip publishing):
- Subject: `[Intel Alert] Category Name - Article Title`
- Contains: LLAMA-generated article, source info, tier rating
- Badge: "Intelligence Alert (Email Only)"

### Daily Digest

For categories with multiple articles, a daily digest is sent:
- Lists all articles generated that day
- Quick preview of each article
- Links to full content

---

## 🚀 Usage

### Run Complete Pipeline

```bash
cd scripts
python3 run_intel_automation.py
```

This runs all 7 stages for all 14 categories with workflow differentiation.

### Run Specific Stages

```bash
# Stage 1: Scraping only
python3 run_intel_automation.py --stage scraping

# Stage 2: RAG + Content
python3 run_intel_automation.py --stage rag
python3 run_intel_automation.py --stage content

# Stage 3A: Email special categories
python3 run_intel_automation.py --stage email_special

# Stage 3B: Editorial (standard only)
python3 run_intel_automation.py --stage editorial

# Stage 4: Publishing (standard only)
python3 run_intel_automation.py --stage publishing

# Stage 5: Email standard categories
python3 run_intel_automation.py --stage email_standard
```

### Skip Stages

```bash
# Run without social media publishing
python3 run_intel_automation.py --skip publishing

# Run without editorial and publishing
python3 run_intel_automation.py --skip editorial publishing

# Run without email
python3 run_intel_automation.py --skip email_special email_standard
```

### Test Mode

```bash
# Run with limited sources for testing
python3 run_intel_automation.py --test
```

---

## 🔧 Configuration Files

### 1. `crawl4ai_scraper.py`

Contains:
- `CATEGORY_OWNERS`: Maps categories to email addresses
- `SPECIAL_CATEGORIES`: Set of categories that skip Claude/social
- `INTEL_SOURCES`: All sources by category (expand to 640 sites)

### 2. `email_sender.py`

Handles:
- Individual article emails
- Daily digests
- HTML formatting with beautiful templates
- Workflow-specific badges and messaging

### 3. `run_intel_automation.py`

Orchestrates:
- 7-stage pipeline with branching logic
- Workflow differentiation based on category
- Error handling and reporting
- CLI interface for selective execution

---

## 📊 Expected Output

### Daily Production Run

**Standard Categories**:
- ~50-100 articles scraped
- ~20-30 articles generated by LLAMA
- ~10-15 articles approved by Claude Opus
- ~10-15 articles published to 6 channels
- ~10-15 emails sent to category owners

**Special Categories**:
- ~30-50 articles scraped
- ~10-20 articles generated by LLAMA
- ~10-20 intelligence alerts sent to zero@balizero.com
- NO Claude usage, NO social media

### Cost Breakdown

| Component | Standard | Special | Total |
|-----------|----------|---------|-------|
| Scraping | $0 | $0 | $0 |
| LLAMA | $0 | $0 | $0 |
| Claude Opus | $5-10 | $0 | $5-10 |
| Social APIs | $0 | N/A | $0 |
| Email | $0 | $0 | $0 |
| **Monthly** | **$5-10** | **$0** | **$5-10** |

---

## 🎯 Next Steps

### Phase 1: Source Expansion (Week 1)
- [ ] Immigration: 8 → 50 sites
- [ ] Business/BKPM: 6 → 50 sites
- [ ] Real Estate: 6 → 50 sites
- [ ] Events/Culture: 4 → 50 sites
- [ ] General News: 4 → 50 sites

### Phase 2: New Categories (Week 2)
- [ ] Create `health_wellness` with 50 sites
- [ ] Create `tax_djp` with 50 sites (separate from business_bkpm)
- [ ] Create `jobs` with 30-50 sites
- [ ] Create `lifestyle` with 30-50 sites

### Phase 3: Special Categories (Week 3)
- [ ] Expand `ai_tech_global` to 50 sites
- [ ] Expand `dev_code_library` to 50 sites
- [ ] Expand `future_trends` to 50 sites

### Phase 4: Production Deployment (Week 4)
- [ ] Configure email credentials (SMTP)
- [ ] Set up Anthropic API key
- [ ] Test complete pipeline
- [ ] Configure GitHub Actions for daily runs
- [ ] Monitor and optimize

---

## 🧪 Testing

### Test Email System

```bash
cd scripts
python3 email_sender.py
```

This sends a test email to verify SMTP configuration.

### Test Scraping

```bash
python3 crawl4ai_scraper.py
```

### Test Complete Pipeline (Minimal)

```bash
python3 quick_test_intel.py
```

Runs end-to-end with 2 sources.

---

## 📝 Implementation Notes

### Workflow Branching Logic

The orchestrator automatically:
1. Identifies category type (standard vs special)
2. Routes special categories directly to email after LLAMA
3. Routes standard categories through Claude + social + email
4. Skips Claude Opus for special categories (cost optimization)
5. Sends appropriate email templates based on workflow

### Email Templates

- Professional HTML design with gradient headers
- Metadata badges for workflow type, tier, category
- Markdown-to-HTML conversion for article content
- Mobile-responsive design
- Clear distinction between intelligence alerts and published content

### Error Handling

- Each stage can fail independently without stopping pipeline
- Email failures are logged but don't block processing
- Missing API keys result in stage skip (not failure)
- Comprehensive logging to file + console

---

## 🔐 Security

### Environment Variables Required

```bash
# For standard categories (optional if skipping editorial/publishing)
export ANTHROPIC_API_KEY="sk-ant-..."

# For email (required for any email sending)
export SENDER_EMAIL="intel@balizero.com"
export SENDER_PASSWORD="app-password"

# For social media publishing (optional if skipping)
export FACEBOOK_TOKEN="..."
export INSTAGRAM_TOKEN="..."
export TWITTER_API_KEY="..."
export TELEGRAM_BOT_TOKEN="..."
```

### Secrets Management

Store in:
- `.env` file (local development)
- GitHub Secrets (GitHub Actions)
- Environment variables (production server)

**Never commit credentials to git!**

---

## 📈 Monitoring

### Pipeline Reports

Each run generates:
- JSON report: `INTEL_SCRAPING/pipeline_report_YYYYMMDD_HHMMSS.json`
- Log file: `intel_automation_YYYYMMDD_HHMMSS.log`

### Success Metrics

Monitor:
- Articles scraped per category
- LLAMA generation success rate
- Claude Opus approval rate
- Email delivery success rate
- Social media publishing success rate

### Alerts

Set up alerts for:
- Pipeline failures
- Low approval rates (<50%)
- Email delivery failures
- API rate limits

---

## 🆘 Troubleshooting

### Email Not Sending

Check:
1. `SENDER_EMAIL` and `SENDER_PASSWORD` set?
2. Using app password (not account password)?
3. SMTP server accessible?
4. Check logs for detailed errors

### Claude Opus Not Running

Check:
1. `ANTHROPIC_API_KEY` set?
2. API key valid?
3. Sufficient credits?
4. Rate limits?

### LLAMA Failing

Check:
1. Ollama server running? (`ollama list`)
2. Model pulled? (`ollama pull llama3.2:3b`)
3. Sufficient memory?
4. Check Ollama logs

---

## 🎉 System Ready!

The dual-workflow system is now implemented and ready for testing:

✅ 14 categories configured
✅ Email routing implemented
✅ Workflow branching logic complete
✅ Orchestrator updated
✅ Cost optimization via special categories

**Next**: Expand source lists from 38 to 640 sites! 🚀

---

*Last updated: 2025-10-07*
