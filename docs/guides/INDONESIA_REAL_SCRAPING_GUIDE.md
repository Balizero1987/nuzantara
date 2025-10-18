# 🇮🇩 Indonesia REAL - Web Scraping Guide

**Obiettivo**: Catturare l'Indonesia VERA (non quella turistica) per training dataset autentici.

## 📋 Overview

Questo sistema scrapia contenuti autentici indonesiani da:

| Source | Content Type | Expected Volume | Quality |
|--------|-------------|-----------------|---------|
| **Reddit r/indonesia** | Discussions, Q&A, rants | 500-1,000 posts | ⭐⭐⭐⭐⭐ BEST |
| **Twitter Indonesia** | Trending topics, threads | 1,000-2,000 tweets | ⭐⭐⭐⭐ |
| **Quora Indonesia** | Q&A pairs | 300-500 Q&A | ⭐⭐⭐⭐ |
| **Kaskus Forums** | Forum discussions | 200-400 threads | ⭐⭐⭐ |
| **YouTube Comments** | Indonesian channels comments | 500-1,000 comments | ⭐⭐⭐ |

**Target finale**: 3,000-5,000 esempi di altissima qualità

---

## 🛠️ Setup & Installation

### 1. Install Python Dependencies

```bash
# Core dependencies
pip install praw  # Reddit API
pip install snscrape  # Twitter (no API keys!)
pip install beautifulsoup4 requests  # Web scraping
pip install pandas  # Data manipulation

# Optional (for advanced features)
pip install langdetect  # Language detection (more accurate)
pip install googletrans==4.0.0-rc1  # Translation (if needed)
```

### 2. API Keys Setup

#### Reddit API (FREE)

1. Vai su https://www.reddit.com/prefs/apps
2. Click "create app" o "create another app"
3. Scegli "script" type
4. Compila:
   - **name**: "ZANTARA Training Data"
   - **description**: "Collecting authentic Indonesian discussions for AI training"
   - **redirect uri**: `http://localhost:8080`
5. Copia `client_id` (sotto "personal use script") e `client_secret`
6. Modifica `scripts/scrape_reddit_indonesia.py`:
   ```python
   REDDIT_CONFIG = {
       "client_id": "TUO_CLIENT_ID",
       "client_secret": "TUO_CLIENT_SECRET",
       "user_agent": "ZANTARA Training Data Collector v1.0"
   }
   ```

#### Twitter (NO API keys needed!)

Twitter scraping usa `snscrape` che NON richiede API keys.

---

## 🚀 Usage Guide

### Step 1: Scrape Reddit (30-60 min)

```bash
# Basic scraping (500 posts, hot topics)
python scripts/scrape_reddit_indonesia.py \
    --posts 500 \
    --output data/reddit_indonesia_raw.json \
    --training-output data/reddit_indonesia_training.jsonl

# Advanced: scrape top posts from last month
python scripts/scrape_reddit_indonesia.py \
    --posts 1000 \
    --sort top \
    --output data/reddit_top_month.json \
    --training-output data/reddit_top_training.jsonl
```

**Output**:
- `data/reddit_indonesia_raw.json` - Raw scraped data (for debugging)
- `data/reddit_indonesia_training.jsonl` - Training-ready format

**Expected**: 500 posts → ~1,500 training examples (post + top comments)

---

### Step 2: Scrape Twitter (20-40 min)

```bash
# Scrape trending topics + keywords
python scripts/scrape_twitter_indonesia.py \
    --tweets 1000 \
    --mode all \
    --output data/twitter_indonesia_raw.json \
    --training-output data/twitter_indonesia_training.jsonl

# Only trending hashtags
python scripts/scrape_twitter_indonesia.py \
    --tweets 500 \
    --mode trending \
    --output data/twitter_trending.json \
    --training-output data/twitter_trending_training.jsonl

# Only influencer accounts
python scripts/scrape_twitter_indonesia.py \
    --tweets 300 \
    --mode influencers \
    --output data/twitter_influencers.json \
    --training-output data/twitter_influencers_training.jsonl
```

**Expected**: 1,000 tweets → ~400-600 training examples (filtered for quality)

**Note**: Twitter data needs more manual review (many incomplete thoughts)

---

### Step 3: Clean & Merge All Data (5-10 min)

```bash
# Clean all scraped data
python scripts/clean_scraped_data.py \
    --input-dir data/ \
    --output data/indonesia_clean.jsonl \
    --min-engagement 0

# With engagement filter (higher quality, less volume)
python scripts/clean_scraped_data.py \
    --input-dir data/ \
    --output data/indonesia_high_quality.jsonl \
    --min-engagement 10
```

**What it does**:
- ✅ Detects & removes non-Indonesian content
- ✅ Removes spam/promotional content
- ✅ Removes bot-generated content
- ✅ Deduplicates (exact + fuzzy matching)
- ✅ Filters by length (20-10,000 chars)
- ✅ Filters by engagement (optional)
- ✅ Anonymizes personal info (emails, phones, NIK)

**Output**: 1 unified clean JSONL file ready for training

---

## 📊 Expected Results

### Volume Estimation

| Source | Raw Scraped | After Cleaning | Training Examples |
|--------|-------------|----------------|-------------------|
| Reddit (500 posts) | 500 posts + 3,000 comments | 2,000 items | 1,500 examples |
| Twitter (1,000 tweets) | 1,000 tweets | 600 tweets | 400 examples |
| **TOTAL** | ~4,000 items | ~2,600 items | **~2,000 examples** |

**2,000 esempi di alta qualità** = ottimo starting point!

### Quality Metrics (Expected)

- ✅ **Language accuracy**: 98%+ Indonesian
- ✅ **Spam filtering**: <1% spam
- ✅ **Duplicate removal**: ~30% removed
- ✅ **Authenticity**: 100% real human content
- ✅ **Cultural relevance**: HIGH (actual Indonesian issues)

---

## 🎯 Training Data Format

### Output Format (JSONL)

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Gaji UMR Jakarta 4.9 juta, tapi biaya hidup 7 juta minimum. Gimana survive?"
    },
    {
      "role": "assistant",
      "content": "Capisco perfettamente. Jakarta paradox: salary minimal but cost maximal. Survival strategies: 1) Shared housing (kos-kosan 1.5M vs apartment 4M), 2) Ojol commute vs own vehicle, 3) Warung meals vs restaurants (50K/day vs 200K), 4) Side hustle critical (everyone has 2-3 income streams in Jakarta). Reality: \"gaji UMR, gaya artis\" is impossible - need pragmatic budgeting + additional income."
    }
  ],
  "metadata": {
    "source": "reddit",
    "subreddit": "indonesia",
    "post_id": "abc123",
    "score": 127,
    "flair": "Discussion",
    "created": "2025-10-05T10:30:00"
  }
}
```

### Metadata Fields

- `source`: Platform origin (reddit, twitter, quora, etc.)
- `score`/`engagement`: Upvotes, likes, retweets
- `created`: ISO timestamp
- Platform-specific: `post_id`, `subreddit`, `hashtags`, etc.

---

## 📂 Directory Structure

```
NUZANTARA-2/
├── scripts/
│   ├── scrape_reddit_indonesia.py       # Reddit scraper
│   ├── scrape_twitter_indonesia.py      # Twitter scraper
│   ├── scrape_quora_indonesia.py        # (TODO) Quora scraper
│   ├── scrape_kaskus.py                 # (TODO) Kaskus scraper
│   ├── scrape_youtube_comments.py       # (TODO) YouTube scraper
│   └── clean_scraped_data.py            # Data cleaning pipeline
├── data/
│   ├── reddit_indonesia_raw.json        # Raw Reddit data
│   ├── reddit_indonesia_training.jsonl  # Reddit training format
│   ├── twitter_indonesia_raw.json       # Raw Twitter data
│   ├── twitter_indonesia_training.jsonl # Twitter training format
│   └── indonesia_clean.jsonl            # FINAL cleaned dataset
└── INDONESIA_REAL_SCRAPING_GUIDE.md     # This file
```

---

## 🔍 Content Tematiche Catturate

### 1. Problemi Generazionali Reali

**Gen Z (18-25)**:
- "Gaji tidak cukup hidup" (salario insufficiente)
- "Sarjana tapi jadi barista" (laureato ma barista)
- "Utang pinjol" (debito app prestiti)
- "Mental health stigma"
- "Tekanan sosial media"

**Millennials (26-35)**:
- "Sandwich generation" (supportare genitori + figli)
- "Cicilan never-ending" (debiti infiniti)
- "Work-life balance inesistente"
- "Nepotism vs merit"
- "Stagnazione carriera"

### 2. Issues Sociali

- **Lavoro**: toxic workplace, gaji UMR, lembur non pagato, resign stories
- **Economia**: harga naik, affordability crisis, survival strategies
- **Keluarga**: "kapan nikah?" pressure, toxic parents, generational gap
- **Agama**: moderate vs conservative, interfaith relationships
- **Lokasi**: Jakarta vs Bali vs provinces, migration dreams

### 3. Linguaggio Autentico

**Bahasa Gaul (Gen Z slang)**:
- "Gaskeun" (let's go)
- "Gabut" (bored)
- "Anjay" (wow)
- "Bucin" (slave to love)
- "Gws" (get well soon)

**Bahasa Indonesia Colloquial**:
- "Gimana" vs "bagaimana"
- "Gue/gua" vs "saya"
- "Lo/lu" vs "kamu"
- "Ngga/gak" vs "tidak"

### 4. Cultural Insights

- **Gotong royong**: community mutual aid examples
- **Malu culture**: shame vs guilt, face-saving
- **Hormat**: hierarchy respect (positive + toxic sides)
- **Rezeki & nasib**: fate vs agency tension
- **Syncretism**: religion + local traditions

---

## ⚠️ Ethical Considerations

### Privacy Protection

✅ **Automatic Anonymization**:
- Usernames → `user_abc12345` (hashed)
- Emails → `[EMAIL]`
- Phone numbers → `[PHONE]`
- NIK (Indonesian ID) → `[NIK]`
- URLs → `[LINK:domain.com]`

✅ **No Personal Data Stored**:
- Real names removed
- Addresses removed
- Financial details anonymized

### Respectful Scraping

✅ **Rate Limiting**:
- Reddit: 2 sec pause every 10 posts
- Twitter: 3-5 sec pause between queries
- Respect robots.txt

✅ **Terms of Service**:
- Reddit: PRAW (official API) ✅
- Twitter: snscrape (public data) ✅
- No login required (public content only)

✅ **Data Usage**:
- Training AI only (non-commercial initially)
- No reselling scraped data
- Proper attribution if published

---

## 🐛 Troubleshooting

### Reddit Scraper Issues

**Error: "Invalid credentials"**
```python
# Check REDDIT_CONFIG in script
REDDIT_CONFIG = {
    "client_id": "YOUR_ACTUAL_ID",  # NOT "YOUR_CLIENT_ID_HERE"
    "client_secret": "YOUR_ACTUAL_SECRET",
    "user_agent": "..."
}
```

**Error: "Forbidden" or "429 Rate Limit"**
- Wait 5-10 minutes
- Reduce `--posts` number
- Check Reddit API status: https://www.redditstatus.com/

### Twitter Scraper Issues

**Error: "snscrape not found"**
```bash
# Install from GitHub (latest version)
pip3 install git+https://github.com/JustAnotherArchivist/snscrape.git
```

**Error: "Timeout" or very slow**
- Reduce `--tweets` number
- Use `--mode trending` instead of `all`
- Check internet connection

### Data Cleaning Issues

**Error: "No valid data after cleaning"**
- Check language: Are files actually Indonesian?
- Lower `--min-engagement` threshold
- Check input files exist in `data/` directory

**Too many items filtered out**
- Reduce strictness by modifying `is_indonesian()` threshold in script
- Check `INDONESIAN_WORDS` list includes relevant terms

---

## 📈 Next Steps

### After Scraping

1. **Manual Quality Check** (30 min):
   ```bash
   head -20 data/indonesia_clean.jsonl | jq .
   ```
   Review first 20 examples for quality

2. **Merge with Existing Datasets**:
   ```bash
   cat zantara_whatsapp_massive.jsonl data/indonesia_clean.jsonl > zantara_combined_all.jsonl
   ```

3. **Augmentation** (if needed):
   ```bash
   python scripts/augment_training_data.py --input data/indonesia_clean.jsonl --output data/indonesia_augmented.jsonl --multiplier 2
   ```

4. **Final Dataset Prep**:
   ```bash
   # Shuffle + train/validation split
   python scripts/prepare_final_dataset.py \
       --input data/indonesia_clean.jsonl \
       --output-train zantara_train.jsonl \
       --output-val zantara_val.jsonl \
       --split 0.9
   ```

5. **Fine-tuning**:
   - Upload to Modal/Replicate
   - Run Llama 4 70B fine-tuning
   - Cost: ~$30-50
   - Time: 2-4 hours

---

## 🎯 Success Criteria

After running all scripts, you should have:

- [x] 2,000-5,000 training examples
- [x] 95%+ Indonesian language
- [x] <2% spam/bot content
- [x] Real problems, real language, real Indonesia
- [x] Privacy-protected (anonymized)
- [x] Ready for Llama 4 fine-tuning

**If you achieve this**: Indonesia VERA is captured! ✅

---

## 📞 Support

**Issues?**
- Check Troubleshooting section above
- Review script comments (detailed inline docs)
- Test with smaller samples first (`--posts 50` for debugging)

**Enhancement Ideas?**
- Add more TRENDING_HASHTAGS (Twitter script)
- Add more RELEVANT_KEYWORDS (both scripts)
- Expand INDONESIAN_WORDS (cleaning script)
- Add new sources (Quora, Kaskus, YouTube)

---

**Created**: 2025-10-05
**Version**: 1.0
**Maintained by**: ZANTARA Team
