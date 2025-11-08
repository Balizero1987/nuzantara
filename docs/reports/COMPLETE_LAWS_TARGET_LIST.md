# 📚 COMPLETE INDONESIAN LAWS TARGET LIST
**Updated**: 2025-11-03  
**Goal**: Complete legal framework for ZANTARA RAG

---

## ✅ LAWS WE HAVE (16 PDFs + 1 Processed)

### Critical - Already Have:
1. **PP 28/2025** - PBBR ✅ FULLY PROCESSED
2. **UU 6/2023** - Cipta Kerja (Job Creation) ✅ PDF
3. **UU 11/2020** - Omnibus Law ✅ PDF (8MB)
4. **UU 6/2011** - Immigration ✅ PDF (272KB)
5. **UU 13/2003** - Ketenagakerjaan (Manpower/TKA) ✅ PDF (441KB)
6. **UU 25/2007** - Investment (PMA) ✅ PDF
7. **UU 40/2007** - PT (Limited Liability Company) ✅ PDF
8. **UU 36/2008** - Tax (Income Tax) ✅ PDF

### Codes - Already Have:
9. **KUHPerdata** - Civil Code ✅ PDF (104KB)
10. **UU 19/2016** - ITE (Electronic Transactions) ✅ PDF

### Sector Laws - Already Have:
11. **UU 5/1960** - Agraria (Land/Property) ✅ PDF (4.4MB)
12. **UU 32/2014** - Marine/Maritime ✅ PDF (2.9MB)
13. **UU 32/2009** - Environment ✅ PDF
14. **UU 29/2004** - Medical Practice ✅ PDF
15. **UU 20/2003** - Education ✅ PDF
16. **UU 12/2012** - Higher Education ✅ PDF (2MB)
17. **UU 18/2013** - Forest Prevention ✅ PDF

---

## 🔴 CRITICAL LAWS MISSING (16)

### A. Business/Immigration Core (6):
1. **PP 34/2021** - TKA Implementing Regulation
2. **PP 31/2013** - Immigration Implementing Regulation
3. **Permenaker 8/2021** - RPTKA (Foreign Worker Employment Plan)
4. **Permenkumham 10/2017** - Immigration Procedures
5. **Permenkumham 22/2023** - Immigration Updates
6. **Permenkumham 11/2024** - Latest Immigration Updates

### B. Tax Laws (3):
7. **UU 7/2021** - Harmonisasi Peraturan Perpajakan (HPP - Tax Harmonization)
8. **UU 28/2007** - KUP (General Tax Provisions)
9. **UU 42/2009** - PPN (VAT Law)

### C. Criminal Code (1):
10. **KUHP 2025** - New Criminal Code (effective 2026)

### D. Real Estate/Property (2):
11. **PP 18/2021** - Hak Pengelolaan (Management Rights)
12. **PMPA 21/2020** - Foreign Property Ownership

### E. Corporate/Investment (2):
13. **PP 5/2021** - Investment Licensing Implementation
14. **UU 1/2004** - State Treasury (for government contracts)

### F. Circular Letters (2):
15. **SE IMI 417/2025** - Latest Immigration Circular
16. **SE IMI 453/2025** - Latest Immigration Circular

---

## 🟡 SECTOR LAWS TO ADD (14)

### Banking/Finance (3):
17. **UU 4/2023** - P2SK (Financial Sector Development & Strengthening)
18. **UU 10/1998** - Banking (as amended by UU 7/2011)
19. **UU 21/2011** - OJK (Financial Services Authority)

### Construction/Infrastructure (2):
20. **UU 2/2017** - Construction Services
21. **UU 38/2004** - Roads

### Healthcare (3):
22. **UU 36/2009** - Health
23. **UU 24/2011** - BPJS (Social Security)
24. **UU 18/2012** - Food

### Environment (2):
25. **UU 18/2008** - Waste Management
26. **UU 37/2014** - Soil & Water Conservation

### Maritime (2):
27. **UU 17/2008** - Shipping
28. **UU 31/2004** - Fisheries

### Education (2):
29. **UU 14/2005** - Teachers & Lecturers
30. **UU 16/2001** - Foundations (for education institutions)

---

## 🟢 TOTAL TARGET: 35 LAWS

| Category | Count | Status |
|----------|-------|--------|
| ✅ Already Have | 17 | 16 PDFs + 1 Fully Processed |
| 🔴 Critical Missing | 16 | Must download |
| 🟡 Sector Laws | 14 | Optional but recommended |
| **TOTAL** | **47** | **Complete Indonesian Legal Framework** |

---

## 📥 DOWNLOAD PRIORITIES

### Phase 1 - Critical (2-3 days):
- Download 16 critical missing laws
- Process PP 34/2021, PP 31/2013, UU 7/2021 first
- Deploy to RAG immediately

### Phase 2 - Existing PDFs (1 week):
- Process all 16 existing PDFs like PP 28/2025
- Full chunking, metadata, cross-references
- Deploy batch to RAG

### Phase 3 - Sector Laws (1-2 weeks):
- Download 14 sector laws
- Process and deploy
- Complete legal framework

---

## 🎯 PROCESSING METHODOLOGY (PP 28/2025 Standard)

For each law:
1. **Metadata**: law_id, title, enacted_at, LNRI, status, sectors
2. **Outline map**: BAB → Bagian → Paragraf → Pasal → Ayat → Huruf
3. **Articles chunking**: 1 file per Pasal (atomic unit)
4. **Annexes**: Normalize to CSV/Parquet if applicable
5. **Obligations matrix**: Extract who-does-what-when-where
6. **Glossary**: Terms, definitions, acronyms (ID/EN)
7. **Citations**: Cross-references to other laws
8. **3-level chunking**:
   - Pasal-level (atomic)
   - Sliding window 800-1200 tokens (overlap 150)
   - Tabular chunks (keep rows intact)
9. **Ingest to RAG**: ChromaDB with proper metadata
10. **Test**: 15 questions per law to verify retrieval

---

## 📊 ESTIMATED EFFORT

- **Per law processing**: 2-4 hours (depending on size)
- **Total effort**:
  - 16 critical: 32-64 hours
  - 16 existing PDFs: 32-64 hours
  - 14 sector laws: 28-56 hours
- **TOTAL**: 92-184 hours (2-4 weeks full-time)

---

## 🚀 IMPLEMENTATION PLAN

1. **Script to download 30 missing laws** (automated)
2. **Parallel processing pipeline** (process 3-4 laws simultaneously)
3. **Quality checks** (coverage test, leak test, authority test)
4. **RAG deployment** (batch ingest to ChromaDB)
5. **Integration testing** (ZANTARA can query all laws seamlessly)

---

**Next Action**: Download all 30 missing laws?
