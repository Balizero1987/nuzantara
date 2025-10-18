# Railway Environment Variables Setup

## 🚀 Setup Instructions

### Step 1: Open Railway Dashboard
Go to: https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9

### Step 2: Select Service
Click on **"scintillating-kindness"** (Python RAG Backend)

### Step 3: Go to Variables
Click **"Variables"** tab

### Step 4: Add These Variables

Copy and paste each variable below:

---

### ✅ REQUIRED - Cloudflare R2 (ChromaDB Storage)

```
R2_ACCESS_KEY_ID
[Get from Cloudflare R2 dashboard]
```

```
R2_SECRET_ACCESS_KEY
[Get from Cloudflare R2 dashboard]
```

```
R2_ENDPOINT_URL
https://[your-account-id].r2.cloudflarestorage.com
```
**⚠️ IMPORTANT**: Replace `[your-account-id]` with your Cloudflare Account ID!

```
R2_BUCKET_NAME
nuzantaradb
```

---

### ✅ REQUIRED - Anthropic Claude AI

```
ANTHROPIC_API_KEY
sk-ant-api03-[your-anthropic-api-key]
```

---

### ✅ REQUIRED - TypeScript Backend URL

```
TYPESCRIPT_BACKEND_URL
https://nuzantara-production.up.railway.app
```

---

### ⚠️ OPTIONAL - RunPod ZANTARA (If you have RunPod)

```
RUNPOD_LLAMA_ENDPOINT
https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/runsync
```

```
RUNPOD_API_KEY
YOUR_RUNPOD_API_KEY
```

```
HF_API_KEY
YOUR_HUGGINGFACE_API_KEY
```

---

### ⚠️ OPTIONAL - Internal API Key (If you have one)

```
API_KEYS_INTERNAL
YOUR_INTERNAL_KEY
```

---

### ℹ️ OPTIONAL - DevAI Endpoint

```
DEVAI_ENDPOINT
https://your-devai-endpoint.com
```

---

### ℹ️ OPTIONAL - Flags

```
ENABLE_RERANKER
false
```

```
PORT
8080
```

---

## 📝 Notes

- **DATABASE_URL** is automatically provided by Railway (PostgreSQL)
- After adding variables, Railway will automatically **redeploy**
- Deployment takes ~2-3 minutes
- Check health at: https://scintillating-kindness-production-47e3.up.railway.app/health

---

## 🔍 What Will Work After Setup

With ONLY Cloudflare R2 + Claude API:
- ✅ ChromaDB search (RAG knowledge base)
- ✅ Claude Haiku (fast & cheap for greetings)
- ✅ Claude Sonnet (premium for business queries)
- ✅ PostgreSQL memory system
- ⚠️ ZANTARA unavailable (needs RunPod)

This is enough for 95% of functionality!

---

## ✅ Verification

After deployment completes, check:

```bash
curl https://scintillating-kindness-production-47e3.up.railway.app/health | jq '.'
```

You should see:
```json
{
  "status": "healthy",
  "mode": "full",
  "available_services": ["chromadb", "claude_haiku", "claude_sonnet", "postgresql"],
  "chromadb": true,
  "ai": {
    "claude_haiku_available": true,
    "claude_sonnet_available": true,
    "has_ai": true
  }
}
```
