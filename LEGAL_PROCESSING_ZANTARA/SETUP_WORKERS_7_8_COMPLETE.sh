#!/bin/bash

# Setup Workers 7 & 8 with Complete Prompts

cd /Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/02_AI_WORKERS

# Rename workers
if [ -d "Worker_7_Banking_Digital" ]; then
    mv Worker_7_Banking_Digital Worker_7_Education_Culture
fi

if [ -d "Worker_8_Infrastructure_Environment" ]; then
    mv Worker_8_Infrastructure_Environment Worker_8_Technology_Digital
fi

# Create complete prompts for Worker 7
cat > Worker_7_Education_Culture/COMPLETE_PROMPT_WORKER_7.md << 'ENDPROMPT7'
# 🎓 COMPLETE PROCESSING PROMPT - WORKER #7

You are processing 4 Indonesian Education & Culture laws:
1. UU 12/2012 - Pendidikan Tinggi
2. UU 5/2017 - Pemajuan Kebudayaan  
3. PP 57/2021 - Standar Nasional Pendidikan
4. PP 4/2014 - Penyelenggaraan Pendidikan Tinggi

## Follow PP 28/2025 Gold Standard

See: `../../00_REFERENCE/PP_28_2025_GOLD_STANDARD/`

## Output 3 files per law:
1. [LAW_ID]_READY_FOR_KB.jsonl
2. [LAW_ID]_PROCESSING_REPORT.md  
3. [LAW_ID]_TEST_QUESTIONS.md

## Chunk Structure:
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
    "stakeholder": ["university", "student", "lecturer"],
    "sector": ["pendidikan_tinggi"],
    "requirement_type": ["accreditation", "qualification"]
  },
  "keywords_id": ["pendidikan tinggi", "akreditasi"],
  "keywords_en": ["higher education", "accreditation"],
  "related_articles": ["Pasal-44", "Pasal-46"],
  "citation": {
    "source": "UU-12-2012.pdf",
    "page": 23,
    "line_range": [15, 28]
  }
}
```

START PROCESSING!
ENDPROMPT7

# Create complete prompts for Worker 8
cat > Worker_8_Technology_Digital/COMPLETE_PROMPT_WORKER_8.md << 'ENDPROMPT8'
# 💻 COMPLETE PROCESSING PROMPT - WORKER #8

You are processing 5 Indonesian Digital Economy laws:
1. UU 19/2016 - UU ITE (Amended)
2. UU 27/2022 - Pelindungan Data Pribadi (Indonesia's GDPR)
3. PP 71/2019 - Sistem Elektronik
4. PP 80/2019 - E-Commerce
5. Civil Code - Digital contract sections ONLY

## Follow PP 28/2025 Gold Standard

See: `../../00_REFERENCE/PP_28_2025_GOLD_STANDARD/`

## Output 3 files per law:
1. [LAW_ID]_READY_FOR_KB.jsonl
2. [LAW_ID]_PROCESSING_REPORT.md
3. [LAW_ID]_TEST_QUESTIONS.md

## Chunk Structure:
```json
{
  "chunk_id": "UU-27-2022-Pasal-15",
  "law_id": "UU-27-2022",
  "law_title": "Pelindungan Data Pribadi",
  "type": "pasal",
  "pasal_number": "15",
  "ayat": "1",
  "text": "[Full Indonesian text]",
  "signals": {
    "digital_sector": ["data_privacy"],
    "stakeholder": ["startup", "data_controller"],
    "compliance_type": ["consent_management"],
    "enforcement": ["data_protection_authority"],
    "gdpr_equivalent": "Article 6 GDPR"
  },
  "keywords_id": ["data pribadi", "persetujuan"],
  "keywords_en": ["personal data", "consent", "GDPR"],
  "related_articles": ["Pasal-14", "Pasal-16"],
  "citation": {
    "source": "UU-27-2022.pdf",
    "page": 12,
    "line_range": [8, 22]
  }
}
```

⚠️ CRITICAL: For UU 27/2022, map every article to GDPR equivalent!

START PROCESSING!
ENDPROMPT8

echo "✅ Workers 7 & 8 complete prompts created!"
ls -la Worker_7_Education_Culture/
ls -la Worker_8_Technology_Digital/
