# 🚂 Railway Deployment Guide - Imagine.art Integration

**Date:** 2025-10-16 15:15 CET  
**Commit:** e519349  
**Status:** 🔍 **MONITORING REQUIRED**

---

## 🎯 Current Situation

### ✅ What's Done
- ✓ Code pushed to GitHub (commit e519349)
- ✓ Imagine.art handlers implemented
- ✓ TypeScript compilation working
- ✓ Local testing passed 100%

### ⚠️ Critical Discovery
Railway project **"fulfilling-creativity"** likely has **MULTIPLE services**:

1. **Main Backend Service** (Node.js/TypeScript)
   - Your Imagine.art handlers are HERE
   - Uses `Dockerfile` (main)
   - Port: 8080
   - Handlers: `ai-services.image.*`

2. **RAG Backend Service** (Python)
   - Separate service
   - Uses `Dockerfile.rag`
   - Different purpose (RAG/embeddings)

---

## 📋 Action Required: Identify Correct Service

### Step 1: Open Railway Dashboard
```bash
# Open in browser
open https://railway.app/dashboard

# Or visit manually:
https://railway.app/dashboard
```

### Step 2: Find Your Project
- Look for project: **"fulfilling-creativity"**
- Click on it to see all services

### Step 3: Identify Services
You should see something like:

```
fulfilling-creativity/
├── nuzantara-backend (Node.js) ← THIS ONE!
│   ├── Language: Node.js
│   ├── Build: npm run build
│   ├── Start: npm start
│   └── Port: 8080
│
└── rag-backend (Python)
    ├── Language: Python
    ├── Build: pip install
    └── Different purpose
```

### Step 4: Select MAIN Backend Service
- Click on the **Node.js service** (not Python RAG)
- This is where Imagine.art handlers live

---

## 🔍 How to Verify It's The Right Service

### Check 1: Recent Deployments
- Look at "Deployments" tab
- Should show recent deployment from commit `e519349`
- Should mention "feat: add Imagine.art image generation"

### Check 2: Build Logs
Click on latest deployment → "Build Logs"

**You should see:**
```bash
✓ npm run build
✓ TypeScript compilation
✓ Copying files to dist/
✓ Build completed
```

### Check 3: Service Logs
Click "View Logs"

**You should see:**
```bash
✅ Registered handler: ai-services.image.generate
✅ Registered handler: ai-services.image.upscale
✅ Registered handler: ai-services.image.test
🚀 Server starting on port 8080
✅ Server ready
```

---

## ⚙️ Add Environment Variable

### Step 1: Go to Settings
- In the correct service, click "Settings"
- Or click "Variables" in sidebar

### Step 2: Add New Variable
```
Variable Name: IMAGINEART_API_KEY
Variable Value: [paste your API key from imagine.art]
```

**Where to get API key:**
1. Visit: https://platform.imagine.art/
2. Go to Settings → API Keys
3. Copy your key

### Step 3: Redeploy (if needed)
- Railway should auto-redeploy when you add variable
- If not, click "Redeploy" button
- Wait 2-3 minutes for deployment

---

## 🧪 Test Production Endpoint

### Step 1: Get Service URL
In Railway dashboard:
- Go to your service
- Click "Domains" or "Settings"
- Copy the public URL (e.g., `https://nuzantara-backend.railway.app`)

### Step 2: Test Connection
```bash
# Set your Railway URL
RAILWAY_URL="https://your-service.railway.app"

# Test 1: Connection Test
curl -X POST "$RAILWAY_URL/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key":"ai-services.image.test"}' | jq '.'

# Expected Response:
# {
#   "ok": true,
#   "data": {
#     "available": true,
#     "provider": "Imagine.art",
#     "timestamp": "2025-10-16T..."
#   }
# }
```

### Step 3: Test Image Generation
```bash
# Test 2: Generate Image
curl -X POST "$RAILWAY_URL/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "ai-services.image.generate",
    "params": {
      "prompt": "Beautiful Bali sunset",
      "style": "realistic",
      "aspect_ratio": "16:9"
    }
  }' | jq -r '.ok, .data.image_url[:100]'

# Expected Response:
# true
# data:image/png;base64,/9j/4AAQSkZJRg...
```

---

## ⚠️ Troubleshooting

### Issue 1: "Service Not Found"
**Solution:** You might be looking at the wrong service
- Check you selected the Node.js service (not Python RAG)
- Look for service with port 8080

### Issue 2: "handler_not_found"
**Solution:** Service might not have deployed yet
- Check deployment status in Railway
- Wait for build to complete (2-3 minutes)
- Check build logs for errors

### Issue 3: "IMAGINEART_API_KEY not configured"
**Solution:** Environment variable not set
- Add `IMAGINEART_API_KEY` in service settings
- Redeploy service after adding
- Wait 2-3 minutes for deployment

### Issue 4: Build Fails
**Solution:** Check build logs
- Look for TypeScript errors
- Verify all dependencies installed
- Check if `npm run build` completes

---

## 📊 Deployment Checklist

- [ ] Opened Railway Dashboard
- [ ] Found project "fulfilling-creativity"
- [ ] Identified correct service (Node.js backend)
- [ ] Checked deployment status (should show e519349)
- [ ] Verified build logs (TypeScript compilation)
- [ ] Checked service logs (handlers registered)
- [ ] Added IMAGINEART_API_KEY variable
- [ ] Noted service URL
- [ ] Tested connection endpoint
- [ ] Tested image generation endpoint
- [ ] Confirmed working in production

---

## 🎯 Success Criteria

✅ **Deployment Successful When:**
1. Build completes without errors
2. Service shows "Active" with green dot
3. Logs show handlers registered
4. Connection test returns `"ok": true`
5. Image generation works
6. Response contains base64 image data

---

## 📞 Support

**Railway Issues:**
- Dashboard: https://railway.app/dashboard
- Docs: https://docs.railway.app/
- Support: https://help.railway.app/

**Imagine.art Issues:**
- Dashboard: https://platform.imagine.art/
- Docs: https://docs.imagine.art/

---

## 📝 Summary

**What You Need to Do:**
1. ✅ Open Railway Dashboard
2. ✅ Find "fulfilling-creativity" project
3. ✅ Select Node.js backend service (port 8080)
4. ✅ Verify deployment of commit e519349
5. ✅ Add IMAGINEART_API_KEY variable
6. ✅ Test production endpoints

**Current Status:**
- Code is pushed ✓
- Railway will auto-deploy ✓
- Need to add API key ⚠️
- Need to test production ⚠️

**Next Step:** 
Open Railway Dashboard and follow this guide!

---

**Created:** 2025-10-16 15:15 CET  
**Commit:** e519349  
**Action:** Open https://railway.app/dashboard
