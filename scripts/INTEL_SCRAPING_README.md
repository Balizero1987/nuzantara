# Intel Scraping System - Quick Start Guide

Automated intelligence gathering system for Indonesian regulatory news, visa updates, and business compliance.

## 🎯 What This Does

**Stage 1: Scraping** (Playwright)
- Scrapes 259 sources across 20 categories
- 12 concurrent workers, 20s timeout
- Quality filters: min 100 words, 5-day freshness, deduplication

**Stage 2A: RAG Processing** (Llama 3.1 8B)
- Semantic extraction → ChromaDB JSON
- Structured data for search

**Stage 2B: Content Creation** (Llama 3.1 8B)
- Generates markdown articles for internal team

**Stage 2C: Bali Zero Journal** (Llama 3.1 8B)
- SEO-optimized blog posts in Italian

**ALL 3 STAGES RUN IN PARALLEL!**

---

## 🚀 Setup (Mac M4 16GB)

### **One-Command Setup**

```bash
# Run automated setup script
./scripts/setup_ollama_local.sh
```

This will:
1. ✅ Install Ollama via Homebrew
2. ✅ Pull Llama 3.1 8B model (~4.7GB)
3. ✅ Start Ollama server
4. ✅ Configure environment variables
5. ✅ Test the setup

---

### **Manual Setup** (if you prefer)

```bash
# 1. Install Ollama
brew install ollama

# 2. Pull Llama 3.1 8B
ollama pull llama3.1:8b

# 3. Start Ollama server (separate terminal)
ollama serve

# 4. Set environment variables
export AI_BACKEND="ollama"
export OLLAMA_MODEL="llama3.1:8b"
export OLLAMA_BASE_URL="http://localhost:11434"
export DATABASE_URL="postgresql://user:pass@localhost:5432/nuzantara"

# 5. Verify configuration
python3 scripts/verify_llama_config.py
```

---

## 📋 Usage

### **Test Single Category**

```bash
python3 scripts/run_intel_automation.py --categories visa_immigration
```

### **Run Full Pipeline (All 20 Categories)**

```bash
python3 scripts/run_intel_automation.py
```

### **Run Only Specific Stages**

```bash
# Only scraping (Stage 1)
python3 scripts/crawl4ai_scraper.py

# Only AI processing (Stage 2A, 2B, 2C)
python3 scripts/stage2_parallel_processor.py
```

---

## 📊 Performance (Mac M4 16GB)

| Metric | Value |
|--------|-------|
| **RAM Usage** | ~5GB (Llama 3.1 8B) |
| **Speed** | 25-30 token/s |
| **Stage 1 Duration** | 10-30 min (259 sources) |
| **Stage 2 Duration** | 5-15 min (depends on content) |
| **Total Pipeline** | 15-45 min |
| **Quality** | ⭐⭐⭐⭐ (editorial quality) |

---

## 🗂️ Output Structure

```
scripts/INTEL_SCRAPING/
├── config/
│   ├── SITI_visa_immigration.txt      # 25 sources
│   ├── SITI_tax_compliance.txt        # 20 sources
│   └── ... (20 files total)
│
├── visa_immigration/
│   ├── raw/
│   │   └── 20251023_120000_site_001.md    # Stage 1 output
│   └── rag/
│       └── 20251023_120000_site_001.json  # Stage 2A output
│
├── markdown_articles/
│   └── 20251023_visa_immigration_article.md  # Stage 2B output
│
├── bali_zero_journal/
│   └── 20251023_visa_immigration_journal.md  # Stage 2C output (SEO)
│
└── ... (20 categories)
```

---

## 🔧 Configuration Options

### **Option A: Ollama Local** (Default ⭐)

```bash
export AI_BACKEND="ollama"
export OLLAMA_MODEL="llama3.1:8b"
```

**Pros:**
- ✅ Free ($0/month)
- ✅ Fast on Mac M4 (25-30 token/s)
- ✅ Privacy (100% local)
- ✅ Low RAM (~5GB)

**Cons:**
- ⚠️ Base model (not fine-tuned)

---

### **Option B: ZANTARA Cloud** (RunPod)

```bash
export AI_BACKEND="runpod"
export RUNPOD_LLAMA_ENDPOINT="https://api.runpod.ai/v2/YOUR_ENDPOINT/runsync"
export RUNPOD_API_KEY="your_api_key"
```

**Pros:**
- ✅ Fine-tuned model (22K Indonesian conversations)
- ✅ Better quality (⭐⭐⭐⭐⭐)
- ✅ No local RAM usage

**Cons:**
- ⚠️ Cost (~$0.30/hour)
- ⚠️ Requires internet

---

## 🔍 Verification & Troubleshooting

### **Verify Configuration**

```bash
python3 scripts/verify_llama_config.py
```

Expected output:
```
✅ AI_BACKEND: ollama
✅ OLLAMA_MODEL: llama3.1:8b
✅ Ollama is running at localhost:11434
✅ Llama 3.1 8B is available
✅ Stage 2A configured for Ollama
✅ Stage 2B configured for Ollama
✅ Stage 2C configured for Ollama
```

---

### **Common Issues**

**1. Ollama not running**
```bash
# Check if running
pgrep ollama

# Start if not running
ollama serve
```

**2. Model not found**
```bash
# List installed models
ollama list

# Pull Llama 3.1 8B if missing
ollama pull llama3.1:8b
```

**3. Slow performance**
```bash
# Check RAM usage
memory_pressure

# Close other apps to free RAM
# Recommended: 6-8GB free for optimal speed
```

**4. Out of memory**
```bash
# Reduce batch size in stage2_parallel_processor.py
# Or use smaller model:
export OLLAMA_MODEL="llama3.1:8b-q4"  # Quantized version (3GB)
```

---

## 📚 Documentation

- **Full CLI Commands**: `scripts/INTEL_CLI_COMMANDS.md`
- **Configuration**: `.env.example`
- **Verification Script**: `scripts/verify_llama_config.py`
- **Setup Script**: `scripts/setup_ollama_local.sh`

---

## 💡 Tips

1. **Run overnight**: Full pipeline takes 15-45 min, best to run when not using Mac
2. **Monitor first run**: Check output to ensure quality meets expectations
3. **Adjust quality filters**: Edit `MAX_NEWS_AGE_DAYS`, `MIN_QUALITY_SCORE` in `stage2_parallel_processor.py`
4. **Check output**: Review `bali_zero_journal/*.md` for blog-ready content

---

## 🎯 Quick Reference

```bash
# Setup (one-time)
./scripts/setup_ollama_local.sh

# Verify
python3 scripts/verify_llama_config.py

# Test single category
python3 scripts/run_intel_automation.py --categories visa_immigration

# Run full pipeline
python3 scripts/run_intel_automation.py

# Monitor
tail -f /tmp/ollama.log
watch -n 5 'ls scripts/INTEL_SCRAPING/*/rag/*.json | wc -l'
```

---

**Status**: ✅ Production Ready for Mac M4 16GB with Llama 3.1 8B Local
