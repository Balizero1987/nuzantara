# 🚀 Next Steps - Implementation Roadmap

**Last Updated**: 2025-10-10
**Current Status**: Phase 1+2 Expansion COMPLETE ✅
**Current Version**: 2.2 (199 sources)

---

## ✅ COMPLETED

- [x] Phase 1: Expand CRITICAL categories (66 → 109, +43)
- [x] Phase 2: Expand HIGH + NEW categories (109 → 189, +80)
- [x] Final 10: Reach 199 sources target (189 → 199, +10)
- [x] Commit expansion to git (abbbbe6)
- [x] Generate comprehensive reports
- [x] Map email routing for 17 categories

---

## 🎯 IMMEDIATE PRIORITIES

### 1. Update categories_v2.json with Email Routing ⏱️ 15 min

**Task**: Update `owner` field for all 17 categories with correct emails

**Current**: All show `"owner": "zero@balizero.com"`
**Target**: Update to actual owners from EMAIL_ROUTING_MAP.md

**Action**:
```bash
# Edit config/categories_v2.json
# Update owner field for each category:
# - regulatory_changes: consulting@balizero.com
# - visa_immigration: consulting@balizero.com
# - tax_compliance: faisha.tax@balizero.com
# - business_setup: ari.firda@balizero.com
# ... etc (see EMAIL_ROUTING_MAP.md)
```

**Commit Message**:
```
feat: add email routing for 17 intel categories

Map each category to responsible team member:
- Adit (consulting@): regulatory, visa (CRITICAL)
- Faisha (faisha.tax@): tax_compliance (CRITICAL)
- Ari (ari.firda@): business, competitor, macro (4 cats)
- Krisna (krisna@): property_law
- Surya (surya@): banking, health_safety (2 cats)
- Dea (dea@): employment, social_media (2 cats)
- Vino (vino@): cost_of_living
- Amanda (amanda@): lifestyle, jobs (2 cats)
- Sahira (sahira@): events_networking
- Anton (anton@): transport_connectivity
- Damar (damar@): general_news
```

---

### 2. Add Zero's 3 Personal Categories ⏱️ 30 min

**Task**: Add 3 new categories to categories_v2.json

**Categories to Add**:
1. `ai_tech_global` - AI and tech industry trends (global)
2. `dev_code_library` - Developer tools, code libraries, best practices
3. `future_trends` - Future tech, predictions, emerging trends

**Characteristics**:
- Priority: MEDIUM
- Owner: zero@balizero.com
- Content type: "blog_article" (long-form, curated)
- Email format: Blog-style (800-1500 words)
- Sources: ~20 each (TBD - need to define)
- Update frequency: weekly

**Example Structure**:
```json
{
  "id": "ai_tech_global",
  "name": "AI & Tech Global Trends",
  "priority": "MEDIUM",
  "enabled": true,
  "revenue_impact": "INDIRECT",
  "update_frequency": "weekly",
  "owner": "zero@balizero.com",
  "content_type": "blog_article",
  "description": "Global AI and tech industry trends, research, breakthroughs (Zero personal)",
  "email_style": "blog",
  "quality_thresholds": {
    "min_word_count": 800,
    "min_tier_1_percentage": 0,
    "quality_score_min": 6.0,
    "date_required": false
  },
  "sources": [
    {"url": "https://openai.com/blog", "tier": 1, "type": "official"},
    {"url": "https://ai.google/research", "tier": 1, "type": "official"},
    // ... +18 more
  ]
}
```

**Action**: Define sources for each category, add to config, commit

---

### 3. Implement Stage 2: AI Processing ⏱️ 2-4 hours

**Task**: Create AI processing pipeline (LLAMA 3.2 local)

**Input**: Raw scraped content from Stage 1
**Output**:
- `.json` files → `INTEL_SCRAPING/chromadb_ready/` (all mixed)
- `.md` files → `INTEL_SCRAPING/markdown_articles/{category}/` (separated)

**Script Location**: `scripts/stage2_ai_processing.py`

**Key Components**:
1. **Read raw scraped data** from `INTEL_SCRAPING/{category}/raw/`
2. **Call LLAMA 3.2** via Ollama API for processing
3. **Branch A: RAG Pipeline**
   - Generate structured JSON for ChromaDB
   - Include: content, metadata, embeddings_ready, category, source_url, date
   - Output: `chromadb_ready/{category}_{timestamp}.json`
4. **Branch B: Content Pipeline**
   - Generate clean markdown for team review
   - Include: title, summary, key_points, full_text, sources
   - Output: `markdown_articles/{category}/{timestamp}.md`

**Prompts Required**:
- `prompts/stage2_rag_extraction.txt` - For JSON generation
- `prompts/stage2_content_summary.txt` - For markdown generation

**Dependencies**:
- Ollama running locally (LLAMA 3.2 3B model)
- Python libraries: `ollama`, `json`, `markdown`

---

### 4. Implement Email Routing ⏱️ 1-2 hours

**Task**: Create email notification system

**Script Location**: `scripts/send_intel_emails.py`

**Key Components**:
1. **Read processed markdown** from `markdown_articles/{category}/`
2. **Load email template** based on priority:
   - CRITICAL/HIGH → `templates/email/critical_brief.html`
   - MEDIUM → `templates/email/standard_digest.html`
   - LOW → `templates/email/monthly_roundup.html`
   - Zero personal → `templates/email/blog_article.html`
3. **Send email** to category owner using Gmail API
4. **Log sent emails** to prevent duplicates

**Email Templates** (Create 4 HTML templates):
1. `templates/email/critical_brief.html`
2. `templates/email/standard_digest.html`
3. `templates/email/monthly_roundup.html`
4. `templates/email/blog_article.html`

**Gmail API Setup**:
- Use existing GMAIL_CREDENTIALS from secrets
- Send from: noreply@balizero.com (or intel@balizero.com)
- Include unsubscribe link (per category)

---

### 5. Implement Stage 5: GitHub Actions Scheduling ⏱️ 1 hour

**Task**: Create GitHub Actions workflow for daily automation

**File**: `.github/workflows/intel-scraping-daily.yml`

**Schedule**: Daily 06:00-09:00 CET (22:00-01:00 WIB)

**Workflow Steps**:
```yaml
name: Intel Scraping Daily

on:
  schedule:
    - cron: '0 6 * * *'  # 06:00 CET = 13:00 WIB (DST)
    - cron: '0 7 * * *'  # 07:00 CET = 14:00 WIB (DST)
  workflow_dispatch:  # Allow manual trigger

jobs:
  scrape-and-process:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install Ollama
        run: |
          curl -fsSL https://ollama.ai/install.sh | sh
          ollama pull llama3.2:3b

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Stage 1 - Scrape all categories
        run: python scripts/crawl4ai_scraper.py --all

      - name: Stage 2 - Process with AI
        run: python scripts/stage2_ai_processing.py

      - name: Stage 2B - Send emails
        run: python scripts/send_intel_emails.py
        env:
          GMAIL_CREDENTIALS: ${{ secrets.GMAIL_CREDENTIALS }}

      - name: Commit results
        run: |
          git config user.name "Intel Bot"
          git config user.email "intel@balizero.com"
          git add INTEL_SCRAPING/
          git commit -m "chore: intel scraping $(date +%Y-%m-%d)"
          git push
```

---

## 🔄 IMPLEMENTATION ORDER

**Week 1** (Current Week):
1. ✅ Day 1-2: Phase 1+2 expansion (DONE)
2. 🔲 Day 3: Update email routing in categories_v2.json
3. 🔲 Day 4: Add Zero's 3 personal categories + sources
4. 🔲 Day 5: Test manual scraping with new sources

**Week 2**:
5. 🔲 Day 1-2: Implement Stage 2 AI processing
6. 🔲 Day 3: Create email templates
7. 🔲 Day 4: Implement email routing
8. 🔲 Day 5: Test end-to-end pipeline manually

**Week 3**:
9. 🔲 Day 1: Create GitHub Actions workflow
10. 🔲 Day 2: Test scheduled runs
11. 🔲 Day 3-5: Monitor, fix issues, optimize

---

## 📋 CHECKLIST

### Pre-Implementation
- [x] Categories expanded to 199 sources
- [x] Email routing mapped
- [x] Reports generated
- [ ] Email addresses validated with team
- [ ] Zero's 3 categories sources defined

### Stage 2 Implementation
- [ ] LLAMA 3.2 installed via Ollama
- [ ] RAG extraction prompt created
- [ ] Content summary prompt created
- [ ] stage2_ai_processing.py script created
- [ ] Output folders created (chromadb_ready, markdown_articles)
- [ ] Manual test: 1 category end-to-end

### Email Implementation
- [ ] 4 HTML email templates created
- [ ] Gmail API credentials configured
- [ ] send_intel_emails.py script created
- [ ] Unsubscribe mechanism added
- [ ] Email log/tracking implemented
- [ ] Manual test: Send 1 email each type

### Scheduling Implementation
- [ ] GitHub Actions workflow created
- [ ] Secrets configured in GitHub
- [ ] Ollama installation in CI tested
- [ ] Manual workflow dispatch tested
- [ ] Scheduled runs enabled
- [ ] Monitoring/alerting configured

---

## ⚠️ BLOCKERS / DECISIONS NEEDED

1. **Zero's 3 categories sources**:
   - Need to define ~20 sources each for ai_tech_global, dev_code_library, future_trends
   - Should these be global tech blogs or Indonesia-focused?

2. **Email sending service**:
   - Use Gmail API (current setup) or switch to SendGrid/Mailgun for better deliverability?
   - Gmail has 500 emails/day limit (sufficient for 17 categories?)

3. **Ollama in GitHub Actions**:
   - LLAMA 3.2 3B model size ~2GB - may slow CI
   - Alternative: Use Claude API for Stage 2 processing? (costs ~$0.01/article)

4. **Storage for processed content**:
   - Keep in git repo (will grow large over time)
   - Or upload to Cloud Storage (GCS bucket)?

---

## 💰 COST ESTIMATE

**Current Setup** (Free):
- GitHub Actions: 2000 min/month free (sufficient)
- Gmail API: 500 emails/day free (sufficient)
- Ollama local: Free (but slow in CI)

**Alternative** (Paid):
- Claude API for Stage 2: ~$0.01/article × 50 articles/day × 30 days = **$15/month**
- SendGrid: $15/month for 40k emails (overkill)
- GCS Storage: $0.02/GB/month × 10GB = **$0.20/month**

**Total estimated cost**: $0-15/month depending on Claude API usage

---

## 📞 CONTACTS FOR SIGN-OFF

Before proceeding, confirm with:
1. **Adit** (consulting@) - CRITICAL categories owner
2. **Ari** (ari.firda@) - Business + LOW categories owner
3. **Zero** (zero@) - Overall system + personal categories

**Questions to ask**:
- Email frequency per category? (daily/weekly/monthly)
- Email digest format preferences?
- Unsubscribe per category or full opt-out?
- Zero's 3 categories: source suggestions?

---

**Status**: Ready to proceed with Step 1 (Email routing update)
**Next Action**: Update categories_v2.json with owner emails
**ETA**: 15 minutes
