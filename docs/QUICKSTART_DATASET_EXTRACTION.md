# 🚀 Quick Start: Dataset Extraction

**Obiettivo:** Estrarre conversazioni reali da PostgreSQL per training LLAMA 3.1 8B

---

## Step 1: Ottieni DATABASE_URL da Railway

### Opzione A: Railway Dashboard (più facile)

1. Vai a: https://railway.app/project/fulfilling-creativity
2. Nella lista dei servizi, cerca il database PostgreSQL o il servizio che lo usa
3. Click sul servizio
4. Tab "Variables" → Cerca `DATABASE_URL`
5. Click sull'icona "Copy" per copiare il valore

Il formato sarà simile a:
```
postgresql://postgres:PASSWORD@HOST:PORT/railway
```

### Opzione B: Railway CLI

```bash
cd apps/backend-rag
railway variables | grep DATABASE_URL
```

---

## Step 2: Testa la connessione

```bash
# Esporta DATABASE_URL (sostituisci con il tuo valore)
export DATABASE_URL='postgresql://postgres:PASSWORD@HOST:PORT/railway'

# Testa connessione e ottieni stats
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY
python3 scripts/extract_dataset_from_postgres.py --stats-only
```

**Output atteso:**
```
✅ Connected to PostgreSQL

📈 Database Stats (last 30 days):
   Total conversations: 1,247

   AI Model Usage:
   - haiku: 750 convs (avg 45 tokens)
   - sonnet: 497 convs (avg 180 tokens)
```

**Valutazione:**
- ✅ **GOOD:** >500 conversazioni → Procedi con extraction
- ⚠️ **MARGINAL:** 200-500 conversazioni → Estendi a 60 giorni (`--days 60`)
- ❌ **INSUFFICIENT:** <200 conversazioni → Aspetta più dati o usa mock data

---

## Step 3: Estrai dataset completo

Se stats look good:

```bash
python3 scripts/extract_dataset_from_postgres.py \
    --days 30 \
    --limit 5000 \
    --output ./data/llama_ft_dataset
```

**Output atteso:**
```
📥 Extracting conversations (last 30 days, limit 5000)...
   Found: 1,247 conversations
   Parsed: 1,189 valid conversations

🔍 Filtering for quality...
   Kept: 1,045/1,189 (87.9%)

   Rejection breakdown:
   - too_short: 89
   - error_response: 34
   - repetitive_ciao: 21

📊 Dataset Analysis:
   Total conversations: 1,045

   Languages:
   - it: 420 (40.2%)
   - en: 315 (30.1%)
   - id: 310 (29.7%)

   AI Models:
   - haiku: 628 (60.1%)
   - sonnet: 417 (39.9%)

💾 Exporting to ./data/llama_ft_dataset/raw_conversations.jsonl...
✅ Exported 1,045 conversations

🎯 Next steps:
   1. Review raw_conversations.jsonl
   2. Run prepare_llama_dataset.py to format for training
```

---

## Step 4: Prepara per training LLAMA

```bash
python3 scripts/prepare_llama_dataset.py
```

**Output atteso:**
```
🚀 ZANTARA Dataset Preparation for LLAMA Fine-tuning

📥 Loading conversations from database...
   Loaded: 1,045 conversations

🔍 Filtering for quality...
   Quality examples: 1,045/1,045 (100.0%)

🔄 Formatting for instruction-tuning...
   Formatted: 1,045 examples

📈 Augmenting dataset...
   Augmented: 1,045 → 1,247 (+202 variations)

✂️  Splitting train/val/test...
   Train: 997
   Val: 125
   Test: 125

💾 Saving dataset...
✅ train: 997 examples → ./data/llama_ft_dataset/train.jsonl
✅ val: 125 examples → ./data/llama_ft_dataset/val.jsonl
✅ test: 125 examples → ./data/llama_ft_dataset/test.jsonl

✅ DATASET PREPARATION COMPLETE

📁 Output: ./data/llama_ft_dataset

🎯 Next step: Fine-tune LLAMA 3.1 8B with this dataset
   → Use Unsloth/Axolotl for efficient training
   → GPU: RTX 4090 / A100 (Runpod/Lambda)
   → Training time: ~2-4 hours
```

---

## Step 5: Verifica dataset

```bash
# Guarda primi 3 esempi
head -3 data/llama_ft_dataset/train.jsonl | python3 -m json.tool
```

**Formato atteso:**
```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are ZANTARA, expert Indonesian business assistant..."
    },
    {
      "role": "user",
      "content": "Ciao"
    },
    {
      "role": "assistant",
      "content": "Ciao! Come posso aiutarti oggi con Bali Zero? 😊"
    }
  ],
  "metadata": {
    "language": "it",
    "rating": 5
  }
}
```

---

## ✅ Success Checklist

Dopo aver completato tutti gli step:

- [ ] DATABASE_URL configurato e connessione testata
- [ ] Stats mostrano >500 conversazioni
- [ ] Dataset estratto: `raw_conversations.jsonl` esiste
- [ ] Dataset formattato: `train.jsonl`, `val.jsonl`, `test.jsonl` esistono
- [ ] Train set ha >800 esempi
- [ ] Distribuzione lingue bilanciata (30-40% ciascuna)
- [ ] Sample manual review: risposte di qualità

Se tutto ✅, sei pronto per **Phase 2: Fine-tuning LLAMA!**

---

## 🆘 Troubleshooting

### Errore: Connection refused
```
❌ Connection failed: connection refused
```
**Fix:** DATABASE_URL non corretto o database non raggiungibile. Verifica:
1. URL copiato correttamente da Railway
2. Database service running su Railway
3. Nessun firewall che blocca connessione

### Errore: Table does not exist
```
❌ relation "conversations" does not exist
```
**Fix:** Schema database non inizializzato. Controlla:
1. Backend RAG è stato deployato almeno una volta?
2. Migration scripts eseguiti?
3. Usa `--table-name` flag se table ha nome diverso

### Warning: Too few conversations (<500)
**Fix:** Opzioni:
1. Estendi time range: `--days 60` o `--days 90`
2. Aspetta più giorni per raccogliere dati
3. Usa mock data per testing (non production)

### Error: asyncpg not installed
```
ModuleNotFoundError: No module named 'asyncpg'
```
**Fix:**
```bash
pip install asyncpg
```

---

## 📞 Need Help?

**Logs:**
- Extraction logs: `./logs/`
- Railway logs: `railway logs`

**Script help:**
```bash
python3 scripts/extract_dataset_from_postgres.py --help
python3 scripts/prepare_llama_dataset.py --help
```

**Full documentation:**
- `docs/LLAMA_SHADOW_MODE_PLAN.md` - Master plan completo
- `apps/backend-rag/backend/services/shadow_mode_service.py` - Shadow mode code

---

Pronto! 🚀 Inizia dallo Step 1 per ottenere il DATABASE_URL.
