# 🐦 Twitter/X Intel Scraping Integration

**Data**: 2025-10-08  
**Status**: ✅ **READY FOR PRODUCTION**

---

## 📋 Overview

Twitter/X scraping è ora integrato nel sistema Intel Automation di ZANTARA. Il sistema monitora conversazioni business, immigrazione, real estate e lifestyle su Twitter/X senza bisogno di API keys.

### **Tecnologia**
- **Tool**: `snscrape` (no API keys required)
- **Formato Output**: Compatibile con Intel pipeline
- **Privacy**: GDPR compliant (anonimizzazione automatica)
- **Rate Limiting**: Built-in delays per evitare blocchi

---

## 🎯 Categorie Monitorate

### **1. Immigration** 🛂
**Accounts**:
- @imigrasi_ri (Official Immigration)
- @Kemenkumham_RI (Ministry of Law)
- @ditjenpimdagri (Directorate General)

**Hashtags**:
- #KITAS, #KITAP, #IndonesiaVisa
- #VisaIndonesia, #Imigrasi, #WorkPermit

**Keywords**:
- "KITAS extend", "visa overstay", "sponsor letter"
- "work permit", "immigration office"

---

### **2. Business/BKPM** 💼
**Accounts**:
- @BKPM_RI (Investment Board)
- @DitjenAHU (Legal Entity Admin)
- @kemendag (Trade Ministry)

**Hashtags**:
- #BKPM, #InvestasiIndonesia, #PTPMA
- #OSS, #PerizinnanUsaha, #BisnisIndonesia

**Keywords**:
- "PT PMA setup", "company registration"
- "OSS system", "business license", "KBLI code"

---

### **3. Real Estate** 🏠
**Accounts**:
- @PropertyGuru_ID
- @rumah_com

**Hashtags**:
- #PropertiIndonesia, #BaliProperty
- #PropertyInvestment, #RealEstateBali

**Keywords**:
- "villa investment", "property ownership"
- "hak pakai", "land certificate", "Bali property"

---

### **4. Events & Culture** 🎭
**Accounts**:
- @baliprov (Bali Province)
- @disparbudpar_bali (Tourism Dept)

**Hashtags**:
- #Bali, #BaliEvents, #BaliCulture
- #EventBali, #BaliLife

---

### **5. General News** 📰
**Accounts**:
- @CNNIndonesia, @tempodotco
- @detikcom, @kompascom

**Hashtags**:
- #Indonesia, #Jakarta, #BeritaIndonesia

---

### **6. Social Media Trends** 📱
**Hashtags**:
- #ViralIndonesia, #TrendingIndonesia
- #GenZIndonesia, #MillennialsIndonesia

---

### **7. Competitors** 🔍
**Accounts**:
- @emerhub
- @cekindo

(Monitor competitors' social presence)

---

## 🚀 Quick Start

### **1. Test Twitter Scraper**
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-2

# Test single category
python3 scripts/test_twitter_scraper.py

# Expected output:
# ✅ All tests passed! Twitter scraper is ready.
```

### **2. Scrape Single Category**
```bash
# Immigration tweets
python3 scripts/twitter_intel_scraper.py --category immigration

# Real estate tweets
python3 scripts/twitter_intel_scraper.py --category real_estate

# All categories
python3 scripts/twitter_intel_scraper.py --category all
```

### **3. Output Location**
```
INTEL_SCRAPING/
├── immigration/
│   └── raw/
│       └── twitter_20251008_143000.json
├── business_bkpm/
│   └── raw/
│       └── twitter_20251008_143500.json
└── twitter_summary_20251008.json
```

---

## 📊 Output Format

### **Tweet Data Structure**
```json
{
  "id": "1234567890",
  "text": "[USER] mentioned that KITAS renewal process takes 3 weeks [LINK]",
  "author": "tw_a3f2c1d8",
  "created_at": "2025-10-08T14:30:00",
  "likes": 15,
  "retweets": 3,
  "replies": 2,
  "lang": "id",
  "hashtags": ["KITAS", "Immigration"],
  "url": "https://twitter.com/.../status/1234567890",
  "source": "twitter",
  "scraped_at": "2025-10-08T14:35:00"
}
```

### **Privacy Features** 🔒
- ✅ Usernames anonymized (`@john_doe` → `tw_a3f2c1d8`)
- ✅ @mentions replaced with `[USER]`
- ✅ URLs replaced with `[LINK]`
- ✅ Emails replaced with `[EMAIL]`
- ✅ Phone numbers replaced with `[PHONE]`

---

## 🔄 Integration with Intel Pipeline

Twitter data flows through the same pipeline as web scraping:

```
Twitter Scraping
    ↓
RAG Processing (LLAMA) → ChromaDB
    ↓
Content Creation (LLAMA) → Draft article
    ↓
Editorial Review (Claude Opus) → Polished
    ↓
Multi-Channel Publishing:
  - Blog
  - Instagram
  - Facebook
  - WhatsApp
  - Telegram
  - Email
```

### **Enable Twitter in Main Pipeline**
Edit `scripts/run_intel_automation.py`:

```python
# Add Twitter scraping before web scraping
async def run_stage_0_twitter(self):
    """Stage 0: Twitter Scraping"""
    logger.info("STAGE 0: TWITTER SCRAPING")
    
    from twitter_intel_scraper import scrape_all_categories_twitter
    
    stats = scrape_all_categories_twitter()
    logger.info(f"Collected {stats['total_tweets']} tweets")
    
    return True
```

---

## ⚙️ Configuration

### **Customize Accounts/Hashtags**
Edit `scripts/twitter_intel_scraper.py`:

```python
# Add more accounts
TWITTER_ACCOUNTS = {
    "immigration": [
        "imigrasi_ri",
        "Kemenkumham_RI",
        "YOUR_NEW_ACCOUNT"  # ← Add here
    ]
}

# Add more hashtags
TWITTER_HASHTAGS = {
    "immigration": [
        "#KITAS",
        "#YourNewHashtag"  # ← Add here
    ]
}
```

### **Adjust Rate Limits**
```python
# In scrape_category_twitter()
time.sleep(3)  # ← Increase if getting rate limited
```

### **Change Date Ranges**
```python
# Accounts: last 7 days
scrape_twitter_account(account, max_tweets=20, since_days=7)

# Hashtags: last 3 days
scrape_twitter_hashtag(hashtag, max_tweets=30, since_days=3)
```

---

## 📈 Performance Metrics

### **Expected Collection Rate**
- **Per Account**: 10-20 tweets/week (active accounts)
- **Per Hashtag**: 30-100 tweets/day (popular hashtags)
- **Total System**: ~500-1000 tweets/day across all categories

### **Timing**
- Single category: 2-3 minutes
- All categories: 15-20 minutes
- Rate limiting: 2-3 seconds between requests

---

## 🛠️ Troubleshooting

### **Error: snscrape not installed**
```bash
pip3 install snscrape

# Or latest version:
pip3 install git+https://github.com/JustAnotherArchivist/snscrape.git
```

### **Error: No tweets collected**
**Possible causes**:
1. Account doesn't exist or is private
2. Date range too narrow (no recent tweets)
3. Rate limit hit (increase sleep times)

**Solution**:
```bash
# Test single account manually
snscrape --max-results 10 twitter-search "from:imigrasi_ri"
```

### **Error: Timeout**
Increase timeout in `_scrape_tweets()`:
```python
timeout=180  # ← Increase to 300 for slow connections
```

---

## 📋 Checklist for Production

- [x] snscrape installed and working
- [x] Twitter scraper created (`twitter_intel_scraper.py`)
- [x] Test script created (`test_twitter_scraper.py`)
- [x] All 7 categories configured
- [x] GDPR anonymization implemented
- [x] Rate limiting configured
- [ ] Integration with `run_intel_automation.py` (optional)
- [ ] Scheduled cron job (optional)
- [ ] Monitoring/alerts setup (optional)

---

## 🎯 Next Steps

### **Immediate** (Ready Now)
1. ✅ Run `test_twitter_scraper.py` to verify
2. ✅ Scrape one category: `python3 scripts/twitter_intel_scraper.py --category immigration`
3. ✅ Review output in `INTEL_SCRAPING/immigration/raw/`

### **Short Term** (This Week)
1. Integrate into `run_intel_automation.py`
2. Add to daily cron job
3. Test full pipeline (Twitter → RAG → Content → Publish)

### **Long Term** (This Month)
1. Add more accounts based on trending topics
2. Implement sentiment analysis on tweets
3. Create Twitter-specific content templates
4. Monitor engagement metrics

---

## 📊 Monitoring

### **Check Daily Stats**
```bash
# View today's summary
cat INTEL_SCRAPING/twitter_summary_$(date +%Y%m%d).json

# Count tweets by category
find INTEL_SCRAPING/*/raw/twitter_*.json -exec jq '.tweets | length' {} \;
```

### **Top Tweets by Engagement**
```python
import json

with open('INTEL_SCRAPING/immigration/raw/twitter_latest.json') as f:
    data = json.load(f)
    
top_tweets = sorted(
    data['tweets'],
    key=lambda t: t['likes'] + t['retweets'],
    reverse=True
)[:10]

for tweet in top_tweets:
    print(f"{tweet['likes']}❤️ {tweet['retweets']}🔄: {tweet['text'][:80]}")
```

---

## 🔐 Privacy & Compliance

### **GDPR Compliance**
- ✅ Usernames anonymized using MD5 hash
- ✅ Personal information removed (@mentions, emails, phones)
- ✅ URLs anonymized
- ✅ Original raw content NOT stored in published output
- ✅ Only sanitized content goes to ChromaDB/publishing

### **Data Retention**
- Raw tweets: 30 days (then deleted)
- RAG data: Permanent (anonymized)
- Published content: Permanent (fully sanitized)

---

**🎉 Twitter/X Intelligence is now LIVE!**

For questions or issues, contact:
- **Zero Master**: zero@balizero.com
- **Sahira (Social Media)**: sahira@balizero.com
