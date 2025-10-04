# ✅ TODO: Deploy M13 (WhatsApp + Instagram)

**Created**: 2025-10-02 20:05 CET
**Updated**: 2025-10-03 01:17 CET
**Status**: ☁️ Cloud Build in progress (build_id: c53a80)

---

## 📋 Checklist Deployment

### **1. Build Status** ✅
- [x] TypeScript compilation complete (with warnings, OK)
- [x] Check: `dist/handlers/communication/whatsapp.js` (16.8KB) ✅
- [x] Check: `dist/handlers/communication/instagram.js` (18.1KB) ✅
- [x] Cloud Build started (bash_id: c53a80) ⏳

**Monitor progress**:
```bash
gcloud builds list --project involuted-box-469105-r0 --limit 1
```

---

### **2. Deploy to Cloud Run** ⏳

**Option A: Automatic Script**
```bash
cd ~/Desktop/NUZANTARA
./DEPLOY_NOW.sh
```

**Option B: Manual**
```bash
# Build Docker
docker build -f Dockerfile.dist -t gcr.io/involuted-box-469105-r0/zantara-v520:m13-omnichannel .

# Push
docker push gcr.io/involuted-box-469105-r0/zantara-v520:m13-omnichannel

# Deploy
gcloud run deploy zantara-v520-nuzantara \
  --image gcr.io/involuted-box-469105-r0/zantara-v520:m13-omnichannel \
  --region europe-west1 \
  --project involuted-box-469105-r0
```

---

### **3. Configure WhatsApp Webhook** ⏳

1. Go to: https://developers.facebook.com/apps/1074166541097027/webhooks
2. Find **WhatsApp** product
3. Click **"Edit"**
4. Enter:
   - **Callback URL**: `https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/webhook/whatsapp`
   - **Verify Token**: `zantara-balizero-2025-secure-token`
5. Click **"Verify and Save"**
6. **Subscribe to**:
   - ✅ `messages`
   - ✅ `messaging_postbacks`

---

### **4. Configure Instagram Webhook** ⏳

1. Same page: https://developers.facebook.com/apps/1074166541097027/webhooks
2. Find **Instagram** product (or add it)
3. Click **"Edit"** or **"Configure"**
4. Enter:
   - **Callback URL**: `https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/webhook/instagram`
   - **Verify Token**: `zantara-balizero-2025-secure-token`
5. Click **"Verify and Save"**
6. **Subscribe to**:
   - ✅ `messages`
   - ✅ `mentions` (for story mentions)
   - ✅ `messaging_postbacks` (optional)

---

### **5. Test WhatsApp** ⏳

**Send message to**: +62 823-1355-1979

**Test 1: Basic**
```
Message: "Test ZANTARA WhatsApp"
Expected: Response in 2-5s
```

**Test 2: Keyword**
```
Message: "Quanto costa PT PMA?"
Expected: Pricing info response
```

---

### **6. Test Instagram** ⏳

**Send DM to**: @balizero0

**Test 1: Basic**
```
Message: "Test ZANTARA Instagram"
Expected: Response in 2-5s
```

**Test 2: Question**
```
Message: "Info su KITAS?"
Expected: KITAS info response
```

**Test 3: Story Mention** (Optional)
```
Mention @balizero0 in your story
Expected: ZANTARA replies with service info
```

---

### **7. Verify Logs** ⏳

```bash
# Check Cloud Run logs
gcloud run services logs read zantara-v520-nuzantara \
  --region europe-west1 \
  --project involuted-box-469105-r0 \
  --limit 100 | grep -E "(WhatsApp|Instagram)"
```

**Expected logs**:
```
📞 WhatsApp Webhook Event
💬 WhatsApp message from...
📸 Instagram Webhook Event
💬 Instagram DM from...
✅ Response sent
```

---

### **8. Check Analytics** ⏳

**WhatsApp Group Analytics**:
```bash
curl -X GET https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/whatsapp/analytics/GROUP_ID \
  -H 'x-api-key: zantara-internal-dev-key-2025'
```

**Instagram User Analytics**:
```bash
curl -X GET https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/instagram/analytics/USER_ID \
  -H 'x-api-key: zantara-internal-dev-key-2025'
```

---

## 🚨 Troubleshooting

### **Webhook Verification Failed**

**Check**:
1. Backend deployed and healthy: `curl https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/health`
2. Verify token matches in code and Meta config
3. Test manually:
   ```bash
   curl "https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/webhook/instagram?hub.mode=subscribe&hub.challenge=test&hub.verify_token=zantara-balizero-2025-secure-token"
   # Expected: "test"
   ```

### **No Response from ZANTARA**

**Check**:
1. Webhook subscriptions active (messages ✅)
2. Cloud Run logs for errors
3. Wait 30s (cold start)
4. Check AI API key valid

### **Build Still Running**

**Check**:
```bash
ps aux | grep "npm run build"
```

**If stuck, cancel and retry**:
```bash
pkill -f "npm run build"
npm run build
```

---

## ✅ Success Criteria

- [x] @balizero0 connected to Meta Business
- [ ] TypeScript build complete
- [ ] Docker image built
- [ ] Cloud Run deployed
- [ ] WhatsApp webhook verified
- [ ] Instagram webhook verified
- [ ] WhatsApp test message works
- [ ] Instagram test DM works
- [ ] Logs show webhook events
- [ ] Analytics endpoints work

---

## 📊 Expected Results

**After Complete Setup**:

| Feature | Status |
|---------|--------|
| WhatsApp 1-to-1 | ✅ Active |
| WhatsApp Groups | ✅ Active |
| Instagram DM | ✅ Active |
| Instagram Stories | ✅ Active |
| Lead Scoring | ✅ Active |
| Cross-platform Memory | ✅ Active |
| Response time | <3s avg |
| Cost/month (50 users) | $4.30 |

---

## 📚 Documentation

All guides available in:
- `WHATSAPP_SETUP_COMPLETE.md`
- `INSTAGRAM_SETUP_GUIDE.md`
- `INSTAGRAM_WEBHOOK_CONFIG.md`
- `SESSION_M13_FINAL_SUMMARY.md`

---

## 🎯 When Everything Works

You'll have:
- ✅ ZANTARA responding on WhatsApp (1-to-1 + groups)
- ✅ ZANTARA responding on Instagram (DM + stories)
- ✅ Unified memory across platforms
- ✅ Lead scoring 0-100
- ✅ Sentiment analysis
- ✅ Team alerts for high-value leads
- ✅ 24/7 automated support
- ✅ 98% cost savings vs hiring

**ZANTARA OMNICHANNEL = LIVE!** 🚀

---

**Current Status**: ⏳ Awaiting TypeScript build completion
**Next**: Deploy → Configure webhooks → Test → GO LIVE!
