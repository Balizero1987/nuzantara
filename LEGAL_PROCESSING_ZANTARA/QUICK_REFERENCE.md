# ⚡ QUICK REFERENCE - Zantara Legal Processing

## 🎯 COSA FARE ADESSO (3 Steps)

### 1️⃣ SETUP (Una Volta Sola)
```bash
cd ~/Desktop/LEGAL_PROCESSING_ZANTARA
./MOVE_NEW_PDFS.sh
```

### 2️⃣ APRI WORKER 1 (Tax - Priority 1)
```bash
cd 02_AI_WORKERS/Worker_1_Tax_Investment
open WORKER_1_COMPLETE_PROMPT.md
```

### 3️⃣ PROCESSA CON AI
1. Copia tutto il prompt da `WORKER_1_COMPLETE_PROMPT.md`
2. Apri GPT-4 / Claude / Qwen
3. Carica PDF da `INPUT/` folder
4. Incolla prompt + PDF
5. Salva output in `OUTPUT/`

---

## 📂 FILES CHIAVE

| File | Scopo |
|------|-------|
| **START_HERE_ZERO.md** | Overview rapida sistema |
| **COMPLETE_SETUP_GUIDE.md** | Guida completa step-by-step |
| **SETUP_COMPLETE_SUMMARY.md** | Stato attuale + progress tracker |
| **MOVE_NEW_PDFS.sh** | Assegna PDF ai workers |
| **CLEANUP_DOCS.sh** | Archivia docs ridondanti |

---

## 🤖 AI MODELS

**Best:** GPT-4 Turbo, Claude 3 Opus, Qwen 2.5 Coder (72B)  
**Good:** GPT-4o, Claude 3.5 Sonnet, Qwen 2.5 (32B)  
**Budget:** Llama 3.1 (70B), Qwen 2.5 (14B)

---

## 📊 8 WORKERS

1. **Tax & Investment** (5 PDFs) - 🔥 Critical
2. **Immigration & Manpower** (4 PDFs) - 🔥 Critical
3. **Omnibus & Licensing** (6 PDFs) - 🔥 Critical
4. **Property & Environment** (6 PDFs) - 🟡 High
5. **Healthcare & Social** (5 PDFs) - 🟡 High
6. **Specialized Codes** (5 PDFs) - 🟢 Medium
7. **Banking & Digital** (5 PDFs) - 🟢 Medium
8. **Infrastructure & Tech** (5 PDFs) - 🟢 Medium

**Total:** 41 PDFs → 33 Core Laws

---

## ✅ OUTPUT per Ogni Legge

1. `[LAW_ID]_READY_FOR_KB.jsonl` - Chunked data
2. `[LAW_ID]_PROCESSING_REPORT.md` - Quality metrics
3. `[LAW_ID]_TEST_QUESTIONS.md` - 15 test questions

---

## 🎯 QUALITÀ

- ✅ 100% Pasal coverage
- ✅ 1 Pasal = 1 chunk (atomico)
- ✅ Metadata completi
- ✅ Bahasa Indonesia + English
- ✅ Cross-references OK
- ✅ 15 test passed

---

## 🚀 START NOW

```bash
cd ~/Desktop/LEGAL_PROCESSING_ZANTARA
./MOVE_NEW_PDFS.sh
cd 02_AI_WORKERS/Worker_1_Tax_Investment
open WORKER_1_COMPLETE_PROMPT.md
```

**→ Copy prompt → Open AI → Upload PDF → Process!**

---

**Sistema pronto. Focus: Indonesian citizens + businesses. 🇮🇩**
