# 🔄 INTEL SYSTEM - WORKFLOW & CLEANUP STRATEGY

**Date**: 2025-10-10 08:45 WITA
**Session**: Sonnet 4.5 m4
**Status**: Ready for Cleanup & Reactivation

---

## 📋 PARTE 1: WORKFLOW COMPLETO

### **STAGE 1: SCRAPING (Automatico Daily)**

**Trigger**: GitHub Actions cron `0 22 * * *` (6:00 AM Bali time)

**Process**:
```
1. GitHub Runner starts (ubuntu-latest)
2. Install Python 3.13 + dependencies
3. Install Playwright browsers (chromium)
4. Execute: python3 scripts/run_intel_automation.py
   ↓
5. Crawl4AI scrapes 240+ sources across 34 categories
   ↓
6. Save to: INTEL_SCRAPING/{category}/raw/
   - Format: YYYYMMDD_HHMMSS_source_hash.json
   - Format: YYYYMMDD_HHMMSS_source_hash.md
```

**Output**: ~50-100 raw files per day

---

### **STAGE 2A: RAG PROCESSING (Claude API or LLAMA 3.2 Local)**

**Process**:
```
For each raw file:
1. Read JSON content
2. Chunk text (semantic chunking)
3. Generate embeddings
4. Prepare for ChromaDB
   ↓
5. Save to: INTEL_SCRAPING/{category}/rag/
   - Format: YYYYMMDD_HHMMSS_source_hash.json
```

**Output**: ~50-100 rag files per day (ChromaDB-ready)

---

### **STAGE 2B: CONTENT CREATION (Claude API or LLAMA 3.2 Local)**

**Process**:
```
For each category with new raw data:
1. Aggregate raw documents (3-5 most recent)
2. Generate professional article:
   - Title (SEO-optimized)
   - Summary (1-2 sentences)
   - Key Takeaways (3-5 bullet points)
   - Body (400-500 words, H2/H3 structured)
   - Conclusion
   ↓
3. Save to: INTEL_ARTICLES/
   - Format: YYYYMMDD_HHMMSS_{category}.json
   - Format: YYYYMMDD_HHMMSS_{category}.md
```

**Output**: ~16-22 articles per day (professional quality)

---

### **STAGE 3: EDITORIAL REVIEW (Claude Opus API)** ⏳

**Process** (planned, not yet deployed):
```
For each generated article:
1. Quality check (grammar, tone, accuracy)
2. Fact verification
3. SEO optimization suggestions
4. Approve/Reject/Revise
   ↓
5. Approved → Mark for publishing
```

**Output**: ~10-15 approved articles per day

---

### **STAGE 4: MULTI-CHANNEL PUBLISHING** ⏳

**Process** (planned, not yet deployed):
```
For each approved article:
1. Adapt content for each channel:
   - Twitter (280 chars, 🧵 thread)
   - Facebook (rich text + image)
   - Instagram (caption + carousel)
   - Telegram (formatted message)
   - WhatsApp (text message)
   - Email (HTML newsletter)
   ↓
2. Schedule posting (optimal times)
3. Publish to all channels
4. Track engagement
```

**Output**: 60-90 social media posts per day

---

## 👥 PARTE 2: CATEGORIE + EMAIL COLLABORATORI

### **MAPPING COMPLETO**

| # | Categoria | Collaboratore | Email | Status |
|---|-----------|---------------|-------|--------|
| 1 | **Immigration_Visas** | Adit | adit@balizero.com | ✅ Active |
| 2 | **Business_Tax** | Dea | dea@balizero.com | ✅ Active |
| 3 | **Real_Estate** | Krisna | krisna@balizero.com | ✅ Active |
| 4 | **Events_Culture** | Surya | surya@balizero.com | ✅ Active |
| 5 | **Social_Media** | Sahira | sahira@balizero.com | ✅ Active |
| 6 | **Competitors** | Damar | damar@balizero.com | ✅ Active |
| 7 | **General_News** | Vino | vino@balizero.com | ✅ Active |

---

### **DETTAGLIO PER CATEGORIA**

#### **1. Immigration & Visas** (Adit)
**Email**: adit@balizero.com
**Fonti Priority**:
- Imigrasi Indonesia (https://www.imigrasi.go.id)
- Kemenkumham (https://www.kemenkumham.go.id)
- Kedutaan Indonesia (https://kemlu.go.id)

**Cosa cercare**:
- New visa rules (D12, C1, C18, C22, D2, ALL VISAS)
- KITAS/KITAP procedure changes
- Important deadlines
- New visa types or permits
- Overstay penalties/fines
- Golden Visa updates

---

#### **2. Business & Tax** (Dea)
**Email**: dea@balizero.com
**Fonti Priority**:
- BKPM (https://www.bkpm.go.id)
- OSS Indonesia (https://oss.go.id)
- Ditjen Pajak (https://www.pajak.go.id)

**Cosa cercare**:
- New PT/PMA rules
- Tax rate changes
- New KBLI codes
- OSS system updates
- Tax incentives/holidays
- Reporting deadlines (SPT, LKPM)
- Capital requirement changes
- Foreign ownership rules
- BPJS updates

---

#### **3. Real Estate** (Krisna)
**Email**: krisna@balizero.com
**Fonti Priority**:
- BPN (https://www.bpn.go.id)
- Kementerian PUPR (https://www.pu.go.id)
- BPS Real Estate (https://www.bps.go.id)

**Cosa cercare**:
- Hak Pakai rule changes
- Building permit (IMB/PBG) updates
- Foreign ownership regulations
- Property tax changes
- Land certificate issues
- Zoning regulation updates
- Construction permit changes
- Environmental clearance rules
- Strata title regulations

---

#### **4. Events & Culture** (Surya)
**Email**: surya@balizero.com
**Fonti Priority**:
- Kemenparekraf (https://kemenparekraf.go.id)
- Bali Provincial Government (https://www.baliprov.go.id)
- Ministry of Education and Culture (https://kebudayaan.kemdikbud.go.id)

**Cosa cercare**:
- Festival dates and calendar
- Cultural event announcements
- Tourism regulation changes
- Nyepi preparations/rules
- Galungan/Kuningan dates
- Temple ceremony schedules
- Art exhibition openings
- Music festival announcements
- Cultural site closures/openings
- Traditional ceremony guidelines

---

#### **5. Social Media** (Sahira)
**Email**: sahira@balizero.com
**Fonti Priority**:
- Instagram Trending (#bali #indonesia #viral)
- TikTok Indonesia (trending videos)
- Facebook Groups (Bali Expat, Indonesia Social)

**Cosa cercare**:
- Viral trends about Bali/Indonesia
- Influencer news (local/international)
- Social media regulation changes
- Platform policy updates (Instagram, TikTok, FB)
- Digital marketing trends
- Social commerce developments
- Creator economy news
- Content moderation updates
- Privacy policy changes

---

#### **6. Competitors** (Damar)
**Email**: damar@balizero.com
**Fonti Priority**:
- Cekindo (https://www.cekindo.com/blog)
- Emerhub (https://emerhub.com/indonesia)
- Sinta Prima (https://sintaprima.com)

**Cosa cercare**:
- New services launched
- Pricing changes/promotions
- Team expansion/new hires
- Office openings/relocations
- Marketing campaigns
- Client testimonials/case studies
- Partnership announcements
- Technology upgrades
- Process improvements
- Competitive advantages claimed

---

#### **7. General News** (Vino)
**Email**: vino@balizero.com
**Fonti Priority**:
- Kompas (https://kompas.com)
- Detik (https://detik.com)
- Tempo (https://tempo.co)

**Cosa cercare**:
- Politics affecting expats
- Economic policy changes
- Government regulation updates
- International relations news
- Currency/economic developments
- Infrastructure projects (Bali/Indonesia)
- Natural disaster warnings
- Health/safety announcements
- Transportation updates
- General Bali-specific news

---

## 📁 PARTE 3: STRATEGIA DI CLEANUP

### **OBIETTIVO**
Consolidare tutto in **UNA SOLA LOCATION** ben organizzata, eliminare duplicati, archiviare backup.

---

### **SITUAZIONE ATTUALE (Disorganizzato)**

```
NUZANTARA-2/
├── INTEL_ARTICLES (236 KB) ← 44 files (articoli 9 Ott - copied from scraper)
│   └── [ANALYSIS]: Identical MD5 to scraper output, just newer timestamps
│       Example: 20251009_112857_macro_policy.md
│       - Root: MD5 7f34d284808a0eb3a8813de2b9be45f7 (timestamp 2025-10-10 03:28)
│       - Scraper: MD5 7f34d284808a0eb3a8813de2b9be45f7 (timestamp 2025-10-09 11:28)
│       → DUPLICATES (safe to delete root copy)
│
├── INTEL_SCRAPING (2.7 MB) ← 171 files (scraping 7-9 Ott)
├── apps/bali-intel-scraper/output/INTEL_ARTICLES (78 files) ← CANONICAL
│   ├── articles/ (20 MD files - originals)
│   ├── metadata/ (20 JSON files)
│   ├── INDEX.md
│   └── EMAIL_PREVIEW_20251009_115413.html
└── 40+ documentation files (sparsi)
```

**Problemi**:
1. ❌ INTEL_ARTICLES duplicated in root (identical to scraper output - copied by mistake)
2. ❌ Documentation sparsa (root + apps/ + docs/)
3. ❌ Unclear quale è "source of truth"

---

### **STRATEGIA DI CLEANUP** ⭐

#### **STEP 1: Definire "Source of Truth"**

**DECISIONE**: **apps/bali-intel-scraper/** = Sistema V2 canonical

**Motivo**:
- ✅ Sistema self-contained (scripts + output + docs + configs)
- ✅ V2 architecture (production-ready)
- ✅ 18 scripts production
- ✅ Già consolidato (cleanup 9 Ott)
- ✅ Ready per containerizzazione

---

#### **STEP 2: Consolidamento Files**

**AZIONE 1**: Merge INTEL_ARTICLES
```bash
# Unire i 2 INTEL_ARTICLES
# Location 1: /INTEL_ARTICLES (44 files, 9 Oct 11:28-11:53)
# Location 2: /apps/bali-intel-scraper/output/INTEL_ARTICLES (78 files)

# Plan:
1. Identificare duplicati (stesso timestamp)
2. Copiare files unici da Location 1 → Location 2
3. Eliminare Location 1 (dopo verifica)
4. Risultato: 1 sola INTEL_ARTICLES in apps/bali-intel-scraper/output/
```

**AZIONE 2**: Consolidare INTEL_SCRAPING
```bash
# INTEL_SCRAPING rimane in root (OK - used by GitHub Actions)
# Motivo: workflow referenzia scripts/INTEL_SCRAPING/*/raw/*.json
# NON SPOSTARE (rischia di rompere automation)
```

**AZIONE 3**: Documentation cleanup
```bash
# Consolidare documentazione sparsa:
# Root (15+ docs) → apps/bali-intel-scraper/docs/ROOT_DOCS/
# Mantenere links symbolici in root per backward compatibility

# Files da consolidare:
- INTEL_SCRAPING_REPORT_20251009.md
- INTEL_SCRAPING_V2_MIGRATION_COMPLETE.md
- INTEL_SOURCES_EXPANSION_COMPLETE.md
- INTEL_SYSTEM_STATUS.md
- INTEL_WORKFLOW_DOCUMENTATION.md
- QUICKSTART_INTEL_AUTOMATION.md
- (+ altri 10 files)
```

---

#### **STEP 3: Archive Cleanup**

**AZIONE**: Eliminare _INTEL_SYSTEM_OLD_ARCHIVE (11 MB)
```bash
# Verificare prima:
1. Controllare se ci sono files unici in archive
2. Se sì → Estrarre e consolidare
3. Se no → Eliminare completamente

# Comando:
rm -rf /Users/antonellosiano/Desktop/NUZANTARA-2/_INTEL_SYSTEM_OLD_ARCHIVE
```

**Ragione**: Sistema V2 verified working (9 Ott), old backup non più necessario

---

#### **STEP 4: GitHub Actions Fix**

**AZIONE**: Fix workflow YAML (1-line change)
```yaml
# File: .github/workflows/intel-automation.yml

# BEFORE (broken):
- name: Install system dependencies
  run: |
    playwright install chromium  # ❌ Fails: command not found

- name: Install Python dependencies
  run: |
    pip install -r requirements.txt

# AFTER (fixed):
- name: Install Python dependencies
  run: |
    pip install -r requirements.txt  # Install playwright package first

- name: Install Playwright browsers
  run: |
    playwright install chromium  # Now works
```

---

### **STRUTTURA FINALE (Post-Cleanup)**

```
NUZANTARA-2/
├── apps/bali-intel-scraper/ (CANONICAL V2)
│   ├── scripts/ (18 production scripts)
│   ├── output/
│   │   └── INTEL_ARTICLES/ (122 files - merged)
│   │       ├── articles/ (61 MD)
│   │       ├── metadata/ (61 JSON)
│   │       ├── INDEX.md
│   │       └── EMAIL_PREVIEW.html
│   ├── docs/
│   │   ├── ROOT_DOCS/ (consolidated documentation)
│   │   ├── SETUP_GUIDE_MAC.md
│   │   ├── TROUBLESHOOTING.md
│   │   └── (+ altri 10 files)
│   ├── templates/ (10 AI prompts)
│   ├── sites/ (9 YAML configs)
│   ├── data/
│   ├── google-drive-setup.gs (collaborator setup)
│   ├── README.md
│   └── (+ 10 other docs)
│
├── INTEL_SCRAPING/ (2.7 MB - KEEP for GitHub Actions)
│   ├── regulatory_changes/
│   ├── competitor_intel/
│   ├── business_bkpm/
│   └── (+ 31 other categories)
│
├── .github/workflows/intel-automation.yml (FIXED)
│
└── (Documentation symlinks in root for compatibility)
```

**Risultato**:
- ✅ 1 sistema canonical (apps/bali-intel-scraper/)
- ✅ INTEL_SCRAPING in root (GitHub Actions compatibility)
- ✅ Documentation consolidata
- ✅ Archive eliminato
- ✅ Workflow fixed
- ✅ Ready for production

---

## 📊 CLEANUP BENEFITS

### **Before Cleanup**
- 4 locations (confusing)
- Duplicate files (INTEL_ARTICLES × 2)
- 11 MB old archive
- Documentation sparsa (40+ files in 3+ places)
- Total: ~15 MB scattered

### **After Cleanup**
- 2 locations (canonical + working dir)
- No duplicates
- 0 MB archive
- Documentation consolidated
- Total: ~4 MB organized

### **Savings**
- ✅ -11 MB disk space
- ✅ -2 locations (4 → 2)
- ✅ -50% confusion
- ✅ +100% maintainability

---

## 🎯 EXECUTION PLAN

### **Fase 1: Pre-Cleanup Verification** (5 min)
```bash
# 1. Verify no unique files in archive
find _INTEL_SYSTEM_OLD_ARCHIVE -type f -newer INTEL_SCRAPING
# If empty → Safe to delete

# 2. Identify duplicates between INTEL_ARTICLES locations
diff -r INTEL_ARTICLES apps/bali-intel-scraper/output/INTEL_ARTICLES
# Copy unique files
```

### **Fase 2: Merge INTEL_ARTICLES** (10 min)
```bash
# Copy unique files from root to apps/
cp INTEL_ARTICLES/20251009_112857_*.* apps/bali-intel-scraper/output/INTEL_ARTICLES/

# Verify count
ls apps/bali-intel-scraper/output/INTEL_ARTICLES/ | wc -l
# Expected: 122 files (78 existing + 44 new)

# Delete root copy
rm -rf INTEL_ARTICLES
```

### **Fase 3: Consolidate Documentation** (15 min)
```bash
# Create docs/ROOT_DOCS/
mkdir -p apps/bali-intel-scraper/docs/ROOT_DOCS

# Move documentation
mv INTEL_*.md apps/bali-intel-scraper/docs/ROOT_DOCS/
mv QUICKSTART_INTEL_AUTOMATION.md apps/bali-intel-scraper/docs/ROOT_DOCS/
mv SESSION_REPORT_*.md apps/bali-intel-scraper/docs/ROOT_DOCS/

# Create symlinks in root (backward compatibility)
ln -s apps/bali-intel-scraper/docs/ROOT_DOCS/QUICKSTART_INTEL_AUTOMATION.md QUICKSTART_INTEL_AUTOMATION.md
```

### **Fase 4: Delete Archive** (1 min)
```bash
rm -rf _INTEL_SYSTEM_OLD_ARCHIVE
```

### **Fase 5: Fix GitHub Actions** (2 min)
```bash
# Edit .github/workflows/intel-automation.yml
# Swap install order (pip before playwright)

# Test manual trigger
gh workflow run intel-automation.yml
```

### **Fase 6: Verify & Commit** (5 min)
```bash
# Verify structure
tree -L 2 apps/bali-intel-scraper/

# Commit
git add .
git commit -m "chore: consolidate intel system + fix GitHub Actions workflow"
git push
```

**Total Time**: ~40 minuti

---

## ✅ SUCCESS CRITERIA

Post-cleanup, verify:
- ✅ apps/bali-intel-scraper/output/INTEL_ARTICLES/ has 122 files
- ✅ No INTEL_ARTICLES in root
- ✅ Documentation consolidated in apps/bali-intel-scraper/docs/ROOT_DOCS/
- ✅ _INTEL_SYSTEM_OLD_ARCHIVE deleted
- ✅ GitHub Actions workflow fixed (playwright install order)
- ✅ Git commit clean (no unstaged changes)
- ✅ Disk space freed (~11 MB)

---

## 🚀 POST-CLEANUP: REACTIVATION

### **Test GitHub Actions**
```bash
# Manual trigger
gh workflow run intel-automation.yml

# Monitor
gh run watch

# Expected: SUCCESS (playwright installs, scraping runs)
```

### **Verify Daily Automation**
```
Next scheduled run: Tomorrow 06:00 Bali (22:00 UTC today)
Expected output: ~50-100 new files in INTEL_SCRAPING/
```

---

**STRATEGY READY**: Aspetto tua conferma per eseguire cleanup! 🎯

Vuoi che:
- **A)** Proceda con cleanup completo (40 min)
- **B)** Solo GitHub Actions fix (2 min)
- **C)** Review manuale prima di procedere

?
