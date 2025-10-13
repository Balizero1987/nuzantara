# 🤖 AI Models Information - NUZANTARA System

**Last Updated**: 14 ottobre 2025, 02:45  
**Status**: ✅ Production Ready

---

## 📊 System Overview

NUZANTARA utilizza **due AI specializzate**:

| AI | Model | Specialization | Status | Endpoint |
|----|-------|----------------|--------|----------|
| **ZANTARA** | Llama 3.1 8B Instruct (Fine-tuned) | Business Intelligence, Indonesian context, Wisdom | ✅ Active | RunPod Serverless |
| **DevAI** | Qwen 2.5 Coder 7B (Fine-tuned) | Code Analysis, Bug Detection, Development | ✅ Active | RunPod Serverless |

---

## 🔮 ZANTARA - Intelligence AI

### Model Details
- **Base Model**: `meta-llama/Llama-3.1-8B-Instruct`
- **Fine-tuned Model**: `zeroai87/zantara-llama-3.1-8b-merged`
- **Model Size**: 16 GB (merged LoRA + base)
- **Training**: 3000 Indonesian business conversations
- **Accuracy**: 98.74%
- **HuggingFace**: https://huggingface.co/zeroai87/zantara-llama-3.1-8b-merged

### Specialization
- Indonesian business context
- Visa, company setup, tax consulting
- Multi-lingual (EN/ID/IT/Sundanese)
- Ancient wisdom + modern technology bridge
- 4-level Sub Rosa Protocol (Public → Curious → Practitioner → Initiated)

### Deployment
- **Platform**: RunPod Serverless
- **Endpoint ID**: `itz2q5gmid4cyt`
- **API Endpoint**: `https://api.runpod.ai/v2/itz2q5gmid4cyt/runsync`
- **GPU**: A40 (48GB VRAM)
- **Workers**: 0-2 (auto-scaling)
- **Idle Timeout**: 5 seconds

### Backend Integration
```typescript
// src/handlers/ai-services/zantara-llama.ts
const RUNPOD_LLAMA_ENDPOINT = process.env.RUNPOD_LLAMA_ENDPOINT;
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;

// Auto-routing: Activated for Indonesian/business keywords
// Manual: provider: "zantara"
```

### Environment Variables (Cloud Run)
```bash
RUNPOD_LLAMA_ENDPOINT=https://api.runpod.ai/v2/itz2q5gmid4cyt/runsync
RUNPOD_API_KEY=<stored in Secret Manager>
HF_API_KEY=<stored in Secret Manager>
```

### Cost
- **Per Request**: ~$0.00045
- **Per Month** (100 requests/day): ~$1.35
- **Comparison**: 70% cheaper than GPT-4o-mini for long responses

### Frontend Access
- **Main Interface**: https://zantara.balizero.com/
- **API Endpoint**: https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call
- **Handler Key**: `ai.chat`

### Example Request
```bash
curl -X POST https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call \
  -H "Content-Type: application/json" \
  -H "X-API-Key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "ai.chat",
    "params": {
      "message": "Bagaimana cara mendirikan PT PMA di Bali?",
      "provider": "zantara"
    }
  }'
```

---

## 💻 DevAI - Developer AI

### Model Details
- **Base Model**: `Qwen/Qwen2.5-Coder-7B-Instruct`
- **Fine-tuned Model**: `zeroai87/devai-qwen-2.5-coder-7b`
- **Model Size**: 15.9 GB (merged LoRA + base)
- **Training**: 487 NUZANTARA code examples
- **Fine-tuning Date**: 13 ottobre 2025
- **HuggingFace**: https://huggingface.co/zeroai87/devai-qwen-2.5-coder-7b

### Specialization
- Code analysis and review
- Bug detection and fixing
- Code explanation
- Test generation
- Refactoring suggestions
- Development workflows

### Deployment
- **Platform**: RunPod Serverless
- **Endpoint ID**: `5g2h6nbyls47i7`
- **API Endpoint**: `https://api.runpod.ai/v2/5g2h6nbyls47i7/runsync`
- **GPU**: 2× RTX 80GB Pro
- **Workers**: 0-2 (auto-scaling)
- **Idle Timeout**: 5 seconds
- **Scale Strategy**: Queue Delay (4 seconds)

### Backend Integration
```typescript
// src/handlers/devai/devai-qwen.ts
const DEVAI_MODEL = 'zeroai87/devai-qwen-2.5-coder-7b';
const RUNPOD_ENDPOINT = process.env.RUNPOD_QWEN_ENDPOINT;
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const HF_API_KEY = process.env.HF_API_KEY;

// Tries RunPod first, falls back to HuggingFace
```

### Environment Variables (Cloud Run)
```bash
RUNPOD_QWEN_ENDPOINT=https://api.runpod.ai/v2/5g2h6nbyls47i7/runsync
RUNPOD_API_KEY=<stored in Secret Manager>
HF_API_KEY=<stored in Secret Manager>
```

### Available Handlers
| Handler | Key | Description |
|---------|-----|-------------|
| Chat | `devai.chat` | General code conversation |
| Analyze | `devai.analyze` | Code analysis |
| Fix Bugs | `devai.fix` | Bug detection and fixing |
| Review | `devai.review` | Code review |
| Explain | `devai.explain` | Code explanation |
| Generate Tests | `devai.generate-tests` | Test generation |
| Refactor | `devai.refactor` | Refactoring suggestions |

### Frontend Access
- **DevAI Interface**: https://zantara.balizero.com/devai/
- **API Endpoint**: https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call
- **Authentication**: Token-based (private section)
- **Token**: `devai-private-2025`

### Example Request
```bash
curl -X POST https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call \
  -H "Content-Type: application/json" \
  -H "X-API-Key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "devai.analyze",
    "params": {
      "code": "function calcTotal(items) { return items.reduce((a,b) => a + b.price, 0) }",
      "task": "analyze"
    }
  }'
```

---

## 🔗 AI Communication Bridge

ZANTARA e DevAI possono comunicare direttamente per workflow complessi.

### Architecture
```
User Request → ZANTARA (business logic)
              ↓
              DevAI (code implementation)
              ↓
              ZANTARA (business review)
              ↓
User Response
```

### Bridge Handlers

#### ZANTARA → DevAI
```typescript
// src/handlers/ai-services/ai-bridge.ts
zantaraCallDevAI(params: {
  message: string;
  target: 'devai';
  workflowId: string;
  sharedContext?: Record<string, any>;
})
```

#### DevAI → ZANTARA
```typescript
// src/handlers/devai/devai-bridge.ts
devaiCallZantara(params: {
  message: string;
  target: 'zantara';
  workflowId: string;
  sharedContext?: Record<string, any>;
})
```

### Workflow Orchestration
```typescript
// Example: Development workflow
{
  workflowId: "feature-xyz",
  steps: [
    { ai: 'zantara', task: 'Analyze business requirements' },
    { ai: 'devai', task: 'Generate code structure' },
    { ai: 'devai', task: 'Review generated code' },
    { ai: 'zantara', task: 'Assess business impact' }
  ]
}
```

### Shared Memory
```typescript
// src/services/ai-communication.ts
interface WorkflowState {
  workflowId: string;
  currentStep: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  history: Array<{ ai: 'zantara' | 'devai'; message: string; response: any }>;
  sharedContext: Record<string, any>;
}
```

---

## 📈 Performance & Monitoring

### ZANTARA
- **Uptime**: 99.9%
- **Avg Response Time**: 1-2 seconds
- **Success Rate**: 98%+
- **Active Workers**: Monitored at https://console.runpod.io/serverless/user/endpoint/itz2q5gmid4cyt

### DevAI
- **Uptime**: 99.9%
- **Avg Response Time**: 2-3 seconds (code analysis)
- **Success Rate**: 95%+ (new model)
- **Active Workers**: Monitored at https://console.runpod.io/serverless/user/endpoint/5g2h6nbyls47i7

### Billing (Last 24h)
- **ZANTARA**: $0.00 (idle)
- **DevAI**: $0.00 (idle)
- **Total**: Auto-scaling keeps costs minimal

---

## 🔧 Maintenance & Updates

### Model Updates
1. **Fine-tune** new data
2. **Upload** to HuggingFace
3. **Update** RunPod endpoint
4. **Test** extensively
5. **Deploy** to production

### Endpoint Management
- **RunPod Console**: https://www.runpod.io/console/serverless
- **HuggingFace Models**: https://huggingface.co/zeroai87
- **Cloud Run Config**: `gcloud run services describe zantara-v520-nuzantara --region=europe-west1`

### Troubleshooting

#### ZANTARA Issues
```bash
# Check endpoint health
curl -X GET https://api.runpod.ai/v2/itz2q5gmid4cyt/health \
  -H "Authorization: Bearer $RUNPOD_API_KEY"

# Test direct call
curl -X POST https://api.runpod.ai/v2/itz2q5gmid4cyt/runsync \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input":{"prompt":"Hello ZANTARA","max_tokens":50}}'
```

#### DevAI Issues
```bash
# Check endpoint health
curl -X GET https://api.runpod.ai/v2/5g2h6nbyls47i7/health \
  -H "Authorization: Bearer $RUNPOD_API_KEY"

# Test direct call
curl -X POST https://api.runpod.ai/v2/5g2h6nbyls47i7/runsync \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input":{"model":"zeroai87/devai-qwen-2.5-coder-7b","messages":[{"role":"user","content":"Hello DevAI"}],"max_tokens":50}}'
```

---

## 📚 Documentation References

### ZANTARA
- **Quick Start**: `docs/ZANTARA_QUICKSTART.md`
- **Setup Guide**: `docs/architecture/ZANTARA_SETUP_GUIDE.md`
- **Configuration**: `docs/ZANTARA_CONFIGURATION_GUIDE.md`
- **LLAMA Setup**: `docs/LLAMA_SETUP_GUIDE.md`

### DevAI
- **RunPod Setup**: `RUNPOD_DEVAI_SETUP.md`
- **Interface Guide**: `devai/README.md`
- **Training Script**: `train_devai_qwen.py`
- **Inference Script**: `ml/devai/hf_inference.py`

### Bridge System
- **Communication Service**: `src/services/ai-communication.ts`
- **ZANTARA Bridge**: `src/handlers/ai-services/ai-bridge.ts`
- **DevAI Bridge**: `src/handlers/devai/devai-bridge.ts`

---

## 🎯 Quick Reference

### ZANTARA
```bash
# Production URL
https://zantara.balizero.com/

# API Call
POST https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call
Key: ai.chat
Auth: zantara-internal-dev-key-2025
```

### DevAI
```bash
# Production URL
https://zantara.balizero.com/devai/

# API Call
POST https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call
Key: devai.chat
Auth: zantara-internal-dev-key-2025
```

### RunPod Endpoints
```bash
# ZANTARA
https://api.runpod.ai/v2/itz2q5gmid4cyt/runsync

# DevAI
https://api.runpod.ai/v2/5g2h6nbyls47i7/runsync

# API Key
<stored in Secret Manager>
```

---

## 🔐 Security

### API Keys
- **Internal API Key**: `zantara-internal-dev-key-2025` (backend-to-backend)
- **External API Key**: `zantara-external-dev-key-2025` (public API)
- **RunPod API Key**: `<stored in Secret Manager>`
- **HuggingFace Token**: `<stored in Secret Manager>`
- **DevAI Access Token**: `devai-private-2025`

### Secrets Management
All secrets are stored in **Google Secret Manager** and injected into Cloud Run at runtime.

```bash
# Update secret
gcloud secrets versions add RUNPOD_API_KEY --data-file=-
gcloud run services update zantara-v520-nuzantara \
  --region=europe-west1 \
  --update-secrets=RUNPOD_API_KEY=RUNPOD_API_KEY:latest
```

---

## 📞 Support

### RunPod
- **Dashboard**: https://www.runpod.io/console
- **Docs**: https://docs.runpod.io
- **Support**: support@runpod.io

### HuggingFace
- **Dashboard**: https://huggingface.co/zeroai87
- **Docs**: https://huggingface.co/docs
- **Support**: feedback@huggingface.co

### NUZANTARA Team
- **GitHub**: https://github.com/Balizero1987/nuzantara
- **Email**: zero@balizero.com
- **WhatsApp**: +62 859 0436 9574

---

**Status**: ✅ All systems operational  
**Last Verified**: 14 ottobre 2025, 02:45  
**Next Review**: Settimanale (ogni lunedì)

*From Zero to Infinity ∞* 🔮💻

