# 🔐 Secret Manager Migration - Action Required

**Date**: 2025-10-09
**Priority**: 🔴 HIGH (Security)
**Status**: ⚠️ MANUAL ACTION REQUIRED

---

## ✅ Already Migrated (Cloud Run TS Backend)

Le seguenti API keys sono **già in Secret Manager**:
- ✅ `GOOGLE_SERVICE_ACCOUNT_KEY` → `ZANTARA_SERVICE_ACCOUNT_KEY`
- ✅ `GOOGLE_MAPS_API_KEY` → `google-maps-api-key`
- ✅ `INSTAGRAM_ACCESS_TOKEN` → `instagram-access-token`

---

## ⚠️ Remaining: RAG Backend

**Service**: `zantara-rag-backend`
**Issue**: `API_KEYS_INTERNAL` è ancora in plaintext env var

### Current State:
```bash
# RAG Backend env vars (plaintext)
ENABLE_RERANKER=true
TYPESCRIPT_BACKEND_URL=https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app
API_KEYS_INTERNAL=zantara-internal-dev-key-2025  # ⚠️ PLAINTEXT
```

---

## 🔧 Migration Steps (Manual)

### **1. Create Secret** (as zero@balizero.com, not service account):

```bash
# Switch to main account
gcloud config set account zero@balizero.com

# Create secret
echo "zantara-internal-dev-key-2025" | \
  gcloud secrets create API_KEYS_INTERNAL \
  --data-file=- \
  --project=involuted-box-469105-r0 \
  --replication-policy=automatic

# Grant access to Cloud Run service account
gcloud secrets add-iam-policy-binding API_KEYS_INTERNAL \
  --member="serviceAccount:1064094238013-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=involuted-box-469105-r0
```

### **2. Update RAG Backend Deployment**:

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-2

# Modify deployment script
# File: .github/workflows/deploy-rag-amd64.yml
# Change from:
#   --set-env-vars API_KEYS_INTERNAL=zantara-internal-dev-key-2025
# To:
#   --update-secrets API_KEYS_INTERNAL=API_KEYS_INTERNAL:latest
```

**Or deploy manually**:
```bash
gcloud run services update zantara-rag-backend \
  --region=europe-west1 \
  --update-secrets=API_KEYS_INTERNAL=API_KEYS_INTERNAL:latest \
  --project=involuted-box-469105-r0
```

---

## 📊 Migration Checklist

### **High Priority**:
- [ ] Create `API_KEYS_INTERNAL` secret in Secret Manager
- [ ] Grant IAM access to Cloud Run service account
- [ ] Update RAG backend to use secret reference
- [ ] Test RAG backend after migration
- [ ] Remove plaintext env var from workflow YAML

### **Medium Priority**:
- [ ] Audit all Cloud Run services for remaining plaintext secrets
- [ ] Document secret rotation procedure
- [ ] Set up alerts for secret access

### **Low Priority**:
- [ ] Create `API_KEYS_EXTERNAL` secret (if used)
- [ ] Migrate any other sensitive env vars
- [ ] Update deployment documentation

---

## 🎯 Expected Result

**Before**:
```yaml
env:
  - name: API_KEYS_INTERNAL
    value: "zantara-internal-dev-key-2025"  # ❌ Plaintext
```

**After**:
```yaml
env:
  - name: API_KEYS_INTERNAL
    valueFrom:
      secretKeyRef:
        name: API_KEYS_INTERNAL
        key: latest  # ✅ Secret Manager
```

---

## ⚠️ Important Notes

1. **Permissions**: Requires `secretmanager.secrets.create` role (owner/editor)
2. **Service Account**: Must grant `secretAccessor` role to Cloud Run SA
3. **Zero Downtime**: Can update service without redeployment
4. **Rollback**: Keep old env var until confirmed working

---

## 🔗 References

- Secret Manager: https://console.cloud.google.com/security/secret-manager?project=involuted-box-469105-r0
- RAG Backend: https://console.cloud.google.com/run/detail/europe-west1/zantara-rag-backend?project=involuted-box-469105-r0
- IAM Permissions: https://cloud.google.com/secret-manager/docs/access-control

---

**Action Required By**: User (requires Owner/Editor role)
**Estimated Time**: 10 minutes
**Risk**: Low (can rollback to env var)
