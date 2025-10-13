# 🔍 Webapp Deployment Analysis - 2025-10-05

## 🚨 Problem Identified

**Issue**: Webapp updates from monorepo don't reach production
**Root Cause**: Target repository `zantara_webapp` is **ARCHIVED** (read-only)

---

## 📊 Current State

### **Live Webapp**
- **URL**: https://zantara.balizero.com/
- **Served by**: GitHub Pages (via Cloudflare CDN)
- **Source repo**: `Balizero1987/zantara_webapp` ⚠️ **ARCHIVED**
- **Last update**: 2025-10-03 05:03:11 GMT
- **Status**: ✅ Functional (Zantara talks), but **OUTDATED**

### **Deployment Stack**
```
User → Cloudflare CDN (172.67.154.177, 104.21.88.248)
     → Fastly CDN (GitHub Pages)
     → GitHub Pages (repo: zantara_webapp, ARCHIVED)
```

### **Desktop Development**
- **Location**: `/Users/antonellosiano/Desktop/NUZANTARA-2/apps/webapp/`
- **Last commit**: `a05f46a` (Phase 2 memory vector endpoints)
- **Sync to GitHub Pages**: ❌ **BLOCKED** (repo archived)

### **API Connection**
- **api-config.js** (live): ✅ Points to correct backend
  - `https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app`
- **Backend health**: ✅ v5.2.0 deployed
- **RAG backend**: ✅ Revision 00057-vfp deployed

---

## 🛠️ Solutions (3 Options)

### **Option 1: Unarchive GitHub Repo** ⭐ RECOMMENDED (Quickest)

**What**: Unarchive `Balizero1987/zantara_webapp` → resume GitHub Pages

**How**:
1. Go to: https://github.com/Balizero1987/zantara_webapp/settings
2. Scroll to "Danger Zone"
3. Click **"Unarchive this repository"**
4. Confirm action

**Then**:
```bash
# Run manual sync (works now)
bash scripts/sync-webapp-manual.sh

# Setup auto-sync
# 1. Create PAT token (see .github/workflows/WEBAPP_SYNC_SETUP.md)
# 2. Add as WEBAPP_DEPLOY_TOKEN secret
# 3. Auto-sync on every push to apps/webapp/
```

**Pros**:
- ✅ Quickest fix (5 min)
- ✅ No architecture change
- ✅ Auto-sync workflow already created
- ✅ Free (GitHub Pages)

**Cons**:
- ⚠️ Requires manual step (unarchive)
- ⚠️ Separate repo to manage

---

### **Option 2: Serve from TypeScript Backend** (Cloud Run)

**What**: Serve webapp from `/static/` endpoint on Cloud Run backend

**How**:
1. Add to `src/index.ts`:
```typescript
// Serve webapp static files
app.use(express.static(path.join(__dirname, '../static')));
app.use('/apps/webapp', express.static(path.join(__dirname, '../apps/webapp')));

// Serve index.html as default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../static/zantara-production.html'));
});
```

2. Redeploy backend:
```bash
git add src/index.ts
git commit -m "feat: serve webapp from backend"
git push origin main
# GitHub Actions auto-deploys
```

3. Update DNS:
```
zantara.balizero.com → CNAME to ghs.googlehosted.com (GitHub Pages)
                     → A to Cloud Run IP
```

**Pros**:
- ✅ Single deployment pipeline
- ✅ No separate repo
- ✅ Same backend serves API + UI
- ✅ Auto-updates on backend deploy

**Cons**:
- ⚠️ Cloud Run cost increase (static file serving)
- ⚠️ DNS change required
- ⚠️ Slightly slower (no CDN optimization)

---

### **Option 3: Cloudflare Pages** (Alternative CDN)

**What**: Deploy webapp directly to Cloudflare Pages from monorepo

**How**:
1. Create Cloudflare Pages project
2. Connect to `Balizero1987/nuzantara` repo
3. Build settings:
   - Build command: `cp -r apps/webapp/* public/`
   - Build output: `public/`
   - Root directory: `/`

4. Custom domain: `zantara.balizero.com`

**Pros**:
- ✅ Cloudflare CDN (already used)
- ✅ Auto-deploy from monorepo
- ✅ No separate repo
- ✅ Free tier available

**Cons**:
- ⚠️ New service to configure
- ⚠️ DNS migration
- ⚠️ Learning curve (Cloudflare Pages)

---

## 📋 Recommendation

**Immediate**: **Option 1** (Unarchive repo)
- Quickest path to working state
- Auto-sync workflow already created
- Free, no architecture change

**Long-term**: Consider **Option 2** (Cloud Run) when scaling
- Unified deployment
- Better for complex apps
- Single codebase control

---

## 🚀 Next Steps (Option 1 Implementation)

### **Step 1: Unarchive Repository** (1 min)
```
https://github.com/Balizero1987/zantara_webapp/settings
→ Danger Zone → Unarchive this repository
```

### **Step 2: Manual Sync** (2 min)
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-2
bash scripts/sync-webapp-manual.sh
```

### **Step 3: Setup Auto-Sync** (5 min)
1. Create PAT token:
   - https://github.com/settings/tokens?type=beta
   - Name: `ZANTARA_WEBAPP_SYNC`
   - Scope: `zantara_webapp` repo → Contents: Write

2. Add secret:
   - https://github.com/Balizero1987/nuzantara/settings/secrets/actions
   - Name: `WEBAPP_DEPLOY_TOKEN`
   - Value: [paste token]

3. Test workflow:
```bash
gh workflow run sync-webapp-to-pages.yml
```

### **Step 4: Verify** (3 min)
```bash
# Wait 3-4 minutes, then:
curl -s https://zantara.balizero.com/ | grep "Deployed:"
# Should show today's timestamp
```

**Total Time**: ~10 minutes

---

## 📊 Files Created

**Workflows**:
- `.github/workflows/sync-webapp-to-pages.yml` - Auto-sync GitHub Action
- `.github/workflows/WEBAPP_SYNC_SETUP.md` - Setup documentation

**Scripts**:
- `scripts/sync-webapp-manual.sh` - Manual sync tool

**Docs**:
- `.claude/WEBAPP_DEPLOYMENT_ANALYSIS.md` - This analysis

---

## 🔗 References

**Repos**:
- Monorepo: https://github.com/Balizero1987/nuzantara
- Webapp (archived): https://github.com/Balizero1987/zantara_webapp

**Live URLs**:
- Custom domain: https://zantara.balizero.com/
- GitHub Pages: https://balizero1987.github.io/zantara_webapp/

**Cloud Run**:
- Backend: https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app
- RAG: https://zantara-rag-backend-himaadsxua-ew.a.run.app

---

**Analysis Date**: 2025-10-05 23:35 UTC
**Status**: ✅ Complete - Solutions identified
**Next**: User decision on implementation path
