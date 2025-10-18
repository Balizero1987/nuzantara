# 🔑 Update IMAGINEART_API_KEY on Railway

**Status:** ✅ API Key Validated - Ready to Update  
**Validated:** 2025-10-17 09:03 CET  
**Result:** HTTP 200 - Image generated successfully (680KB JPEG)

---

## ✅ API Key Validation Results

### Direct Test with Imagine.art API
```bash
✓ HTTP Status: 200
✓ Response: JPEG image data
✓ Size: 680KB (1024x1024 pixels)
✓ Generation time: ~10 seconds
✓ API endpoint working
```

**Conclusion:** The API key is **100% VALID and WORKING!**

---

## 🔧 How to Update in Railway Dashboard

### Step 1: Open Railway Dashboard
Visit: https://railway.app/dashboard

### Step 2: Navigate to Service
1. Click on project: **fulfilling-creativity**
2. Click on service: **nuzantara** (NOT scintillating-kindness)

### Step 3: Go to Variables
- Click **"Variables"** in the left sidebar
- Or go to **"Settings"** → **"Variables"**

### Step 4: Find IMAGINEART_API_KEY
- Scroll through the list of variables
- Look for: `IMAGINEART_API_KEY`

### Step 5: Update the Value
Click on the variable and update to:
```
vk-3zVt3g8xJ7dSg6KZ3pbpPRUPDwtSAQDlJssPQrKZTp7Kp
```

**IMPORTANT:** Copy-paste to avoid typos!

### Step 6: Save
- Click **"Save"** or it saves automatically
- Railway will trigger automatic redeploy

### Step 7: Wait for Redeploy
- Deployment takes ~2-3 minutes
- Watch the "Deployments" tab for progress
- Look for "Active" status with green dot

---

## 🧪 Test After Update

Once Railway finishes redeploying, test with:

```bash
# Test 1: Connection Test
curl -X POST "https://nuzantara-production.up.railway.app/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key":"ai-services.image.test","params":{}}'
```

**Expected Response:**
```json
{
  "ok": true,
  "data": {
    "available": true,
    "provider": "Imagine.art",
    "timestamp": "2025-10-17T..."
  }
}
```

**NOT this:**
```json
{
  "ok": true,
  "data": {
    "error": "HTTP 404: Page not found"
  }
}
```

---

## 🎨 Test Image Generation

```bash
# Test 2: Generate Image
curl -X POST "https://nuzantara-production.up.railway.app/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "ai-services.image.generate",
    "params": {
      "prompt": "Beautiful Bali sunset over rice terraces",
      "style": "realistic",
      "aspect_ratio": "16:9"
    }
  }' | jq -r '.ok, (.data.image_url | length), .data.request_id'
```

**Expected Response:**
```
true
762000  (length of base64 string)
req_1234567890
```

---

## 📋 Verification Checklist

After updating the API key, verify:

- [ ] Variable updated in Railway dashboard
- [ ] Service redeployed (check "Deployments" tab)
- [ ] Service shows "Active" status
- [ ] Connection test returns `"available": true`
- [ ] Image generation works
- [ ] Response contains base64 image data
- [ ] No 404 errors from Imagine.art API

---

## ⚠️ Troubleshooting

### Issue: Still Getting 404 Error
**Solution:** 
1. Check if redeploy completed
2. Verify you updated the correct service (nuzantara, not scintillating-kindness)
3. Check for typos in the API key
4. Try manual redeploy: Click "Redeploy" button

### Issue: Variable Not Saving
**Solution:**
1. Make sure you're in the correct service
2. Try refreshing the page
3. Try editing via "Raw Editor" mode

### Issue: Service Not Redeploying
**Solution:**
1. Click "Redeploy" button manually
2. Check deployment logs for errors
3. Verify service is not in "sleeping" state

---

## 🎯 Success Criteria

✅ **Update Successful When:**
1. Variable shows new value in dashboard
2. Service redeploys without errors
3. Connection test returns `"available": true`
4. Image generation returns base64 data
5. No 404 errors in logs

---

## 📞 Need Help?

**Railway Issues:**
- Dashboard: https://railway.app/dashboard
- Docs: https://docs.railway.app/

**Imagine.art Issues:**
- Dashboard: https://platform.imagine.art/
- Tested: ✅ API key works (validated 2025-10-17 09:03)

---

## 💡 Quick Summary

**What We Know:**
- ✅ API key is valid (tested directly)
- ✅ Code is deployed correctly
- ✅ Handlers are working
- ⚠️ Railway has wrong/old API key

**What To Do:**
1. Update `IMAGINEART_API_KEY` in Railway
2. Wait for redeploy (~2-3 minutes)
3. Test endpoints
4. Enjoy working image generation! 🎉

---

**Validated Key:**
```
vk-3zVt3g8xJ7dSg6KZ3pbpPRUPDwtSAQDlJssPQrKZTp7Kp
```

**Service:** nuzantara  
**Project:** fulfilling-creativity  
**URL:** https://nuzantara-production.up.railway.app

---

**Created:** 2025-10-17 09:03 CET  
**Status:** Ready to update  
**Action:** Update variable in Railway dashboard
