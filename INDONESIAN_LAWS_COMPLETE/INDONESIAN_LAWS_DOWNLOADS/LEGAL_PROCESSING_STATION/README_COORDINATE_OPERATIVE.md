# 🎯 LEGAL PROCESSING STATION - COORDINATE OPERATIVE

**Location:** `/Users/antonellosiano/Desktop/LEGAL_PROCESSING_STATION/`

---

## 📂 STRUTTURA CARTELLE

```
LEGAL_PROCESSING_STATION/
├── INPUT_LAWS/               ← PDFs delle 25 leggi da processare
├── OUTPUT_PROCESSED/         ← Files finali (JSONL + Reports)
├── WORKER_1_Tax_Investment/
├── WORKER_2_Immigration_Manpower/
├── WORKER_3_Omnibus_Licensing/
├── WORKER_4_Property_Environment/
├── WORKER_5_Healthcare_Social/
├── WORKER_6_Specialized/
├── TEMPLATES/                ← Gold standard (PP 28/2025 method)
└── QUALITY_CONTROL/          ← Test questions & validation
```

---

## 👥 ASSEGNAZIONE AI WORKERS

### WORKER #1: Tax & Investment (4 leggi)
**Cartella:** `WORKER_1_Tax_Investment/`

**Input:**
- UU 7/2021 (Tax Harmonization)
- PP 44/2022 (Tax Implementation)
- PP 50/2022 (Foreign Investment)
- UU 25/2007 (PT PMA)

**Output in:** `WORKER_1_Tax_Investment/PROCESSED/`

---

### WORKER #2: Immigration & Manpower (4 leggi)
**Cartella:** `WORKER_2_Immigration_Manpower/`

**Input:**
- UU 6/2011 (Immigration)
- PP 31/2013 (KITAS/KITAP)
- Perpres 20/2018 (Foreign Workers - TKA)
- PP 34/2021 (TKA Implementation)

**Output in:** `WORKER_2_Immigration_Manpower/PROCESSED/`

---

### WORKER #3: Omnibus & Licensing (4 leggi)
**Cartella:** `WORKER_3_Omnibus_Licensing/`

**Input:**
- UU 6/2023 (Omnibus Cipta Kerja)
- PP 5/2021 (OSS - Online Single Submission)
- PP 28/2025 (PBBR - Risk-Based Licensing) ✅ GIÀ PROCESSATA
- PP 6/2021 (KEK - Special Economic Zones)

**Output in:** `WORKER_3_Omnibus_Licensing/PROCESSED/`

---

### WORKER #4: Property & Environment (5 leggi)
**Cartella:** `WORKER_4_Property_Environment/`

**Input:**
- UU 5/1960 (Land Rights - UUPA)
- PP 18/2021 (Hak Pakai land rights)
- PP 103/2015 (Property ownership)
- UU 32/2009 (Environmental Protection)
- PP 22/2021 (Environmental Implementation)

**Output in:** `WORKER_4_Property_Environment/PROCESSED/`

---

### WORKER #5: Healthcare & Social (4 leggi)
**Cartella:** `WORKER_5_Healthcare_Social/`

**Input:**
- UU 36/2009 (Healthcare)
- UU 24/2011 (BPJS Healthcare)
- UU 20/2003 (Education System)
- PP 57/2021 (National Education Standards)

**Output in:** `WORKER_5_Healthcare_Social/PROCESSED/`

---

### WORKER #6: Specialized (4 leggi)
**Cartella:** `WORKER_6_Specialized/`

**Input:**
- KUHP 2025 (New Criminal Code)
- KUHPerdata (Civil Code)
- UU 21/2008 (Sharia Banking)
- UU 17/2008 (Shipping & Maritime)

**Output in:** `WORKER_6_Specialized/PROCESSED/`

---

## 📥 INPUT: Dove Trovare i PDFs

**Tutti i PDF sono in:** `INPUT_LAWS/`

Ogni worker copia le proprie 4-5 leggi nella propria cartella prima di iniziare.

---

## 📤 OUTPUT: Cosa Deve Produrre Ogni Worker

Per **OGNI LEGGE**, produrre 3 files:

### 1. `[LAW_ID]_READY_FOR_KB.jsonl`
Formato JSONL production-ready per ChromaDB:
```jsonl
{"chunk_id": "UU-7-2021-Pasal-1", "type": "pasal", "text": "...", "metadata": {...}}
{"chunk_id": "UU-7-2021-Pasal-2", "type": "pasal", "text": "...", "metadata": {...}}
```

### 2. `[LAW_ID]_PROCESSING_REPORT.md`
Report dettagliato:
- ✅ Metadati legge estratti
- ✅ Numero Pasal processati
- ✅ Lampiran/Annex trattati
- ✅ Quality checks passed
- ⚠️ Issues/warnings rilevati

### 3. `[LAW_ID]_TEST_QUESTIONS.md`
15 domande per validare retrieval:
```markdown
1. Quali sono i tassi fiscali per PT PMA secondo UU 7/2021?
2. Pasal specifici sui dividendi da reinvestimento?
...
```

---

## 🏆 GOLD STANDARD: Metodologia PP 28/2025

**File di riferimento:** `TEMPLATES/PP28_2025_METHODOLOGY.md`

### Principi Core:
1. **Unità atomica:** 1 Pasal = 1 chunk
2. **Metadati completi:** law_id, title, enacted_at, sectors, kbli_codes, systems
3. **Lampiran separate:** CSV/tables per annex
4. **Crosswalk operativi:** Cattura flussi inter-ministeriali
5. **Glossary bilingue:** Bahasa + English

### Chunking Strategy:
- **Pasal-level:** Default (unità giuridica atomica)
- **Sliding window:** Solo per Penjelasan lunghe (800-1200 token, overlap 150)
- **Tabular chunks:** Mantieni righe complete per Lampiran

---

## ✅ QUALITY CHECKLIST (Obbligatoria)

**File:** `QUALITY_CONTROL/CHECKLIST_TEMPLATE.md`

Ogni worker DEVE verificare:

- [ ] Metadati legge completi (law_id, title, date, LNRI, sectors)
- [ ] Tutti i Pasal estratti e numerati correttamente
- [ ] Lampiran processati come CSV (non mescolati nel testo)
- [ ] Glossary termini chiave (min 20 termini)
- [ ] Cross-references identificati (rimandi ad altre leggi)
- [ ] 15 test questions generate e validate
- [ ] Nessun chunk mescola 2+ Pasal
- [ ] Nessuna tabella frammentata
- [ ] Citazioni precise (Pasal/ayat, Lampiran/row)
- [ ] Authority chain documentata (legge madre → PP implementativi)

---

## 🚀 WORKFLOW PER OGNI WORKER

### Step 1: Setup
```bash
cd WORKER_X_[nome]/
mkdir PROCESSED
cp ../INPUT_LAWS/[leggi_assegnate].pdf ./
```

### Step 2: Processing
Usa il prompt specifico in `TEMPLATES/WORKER_X_PROMPT.md`

### Step 3: Output
Salva i 3 files per legge in `PROCESSED/`:
- `[LAW_ID]_READY_FOR_KB.jsonl`
- `[LAW_ID]_PROCESSING_REPORT.md`
- `[LAW_ID]_TEST_QUESTIONS.md`

### Step 4: Copy to Final
```bash
cp PROCESSED/* ../OUTPUT_PROCESSED/
```

---

## 📊 TRACKING PROGRESS

**File:** `QUALITY_CONTROL/PROGRESS_TRACKER.md`

| Worker | Leggi | Status | Issues |
|--------|-------|--------|--------|
| #1     | 4/4   | ⏳     | -      |
| #2     | 4/4   | ⏳     | -      |
| #3     | 4/4   | ⏳     | -      |
| #4     | 5/5   | ⏳     | -      |
| #5     | 4/4   | ⏳     | -      |
| #6     | 4/4   | ⏳     | -      |

Aggiorna ogni volta che completi una legge.

---

## 🎯 SUCCESS CRITERIA

Una legge è "READY FOR KB" quando:

1. ✅ Coverage test: Le 15 domande richiamano i chunk corretti
2. ✅ Leak test: Nessun chunk mescola contenuti diversi
3. ✅ Authority test: Ogni risposta ha citazione puntuale (Pasal/ayat)
4. ✅ Completeness: Tutti i Pasal + Lampiran processati
5. ✅ Format: JSONL valido, caricabile in ChromaDB senza errori

---

## 🆘 SUPPORT

**Domande?** Controlla:
1. `TEMPLATES/PP28_2025_METHODOLOGY.md` (gold standard)
2. `TEMPLATES/FAQ_COMMON_ISSUES.md`
3. `QUALITY_CONTROL/EXAMPLES_GOOD_BAD.md`

Se ancora bloccato → segnala in `QUALITY_CONTROL/ISSUES_LOG.md`

---

**⏰ Timeline:** 25 leggi / 6 workers = ~4 leggi/worker

**🎯 Target:** Tutte pronte per deploy in ChromaDB entro fine processing.

**Zero, pronto per partire! 🚀**
