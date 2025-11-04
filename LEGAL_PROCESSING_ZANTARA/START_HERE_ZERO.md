# 🏛️ ZANTARA Legal Processing System

**Indonesian Legal Knowledge Base Builder**

---

## 🎯 WHAT IS THIS?

Sistema completo per processare **33 leggi indonesiane** e prepararle per il knowledge base di ZANTARA.

**Target:**
- ✅ **Cittadini indonesiani** che avviano imprese
- ✅ **Expat** che investono in Indonesia (PT PMA, KITAS, etc.)
- ✅ **Compliance legale** per tutti i settori

---

## ⚡ QUICK START (5 Steps)

### 1. Leggi la Guida Completa
```bash
open COMPLETE_SETUP_GUIDE.md
```
**→ Tutto quello che serve sapere è lì dentro**

### 2. Sposta i PDF Nuovi
```bash
./MOVE_NEW_PDFS.sh
```
**→ Assegna automaticamente 8 nuovi PDF ai workers**

### 3. Scegli un Worker
```bash
# Inizia da Worker 1 (Tax - priorità massima)
cd 02_AI_WORKERS/Worker_1_Tax_Investment
open WORKER_1_COMPLETE_PROMPT.md
```

### 4. Processa con AI
- Copia il prompt completo
- Usa GPT-4, Claude, o Qwen 3 Coder
- Carica il PDF dalla cartella `INPUT/`
- Salva output in `OUTPUT/`

### 5. Ripeti per Ogni Legge
**Target:** 33 leggi → 8 workers → ~4-5 leggi per worker

---

## 📊 STATO ATTUALE

### Workers Configurati
- ✅ Worker 1: Tax & Investment (5 leggi)
- ✅ Worker 2: Immigration & Manpower (4 leggi)
- ✅ Worker 3: Omnibus & Licensing (6 leggi)
- ✅ Worker 4: Property & Environment (6 leggi)
- ✅ Worker 5: Healthcare & Social (5 leggi)
- ✅ Worker 6: Specialized (5 leggi)
- ✅ Worker 7: Banking & Digital (5 leggi)
- ✅ Worker 8: Infrastructure & Environment (5 leggi)

**Total:** 41 laws assigned (33 core + 8 new)

### Leggi Processate
- ✅ PP 28/2025 - PBBR (GOLD STANDARD)
- ⏳ 40 leggi da processare

---

## 📂 STRUTTURA

```
LEGAL_PROCESSING_ZANTARA/
│
├── 📖 COMPLETE_SETUP_GUIDE.md        ← **START HERE**
├── 📖 MASTER_PROMPT_INDONESIAN_FOCUS.md
├── 📖 README_LEGAL_PROCESSING.md
├── 📖 COMPLETE_LAW_INVENTORY_33_LAWS.md
│
├── 🗂️ 01_RAW_LAWS/                   ← PDF originali
├── 🤖 02_AI_WORKERS/                  ← 8 workers configurati
│   ├── Worker_1_Tax_Investment/
│   │   ├── INPUT/                    ← PDFs da processare
│   │   ├── OUTPUT/                   ← JSONL + Reports
│   │   ├── PROMPT/                   ← Metodologia
│   │   └── WORKER_1_COMPLETE_PROMPT.md  ← Usa questo!
│   ├── Worker_2_Immigration_Manpower/
│   ├── ... (through Worker_8)
│
├── 📊 03_PROCESSED_OUTPUT/            ← Tutti i JSONL pronti
├── 📋 04_QUALITY_REPORTS/             ← Report di qualità
└── ❓ 05_TEST_QUESTIONS/              ← 15 domande per legge
```

---

## 🎯 OBIETTIVI

### Qualità per Ogni Legge:
- ✅ 100% copertura Pasal (ogni articolo)
- ✅ Chunking atomico (1 Pasal = 1 chunk)
- ✅ Metadata completi (ID, titolo, data, settore)
- ✅ Cross-reference mantenuti
- ✅ Bilingue (Bahasa + English)
- ✅ 15 test questions con risposte corrette

### Output Format:
```jsonl
{
  "chunk_id": "PP-28-2025-Pasal-211",
  "type": "pasal",
  "law_id": "PP-28-2025",
  "title": "Penyelenggaraan Perizinan Berusaha Berbasis Risiko",
  "text": "Pelaku Usaha ... memasukkan data ...",
  "metadata": {
    "kbli_required": true,
    "system": ["OSS"],
    "importance": "high"
  },
  "citations": [{"source":"PP-28-2025.pdf","loc":"L72-L82"}]
}
```

---

## 🤖 AI MODELS CONSIGLIATI

**Best:**
1. GPT-4 Turbo - Ottimo per Bahasa Indonesia
2. Claude 3 Opus - Precisione citazioni
3. Qwen 2.5 Coder 72B - Strutturato, locale

**Good:**
- GPT-4o (più veloce)
- Claude 3.5 Sonnet
- Qwen 2.5 32B

**Budget/Local:**
- Llama 3.1 70B
- Qwen 2.5 14B (minimo)

---

## 📋 PRIORITÀ PROCESSING

### Week 1: Critical (6 leggi)
- PP 28/2025 ✅ (già fatto)
- UU 6/2023 (Omnibus)
- UU 7/2021 (Tax)
- UU 13/2003 (Manpower)
- Immigration (2x)

### Week 2: High Priority (10 leggi)
- PT PMA, KITAS, Real Estate
- Banking, Tax implementation

### Week 3: Codes & Sector (25 leggi)
- KUHP, KUHPerdata
- Healthcare, Environment, Maritime
- Construction, Education, Banking

---

## 🛠️ TROUBLESHOOTING

**PDF non si apre?**
- Installa Tesseract: `brew install tesseract`
- Verifica encoding PDF

**AI produce output sbagliato?**
- Rileggi `WORKER_X_COMPLETE_PROMPT.md`
- Usa PP 28/2025 come esempio
- Verifica che AI supporti Bahasa Indonesia

**Chunk troppo grandi?**
- Chunking = 1 Pasal = 1 chunk (unità atomica)
- Se Pasal > 1000 token → split per Ayat

---

## 📞 SUPPORT

**Per domande tecniche:**
- Vedi `COMPLETE_SETUP_GUIDE.md` (Step-by-step dettagliato)
- Worker-specific: `02_AI_WORKERS/Worker_X/WORKER_X_COMPLETE_PROMPT.md`

**Per metodologia:**
- `MASTER_PROMPT_INDONESIAN_FOCUS.md` (Approccio generale)
- `../PP28_FINAL_PACKAGE/` (Gold standard example)

---

## ✅ CHECKLIST FINALE

Prima di iniziare, verifica:

- [ ] Tesseract installato (`tesseract --version`)
- [ ] 8 nuovi PDF spostati (`./MOVE_NEW_PDFS.sh`)
- [ ] Letto `COMPLETE_SETUP_GUIDE.md`
- [ ] AI model scelto (GPT-4, Claude, Qwen)
- [ ] Worker 1 pronto (Tax - priorità massima)

---

## 🚀 READY?

```bash
# Setup completo
./MOVE_NEW_PDFS.sh

# Cleanup docs inutili
./CLEANUP_DOCS.sh

# Apri Worker 1
cd 02_AI_WORKERS/Worker_1_Tax_Investment
open WORKER_1_COMPLETE_PROMPT.md

# Start processing! 🎯
```

---

**Sistema configurato. Pronto per processare 33 leggi indonesiane.**

**Zero, quando vuoi iniziare, tutto è pronto! 💪**

---

*Updated: 2025-11-03*  
*Status: 8 Workers Ready, 1 Gold Standard Complete*
