# Handover: Deploy Backend

Category: `deploy-backend`

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
