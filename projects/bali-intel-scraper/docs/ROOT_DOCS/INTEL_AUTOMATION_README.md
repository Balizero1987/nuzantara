# 🤖 INTEL AUTOMATION SYSTEM

**Automated Intelligence Gathering & Multi-Channel Publishing for Bali Business**

## 🎯 Overview

Complete end-to-end automation system that:
- Scrapes 240+ sources daily across 8 categories
- Processes with local AI (LLAMA 3.2) at zero cost
- Reviews with premium AI (Claude Opus) for quality
- Publishes to 6 channels automatically

**Total Cost**: $5-10/month (95% cheaper than alternatives)
**Human Time**: 0 hours (100% automated)

## 🏗️ System Architecture

```
┌─────────────────────┐
│ 1. CRAWL4AI SCRAPER │ → 240 sources → Raw content
└─────────────────────┘
           ↓
┌─────────────────────┐
│ 2A. LLAMA RAG       │ → ChromaDB → Searchable knowledge base
└─────────────────────┘
           ↓
┌─────────────────────┐
│ 2B. LLAMA CONTENT   │ → Articles → 20-30 drafts/day
└─────────────────────┘
           ↓
┌─────────────────────┐
│ 3. CLAUDE EDITORIAL │ → Review → 5-10 approved/day
└─────────────────────┘
           ↓
┌─────────────────────┐
│ 4. MULTI-PUBLISHER  │ → 6 Channels → Blog, Social, Messaging
└─────────────────────┘
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install Python dependencies
cd scripts
pip install -r requirements.txt

# Install Ollama (for LLAMA)
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2:3b
```

### 2. Configure API Keys

```bash
# Create .env file
cat > .env << EOF
# Claude Opus (required for editorial)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Social Media (optional)
FACEBOOK_PAGE_ACCESS_TOKEN=...
TWITTER_API_KEY=...
TELEGRAM_BOT_TOKEN=...
EOF
```

### 3. Run Pipeline

```bash
# Run complete pipeline
python scripts/run_intel_automation.py

# Run specific stage
python scripts/run_intel_automation.py --stage scraping

# Test mode (limited sources)
python scripts/run_intel_automation.py --test
```

## 📁 Directory Structure

```
NUZANTARA-2/
├── INTEL_SCRAPING/           # All scraped and processed content
│   ├── immigration/
│   │   ├── raw/             # Scraped content
│   │   ├── rag/             # Structured for ChromaDB
│   │   ├── articles/        # LLAMA generated
│   │   └── editorial/       # Claude approved
│   ├── bkpm_tax/
│   ├── real_estate/
│   ├── events/
│   ├── social_trends/
│   ├── competitors/
│   ├── bali_news/
│   └── weekly_roundup/
│
├── scripts/
│   ├── crawl4ai_scraper.py     # Stage 1: Scraping
│   ├── llama_rag_processor.py  # Stage 2A: RAG
│   ├── llama_content_creator.py # Stage 2B: Articles
│   ├── editorial_ai.py         # Stage 3: Review
│   ├── multi_channel_publisher.py # Stage 4: Publish
│   └── run_intel_automation.py # Main orchestrator
│
├── data/
│   └── chroma_db/              # Vector database
│
└── .github/workflows/
    └── intel-automation.yml    # GitHub Actions
```

## ⚙️ Configuration

### Sources Configuration

Edit `crawl4ai_scraper.py` to add/modify sources:

```python
INTEL_SOURCES = {
    "immigration": [
        {"url": "https://www.imigrasi.go.id", "tier": 1, "name": "Official"},
        # Add more sources...
    ]
}
```

### Tier System

- **Tier 1**: Official government sources (truth)
- **Tier 2**: Accredited news/business sources
- **Tier 3**: Community/forums (sentiment)

## 🤖 AI Models

### LLAMA 3.2 (Local - FREE)
- RAG processing
- Content creation
- ~20 tokens/sec on MacBook
- 2GB model size

### Claude Opus 4 (Premium - $5/month)
- Editorial review
- Quality control
- Multi-channel adaptation
- Best prose quality

## 📊 Performance Metrics

### Daily Output
- 240 sources scraped
- 20-30 articles created
- 5-10 articles published
- 6 channels updated

### Processing Time
- Scraping: 30 min
- RAG Processing: 15 min
- Content Creation: 20 min
- Editorial Review: 10 min
- Publishing: 5 min
- **Total**: 80 min/day automated

## 🔄 Automation

### GitHub Actions (Automatic)

The system runs automatically:
- Daily at 06:00 CET
- Weekly roundup Sunday 18:00 CET

### Manual Run

```bash
# Full pipeline
python scripts/run_intel_automation.py

# Individual stages
python scripts/crawl4ai_scraper.py
python scripts/llama_rag_processor.py
python scripts/llama_content_creator.py
python scripts/editorial_ai.py
python scripts/multi_channel_publisher.py
```

## 📱 Publishing Channels

### Configured Channels
1. **Blog** - GitHub Pages (automatic)
2. **Instagram** - Carousel + caption (queued)
3. **Facebook** - Posts with links
4. **Twitter/X** - Thread format
5. **WhatsApp** - Broadcast digest
6. **Telegram** - Rich format

### Manual Posting

Content requiring manual posting is saved in:
```
INTEL_SCRAPING/manual_posting/[platform]/
```

## 🔍 Monitoring

### Logs
```bash
# View latest log
tail -f intel_automation_*.log

# Check specific stage
grep "STAGE 3" intel_automation_*.log
```

### Reports
- `daily_summary_[date].md` - Scraping summary
- `rag_summary_[date].md` - RAG processing
- `content_summary_[date].md` - Articles created
- `editorial_summary_[date].md` - Editorial decisions
- `publishing_report_[date].md` - Publishing status

## 🚨 Troubleshooting

### Common Issues

1. **Ollama not found**
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```

2. **LLAMA model missing**
   ```bash
   ollama pull llama3.2:3b
   ```

3. **Claude API error**
   - Check ANTHROPIC_API_KEY
   - Verify API limits

4. **Scraping failures**
   - Check internet connection
   - Verify source URLs
   - Check rate limits

## 💰 Cost Breakdown

| Component | Cost/Month |
|-----------|------------|
| Scraping (Crawl4AI) | $0 |
| LLAMA Processing | $0 |
| Claude Editorial | $5-10 |
| Publishing APIs | $0-5 |
| **Total** | **$5-15** |

## 📈 Optimization Tips

1. **Reduce Costs**
   - Use Gemini Pro (free) instead of Claude
   - Batch process articles
   - Cache API responses

2. **Improve Quality**
   - Fine-tune LLAMA prompts
   - Add more Tier 1 sources
   - A/B test content formats

3. **Scale Up**
   - Add more categories
   - Increase source count
   - Enable more channels

## 🔐 Security

- Store API keys in environment variables
- Use GitHub Secrets for CI/CD
- Rotate keys regularly
- Monitor usage and costs

## 📞 Support

- **Issues**: Create GitHub issue
- **Docs**: See `/docs` folder
- **Logs**: Check `*.log` files

## 🎯 Next Steps

1. **Test** with limited sources first
2. **Configure** API keys and channels
3. **Run** manual test
4. **Enable** GitHub Actions
5. **Monitor** quality and costs
6. **Optimize** based on results

---

**Ready to automate your intelligence gathering!** 🚀

*Last updated: 2025-10-07*