# 📧 Email Routing Map - Intel Categories

**Last Updated**: 2025-10-10
**Total Categories**: 17 (Team) + 3 (Zero Personal)

---

## 📬 TEAM CATEGORIES (17)

| # | Category ID | Priority | Owner | Email |
|---|-------------|----------|-------|-------|
| 1 | regulatory_changes | CRITICAL | Adit | consulting@balizero.com |
| 2 | visa_immigration | CRITICAL | Adit | consulting@balizero.com |
| 3 | tax_compliance | CRITICAL | Faisha | faisha.tax@balizero.com |
| 4 | business_setup | HIGH | Ari | ari.firda@balizero.com |
| 5 | property_law | HIGH | Krisna | krisna@balizero.com |
| 6 | banking_finance | MEDIUM | Surya | surya@balizero.com |
| 7 | employment_law | MEDIUM | Dea | dea@balizero.com |
| 8 | cost_of_living | MEDIUM | Vino | vino@balizero.com |
| 9 | bali_lifestyle | MEDIUM | Amanda | amanda@balizero.com |
| 10 | events_networking | MEDIUM | Sahira | sahira@balizero.com |
| 11 | health_safety | MEDIUM | Surya | surya@balizero.com |
| 12 | transport_connectivity | LOW | Anton | anton@balizero.com |
| 13 | competitor_intel | LOW | Ari | ari.firda@balizero.com |
| 14 | macro_policy | LOW | Ari | ari.firda@balizero.com |
| 15 | social_media | MEDIUM | Dea | dea@balizero.com |
| 16 | general_news | MEDIUM | Damar | damar@balizero.com |
| 17 | jobs | MEDIUM | Amanda | amanda@balizero.com |

---

## 🔐 ZERO PERSONAL CATEGORIES (3)

| # | Category ID | Priority | Owner | Email | Note |
|---|-------------|----------|-------|-------|------|
| 18 | ai_tech_global | MEDIUM | Zero | zero@balizero.com | Blog-style articles |
| 19 | dev_code_library | MEDIUM | Zero | zero@balizero.com | Blog-style articles |
| 20 | future_trends | MEDIUM | Zero | zero@balizero.com | Blog-style articles |

---

## 📊 DISTRIBUTION BY OWNER

### Adit (consulting@balizero.com) - 2 categories
- regulatory_changes (CRITICAL)
- visa_immigration (CRITICAL)

### Ari (ari.firda@balizero.com) - 4 categories
- business_setup (HIGH)
- competitor_intel (LOW)
- macro_policy (LOW)
- *(Note: Ari handles business + competitor intel)*

### Faisha (faisha.tax@balizero.com) - 1 category
- tax_compliance (CRITICAL)

### Krisna (krisna@balizero.com) - 1 category
- property_law (HIGH)

### Surya (surya@balizero.com) - 2 categories
- banking_finance (MEDIUM)
- health_safety (MEDIUM)

### Dea (dea@balizero.com) - 2 categories
- employment_law (MEDIUM)
- social_media (MEDIUM)

### Vino (vino@balizero.com) - 1 category
- cost_of_living (MEDIUM)

### Amanda (amanda@balizero.com) - 2 categories
- bali_lifestyle (MEDIUM)
- jobs (MEDIUM)

### Sahira (sahira@balizero.com) - 1 category
- events_networking (MEDIUM)

### Anton (anton@balizero.com) - 1 category
- transport_connectivity (LOW)

### Damar (damar@balizero.com) - 1 category
- general_news (MEDIUM)

### Zero (zero@balizero.com) - 3 categories
- ai_tech_global (MEDIUM) - Personal
- dev_code_library (MEDIUM) - Personal
- future_trends (MEDIUM) - Personal

---

## 📝 EMAIL FORMAT BY CATEGORY TYPE

### CRITICAL/HIGH Categories (5 categories)
**Format**: Structured intel brief
- Executive summary (2-3 sentences)
- Key changes/updates (bullet points)
- Impact assessment (High/Medium/Low)
- Action required (if any)
- Links to full articles
- Frequency: Daily/Weekly

### MEDIUM Categories (9 categories)
**Format**: Standard digest
- Brief summary (1-2 sentences)
- Key points (3-5 bullets)
- Links to sources
- Frequency: Weekly/Biweekly

### LOW Categories (3 categories)
**Format**: Monthly roundup
- High-level summary
- Notable trends
- Links to sources
- Frequency: Monthly

### ZERO PERSONAL (3 categories)
**Format**: Blog-style articles
- Long-form content (800-1500 words)
- Code examples (for dev_code_library)
- Visuals/diagrams recommended
- Curated, not raw intel
- Frequency: As generated

---

## 🚀 IMPLEMENTATION NOTES

**Stage 2 AI Processing** should:
1. Generate `.json` files for ChromaDB ingestion (all categories mixed)
2. Generate `.md` files by category folder
3. Route email based on this mapping
4. Use appropriate email template based on priority

**Email Templates Location**: `apps/bali-intel-scraper/templates/email/`
- `critical_brief.html`
- `standard_digest.html`
- `monthly_roundup.html`
- `blog_article.html` (for Zero)

---

## ⚠️ NOTES
- Surya handles both banking_finance AND health_safety
- Ari handles business_setup + all LOW priority (competitor, macro)
- Amanda handles lifestyle + jobs
- Dea handles employment + social media
- Zero's categories are ONLY for zero@balizero.com (no team sharing)

---

**Created**: 2025-10-10
**To be implemented in**: Stage 2 (AI Processing + Email Routing)
