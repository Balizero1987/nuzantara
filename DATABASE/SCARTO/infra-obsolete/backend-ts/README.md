# Backend TypeScript - NUZANTARA

Backend principale in TypeScript per NUZANTARA platform.

## 🤖 AI Integration

### ZANTARA (Llama 3.1 8B)
- **Handler**: `src/handlers/ai-services/zantara-llama.ts`
- **Registry**: `src/handlers/ai-services/registry.ts`
- **Key**: `ai.chat`
- **Model**: `zeroai87/zantara-llama-3.1-8b-merged` (16GB)
- **Endpoint**: RunPod Serverless (A40 GPU)

### DevAI (Qwen 2.5 Coder 7B)
- **Handler**: `src/handlers/devai/devai-qwen.ts`
- **Registry**: `src/handlers/devai/registry.ts`
- **Keys**: `devai.chat`, `devai.analyze`, `devai.fix`, `devai.review`, `devai.explain`, `devai.generate-tests`, `devai.refactor`
- **Model**: `zeroai87/devai-qwen-2.5-coder-7b` (15.9GB)
- **Endpoint**: RunPod Serverless (RTX 80GB Pro)

### AI Communication Bridge
- **Service**: `src/services/ai-communication.ts`
- **ZANTARA Bridge**: `src/handlers/ai-services/ai-bridge.ts`
- **DevAI Bridge**: `src/handlers/devai/devai-bridge.ts`
- **Features**: Workflow orchestration, shared memory, cross-AI communication

## 📂 Structure

```
backend-ts/
├── src/
│   ├── handlers/          # RPC-style handlers
│   │   ├── ai-services/   # ZANTARA handlers
│   │   ├── devai/         # DevAI handlers
│   │   ├── bali-zero/     # Bali Zero business logic
│   │   ├── memory/        # Memory system
│   │   └── ...
│   ├── services/          # Core services
│   │   ├── logger.ts      # Winston logging
│   │   ├── ai-communication.ts  # AI bridge
│   │   └── ...
│   ├── middleware/        # Express middleware
│   ├── core/              # Core system
│   │   ├── handler-registry.ts
│   │   └── load-all-handlers.ts
│   ├── app-gateway/       # Application gateway
│   ├── index.ts           # Main entry point
│   └── router.ts          # Request router
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

## 🔑 Environment Variables

### Required
```bash
# AI Models
RUNPOD_LLAMA_ENDPOINT=https://api.runpod.ai/v2/itz2q5gmid4cyt/runsync
RUNPOD_QWEN_ENDPOINT=https://api.runpod.ai/v2/5g2h6nbyls47i7/runsync
RUNPOD_API_KEY=<stored in Secret Manager>
HF_API_KEY=<stored in Secret Manager>

# API Keys
API_KEYS_INTERNAL=zantara-internal-dev-key-2025
API_KEYS_EXTERNAL=zantara-external-dev-key-2025

# Other Services
RAG_BACKEND_URL=https://zantara-rag-backend-himaadsxua-ew.a.run.app
GOOGLE_SERVICE_ACCOUNT_KEY=<from Secret Manager>
```

## 📡 API Endpoints

### Main Endpoint
```bash
POST /call
Content-Type: application/json
X-API-Key: zantara-internal-dev-key-2025

{
  "key": "ai.chat",  # or "devai.analyze", etc.
  "params": {
    "message": "Your query here"
  }
}
```

### ZANTARA
```bash
curl -X POST https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call \
  -H "Content-Type: application/json" \
  -H "X-API-Key: zantara-internal-dev-key-2025" \
  -d '{"key":"ai.chat","params":{"message":"Hello ZANTARA"}}'
```

### DevAI
```bash
curl -X POST https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call \
  -H "Content-Type: application/json" \
  -H "X-API-Key: zantara-internal-dev-key-2025" \
  -d '{"key":"devai.analyze","params":{"code":"function test() {}"}}'
```

## 🧪 Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## 📊 Monitoring

- **Logs**: Winston structured logging
- **Health**: `GET /health`
- **Metrics**: Cloud Run metrics
- **Alerts**: See `docs/MONITORING_ALERTS_GUIDE.md`

## 🔧 Development

### Adding New Handlers
1. Create handler file in `src/handlers/<module>/`
2. Register in `src/handlers/<module>/registry.ts`
3. Import registry in `src/core/load-all-handlers.ts`
4. Test with `curl` or frontend

### AI Model Updates
1. Fine-tune model
2. Upload to HuggingFace
3. Update RunPod endpoint
4. Update environment variables
5. Redeploy backend

## 📚 Documentation

- **AI Models**: `../docs/AI_MODELS_INFO.md`
- **Architecture**: `../docs/ARCHITECTURE.md`
- **Deployment**: `../.claude/handovers/deploy-backend.md`
- **Handlers**: `../HANDLER_EXPORTS_MAP.md`

## 🐛 Troubleshooting

### AI Model Issues
```bash
# Check RunPod health
curl -X GET https://api.runpod.ai/v2/<endpoint-id>/health \
  -H "Authorization: Bearer $RUNPOD_API_KEY"

# Check Cloud Run env vars
gcloud run services describe zantara-v520-nuzantara \
  --region=europe-west1 \
  --format="value(spec.template.spec.containers[0].env)"
```

### Build Issues
```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build
```

## 📞 Support

- **GitHub**: https://github.com/Balizero1987/nuzantara
- **Email**: zero@balizero.com
- **Docs**: `../docs/`

---

**Status**: ✅ Production Ready  
**Version**: v5.2.0  
**Last Updated**: 14 ottobre 2025
