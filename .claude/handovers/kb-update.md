# Handover: KB Update (Immigration & KITAS)

## Latest Updates

### 2025-10-03 14:55 (KITAS Patch #2) [sonnet-4.5_m22]

**Completed**: KB UPDATE PATCH #2 - KITAS & LONG STAY PERMITS (2025)

**Changed**:
- `raw_books/E23_WORKING_KITAS_GUIDE_2025.txt` - NEW (361 lines) - Working KITAS comprehensive guide
- `raw_books/E28A_INVESTOR_KITAS_GUIDE_2025.txt` - NEW (397 lines) - Investor KITAS guide (10B IDR threshold)
- `raw_books/E31_FAMILY_DEPENDENT_KITAS_GUIDE_2025.txt` - NEW (457 lines) - Family/Dependent KITAS (5 subcategories)
- `raw_books/E33_RETIREMENT_REMOTE_KITAS_GUIDE_2025.txt` - NEW (492 lines) - Retirement + Digital Nomad visas
- `raw_books/KITAS_MIGRATION_GUIDE_OLD_TO_NEW_2025.txt` - NEW (470 lines) - C312/C313/C314 → E-series migration

**Summary**:
Created 5 comprehensive KITAS guides (2,177 lines total) covering all 2025 E-series residence permits. All guides include:
- Official 2025 pricing from Bali Zero pricelist (verified accurate)
- Old code → New code migration paths (C312/C313/C314 → E23/E28A/E31)
- Work rights clarification (E31A can work, E31B cannot, etc.)
- Path to KITAP (permanent residency) requirements
- FAQs, common issues, cost comparisons

**Key Info**:
- E23 Working KITAS: 34.5M IDR (offshore), replaces C312A/C312B
- E28A Investor: 17M IDR for 2 years (requires 10B IDR investment), replaces C314
- E31A Spouse: 11M IDR (1yr), CAN apply for work permit (new feature!)
- E33G Digital Nomad: 12.5M IDR - BRAND NEW 2024 visa (cheapest KITAS!)
- E33F Retirement: 14M IDR, age 55+, USD 1,500/month pension

**Language Compliance**: All guides in English (practical how-to content), Indonesian legal terms referenced by official names (Permenkumham No. 22/2023).

**Related**:
→ Full session: [.claude/diaries/2025-10-03_sonnet-4.5_m22.md](#patch-2-kitas)
→ Patch spec: [/tmp/KB_UPDATE_PATCH_2_KITAS_RESIDENCY.md]

**Next Steps**:
1. Optional: Re-index ChromaDB (files ready, auto-update on next ingest)
2. Test RAG queries: "digital nomad visa Indonesia", "C312 visa extension", "investor KITAS"
3. Deploy updated KB to production (if ChromaDB re-indexed)

---

### 2025-10-03 14:45 (C-series Code Replacement) [sonnet-4.5_m18]

**Completed**: Replaced ALL obsolete C312/C313/C314 codes with E-series across existing KB

**Changed**:
- `INDONESIA_VISA_ADVANCED_PROCEDURES_2025.md` - C3xx → E-series (45 replacements)
- `INDONESIA_VISA_COMPLIANCE_ENFORCEMENT_2025.md` - C3xx → E-series
- `INDONESIA_VISA_PRACTICAL_GUIDE_2025.md` - C3xx → E-series
- `INDONESIA_VISA_REGULATIONS_2025_COMPLETE.md` - C3xx → E-series
- `INDONESIA_VISA_TYPES_DETAILED_REQUIREMENTS_2025.md` - C3xx → E-series
- `e33f-retirement-kitas.json` - Added income requirements (pension $1,500/month OR $35K deposit)
- `e33g-digital-nomad-kitas.json` - Added clean criminal record requirement

**Summary**:
Updated 7 existing KB files to replace obsolete KITAS codes (C312/C313/C314) with correct E-series codes (E23/E28A/E31A). Enhanced E33F and E33G requirements with missing details.

**Related**:
→ Full session: [.claude/diaries/2025-10-03_sonnet-4.5_m18.md](#kb-update-c-series)

---

## KB Content Rules (PERMANENT)

**🔴 CRITICAL: ALL KB updates MUST follow this rule**

**Indonesian for LAW, English for PRACTICE**

- ✅ **Indonesian (Bahasa Indonesia)**: Legal regulations, official procedures, government forms
  - Permenkumham, Undang-Undang, RPTKA, LKPM, legal terminology
  
- ✅ **English**: Case studies, practical guides, FAQ, examples, user-facing content
  - How-to guides, troubleshooting, real-world scenarios

**Full Policy**: See `PROJECT_CONTEXT.md` section "KB Content Language Rules"

---

## Related Categories

- `rag-ingestion` - ChromaDB indexing (pending for new KITAS guides)
- `immigration-kb` - Indonesia visa/KITAS knowledge base
- `deploy-rag` - RAG backend deployment (if KB changes need production update)

---

**Last Updated**: 2025-10-03 14:55 CET
