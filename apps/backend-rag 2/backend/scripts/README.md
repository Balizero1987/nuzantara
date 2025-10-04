# 🔧 RAG Backend Scripts

Scripts per manutenzione della Knowledge Base e fix problemi comuni.

---

## 📄 fix_pdf_encoding.py

**Scopo**: Estrae testo pulito da PDF con encoding corrotto.

### Quando Usare
- Risposte AI con caratteri corrotti (`�`, `\x00`, binary data)
- Re-processing PDF dopo update
- Migrazione da vecchio sistema di ingestion

### Come Usare

```bash
cd /Users/antonellosiano/Desktop/zantara-bridge\ chatgpt\ patch/zantara-rag/backend
source venv/bin/activate

# Step 1: Copia PDF nella directory kb/
mkdir -p kb/
cp /path/to/your/*.pdf kb/

# Step 2: Esegui fix
python scripts/fix_pdf_encoding.py
```

### Output
- File `.txt` con stesso nome del PDF originale
- Encoding UTF-8 garantito
- Separatori di pagina: `--- Page N ---`

### Dipendenze
```bash
pip install pymupdf  # Se non già installato
```

### Esempio
```bash
kb/
├── PT_Bayu_Bali_Nol_NIB.pdf         # Input
├── PT_Bayu_Bali_Nol_NIB.txt         # Output ✅
├── Design_Patterns_GoF.pdf
└── Design_Patterns_GoF.txt          # Output ✅
```

---

## 🔄 run_ingestion.py

**Scopo**: Re-ingest knowledge base in ChromaDB da file .txt

### Quando Usare
- Dopo `fix_pdf_encoding.py`
- Update documenti nella KB
- Reset completo ChromaDB
- Prima deployment con nuovi documenti

### Come Usare

```bash
cd /Users/antonellosiano/Desktop/zantara-bridge\ chatgpt\ patch/zantara-rag/backend
source venv/bin/activate

# Step 0: (Opzionale) Backup ChromaDB esistente
cp -r chroma_db chroma_db.backup_$(date +%Y%m%d_%H%M%S)

# Step 1: Verifica file .txt presenti
ls -lh kb/*.txt

# Step 2: Esegui ingestion
python scripts/run_ingestion.py

# Step 3: Riavvia backend
uvicorn app.main:app --reload --port 8000
```

### Warning
⚠️ **Questo script CANCELLA ChromaDB esistente!**
- Fai sempre backup prima: `cp -r chroma_db chroma_db.backup`
- Conferma richiesta durante esecuzione

### Cosa Fa
1. Legge tutti `.txt` da `kb/`
2. Chunking del testo (overlap configurabile)
3. Genera embeddings con `nomic-embed-text`
4. Salva in ChromaDB per semantic search

### Dipendenze
```bash
pip install chromadb sentence-transformers
```

---

## 🚀 Workflow Completo

### Scenario 1: Fix PDF Corrotti

```bash
# Terminal 1 - Preparation
cd /Users/antonellosiano/Desktop/zantara-bridge\ chatgpt\ patch/zantara-rag/backend
source venv/bin/activate

# 1. Backup esistente
cp -r chroma_db chroma_db.backup_$(date +%Y%m%d_%H%M%S)

# 2. Fix PDF encoding
python scripts/fix_pdf_encoding.py

# 3. Re-ingest KB
python scripts/run_ingestion.py

# 4. Riavvia backend
uvicorn app.main:app --reload --port 8000
```

```bash
# Terminal 2 - Test
curl -X POST http://127.0.0.1:8000/bali-zero/chat \
  -H 'Content-Type: application/json' \
  -d '{"query": "Come si apre una PT PMA?", "user_role": "member"}'

# Verifica risposta:
# ✅ Nessun carattere corrotto
# ✅ Citazioni leggibili
# ✅ Risposta contestuale
```

### Scenario 2: Aggiungere Nuovi Documenti

```bash
# 1. Copia nuovi PDF in kb/
cp /path/to/new_document.pdf kb/

# 2. Estrai testo
python scripts/fix_pdf_encoding.py

# 3. Re-ingest (include anche vecchi documenti)
python scripts/run_ingestion.py

# 4. Riavvia
uvicorn app.main:app --reload --port 8000
```

### Scenario 3: Reset Completo KB

```bash
# 1. Backup (importante!)
cp -r chroma_db chroma_db.backup_$(date +%Y%m%d_%H%M%S)

# 2. Delete ChromaDB
rm -rf chroma_db

# 3. Re-ingest da zero
python scripts/run_ingestion.py

# 4. Riavvia
uvicorn app.main:app --reload --port 8000
```

---

## 🧪 Test Qualità Risposte

Dopo re-ingestion, testa con queste query:

```bash
# Test 1: Informazioni PT PMA
curl -X POST http://127.0.0.1:8000/bali-zero/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "What are the requirements for PT PMA setup in Bali?",
    "user_role": "member"
  }'

# Test 2: Visa Information
curl -X POST http://127.0.0.1:8000/bali-zero/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "Tell me about KITAS requirements",
    "user_role": "member"
  }'

# Test 3: Costs
curl -X POST http://127.0.0.1:8000/bali-zero/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "How much does it cost to open a PT PMA?",
    "user_role": "member"
  }'
```

### Success Criteria
- ✅ Nessun carattere `�` o `\x00` nelle risposte
- ✅ Citazioni leggibili e contestuali
- ✅ Risposte pertinenti alla query
- ✅ Informazioni accurate dai documenti

---

## ⚠️ Troubleshooting

### Errore: "kb/ directory not found"
```bash
mkdir -p kb/
# Copia PDF nella directory
```

### Errore: "No .txt files found"
```bash
# Genera .txt dai PDF prima
python scripts/fix_pdf_encoding.py
```

### Errore: "chromadb locked"
```bash
# Ferma backend prima di re-ingestion
pkill -f uvicorn
python scripts/run_ingestion.py
uvicorn app.main:app --reload --port 8000
```

### Errore: "pymupdf not found"
```bash
pip install pymupdf
```

### Errore: "kb_ingestion module not found"
```bash
# Verifica struttura:
ls -la services/kb_ingestion.py

# Se manca, usa endpoint API:
# POST /api/rag/ingest (se disponibile)
```

### Risposta: "Service kb_ingestion not available"
Il backend è in modalità "simple" senza RAG completo.

**Opzione 1**: Usa solo Bali Zero (Haiku/Sonnet) senza RAG
```bash
# Backend funziona già così
uvicorn app.main:app --reload --port 8000
```

**Opzione 2**: Implementa RAG completo (richiede ChromaDB setup)
```bash
# Installa dipendenze full RAG
pip install chromadb sentence-transformers pypdf
# Implementa services/kb_ingestion.py
```

---

## 📊 Metriche Attese

Dopo ingestion completo:

- **Chunks**: ~100k-150k chunks (dipende da documenti)
- **Embedding dimension**: 768 (nomic-embed-text)
- **ChromaDB size**: ~500MB-2GB (dipende da KB)
- **Query time**: <200ms (semantic search)
- **Response time**: 1-3s (con LLM generation)

---

## 📝 File Structure

```
backend/
├── kb/                          # Knowledge Base (input)
│   ├── *.pdf                    # PDF originali
│   └── *.txt                    # Testo estratto (output fix_pdf_encoding.py)
├── chroma_db/                   # ChromaDB (output run_ingestion.py)
│   ├── chroma.sqlite3
│   └── ...embeddings...
├── scripts/                     # Scripts di manutenzione
│   ├── fix_pdf_encoding.py     # Fix PDF → .txt
│   ├── run_ingestion.py        # .txt → ChromaDB
│   └── README.md               # Questa guida
└── services/
    └── kb_ingestion.py         # Servizio ingestion (se disponibile)
```

---

## 🆘 Support

**Problemi con gli script?**
1. Verifica dipendenze: `pip list | grep -E 'pymupdf|chromadb|sentence'`
2. Check logs durante esecuzione
3. Test manuale step-by-step
4. Verifica permessi file: `ls -la kb/`

**Alternative**:
- Backend "simple mode" funziona senza RAG (solo Bali Zero)
- Usa endpoint TypeScript se disponibili
- Contact: Antonello Siano (antonellosiano)

---

**Created**: 2025-09-30
**Author**: Claude Code (Sonnet 4.5)
**Status**: ✅ Ready to Use