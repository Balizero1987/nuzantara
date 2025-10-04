# 🚀 DEPLOY ZANTARA LLM - NOW!

**Status**: ✅ READY
**Time**: 2 minutes
**Difficulty**: Copy-paste commands

---

## ONE-COMMAND DEPLOY

```bash
cd "/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch/zantara-rag" && ./QUICK_DEPLOY_LLM.sh
```

**Done!** ✅

---

## MANUAL DEPLOY (if script fails)

```bash
# 1. Navigate
cd "/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch/zantara-rag"

# 2. Install deps (30 seconds)
pip3 install -q httpx tenacity ebooklib beautifulsoup4 langchain langchain-text-splitters

# 3. Start Ollama (if not running)
ollama serve > /tmp/ollama.log 2>&1 &
sleep 3

# 4. Pull model (1 minute, only first time)
ollama pull llama3.2

# 5. Test (10 seconds)
python3 backend/services/ollama_client.py
python3 backend/services/rag_generator.py
```

**Done!** ✅

---

## VERIFY

```bash
# Quick test
./TEST_LLM_QUICK.sh

# Expected output:
# ✅ Imports OK
# ✅ Ollama running
# ✅ Quick test complete!
```

---

## WHAT YOU GET

**Before**:
```
Query → Vector search → Chunks → User reads manually
```

**After**:
```
Query → Vector search → Chunks → LLM → Complete answer + citations ✅
```

---

## USAGE

```python
from backend.services.rag_generator import RAGGenerator

rag = RAGGenerator()
result = await rag.generate_answer(
    query="What is Sunda Wiwitan?",
    user_level=3
)
# → {answer: "...", sources: [...], execution_time_ms: 1500}
```

---

## FILES CREATED

✅ `backend/services/ollama_client.py` (247 lines)
✅ `backend/services/rag_generator.py` (185 lines)
✅ `backend/services/__init__.py` (updated)

---

## DOCS

- **Complete guide**: `ZANTARA_FIX_LLM_INTEGRATION.md` (500+ lines)
- **Quick ref**: `zantara-rag/README_LLM_INTEGRATION.md` (350+ lines)
- **This file**: Ultra-quick deploy

---

## TROUBLESHOOTING

**Error: "Connection refused"**
```bash
ollama serve &
sleep 3
```

**Error: "Model not found"**
```bash
ollama pull llama3.2
```

**Error: "No module httpx"**
```bash
pip3 install httpx tenacity
```

---

## DONE? ✅

Test it:
```bash
python3 backend/services/rag_generator.py
```

Expected: Answer with sources in ~1-3 seconds.

---

**That's it!** 🎉

For details: see `ZANTARA_FIX_LLM_INTEGRATION.md`