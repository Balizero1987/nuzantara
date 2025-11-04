# 🔷 WORKER #7: TAX ADVANCED LAWS

## 📋 Your Assigned Laws (4 leggi fiscali avanzate)

1. **UU Nomor 7 Tahun 2021** - Harmonisasi Peraturan Perpajakan (HPP)
2. **PP Nomor 35 Tahun 2021** - Perjanjian Kerja Waktu Tertentu, Alih Daya, Waktu Kerja
3. **PP Nomor 55 Tahun 2022** - Penyesuaian Pengaturan di Bidang PPh
4. **PP Nomor 71 Tahun 2019** - Barang Kena Pajak Yang Tergolong Mewah

---

## 🎯 Your Mission

Process these **Tax & Employment regulations** for:
- Indonesian citizens managing PT/CV
- Employers hiring Indonesian workers
- Companies navigating tax obligations
- Business owners with luxury goods

### Key Focus Areas:

#### UU 7/2021 (HPP - Tax Harmonization)
- **PPN rate changes** (11% → 12% timeline)
- **Carbon tax** provisions
- **Tax amnesty** programs
- **Withholding tax** (PPh 21/22/23/26)
- **Cross-border transactions** tax treatment

#### PP 35/2021 (Labor & Outsourcing)
- **PKWT** (fixed-term contracts) rules
- **Outsourcing** regulations
- **Working hours** standards
- **Overtime** calculation
- Indonesian **labor law compliance**

#### PP 55/2022 (Income Tax Adjustments)
- **PPh 21** (employee tax) brackets
- **PTKP** (tax-free income) thresholds
- **Tax incentives** for specific sectors
- **Tax calculation** methods

#### PP 71/2019 (Luxury Goods Tax - PPnBM)
- **Luxury goods** classification
- **Tax rates** by category
- **Exemptions** and special cases
- Impact on **import/export**

---

## 📊 Target Users (Indonesian-focused)

### Primary:
- 🏢 **Indonesian PT/CV owners**
- 👔 **Local employers** (hiring Indonesian staff)
- 💼 **Indonesian accountants/tax consultants**
- 🏭 **Manufacturers** (luxury goods, imports)

### Use Cases:
- "Berapa tarif PPN terbaru untuk bisnis saya?"
- "Bagaimana aturan PKWT untuk karyawan Indonesia?"
- "PPh 21 berapa untuk gaji Rp 15 juta?"
- "Mobil mewah kena PPnBM berapa persen?"

---

## 🔧 Processing Instructions

### 1. Pasal-Level Chunking
Each **Pasal** = 1 chunk with:
```json
{
  "chunk_id": "UU-7-2021-Pasal-5",
  "law_id": "UU-7-2021",
  "type": "pasal",
  "pasal_number": "5",
  "ayat": ["1", "2"],
  "title": "Tarif Pajak Pertambahan Nilai",
  "text_id": "[Full Indonesian text of Pasal 5]",
  "text_en": "[English translation if available]",
  "summary_id": "Pasal ini mengatur kenaikan tarif PPN dari 11% ke 12%",
  "summary_en": "This article regulates PPN rate increase from 11% to 12%",
  "keywords": ["PPN", "VAT", "tax rate", "tarif pajak"],
  "entities": {
    "tax_type": "PPN",
    "rate_old": "11%",
    "rate_new": "12%",
    "effective_date": "2025-01-01"
  },
  "cross_references": ["UU-42-2009-Pasal-7", "PP-55-2022"],
  "relevance_score": 0.95,
  "target_audience": ["indonesian_business_owner", "accountant", "tax_consultant"],
  "use_cases": ["VAT calculation", "pricing strategy", "tax compliance"],
  "citation": {
    "source": "UU 7/2021 LNRI 2021/246",
    "page": "15-18",
    "official_url": "https://peraturan.bpk.go.id/..."
  }
}
```

### 2. Tables & Schedules
Extract **tax tables** separately:
```json
{
  "chunk_id": "UU-7-2021-Table-PPh21",
  "type": "table",
  "title": "Tarif PPh 21 Progresif",
  "data": [
    {"income_bracket": "0-60 juta", "rate": "5%"},
    {"income_bracket": "60-250 juta", "rate": "15%"},
    {"income_bracket": "250-500 juta", "rate": "25%"},
    {"income_bracket": ">500 juta", "rate": "30%"}
  ],
  "notes": "PTKP: Rp 54 juta/tahun (2025)"
}
```

### 3. Calculations & Examples
Include **practical examples**:
```json
{
  "chunk_id": "UU-7-2021-Example-PPh21",
  "type": "example",
  "scenario": "Karyawan dengan gaji Rp 15 juta/bulan",
  "calculation": {
    "gross_income": 15000000,
    "annual_income": 180000000,
    "ptkp": 54000000,
    "taxable_income": 126000000,
    "tax_5pct": 3000000,
    "tax_15pct": 9900000,
    "total_tax": 12900000,
    "monthly_tax": 1075000
  },
  "explanation_id": "Gaji Rp 15 juta → PPh 21 per bulan: Rp 1.075.000",
  "relevant_pasal": ["UU-7-2021-Pasal-17"]
}
```

### 4. Compliance Checklist
Create **actionable checklists**:
```json
{
  "chunk_id": "PP-35-2021-Checklist-PKWT",
  "type": "checklist",
  "title": "Syarat Membuat PKWT",
  "items": [
    {"step": 1, "action": "Tentukan jenis pekerjaan (tertentu/musiman)", "required": true},
    {"step": 2, "action": "Buat kontrak tertulis dalam Bahasa Indonesia", "required": true},
    {"step": 3, "action": "Maksimal 5 tahun (2 tahun + perpanjangan 1x)", "required": true},
    {"step": 4, "action": "Daftarkan ke Disnaker (jika >1 bulan)", "required": true},
    {"step": 5, "action": "Bayar BPJS Ketenagakerjaan + Kesehatan", "required": true}
  ],
  "penalties": "Jika dilanggar → PKWT menjadi PKWTT (permanent)",
  "authority": "Disnaker setempat"
}
```

### 5. Indonesian Language Priority
- **Primary**: Bahasa Indonesia
- **Secondary**: English (for expats working with Indonesian companies)
- **Keywords**: Both languages
- **Summaries**: Concise, bilingual

---

## 📋 Quality Checklist

Before submitting, verify:

- [ ] All **Pasal** extracted (none skipped)
- [ ] **Tax rates** accurate and dated
- [ ] **PTKP thresholds** current (2025)
- [ ] **Effective dates** clearly stated
- [ ] **Penalties/sanctions** included
- [ ] **Cross-references** to related laws
- [ ] **Practical examples** for common scenarios
- [ ] **Checklists** for compliance
- [ ] **Bilingual keywords** (ID + EN)
- [ ] **Source citations** complete

---

## 🧪 Test Questions (15 per law)

### Example for UU 7/2021:
1. "Berapa tarif PPN yang berlaku mulai 2025?"
2. "Apa itu carbon tax dan kapan mulai berlaku?"
3. "Bagaimana cara hitung PPh 21 untuk gaji Rp 20 juta?"
4. "Apakah ekspor kena PPN?"
5. "PTKP berapa untuk tahun 2025?"
6. "Bagaimana tax amnesty program bekerja?"
7. "PPh 23 berapa persen untuk jasa konsultan?"
8. "Apa perbedaan PPh 21 dan PPh 26?"
9. "Apakah UMKM dapat insentif pajak?"
10. "Bagaimana lapor SPT Tahunan online?"
11. "Sanksi terlambat bayar pajak berapa?"
12. "Bagaimana hitung PPN untuk jasa digital?"
13. "Apa syarat dapat tax holiday untuk investasi?"
14. "Bagaimana withholding tax untuk dividen?"
15. "Apa itu super deduction untuk R&D?"

---

## 📁 Deliverables

Save in `Worker_7_Tax_Advanced/OUTPUT/`:

1. `UU-7-2021_READY_FOR_KB.jsonl`
2. `PP-35-2021_READY_FOR_KB.jsonl`
3. `PP-55-2022_READY_FOR_KB.jsonl`
4. `PP-71-2019_READY_FOR_KB.jsonl`

Save in `Worker_7_Tax_Advanced/REPORTS/`:

1. `UU-7-2021_PROCESSING_REPORT.md`
2. `UU-7-2021_TEST_QUESTIONS.md`
3. (repeat for all 4 laws)

---

## 🚀 Ready to Process?

1. ✅ Read `MASTER_PROMPT_TEMPLATE.md`
2. ✅ Study `PP 28/2025` gold standard
3. ✅ Process your 4 laws
4. ✅ Run quality checks
5. ✅ Submit deliverables

**Focus**: Serve Indonesian citizens navigating complex tax & employment regulations. Accuracy = trust.
