# 🧪 PP 28/2025 - 15 TEST QUESTIONS

## For Testing ZANTARA Knowledge Base

Deploy Date: November 3, 2025
Collection: `legal_intelligence` (523 chunks)

---

## 📋 CATEGORY A: KBLI & OSS (5 questions)

### Q1: KBLI 5-Digit Requirement
**Question (ID)**: "Berapa digit kode KBLI yang wajib dimasukkan ke sistem OSS untuk perizinan berusaha?"

**Expected Answer**: 5 digit (Pasal 211)

**Keywords**: KBLI, OSS, 5 digit, input data, perizinan berusaha

---

### Q2: OSS Data Requirements
**Question (EN)**: "What data must entrepreneurs input into OSS for each KBLI 5-digit code?"

**Expected Answer**: 
- Produk (product)
- Kapasitas (capacity)
- Tenaga kerja (workforce)
- Rencana investasi (investment plan)

**Source**: Pasal 211

---

### Q3: OSS System Function
**Question (ID)**: "Apa fungsi utama sistem OSS dalam perizinan berusaha berbasis risiko?"

**Expected Answer**: Central licensing system, auto-approval mechanism, integration hub for all business licensing

**Keywords**: OSS, sistem perizinan, integrasi, PBBR

---

### Q4: KBLI Risk Classification
**Question (ID)**: "Bagaimana KBLI digunakan untuk menentukan tingkat risiko usaha?"

**Expected Answer**: Each KBLI code is mapped to risk level (low/medium/high), determines licensing requirements

**Source**: Lampiran I - KBLI + Risk Matrix

---

### Q5: KBLI Multiple Activities
**Question (EN)**: "Can a PT PMA register multiple KBLI codes? What are the requirements?"

**Expected Answer**: Yes, must input data for EACH 5-digit KBLI separately (Pasal 211)

---

## 📋 CATEGORY B: FOREIGN WORKERS (TKA) (3 questions)

### Q6: TKA Licensing Flow
**Question (ID)**: "Jelaskan alur perizinan TKA (Tenaga Kerja Asing) melalui sistem ketenagakerjaan dan hubungannya dengan OSS."

**Expected Answer**: 
1. Application via sistem ketenagakerjaan
2. Forwarded to Lembaga OSS
3. Forwarded to Imigrasi (Immigration)
4. Integrated workflow

**Source**: PP 28/2025 (TKA workflow sections)

---

### Q7: TKA and OSS Integration
**Question (EN)**: "How does the TKA (foreign worker) licensing system integrate with OSS?"

**Expected Answer**: Sistem ketenagakerjaan forwards applications to OSS, which coordinates with Immigration

---

### Q8: TKA Documentation
**Question (ID)**: "Dokumen apa yang diperlukan untuk mengajukan TKA dalam sistem OSS?"

**Expected Answer**: Reference employment system requirements, RPTKA, work permit documents

---

## 📋 CATEGORY C: SECTORS & BUSINESS TYPES (3 questions)

### Q9: Covered Sectors
**Question (EN)**: "List at least 10 sectors covered by PP 28/2025."

**Expected Answer**: 
1. Maritime (kelautan)
2. Forestry (kehutanan)
3. ESDM (energy/mining)
4. Industry (industri)
5. Trade (perdagangan)
6. Transport (transportasi)
7. Health/Food (kesehatan/makanan)
8. Education/Culture (pendidikan/kebudayaan)
9. Tourism (pariwisata)
10. Defense/Security (pertahanan/keamanan)

**Plus**: Creative, geospatial, manpower, cooperatives, investment, e-transactions, environment

---

### Q10: PT PMA Licensing
**Question (ID)**: "Apa saja persyaratan perizinan untuk PT PMA di sektor industri menurut PP 28/2025?"

**Expected Answer**: 
- KBLI 5-digit registration
- Risk assessment based on sector
- OSS system registration
- Sector-specific PB/PB UMKU

**Source**: Cross-reference sector requirements + KBLI matrix

---

### Q11: KEK/KPBPB Special Zones
**Question (ID)**: "Apakah ada perlakuan khusus untuk usaha di KEK atau KPBPB?"

**Expected Answer**: Yes, special processing through KEK/KPBPB authority, mentioned in regulation

---

## 📋 CATEGORY D: COMPLIANCE & SLA (2 questions)

### Q12: Auto-Approval SLA
**Question (EN)**: "What happens if OSS doesn't process a licensing application within the SLA timeframe?"

**Expected Answer**: Auto-approval mechanism (KKPRL example) - license automatically issued if SLA expires

**Source**: SLA provisions in PP 28/2025

---

### Q13: Risk-Based Licensing Principle
**Question (ID)**: "Jelaskan prinsip dasar perizinan berusaha berbasis risiko (PBBR)."

**Expected Answer**: 
- Business activities classified by risk level
- Higher risk = more requirements
- Low risk = simplified process
- Risk determines PB/PB UMKU requirements

---

## �� CATEGORY E: IMPLEMENTATION & ANNEXES (2 questions)

### Q14: Lampiran Structure
**Question (ID)**: "Ada berapa Lampiran dalam PP 28/2025 dan apa isinya?"

**Expected Answer**: 
- Lampiran I: KBLI + Risk + PB requirements
- Lampiran II: PB UMKU nomenclature
- Lampiran III: Risk analysis methodology

---

### Q15: Effective Date
**Question (EN)**: "When was PP 28/2025 enacted and when did it become effective?"

**Expected Answer**: 
- Enacted: June 5, 2025
- LNRI: 2025 No. 98
- Effective: Upon publication (June 5, 2025)

---

## 🎯 TESTING PROTOCOL

### How to Test:

1. **Open ZANTARA webapp**: https://zantara.balizero.com/chat
2. **Login as Zero**: zero@balizero.com / PIN 010719
3. **Ask each question in Indonesian or English**
4. **Verify response includes**:
   - ✅ Correct Pasal reference
   - ✅ Accurate information
   - ✅ Source citation (PP 28/2025)
   - ✅ No hallucination

### Success Criteria:

- **13/15 correct answers** = EXCELLENT (87%)
- **10/15 correct answers** = GOOD (67%)
- **<10 correct** = Needs tuning

### Common Failure Modes to Watch:

❌ No answer found (retrieval failure)
❌ Wrong Pasal cited
❌ Generic answer without specifics
❌ Hallucinated details not in law

---

## 📊 EXPECTED RETRIEVAL PERFORMANCE

Based on deployment:
- **Collection**: legal_intelligence
- **Documents**: 523 chunks
- **Embedding Model**: paraphrase-multilingual-MiniLM-L12-v2
- **Search**: Semantic similarity (cosine)

**Target metrics**:
- Precision@3: >85%
- Recall: >90%
- Response time: <2s

---

**Ready to test! 🚀**

