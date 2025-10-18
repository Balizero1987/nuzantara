# 🚀 RunPod DevAI Setup Guide

## Problema
Il modello `zeroai87/devai-qwen-2.5-coder-7b` (15.9 GB) è troppo grande per l'API gratuita di HuggingFace Inference.

## Soluzione
Creare un endpoint RunPod per servire il modello.

---

## 📋 Prerequisiti
- ✅ Account RunPod (hai già `RUNPOD_API_KEY`)
- ✅ Modello su HuggingFace: `zeroai87/devai-qwen-2.5-coder-7b`
- ✅ Budget RunPod (circa $0.30-0.50/ora per GPU A40/A100)

---

## 🛠️ Step-by-Step Setup

### 1. Vai su RunPod
https://www.runpod.io/console/serverless

### 2. Crea Nuovo Endpoint
1. Click **"+ New Endpoint"**
2. Nome: `devai-qwen-coder`
3. Seleziona **"vLLM"** come template (già ottimizzato per LLM)

### 3. Configura il Modello
```bash
Model: zeroai87/devai-qwen-2.5-coder-7b
GPU: A40 (48GB) o A100 (80GB)
Workers: 1 (minimo)
Max Workers: 3 (massimo per scalare)
Idle Timeout: 60s (risparmia costi)
```

### 4. Environment Variables (nel pannello RunPod)
```bash
MODEL_NAME=zeroai87/devai-qwen-2.5-coder-7b
HF_TOKEN=<your HuggingFace token>
MAX_MODEL_LEN=4096
QUANTIZATION=awq  # Opzionale: riduce memoria
```

### 5. Deploy
1. Click **"Deploy"**
2. Aspetta 3-5 minuti (scarica 15.9 GB)
3. Copia l'**Endpoint URL** che ti dà RunPod

---

## 🔧 Configurazione Backend NUZANTARA

### 1. Aggiungi Variabile d'Ambiente su Cloud Run
```bash
gcloud run services update zantara-v520-nuzantara \
  --region=europe-west1 \
  --update-env-vars RUNPOD_QWEN_ENDPOINT=https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/runsync
```

### 2. Test Endpoint
```bash
curl -X POST https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/runsync \
  -H "Authorization: Bearer YOUR_RUNPOD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "model": "zeroai87/devai-qwen-2.5-coder-7b",
      "messages": [
        {"role": "system", "content": "You are DevAI, a coding assistant."},
        {"role": "user", "content": "Hello, can you analyze this code?"}
      ],
      "max_tokens": 500,
      "temperature": 0.7
    }
  }'
```

---

## 💰 Costi Stimati

| GPU    | VRAM  | Costo/ora | Tempo risposta |
|--------|-------|-----------|----------------|
| A40    | 48GB  | $0.39     | ~1-2s          |
| A100   | 80GB  | $0.89     | ~0.5-1s        |
| L40    | 48GB  | $0.49     | ~1-2s          |

**Risparmio con Idle Timeout:**
- Con 60s timeout: paga solo quando usi
- Esempio: 10 chiamate/giorno × 2s = 20s = **$0.002/giorno** (A40)

---

## ✅ Verifica Integrazione

Il backend è già configurato per usare RunPod:

```typescript
// src/handlers/devai/devai-qwen.ts

// Try RunPod if configured ✅
if (RUNPOD_ENDPOINT && RUNPOD_API_KEY) {
  try {
    const response = await callRunPod(...);
    return ok({ answer: response, provider: 'runpod-vllm' });
  } catch (error) {
    logger.error('[DevAI] RunPod error:', error.message);
    // Fall through to HuggingFace
  }
}

// Fallback to HuggingFace ❌ (non funziona per 15.9GB)
if (HF_API_KEY) {
  const response = await callHuggingFace(...);
  return ok({ answer: response, provider: 'huggingface-inference' });
}
```

---

## 🎯 Alternativa: HuggingFace Inference Endpoints

Se preferisci HuggingFace invece di RunPod:

1. Vai su: https://ui.endpoints.huggingface.co/
2. Crea endpoint per `zeroai87/devai-qwen-2.5-coder-7b`
3. Costa circa $0.60-1.00/ora
4. Configura `HF_ENDPOINT_URL` invece di `RUNPOD_QWEN_ENDPOINT`

**Pro RunPod:**
- ✅ Più economico
- ✅ Supporto vLLM nativo
- ✅ Scaling automatico

**Pro HuggingFace:**
- ✅ Stessa piattaforma del modello
- ✅ Setup più veloce
- ✅ UI migliore

---

## 📊 Prossimi Passi

1. **ADESSO**: Crea endpoint RunPod
2. **POI**: Configura `RUNPOD_QWEN_ENDPOINT` su Cloud Run
3. **INFINE**: Testa DevAI su https://zantara.balizero.com/devai/

---

## 🆘 Troubleshooting

### Problema: "Model not found"
- Verifica che `HF_TOKEN` sia valido
- Controlla che il modello sia pubblico su HuggingFace

### Problema: "Out of memory"
- Usa GPU con più VRAM (A100 80GB)
- Abilita quantizzazione: `QUANTIZATION=awq`

### Problema: "Timeout"
- Aumenta `Idle Timeout` su RunPod
- Usa `/runsync` per chiamate sincrone

---

## 📝 Note

- Il modello è stato caricato **1 giorno fa** (14 ottobre 2025)
- Fine-tuned su **487 esempi NUZANTARA**
- Dimensione: **15.9 GB** (4 parti safetensors)
- Checkpoints disponibili: `checkpoint-100`, `checkpoint-183`

---

**Created:** 14 ottobre 2025, 02:30  
**Author:** ZANTARA AI System  
**Status:** ⏳ Waiting for RunPod setup

