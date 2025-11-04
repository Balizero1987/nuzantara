# 💻 COMPLETE PROCESSING PROMPT - WORKER #8 (Technology & Digital)

## YOUR ASSIGNMENT
Process 5 Indonesian Digital Economy laws

### Laws:
1. UU 19/2016 - UU ITE (Amended)
2. UU 27/2022 - Pelindungan Data Pribadi ⚠️ CRITICAL
3. PP 71/2019 - Sistem Elektronik (PSE)
4. PP 80/2019 - E-Commerce
5. Civil Code - Digital contract sections ONLY

## FOLLOW PP 28/2025 GOLD STANDARD
Location: `../../00_REFERENCE/PP_28_2025_GOLD_STANDARD/`

## DELIVERABLES (per law)
1. [LAW_ID]_READY_FOR_KB.jsonl
2. [LAW_ID]_PROCESSING_REPORT.md
3. [LAW_ID]_TEST_QUESTIONS.md

## CHUNK STRUCTURE
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
    "stakeholder": ["startup", "data_controller", "data_subject"],
    "compliance_type": ["consent_management"],
    "enforcement": ["data_protection_authority"],
    "penalty_type": ["administrative_fine"],
    "gdpr_equivalent": "Article 6 GDPR (Lawfulness)",
    "deadline": null
  },
  "keywords_id": ["data pribadi", "persetujuan", "pengolahan data"],
  "keywords_en": ["personal data", "consent", "GDPR", "data processing"],
  "related_articles": ["Pasal-14", "Pasal-16", "PP-71-2019-Pasal-14"],
  "citation": {
    "source": "UU-27-2022.pdf",
    "page": 12,
    "line_range": [8, 22]
  },
  "metadata": {
    "importance": "critical",
    "effective_date": "2024-10-17",
    "grace_period": "2_years"
  }
}
```

## DIGITAL-SPECIFIC SIGNALS
```json
"signals": {
  "digital_sector": ["data_privacy", "e_commerce", "fintech", "pse_licensing"],
  "stakeholder": ["startup", "platform", "user", "ministry_kominfo"],
  "compliance_type": ["pse_registration", "consent", "breach_notification"],
  "enforcement": ["ministry_kominfo", "data_protection_authority", "ojk"],
  "penalty_type": ["administrative_fine", "service_blocking", "criminal"],
  "deadline": ["72_hours_breach", "immediate_pse"],
  "gdpr_equivalent": "[Map to GDPR Article]"
}
```

## SPECIAL FOCUS PER LAW

### UU 19/2016 (ITE):
- Electronic signatures (Pasal 11-12)
- Electronic evidence
- Criminal sanctions

### UU 27/2022 (PDP) ⚠️ MOST CRITICAL:
- **MAP EVERY ARTICLE TO GDPR EQUIVALENT**
- Data subject rights (Pasal 28-36)
- Consent (Pasal 14-18)
- Breach notification (Pasal 58-62) → 72 hours!
- DPO requirements (Pasal 52-55)
- Cross-border transfers (Pasal 56)
- Effective: Oct 17, 2024

### PP 71/2019 (PSE):
- PSE registration (MANDATORY!)
- PSE Lingkup Privat vs Publik
- Data localization
- Service blocking risk

### PP 80/2019 (E-Commerce):
- Marketplace obligations
- Escrow requirements
- Consumer protection

### Civil Code:
- **Extract ONLY digital-relevant articles**
- Buku III Pasal 1320-1337 (Contract formation)
- Pasal 1338 (Freedom of contract)
- Electronic evidence provisions

## GDPR MAPPING REQUIRED
For UU 27/2022, add this to every chunk:
```json
"gdpr_mapping": {
  "Pasal 14-18": "GDPR Art. 6-7 (Lawfulness, Consent)",
  "Pasal 28-36": "GDPR Art. 12-22 (Rights)",
  "Pasal 52-55": "GDPR Art. 37-39 (DPO)",
  "Pasal 58-62": "GDPR Art. 33-34 (Breach)"
}
```

START PROCESSING NOW!
