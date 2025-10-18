# KB Extracted from ChromaDB

**Extracted**: 2025-10-05 03:02 CET  
**Source**: `gs://nuzantara-chromadb-2025/chroma_db/` (Production Cloud Run KB)  
**Total**: 354 documents → 167 files

---

## 📂 Structure

```
kb-extracted/
├── visa_oracle/       76 files (1.0 MB) - VISA types, KITAS, immigration
├── kbli_eye/          53 files (3.1 MB) - Business classification, OSS
├── tax_genius/        29 files (504 KB) - Indonesian tax, PPh, PPN
├── legal_architect/    8 files (352 KB) - PT PMA, BKPM, legal
└── zantara_books/      1 file  (16 KB)  - Bali Zero Pricelist 2025
```

---

## 🔄 How to Update KB

### **1. Edit Files**
```bash
# Edit any file in kb-extracted/
vim kb-extracted/visa_oracle/e33g-digital-nomad-kitas.json
```

### **2. Re-ingest to ChromaDB**
```bash
# TODO: Create script to re-ingest edited files
# python3 apps/backend-rag\ 2/scripts/ingest_kb_files.py
```

### **3. Upload to GCS**
```bash
gsutil -m rsync -r /path/to/new_chroma_db gs://nuzantara-chromadb-2025/chroma_db/
```

### **4. Restart Cloud Run**
```bash
# Cloud Run will download new KB on next cold start
# Or force restart:
gcloud run services update zantara-rag-backend --region europe-west1
```

---

## 📊 Collections Breakdown

### **visa_oracle** (229 docs → 76 files)
**Content**: VISA types (C1, C2, C7, D1, D2, D12), KITAS (E23, E28A, E31A, E33F, E33G), KITAP, government regulations

**Key files**:
- `e33g-digital-nomad-kitas.json` - Remote worker KITAS
- `c1-visa-tourism.json` - C1 tourism visa
- `INDONESIA_VISA_IMMIGRATION_COMPLETE_GUIDE_2025.md` - Complete guide
- `Permenkumham_10_2017.md` - Visa procedures regulation
- `decision_tree.json` - Visa selection decision tree

**Last updated**: 2025-10-03

---

### **kbli_eye** (53 docs → 53 files)
**Content**: Business classification, KBLI codes, OSS system, licenses

**Key files**:
- `KBLI_COMPREHENSIVE_SECTOR_GUIDE_2025.md` - Complete sector guide
- `KBLI_TOP_CASES_2025.md` - Most popular cases
- `OSS_COMPLETE_GUIDE_2025.md` - OSS system guide

**Last updated**: 2025-10-03

---

### **tax_genius** (29 docs → 29 files)
**Content**: Indonesian tax, PPh, PPN, NPWP, compliance

**Key files**:
- `TAX_CALCULATIONS_EXAMPLES.md` - Real calculation examples
- `LKPM_COMPLIANCE.json` - LKPM quarterly reporting
- `TAXGENIUS_INTEGRATION_READY.md` - Complete tax guide

**Last updated**: 2025-10-03

---

### **legal_architect** (8 docs → 8 files)
**Content**: PT PMA, BKPM, legal frameworks, contracts

**Key files**:
- `INDONESIAN_LEGAL_FRAMEWORK_CONTRACTS_PROPERTY_MARRIAGE.md`
- `INDONESIAN_IMMIGRATION_INVESTMENT_INFRASTRUCTURE_LAW_2025.md`
- `INDONESIAN_CORPORATE_TAX_PROCEDURAL_LAW_2025.md`

**Last updated**: 2025-10-03

---

### **zantara_books** (35 docs → 1 file)
**Content**: Bali Zero official pricing 2025

**Files**:
- `BALI_ZERO_SERVICES_PRICELIST_2025_ENGLISH.txt.md` - Official price list

**Last updated**: 2025-10-03

---

## ⚠️ Important Notes

1. **Each file has `.meta.json`** with ChromaDB metadata (tags, collection, version, etc.)

2. **Multi-chunk docs** are combined into single files

3. **Filenames preserved** from ChromaDB metadata where possible

4. **NOT EDITABLE IN PLACE** - edits here won't update production KB until re-ingested

5. **Source of truth**: `gs://nuzantara-chromadb-2025/chroma_db/` (production)

---

## 🎯 Next Steps

1. ✅ **Files extracted** - Ready to edit
2. ⏳ **Create ingestion script** - To rebuild ChromaDB from these files
3. ⏳ **Setup sync workflow** - Edit → Re-ingest → Upload → Deploy
4. ⏳ **Version control** - Git track kb-extracted/ for changes

---

**Extracted by**: Claude Sonnet 4.5  
**Date**: 2025-10-05 03:02 CET  
**Total size**: 5.0 MB (167 files + 167 metadata files)
