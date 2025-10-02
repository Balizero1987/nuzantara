# 🕷️ ZANTARA Agent Scraping System - Complete Workflow

**Created**: 2025-10-02
**Version**: 1.0
**Status**: Design Complete - Ready for Implementation

---

## 🎯 Overview

Sistema di scraping giornaliero automatico con:
- ✅ Scraping multi-domain (5 agenti)
- ✅ Processing AI (Ollama)
- ✅ Human approval (Collaboratore Bali Zero)
- ✅ Upload automatico ChromaDB
- ✅ Zero downtime (auto-refresh)

---

## 📊 Workflow Completo (7 Steps)

### **STEP 1: Daily Scraping (Cron 2 AM) - Automatic**

**Chi**: TypeScript Agents (parallel execution)
**Quando**: Ogni giorno alle 02:00 AM
**Dove**: `src/agents/*-scraper.ts`

**Agents**:
```
├─ visa-oracle-scraper.ts → imigrasi.go.id
├─ legal-architect-scraper.ts → mahkamahagung.go.id
├─ kbli-eye-scraper.ts → oss.go.id
├─ tax-genius-scraper.ts → pajak.go.id
└─ property-sage-scraper.ts → atrbpn.go.id
```

**Output**: `data/raw/YYYY-MM-DD_[domain]_raw.json`

**Esempio Output**:
```json
[
  {
    "id": "visa-c1-20251002",
    "raw_content": "C1 Tourism Visa 60 days IDR 2,300,000 extendable 2x60 days...",
    "metadata": {
      "source": "imigrasi.go.id",
      "scraped_at": "2025-10-02T02:00:00Z",
      "status": "raw"
    }
  }
]
```

---

### **STEP 2: Ollama Processing - Automatic**

**Chi**: Ollama Local (llama3.2:3b)
**Quando**: Subito dopo scraping (02:01-02:30 AM)
**Dove**: `src/services/ollama-processor.ts`

**Tasks Ollama**:
1. ✅ Clean HTML/messy text
2. ✅ Extract structured fields (price, dates, requirements)
3. ✅ Generate 2-sentence summary
4. ✅ Detect changes vs previous scrape
5. ✅ Quality scoring (0-1)
6. ✅ Flag suspicious data (price anomalies, missing fields)

**Output**: `data/processed/YYYY-MM-DD_[domain]_processed.json`

**Esempio Output**:
```json
{
  "domain": "visa",
  "scrape_date": "2025-10-02T02:15:00Z",
  "documents": [
    {
      "id": "visa-c1-20251002",
      "content": "C1 Tourism Visa: 60 days duration, IDR 2,300,000 initial cost, extendable 2x60 days...",
      "ollama_summary": "No changes from previous scrape. All visa details confirmed.",
      "quality_score": 0.95,
      "flags": [],
      "changes": {
        "new_document": false,
        "updated": false,
        "price_changed": false
      }
    }
  ],
  "summary": {
    "total_scraped": 52,
    "new_documents": 3,
    "updated_documents": 2,
    "unchanged": 47,
    "suspicious": 0,
    "quality_avg": 0.93
  }
}
```

---

### **STEP 3: Email to Collaborator - Automatic**

**Chi**: TypeScript Email Notifier
**Quando**: 02:30 AM (dopo Ollama processing)
**A chi**: collaborator@balizero.com (+ CC admin@balizero.com)
**Dove**: `src/services/email-notifier.ts`

**Email Content**:
```
Subject: 🕷️ ZANTARA Daily Scraping - 2025-10-02 - Review Required

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕷️ ZANTARA Daily Scraping Report
Date: October 2, 2025 02:30 AM

📊 SUMMARY BY DOMAIN:

1. 🛂 VISA ORACLE (imigrasi.go.id)
   • Total scraped: 52 documents
   • New: 3
   • Updated: 2
   • Unchanged: 47
   • Quality: 95%
   • ⚠️ Suspicious: 0

2. ⚖️ LEGAL ARCHITECT (mahkamahagung.go.id)
   • Total scraped: 8 documents
   • New: 1 (MA 4521 K/Pdt/2024)
   • Quality: 92%

[... altri domini ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 ACTION REQUIRED:

🔗 Review Portal: https://zantara-admin.balizero.com/review/2025-10-02

OR

📁 Manual Review: data/processed/2025-10-02_*.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ ITEMS REQUIRING ATTENTION:
[Lista documenti flagged da Ollama, se presenti]

📊 NEXT STEPS:
1. Review data at portal or files
2. Approve/Reject/Edit documents
3. Click "Upload to ChromaDB" when ready
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### **STEP 4: Human Review - Manual**

**Chi**: Collaboratore Bali Zero
**Quando**: Mattina (quando vede email)
**Dove**: `https://zantara-admin.balizero.com/review/YYYY-MM-DD`

**Web Interface**:
```
┌─────────────────────────────────────────────────────┐
│ ZANTARA Review Portal - October 2, 2025            │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 🛂 VISA ORACLE (52 documents)                       │
│ ├─ [✓] All 52 documents                            │
│ └─ [✓] Approve for upload                          │
│                                                      │
│ 🏢 KBLI EYE (120 documents) ⚠️ 2 FLAGGED           │
│ ├─ [✓] 118 approved documents                      │
│ ├─ [ ] KBLI 56301 - Capital change (REVIEW)       │
│ │   Before: IDR 10,000,000,000                     │
│ │   After:  IDR 5,000,000,000                      │
│ │   [Approve] [Reject] [Edit]                      │
│ │                                                   │
│ └─ [ ] KBLI 70209 - New restriction (REVIEW)      │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ [UPLOAD SELECTED TO CHROMADB] (218 docs)      │ │
│ └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Azioni Possibili**:
- ✅ Approve all (bulk action)
- ✅ Approve selected (checkbox)
- ❌ Reject documents (with reason)
- ✏️ Edit documents (fix typos, correct data)
- 📋 Add notes (for future reference)

---

### **STEP 5: Upload to ChromaDB - Automatic (After Approval)**

**Chi**: Python Script
**Quando**: Subito dopo click "Upload to ChromaDB"
**Dove**: `scripts/chromadb-uploader.py`

**Process**:
```python
1. Load approved documents from review portal
2. Generate embeddings (SentenceTransformer or Ollama)
3. Check for duplicates (by ID)
4. Update existing OR insert new
5. Upload to ChromaDB collections:
   ├─ visa_oracle_kb/
   ├─ legal_architect_kb/
   ├─ kbli_codes_kb/
   ├─ tax_genius_kb/
   └─ property_sage_kb/
```

**Embedding Model Options**:
- **Default**: SentenceTransformer `all-MiniLM-L6-v2` (80MB, local, free)
- **Alternative**: Ollama `nomic-embed-text` (274MB, local, free)

**Output Report**:
```json
{
  "upload_date": "2025-10-02T09:15:00Z",
  "approved_by": "collaborator@balizero.com",
  "total_uploaded": 217,
  "total_rejected": 2,
  "embeddings_generated": 217,
  "chromadb_size": "18,567 documents (from 18,350)",
  "time_taken": "45 seconds"
}
```

---

### **STEP 6: Confirmation Email - Automatic**

**Chi**: Python Script
**Quando**: Subito dopo upload
**A chi**: Collaboratore + Admin

**Email Content**:
```
Subject: ✅ ChromaDB Upload Complete - 2025-10-02

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ChromaDB Upload Successful

📊 UPLOAD SUMMARY:
✅ Uploaded: 217 documents
❌ Rejected: 2 documents
📦 ChromaDB size: 18,567 (from 18,350)
⏱️ Time: 45 seconds

BY DOMAIN:
├─ Visa: 52 documents
├─ Legal: 8 documents
├─ KBLI: 118 documents (2 rejected)
├─ Tax: 15 documents
└─ Property: 24 documents

🔄 REFRESH STATUS:
Python RAG backend will auto-detect new data.
No manual restart needed.

Next scraping: October 3, 2025 02:00 AM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### **STEP 7: Automatic Refresh - No Restart Needed**

**Chi**: ChromaDB PersistentClient
**Quando**: Immediate (dopo upload)
**Dove**: Python RAG Backend

**How it Works**:
```python
# Python RAG uses PersistentClient (auto-reload)
client = chromadb.PersistentClient(path="./data/chroma_db")

# New queries automatically see updated data
collection = client.get_collection("visa_oracle_kb")

# Next user query will find NEW documents
results = collection.query(query_texts=["Quanto costa KITAS?"])
# ✅ Returns fresh data uploaded today
```

**User Experience**:
```
User (10:00 AM): "Quanto costa KITAS investor?"
  ↓
RAG Backend queries ChromaDB
  ↓
Finds NEW visa data (uploaded at 09:15 AM)
  ↓
Claude generates answer with fresh data
  ↓
User sees: "Per il tuo KITAS da investitore servono 17 milioni di rupie
           (dati aggiornati al 2 ottobre 2025)"
```

**No Restart Required** ✅

---

## 🛠️ Implementation Components

### **File Structure**:
```
NUZANTARA/
├── src/
│   ├── agents/
│   │   ├── visa-oracle-scraper.ts
│   │   ├── legal-architect-scraper.ts
│   │   ├── kbli-eye-scraper.ts
│   │   ├── tax-genius-scraper.ts
│   │   └── property-sage-scraper.ts
│   ├── services/
│   │   ├── ollama-processor.ts
│   │   ├── email-notifier.ts
│   │   └── chromadb-uploader.ts (Python wrapper)
│   ├── cron/
│   │   └── daily-knowledge-update.ts
│   └── admin/
│       └── review-portal.ts (Express server)
├── scripts/
│   └── chromadb-uploader.py
├── data/
│   ├── raw/ (scraped data)
│   ├── processed/ (Ollama-processed)
│   └── approved/ (human-approved)
└── zantara-rag/backend/
    └── data/chroma_db/ (ChromaDB storage)
```

---

## ⚙️ Configuration

### **Environment Variables** (`.env`):
```bash
# Email
EMAIL_USER=noreply@balizero.com
EMAIL_APP_PASSWORD=xxxx (Gmail app-specific password)

# Ollama
OLLAMA_URL=http://localhost:11434

# Review Portal
ADMIN_PORTAL_URL=https://zantara-admin.balizero.com
ADMIN_PORTAL_PORT=3001

# Collaborator
COLLABORATOR_EMAIL=collaborator@balizero.com
ADMIN_EMAIL=admin@balizero.com

# ChromaDB
CHROMADB_PATH=./zantara-rag/backend/data/chroma_db
```

---

## 📅 Daily Schedule

```
02:00 AM - Scrapers start (parallel)
02:01 AM - visa-oracle scraping...
02:02 AM - legal-architect scraping...
02:03 AM - kbli-eye scraping...
02:04 AM - tax-genius scraping...
02:05 AM - property-sage scraping...

02:06 AM - All scrapers complete
02:07 AM - Ollama processing starts
02:08 AM - Processing visa data...
02:10 AM - Processing legal data...
[...]
02:25 AM - Ollama processing complete

02:30 AM - Email sent to collaborator

09:00 AM - Collaborator reviews (example time)
09:10 AM - Collaborator approves 217 docs, rejects 2
09:11 AM - Upload to ChromaDB starts
09:12 AM - Upload complete
09:13 AM - Confirmation email sent

09:13 AM - ChromaDB live with new data ✅
```

---

## 🎯 Key Features

### **1. Zero Downtime**
- ✅ ChromaDB auto-refresh (PersistentClient)
- ✅ No backend restart needed
- ✅ Users see fresh data immediately

### **2. Quality Control**
- ✅ Ollama AI examination (quality scoring)
- ✅ Human approval (collaborator review)
- ✅ Suspicious data flagging

### **3. Auditability**
- ✅ All raw data saved (`data/raw/`)
- ✅ Processing history (`data/processed/`)
- ✅ Approval decisions (`data/approved/`)
- ✅ Email trail (collaborator + admin)

### **4. Flexibility**
- ✅ Approve all (bulk)
- ✅ Approve selected (granular)
- ✅ Edit documents (fix errors)
- ✅ Reject with reason (audit trail)

---

## 📊 Metrics & Reporting

### **Daily Report Includes**:
- Total documents scraped (by domain)
- New vs updated vs unchanged
- Quality scores (average per domain)
- Suspicious items flagged
- Approval/rejection counts
- Upload time & success rate

### **Weekly Report** (Optional):
- 7-day scraping summary
- Quality trends
- Most active domains
- Error rates
- ChromaDB growth chart

---

## 🚀 Next Steps (Implementation)

### **Phase 1: Core System** (12-15h)
1. ✅ Implement 5 scrapers (visa, legal, kbli, tax, property)
2. ✅ Ollama processor service
3. ✅ Email notification system
4. ✅ Cron job orchestrator

### **Phase 2: Review Interface** (8-10h)
1. ✅ Web portal (Express + simple HTML)
2. ✅ Document approval/rejection UI
3. ✅ Edit functionality
4. ✅ Bulk actions

### **Phase 3: Upload System** (4-6h)
1. ✅ Python ChromaDB uploader
2. ✅ Duplicate detection
3. ✅ Confirmation emails
4. ✅ Error handling

### **Phase 4: Testing & Deployment** (6-8h)
1. ✅ Test all scrapers
2. ✅ Test Ollama processing
3. ✅ Test approval workflow
4. ✅ Deploy to production

**Total Estimated Time**: 30-40h

---

## ⚠️ Important Notes

### **Ollama Limitations**:
- ❌ Cannot send emails (TypeScript/Python does this)
- ❌ Cannot scrape web (TypeScript/Python does this)
- ❌ Cannot upload to ChromaDB (Python does this)
- ✅ CAN process/clean/structure text
- ✅ CAN generate summaries
- ✅ CAN detect anomalies

### **Human Review is Critical**:
- Ollama can make mistakes (hallucinations)
- Legal data requires expert verification
- Price changes need human confirmation
- New regulations need context validation

### **ChromaDB Auto-Refresh**:
- Works with PersistentClient (no restart)
- New queries automatically see new data
- No cache invalidation needed
- Zero downtime deployment

---

## 📞 Support & Maintenance

### **Daily Monitoring**:
- Check cron logs: `tail -f logs/daily-scraping.log`
- Verify email delivery
- Monitor ChromaDB size

### **Weekly Tasks**:
- Review rejected documents (why?)
- Check quality score trends
- Update scraper selectors (if sites change)
- Backup ChromaDB

### **Monthly Tasks**:
- Audit approval decisions
- Review Ollama accuracy
- Optimize scraper performance
- Archive old raw data

---

**End of Workflow Documentation**

Created: 2025-10-02
Last Updated: 2025-10-02
Version: 1.0
