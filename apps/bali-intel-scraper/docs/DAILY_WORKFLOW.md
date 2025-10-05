# 📅 Daily Workflow - Bali Intel Collaborators

**Complete step-by-step guide for daily intelligence gathering**

---

## 🕐 Morning Routine (9:00 - 12:00)

Total time: ~50 minutes per day

---

## Step 1: Scraping (9:00 AM, 5-10 min)

### **Navigate to project**:
```bash
cd ~/Desktop/NUZANTARA-2/apps/bali-intel-scraper
```

### **Run your assigned script**:

**Immigration & Visas**:
```bash
python3 scripts/scrape_immigration.py
```

**BKPM/KBLI/Tax**:
```bash
python3 scripts/scrape_bkpm_tax.py
```

**Real Estate**:
```bash
python3 scripts/scrape_realestate.py
```

**Events & Culture**:
```bash
python3 scripts/scrape_events.py
```

**Social Trends**:
```bash
python3 scripts/scrape_social.py
```

**Competitors**:
```bash
python3 scripts/scrape_competitors.py
```

**General Bali News**:
```bash
python3 scripts/scrape_bali_news.py
```

**Weekend Roundup** (Saturday/Sunday):
```bash
python3 scripts/scrape_roundup.py
```

### **Expected Output**:
```
🔍 Scraping [TOPIC] sources...
✅ Source 1 → X articles
✅ Source 2 → Y articles
...
✅ Total: 45 articles scraped
📁 Saved to: data/raw/[topic]_raw_20250110.csv
```

### **What to do**:
- ✅ Wait for script to complete (5-10 min)
- ✅ Note the output filename
- ⚠️ If errors appear for some sources, that's normal - script continues automatically

---

## Step 2: Structuring with AI (9:30 AM, 30 min)

### **2.1 Open Claude or ChatGPT**:
- Claude: https://claude.ai
- ChatGPT: https://chat.openai.com

### **2.2 Upload CSV**:
1. Click "Attach file" or 📎 icon
2. Navigate to: `data/raw/[topic]_raw_YYYYMMDD.csv`
3. Upload

### **2.3 Copy the structuring prompt**:
- Immigration: Open `templates/prompt_immigration.md`
- BKPM/Tax: Open `templates/prompt_bkpm_tax.md`
- Real Estate: Open `templates/prompt_realestate.md`
- Events: Open `templates/prompt_events.md`
- Social: Open `templates/prompt_social.md`
- Competitors: Open `templates/prompt_competitors.md`
- Bali News: Open `templates/prompt_bali_news.md`
- Roundup: Open `templates/prompt_roundup.md`

### **2.4 Edit the prompt**:
Replace `[INSERT TODAY'S DATE]` with actual date (e.g., "January 10, 2025")

### **2.5 Paste into Claude/ChatGPT**:
Click "Send" and wait (~2-5 min for processing)

### **2.6 Download structured JSON**:
1. Claude will output a JSON block
2. Copy the entire JSON
3. Save to: `data/structured/[topic]_structured_YYYYMMDD.json`

### **2.7 Validate JSON** (optional but recommended):
```bash
python3 -m json.tool data/structured/[topic]_structured_YYYYMMDD.json
```

Should output: "JSON is valid" or reformatted JSON

---

## Step 3: Upload to ChromaDB (10:30 AM, 10 min)

### **3.1 Run upload script**:
```bash
python3 scripts/upload_to_chromadb.py [topic]_structured_YYYYMMDD.json
```

### **Expected Output**:
```
📤 Uploading to ChromaDB...
✅ Collection: bali_intel_immigration
✅ Uploaded: 45 items
✅ Embeddings generated: 45
✅ Total in collection: 287 items
⏱️  Upload time: 45 seconds
```

### **What happens**:
- JSON parsed and validated
- Each news item embedded (384-dim vector via sentence-transformers)
- Uploaded to ChromaDB collection `bali_intel_[topic]`
- Metadata indexed (tier, date, category, etc.)

---

## Step 4: Verification (11:00 AM, 5 min)

### **4.1 Verify upload**:
```bash
python3 scripts/verify_upload.py [topic] YYYYMMDD
```

### **Expected Output**:
```
✅ Verification Report - Immigration (2025-01-10)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Upload Statistics:
   - Items uploaded: 45
   - Tier 1: 9 (20%)
   - Tier 2: 23 (51%)
   - Tier 3: 13 (29%)

📅 Freshness:
   - <24h: 38 (84%)
   - 24-48h: 7 (16%)
   - >48h: 0 (0%)

🎯 Impact Levels:
   - Critical: 2
   - High: 12
   - Medium: 21
   - Low: 10

✅ Quality: PASSED
✅ All KPIs met
```

### **4.2 Review critical items** (if any):
```bash
python3 scripts/review_critical.py [topic] YYYYMMDD
```

Shows items flagged as "critical" or "action_required"

---

## Step 5: Reporting (11:30 AM, 5 min)

### **5.1 Send daily summary to Slack**:
Script automatically posts to #intel-[topic] channel:

```
📰 Immigration Intel - Jan 10, 2025

✅ 45 news items processed
🚨 2 critical items
⚡ 5 action required
🔥 Trending: "Golden Visa E28C changes"

🔗 Full report: [link]
```

### **5.2 Flag urgent items**:
If any "critical" items, mention in Slack thread with summary:

```
🚨 URGENT: New KITAS regulation

Summary: Kemenkumham announced E28A processing time reduced from 14 to 7 days, effective Feb 1, 2025.

Impact: HIGH - All pending applications
Action: Update Bali Zero pricing/timeline
Deadline: 2025-02-01

Source (T1): https://kemenkumham.go.id/...
```

---

## ✅ Daily Checklist

Before finishing, verify:

- [ ] Scraping completed (CSV file created)
- [ ] AI structuring done (JSON validated)
- [ ] Upload to ChromaDB successful
- [ ] Verification passed
- [ ] Critical items flagged (if any)
- [ ] Slack summary posted

**Total time**: ~50 minutes

---

## 🐛 Troubleshooting

### **Scraping failed with timeout errors**
**Cause**: Source website down or slow
**Solution**: Normal - script skips and continues. Note in Slack if major source fails.

### **Claude/ChatGPT refuses to process CSV**
**Cause**: CSV too large (>4MB)
**Solution**: Split CSV into 2 batches, process separately, merge JSON files

### **ChromaDB upload fails**
**Cause**: Network issue or ChromaDB service down
**Solution**: Retry after 5 min. If persists, contact tech team.

### **JSON validation error**
**Cause**: Claude outputted invalid JSON
**Solution**: Ask Claude to "fix JSON syntax" and re-download

---

## 📊 Weekly Tasks

### **Friday afternoon** (30 min):
- Review weekly stats:
  ```bash
  python3 scripts/weekly_report.py [topic]
  ```
- Identify trending topics
- Report findings in weekly standup

### **Saturday/Sunday** (Weekend Roundup collaborator):
- Run comprehensive analysis script
- Deep-dive articles from all topics
- Prepare executive summary

---

## 🎓 Tips for Efficiency

1. **Run scraping first thing** - let it run while you check email
2. **Batch structuring** - upload CSV, grab coffee while Claude processes
3. **Bookmark sources** - add frequently-failed sources to "watch list"
4. **Note patterns** - if certain sources consistently have news, check them manually
5. **Weekend prep** - Friday afternoon, queue Saturday's scraping

---

## 📞 Support

**Technical issues**: #intel-support Slack channel
**Content questions**: zero@balizero.com
**Urgent/critical news**: Tag @zero in Slack immediately

---

**Workflow Version**: 1.0.0
**Last Updated**: 2025-10-05
**Est. Daily Time**: 50 minutes
