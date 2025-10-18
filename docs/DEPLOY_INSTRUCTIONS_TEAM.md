# 🚀 DEPLOY INSTRUCTIONS - QUADRUPLE-AI + TOOL USE

**Data**: 2025-10-14
**Implementato da**: Claude Code
**Status**: ✅ Ready for deployment

---

## 📦 COSA È STATO PREPARATO

### **1. QUADRUPLE-AI System con Tool Use**
- ✅ Claude Haiku 3.5 (greetings, 60% traffic) - **CON TOOL USE**
- ✅ Claude Sonnet 4.5 (business, 35% traffic) - **CON TOOL USE**
- ✅ LLAMA 3.1 (classification + fallback)
- ✅ DevAI Qwen 2.5 Coder (code specialist, 5% traffic)

### **2. Tool Use Integration**
- ✅ 90+ handlers accessibili via tool use
- ✅ Agentic loop pattern implementato
- ✅ Tool filtering (Haiku=LIMITED, Sonnet=FULL)
- ✅ Graceful fallback se tool executor non disponibile

### **3. Backend Updates**
- ✅ Python RAG Backend: Tool use integrato
- ✅ TypeScript Backend: Handler registry pronto
- ✅ Gateway: Capability-based routing
- ✅ SYSTEM_PROMPT: Aggiornato con tool use instructions

---

## 🎯 COME FARE IL DEPLOY

### **Step 1: Verify Environment Variables**

Prima del deploy, verificare che queste variabili siano configurate in Cloud Run:

```bash
# Required for QUADRUPLE-AI + Tool Use
ANTHROPIC_API_KEY=sk-ant-...           # Per Claude Haiku/Sonnet
RUNPOD_LLAMA_ENDPOINT=https://...      # Per LLAMA 3.1
RUNPOD_API_KEY=rpa_...                 # Per RunPod
HF_API_KEY=hf_...                      # Per Hugging Face
API_KEYS_INTERNAL=zantara-internal-... # Per handler authentication
TYPESCRIPT_BACKEND_URL=https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app

# Optional
DEVAI_ENDPOINT=https://...             # Per DevAI (se configurato)
ENABLE_RERANKER=false                  # Reranker (default: disabled)
```

**Come verificare**:
```bash
# List env vars for RAG backend
gcloud run services describe zantara-rag-backend \
  --region europe-west1 \
  --format='value(spec.template.spec.containers[0].env)'

# List env vars for TS backend
gcloud run services describe zantara-v520-nuzantara \
  --region europe-west1 \
  --format='value(spec.template.spec.containers[0].env)'
```

---

### **Step 2: Backend Deploy**

```bash
# 1. Build TypeScript Backend
cd /Users/antonellosiano/Desktop/NUZANTARA-2
npm run build

# 2. Verify build succeeded
ls -la dist/

# 3. Commit changes
git add .
git commit -m "feat: integrate QUADRUPLE-AI with tool use support

- Add Claude Haiku tool use (LIMITED, 2 iterations)
- Add Claude Sonnet tool use (FULL, 5 iterations)
- Integrate ToolExecutor in intelligent router
- Update SYSTEM_PROMPT with tool use instructions
- Add tool filtering (Haiku: fast tools, Sonnet: all tools)

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# 4. Push to trigger Cloud Run deploy
git push origin claude

# GitHub Actions will automatically:
# - Build Docker images
# - Deploy to Cloud Run (europe-west1)
# - Update both services:
#   * zantara-rag-backend (Python)
#   * zantara-v520-nuzantara (TypeScript)
```

---

### **Step 3: Re-enable CI/CD** (if disabled)

Se i workflows sono disabilitati, riabilitarli:

```bash
# Check if workflows are disabled
ls -la .github/workflows/WORKFLOWS_DISABLED

# If exists, remove it to re-enable
rm .github/workflows/WORKFLOWS_DISABLED

# Commit
git add .github/workflows/
git commit -m "chore: re-enable CI/CD workflows for deployment"
git push
```

---

### **Step 4: Monitor Deployment**

```bash
# Watch GitHub Actions
gh run list --limit 5
gh run watch

# Monitor Cloud Run logs (RAG backend)
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=zantara-rag-backend" \
  --limit 50 \
  --format json

# Monitor Cloud Run logs (TS backend)
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=zantara-v520-nuzantara" \
  --limit 50 \
  --format json
```

---

### **Step 5: Verify Deployment**

```bash
# 1. Health check
curl https://zantara-rag-backend-1064094238013.europe-west1.run.app/health

# 2. Verify tool use bridge
curl https://zantara-rag-backend-1064094238013.europe-west1.run.app/api/tools/verify

# Expected response:
# {
#   "ok": true,
#   "ts_backend_url": "https://...",
#   "tools_total": 90+,
#   "first5": ["pricing_kitas", "team_list", ...],
#   "team_list": {"count": X, "first3": [...]}
# }

# 3. Test chat with tool use
curl -X POST https://zantara-rag-backend-1064094238013.europe-west1.run.app/bali-zero/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the pricing for KITAS?",
    "user_role": "member"
  }'

# Expected response should include:
# - "ai_used": "haiku" or "sonnet"
# - "used_tools": true (if tools were called)
# - "tools_called": ["pricing_kitas"] (if tools were called)

# 4. Test Sonnet with complex query
curl -X POST https://zantara-rag-backend-1064094238013.europe-west1.run.app/bali-zero/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What KBLI code for IT consulting and who on the team can help with this?",
    "user_role": "member"
  }'

# Should route to Sonnet and potentially use multiple tools
```

---

## 🔍 TROUBLESHOOTING

### **If deployment fails:**

1. **Check GitHub Actions logs**:
```bash
gh run list --limit 1
gh run view --log
```

2. **Check Cloud Run logs**:
```bash
# Recent errors
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit 20 \
  --format json

# Startup issues
gcloud logging read "resource.type=cloud_run_revision AND textPayload=~'startup'" \
  --limit 20
```

3. **Verify environment variables**:
```bash
# Check if ANTHROPIC_API_KEY is set
gcloud run services describe zantara-rag-backend \
  --region europe-west1 \
  --format='get(spec.template.spec.containers[0].env)'
```

4. **Common issues**:
   - ❌ Missing ANTHROPIC_API_KEY → Claude Haiku/Sonnet unavailable
   - ❌ Missing API_KEYS_INTERNAL → Tool execution fails
   - ❌ TYPESCRIPT_BACKEND_URL wrong → Handler proxy fails
   - ❌ RUNPOD endpoint down → LLAMA unavailable (should fallback)

---

## 📊 EXPECTED BEHAVIOR

### **Tool Use Flow**:

1. **User sends greeting** ("Ciao")
   - → Routes to **Claude Haiku**
   - → **No tools used** (simple greeting)
   - → Response: "Ciao! Come posso aiutarti oggi? 😊"

2. **User asks for pricing** ("What is the pricing for KITAS?")
   - → Routes to **Claude Haiku** (simple business query)
   - → **Tool used**: `pricing_kitas` (if needed)
   - → Response with pricing info + contact

3. **User asks complex question** ("Explain PT PMA requirements and costs")
   - → Routes to **Claude Sonnet** (complex business)
   - → **RAG context** retrieved
   - → **Multiple tools** may be used (pricing, KBLI lookup, etc.)
   - → Detailed response with sources

4. **User asks about code** ("Review this Python function")
   - → Routes to **DevAI** (code specialist)
   - → DevAI Qwen 2.5 Coder processes request
   - → Code-specific response

---

## 📈 MONITORING POST-DEPLOY

### **Metrics to watch**:

```bash
# 1. Request latency
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_latencies"' \
  --format="table(metric.labels.service_name)"

# 2. Error rate
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_count" AND metric.label.response_code_class="5xx"'

# 3. Cost tracking
gcloud billing accounts list
gcloud billing projects describe involuted-box-469105-r0
```

### **Key metrics**:
- ✅ Latency: <500ms for Haiku, <1000ms for Sonnet
- ✅ Error rate: <1%
- ✅ Tool success rate: >95%
- ✅ Cost: $30-70/month (vs $90 all-Sonnet)

---

## 💡 ROLLBACK PLAN

If issues occur after deployment:

```bash
# 1. List recent revisions
gcloud run revisions list \
  --service=zantara-rag-backend \
  --region=europe-west1

# 2. Rollback to previous revision
gcloud run services update-traffic zantara-rag-backend \
  --region=europe-west1 \
  --to-revisions=PREVIOUS_REVISION=100

# 3. Verify rollback
curl https://zantara-rag-backend-1064094238013.europe-west1.run.app/health
```

---

## ✅ FILES MODIFIED (For Reference)

### **Python (RAG Backend)**:
```
apps/backend-rag 2/backend/
├── services/claude_haiku_service.py      [MODIFIED] +181 lines (tool use)
├── services/claude_sonnet_service.py     [MODIFIED] +196 lines (tool use)
├── services/intelligent_router.py        [MODIFIED] +89 lines (tool executor)
└── app/main_cloud.py                     [MODIFIED] +53 lines (init + prompt)
```

### **TypeScript (Gateway)**:
```
src/
├── app-gateway/app-events.ts             [UNCHANGED] Working
├── app-gateway/capability-map.ts         [UNCHANGED] Working
├── app-gateway/param-normalizer.ts       [UNCHANGED] Working
├── handlers/system/handlers-introspection.ts [UNCHANGED] Working
└── handlers/*/*.ts                       [UNCHANGED] 90 handlers ready
```

---

## 🎯 SUCCESS CRITERIA

Deployment is successful if:

1. ✅ Health check returns 200
2. ✅ `/api/tools/verify` returns 90+ tools
3. ✅ Chat endpoint responds in <2s
4. ✅ Tool use works (check `used_tools: true` in response)
5. ✅ No 5xx errors in logs
6. ✅ Cost remains <$70/month

---

## 📞 SUPPORT

**If you need help**:
- Check logs: `gcloud logging read ...`
- Review this document: `DEPLOY_INSTRUCTIONS_TEAM.md`
- Environment vars: Verify all required vars are set
- Rollback: Use previous Cloud Run revision if needed

**Contact**:
- Team lead: Zero (zero@balizero.com)
- WhatsApp: +62 859 0436 9574

---

## 🚀 READY TO DEPLOY!

**Summary**:
```bash
# 1. Verify environment variables ✅
# 2. Build backend: npm run build ✅
# 3. Commit and push: git push ✅
# 4. Monitor deployment: gh run watch ✅
# 5. Verify production: curl /health + /api/tools/verify ✅
# 6. Test chat: curl /bali-zero/chat ✅
```

**Estimated deployment time**: 5-10 minutes
**Cost impact**: +$5-15/month (still 50% cheaper than all-Sonnet)
**Risk level**: LOW (graceful fallback, backward compatible)

---

🎉 **Good luck with the deployment!**

Generated by Claude Code on 2025-10-14
