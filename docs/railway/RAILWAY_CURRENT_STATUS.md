# Railway Current Configuration

## Service: scintillating-kindness (Python RAG Backend)

### ✅ Already Configured (Railway Automatic)
```
RAILWAY_PUBLIC_DOMAIN=scintillating-kindness-production-47e3.up.railway.app
RAILWAY_PRIVATE_DOMAIN=scintillating-kindness.railway.internal
DATABASE_URL=(automatically provided by Railway PostgreSQL)
```

### ⚠️ MISSING - Need to Add Manually

You need to add these 8 variables on Railway Dashboard:

1. **R2_ACCESS_KEY_ID** = `[configured on Railway]`
2. **R2_SECRET_ACCESS_KEY** = `[configured on Railway]`
3. **R2_ENDPOINT_URL** = `https://[your-account-id].r2.cloudflarestorage.com`
4. **R2_BUCKET_NAME** = `nuzantaradb`
5. **ANTHROPIC_API_KEY** = `sk-ant-api03-[your-key]`
6. **TYPESCRIPT_BACKEND_URL** = `https://nuzantara-production.up.railway.app`
7. **ENABLE_RERANKER** = `false`
8. **PORT** = `8080`

---

## Current Deployment Status

As of now (without these env variables):
- ❌ **502 Error** - App crashes on startup
- ❌ Missing R2 credentials → can't download ChromaDB
- ❌ Missing Claude API → no AI services

After adding variables:
- ✅ App will start successfully
- ✅ ChromaDB will download from R2 (~72MB, 94 files)
- ✅ Claude Haiku + Sonnet available
- ✅ PostgreSQL memory system active
- ✅ Full RAG + AI capabilities

---

## How to Add Variables

**Dashboard URL**: https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9

1. Click "**scintillating-kindness**"
2. Go to "**Variables**" tab
3. Click "**New Variable**" for each one
4. Copy/paste name and value
5. Railway will auto-deploy after last variable

**Time**: 2 minutes to add + 3 minutes deploy = **5 minutes total**

---

## Verification Command

After deployment completes:
```bash
./check_railway_env.sh
```

Expected output:
```
✅ Backend is HEALTHY!
📊 STATUS: healthy
🔧 MODE: full
available_services: ["chromadb", "claude_haiku", "claude_sonnet", "postgresql"]
```

---

## Service Architecture

```
┌─────────────────────────────────────────────────────┐
│ Railway Project: nuzantara                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐  ┌────────────────────────┐ │
│  │ PostgreSQL       │  │ scintillating-kindness │ │
│  │ (automatic)      │◄─┤ (Python RAG Backend)   │ │
│  └──────────────────┘  └────────────────────────┘ │
│                         - ChromaDB (from R2)       │
│                         - Claude AI                │
│                         - Memory System            │
│                         - Port 8080                │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ nuzantara (TypeScript API Backend)           │  │
│  │ - API Gateway                                │  │
│  │ - Handler Proxy                              │  │
│  │ - Port 8080                                  │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

External Dependencies:
- **Cloudflare R2**: ChromaDB storage (72MB)
- **Anthropic API**: Claude Haiku + Sonnet
- **RunPod**: (optional) ZANTARA Llama 3.1
