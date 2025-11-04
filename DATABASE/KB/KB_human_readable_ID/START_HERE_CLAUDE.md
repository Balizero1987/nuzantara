# 👋 Hai Claude, Mulai dari Sini!

> **Task**: Refactoring lengkap KB + backend deployment
> **Time**: 8-11 jam
> **Working dirs**: `/Desktop/KB agenti` + `/Desktop/NUZANTARA/zantara-rag/backend`

---

## 🎯 Apa yang Harus Kamu Lakukan (TL;DR)

Kamu memiliki Knowledge Base yang tidak terorganisir (VISA, KBLI, TAX, LEGAL - ~150 file).

**Tujuan**: Ubah menjadi KB kelas enterprise dengan:
- Taxonomy rapi (3-4 level)
- Metadata standar (JSON-LD)
- Template seragam
- 5 collections ChromaDB (bukan 2)
- Query routing domain-specific (akurasi 100%)

Setelah itu deploy semuanya ke Cloud Run.

---

## 📚 Baca Ini (Urutan)

**1. File ini** (2 menit) ← Tetap di sini

**2. `.claude/KB_BEST_PRACTICES_WORLD_CLASS.md`** (15 menit browsing)
- Best practices kelas dunia untuk KB
- 43KB, 7 bagian
- Gunakan sebagai referensi selama bekerja

**3. Mulai kerja** (ikuti fase di bawah)

---

## 🚀 Lima Fase

### **Phase 1: Taxonomy Restructure** (2-3h)
**Location**: `/Users/antonellosiano/Desktop/KB agenti`

**Yang harus dilakukan**:
1. Analisis struktur saat ini (4 domain: VISA ORACLE, Eye KBLI, TAX GENIUS, LEGAL ARCHITECT)
2. Hitung file per domain
3. Ajukan taxonomy baru (maks 3-4 level, penamaan: lowercase-with-hyphens)
4. Buat script `tools/migrate_to_new_taxonomy.py` (tanpa pemindahan manual!)
5. Dry-run → persetujuan user → eksekusi
6. Hasilkan `MIGRATION_LOG.md`

**Output**: Struktur rapi seperti:
```
kb-agents/
  visa/
    visitor-visas/
      b211a-single-entry/
        requirements.md
        process.md
  kbli/
    information-communication/
      kbli-62010-software-dev.md
  tax/
  legal/
```

---

### **Phase 2: Metadata Standardization** (2-3h)
**Location**: `/Users/antonellosiano/Desktop/KB agenti`

**Yang harus dilakukan**:
1. Buat `metadata-schema.json` (3 tier: Mandatory, Recommended, Optional)
2. Buat `controlled-vocabularies.json` (domain, content_type, status, tags, dll.)
3. Buat script `tools/add_metadata_to_files.py`
4. Untuk setiap file: AI-suggest metadata → human review → apply
5. Tambahkan frontmatter JSON-LD ke seluruh file
6. Validasi: script `tools/validate_metadata.py`

**Target compliance**: 100% Tier 1, 80%+ Tier 2, 50%+ Tier 3

**Output**: Setiap file dengan frontmatter seperti:
```markdown
---
id: visa-b211a-requirements-2025
title: B211A Visa Requirements
domain: visa
content_type: guide
created_date: 2025-01-15
last_updated: 2025-09-30
status: active
primary_audience: digital-nomad
tags: [b211a, single-entry, sponsor]
---
```

---

### **Phase 3: Template Enforcement** (1-2h)
**Location**: `/Users/antonellosiano/Desktop/KB agenti`

**Yang harus dilakukan**:
1. Buat 5 templates di `templates/`:
   - `regulation-guide.md`
   - `faq.md`
   - `case-study.md`
   - `guide.md`
   - `checklist.md`
2. Script: klasifikasikan file berdasarkan content_type (AI-assisted)
3. Script: reformats file agar sesuai template (semi-otomatis + human review)
4. Target: 80%+ file patuh

**Output**: File yang direstruktur sesuai template standar

---

### **Phase 4: JSONL Export** (1h)
**Location**: `/Users/antonellosiano/Desktop/KB agenti`

**Yang harus dilakukan**:
1. Update `tools/export_all_for_rag.py` → mode domain-split
2. Ekspor 4 JSONL terpisah (bukan 1 campuran):
   - `RAG_UPLOAD/visa_oracle.jsonl` (~400 docs)
   - `RAG_UPLOAD/kbli_eye.jsonl` (~500 docs)
   - `RAG_UPLOAD/tax_genius.jsonl` (~350 docs)
   - `RAG_UPLOAD/legal_architect.jsonl` (~200 docs)
3. Validasi: tidak ada record kosong, metadata lengkap

**Output**: 4 JSONL siap untuk upload ChromaDB

---

### **Phase 5: Backend Integration & Deploy** (2-3h)
**Location**: `/Users/antonellosiano/Desktop/NUZANTARA/zantara-rag/backend`

**⚠️ KRITIS: Backup sebelum menghapus!**

**Step 5.1: Backup ChromaDB**
```bash
cd "/Users/antonellosiano/Desktop/NUZANTARA/zantara-rag/backend"
gsutil -m rsync -r data/chroma_db/ gs://nuzantara-chromadb-2025/backup-2025-10-03/
```

**Step 5.2: Delete Old Collection**
```bash
# Buat script: scripts/delete_old_collections.py
# Hapus: "bali_zero_agents" (old mixed)
# Pertahankan: "zantara_books" (unchanged)
python3 scripts/delete_old_collections.py --dry-run
python3 scripts/delete_old_collections.py --execute
```

**Step 5.3: Upload 4 New Collections**
```bash
cd "/Users/antonellosiano/Desktop/KB agenti"
CHROMA_PATH="/Users/antonellosiano/Desktop/NUZANTARA/zantara-rag/backend/data/chroma_db"

# Upload x4 (visa, kbli, tax, legal)
python3 tools/upload_to_chroma.py \
  --jsonl RAG_UPLOAD/visa_oracle.jsonl \
  --collection visa_oracle \
  --persist "$CHROMA_PATH" \
  --batch 256

# Ulangi untuk kbli, tax, legal
```

**Step 5.4: Update Backend Code**

**File 1**: `services/query_router.py`
```python
# Update COLLECTION_KEYWORDS (2 → 5 collections)
COLLECTION_KEYWORDS = {
    "visa_oracle": ["visa", "b211a", "kitas", "immigration", ...],
    "kbli_eye": ["kbli", "nib", "oss", "business license", ...],
    "tax_genius": ["tax", "pph", "ppn", "corporate tax", ...],
    "legal_architect": ["law", "legal", "compliance", "property", ...],
    "zantara_books": ["plato", "aristotle", "machine learning", ...]
}
```

**File 2**: `services/search_service.py`
```python
# Update clients (2 → 5)
self.clients = {
    "visa_oracle": ChromaDBClient(collection="visa_oracle"),
    "kbli_eye": ChromaDBClient(collection="kbli_eye"),
    "tax_genius": ChromaDBClient(collection="tax_genius"),
    "legal_architect": ChromaDBClient(collection="legal_architect"),
    "zantara_books": ChromaDBClient(collection="zantara_books")
}
```

**Step 5.5: Test Locally**
```bash
cd "/Users/antonellosiano/Desktop/NUZANTARA/zantara-rag/backend"
PORT=8000 uvicorn app.main_integrated:app --reload

# Terminal baru - uji query
curl -X POST http://localhost:8000/bali-zero/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What is B211A visa?", "conversation_id": "test-1"}'

# Verifikasi routing ke visa_oracle, jawaban benar
```

**Target**: Akurasi routing 100% (4/4 query uji)

**Step 5.6: Deploy ke Cloud Run**
```bash
# Upload ChromaDB ke GCS
gsutil -m rsync -r data/chroma_db/ gs://nuzantara-chromadb-2025/chroma_db/

# Build & deploy
docker buildx build --platform linux/amd64 \
  -t gcr.io/involuted-box-469105-r0/zantara-rag-backend:v2.2-multi-domain \
  --no-cache .

docker push gcr.io/involuted-box-469105-r0/zantara-rag-backend:v2.2-multi-domain

gcloud run deploy zantara-rag-backend \
  --image gcr.io/involuted-box-469105-r0/zantara-rag-backend:v2.2-multi-domain \
  --region europe-west1 \
  --port 8000 \
  --memory 4Gi \
  --cpu 2 \
  --set-env-vars ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
```

**Step 5.7: Test Production**
```bash
curl -X POST https://zantara-rag-backend-1064094238013.europe-west1.run.app/bali-zero/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: zantara-internal-dev-key-2025" \
  -d '{"query": "What is B211A visa?", "conversation_id": "prod-1"}'
```

**Target**: Query production berjalan, akurasi routing 100%

---

## ✅ Kriteria Keberhasilan

**Phase 1**: Taxonomy baru (3-4 level), semua file termigrasi (0 data loss)
**Phase 2**: 100% metadata Tier 1, 80%+ Tier 2
**Phase 3**: 5 template dibuat, 80%+ file patuh
**Phase 4**: 4 file JSONL tervalidasi
**Phase 5**: 5 koleksi ChromaDB, akurasi routing 100%, deploy ke Cloud Run

---

## ⚠️ Aturan Kritis

**DO**:
- ✅ Selalu dry-run sebelum operasi destruktif
- ✅ Backup ChromaDB ke GCS sebelum menghapus
- ✅ Human review untuk metadata hasil AI
- ✅ Uji lokal (akurasi 100%) sebelum deploy
- ✅ Simpan backup (folder `.backup/` untuk file KB)

**DON'T**:
- ❌ Jangan hapus ChromaDB tanpa backup GCS
- ❌ Jangan lakukan pemindahan file manual (gunakan script)
- ❌ Jangan auto-apply saran AI tanpa review
- ❌ Jangan deploy ke production tanpa uji lokal

---

## 📊 Hasil yang Diharapkan

**Before**:
- KB: Struktur berantakan, tanpa metadata, konten bebas
- ChromaDB: 2 koleksi (bali_zero_agents campuran, zantara_books)
- Routing: 2 arah, akurasi 89%

**After**:
- KB: Taxonomy 3-4 level rapi, 100% metadata, 5 template
- ChromaDB: 5 koleksi (domain-specific + books)
- Routing: 5 arah domain-specific, **akurasi 100%**
- Relevansi pencarian: **+15-20%** (tanpa noise lintas domain)

---

## 🎯 Deliverables Final

**KB Refactoring**:
- KB yang direstruktur (kb-agents/)
- metadata-schema.json, controlled-vocabularies.json
- 5 template (templates/*.md)
- 6 script (tools/*.py)
- 3 laporan (MIGRATION_LOG.md, REFACTORING_REPORT.md, METADATA_COMPLIANCE_REPORT.md)
- 4 ekspor JSONL

**Backend**:
- 5 koleksi ChromaDB di-upload
- Query router diperbarui (5 arah)
- SearchService diperbarui (5 klien)
- Cloud Run terdeploy (v2.2-multi-domain)
- Production teruji (routing 100%)

---

## 📞 Kapan Harus Tanya User

**Minta persetujuan**:
- Setelah Phase 1: Desain taxonomy baru (tunjukkan proposal)
- Setelah Phase 2: Metadata schema (jika berbeda dari proposal)
- Sebelum Step 5.2: Sebelum menghapus koleksi ChromaDB (konfirmasi backup selesai)
- Sebelum Step 5.8: Sebelum deploy ke Cloud Run (konfirmasi tes lokal lolos)

**Bisa lanjut sendiri**:
- File migration (setelah validasi dry-run)
- AI metadata extraction (dengan validation script)
- JSONL export
- Pembuatan script

---

## 🚀 Cara Mulai

**Step 1**: Baca `.claude/KB_BEST_PRACTICES_WORLD_CLASS.md` (15 menit, baca bagian 1-4)

**Step 2**: Mulai Phase 1
```bash
cd "/Users/antonellosiano/Desktop/KB agenti"

# Analisis struktur saat ini
for dir in "VISA ORACLE" "Eye KBLI" "TAX GENIUS" "LEGAL ARCHITECT"; do
  echo "=== $dir ==="
  find "$dir" -type f \( -name "*.md" -o -name "*.txt" \) 2>/dev/null | wc -l
done

# Baca sample file untuk memahami struktur
head -20 "VISA ORACLE/INDONESIA_VISA_IMMIGRATION_COMPLETE_GUIDE_2025.md"
```

**Step 3**: Ajukan taxonomy ke user → persetujuan → eksekusi

**Step 4**: Lanjutkan Phase 2-5

---

## 📁 File Referensi

**Wajib baca**: `.claude/KB_BEST_PRACTICES_WORLD_CLASS.md` (43KB, komprehensif)

**Ikhtisar KB saat ini**: `AGENTS.md`

**Tools yang sudah ada**:
- `tools/export_all_for_rag.py` (perlu update untuk domain-split)
- `tools/upload_to_chroma.py` (sudah bekerja, gunakan untuk upload)

---

## 💡 Tips

**Taxonomy design**: Lihat bagian 1 di KB_BEST_PRACTICES (aturan 7±2, 3-4 level, penamaan)

**Metadata schema**: Bagian 2 (sistem 3 tier, contoh JSON-LD)

**Templates**: Bagian 3 (5 contoh template lengkap)

**Chunking**: Bagian 4 (semantic chunking, 1000 karakter, overlap 15%)

**Jangan reinvent**: Dokumen best practices sudah lengkap, ikuti saja!

---

## ⏱️ Timeline Estimasi

| Phase | Tasks | Time |
|-------|-------|------|
| 1 | Taxonomy | 2-3h |
| 2 | Metadata | 2-3h |
| 3 | Templates | 1-2h |
| 4 | JSONL export | 1h |
| 5 | Backend + deploy | 2-3h |
| **Total** | | **8-11h** |

Bisa dibagi dalam 1-2 hari, tidak harus selesai sekaligus.

---

## 🎉 Hasil Akhir

**Production-ready system**:
- ✅ Struktur KB rapi (kelas enterprise)
- ✅ Kepatuhan metadata 100%
- ✅ 5 koleksi ChromaDB (routing domain-specific)
- ✅ Backend v2.2 terdeploy ke Cloud Run
- ✅ Akurasi routing 100% (vs baseline 89%)
- ✅ Peningkatan relevansi pencarian +15-20%

---

**Ayo mulai! 🚀**

Saat siap, mulai dengan Phase 1. Tanyakan ke user jika ada keraguan soal desain taxonomy.

**Current working directory**: Kamu berada di `/Users/antonellosiano/Desktop/KB agenti` (bukan NUZANTARA, itu untuk Phase 5)

---

**Document Version**: 2.0 (single Claude, simplified)
**Created**: 2025-10-03 00:45 CET
**Author**: Claude Sonnet 4.5 (Session m14)
