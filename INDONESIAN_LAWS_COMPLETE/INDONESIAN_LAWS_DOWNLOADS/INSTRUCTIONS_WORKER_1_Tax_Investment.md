# 🤖 WORKER #1: Tax & Investment Laws

## 👤 Your Role
You are a specialized legal AI processing Indonesian tax and investment legislation for ZANTARA's RAG system.

---

## 📚 Your Assigned Laws (4)

1. **UU 7/2021** - Harmonisasi Peraturan Perpajakan (Tax Harmonization)
2. **UU 25/2007** - Penanaman Modal (Investment Law)
3. **PP 45/2019** - Tax Incentives
4. **UU 40/2007** - Perseroan Terbatas (Limited Companies)

---

## 🎯 Mission

Process these 4 laws following the **PP 28/2025 gold standard methodology** to create production-ready JSONL files for ZANTARA's knowledge base.

**Target users**: Both Indonesian citizens (WNI) and expatriates (WNA).

---

## 🛠️ Processing Instructions

### Step 1: Extract Text from PDF
- Use OCR if needed
- Preserve exact Indonesian legal terminology
- Maintain structure: BAB → Bagian → Paragraf → Pasal → Ayat → Huruf

### Step 2: Chunking (CRITICAL)
**Atomic unit = 1 Pasal**

Example chunk:
```json
{
  "chunk_id": "UU-7-2021-Pasal-4",
  "type": "pasal",
  "text": "Subjek Pajak adalah Orang Pribadi atau Badan yang dapat dikenakan pajak.",
  "metadata": {
    "law_id": "UU-7-2021",
    "bab": "BAB II",
    "bagian": "Bagian Kesatu",
    "pasal": "4",
    "ayat": ["1", "2", "3"],
    "cross_refs": ["Pasal 2", "Pasal 5", "PP 45/2019 Pasal 7"]
  },
  "signals": {
    "tax_type": ["income_tax", "VAT", "corporate_tax"],
    "applies_to": ["WNI", "WNA", "PT_Lokal", "PT_PMA"],
    "citizenship_requirement": "both",
    "requires_NPWP": true,
    "tax_rate": "variable",
    "deadline": "annual",
    "penalties": true
  }
}
```

### Step 3: Critical Signals to Extract

For **Tax Laws** (UU 7/2021, PP 45/2019):
- `tax_type`: income, VAT, corporate, withholding, etc.
- `applies_to`: WNI, WNA, PT_Lokal, PT_PMA
- `tax_rate`: percentage or "variable"
- `tax_incentive`: true/false
- `deadline`: when to file/pay
- `penalties`: fines/sanctions
- `requires_NPWP`: Indonesian tax ID required
- `exemptions`: who is exempt

For **Investment Law** (UU 25/2007):
- `investment_type`: domestic (PMDN) or foreign (PMA)
- `sector`: which KBLI sector
- `foreign_ownership_limit`: 0%, 49%, 67%, 100%, "depends"
- `local_partner_required`: true/false
- `minimum_investment`: amount in IDR
- `incentives_available`: tax holidays, customs exemptions
- `restricted_areas`: negative investment list

For **PT Law** (UU 40/2007):
- `company_type`: PT Lokal, PT PMA
- `minimum_shareholders`: 2
- `minimum_capital`: amount
- `foreign_ownership_allowed`: true/false/percentage
- `director_requirements`: WNI only or WNA allowed
- `reporting_obligations`: annual, quarterly

### Step 4: Glossary Extraction
Create `UU-7-2021_GLOSSARY.json`:
```json
{
  "Subjek Pajak": "Tax subject - individual or entity liable for taxation",
  "NPWP": "Nomor Pokok Wajib Pajak - Tax Identification Number",
  "PPh": "Pajak Penghasilan - Income Tax",
  "PPN": "Pajak Pertambahan Nilai - Value Added Tax",
  "PT PMA": "Perseroan Terbatas Penanaman Modal Asing - Foreign Investment Company",
  "PT Lokal": "Local Indonesian company (100% WNI ownership)",
  "PMDN": "Penanaman Modal Dalam Negeri - Domestic Investment",
  "PMA": "Penanaman Modal Asing - Foreign Investment"
}
```

### Step 5: Test Questions (15 per law)
Create `UU-7-2021_TEST_QUESTIONS.md`:

```markdown
# Test Questions - UU 7/2021

## For WNI (Indonesian Citizens)
1. Berapa tarif PPh untuk warga negara Indonesia yang berpenghasilan 500 juta per tahun?
2. Apakah saya perlu NPWP jika saya hanya freelancer?
3. Bagaimana cara lapor SPT tahunan untuk PT lokal?

## For WNA (Expatriates)
4. What is the income tax rate for expatriates working in Indonesia?
5. Do I need NPWP as a foreigner with KITAS?
6. Can my PT PMA get tax incentives under PP 45/2019?

## Mixed Scenarios
7. Saya WNI, pasangan saya WNA. Bagaimana pajak untuk PT dengan ownership 60/40?
8. I'm WNA opening a PT with Indonesian partners - what's the tax structure?

## Complex Queries
9. Perbandingan tarif pajak: PT Lokal vs PT PMA
10. Tax holiday untuk investasi di sektor manufaktur - syarat apa saja?
11. Apa sanksi jika terlambat bayar pajak untuk PT PMA?
12. Cross-reference: PP 45/2019 incentives vs UU 7/2021 base rates
13. Foreign investor wants 100% ownership - which sectors allow this?
14. Minimum investment untuk PT PMA di Jakarta vs di luar Jakarta
15. NPWP requirements for WNA directors in PT PMA
```

### Step 6: Processing Report
Create `UU-7-2021_PROCESSING_REPORT.md`:

```markdown
# Processing Report - UU 7/2021

## Law Metadata
- **Law ID**: UU-7-2021
- **Title**: Harmonisasi Peraturan Perpajakan
- **Enacted**: 2021-10-29
- **Status**: In force
- **Replaces**: Multiple previous tax laws (consolidated)

## Processing Summary
- **Total Pasal**: 150
- **Total Chunks**: 150
- **Total Ayat**: 450
- **Lampiran**: 3 annexes processed separately

## Structure
- BAB I: Ketentuan Umum (15 Pasal)
- BAB II: Subjek Pajak (20 Pasal)
- BAB III: Objek Pajak (30 Pasal)
- ... (continue for all BABs)

## Cross-References Mapped
- Internal: 89 cross-references to other Pasal within UU 7/2021
- External: 45 references to:
  - PP 45/2019 (tax incentives)
  - UU 40/2007 (PT regulations)
  - UU 25/2007 (investment law)

## WNI/WNA Analysis
- **Applies to both**: 120 Pasal (80%)
- **WNI only**: 15 Pasal (10%)
- **WNA specific**: 10 Pasal (7%)
- **Ambiguous**: 5 Pasal (3%) - requires legal clarification

## Quality Checklist
- [x] All Pasal extracted
- [x] Metadata complete
- [x] Cross-references mapped
- [x] Lampiran processed
- [x] Glossary created
- [x] WNI/WNA signals identified
- [x] 15 test questions generated

## Issues Encountered
- Lampiran II table formatting required manual adjustment
- 3 Pasal with ambiguous citizenship requirements - marked for review

## Processing Time
- Start: 2025-01-15 09:00
- End: 2025-01-15 13:30
- Duration: 4.5 hours
```

---

## 📦 Deliverables (per law)

For each of your 4 laws, produce:

1. **[LAW_ID]_READY_FOR_KB.jsonl** - Main output file
2. **[LAW_ID]_PROCESSING_REPORT.md** - Detailed report
3. **[LAW_ID]_TEST_QUESTIONS.md** - 15 test queries
4. **[LAW_ID]_GLOSSARY.json** - Legal terms dictionary
5. **[LAW_ID]_METADATA.json** - Structured metadata

Save all in: `OUTPUT/`

---

## ✅ Quality Standards

Every chunk MUST have:
- ✅ Unique `chunk_id`
- ✅ Complete `metadata` (BAB, Bagian, Pasal, Ayat)
- ✅ Rich `signals` (tax_type, applies_to, citizenship_requirement)
- ✅ Cross-references mapped
- ✅ Clean, accurate Indonesian text

---

## 🚨 Common Mistakes to Avoid

❌ Mixing multiple Pasal in one chunk
❌ Forgetting to extract Lampiran (annexes)
❌ Missing WNI/WNA citizenship signals
❌ Incomplete cross-references
❌ Not translating technical terms in glossary
❌ Test questions only for expats (include WNI!)

---

## 🆘 If You Get Stuck

1. Check PP 28/2025 gold standard example
2. Re-read the methodology in README_COORDINAMENTO.md
3. Contact Zero Master if blocked

---

## 📊 Progress Tracking

Update this table as you work:

| Law | Status | % | Time | Issues |
|-----|--------|---|------|--------|
| UU 7/2021 | ⚪ Not Started | 0% | - | - |
| UU 25/2007 | ⚪ Not Started | 0% | - | - |
| PP 45/2019 | ⚪ Not Started | 0% | - | - |
| UU 40/2007 | ⚪ Not Started | 0% | - | - |

---

**YOU GOT THIS! 🚀**

Remember: Quality > Speed. Take time to do it right.
