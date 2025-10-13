# 🔧 Webapp Auto-Sync Setup Guide

## ✅ Setup Completato
Workflow creato: `.github/workflows/sync-webapp-to-pages.yml`

---

## 🔑 GitHub Secret Required

### **Step 1: Create Personal Access Token**

1. Go to: https://github.com/settings/tokens?type=beta
2. Click **"Generate new token"** → **"Fine-grained tokens"**
3. Settings:
   - **Name**: `ZANTARA_WEBAPP_SYNC`
   - **Expiration**: 1 year
   - **Repository access**: Only select repositories
     - ✅ `Balizero1987/zantara_webapp` (target repo)
   - **Permissions**:
     - Repository → Contents: **Read and write**
     - Repository → Metadata: **Read-only** (auto-selected)

4. Click **"Generate token"**
5. **Copy the token** (starts with `github_pat_...`)

### **Step 2: Add Secret to Monorepo**

1. Go to: https://github.com/Balizero1987/nuzantara/settings/secrets/actions
2. Click **"New repository secret"**
3. Settings:
   - **Name**: `WEBAPP_DEPLOY_TOKEN`
   - **Secret**: Paste token from Step 1
4. Click **"Add secret"**

---

## 🚀 How It Works

### **Automatic Trigger**
```yaml
When: Push to main branch
If changed: apps/webapp/** OR static/zantara-production.html
Then: Auto-sync to zantara_webapp repo → GitHub Pages deploy
```

### **Manual Trigger**
```bash
# Via GitHub UI
https://github.com/Balizero1987/nuzantara/actions/workflows/sync-webapp-to-pages.yml
→ Click "Run workflow" → Select "main" → Run

# Via gh CLI
gh workflow run sync-webapp-to-pages.yml
```

---

## 📊 What Gets Synced

**From monorepo** → **To GitHub Pages**:
- `apps/webapp/*` → Root of `zantara_webapp` repo
- `static/zantara-production.html` → `index.html` (entry point)
- Adds deployment timestamp in HTML comments

**Deployed to**:
- https://zantara.balizero.com/ (custom domain)
- https://balizero1987.github.io/zantara_webapp/ (GitHub Pages)

---

## ⏱️ Timeline

1. **Push to main** (apps/webapp/ change)
2. **Workflow runs** (~30 seconds)
3. **Pushes to zantara_webapp** (~10 seconds)
4. **GitHub Pages builds** (~2-3 minutes)
5. **Live on zantara.balizero.com** ✅

**Total**: ~3-4 minutes from code push to live

---

## 🔍 Verify Deployment

```bash
# Check if sync happened
gh run list --workflow=sync-webapp-to-pages.yml --limit 5

# Check live version
curl -s https://zantara.balizero.com/ | grep "Deployed:"
# Should show: <!-- Deployed: YYYY-MM-DD HH:MM:SS UTC -->

# Check api-config.js
curl -s https://zantara.balizero.com/js/api-config.js | grep -A 2 "production:"
```

---

## 🚨 Troubleshooting

### **Workflow fails with "Resource not accessible by integration"**
→ **Fix**: Create `WEBAPP_DEPLOY_TOKEN` secret (see Step 1-2 above)

### **No changes detected**
→ **Normal**: Workflow only runs if files changed

### **GitHub Pages not updating**
1. Check: https://github.com/Balizero1987/zantara_webapp/deployments
2. Verify: Settings → Pages → Source = `main` branch
3. Force rebuild: Go to repo → Settings → Pages → "Re-deploy"

---

## 📝 For Next Developer

**Workflow is AUTOMATIC** - no manual sync needed.

When you edit webapp:
1. Edit files in `apps/webapp/`
2. Commit + push to main
3. Wait 3-4 minutes
4. Check https://zantara.balizero.com/

**That's it!** ✅

---

## 🔗 Related Files

- Workflow: `.github/workflows/sync-webapp-to-pages.yml`
- Webapp source: `apps/webapp/`
- Production HTML: `static/zantara-production.html`
- Target repo: https://github.com/Balizero1987/zantara_webapp
- Live site: https://zantara.balizero.com/

---

**Created**: 2025-10-05
**Last Updated**: 2025-10-05
**Status**: ⚠️ Pending token setup
