# 🎉 ZANTARA RAG - Setup Locale GRATUITO

**No API keys needed! Completamente FREE!** 💰

Usa **Sentence Transformers** invece di OpenAI - 100% locale, zero costi.

---

## 🚀 STEP 1: Setup (5 minuti)

### 1. Virtual Environment
```bash
# Crea virtual environment
python3 -m venv venv

# Attiva
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate  # Windows
```

### 2. Install Dependencies
```bash
# Install tutto
pip install -r requirements.txt

# Questo scaricherà:
# - sentence-transformers
# - torch (per ML)
# - chromadb
# - fastapi
# - etc.
```

### 3. Configure (NO API KEY NEEDED!)
```bash
# Copia template
cp .env.example .env

# Edit .env
nano .env  # o vim, code, etc.
```

**Nel .env metti:**
```env
# Embeddings Provider (FREE!)
EMBEDDING_PROVIDER=sentence-transformers
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_DIMENSIONS=384

# Chroma Vector Database
CHROMA_PERSIST_DIR=./data/chroma_db
CHROMA_COLLECTION_NAME=zantara_books

# Chunking
CHUNK_SIZE=500
CHUNK_OVERLAP=50

# API
API_HOST=0.0.0.0
API_PORT=8000
```

**NO `OPENAI_API_KEY` needed!** 🎉

---

## 📚 STEP 2: Add Books (1 minuto)

```bash
# Copia 5-10 libri per testare
cp ~/path/to/books/*.pdf data/raw_books/

# Verifica
ls data/raw_books/
```

---

## ⚡ STEP 3: Ingest (5-10 minuti)

```bash
# Run ingestion
python scripts/ingest_all_books.py

# Prima volta:
# - Scarica model sentence-transformers (~90MB)
# - Process books (~1 min per book)

# Aspettati:
# ✅ "Loading local embedding model..."
# ✅ "Model loaded: all-MiniLM-L6-v2 (384 dimensions)"
# ✅ Progress bar
# ✅ "X successful, Y failed"
```

---

## 🔍 STEP 4: Test Search (1 minuto)

```bash
# Run test
python scripts/test_search.py

# Aspettati:
# 🔍 5 test queries
# ✅ Results for each
# 📊 Book chunks con similarity scores
```

---

## 🚀 STEP 5: Start API (1 minuto)

```bash
# Start server
uvicorn backend.app.main:app --reload

# Apri browser:
# http://localhost:8000
# http://localhost:8000/docs
```

---

## 🧪 STEP 6: Test Endpoint

```bash
# Test search
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "what is consciousness?",
    "level": 3,
    "limit": 3
  }'

# Dovresti vedere:
# {
#   "query": "what is consciousness?",
#   "results": [
#     {
#       "text": "...",
#       "metadata": {
#         "book_title": "...",
#         "tier": "S"
#       },
#       "similarity_score": 0.78
#     }
#   ]
# }
```

---

## 💰 COSTI

| Provider | Setup | Per Query | Per 1000 Books |
|----------|-------|-----------|----------------|
| **Sentence Transformers** | **FREE** | **FREE** | **FREE** |
| OpenAI | FREE | $0.0001 | ~$2.00 |

**Total con Sentence Transformers: $0** 🎉

---

## 🎯 Modelli Disponibili

### Recommended (Default)
```env
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_DIMENSIONS=384
```
- Size: 90MB
- Speed: Fast
- Quality: Good
- **Best for: General use, fast setup**

### Better Quality
```env
EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2
EMBEDDING_DIMENSIONS=768
```
- Size: 420MB
- Speed: Medium
- Quality: Better
- **Best for: Higher quality results**

### Multilingual
```env
EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
EMBEDDING_DIMENSIONS=384
```
- Size: 420MB
- Speed: Medium
- Quality: Good
- **Best for: Multi-language books (EN, IT, ID)**

---

## 🔄 Switch to OpenAI (Optional)

Se vuoi usare OpenAI per qualità migliore:

```env
# Change to OpenAI
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-...
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
```

Poi re-ingest i libri (embeddings diversi).

---

## ⚙️ Performance Comparison

| Aspect | Sentence Transformers | OpenAI |
|--------|----------------------|--------|
| **Cost** | ✅ FREE | 💰 Paid |
| **Privacy** | ✅ Local | ❌ Cloud |
| **Speed** | ⚡ Fast (local) | 🌐 Network dependent |
| **Quality** | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Better |
| **Setup** | 🔧 Download model (~90MB) | 🔑 API key |
| **Offline** | ✅ Works offline | ❌ Requires internet |

---

## 🎉 Advantages - Sentence Transformers

### ✅ Pros:
1. **100% FREE** - No API costs ever
2. **Local** - Runs on your machine
3. **Private** - Data never leaves your computer
4. **Fast** - No network latency
5. **Offline** - Works without internet
6. **Unlimited** - No rate limits

### ⚠️ Cons:
1. Slightly lower quality than OpenAI
2. Requires more RAM (~2GB)
3. First run downloads model (~90MB)

---

## 🚀 Production Ready

Per production, sentence-transformers è ottimo per:
- ✅ Internal tools (privacy important)
- ✅ High-volume searches (no API costs)
- ✅ Offline deployments
- ✅ Budget-conscious projects

Per quality massima, usa OpenAI.

---

## 🐛 Troubleshooting

### Model download fails?
```bash
# Manual download
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"
```

### Out of memory?
```bash
# Use smaller model
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2  # 90MB
# Instead of:
# EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2  # 420MB
```

### Slow performance?
```bash
# Check if using GPU
python -c "import torch; print(torch.cuda.is_available())"

# If True, embeddings will use GPU (faster)
# If False, uses CPU (still fast enough)
```

---

## 🎯 Next Steps

1. ✅ Setup con sentence-transformers
2. ✅ Ingest 5-10 libri test
3. ✅ Test search
4. ✅ Verify quality è accettabile
5. 🚀 Se tutto ok → ingest tutti 214 libri!

---

## 💡 Recommendation

**Per iniziare:** Use sentence-transformers (FREE)

**Se poi vuoi upgrade:** Switch to OpenAI (semplice)

**La scelta è tua!** 🎉

---

**Status:** ✅ Ready to use - NO API KEY NEEDED!
**Cost:** $0
**Time:** 15 minutes setup

🧠 Build ZANTARA for FREE! 💰✨

---

**Happy hacking!** 🚀