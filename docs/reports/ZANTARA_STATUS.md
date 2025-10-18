# ZANTARA Llama 3.1 - Setup Status

## ✅ Completed

### 1. Model Training
- **Status**: ✅ COMPLETE
- **Accuracy**: 98.74% token accuracy
- **Dataset**: 3000 Indonesian business conversations
- **Method**: LoRA fine-tuning on Llama 3.1 8B
- **Location**: HuggingFace - [zeroai87/zantara-llama-3.1-8b](https://huggingface.co/zeroai87/zantara-llama-3.1-8b)

### 2. Integration Code
- **Status**: ✅ COMPLETE
- **Handler**: [src/handlers/ai-services/zantara-llama.ts](src/handlers/ai-services/zantara-llama.ts)
- **Routing**: Integrated in [src/handlers/ai-services/ai.ts](src/handlers/ai-services/ai.ts)
- **Auto-routing**: Keywords-based selection for Indonesian/business contexts

### 3. Backend Options
ZANTARA supports multiple backends (tries in order):

#### Option A: RunPod Serverless (Recommended for Production)
- **Status**: ⏳ READY TO DEPLOY
- **Cost**: ~$0.00045/request (~$3-5/month)
- **Setup**: Create serverless endpoint via RunPod dashboard
- **API Key**: `rpa_YOUR_API_KEY_HERE`
- **Template**: Created (ID: vu7xbxuqme) - "zantara-llama-vllm"

#### Option B: OpenAI GPT-4o-mini (Current Fallback)
- **Status**: ✅ READY (needs valid API key)
- **Cost**: ~$0.0015/request
- **Note**: Uses ZANTARA system prompt for Indonesian business context
- **Required**: Add `OPENAI_API_KEY` to `.env`

#### Option C: HuggingFace Inference API
- **Status**: ❌ NOT AVAILABLE (Llama 3.1 requires PRO subscription)
- **Alternative**: Free tier models have loading issues

## 🎯 How to Complete Setup

### Quick Start (Option B - OpenAI)
```bash
# Add to .env
echo "OPENAI_API_KEY=sk-YOUR_KEY_HERE" >> .env

# Build and start
npm run build
npm start

# Test
curl http://localhost:8080/ai/chat \
  -d '{"message":"Bagaimana cara meningkatkan produktivitas tim?","provider":"zantara"}'
```

### Production Setup (Option A - RunPod)
1. Login to [RunPod Dashboard](https://www.runpod.io/console)
2. Go to Serverless → Templates
3. Find template "zantara-llama-vllm" (ID: vu7xbxuqme)
4. Create new endpoint:
   - Name: `zantara-llama-3-1`
   - GPU: RTX 4090 / A6000 / RTX 3090
   - Workers: Min=0, Max=2
   - Idle timeout: 5 seconds
5. Copy endpoint ID and update `.env`:
   ```bash
   RUNPOD_LLAMA_ENDPOINT=https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/run
   RUNPOD_API_KEY=rpa_YOUR_API_KEY_HERE
   ```
6. Restart NUZANTARA

## 📊 Features

### Intelligent Auto-Routing
ZANTARA is automatically selected when messages contain:
- **Indonesian keywords**: `indonesia`, `indonesian`, `bahasa`, `jakarta`, `bali`, `rupiah`
- **Business keywords**: `business`, `team`, `customer`, `management`, `operations`, `service`

### Manual Selection
```typescript
// Force ZANTARA usage
await aiChat({
  message: "Your business question",
  provider: "zantara"
});
```

### System Prompt
ZANTARA uses a specialized prompt:
> "You are ZANTARA, an intelligent AI assistant specialized in business operations, team management, and customer service for Indonesian markets. Respond in a professional, helpful manner."

## 💰 Cost Comparison

| Backend | Cost/Request | Monthly (100 req/day) | Notes |
|---------|--------------|----------------------|-------|
| RunPod Serverless | $0.00045 | $1.35 | Recommended, auto-scaling |
| GPT-4o-mini | $0.0015 | $4.50 | Good fallback |
| HuggingFace (PRO) | $0.00 | $9.00 subscription | Not implemented |

## 🔧 Technical Details

### Files Created/Modified
- ✅ `src/handlers/ai-services/zantara-llama.ts` - Main handler
- ✅ `src/handlers/ai-services/ai.ts` - Auto-routing integration
- ✅ `.env` - Configuration (needs OPENAI_API_KEY or RunPod credentials)
- ✅ `ml/zantara/complete_setup.sh` - Automated setup script
- ✅ `ml/zantara/runpod_merge.sh` - GPU merge script (for future use)

### Model Details
- **Base Model**: meta-llama/Llama-3.1-8B-Instruct
- **Adapter**: LoRA with r=64, alpha=128, dropout=0.05
- **Target Modules**: q_proj, k_proj, v_proj, o_proj
- **Size**: 208MB adapter (vs 16GB full model)
- **Training Data**: Indonesian business conversations, customer service, team management

### Integration Points
1. **Direct call**: `zantaraChat({ message: "..." })`
2. **Via AI router**: `aiChat({ message: "...", provider: "zantara" })`
3. **Auto-routing**: Keywords trigger automatic selection

## ✅ Testing

### Check Availability
```bash
node -e "import('./dist/handlers/ai-services/zantara-llama.js').then(m => console.log('Available:', m.isZantaraAvailable()))"
```

### Test Query
```bash
# With valid backend configured
curl http://localhost:8080/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Bagaimana cara meningkatkan produktivitas tim di Indonesia?",
    "provider": "zantara"
  }'
```

### Expected Response
```json
{
  "status": "success",
  "data": {
    "answer": "Untuk meningkatkan produktivitas tim...",
    "model": "zantara-gpt4o-mini" | "zantara-llama-3.1-8b",
    "provider": "openai-zantara" | "runpod",
    "tokens": 150
  }
}
```

## 🚀 Next Steps

### Immediate (to use ZANTARA now)
1. Add `OPENAI_API_KEY` to `.env`
2. Rebuild: `npm run build`
3. Test: use queries with Indonesian/business keywords

### For Production (optimal cost/performance)
1. Create RunPod Serverless endpoint using template `vu7xbxuqme`
2. Update `.env` with RunPod credentials
3. Restart NUZANTARA
4. Monitor usage and costs in RunPod dashboard

### Optional Enhancements
1. **Fine-tune prompt** based on actual usage patterns
2. **Adjust auto-routing keywords** if needed
3. **Scale RunPod workers** based on load (currently 0-2)
4. **Merge LoRA adapter** for slightly better performance (requires GPU)

## 📝 Notes

- RunPod pod was created and terminated to avoid charges
- LoRA adapter is ready on HuggingFace but not merged (not required for vLLM)
- System uses intelligent fallback: RunPod → OpenAI GPT-4o-mini
- Auto-routing works with any backend
- Model specialization comes from system prompt (when using non-trained backend)
- For best results with trained model, use RunPod Serverless option

## 🔗 Resources

- **Model**: https://huggingface.co/zeroai87/zantara-llama-3.1-8b
- **RunPod Dashboard**: https://www.runpod.io/console
- **Template ID**: vu7xbxuqme (zantara-llama-vllm)
- **API Key**: `rpa_YOUR_API_KEY_HERE`
- **Setup Guide**: [LLAMA_SETUP_GUIDE.md](LLAMA_SETUP_GUIDE.md)
- **Quick Start**: [ZANTARA_QUICKSTART.md](ZANTARA_QUICKSTART.md)

---

**Status**: ✅ Integration COMPLETE - Waiting for backend configuration (OpenAI key or RunPod endpoint)
