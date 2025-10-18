# 🚀 ZANTARA WebApp Deployment Guide
**Target**: zantara.balizero.com (GitHub Pages)
**Backend**: zantara-v520-production (Cloud Run Europe-West1)

---

## 📊 Current Configuration

### Frontend
- **Domain**: zantara.balizero.com
- **Platform**: GitHub Pages
- **Repo**: https://github.com/Balizero1987/zantara-webapp
- **CNAME**: ✅ Already configured

### Backend Services Available
1. **zantara-v520-production** - Main production backend
   - URL: `https://zantara-v520-production-1064094238013.europe-west1.run.app`
   - Handlers: 132 standard + 4 RAG

2. **zantara-web-proxy** - BFF/Proxy layer
   - URL: `https://zantara-web-proxy-1064094238013.europe-west1.run.app`
   - Purpose: Server-side API key handling

3. **zantara-v520-chatgpt-patch** - Development branch
   - URL: `https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app`
   - Latest: RAG integration

---

## 🎯 Deployment Strategy

### Option 1: Use Existing Proxy (Recommended) ✅
**Current setup** - Already configured in api-config.js:
```javascript
proxy: {
  production: {
    base: 'https://zantara-web-proxy-himaadsxua-ew.a.run.app/api/zantara'
  }
}
```

**Pros**:
- ✅ API keys hidden (server-side)
- ✅ CORS handled
- ✅ Already working
- ✅ No changes needed

**Cons**:
- ⚠️ Extra hop (proxy → backend)
- ⚠️ Slightly higher latency (~50-100ms)

### Option 2: Direct to Production Backend
**Update api-config.js** to point directly to production:
```javascript
production: {
  base: 'https://zantara-v520-production-1064094238013.europe-west1.run.app'
}
```

**Pros**:
- ✅ Lower latency (direct connection)
- ✅ Simpler architecture

**Cons**:
- ⚠️ Requires CORS configuration on backend
- ⚠️ API key must be handled (currently in headers)

### Option 3: Point to Latest Development (RAG Integration)
**Use the chatgpt-patch branch** with RAG:
```javascript
production: {
  base: 'https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app'
}
```

**Pros**:
- ✅ Latest features (RAG endpoints)
- ✅ All 136 handlers available

**Cons**:
- ⚠️ Development branch (less stable)

---

## 🔧 Configuration Files to Update

### 1. js/api-config.js (Main API Configuration)

**Current**:
```javascript
production: {
  base: 'https://zantara-v520-production-1064094238013.europe-west1.run.app',
  call: '/call',
  health: '/health'
}
```

**Recommended** (Keep proxy for security):
```javascript
// Keep proxy mode enabled
mode: 'proxy',
proxy: {
  production: {
    base: 'https://zantara-web-proxy-1064094238013.europe-west1.run.app/api/zantara',
    call: '/call',
    // ... rest
  }
},
// Fallback to direct if needed
production: {
  base: 'https://zantara-v520-production-1064094238013.europe-west1.run.app',
  call: '/call',
  health: '/health'
}
```

### 2. All HTML Files

**Check for hardcoded API URLs**:
- chat.html
- test-api.html
- syncra.html
- etc.

Most files use `js/api-config.js`, so one update propagates everywhere.

---

## 📋 Deployment Steps

### Step 1: Verify Current Setup
```bash
cd "/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch/zantara_webapp"

# Check git status
git status

# Check current branch
git branch

# Check remote
git remote -v
```

### Step 2: Test Backend Connection
```bash
# Test production backend
curl https://zantara-v520-production-1064094238013.europe-west1.run.app/health

# Test proxy
curl https://zantara-web-proxy-1064094238013.europe-west1.run.app/api/zantara/health

# Test latest (chatgpt-patch)
curl https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app/health
```

### Step 3: Update Configuration (if needed)

**Option A: Keep current proxy setup** (Recommended - No changes needed)
```bash
# Current config is already good
echo "✅ No changes needed - proxy already configured"
```

**Option B: Switch to direct production**
```bash
# Update js/api-config.js
# Change line 22:
# FROM: base: 'https://zantara-v520-production-1064094238013.europe-west1.run.app',
# TO: base: 'https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app',
```

**Option C: Switch to latest (RAG-enabled)**
```bash
# Update to use chatgpt-patch with RAG features
# Edit js/api-config.js production.base
```

### Step 4: Commit and Push to GitHub
```bash
cd "/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch/zantara_webapp"

# Add all files
git add .

# Commit with message
git commit -m "feat: Update webapp for zantara.balizero.com deployment

- Verified backend configuration
- Proxy mode enabled for security
- All 18 HTML pages ready
- CNAME configured for zantara.balizero.com

🚀 Ready for production deployment"

# Push to GitHub Pages
git push origin main
```

### Step 5: Verify GitHub Pages Deployment
```bash
# Check GitHub Pages status
gh repo view --web

# Or open directly
open https://github.com/Balizero1987/zantara-webapp/settings/pages
```

### Step 6: Test Live Deployment
```bash
# Wait 1-2 minutes for GitHub Pages to deploy
# Then test:
curl https://zantara.balizero.com/

# Open in browser
open https://zantara.balizero.com/chat.html
```

---

## ✅ Verification Checklist

- [ ] Backend health check passes
- [ ] Proxy health check passes (if using proxy)
- [ ] Git changes committed
- [ ] Pushed to GitHub
- [ ] GitHub Pages builds successfully
- [ ] DNS resolves to zantara.balizero.com
- [ ] HTTPS works (GitHub Pages auto-generates)
- [ ] Chat interface loads
- [ ] API calls work
- [ ] No CORS errors in console

---

## 🔍 Testing After Deployment

### Test 1: Frontend Loads
```bash
curl -I https://zantara.balizero.com/
# Expected: 200 OK
```

### Test 2: Chat Interface
```bash
open https://zantara.balizero.com/chat.html
# Should load and show ZANTARA interface
```

### Test 3: API Connection
```javascript
// In browser console (F12):
await ZANTARA_API.checkHealth()
// Expected: true
```

### Test 4: Make API Call
```javascript
// In browser console:
const result = await ZANTARA_API.call('/call', {
  key: 'contact.info',
  params: {}
});
console.log(result);
// Expected: Bali Zero contact info
```

---

## 🐛 Troubleshooting

### Issue: "API not reachable"

**Solution 1**: Check backend status
```bash
curl https://zantara-v520-production-1064094238013.europe-west1.run.app/health
```

**Solution 2**: Check CORS in browser console
```javascript
// If CORS error, switch to proxy mode in api-config.js
API_CONFIG.mode = 'proxy';
```

### Issue: "GitHub Pages not updating"

**Solution**: Force rebuild
```bash
# Make a small change
echo "<!-- Updated $(date) -->" >> index.html
git add index.html
git commit -m "chore: Force GitHub Pages rebuild"
git push origin main
```

### Issue: "CNAME removed after push"

**Solution**: Re-add CNAME file
```bash
echo "zantara.balizero.com" > CNAME
git add CNAME
git commit -m "fix: Re-add CNAME for custom domain"
git push origin main
```

### Issue: "DNS not resolving"

**Check DNS settings**:
```bash
dig zantara.balizero.com
# Should point to GitHub Pages IPs:
# 185.199.108.153
# 185.199.109.153
# 185.199.110.153
# 185.199.111.153
```

---

## 📊 Backend-Frontend Harmony

### Current Architecture (Harmonious)
```
┌─────────────────────────────────────┐
│  Frontend                           │
│  zantara.balizero.com               │
│  (GitHub Pages)                     │
└──────────────┬──────────────────────┘
               │ HTTPS
               ↓
┌─────────────────────────────────────┐
│  Proxy/BFF (Optional)               │
│  zantara-web-proxy                  │
│  • Handles API keys                 │
│  • CORS headers                     │
└──────────────┬──────────────────────┘
               │ Internal
               ↓
┌─────────────────────────────────────┐
│  Backend (Cloud Run)                │
│  zantara-v520-production            │
│  • 132 handlers                     │
│  • + 4 RAG handlers (if patched)    │
└─────────────────────────────────────┘
```

### Key Points for Harmony
1. ✅ **API Configuration**: Single source of truth (api-config.js)
2. ✅ **CORS**: Handled by proxy or backend
3. ✅ **API Keys**: Never in frontend code
4. ✅ **Health Checks**: Both proxy and backend
5. ✅ **Fallback**: Direct mode if proxy fails
6. ✅ **Telemetry**: Built-in for monitoring

---

## 🎯 Recommended Configuration (FINAL)

**Keep current setup with minor updates**:

1. ✅ **Use proxy mode** (already configured)
2. ✅ **Fallback to production backend** if proxy fails
3. ✅ **Enable telemetry** for monitoring
4. ✅ **CNAME already set** to zantara.balizero.com

**No changes needed to deploy!** Just push to GitHub:

```bash
cd "/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch/zantara_webapp"
git add .
git commit -m "feat: Production deployment to zantara.balizero.com"
git push origin main
```

**Then wait 2 minutes and open**:
```
https://zantara.balizero.com/chat.html
```

---

## 📝 Post-Deployment Checklist

- [ ] Site accessible at https://zantara.balizero.com
- [ ] HTTPS certificate valid (auto by GitHub)
- [ ] Chat interface loads
- [ ] API calls work
- [ ] No console errors
- [ ] All 18 pages accessible
- [ ] Test console works
- [ ] Dashboard loads
- [ ] Mobile responsive
- [ ] Performance good (<2s load time)

---

**Status**: ✅ **READY TO DEPLOY**
**Time Needed**: 5 minutes
**Risk**: Low (current config already working)