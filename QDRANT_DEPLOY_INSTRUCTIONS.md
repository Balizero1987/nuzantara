# 🚀 Qdrant Deployment - Final Step (P0.3)

**Status**: Code ready, needs Railway service creation
**Time**: 5 minutes (manual) + 10 minutes (migration)
**Cost**: +$7/month

---

## 🎯 Quick Deploy (5 clicks in Railway)

### Step 1: Create Qdrant Service (2 min)

1. Open Railway dashboard: https://railway.app
2. Select project: **NUZANTARA**
3. Click **"+ New"** button
4. Select **"Empty Service"**
5. Name it: **qdrant**
6. Root directory: **apps/qdrant-service**
7. Click **"Deploy"**

Railway auto-detects Dockerfile and builds!

---

### Step 2: Add Volume (1 min) - CRITICAL!

1. Click on **qdrant** service
2. Go to **Settings** tab
3. Scroll to **Volumes** section
4. Click **"+ Add Volume"**
5. Configure:
   ```
   Mount Path: /qdrant/storage
   Size: 10GB
   ```
6. Click **"Add"**

⚠️ **Without this, data is lost on restart!**

---

### Step 3: Get Qdrant URL (30 sec)

Railway generates URLs automatically:

- **Internal**: `qdrant.railway.internal:8080`
- **Public**: `qdrant-production-xxxx.up.railway.app`

Use internal URL for backend-rag connection.

---

### Step 4: Update backend-rag Variables (1 min)

1. Click **backend-rag** service
2. Go to **Variables** tab
3. Add new variable:
   ```
   Name:  QDRANT_URL
   Value: http://qdrant.railway.internal:8080
   ```
4. Railway redeploys backend-rag automatically

---

### Step 5: Verify Qdrant is Running (30 sec)

Check Qdrant logs in Railway:
```
Expected: "Qdrant is ready to serve requests"
```

Test endpoint (use public URL):
```bash
curl https://qdrant-production-xxxx.up.railway.app/
# Should return: {"title":"qdrant - vector search engine","version":"..."}
```

---

## ✅ When Service is Up, Run Migration

After Qdrant is deployed (steps above), tell me:

**"qdrant deployed"**

And I'll guide you through the migration:
1. Install qdrant-client in backend-rag
2. Run dry-run migration (test)
3. Real migration (10 min for 14,365 docs)
4. Verify data integrity
5. Switch backend-rag to use Qdrant

---

## 📊 Expected Results

After deployment:
- ✅ Qdrant dashboard: https://your-qdrant.railway.app/dashboard
- ✅ 14 empty collections ready for migration
- ✅ Persistent storage (Railway Volume)
- ✅ Auto-restart safe
- ✅ Production-grade vector DB

---

## 🔧 Troubleshooting

**Service won't start?**
- Check Dockerfile is found: apps/qdrant-service/Dockerfile
- Check logs for errors
- Verify port 8080 is exposed

**Volume not attaching?**
- Remove and re-add volume
- Check mount path: /qdrant/storage
- Redeploy service

**Can't connect from backend-rag?**
- Use internal URL: qdrant.railway.internal:8080
- Check both services are in same project
- Verify QDRANT_URL env var is set

---

**Ready?** Create the service in Railway (5 min), then tell me "qdrant deployed"!

⏱️ Total time: 5 min manual + 10 min migration = 15 min to eliminate SPOF!
