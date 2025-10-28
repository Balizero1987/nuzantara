# 🚀 Railway R2 Credentials Setup Guide

**Date**: 2025-10-28
**Task**: Configure Cloudflare R2 credentials for ChromaDB on Railway
**Status**: ⏳ Ready to Configure

---

## 📋 Credentials Summary

### ✅ Cloudflare R2 Credentials (Confirmed)

```bash
R2_ACCESS_KEY_ID=d278bc5572014f4738192c9cb0cac1b9
R2_SECRET_ACCESS_KEY=82990a4591b1607ba7e45bf8fb65a8f12003849b873797d2555d19e1f46ee0da
R2_ENDPOINT_URL=https://a079a34fb9f45d0c6c7b6c182f3dc2cc.r2.cloudflarestorage.com
R2_BUCKET_NAME=nuzantaradb
```

### 🗄️ Railway Persistent Volume

```bash
RAILWAY_VOLUME_MOUNT_PATH=/data/chroma_db
```

---

## 🎯 Step-by-Step Setup Instructions

### Step 1: Open Railway Dashboard

1. Go to: https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9
2. Click on **"RAG BACKEND"** service
3. Go to **"Variables"** tab

### Step 2: Add Environment Variables

Click **"+ Add Variable"** and add the following **5 variables**:

#### Variable 1: R2_ACCESS_KEY_ID
```
Name: R2_ACCESS_KEY_ID
Value: d278bc5572014f4738192c9cb0cac1b9
```

#### Variable 2: R2_SECRET_ACCESS_KEY
```
Name: R2_SECRET_ACCESS_KEY
Value: 82990a4591b1607ba7e45bf8fb65a8f12003849b873797d2555d19e1f46ee0da
```

#### Variable 3: R2_ENDPOINT_URL
```
Name: R2_ENDPOINT_URL
Value: https://a079a34fb9f45d0c6c7b6c182f3dc2cc.r2.cloudflarestorage.com
```

#### Variable 4: R2_BUCKET_NAME
```
Name: R2_BUCKET_NAME
Value: nuzantaradb
```

#### Variable 5: RAILWAY_VOLUME_MOUNT_PATH
```
Name: RAILWAY_VOLUME_MOUNT_PATH
Value: /data/chroma_db
```

### Step 3: Configure Persistent Volume

1. Still in **"RAG BACKEND"** service
2. Go to **"Settings"** tab
3. Scroll to **"Volumes"** section
4. Click **"+ Add Volume"**
5. Configure:
   - **Mount Path**: `/data/chroma_db`
   - **Size**: 5 GB (recommended for ChromaDB)
6. Click **"Add"**

### Step 4: Redeploy Service

1. After adding all variables and volume
2. Railway will automatically trigger a redeploy
3. **OR** manually trigger:
   - Go to **"Deployments"** tab
   - Click **"Deploy Latest"**

### Step 5: Monitor Deployment

Watch the **Build Logs** for these success messages:

```
✅ ChromaDB found in persistent volume: /data/chroma_db
⚡ Skipping download (using cached version, XX.X MB)
```

**OR** (first deploy):

```
📥 Downloading ChromaDB from Cloudflare R2: nuzantaradb/chroma_db/
📂 Target location: /data/chroma_db
✅ ChromaDB downloaded from R2: XX files (71.2 MB)
✅ ChromaDB search service ready (from Cloudflare R2)
```

---

## ✅ Verification Steps

### 1. Check Service Health

```bash
curl https://scintillating-kindness-production-47e3.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "chromadb": true,           // ✅ Should be true now
  "memory": {
    "vector_db": true          // ✅ Should be true now
  }
}
```

### 2. Test Oracle Collections

```bash
curl https://scintillating-kindness-production-47e3.up.railway.app/api/oracle/collections
```

Expected response:
```json
{
  "success": true,
  "collections": [
    "bali_zero_pricing",
    "visa_oracle",
    "kbli_eye",
    "tax_genius",
    "legal_architect",
    "kb_indonesian",
    "kbli_comprehensive",
    "tax_updates",
    "tax_knowledge",
    "property_listings",
    "property_knowledge",
    "legal_updates"
  ],
  "total": 14
}
```

### 3. Test Oracle Query Endpoint

```bash
curl -X POST https://scintillating-kindness-production-47e3.up.railway.app/api/oracle/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is KITAS?",
    "limit": 3,
    "use_ai": false
  }'
```

Expected response:
```json
{
  "success": true,
  "query": "What is KITAS?",
  "collection_used": "visa_oracle",
  "results": [...],  // ✅ Should have results
  "total_results": 3
}
```

---

## 🐛 Troubleshooting

### Issue 1: ChromaDB Still False

**Check logs**:
```bash
railway logs --service "RAG BACKEND" --tail 100 | grep -i "chroma\|r2"
```

**Possible causes**:
- R2 credentials wrong → Check for authentication errors
- Bucket not accessible → Verify bucket name and permissions
- Volume not mounted → Check volume configuration

### Issue 2: Download Takes Too Long (3+ min)

**First deploy**: Normal (downloading 71 MB from R2)

**Subsequent deploys**: Should be fast (<30s) if persistent volume is working

If still slow:
- Check `RAILWAY_VOLUME_MOUNT_PATH` is set correctly
- Verify volume is actually mounted at `/data/chroma_db`

### Issue 3: Search Service Not Initialized

**Error**: `"detail": "Search service not initialized"`

**Solution**:
- Wait 2-3 minutes for full startup (ChromaDB warmup)
- Check if download completed successfully
- Verify all environment variables are set

---

## 📊 Expected Timeline

| Step | Duration | Notes |
|------|----------|-------|
| Add variables | 2 min | Manual copy-paste |
| Configure volume | 1 min | One-time setup |
| First deploy | 5-7 min | Downloads 71 MB from R2 |
| Subsequent deploys | 30-60 sec | Uses cached ChromaDB |
| Total (first time) | **10-15 min** | Including verification |

---

## 🎯 What Happens After Setup

### Immediate Benefits

✅ **ChromaDB Initialized**: All 14 collections available
✅ **Oracle Agents Active**: 8/10 agents operational
✅ **Query Router Working**: Smart routing between collections
✅ **Persistent Storage**: ChromaDB cached on volume (fast restarts)
✅ **Cost Optimized**: Download once, use forever

### Next Steps (After Setup)

1. **Populate Oracle KB** (if empty):
   ```bash
   curl -X POST https://scintillating-kindness-production-47e3.up.railway.app/api/oracle/populate-now
   ```

2. **Test Multi-Oracle Synthesis**:
   ```bash
   curl -X POST https://scintillating-kindness-production-47e3.up.railway.app/api/agents/synthesis/cross-oracle \
     -H "Content-Type: application/json" \
     -d '{"query": "Open PT PMA for IT consulting in Bali", "domains": ["kbli", "legal", "tax", "visa"]}'
   ```

3. **Test Dynamic Pricing**:
   ```bash
   curl https://scintillating-kindness-production-47e3.up.railway.app/pricing/all?business_type=restaurant&location=canggu
   ```

---

## 🔐 Security Notes

- ✅ Credentials stored securely in Railway (encrypted at rest)
- ✅ Environment variables not exposed in logs
- ✅ R2 bucket accessible only with these credentials
- ⚠️ Do NOT commit these credentials to GitHub
- ⚠️ Do NOT share credentials in plain text

---

## 📝 Backup Information

**R2 Bucket Structure**:
```
nuzantaradb/
└── chroma_db/
    ├── chroma.sqlite3          (1.3 MB)
    ├── [collection-uuid]/      (14 collections)
    │   ├── data_level0.bin
    │   ├── header.bin
    │   └── length.bin
    └── ...
```

**Total Size**: ~71 MB
**Collections**: 14 (visa, kbli, tax, legal, property, pricing, books, etc.)
**Documents**: 7,375+ embedded chunks

---

## 🚀 Quick Commands Reference

```bash
# Check health
curl https://scintillating-kindness-production-47e3.up.railway.app/health

# List collections
curl https://scintillating-kindness-production-47e3.up.railway.app/api/oracle/collections

# Test query
curl -X POST https://scintillating-kindness-production-47e3.up.railway.app/api/oracle/query \
  -H "Content-Type: application/json" \
  -d '{"query":"tax updates 2025","limit":3,"use_ai":false}'

# Populate Oracle KB (if empty)
curl -X POST https://scintillating-kindness-production-47e3.up.railway.app/api/oracle/populate-now

# Check routing stats
curl "https://scintillating-kindness-production-47e3.up.railway.app/api/oracle/routing/test?query=KITAS%20requirements"
```

---

## ✅ Completion Checklist

- [ ] All 5 environment variables added to Railway
- [ ] Persistent volume configured (5 GB at `/data/chroma_db`)
- [ ] Service redeployed successfully
- [ ] Health check shows `"chromadb": true`
- [ ] `/api/oracle/collections` returns 14 collections
- [ ] Oracle query endpoint working
- [ ] Response time < 2s (after warmup)
- [ ] Agents status endpoint shows 8/10 operational

---

**When all checked**: ✅ **ChromaDB + Oracle Agents FULLY OPERATIONAL!** 🎉

**Estimated completion time**: 10-15 minutes (first deploy) or 3-5 minutes (if already deployed before)
