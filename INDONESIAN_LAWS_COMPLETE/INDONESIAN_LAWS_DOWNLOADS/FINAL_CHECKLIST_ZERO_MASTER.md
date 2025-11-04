# ✅ FINAL CHECKLIST - Zero Master

## 📋 Pre-Processing Setup

- [x] LEGAL_PROCESSING_ZANTARA/ folder created on Desktop
- [x] 6 worker subfolders created with INPUT/WORK/OUTPUT
- [x] README_LEGAL_PROCESSING.md created
- [x] 6 worker instruction files created
- [x] MASTER_PROMPT_TEMPLATE.md created
- [ ] **NEXT**: Download 25 PDF laws into `01_RAW_LAWS/`

---

## 📥 Laws to Download (25)

### Worker #1: Tax & Investment
- [ ] UU 7/2021 - Harmonisasi Peraturan Perpajakan
- [ ] UU 25/2007 - Penanaman Modal
- [ ] PP 45/2019 - Tax Incentives
- [ ] UU 40/2007 - PT (Perseroan Terbatas)

### Worker #2: Immigration & Manpower
- [ ] UU 6/2011 - Keimigrasian
- [ ] PP 31/2013 - KITAS/KITAP
- [ ] UU 13/2003 - Ketenagakerjaan
- [ ] Perpres 20/2018 - TKA

### Worker #3: Omnibus & Licensing
- [ ] UU 6/2023 - Cipta Kerja
- [ ] PP 5/2021 - OSS
- [x] PP 28/2025 - PBBR (già fatto - gold standard)
- [ ] PP 24/2018 - OSS (old)

### Worker #4: Property & Environment
- [ ] UU 5/1960 - UUPA (Agraria)
- [ ] PP 18/2021 - Hak Pengelolaan
- [ ] UU 32/2009 - Lingkungan Hidup
- [ ] PP 22/2021 - Perlindungan Lingkungan
- [ ] UU 1/2011 - Perumahan

### Worker #5: Healthcare & Social
- [ ] UU 36/2009 - Kesehatan
- [ ] UU 24/2011 - BPJS
- [ ] UU 20/2003 - Pendidikan
- [ ] PP 47/2008 - Wajib Belajar

### Worker #6: Specialized
- [ ] KUHP (UU 1/2023) - Criminal Code
- [ ] KUHPerdata - Civil Code
- [ ] UU 21/2008 - Perbankan Syariah
- [ ] UU 17/2008 - Pelayaran

**Total: 24 to download (25 - 1 already done)**

---

## 🔄 Processing Progress Tracker

| Worker | Leggi | Completate | In Progress | Not Started |
|--------|-------|------------|-------------|-------------|
| #1 Tax | 4 | 0 | 0 | 4 |
| #2 Immigration | 4 | 0 | 0 | 4 |
| #3 Omnibus | 4 | 1 (PP28) | 0 | 3 |
| #4 Property | 5 | 0 | 0 | 5 |
| #5 Healthcare | 4 | 0 | 0 | 4 |
| #6 Specialized | 4 | 0 | 0 | 4 |
| **TOTALE** | **25** | **1** | **0** | **24** |

---

## 📊 Deliverables Tracker

### Per ogni legge servono 5 file:

| Worker | JSONL | Report | Questions | Glossary | Metadata |
|--------|-------|--------|-----------|----------|----------|
| #1 (4) | 0/4 | 0/4 | 0/4 | 0/4 | 0/4 |
| #2 (4) | 0/4 | 0/4 | 0/4 | 0/4 | 0/4 |
| #3 (4) | 1/4 | 1/4 | 1/4 | 1/4 | 1/4 |
| #4 (5) | 0/5 | 0/5 | 0/5 | 0/5 | 0/5 |
| #5 (4) | 0/4 | 0/4 | 0/4 | 0/4 | 0/4 |
| #6 (4) | 0/4 | 0/4 | 0/4 | 0/4 | 0/4 |
| **TOTALE** | **1/25** | **1/25** | **1/25** | **1/25** | **1/25** |

---

## 🎯 Milestone Targets

### Week 1 (Workers #1-3)
- [ ] Worker #1 completes 4 laws (Tax & Investment)
- [ ] Worker #2 completes 4 laws (Immigration & Manpower)
- [ ] Worker #3 completes 3 laws (Omnibus - excluding PP28)
- **Target**: 11 laws processed (12 total including PP28)

### Week 2 (Workers #4-6)
- [ ] Worker #4 completes 5 laws (Property & Environment)
- [ ] Worker #5 completes 4 laws (Healthcare & Social)
- [ ] Worker #6 completes 4 laws (Specialized)
- **Target**: 13 laws processed

### Week 3 (Quality & Integration)
- [ ] All 125 JSONL files (25 laws × 5 files) reviewed
- [ ] Consolidated glossary created (merge all 25)
- [ ] Cross-reference graph generated
- [ ] 375 test questions compiled (25 laws × 15 questions)
- [ ] Sample queries tested on RAG
- [ ] Deploy to ZANTARA production

---

## 🔍 Quality Gates

### Per ogni legge completata:

- [ ] JSONL validates (no syntax errors)
- [ ] All Pasal accounted for
- [ ] Lampiran processed
- [ ] WNI/WNA signals present
- [ ] Cross-references mapped
- [ ] Glossary min 20 terms
- [ ] 15 test questions generated
- [ ] Random sample spot-checked

### Before deployment:

- [ ] No duplicate chunk_ids across all laws
- [ ] Cross-references validate (target Pasal exists)
- [ ] WNI/WNA coverage: min 90% of chunks have citizenship signals
- [ ] Test queries return relevant results
- [ ] Bilingual glossary (ID-EN)

---

## 📁 File Organization Check

```
✅ Struttura corretta:

LEGAL_PROCESSING_ZANTARA/
├── 01_RAW_LAWS/
│   ├── UU-7-2021.pdf
│   ├── UU-25-2007.pdf
│   └── ... (24 PDFs totali)
├── 02_AI_WORKERS/
│   ├── Worker_1_Tax_Investment/
│   │   ├── INPUT/ (4 PDFs copiati da 01_RAW_LAWS)
│   │   ├── WORK_IN_PROGRESS/
│   │   └── OUTPUT/
│   │       ├── UU-7-2021_READY_FOR_KB.jsonl
│   │       ├── UU-7-2021_PROCESSING_REPORT.md
│   │       ├── UU-7-2021_TEST_QUESTIONS.md
│   │       ├── UU-7-2021_GLOSSARY.json
│   │       └── UU-7-2021_METADATA.json
│   ├── Worker_2_Immigration_Manpower/
│   ├── Worker_3_Omnibus_Licensing/
│   ├── Worker_4_Property_Environment/
│   ├── Worker_5_Healthcare_Social/
│   └── Worker_6_Specialized/
├── 03_PROCESSED_OUTPUT/ (merge finale di tutti i JSONL)
├── 04_QUALITY_REPORTS/ (report aggregati)
└── 05_TEST_QUESTIONS/ (375 domande consolidate)
```

---

## 🚀 Deployment Readiness

### Before pushing to ZANTARA RAG:

- [ ] All 25 JSONL merged into single file
- [ ] Total chunks counted (estimate: 3000-5000)
- [ ] Metadata index created
- [ ] ChromaDB collection prepared
- [ ] Embedding model ready (multilingual)
- [ ] Test suite passed (375 questions)
- [ ] Documentation updated

---

## 📊 Statistics to Track

- **Total Pasal processed**: [TBD]
- **Total chunks created**: [TBD]
- **Total glossary terms**: [TBD]
- **Laws with Lampiran**: [TBD]
- **Cross-references mapped**: [TBD]
- **WNI-only Pasal**: [TBD]
- **WNA-allowed Pasal**: [TBD]
- **Both WNI+WNA Pasal**: [TBD]

---

## 🆘 Issues Log

| Date | Worker | Law | Issue | Resolution |
|------|--------|-----|-------|------------|
| - | - | - | - | - |

---

## ✅ Final Sign-Off

When ALL boxes checked:

- [ ] Zero Master reviews random sample (10% of chunks)
- [ ] Legal accuracy spot-check with domain expert
- [ ] ZANTARA integration test passed
- [ ] Production deployment approved

**Deadline: 3 weeks from start date**

---

**Current Status**: ⚪ Setup Complete - Ready to Download PDFs

**Next Action**: Download 24 PDF laws into `01_RAW_LAWS/`
