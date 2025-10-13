# 🚀 ZANTARA Llama 3.1 - Complete Setup Guide

## ✅ What You Have Now

- ✅ **Llama 3.1 LoRA adapter** trained and uploaded to HuggingFace
  - URL: https://huggingface.co/zeroai87/zantara-llama-3.1-8b
  - Training: 98.74% accuracy, 3 epochs

- ✅ **Integration code** ready in NUZANTARA
  - Handler: `src/handlers/ai-services/zantara-llama.ts`
  - Auto-routing: Triggers on Indonesian/business keywords

- ✅ **RunPod merge script** to create standalone model
  - Script: `ml/zantara/runpod_merge.sh`

---

## 📋 Complete Setup (30 minutes)

### STEP 1: Merge LoRA on RunPod (10 min, ~$0.20)

1. **Deploy RunPod GPU Pod**
   ```bash
   # Go to https://www.runpod.io/console/pods
   # Click "Deploy"
   # Configure:
   - GPU: RTX 4090 (24GB) - $0.69/hour
   - Template: RunPod Pytorch
   - Container Disk: 50GB
   - Volume: Not needed
   ```

2. **Upload merge script**
   ```bash
   # Get pod SSH details from RunPod console
   # Copy script to pod:
   scp -P [PORT] ml/zantara/runpod_merge.sh root@[IP]:/workspace/
   ```

3. **Run merge on pod**
   ```bash
   # SSH into pod:
   ssh -p [PORT] root@[IP]

   # Run merge:
   bash /workspace/runpod_merge.sh

   # Wait 5-10 minutes for completion
   ```

4. **Verify and stop pod**
   ```bash
   # Check HuggingFace for merged model:
   # https://huggingface.co/zeroai87/zantara-llama-3.1-8b-merged

   # IMPORTANT: Stop the pod to avoid charges!
   ```

**Cost**: ~$0.15-0.20 (10-15 minutes of GPU)

---

### STEP 2: Create RunPod Serverless Endpoint (5 min)

1. **Go to RunPod Serverless**
   - URL: https://www.runpod.io/console/serverless
   - Click "New Endpoint"

2. **Configure endpoint**
   ```
   Name: zantara-llama-3.1
   Template: vLLM (recommended) or Custom
   Model: zeroai87/zantara-llama-3.1-8b-merged
   GPU Type: A40 or RTX 4090
   Workers: Min 0, Max 2 (autoscale)
   ```

3. **Get credentials**
   After creation you'll get:
   - **Endpoint URL**: `https://api.runpod.ai/v2/[endpoint-id]/run`
   - **API Key**: Your RunPod API key

---

### STEP 3: Configure NUZANTARA (2 min)

1. **Update `.env` file**
   ```bash
   # Add these lines to .env:
   RUNPOD_LLAMA_ENDPOINT=https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/run
   RUNPOD_API_KEY=your_runpod_api_key_here
   ```

2. **Rebuild TypeScript**
   ```bash
   npm run build
   ```

3. **Restart server**
   ```bash
   npm start
   ```

---

### STEP 4: Test Integration (2 min)

#### Test via API

```bash
# Test ZANTARA directly:
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "handler": "ai.chat",
    "params": {
      "provider": "zantara",
      "prompt": "Bagaimana cara meningkatkan motivasi tim di Indonesia?"
    }
  }'
```

#### Test Auto-Routing

```bash
# Auto-routes to ZANTARA (keywords: Indonesia, business):
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "handler": "ai.chat",
    "params": {
      "prompt": "How to manage customer service in Indonesian market?"
    }
  }'
```

---

## 💰 Cost Breakdown

### One-Time Costs
| Item | Cost |
|------|------|
| RunPod merge (10 min GPU) | ~$0.20 |
| **Total Setup** | **$0.20** |

### Ongoing Costs (RunPod Serverless)
| Usage | Cost/Month |
|-------|------------|
| 100 requests/day | $1.35 |
| 500 requests/day | $6.75 |
| 1000 requests/day | $13.50 |
| 5000 requests/day | $67.50 |

**Formula**: ~$0.00045 per request (3 seconds @ $0.00015/sec)

### Comparison
| Provider | Cost | Notes |
|----------|------|-------|
| **ZANTARA (RunPod)** | $0.00045/req | Your fine-tuned model |
| GPT-4o-mini | $0.00015/1K tokens | ~$0.0015/req |
| Claude Haiku | $0.00025/1K tokens | ~$0.002/req |
| Gemini Flash | FREE (rate limited) | Good for fallback |

**ZANTARA is cheaper than GPT-4o-mini** for long responses! 🎉

---

## 🎯 How ZANTARA is Used in NUZANTARA

### Auto-Routing Logic

ZANTARA is automatically used when:

```typescript
// 1. Indonesian context detected
const isIndonesian = /indonesia|indonesian|bahasa|jakarta|bali|rupiah/i.test(prompt);

// 2. Business context detected
const isBusiness = /business|team|customer|client|management|operations|service/i.test(prompt);

// If either matches and ZANTARA is available → Use ZANTARA
if ((isIndonesian || isBusiness) && availability.zantara) {
  return zantaraChat(params);
}
```

### Manual Override

Force ZANTARA usage:
```javascript
{
  "handler": "ai.chat",
  "params": {
    "provider": "zantara", // or "llama"
    "prompt": "Your question"
  }
}
```

---

## 🔧 Troubleshooting

### Endpoint returns 404
- Check `RUNPOD_LLAMA_ENDPOINT` in `.env`
- Verify endpoint is active in RunPod console
- Check logs: `npm start | grep ZANTARA`

### Slow first response (20-30 seconds)
- Normal! This is "cold start" - serverless worker starting
- Subsequent requests will be fast (2-3 seconds)
- Increase min workers to 1 (costs more but no cold starts)

### Error: "RUNPOD_LLAMA_ENDPOINT not configured"
- Add environment variables to `.env`
- Rebuild: `npm run build`
- Restart server

### Model response is gibberish
- Check model loaded correctly: `https://huggingface.co/zeroai87/zantara-llama-3.1-8b-merged`
- Verify RunPod endpoint uses correct model ID
- Check endpoint logs in RunPod console

---

## 📊 Model Performance

### Training Results
- **Accuracy**: 98.74%
- **Final Loss**: 0.1396
- **Training time**: 3.65 hours
- **Dataset**: 32K NUZANTARA samples

### Inference Speed
- **Cold start**: 10-20 seconds (first request)
- **Warm inference**: 2-3 seconds
- **Throughput**: ~200 tokens/second on RTX 4090

---

## 🎓 Next Steps

1. ✅ Complete setup following this guide
2. 📊 Monitor usage and costs in RunPod console
3. 🔧 Adjust min/max workers based on traffic
4. 📈 Collect feedback and consider retraining with more data
5. 🚀 Optional: Deploy to HuggingFace Inference Endpoints (more expensive but simpler)

---

## 📞 Support

- **RunPod docs**: https://docs.runpod.io/serverless/overview
- **HuggingFace**: https://huggingface.co/docs/transformers
- **NUZANTARA repo**: Check this README

---

**🎉 Setup complete! Your custom ZANTARA Llama 3.1 model is now integrated!**
