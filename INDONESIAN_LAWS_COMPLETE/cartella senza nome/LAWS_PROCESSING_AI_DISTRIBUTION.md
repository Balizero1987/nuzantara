# 🤖 INDONESIAN LAWS - AI PROCESSING DISTRIBUTION

**Date**: November 3, 2025  
**Total Laws to Process**: 25 PDFs (already downloaded)  
**Distribution**: 6 AI Workers  
**Standard**: PP 28/2025 methodology

---

## 📊 DISTRIBUTION PLAN

### AI WORKER #1 - CRITICAL TAX & INVESTMENT (4 laws)
- **UU_7_1992_Banking.pdf**
- **UU_25_2007_Investment.pdf**
- **UU_40_2007_PT_PMA.pdf**
- **UU_4_2023_Financial_Sector_Dev.pdf**

**Why grouped**: Core business formation, capital, banking regulations

---

### AI WORKER #2 - IMMIGRATION & MANPOWER (4 laws)
- **UU_6_2011_Immigration.pdf**
- **UU_13_2003_Manpower.pdf**
- **UU_20_2016_TKA.pdf**
- **PP_31_2013_Immigration_Detail.pdf**

**Why grouped**: KITAS, work permits, foreign workers, visa procedures

---

### AI WORKER #3 - OMNIBUS & LICENSING (4 laws)
- **UU_6_2023_Cipta_Kerja.pdf**
- **UU_11_2020_Omnibus_Law.pdf**
- **PP_5_2021_OSS.pdf**
- **UU_1_2022_Relations_Central_Regional.pdf**

**Why grouped**: Business licensing framework, OSS, risk-based licensing

---

### AI WORKER #4 - PROPERTY & ENVIRONMENT (5 laws)
- **UU_5_1960_Real_Estate.pdf**
- **PP_14_2021_Housing.pdf**
- **UU_32_2009_Environment.pdf**
- **PP_22_2021_Environment_Protection.pdf**
- **UU_31_2004_Fisheries.pdf**

**Why grouped**: Land rights, Hak Pakai, environmental compliance, coastal property

---

### AI WORKER #5 - HEALTHCARE & SOCIAL (4 laws)
- **UU_36_2009_Health.pdf**
- **UU_29_2004_Medical_Practice.pdf**
- **UU_24_2011_BPJS.pdf**
- **UU_20_2003_Education_System.pdf**

**Why grouped**: Healthcare services, social security, education permits

---

### AI WORKER #6 - SPECIALIZED SECTORS (4 laws)
- **KUHP_2025_New_Penal_Code.pdf**
- **UU_21_2008_Sharia_Banking.pdf**
- **UU_17_2008_Shipping.pdf**
- **UU_2_2017_Construction.pdf**

**Why grouped**: Legal compliance, specialized banking, maritime, construction permits

---

## 📋 STANDARD PROMPT FOR ALL AI WORKERS

```
# INDONESIAN LAW PROCESSING TASK

## Your Mission
Process the assigned Indonesian laws using the **PP 28/2025 methodology** to create production-ready JSONL files for Bali Zero's legal knowledge base.

## Input Files
You have been assigned the following PDF files from `/Users/antonellosiano/Desktop/INDONESIAN_LAWS_COMPLETE/`:

[LIST YOUR ASSIGNED FILES HERE]

## Processing Standard (PP 28/2025 Methodology)

### Step 1: Metadata Extraction
For EACH law, extract:
```json
{
  "law_id": "UU-40-2007",
  "title": "Perseroan Terbatas (PT Law)",
  "title_en": "Limited Liability Company Law",
  "enacted_at": "2007-08-16",
  "lnri_no": "LNRI 2007/106",
  "status": "in_force",
  "sectors": ["corporate", "investment", "governance"],
  "ministries": ["Kemenkumham", "BKPM"],
  "systems": ["OSS", "AHU Online"]
}
```

### Step 2: Structural Parsing
Map the hierarchy:
- **BAB** (Chapter)
- **Bagian** (Section)
- **Paragraf** (Paragraph)
- **Pasal** (Article) ← **ATOMIC UNIT FOR CHUNKING**
- **Ayat** (Verse/Clause)
- **Huruf** (Letter/Point)

### Step 3: Pasal-Level Chunking
Create ONE chunk per Pasal:

```json
{
  "chunk_id": "UU-40-2007-Pasal-7",
  "law_id": "UU-40-2007",
  "type": "pasal",
  "pasal_number": "7",
  "ayat": "1",
  "text_id": "Perseroan didirikan oleh 2 (dua) orang atau lebih dengan akta notaris yang dibuat dalam bahasa Indonesia.",
  "text_en": "Company is established by 2 (two) or more persons by notarial deed made in Indonesian language.",
  "signals": {
    "entity_type": "PT",
    "requirement": "minimum_shareholders",
    "minimum_value": 2,
    "document_required": ["akta_notaris"],
    "language_requirement": "Indonesian",
    "authority": "Notaris"
  },
  "citations": {
    "source": "UU-40-2007.pdf",
    "page": 12,
    "bab": "II",
    "bagian": "Kedua"
  },
  "cross_references": [
    "UU-40-2007-Pasal-8",
    "UU-40-2007-Pasal-9"
  ]
}
```

### Step 4: Lampiran (Annexes) Processing
If law contains annexes (Lampiran):
- Extract tables as CSV/Parquet format
- Each row = one record
- Maintain all columns with headers
- Reference annex in main chunks

Example:
```csv
kbli_code,business_activity,risk_level,pb_type,authority,requirements
01111,Padi cultivation,RENDAH,SLF,Kabupaten/Kota,"Lahan,Air"
```

### Step 5: Obligations Matrix
Create "who does what" table:

```csv
subject,action,system,documents,deadline,penalty,exemptions
Pelaku_Usaha,Input_KBLI_5_digit,OSS,"produk,kapasitas,tenaga_kerja,investasi",Before_PBBR_request,Rejection,UMKU_exempt
```

### Step 6: Glossary & Terms
Extract key terms with bilingual definitions:

```json
{
  "terms": [
    {
      "id_term": "Perizinan Berusaha",
      "en_term": "Business Licensing",
      "it_term": "Licenza Commerciale",
      "definition_id": "Izin yang diberikan kepada Pelaku Usaha...",
      "definition_en": "License granted to Business Actors...",
      "aliases": ["PBBR", "Business Permit"],
      "related_terms": ["OSS", "NIB", "KBLI"]
    }
  ]
}
```

### Step 7: JSONL Output Format
Final output: ONE JSONL file per law

Filename: `[LAW_ID]_READY_FOR_KB.jsonl`

Each line is a complete JSON object:
```jsonl
{"chunk_id":"UU-40-2007-Pasal-1","type":"pasal",...}
{"chunk_id":"UU-40-2007-Pasal-2","type":"pasal",...}
{"chunk_id":"UU-40-2007-Meta","type":"metadata",...}
{"chunk_id":"UU-40-2007-Glossary","type":"glossary",...}
```

## Quality Checklist

Before submitting, verify:

- [ ] All Pasal extracted (no missing articles)
- [ ] Text is clean (no OCR artifacts)
- [ ] Ayat separated correctly
- [ ] Lampiran tables normalized
- [ ] Cross-references mapped
- [ ] English translations for key terms
- [ ] Signals extracted (requirements, deadlines, authorities)
- [ ] Citations include source PDF + page number
- [ ] JSONL validates (no syntax errors)
- [ ] Chunk IDs are unique and consistent

## Bilingual Requirements

Provide translations for:
1. **Law title** (ID/EN/IT)
2. **Key terms** in glossary (ID/EN/IT)
3. **Pasal text** for critical articles (ID/EN)
4. **Obligations** subjects and actions (ID/EN)

## Output Deliverables

For your assigned laws, deliver:

1. **JSONL files** (one per law)
   - Location: `/Users/antonellosiano/Desktop/LAWS_PROCESSED/[LAW_ID]_READY_FOR_KB.jsonl`

2. **Processing report** (markdown)
   - Filename: `[LAW_ID]_PROCESSING_REPORT.md`
   - Include:
     - Total Pasal count
     - Total chunks created
     - Lampiran tables extracted
     - Cross-references mapped
     - Processing time
     - Quality check results

3. **Test queries** (15 questions per law)
   - Filename: `[LAW_ID]_TEST_QUESTIONS.md`
   - Mix of:
     - Factual retrieval ("What is minimum PT shareholders?")
     - Procedural ("How to register PT PMA?")
     - Compliance ("What documents needed for KITAS?")
     - Cross-law ("How does UU 40/2007 relate to UU 25/2007?")

## Example Reference

Use **PP 28/2025** as your gold standard:
- Location: `/Users/antonellosiano/Desktop/PP28_FINAL_PACKAGE/`
- Files:
  - `PP_28_2025_READY_FOR_KB.jsonl` (523 chunks)
  - `PP28_COMPLETE_ANALYSIS.md`
  - `PP28_15_TEST_QUESTIONS.md`

## Timeline

- **Processing time per law**: 2-4 hours
- **Your total workload**: 4-5 laws
- **Expected completion**: 8-20 hours
- **Deadline**: Within 48 hours

## Support & Questions

If you encounter issues:
1. Check PP 28/2025 reference files
2. Flag ambiguous Pasal for manual review
3. Document OCR quality issues
4. Note any missing annexes or unclear cross-references

## Final Notes

**CRITICAL**: 
- Every Pasal is a source of truth
- No hallucination - if text is unclear, flag it
- Maintain legal precision in translations
- Preserve all citations and references
- Extract ALL signals (deadlines, amounts, requirements)

**REMEMBER**: These laws will be used by Bali Zero team (Setup, Tax, Executive Consulting) to serve real clients. Accuracy is paramount.

---

**START PROCESSING NOW** ✅
```

---

## 🚀 EXECUTION COMMANDS

### Launch All 6 AI Workers

```bash
# Create processing directory
mkdir -p /Users/antonellosiano/Desktop/LAWS_PROCESSED

# Worker 1 - Tax & Investment
echo "Processing Tax & Investment laws..." > /Users/antonellosiano/Desktop/LAWS_PROCESSED/WORKER_1.log

# Worker 2 - Immigration & Manpower
echo "Processing Immigration & Manpower laws..." > /Users/antonellosiano/Desktop/LAWS_PROCESSED/WORKER_2.log

# Worker 3 - Omnibus & Licensing
echo "Processing Omnibus & Licensing laws..." > /Users/antonellosiano/Desktop/LAWS_PROCESSED/WORKER_3.log

# Worker 4 - Property & Environment
echo "Processing Property & Environment laws..." > /Users/antonellosiano/Desktop/LAWS_PROCESSED/WORKER_4.log

# Worker 5 - Healthcare & Social
echo "Processing Healthcare & Social laws..." > /Users/antonellosiano/Desktop/LAWS_PROCESSED/WORKER_5.log

# Worker 6 - Specialized Sectors
echo "Processing Specialized Sectors laws..." > /Users/antonellosiano/Desktop/LAWS_PROCESSED/WORKER_6.log
```

---

## 📊 PROGRESS TRACKING

| Worker | Laws | Status | Completion | JSONL Files | Test Files |
|--------|------|--------|------------|-------------|------------|
| #1 | 4 | ⏳ Pending | 0% | 0/4 | 0/4 |
| #2 | 4 | ⏳ Pending | 0% | 0/4 | 0/4 |
| #3 | 4 | ⏳ Pending | 0% | 0/4 | 0/4 |
| #4 | 5 | ⏳ Pending | 0% | 0/5 | 0/5 |
| #5 | 4 | ⏳ Pending | 0% | 0/4 | 0/4 |
| #6 | 4 | ⏳ Pending | 0% | 0/4 | 0/4 |
| **TOTAL** | **25** | ⏳ | **0%** | **0/25** | **0/25** |

**Expected Timeline**: 48 hours (2 days)  
**Start Date**: November 3, 2025  
**Target Completion**: November 5, 2025

---

## ✅ VALIDATION CRITERIA

After all workers complete, verify:

1. **25 JSONL files** created (one per law)
2. **25 processing reports** with stats
3. **25 test question sets** (15 questions each = 375 total)
4. All files pass JSON validation
5. Total chunks ≈ 8,000-12,000 (depending on law complexity)
6. Cross-references mapped between related laws
7. No duplicate chunk_ids across all files

---

## 🎯 NEXT STEPS AFTER COMPLETION

1. **Consolidate** all JSONL files into master directory
2. **Deploy** to ChromaDB `legal_intelligence` collection
3. **Run test suite** (375 questions across all laws)
4. **Validate** cross-law queries work correctly
5. **Integrate** with ZANTARA v3 Ω endpoints
6. **Train team** on new legal knowledge base

---

**READY TO DISTRIBUTE TO 6 AI WORKERS** 🚀

Copy this prompt to each AI and assign their specific law group.
