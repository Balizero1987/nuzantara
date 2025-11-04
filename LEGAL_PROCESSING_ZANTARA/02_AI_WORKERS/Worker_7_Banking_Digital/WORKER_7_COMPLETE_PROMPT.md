# 🎓 COMPLETE PROCESSING PROMPT - WORKER #7 (Education & Culture)

## YOUR ASSIGNMENT
Process 4 Indonesian Education & Culture laws

### Laws:
1. UU 12/2012 - Pendidikan Tinggi
2. UU 5/2017 - Pemajuan Kebudayaan  
3. PP 57/2021 - Standar Nasional Pendidikan
4. PP 4/2014 - Penyelenggaraan Pendidikan Tinggi

## FOLLOW PP 28/2025 GOLD STANDARD
Location: `../../00_REFERENCE/PP_28_2025_GOLD_STANDARD/`

## DELIVERABLES (per law)
1. [LAW_ID]_READY_FOR_KB.jsonl
2. [LAW_ID]_PROCESSING_REPORT.md  
3. [LAW_ID]_TEST_QUESTIONS.md

## CHUNK STRUCTURE
```json
{
  "chunk_id": "UU-12-2012-Pasal-45",
  "law_id": "UU-12-2012",
  "law_title": "Pendidikan Tinggi",
  "type": "pasal",
  "pasal_number": "45",
  "ayat": "1",
  "text": "[Full Indonesian text]",
  "signals": {
    "education_level": ["tinggi"],
    "stakeholder": ["university", "student", "lecturer", "ministry_dikti"],
    "sector": ["pendidikan_tinggi"],
    "requirement_type": ["accreditation", "qualification"]
  },
  "keywords_id": ["pendidikan tinggi", "akreditasi", "dosen"],
  "keywords_en": ["higher education", "accreditation", "lecturer"],
  "related_articles": ["Pasal-44", "Pasal-46"],
  "citation": {
    "source": "UU-12-2012.pdf",
    "page": 23,
    "line_range": [15, 28]
  },
  "metadata": {
    "importance": "high",
    "applicability": "all_universities"
  }
}
```

## EDUCATION-SPECIFIC SIGNALS
```json
"signals": {
  "education_level": ["dasar", "menengah", "tinggi", "vokasi"],
  "stakeholder": ["student", "teacher", "lecturer", "university", "ministry"],
  "sector": ["pendidikan_formal", "pendidikan_non_formal", "kebudayaan"],
  "requirement_type": ["accreditation", "curriculum", "qualification"],
  "cultural_aspect": ["heritage", "traditional_knowledge"]
}
```

## SPECIAL FOCUS

### UU 12/2012:
- University accreditation (Pasal 55-60)
- Student rights
- Lecturer qualifications

### UU 5/2017:
- Cultural heritage protection
- Traditional knowledge
- UNESCO alignment

### PP 57/2021:
- Quality standards
- Assessment criteria

### PP 4/2014:
- University governance
- Public vs private institutions

START PROCESSING NOW!
