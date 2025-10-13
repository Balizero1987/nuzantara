# 📸 Instagram Webhook - Configuration Steps

**Account Connected**: ✅ @balizero0 (ID: 17841403587118874)
**Access**: ✅ Messaggi permissions active

---

## 🔧 Final Step: Configure Webhook

### **Go to Meta Developer Console**

1. **Open**: https://developers.facebook.com/apps/1074166541097027/webhooks
2. **Login** if needed (same as Business Suite)

---

## 📝 Add Instagram Webhook

### **Option A: If Instagram Already Listed**

If you see **"Instagram"** in the products list:

1. Click **"Edit"** next to Instagram
2. **Callback URL**:
   ```
   https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/webhook/instagram
   ```
3. **Verify Token**:
   ```
   zantara-balizero-2025-secure-token
   ```
4. Click **"Verify and Save"**

5. **Subscribe to Webhook Fields**:
   - ✅ `messages` (REQUIRED)
   - ✅ `messaging_postbacks`
   - ✅ `messaging_seen` (optional)
   - ✅ `mentions` (optional - for story mentions)

---

### **Option B: If Instagram NOT Listed**

1. Scroll down to **"Add a Product"**
2. Find **"Instagram"** → Click **"Set Up"**
3. After setup, go to **Webhooks** tab
4. Follow Option A steps above

---

## ✅ Webhook Verification

When you click "Verify and Save", Meta will call:
```
GET https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/webhook/instagram?hub.mode=subscribe&hub.challenge=xxx&hub.verify_token=zantara-balizero-2025-secure-token
```

**Expected**:
- ✅ Status: 200 OK
- ✅ Response: (echoes challenge back)
- ✅ Meta shows: "Webhook verified ✓"

**If fails**:
- Check backend is deployed
- Check URL is correct
- Check verify token matches

---

## 🧪 Test After Webhook Setup

### **Test 1: Send DM to @balizero0**

1. Open Instagram App
2. Search: `@balizero0`
3. Send DM: **"Test ZANTARA"**
4. Wait 2-5 seconds
5. **Expected**: ZANTARA replies with welcome message

### **Test 2: Check Logs**

```bash
gcloud run services logs read zantara-v520-nuzantara \
  --region europe-west1 \
  --project involuted-box-469105-r0 \
  --limit 50
```

**Expected logs**:
```
📸 Instagram Webhook Event
💬 Instagram DM from @your_username
💾 Instagram message saved to memory
😊 Sentiment: 8/10 (positive)
🤖 ZANTARA responding: Question asked
✅ Instagram response sent
```

---

## 🚨 Troubleshooting

### **Webhook Verification Failed**

**Error**: "The URL couldn't be validated"

**Fixes**:
1. Check backend deployed: `curl https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/health`
2. Test webhook manually:
   ```bash
   curl "https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/webhook/instagram?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=zantara-balizero-2025-secure-token"
   ```
   Expected: `test123`
3. Check Cloud Run logs for errors

### **Messages Not Received**

**Error**: Send DM but no ZANTARA response

**Fixes**:
1. Check webhook subscriptions: `messages` must be ✅
2. Verify @balizero0 is connected (you already did this ✅)
3. Check permissions: Messaggi access (you have it ✅)
4. Check logs for incoming webhook events
5. Wait 30s (cold start if first message after deploy)

### **Permission Denied**

**Error**: "This endpoint requires instagram_manage_messages permission"

**Fix**:
1. Go to: https://developers.facebook.com/apps/1074166541097027/app-review/permissions
2. Enable: `instagram_manage_messages`
3. In **Development Mode** = Auto-approved ✅
4. Re-authorize @balizero0 if needed

---

## ✅ Success Indicators

**Webhook Config**:
- ✅ Callback URL verified
- ✅ Subscribe fields: messages ✅
- ✅ Status: Active

**Test DM**:
- ✅ Message sent to @balizero0
- ✅ ZANTARA response received
- ✅ Logs show webhook event
- ✅ No errors in logs

**Analytics**:
```bash
curl -X GET https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/instagram/analytics/YOUR_USER_ID \
  -H 'x-api-key: zantara-internal-dev-key-2025'
```

Should return your user profile + lead score!

---

## 🎉 When Complete

You'll have:
- ✅ @balizero0 connected to ZANTARA
- ✅ Instagram DM auto-response active
- ✅ Lead scoring operational
- ✅ Story mention handler ready
- ✅ Cross-platform memory (IG + WhatsApp)
- ✅ Analytics dashboard

**ZANTARA is LIVE on Instagram!** 📸🤖

---

**Next**: Configure webhook at https://developers.facebook.com/apps/1074166541097027/webhooks

Let me know when webhook is verified and I'll send you test commands! 🚀
