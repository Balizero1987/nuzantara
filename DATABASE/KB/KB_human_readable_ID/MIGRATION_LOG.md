# KB Taxonomy Migration Log

**Tanggal**: 2025-10-03 01:50 CET
**Mode**: EXECUTED
**File yang Dimigrasikan**: 200
**Errors**: 0

---

## Ringkasan

### File per Domain
- **visa**: 101 file (dari VISA ORACLE)
- **kbli**: 54 file (dari Eye KBLI + KBLI)
- **tax**: 29 file (dari TAX GENIUS)
- **legal**: 8 file (dari LEGAL ARCHITECT)
- **pricing**: 1 file (BalizeroPricelist2025.txt)
- **templates**: 7 file (dari templates_id → indonesian-templates/)

**Total**: 200 file dimigrasikan

---

## Strategi Migrasi

### Struktur Lama → Struktur Baru
```
OLD (Flat):
- VISA ORACLE/ (30 files)
- Eye KBLI/ (32 files)
- KBLI/ (49 files)
- TAX GENIUS/ (10 files)
- LEGAL ARCHITECT/ (8 files)
- pricing/ (1 file)
- templates_id/ (7 files)

NEW (Hierarchical):
kb-agents/
├── visa/ (101 files)
├── kbli/ (54 files)
├── tax/ (29 files)
├── legal/ (8 files)
├── pricing/ (1 file)
└── templates/
    └── indonesian-templates/ (7 files)
```

---

## Prinsip Desain Taksonomi yang Diterapkan

✅ **Hierarki 3-4 Level**: Domain → Topik → Subtopik → Konten
✅ **Penamaan huruf kecil**: visa, kbli, tax, legal (bukan VISA_ORACLE, Eye_KBLI)
✅ **Nama menggunakan tanda hubung**: indonesian-templates, visa-free-16-countries
✅ **7±2 Kategori Top**: 6 domain (visa, kbli, tax, legal, pricing, templates)
✅ **Nama deskriptif**: visitor-visas, limited-stay-permits, corporate-tax

---

## Langkah Berikutnya

### Phase 2: Standarisasi Metadata (2-3h)
1. ⏳ Membuat `metadata-schema.json` (3 tier: Mandatory, Recommended, Optional)
2. ⏳ Membuat `controlled-vocabularies.json` (domain, content_type, status, tags)
3. ⏳ Menambahkan JSON-LD frontmatter ke seluruh 200 file
4. ⏳ Validasi kepatuhan (100% Tier 1, 80%+ Tier 2)

### Phase 3: Penegakan Template (1-2h)
1. ⏳ Membuat 5 template (Regulation, FAQ, Case Study, Guide, Checklist)
2. ⏳ Mengklasifikasikan file berdasarkan content_type
3. ⏳ Memformat ulang 80%+ file ke template

### Phase 4: Ekspor JSONL (1h)
1. ⏳ Memperbarui `tools/export_all_for_rag.py` (mode domain-split)
2. ⏳ Mengekspor 4 file JSONL (visa_oracle.jsonl, kbli_eye.jsonl, tax_genius.jsonl, legal_architect.jsonl)

### Phase 5: Integrasi Backend & Deploy (2-3h)
1. ⏳ Backup ChromaDB ke GCS
2. ⏳ Menghapus koleksi lama (bali_zero_agents)
3. ⏳ Mengunggah 4 koleksi baru
4. ⏳ Memperbarui query router (routing 5 arah)
5. ⏳ Deploy ke Cloud Run

---

## Analisis Distribusi File

### Domain VISA (101 file)
Mencakup:
- Visit visas (B211A, B211B, visa-free, VOA)
- Limited stay permits (KITAS C312, C317, investor, retirement)
- Permanent stay (KITAP/ITAP)
- Investment visas (Golden Visa 5-year, Second Home 10-year)
- Prosedur (perpanjangan, sponsorship, penalti)

### Domain KBLI (54 file)
Mencakup:
- KBLI 2020 complete knowledge base
- Tabel korespondensi (pemetaan 2020 ↔ 2015)
- Klasifikasi sektor (pertanian, manufaktur, IT, keuangan, dll.)
- DNPI (Negative Investment List) / aturan kepemilikan asing

### Domain TAX (29 file)
Mencakup:
- Corporate tax (kewajiban PT PMA, repatriasi dividen)
- Expatriate tax (PPh21, BPJS, tax residency)
- Digital economy tax (e-commerce, PMSE, crypto)
- Environmental tax (carbon tax 2025)

### Domain LEGAL (8 file)
Mencakup:
- Regulasi immigration law 2025
- Corporate law (PT PMA, CV, kepemilikan asing)
- Property law (HGB, HGU untuk WNA)
- Compliance (labor law, perlindungan konsumen)

---

## Quality Assurance

✅ **Zero Data Loss**: Seluruh 200 file berhasil dimigrasikan
✅ **Tanpa Duplikat**: Nama file unik tetap terjaga
✅ **File Asli Terpelihara**: Struktur lama masih tersedia (VISA ORACLE/, Eye KBLI/, dll.)
✅ **Struktur Rapi**: 6 direktori domain dibuat

---

**Status Migrasi**: ✅ **PHASE 1 COMPLETE**
**Phase Berikutnya**: Phase 2 - Metadata Standardization
**Estimasi Waktu Tersisa**: 6-8 jam (Phase 2-5)
