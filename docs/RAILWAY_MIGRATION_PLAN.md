# 🚂 RAILWAY MIGRATION PLAN - COMPLETO

**Data**: 15 Ottobre 2025
**Progetto**: NUZANTARA-2 / ZANTARA v5.2.0
**Destinazione**: Railway.app
**Timeline**: 1-2 giorni
**Complessità**: 🟢 BASSA

---

## 🎯 EXECUTIVE SUMMARY

**Cosa migriamo**:
- ✅ Backend TypeScript (zantara-v520-nuzantara)
- ✅ Backend RAG Python (zantara-rag-backend)

**Cosa NON migriamo** (restano su Google):
- ✅ Firestore (database - accesso via API)
- ✅ Google Workspace APIs (Gmail, Drive, Calendar)
- ✅ Secret Manager (opzionale - possiamo usare Railway env vars)

**Costo previsto Railway**: $10-25/mese
**Risparmio vs GCP**: $40-165/mese
**Tempo migrazione**: 4-6 ore lavoro

---

## 📊 FASI MIGRAZIONE

```
FASE 1: PREPARAZIONE          [30 min]  ← ORA
FASE 2: BACKUP & SAFETY        [1 ora]
FASE 3: RAILWAY SETUP          [1 ora]
FASE 4: DEPLOY BACKEND TS      [1 ora]
FASE 5: DEPLOY BACKEND RAG     [1 ora]
FASE 6: TESTING                [30 min]
FASE 7: CUTOVER                [30 min]
────────────────────────────────────────
TOTALE:                        5-6 ore
```

---

## 📋 FASE 1: PREPARAZIONE (30 minuti)

### ✅ 1.1 Crea Account Railway

**URL**: https://railway.app/

**Steps**:
1. Click "Login"
2. "Continue with GitHub"
3. Autorizza Railway access to repos
4. Free tier attivo: $5 credit/mese

**Result**: Account Railway pronto ✅

---

### ✅ 1.2 Inventario Servizi

**Servizi da migrare**:

#### **Service 1: Backend TypeScript**
- **Nome attuale GCP**: `zantara-v520-nuzantara`
- **Dockerfile**: `/Users/antonellosiano/Desktop/NUZANTARA-2/Dockerfile`
- **Port**: 8080 (probabilmente)
- **RAM**: 2GB attuale → 512MB Railway OK
- **CPU**: 2 vCPU → shared Railway OK

#### **Service 2: Backend RAG Python**
- **Nome attuale GCP**: `zantara-rag-backend`
- **Dockerfile**: `/Users/antonellosiano/Desktop/NUZANTARA-2/apps/backend-rag 2/backend/Dockerfile`
- **Port**: 8000 (probabilmente FastAPI)
- **RAM**: 2GB attuale → 1GB Railway OK
- **CPU**: 2 vCPU → shared Railway OK

---

### ✅ 1.3 Checklist Environment Variables

**Variables da migrare** (da GCP Secret Manager → Railway):

```env
# Firebase / Firestore
FIREBASE_PROJECT_ID=involuted-box-469105-r0
GOOGLE_SERVICE_ACCOUNT=<JSON da Secret Manager>
GOOGLE_APPLICATION_CREDENTIALS=<path o JSON inline>

# Google Workspace
GOOGLE_CLIENT_ID=<se usato>
GOOGLE_CLIENT_SECRET=<se usato>
GOOGLE_REFRESH_TOKEN=<se usato>

# API Keys
ANTHROPIC_API_KEY=<Claude API>
OPENAI_API_KEY=<se usato>
ZANTARA_API_KEY=<internal>

# Other
NODE_ENV=production
PYTHON_ENV=production
PORT=8080 (backend TS)
PORT=8000 (backend RAG)
```

**Action**: Fai lista completa env vars attuali

---

### ✅ 1.4 Verifica Dockerfiles

**Checklist**:
- [ ] Dockerfile esiste per Backend TS
- [ ] Dockerfile esiste per Backend RAG
- [ ] Port EXPOSE corretto
- [ ] Build commands OK
- [ ] No hardcoded GCP references

**Action**: Verifico i Dockerfile (prossimo step)

---

## 📋 FASE 2: BACKUP & SAFETY (1 ora)

### ✅ 2.1 Export Firestore Data (Safety Backup)

**Anche se tieni Firestore**, backup preventivo!

**Option A: Via gcloud CLI**:
```bash
# Export tutto Firestore
gcloud firestore export gs://involuted-box-469105-r0-backup/firestore-backup-$(date +%Y%m%d)

# Download locale (optional)
gsutil -m cp -r gs://involuted-box-469105-r0-backup/firestore-backup-YYYYMMDD ./firestore-backup/
```

**Option B: Via Console**:
1. Firestore Console → Export/Import
2. Seleziona collections
3. Export to Cloud Storage bucket
4. Download (optional)

**Result**: Backup sicuro prima di qualsiasi cambiamento ✅

---

### ✅ 2.2 Git Commit Pre-Migration

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-2

# Commit everything
git add .
git commit -m "pre-migration: backup before Railway migration

- Current GCP setup working
- About to migrate to Railway
- Firestore backup created
- Ready for migration

🚂 Railway migration - 2025-10-15"

git push origin claude
```

**Result**: Stato pre-migrazione salvato ✅

---

### ✅ 2.3 Documenta URLs Attuali

**GCP URLs attuali**:
```
Backend TS:  https://zantara-v520-nuzantara-XXXX-ew.a.run.app
Backend RAG: https://zantara-rag-backend-XXXX-ew.a.run.app
```

**Action**: Annota per confronto post-migrazione

---

## 📋 FASE 3: RAILWAY SETUP (1 ora)

### ✅ 3.1 Create New Project

**In Railway Dashboard**:

1. Click "New Project"
2. Nome: `zantara-production`
3. Region: `us-west1` o `eu-west` (scegli più vicino)
4. Click "Create"

**Result**: Railway project ready ✅

---

### ✅ 3.2 Connect GitHub Repo

**In Railway Project**:

1. Click "New Service"
2. "GitHub Repo"
3. Select: `NUZANTARA-2` (tuo repo)
4. Railway autorizzazione GitHub
5. Click "Add Service"

**Result**: Repo connected ✅

---

### ✅ 3.3 Configure Service 1: Backend TypeScript

**Settings**:
```
Name:         zantara-backend-ts
Root:         / (repo root)
Dockerfile:   ./Dockerfile
Build:        Auto (Railway detect)
Port:         8080
Start:        Auto (from Dockerfile)
```

**Environment Variables** (da aggiungere):
- Click "Variables" tab
- Add all env vars from checklist 1.3
- Save

**Deploy**:
- Click "Deploy"
- Railway builds + deploys
- Wait 1-2 minuti

**Result**: Backend TS deployed ✅

---

### ✅ 3.4 Configure Service 2: Backend RAG Python

**Repeat per RAG backend**:

```
Name:         zantara-backend-rag
Root:         /apps/backend-rag 2/backend
Dockerfile:   ./Dockerfile
Build:        Auto
Port:         8000
Start:        Auto
```

**Environment Variables**:
- Add same + RAG-specific vars
- Save

**Deploy**:
- Click "Deploy"
- Wait 2-3 minuti (più pesante)

**Result**: Backend RAG deployed ✅

---

### ✅ 3.5 Generate Railway URLs

**Railway auto-genera URLs**:

```
Backend TS:  https://zantara-backend-ts-production-XXXX.up.railway.app
Backend RAG: https://zantara-backend-rag-production-XXXX.up.railway.app
```

**Optional: Custom Domains**:
- Settings → Domains → "Add Custom Domain"
- Point DNS CNAME to Railway
- SSL auto (Let's Encrypt)

**Result**: URLs attivi ✅

---

## 📋 FASE 4: TESTING (30 minuti)

### ✅ 4.1 Health Check Endpoints

**Test Backend TS**:
```bash
curl https://zantara-backend-ts-production-XXXX.up.railway.app/health

# Expected:
{
  "status": "healthy",
  "version": "5.2.0",
  "uptime": 123,
  ...
}
```

**Test Backend RAG**:
```bash
curl https://zantara-backend-rag-production-XXXX.up.railway.app/health

# Expected:
{
  "status": "healthy",
  "service": "ZANTARA RAG",
  ...
}
```

**Result**: Both healthy ✅

---

### ✅ 4.2 Test Google Workspace Handlers

**Test Gmail**:
```bash
curl -X POST https://zantara-backend-ts-production-XXXX.up.railway.app/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "key": "gmail.list",
    "params": { "maxResults": 5 }
  }'
```

**Expected**: Lista email (se auth OK) ✅

---

### ✅ 4.3 Test Firestore Connection

**Test memory handler**:
```bash
curl -X POST https://zantara-backend-ts-production-XXXX.up.railway.app/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "key": "memory.retrieve",
    "params": { "userId": "test_user" }
  }'
```

**Expected**: Firestore data (se connessione OK) ✅

---

### ✅ 4.4 Test RAG Chat

**Test RAG endpoint**:
```bash
curl -X POST https://zantara-backend-rag-production-XXXX.up.railway.app/bali-zero/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is KITAS?",
    "user_id": "test"
  }'
```

**Expected**: AI response with RAG sources ✅

---

### ✅ 4.5 Check Logs

**In Railway Dashboard**:
- Click each service → "Logs" tab
- Verifica no errors
- Check startup messages

**Expected**: Clean logs, no Firebase/Firestore errors ✅

---

## 📋 FASE 5: CUTOVER (30 minuti)

### ✅ 5.1 Update Client Applications

**Se hai frontend/apps che chiamano backend**:

```javascript
// BEFORE (GCP)
const API_URL = 'https://zantara-v520-nuzantara-XXXX-ew.a.run.app';

// AFTER (Railway)
const API_URL = 'https://zantara-backend-ts-production-XXXX.up.railway.app';
```

**Update env vars / config files**

---

### ✅ 5.2 DNS Update (se custom domain)

**Se usi custom domain**:

```
BEFORE:
api.zantara.com → GCP Cloud Run

AFTER:
api.zantara.com → Railway
```

**DNS Change**:
- CNAME: api.zantara.com → XXXX.up.railway.app
- TTL: 300 (5 min for fast propagation)
- Wait 5-30 minutes

---

### ✅ 5.3 Monitor Traffic

**Railway Dashboard**:
- Metrics → Requests
- Check traffic arriving
- Verify no errors

**First 1 hour**: Monitor attentamente

---

### ✅ 5.4 Disable GCP Services (dopo 24h stabilità)

**Solo quando Railway è stabile**:

```bash
# Stop Cloud Run services (non delete, just stop)
gcloud run services update zantara-v520-nuzantara \
  --max-instances=0 \
  --region=europe-west1

gcloud run services update zantara-rag-backend \
  --max-instances=0 \
  --region=europe-west1
```

**Result**: GCP stopped, Railway active, zero downtime ✅

---

## 📋 FASE 6: CLEANUP (dopo 7 giorni)

### ✅ 6.1 Verifica Stabilità Railway (7 giorni)

**Monitor**:
- Uptime: 99%+
- Errors: <1%
- Latency: <500ms p95
- Cost: ~$10-25/mese

**If stable 7 days** → Proceed cleanup

---

### ✅ 6.2 Delete GCP Services

```bash
# Delete Cloud Run services
gcloud run services delete zantara-v520-nuzantara --region=europe-west1
gcloud run services delete zantara-rag-backend --region=europe-west1

# Delete Container Images
gcloud container images delete gcr.io/involuted-box-469105-r0/zantara-v520-patch
gcloud container images delete gcr.io/involuted-box-469105-r0/zantara-rag-backend

# Keep Secret Manager (for Firestore credentials)
# Keep Firestore (still using)
```

---

### ✅ 6.3 Remove Payment Methods

**After all GCP services deleted**:

1. GCP Console → Billing → Payment methods
2. Remove all cards
3. Close billing account (optional)

**Result**: GCP infra fully decommissioned ✅

---

## 💰 COST COMPARISON

### **Before (GCP)**:
```
Cloud Run (2 services):    $50-100/mese
Container Registry:        $5-10/mese
Secret Manager:            $0.30/mese
Cloud Build:               $0 (included)
──────────────────────────────────────
SUBTOTAL GCP:             $55-110/mese

Google Workspace:         $240-280/mese
Firestore:                $10-30/mese
──────────────────────────────────────
TOTAL:                    $305-420/mese
```

### **After (Railway)**:
```
Railway (2 services):      $10-25/mese
──────────────────────────────────────
SUBTOTAL Railway:         $10-25/mese

Google Workspace:         $240-280/mese (unchanged)
Firestore:                $10-30/mese (unchanged)
──────────────────────────────────────
TOTAL:                    $260-335/mese
```

### **SAVINGS**: $45-85/mese ($540-1,020/anno) 💰

---

## ⚠️ RISK MITIGATION

### **Backup Strategy**:
- ✅ Firestore backup before migration
- ✅ Git commit pre-migration
- ✅ Keep GCP running first 7 days (max-instances=0 after stable)
- ✅ Can rollback in <5 minutes if needed

### **Rollback Plan**:
```bash
# If Railway issues, rollback to GCP:
gcloud run services update zantara-v520-nuzantara --max-instances=3
gcloud run services update zantara-rag-backend --max-instances=3

# DNS back to GCP
# Downtime: ~5 minutes
```

---

## 📊 SUCCESS CRITERIA

### **Railway migration successful if**:
- ✅ Both services deployed and running
- ✅ Health endpoints responding
- ✅ Google Workspace handlers working
- ✅ Firestore connection working
- ✅ RAG chat responding
- ✅ Logs clean (no errors)
- ✅ Latency <500ms p95
- ✅ Cost ~$10-25/mese
- ✅ Uptime >99% after 7 days

---

## 🎯 TIMELINE

### **Day 0 (Today)**:
- ✅ Create Railway account
- ✅ Review this plan
- ✅ Backup Firestore
- ✅ Git commit

### **Day 1 (Tomorrow)**:
- ✅ Railway setup (3 hours)
- ✅ Deploy both services (2 hours)
- ✅ Testing (1 hour)

### **Day 2**:
- ✅ Monitor stability
- ✅ Fix any issues
- ✅ Cutover traffic

### **Day 3-9**:
- ✅ Monitor (7 days)
- ✅ Verify stability

### **Day 10**:
- ✅ Cleanup GCP
- ✅ Remove payment methods
- ✅ DONE! 🎉

---

## 📞 SUPPORT

### **Railway Support**:
- Discord: https://discord.gg/railway
- Docs: https://docs.railway.app
- Status: https://status.railway.app

### **If Issues**:
1. Check Railway logs first
2. Check Railway Discord (#help)
3. Rollback to GCP if critical
4. Contact me for help

---

## ✅ CHECKLIST PRE-MIGRATION

Before starting, verify:

- [ ] Railway account created
- [ ] GitHub repo accessible
- [ ] Firestore backup completed
- [ ] Git commit pre-migration done
- [ ] Environment variables listed
- [ ] Dockerfiles verified
- [ ] Current GCP URLs documented
- [ ] Rollback plan understood
- [ ] 4-6 hours available for migration

---

## 🚀 READY TO START?

**Next step**:
1. Read this entire plan
2. Ask any questions
3. When ready: "OK, let's start Phase 1"

**I'll guide you step-by-step through each phase.** 🎯

---

**Plan created**: 15 Ottobre 2025
**Estimated completion**: 17 Ottobre 2025
**Risk level**: 🟢 LOW
**Confidence**: 95%

**Let's migrate to Railway!** 🚂✨
