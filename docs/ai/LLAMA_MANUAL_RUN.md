# 🌙 LLAMA Nightly Worker - Esecuzione Manuale

**Frequenza consigliata**: 1 volta al giorno (ogni 24 ore)
**Durata**: 5-20 minuti (dipende da RunPod cold start)
**Orario consigliato**: 10:00 AM Jakarta (2:00 AM UTC)

---

## 📋 Comando da Eseguire

### **Opzione 1: Da Locale (Terminal Mac/Linux)** ⭐ Raccomandato

```bash
cd /path/to/NUZANTARA-RAILWAY
export DATABASE_URL="postgresql://postgres:GugQKewRUivJWyodUoXKqgkCqRleGaKr@turntable.proxy.rlwy.net:49486/railway"
export RUNPOD_LLAMA_ENDPOINT="https://api.runpod.ai/v2/itz2q5gmid4cyt/runsync"
export RUNPOD_API_KEY="rpa_O0Z01LGRFLEG7DAX7FRGLJ4SOJSHKSGD9RRJD1RMwmq5qz"

python3 apps/backend-rag/scripts/llama_nightly_worker.py \
  --days 3 \
  --max-golden 50 \
  --regenerate-cultural
```

**Output atteso**:
```
======================================================================
🌙 LLAMA NIGHTLY WORKER - START
======================================================================
   Date: 2025-10-21 10:00:00 UTC
   Days lookback: 3
   Max golden answers: 50
   Regenerate cultural: True

📊 TASK 1: Query Analysis & Clustering
----------------------------------------------------------------------
   Extracted 127 queries from last 3 days
   Found 23 query clusters
   Top 50 coverage: 78%

💎 TASK 2: Golden Answer Generation
----------------------------------------------------------------------
   Generating golden answers for top 50 clusters
   ✅ Generated 45 golden answers

🎭 TASK 3: Cultural Knowledge Generation
----------------------------------------------------------------------
   Regenerating all cultural chunks...
   ✅ Generated 10 cultural chunks

======================================================================
🎉 NIGHTLY WORKER COMPLETE
======================================================================
   Total queries analyzed: 127
   Clusters found: 23
   Golden answers generated: 45
   Cultural chunks generated: 10
   Duration: 487.2 seconds (8.1 minutes)
======================================================================
```

---

### **Opzione 2: Script One-liner (Copia-Incolla)** 🚀

Salva questo in `run-llama.sh`:

```bash
#!/bin/bash
cd ~/Desktop/NUZANTARA-RAILWAY && \
export DATABASE_URL="postgresql://postgres:GugQKewRUivJWyodUoXKqgkCqRleGaKr@turntable.proxy.rlwy.net:49486/railway" && \
export RUNPOD_LLAMA_ENDPOINT="https://api.runpod.ai/v2/itz2q5gmid4cyt/runsync" && \
export RUNPOD_API_KEY="rpa_O0Z01LGRFLEG7DAX7FRGLJ4SOJSHKSGD9RRJD1RMwmq5qz" && \
python3 apps/backend-rag/scripts/llama_nightly_worker.py --days 3 --max-golden 50 --regenerate-cultural
```

Poi esegui:
```bash
chmod +x run-llama.sh
./run-llama.sh
```

---

### **Opzione 3: Railway CLI (se Railway installato)**

```bash
railway run python3 scripts/llama_nightly_worker.py --days 3 --max-golden 50 --regenerate-cultural
```

⚠️ **Nota**: Richiede Railway CLI configurato nel progetto

---

## 🎯 Parametri Configurabili

| Parametro | Default | Descrizione | Esempio |
|-----------|---------|-------------|---------|
| `--days` | 7 | Quanti giorni di query analizzare | `--days 3` |
| `--max-golden` | 50 | Massimo golden answers da generare | `--max-golden 30` |
| `--regenerate-cultural` | False | Rigenera cultural chunks (10 chunks) | `--regenerate-cultural` |

**Esempi**:

```bash
# Solo query clustering (no generation)
python3 apps/backend-rag/scripts/llama_nightly_worker.py --days 7 --max-golden 0

# Solo cultural knowledge (no golden answers)
python3 apps/backend-rag/scripts/llama_nightly_worker.py --days 1 --max-golden 0 --regenerate-cultural

# Full run (tutto)
python3 apps/backend-rag/scripts/llama_nightly_worker.py --days 3 --max-golden 50 --regenerate-cultural
```

---

## ✅ Come Verificare il Successo

### **1. Controlla Logs**

Cerca questi messaggi:
- ✅ `✅ Generated XX golden answers` (successo)
- ✅ `✅ Generated 10 cultural chunks` (successo)
- ❌ `❌ LLAMA timeout` (RunPod non disponibile)
- ❌ `❌ Worker still IN_QUEUE` (cold start troppo lungo)

### **2. Controlla Database**

```sql
-- Ultimi run del worker
SELECT * FROM nightly_worker_runs
ORDER BY run_date DESC
LIMIT 5;

-- Golden answers generate oggi
SELECT COUNT(*) FROM golden_answers
WHERE created_at::date = CURRENT_DATE;

-- Cultural chunks aggiornati
SELECT topic, updated_at FROM cultural_knowledge
ORDER BY updated_at DESC;
```

### **3. Controlla ChromaDB**

I cultural chunks vengono salvati in `cultural_insights` collection in ChromaDB.

---

## ⚠️ Troubleshooting

### **Problema: "LLAMA timeout (>300s)"**

**Causa**: RunPod worker in cold start (Min Workers = 0)

**Fix**:
1. Aspetta 2-3 minuti e riprova
2. Oppure: Attiva Min Workers = 1 su RunPod Dashboard
3. Oppure: Esegui con `--max-golden 0 --regenerate-cultural` (solo cultural, più veloce)

---

### **Problema: "No queries found"**

**Causa**: Nessuna conversazione negli ultimi N giorni

**Fix**:
- Aumenta `--days` (es: `--days 7`)
- Oppure salta query analysis: esegui solo `--regenerate-cultural`

---

### **Problema: "PostgreSQL connection failed"**

**Causa**: `DATABASE_URL` non settato o invalido

**Fix**:
```bash
export DATABASE_URL="postgresql://postgres:GugQKewRUivJWyodUoXKqgkCqRleGaKr@turntable.proxy.rlwy.net:49486/railway"
```

Verifica la password nel Railway Dashboard → Database → Connect.

---

## 📅 Schedule Consigliato

**Quando eseguire** (scegli uno):

- **Mattina Jakarta** (10:00 AM WIB = 3:00 AM UTC)
  → Dopo notte di conversazioni, prima di workday

- **Sera Jakarta** (9:00 PM WIB = 2:00 PM UTC)
  → Dopo workday, analizza conversazioni giornaliere

- **Fine settimana** (Sabato 10:00 AM WIB)
  → Full run settimanale con `--days 7`

**Frequenza**:
- **Golden Answers**: 1-2 volte/settimana (quando hai traffic)
- **Cultural Knowledge**: 1 volta/mese (cambiano raramente)

---

## 🎯 Quick Reference Card

**Copia-Incolla questo messaggio nel team WhatsApp/Slack:**

```
🌙 LLAMA NIGHTLY WORKER - Run Manuale

📍 Dove: Terminal locale (Mac/Linux)
⏰ Quando: Ogni giorno 10:00 AM Jakarta (opzionale)
⏱️ Durata: 5-20 minuti

🚀 COMANDO:
cd ~/Desktop/NUZANTARA-RAILWAY && \
export DATABASE_URL="postgresql://postgres:GugQKewRUivJWyodUoXKqgkCqRleGaKr@turntable.proxy.rlwy.net:49486/railway" && \
export RUNPOD_LLAMA_ENDPOINT="https://api.runpod.ai/v2/itz2q5gmid4cyt/runsync" && \
export RUNPOD_API_KEY="rpa_O0Z01LGRFLEG7DAX7FRGLJ4SOJSHKSGD9RRJD1RMwmq5qz" && \
python3 apps/backend-rag/scripts/llama_nightly_worker.py --days 3 --max-golden 50 --regenerate-cultural

✅ Successo se vedi: "🎉 NIGHTLY WORKER COMPLETE"
❌ Errore se vedi: "❌ LLAMA timeout" (riprova tra 5 min)

📊 Verifica: https://railway.app → Database → nightly_worker_runs
```

---

**Documento creato**: 2025-10-21
**Ultima modifica**: 2025-10-21
**Autore**: Claude Code (AI Developer)
