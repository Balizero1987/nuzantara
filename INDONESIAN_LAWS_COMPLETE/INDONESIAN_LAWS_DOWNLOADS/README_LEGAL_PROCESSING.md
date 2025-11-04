# 🏛️ LEGAL PROCESSING ZANTARA - Centro di Coordinamento

## 📂 STRUTTURA CARTELLE

```
LEGAL_PROCESSING_ZANTARA/
├── 01_RAW_LAWS/                    # Leggi PDF originali scaricate
├── 02_AI_WORKERS/                  # 6 cartelle AI con istruzioni
│   ├── Worker_1_Tax_Investment/
│   │   ├── INPUT/                  # PDF assegnati
│   │   ├── WORK_IN_PROGRESS/       # File temporanei
│   │   └── OUTPUT/                 # JSONL + reports finali
│   ├── Worker_2_Immigration_Manpower/
│   ├── Worker_3_Omnibus_Licensing/
│   ├── Worker_4_Property_Environment/
│   ├── Worker_5_Healthcare_Social/
│   └── Worker_6_Specialized/
├── 03_PROCESSED_OUTPUT/            # Output JSONL consolidati
├── 04_QUALITY_REPORTS/             # Report di qualità
└── 05_TEST_QUESTIONS/              # Domande di test per ogni legge
```

---

## 🎯 OBIETTIVO GLOBALE

Processare **25 leggi indonesiane** per il sistema RAG di ZANTARA, seguendo il gold standard di **PP 28/2025**.

**Target audience**: **Cittadini indonesiani (WNI) + Expatriates (WNA)** che vivono in Indonesia.

---

## 📋 25 LEGGI DA PROCESSARE

### Worker #1: Tax & Investment (4 leggi)
1. **UU 7/2021** - Harmonisasi Peraturan Perpajakan
2. **UU 25/2007** - Penanaman Modal
3. **PP 45/2019** - Tax Incentives  
4. **UU 40/2007** - PT (Perseroan Terbatas)

### Worker #2: Immigration & Manpower (4 leggi)
5. **UU 6/2011** - Keimigrasian
6. **PP 31/2013** - KITAS/KITAP
7. **UU 13/2003** - Ketenagakerjaan
8. **Perpres 20/2018** - TKA (Tenaga Kerja Asing)

### Worker #3: Omnibus & Licensing (4 leggi)
9. **UU 6/2023** - Cipta Kerja (omnibus consolidata)
10. **PP 5/2021** - OSS (Online Single Submission)
11. **PP 28/2025** - PBBR (✅ già processata - GOLD STANDARD)
12. **PP 24/2018** - OSS (vecchia versione)

### Worker #4: Property & Environment (5 leggi)
13. **UU 5/1960** - UUPA (Agraria)
14. **PP 18/2021** - Hak Pengelolaan, Hak Atas Tanah
15. **UU 32/2009** - Lingkungan Hidup
16. **PP 22/2021** - Penyelenggaraan Perlindungan Lingkungan Hidup
17. **UU 1/2011** - Perumahan dan Kawasan Permukiman

### Worker #5: Healthcare & Social (4 leggi)
18. **UU 36/2009** - Kesehatan
19. **UU 24/2011** - BPJS
20. **UU 20/2003** - Sistem Pendidikan Nasional
21. **PP 47/2008** - Wajib Belajar

### Worker #6: Specialized (4 leggi)
22. **KUHP (UU 1/2023)** - Kitab Undang-Undang Hukum Pidana (nuovo)
23. **KUHPerdata** - Kitab Undang-Undang Hukum Perdata
24. **UU 21/2008** - Perbankan Syariah
25. **UU 17/2008** - Pelayaran

---

## 🛠️ METODOLOGIA (PP 28/2025 Gold Standard)

Ogni AI worker deve seguire **ESATTAMENTE** questa pipeline:

### 1. Struttura Metadata
```json
{
  "law_id": "UU-7-2021",
  "title": "Harmonisasi Peraturan Perpajakan",
  "enacted_at": "2021-10-29",
  "status": "in_vigore",
  "sectors": ["tax", "revenue", "business"],
  "annex_refs": ["Lampiran I", "Lampiran II"]
}
```

### 2. Chunking Strategy
- **Unità atomica**: Pasal (articolo)
- **Granularità**: 1 Pasal = 1 chunk
- **Overlap**: 50 token per contesto
- **Metadati ricchi**: BAB, Bagian, riferimenti incrociati

### 3. Output Format (JSONL)
```json
{
  "chunk_id": "UU-7-2021-Pasal-5",
  "type": "pasal",
  "text": "[testo completo del Pasal]",
  "metadata": {
    "law_id": "UU-7-2021",
    "bab": "BAB II",
    "bagian": "Bagian Kesatu",
    "pasal": "5",
    "ayat": ["1", "2"],
    "cross_refs": ["Pasal 3", "Pasal 7"]
  },
  "signals": {
    "tax_type": "VAT",
    "applies_to": ["WNI", "WNA", "PT_Lokal", "PT_PMA"],
    "deadline": "annual",
    "citizenship_requirement": "both"
  }
}
```

### 4. Quality Checklist (obbligatoria)
- [ ] Tutti i Pasal indicizzati
- [ ] Metadata completi
- [ ] Citazioni verificate
- [ ] Cross-references mappati
- [ ] Lampiran (annex) processati separatamente
- [ ] Glossario termini tecnici estratto
- [ ] Segnali WNI/WNA identificati
- [ ] 15 test questions generate

---

## 🎓 TARGET AUDIENCE - CRITICO!

**NON SOLO EXPAT - ANCHE CITTADINI INDONESIANI!**

Le leggi devono servire:

### 1. **Warga Negara Indonesia (WNI)** - Cittadini indonesiani
- Aprono PT lokal
- Cercano lavoro
- Comprano proprietà (Hak Milik)
- Si sposano/divorziano
- Business domestico

### 2. **Expatriates (WNA)** - Stranieri in Indonesia
- PT PMA
- KITAS/KITAP
- TKA permits
- Real estate (Hak Pakai)

### 3. **Mixed scenarios**
- PT con soci WNI + WNA
- Matrimoni misti
- Business partnership cross-border

### Implicazioni per il Processing:

**Segnali da estrarre obbligatoriamente**:
```json
"signals": {
  "applies_to": ["WNI", "WNA", "PT_Lokal", "PT_PMA"],
  "citizenship_requirement": "WNI_only" | "WNA_allowed" | "both",
  "requires_sponsorship": true/false,
  "local_partner_required": true/false,
  "foreign_ownership_limit": "0%" | "49%" | "67%" | "100%"
}
```

**Esempi concreti**:
- **UU 5/1960 (Agraria)**: 
  - Hak Milik → `citizenship_requirement: "WNI_only"`
  - Hak Pakai → `citizenship_requirement: "WNA_allowed"`
  
- **UU 40/2007 (PT)**: 
  - PT Lokal → `foreign_ownership_limit: "0%"`
  - PT PMA → `foreign_ownership_limit: "depends_on_sector"`

- **KUHP**: 
  - `applies_to: ["WNI", "WNA"]` (tutti on Indonesian soil)

---

## 📥 DOVE METTERE I FILES LAVORATI

Ogni AI worker salva in **02_AI_WORKERS/Worker_X_Nome/OUTPUT/**:

```
Worker_1_Tax_Investment/OUTPUT/
├── UU-7-2021_READY_FOR_KB.jsonl          # Main output
├── UU-7-2021_PROCESSING_REPORT.md         # Report dettagliato
├── UU-7-2021_TEST_QUESTIONS.md            # 15 domande test
├── UU-7-2021_GLOSSARY.json                # Termini tecnici
└── UU-7-2021_METADATA.json                # Metadata strutturati
```

---

## 🚀 WORKFLOW PER OGNI AI WORKER

### Step 1: Setup (5 min)
1. Vai nella tua cartella: `02_AI_WORKERS/Worker_X_Nome/`
2. Copia i PDF assegnati da `01_RAW_LAWS/` in `INPUT/`
3. Leggi `INSTRUCTIONS_WORKER_X.md`

### Step 2: Processing (2-4 ore per legge)
1. Estrai testo dal PDF
2. Identifica struttura (BAB, Bagian, Pasal, Ayat)
3. Chunking Pasal-level
4. Estrai metadata + signals (inclusi WNI/WNA)
5. Genera JSONL
6. Crea glossario
7. Genera 15 test questions

### Step 3: Quality Check (30 min)
- Verifica checklist
- Test random samples
- Validate cross-references
- Verifica segnali WNI/WNA

### Step 4: Delivery
Salva tutti i file in `OUTPUT/`

---

## 📊 TRACKING PROGRESS

| Worker | Legge | Status | % Complete | Issues |
|--------|-------|--------|------------|--------|
| #1 | UU 7/2021 | ⚪ Not Started | 0% | - |
| #1 | UU 25/2007 | ⚪ Not Started | 0% | - |
| #1 | PP 45/2019 | ⚪ Not Started | 0% | - |
| #1 | UU 40/2007 | ⚪ Not Started | 0% | - |
| #2 | UU 6/2011 | ⚪ Not Started | 0% | - |
| #2 | PP 31/2013 | ⚪ Not Started | 0% | - |
| #2 | UU 13/2003 | ⚪ Not Started | 0% | - |
| #2 | Perpres 20/2018 | ⚪ Not Started | 0% | - |
| #3 | UU 6/2023 | ⚪ Not Started | 0% | - |
| #3 | PP 5/2021 | ⚪ Not Started | 0% | - |
| #3 | PP 28/2025 | 🟢 Complete | 100% | Gold Standard |
| #3 | PP 24/2018 | ⚪ Not Started | 0% | - |
| ... | ... | ... | ... | ... |

Status codes:
- ⚪ Not Started
- 🟡 In Progress  
- 🟢 Complete
- 🔴 Blocked

---

## 📅 TIMELINE

- **Week 1**: Workers #1-3 (12 leggi)
- **Week 2**: Workers #4-6 (13 leggi)
- **Week 3**: Quality review + integration in RAG

**DEADLINE FINALE: 3 settimane da oggi**

---

## ✅ FINAL CHECKLIST (per Zero Master)

- [ ] Tutti i 25 JSONL generati
- [ ] Tutti i processing reports completi
- [ ] 15 test questions per legge (375 totali)
- [ ] Glossario consolidato
- [ ] Metadata index creato
- [ ] Cross-reference graph mappato
- [ ] WNI/WNA signals verificati
- [ ] Sample queries testate
- [ ] Bilingual support verificato (ID/EN)

---

## 🆘 COMANDI RAPIDI

```bash
# Setup iniziale
cd ~/Desktop
bash SETUP_LEGAL_PROCESSING.sh

# Verifica struttura
cd LEGAL_PROCESSING_ZANTARA
find . -type d

# Copia PDF nelle cartelle worker
cp 01_RAW_LAWS/UU-7-2021.pdf 02_AI_WORKERS/Worker_1_Tax_Investment/INPUT/

# Check progress
find 02_AI_WORKERS -name "*_READY_FOR_KB.jsonl" | wc -l
```

---

**READY TO START! 🚀**
