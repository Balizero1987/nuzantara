# 🚀 RunPod LLAMA Optimization Guide
**Velocizzare LLAMA per 5-10 minuti giornalieri**

---

## 🎯 Problema

RunPod worker serverless ha **cold start** (~1-2 minuti):
- Worker in "initializing" quando idle
- Prima richiesta va in coda (IN_QUEUE)
- Successive richieste processate velocemente

**Obiettivo**: Avere worker pronto per batch giornaliero (2 AM UTC)

---

## ✅ Soluzione 1: Warm-up Request (IMPLEMENTATO)

**File**: `scripts/llama_nightly_worker.py:168-202`

```python
async def _warmup_llama(self):
    """Send warm-up request to initialize worker before batch"""
    # Invia dummy request 60 secondi prima del batch
    # Worker si inizializza in background
```

**Come funziona:**
1. Worker parte (cold start ~1min)
2. Dummy request completa
3. Worker rimane "warm" per ~60s
4. Batch inizia con worker già pronto

**Costo**: 1 request extra (~$0.001/giorno)

**✅ Già deployato nel codice**

---

## 🔧 Soluzione 2: RunPod Min Workers = 1

**Dashboard RunPod:**
1. https://www.runpod.io/console/serverless
2. Endpoint: `Zantara_LLAMA_3.1` (itz2q5gmid4cyt)
3. Edit → **Scaling Configuration**:
   ```
   Min Workers: 1  (invece di 0)
   Max Workers: 3
   Idle Timeout: 60 seconds
   ```

**Costo stimato:**
- Worker idle: $0.0001/s = $8.64/giorno (sempre acceso)
- Worker active: $0.00075/s (solo durante uso)

**Compromesso**:
- ✅ Zero cold start (worker sempre pronto)
- ❌ Costo fisso $260/mese (~€240)

**Raccomandazione**: Usa solo se batch è critico (es. real-time dashboard)

---

## ⚡ Soluzione 3: Scheduled Worker Scale-up

**RunPod API** (chiamata 5 minuti prima del batch):

```python
# Railway Cron: 01:55 UTC (5 min prima del batch)
import httpx

async def scale_up_runpod():
    """Scale RunPod to min=1 5 minutes before batch"""
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://api.runpod.io/v2/itz2q5gmid4cyt/config",
            headers={"Authorization": f"Bearer {RUNPOD_API_KEY}"},
            json={"minWorkers": 1}
        )

# Railway Cron: 02:15 UTC (dopo il batch)
async def scale_down_runpod():
    """Scale down to min=0 after batch"""
    # ... (same con minWorkers: 0)
```

**Costo**: ~$0.30/giorno (worker acceso solo 15-20 minuti)

**Pro**:
- Costo ottimale ($9/mese vs $260)
- Worker pronto quando serve

**Contro**:
- Richiede 2 cron jobs extra
- Complessità maggiore

---

## 📊 Soluzione 4: Batch Optimization

**Ridurre numero richieste:**

```python
# Invece di 10 richieste sequenziali (5 min wait x 10 = 50min)
# Usa batch inference (se supportato da vLLM)

prompts = [prompt1, prompt2, ..., prompt10]

response = await client.post(
    runpod_endpoint,
    json={
        "input": {
            "prompts": prompts,  # Batch di 10 prompts
            "max_tokens": 300,
            "temperature": 0.4
        }
    }
)
```

**Risultato**: 1 richiesta invece di 10 (50min → 5min)

**⚠️ Verifica se vLLM supporta batch inference nel tuo setup**

---

## 🎯 Raccomandazione Finale

### Per uso sporadico (1x/giorno):

**Combo Warm-up + Batch Optimization:**
1. ✅ Warm-up request (già implementato)
2. ✅ Timeout lungo (300s - già fatto)
3. ⏳ Batch inference (se supportato da vLLM)
4. ❌ Min Workers = 1 (troppo costoso per uso sporadico)

**Costo**: ~$0.50/mese (solo batch time)

---

## 📝 Next Steps

1. **Test warm-up** (già nel codice):
   ```bash
   python3 scripts/llama_nightly_worker.py --days 1 --regenerate-cultural
   # Verifica log: "🔥 Warming up LLAMA worker..."
   ```

2. **Monitor RunPod dashboard**:
   - Check worker status durante batch
   - Tempo "initializing" → "running"

3. **Se ancora lento**, considera:
   - Min Workers = 1 (costo fisso)
   - O scheduled scale-up (costo ottimale)

---

## 🔍 Debug RunPod Response

Se worker risponde ma content è vuoto:

```python
# Check response format
response = await client.post(runpod_endpoint, ...)
data = response.json()

print(f"Status: {data.get('status')}")
print(f"Output keys: {data.get('output', {}).keys()}")
print(f"Full response: {data}")
```

**Formati possibili:**
- `{"status": "IN_QUEUE"}` → Worker overloaded
- `{"status": "COMPLETED", "output": {"text": "..."}}` → vLLM format
- `{"status": "COMPLETED", "output": {"choices": [...]}}` → OpenAI format

Il code già gestisce tutti questi casi (cultural_knowledge_generator.py:326-359)

---

✅ **Warm-up implementato e ready to deploy!**
