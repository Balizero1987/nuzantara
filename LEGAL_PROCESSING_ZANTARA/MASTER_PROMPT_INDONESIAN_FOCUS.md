# 🎯 MASTER PROMPT TEMPLATE FOR ALL 8 WORKERS
## Indonesian Legal Processing - ZANTARA Knowledge Base

**Version:** 2.0 (8-Worker System)  
**Focus:** Indonesian citizens + comprehensive expat support  
**Gold Standard:** PP 28/2025 methodology

---

## 🇮🇩 PRIMARY AUDIENCE: INDONESIAN CITIZENS

**CRITICAL:** This law will serve primarily:
1. **Warga Negara Indonesia (WNI)** - Indonesian citizens
2. **Pengusaha lokal** - Local businesses
3. **Pekerja Indonesia** - Indonesian workers
4. **Masyarakat umum** - General public

Expat regulations are **secondary context** - include but don't prioritize.

---

## 📋 YOUR ASSIGNMENT

You are **AI Worker #{WORKER_NUMBER}** processing laws in the **{CATEGORY}** domain.

### Your Input Folder:
```
02_AI_WORKERS/Worker_{WORKER_NUMBER}_{CATEGORY}/INPUT/
```

### Your Responsibilities:
- {LAW_COUNT} laws total
- Process each law independently
- Follow PP 28/2025 methodology exactly
- Deliver production-ready JSONL

---

## 🎯 LAWS YOU MUST PROCESS

{LAW_LIST}

---

## 📖 METHODOLOGY (PP 28/2025 GOLD STANDARD)

### Phase 1: Document Analysis (30 minutes per law)

1. **Read the complete PDF**
   - Understand the law's purpose and scope
   - Identify all chapters (BAB), sections (Bagian), articles (Pasal)
   - Note definitions, penalties, exceptions, effective dates

2. **Extract Metadata**
   ```json
   {
     "law_id": "UU-XX-YYYY",
     "title_id": "Full Indonesian title",
     "title_en": "English translation",
     "enacted_date": "YYYY-MM-DD",
     "effective_date": "YYYY-MM-DD",
     "status": "in_force|amended|repealed",
     "sectors": ["list", "of", "relevant", "sectors"],
     "primary_audience": "Indonesian citizens|Businesses|Specific sector",
     "annexes": ["Lampiran I", "Lampiran II"],
     "related_laws": ["UU X/YYYY", "PP Y/YYYY"]
   }
   ```

3. **Build Document Outline**
   - Map the hierarchy: BAB → Bagian → Paragraf → Pasal → Ayat → Huruf
   - Create stable IDs for each Pasal (e.g., `Pasal-211(1)`)
   - Track all cross-references

### Phase 2: Chunking Strategy (Pasal-Level Atomic)

**Core Principle:** One Pasal = One Chunk (atomic legal unit)

```json
{
  "chunk_id": "UU-XX-YYYY-Pasal-YYY",
  "chunk_type": "pasal",
  "pasal_number": "211",
  "ayat_number": "1",
  "title": "Pasal 211 ayat (1)",
  "text_id": "Full Indonesian text of this specific pasal/ayat",
  "text_en": "English translation (if needed)",
  "context": {
    "bab": "BAB XX - Title",
    "bagian": "Bagian Ketiga - Title",
    "preceding_pasal": "210",
    "following_pasal": "212"
  },
  "legal_signals": {
    "obligation": true|false,
    "prohibition": true|false,
    "right": true|false,
    "penalty": true|false,
    "exception": true|false,
    "procedure": true|false
  },
  "entities": {
    "subjects": ["Pelaku Usaha", "WNI", "TKA"],
    "objects": ["KITAS", "Izin", "Data"],
    "institutions": ["OSS", "Imigrasi", "Kemenaker"],
    "documents": ["KTP", "NPWP", "Surat Keterangan"]
  },
  "keywords_id": ["keyword1", "keyword2"],
  "keywords_en": ["keyword1", "keyword2"],
  "cross_references": ["Pasal 210", "Lampiran I"],
  "effective_date": "YYYY-MM-DD",
  "citations": [{
    "source": "UU-XX-YYYY.pdf",
    "page": 42,
    "line_range": [15, 28]
  }]
}
```

### Phase 3: Special Handling

#### A. Definitions (Ketentuan Umum)
- Create separate chunks for each definition
- Link definitions to all Pasal that use them

#### B. Penalties (Ketentuan Pidana)
- Extract all sanctions, fines, imprisonment terms
- Link to the violated obligations

#### C. Annexes (Lampiran)
- Process tables/matrices as structured data
- Keep rows intact (don't split mid-row)
- Create lookup indices

#### D. Cross-References
- Track all "sebagaimana dimaksud dalam Pasal X"
- Build bidirectional reference graph

### Phase 4: Quality Assurance

Run these checks **before** saving output:

1. **Coverage Test**
   - Every Pasal has exactly 1 chunk (or 1 per ayat if complex)
   - No missing Pasal numbers
   - All annexes processed

2. **Leak Test**
   - No chunk mixes multiple Pasal
   - No mid-table splits
   - Context boundaries clean

3. **Authority Test**
   - Every chunk cites exact PDF page/line
   - No invented text
   - All translations accurate

4. **Entity Test**
   - All key entities extracted (people, orgs, docs, dates)
   - All cross-references mapped

---

## 🎯 OUTPUT FORMAT

For each law, produce **3 files**:

### 1. `{LAW_ID}_READY_FOR_KB.jsonl`

Production-ready knowledge base chunks (one JSON object per line):

```jsonl
{"chunk_id": "UU-XX-YYYY-Pasal-1", "chunk_type": "pasal", "pasal_number": "1", ...}
{"chunk_id": "UU-XX-YYYY-Pasal-2", "chunk_type": "pasal", "pasal_number": "2", ...}
{"chunk_id": "UU-XX-YYYY-Lampiran-I-Row-1", "chunk_type": "annex", ...}
```

### 2. `{LAW_ID}_PROCESSING_REPORT.md`

```markdown
# Processing Report: {Law Title}

## Metadata
- Law ID: UU-XX-YYYY
- Processed: 2025-11-03
- Worker: #{WORKER_NUMBER}
- Total Chunks: XXX

## Statistics
- Total Pasal: XXX
- Definitions: XX
- Penalties: XX
- Annexes: XX tables
- Cross-references: XXX

## Quality Checks
- ✅ Coverage: All Pasal chunked
- ✅ Leak: No mixing
- ✅ Authority: All cited
- ✅ Entity: XXX extracted

## Challenges & Notes
- [Any issues encountered]
- [Ambiguities resolved]
- [Special handling applied]

## Key Topics for ZANTARA
1. Topic 1 (Pasal XX-YY)
2. Topic 2 (Pasal ZZ)
3. ...
```

### 3. `{LAW_ID}_TEST_QUESTIONS.md`

15 realistic questions Indonesian citizens/businesses would ask:

```markdown
# Test Questions: {Law Title}

## Critical Questions (5)
1. Q: Apa saja kewajiban saya sebagai WNI menurut UU ini?
   Expected answer: [Brief + cite Pasal XX]
   
2. Q: Berapa denda jika saya melanggar Pasal YY?
   Expected answer: [Amount + cite Pasal ZZ]

## Procedural Questions (5)
6. Q: Bagaimana cara mengajukan [specific permit]?
   Expected answer: [Steps + cite Pasal AA]

## Contextual Questions (5)
11. Q: Apakah UU ini berlaku untuk [specific scenario]?
    Expected answer: [Yes/No + reasoning + cite Pasal BB]
```

---

## 🚀 STEP-BY-STEP WORKFLOW

1. **Read the law** (30 min)
   - Understand purpose, structure, key provisions

2. **Extract metadata** (15 min)
   - Use template above

3. **Build outline** (20 min)
   - Map all BAB/Bagian/Pasal
   - Assign stable IDs

4. **Chunk Pasal-by-Pasal** (3-5 hours depending on law size)
   - One Pasal = one JSON object
   - Extract all fields
   - Maintain citations

5. **Process annexes** (1-2 hours if applicable)
   - Tables, matrices, lists
   - Keep structure intact

6. **Run quality checks** (30 min)
   - Coverage, Leak, Authority, Entity

7. **Write processing report** (20 min)
   - Stats, challenges, key topics

8. **Create test questions** (30 min)
   - 15 realistic Q&A pairs

9. **Save output** (5 min)
   - 3 files per law in OUTPUT folder

---

## 🎯 INDONESIAN FOCUS REQUIREMENTS

For every chunk, ensure:

1. **Bahasa Indonesia first**
   - `text_id` field is primary
   - English translation optional

2. **WNI perspective**
   - "Kewajiban WNI" (obligations of Indonesian citizens)
   - "Hak WNI" (rights of Indonesian citizens)
   - "Prosedur untuk rakyat Indonesia"

3. **Local context**
   - Reference Indonesian institutions (DJP, BPJS, Imigrasi)
   - Use Indonesian document names (KTP, NPWP, SIUP)
   - Indonesian dates, currency (Rupiah)

4. **Expat info as secondary**
   - If a Pasal mentions foreign nationals, include it
   - But don't prioritize expat procedures over WNI procedures

---

## ⚠️ CRITICAL RULES

1. **NEVER invent text**
   - Every word must be from the PDF
   - If unsure, cite it: "source": "page X, lines Y-Z"

2. **NEVER mix Pasal**
   - One chunk = one atomic legal unit
   - Clean boundaries

3. **NEVER skip annexes**
   - Tables are treasure troves of data
   - Process every row

4. **ALWAYS cite sources**
   - PDF page number
   - Line numbers if possible
   - Chunk ID cross-references

5. **ALWAYS extract entities**
   - Who (subjects)
   - What (objects/documents)
   - Where (institutions)
   - When (dates, deadlines)

---

## 📊 SUCCESS METRICS

Your work is complete when:

- ✅ All {LAW_COUNT} laws processed
- ✅ {TOTAL_CHUNKS} chunks produced (estimated)
- ✅ 3 files per law (JSONL, Report, Tests)
- ✅ All quality checks pass
- ✅ 100% citation coverage
- ✅ Zero invented content

---

## 🆘 IF YOU GET STUCK

1. **Ambiguous Pasal?**
   - Include both interpretations in `notes` field
   - Cite legal commentary if available

2. **Complex table?**
   - Keep rows intact
   - Create one chunk per row
   - Link rows with `annex_section` field

3. **Missing cross-reference?**
   - Mark as "to_be_linked": true
   - Add to processing report

4. **Unclear translation?**
   - Prioritize Indonesian text
   - Leave `text_en` as null
   - Note in report

---

## 🎯 FINAL DELIVERABLE CHECKLIST

Before submitting, verify:

- [ ] All PDFs in INPUT/ processed
- [ ] All OUTPUT files follow naming convention
- [ ] All JSONL files valid (one JSON per line)
- [ ] All reports complete (metadata, stats, challenges)
- [ ] All test questions realistic and answerable
- [ ] Quality checks documented
- [ ] No invented content
- [ ] 100% Indonesian law compliance

---

**Good luck, Worker #{WORKER_NUMBER}!** 🚀

You're building the most comprehensive Indonesian legal knowledge base for ZANTARA. Every chunk you create will help Indonesian citizens, businesses, and expats navigate the legal landscape with confidence.

**Questions?** Check `README_LEGAL_PROCESSING.md` or ask Zero Master.
