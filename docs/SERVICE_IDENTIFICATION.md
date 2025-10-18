# 🔍 Service Identification Guide

**Current Situation:** You found the RAG backend (Python), but Imagine.art handlers are in the Node.js backend.

---

## ⚠️ What Just Happened

You tested: `https://nuzantara-production.up.railway.app/`

**Response:**
```json
{
  "status": "healthy",
  "service": "ZANTARA RAG",  ← This is Python RAG backend!
  "version": "3.0.0-railway"
}
```

This is the **RAG Backend (Python)** - for embeddings and vector search.

**Imagine.art handlers** are in the **Node.js Backend** - different service!

---

## 🎯 How to Find the Correct Service

### In Railway Dashboard

Look at the project "fulfilling-creativity" - you should see **2+ services**:

```
fulfilling-creativity/
├── scintillating-kindness (Python RAG) ✓ Found this one
├── ??? (Node.js Backend) ← Need to find this one!
└── maybe others...
```

### Identify Node.js Backend Service

**Look for these characteristics:**

| Feature | Value |
|---------|-------|
| **Language** | Node.js / TypeScript |
| **Port** | 8080 |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` or `node dist/index.js` |
| **Recent Deploy** | Commit e519349 (today) |
| **Handlers** | ai-services.image.* |

### Check Service Logs

The **correct service** will show in logs:
```bash
✅ Registered handler: ai-services.image.generate
✅ Registered handler: ai-services.image.upscale  
✅ Registered handler: ai-services.image.test
🚀 Server starting on port 8080
```

The **wrong service** (RAG) shows:
```bash
ZANTARA RAG
ChromaDB
PostgreSQL
```

---

## 📋 Step-by-Step Instructions

### 1. Go Back to Railway Dashboard
https://railway.app/dashboard

### 2. Look at All Services
In project "fulfilling-creativity", you should see a list of services in the left sidebar.

### 3. Click on Each Service
For each service, check:
- **Settings** → Build command
- **Deployments** → Recent commits
- **Logs** → What's running

### 4. Find the Node.js One
It will have:
- ✓ npm commands (not pip)
- ✓ TypeScript compilation
- ✓ Commit e519349 in deployments
- ✓ Port 8080

### 5. Get Its URL
Once you find it:
- Go to **Settings** or **Domains**
- Copy the public URL
- It will be different from `nuzantara-production.up.railway.app`

---

## 🧪 How to Test When You Find It

```bash
# Replace with the correct Node.js backend URL
BACKEND_URL="https://correct-service.railway.app"

# Test 1: Connection test
curl -X POST "$BACKEND_URL/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key":"ai-services.image.test"}' | jq '.'

# Should return:
# {
#   "ok": true,
#   "data": {
#     "available": true,
#     "provider": "Imagine.art"
#   }
# }
```

---

## 💡 Quick Questions to Answer

1. **How many services** do you see in "fulfilling-creativity"?
2. **What are their names?**
3. **Which one shows "Node.js" or "TypeScript"?**
4. **Does any show recent deployment with commit e519349?**

---

## 🎯 Expected Outcome

You should find:
- ✅ Service name: ???
- ✅ Language: Node.js
- ✅ URL: https://???.railway.app
- ✅ Recent deploy: commit e519349
- ✅ Logs show: "Registered handler: ai-services.image.generate"

Once you find it, send me the URL and we'll test immediately! 🚀

---

**Current Status:**
- ❌ Found: RAG Backend (Python) - Not what we need
- ⚠️ Looking for: Node.js Backend - Has Imagine.art handlers
