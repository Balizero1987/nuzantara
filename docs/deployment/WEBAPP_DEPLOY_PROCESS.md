# ZANTARA Webapp Deployment Process

**Last Updated:** 2025-10-21

## 📋 Overview

Il sito `zantara.balizero.com` è deployato tramite **GitHub Pages** con un processo automatizzato a 3 step.

## 🔄 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Development Repository                                   │
│    └─ Balizero1987/nuzantara (monorepo)                    │
│       └─ apps/webapp/                                       │
│          ├─ chat.html                                       │
│          ├─ js/sse-client.js                               │
│          └─ ...                                             │
└─────────────────────────────────────────────────────────────┘
                         ↓
                   git push main
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. GitHub Actions Workflow                                  │
│    └─ .github/workflows/sync-webapp-to-pages.yml           │
│       - Triggered: MANUALLY (workflow_dispatch)            │
│       - Copies: apps/webapp/* → zantara_webapp repo        │
│       - Generates: js/env.js with API base                  │
└─────────────────────────────────────────────────────────────┘
                         ↓
                   Auto-sync files
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. GitHub Pages Repository                                  │
│    └─ Balizero1987/zantara_webapp                          │
│       - Serves: https://zantara.balizero.com               │
│       - Build time: ~2-3 minutes                            │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Deployment Steps

### **Step 1: Make changes locally**

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-FLY/apps/webapp

# Edit files
vim chat.html
vim js/sse-client.js
```

### **Step 2: Commit and push to main**

```bash
# Stage changes
git add apps/webapp/

# Commit
git commit -m "feat: your changes description"

# Push to GitHub
git push origin main
```

### **Step 3: Trigger GitHub Actions workflow**

```bash
# Using gh CLI (recommended)
gh workflow run "Sync Webapp to GitHub Pages"

# Monitor progress
gh run list --workflow="Sync Webapp to GitHub Pages" --limit 1
```

**Alternative: Via GitHub UI**
1. Go to https://github.com/Balizero1987/nuzantara/actions
2. Select "Sync Webapp to GitHub Pages"
3. Click "Run workflow" → "Run workflow"

### **Step 4: Verify deployment**

```bash
# Wait 2-3 minutes for GitHub Pages build
sleep 180

# Check version deployed
curl -s "https://zantara.balizero.com/chat.html" | grep "VERSION CHECK"

# Test live site
open "https://zantara.balizero.com/chat.html"
```

## ⚡ Quick Deploy Command

```bash
# One-liner for complete deploy
git add apps/webapp/ && \
git commit -m "feat: webapp updates" && \
git push origin main && \
gh workflow run "Sync Webapp to GitHub Pages" && \
echo "✅ Deploy triggered! Check: https://zantara.balizero.com in 3 minutes"
```

## 🔧 Workflow Configuration

**File:** `.github/workflows/sync-webapp-to-pages.yml`

**Key Settings:**
- **Source:** `apps/webapp/*`
- **Target Repo:** `Balizero1987/zantara_webapp`
- **Target Branch:** `main`
- **Trigger:** Manual (`workflow_dispatch`)
- **Authentication:** `secrets.WEBAPP_DEPLOY_TOKEN`

**Generated Files:**
- `js/env.js` - API base URL configuration

## 📝 Important Notes

### **Cache Busting**
Browsers may cache old versions. Solutions:
1. **Hard refresh:** `Cmd + Shift + R` (Mac) / `Ctrl + Shift + R` (Windows)
2. **Incognito mode:** `Cmd + Shift + N` (Chrome)
3. **Version query params:** Already added to script imports (e.g., `?v=2025102101`)

### **Deployment Timing**
- **Workflow execution:** ~30-60 seconds
- **GitHub Pages build:** ~2-3 minutes
- **Total time:** ~3-4 minutes from push to live

### **Verification**
Always check the version log in browser console:
```javascript
// Should see:
🚀 [ZANTARA] Version: SSE-STREAMING-2025-10-21-v2
📋 [ZANTARA] Expected logs: 🌊 [SSE Stream] Starting, 📦 [SSE Chunk]
```

If you see old logs (e.g., `Sending message with user_email:`), the browser is using cached version.

## 🐛 Troubleshooting

### **Old version showing after deploy**

```bash
# 1. Verify server has new version
curl -s "https://zantara.balizero.com/chat.html" | grep "VERSION CHECK"

# If no output → deploy didn't work, re-run workflow
# If output shows new version → browser cache issue
```

### **Workflow not found**

```bash
# List all workflows
gh workflow list

# If "Sync Webapp to GitHub Pages" is missing:
# Check file exists: .github/workflows/sync-webapp-to-pages.yml
```

### **Deploy failed**

```bash
# Check workflow logs
gh run view --log

# Common issues:
# - WEBAPP_DEPLOY_TOKEN expired
# - Target repo permissions
# - Network issues
```

## 🔗 Related URLs

- **Live site:** https://zantara.balizero.com/
- **Chat interface:** https://zantara.balizero.com/chat.html
- **Source repo:** https://github.com/Balizero1987/nuzantara
- **Pages repo:** https://github.com/Balizero1987/zantara_webapp
- **Workflow:** https://github.com/Balizero1987/nuzantara/actions/workflows/sync-webapp-to-pages.yml

## ✅ Latest Deploy

**Date:** 2025-10-21
**Feature:** SSE Streaming Implementation
**Commit:** `67ed626`
**Files Changed:**
- `apps/webapp/chat.html` - SSE integration
- `apps/webapp/js/sse-client.js` - NEW EventSource client
- `apps/webapp/styles/chat.css` - Streaming cursor animation

**Verification:**
```bash
✅ Version check: SSE-STREAMING-2025-10-21-v2
✅ SSE client deployed: /js/sse-client.js
✅ Backend endpoint: GET /bali-zero/chat-stream
✅ Real-time streaming: Word-by-word like ChatGPT
```

---

**Note:** This is the authoritative source for webapp deployment. Update this document when process changes.
