# Handover: Deploy Backend

Category: `deploy-backend`

---

## 2025-10-06 22:10 (Tool Use Activation - COMPLETE) [sonnet-4.5_m5]

**Deployed**:
- Image: `gcr.io/involuted-box-469105-r0/zantara-v520-nuzantara:ed34c62`
- Revision: `zantara-v520-nuzantara-00070-xxx`
- Version: v5.5.0-tool-use-active
- Status: ✅ **TOOL USE ACTIVE IN PRODUCTION**

**Changes**:
- Fixed JSON schema format for Anthropic (draft 2020-12 compliance)
- File: `src/handlers/system/handlers-introspection.ts`
  - Removed `required` field from property objects
  - Keep only `type` and `description` in properties
  - Generate `required` array separately at schema level
- Result: 41 handlers available for AI tool execution
- Tests: ✅ team_list, ✅ bali_zero_pricing

**Build & Deploy**:
- GitHub Actions workflow: deploy-backend.yml
- Run ID: 18292398321
- Duration: 4m
- Commit: `ed34c62`

**Tool Use Capabilities** (41 handlers):
- Google Workspace: gmail.*, drive.*, calendar.*
- Memory: memory.save, memory.retrieve, memory.search.*
- AI: rag.query, bali.zero.chat
- Identity: identity.resolve, onboarding.start
- Bali Zero: team.list, bali.zero.pricing, kbli.lookup
- Communication: whatsapp.send, slack.notify, discord.notify, instagram.send

**Health Check**:
```bash
# Verify handlers
curl -X POST https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key": "system.handlers.list"}' | jq '.data.total'
# Expected: 41

# Verify tool definitions
curl -X POST https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key": "system.handlers.tools"}' | jq '.data.tools | length'
# Expected: 41
```

**Related**:
→ Full session: [2025-10-06_sonnet-4.5_m5.md](../diaries/2025-10-06_sonnet-4.5_m5.md)
→ Previous issues: TypeScript build errors (fixed), JSON schema invalid (fixed)

---

## 2025-10-02 00:20 (TypeScript Backend - Bridge Fix) [sonnet-4.5_m2]

**Deployed**:
- Image: `gcr.io/involuted-box-469105-r0/zantara-v520:bridge-fix-20251001`
- Revision: `zantara-v520-nuzantara-00012-5sk`
- Status: ✅ Serving 100% traffic

**Changes**:
- Disabled legacy bridge.js loading in `bridgeProxy.ts`
- All handlers now use TypeScript implementations only
- Fixed MODULE_NOT_FOUND error

**Build & Deploy Commands**:
```bash
# Build TypeScript
npm run build

# Build Docker image
docker build --platform linux/amd64 \
  -t gcr.io/involuted-box-469105-r0/zantara-v520:bridge-fix-20251001 \
  -f Dockerfile.dist .

# Push to GCR
docker push gcr.io/involuted-box-469105-r0/zantara-v520:bridge-fix-20251001

# Deploy to Cloud Run
gcloud run services update zantara-v520-nuzantara \
  --image=gcr.io/involuted-box-469105-r0/zantara-v520:bridge-fix-20251001 \
  --region=europe-west1 \
  --project=involuted-box-469105-r0
```

**Health Check**:
```bash
curl -s https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/health | jq .
```

**Related**:
→ Full session: [.claude/diaries/2025-10-01_sonnet-4.5_m2.md](#fix-applied-bridgejs-error-resolved)

---
