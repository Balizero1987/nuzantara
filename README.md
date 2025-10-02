# 🌸 NUZANTARA Knowledge Base

**Multi-domain RAG system for ZANTARA AI**

---

## 📚 Overview

This repository contains the knowledge base for NUZANTARA (ZANTARA AI), organized into two main collections:

### 1. **Bali Zero Agents** (1,458 documents)
Operational knowledge for Indonesian business services:

- **VISA ORACLE** - Immigration, B211A/B211B, KITAS procedures
- **EYE KBLI** - KBLI 2020/2025, OSS risk-based regulations
- **TAX GENIUS** - Indonesian tax (Pajak), compliance, reporting
- **LEGAL ARCHITECT** - Company formation (PT PMA), BKPM, legal frameworks
- **Pricing** - Bali Zero official price list 2025
- **Templates** - Indonesian language templates

### 2. **Philosophy & Technical Books** (12,907 documents)
214 books across domains:
- Philosophy (Plato, Aristotle, Guénon, Zohar)
- Indonesian culture (Geertz, Kartini, Anderson)
- Computer Science (SICP, Design Patterns, Code Complete)
- Machine Learning (Murphy, Goodfellow)
- Literature (Shakespeare, Dante, Homer, Rumi)

---

## 🏗️ Architecture

```
Knowledge Base (GitHub)
    ↓ export
JSONL Exports (CI/CD generated)
    ↓ ingest
ChromaDB (2 collections)
    ↓ upload
Google Cloud Storage (gs://nuzantara-chromadb-2025/)
    ↓ download on startup
Cloud Run (FastAPI RAG backend)
    ↓ query routing
LLM (Anthropic Claude Haiku/Sonnet)
```

### Collection Routing Logic

```python
# Query → Collection mapping
if query contains ["visa", "b211", "kitas", "kbli", "tax", "pt pma"]:
    → bali_zero_agents (operational KB)
else:
    → zantara_books (philosophical/technical KB)
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Google Cloud SDK (for GCS upload)
- GitHub account with repo access

### Local Development

```bash
# 1. Clone repo
git clone https://github.com/Balizero1987/nuzantara.git
cd nuzantara

# 2. Install dependencies
pip install -r requirements.txt

# 3. Export KB to JSONL
python3 scripts/export_all_for_rag2.py

# 4. Build ChromaDB locally
python3 scripts/upload_to_chroma.py \
  --jsonl exports/kb_export.jsonl \
  --collection bali_zero_agents \
  --persist chromadb/

# 5. Query test
python3 scripts/test_query.py "What is B211A visa?"
```

---

## 📂 Repository Structure

```
nuzantara/
├── .github/
│   └── workflows/
│       ├── sync-chromadb.yml      # Auto-sync on push
│       └── validate-kb.yml        # PR validation
├── kb-agents/                     # Operational KB (tracked)
│   ├── VISA ORACLE/
│   ├── Eye KBLI/
│   ├── TAX GENIUS/
│   ├── LEGAL ARCHITECT/
│   ├── pricing/
│   └── templates_id/
├── kb-books/                      # Books manifest (files in GCS)
│   └── MANIFEST.md
├── scripts/
│   ├── export_all_for_rag2.py    # KB → JSONL
│   ├── upload_to_chroma.py       # JSONL → ChromaDB
│   └── sync_to_gcs.sh            # ChromaDB → GCS
├── chromadb/                      # Local builds (gitignored)
├── exports/                       # JSONL outputs (gitignored)
├── .gitignore
├── requirements.txt
└── README.md
```

---

## 📊 Statistics

**Last Updated**: 2025-10-02

| Collection | Documents | Size | Domains |
|------------|-----------|------|---------|
| bali_zero_agents | 1,458 | 8.5 MB | kbli, visa, tax, legal |
| zantara_books | 12,907 | 311 MB | philosophy, CS, literature |
| **TOTAL** | **14,365** | **320 MB** | 8 domains |

---

**Version**: 1.0.0
**Maintainer**: Bali Zero Team