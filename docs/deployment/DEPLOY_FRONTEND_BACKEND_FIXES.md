# 🚀 DEPLOYMENT GUIDE - Frontend-Backend Coordination Fixes

## 📋 SOMMARIO MODIFICHE

**Branch**: `claude/analyze-frontend-backend-coordination-011CUu1coX6KFraX8AVtgein`

**Commits**:
- `01a3726` - fix(frontend-backend): add missing /api/auth/demo endpoint
- `f1f766b` - refactor(auth): implement unified authentication architecture
- `29574be` - fix(config): replace all hardcoded URLs with centralized API_CONFIG

**Files Changed**: 8 files
- Backend: 1 file (RAG server)
- Frontend: 7 files (auth, config, clients)

---

## 🎯 DEPLOYMENT STEPS

### **STEP 1: RAG Server (Backend) Deployment**

Il RAG server ha un nuovo endpoint `/api/auth/demo` che deve essere deployato **per primo**.

```bash
# Navigate to RAG server
cd apps/backend-rag

# Verify changes
git diff HEAD~3 backend/app/main_cloud.py | grep -A 20 "api/auth/demo"

# Deploy to Fly.io
fly deploy --app nuzantara-rag

# Verify deployment
curl -X POST https://nuzantara-rag.fly.dev/api/auth/demo \
  -H "Content-Type: application/json" \
  -d '{"userId":"test"}' | jq .
```

**Expected Response**:
```json
{
  "token": "demo_test_1234567890",
  "expiresIn": 3600,
  "userId": "test"
}
```

---

### **STEP 2: Frontend Deployment**

Il frontend webapp deve essere deployato **dopo** il RAG server.

```bash
# Navigate to webapp
cd apps/webapp

# Verify changes
git log --oneline -3
# Should show: 29574be, f1f766b, 01a3726

# If using Fly.io for static hosting
fly deploy --app nuzantara-webapp

# OR if using Nginx/Apache
# Copy files to web server
rsync -avz --exclude 'node_modules' \
  apps/webapp/ user@server:/var/www/nuzantara/

# Restart web server
ssh user@server 'sudo systemctl reload nginx'
```

---

### **STEP 3: Memory Service (Optional)**

Il Memory Service non ha modifiche backend, ma verifica la configurazione:

```bash
# Check Memory Service is running on correct port
curl http://localhost:8081/health
# OR production
curl https://nuzantara-memory.fly.dev/health
```

---

## 🧪 POST-DEPLOYMENT TESTING

### **Test 1: Demo Auth Endpoint**
```bash
# Test new endpoint
curl -X POST https://nuzantara-rag.fly.dev/api/auth/demo \
  -H "Content-Type: application/json" \
  -d '{"userId":"test_user"}' | jq .

# Expected: 200 OK with token
```

### **Test 2: Frontend Auth Flow**
```bash
# Open browser to production URL
open https://nuzantara-webapp.fly.dev/login.html

# Try demo login (should work without fallback)
# Check browser console for:
# ✅ "🔐 Demo auth: Generated token for user 'demo'"
```

### **Test 3: V3 Zantara Endpoints**
```bash
# Test unified endpoint
curl -X POST https://nuzantara-rag.fly.dev/api/v3/zantara/unified \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Test query",
    "user_id": "test",
    "stream": false
  }' | jq .

# Expected: 200 OK with success=true
```

### **Test 4: Centralized Config**
```bash
# Test localhost detection
# 1. Run locally: http://localhost:3000
# 2. Check Network tab in DevTools
# 3. Verify URLs:
#    - Backend: http://localhost:8080
#    - RAG: http://localhost:8000
#    - Memory: http://localhost:8081
```

---

## 🔧 ROLLBACK PLAN (if needed)

### **Quick Rollback**:
```bash
# Rollback RAG server
cd apps/backend-rag
git revert 01a3726
fly deploy --app nuzantara-rag

# Rollback Frontend
cd apps/webapp
git revert 29574be f1f766b
fly deploy --app nuzantara-webapp
```

### **Complete Rollback**:
```bash
# Reset to before changes
git reset --hard 52f4acf  # commit before fixes
git push --force origin main
```

---

## 📊 MONITORING

### **Check RAG Server Logs**:
```bash
# Fly.io logs
fly logs --app nuzantara-rag | grep "auth/demo"

# Look for:
# "🔐 Demo auth: Generated token for user 'xxx'"
```

### **Check Frontend Errors**:
```bash
# Browser Console (F12)
# Look for:
# - ✅ "Using cached JWT token"
# - ✅ "Authentication successful"
# - ❌ No "config.api.proxyUrl undefined" errors
```

### **Check Performance**:
```bash
# RAG Server health
curl https://nuzantara-rag.fly.dev/health | jq .

# Expected uptime > 99%
```

---

## 🚨 TROUBLESHOOTING

### **Issue 1: Auth endpoint 404**
**Symptom**: Frontend shows "Auth failed: 404"
**Solution**:
```bash
# Verify RAG server deployed correctly
fly status --app nuzantara-rag
fly deploy --app nuzantara-rag  # Re-deploy
```

### **Issue 2: CORS errors**
**Symptom**: Browser console shows CORS policy error
**Solution**:
```bash
# Check RAG server main_cloud.py lines 85-93
# CORS is configured with allow_origins=["*"]
# If issue persists, check Fly.io proxy settings
```

### **Issue 3: Localhost not working**
**Symptom**: Frontend still uses production URLs on localhost
**Solution**:
```javascript
// Verify api-config.js is loaded
console.log(window.API_CONFIG);
// Should show localhost URLs when hostname === 'localhost'

// Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

---

## 📝 DEPLOYMENT CHECKLIST

### **Pre-Deployment**:
- [x] All tests pass locally
- [x] No console errors in browser
- [x] Git status clean (no uncommitted changes)
- [x] Branch up-to-date with remote

### **During Deployment**:
- [ ] RAG server deployed first
- [ ] RAG server health check passes
- [ ] Frontend deployed second
- [ ] Frontend accessible

### **Post-Deployment**:
- [ ] Demo auth endpoint works (Test 1)
- [ ] Frontend login works (Test 2)
- [ ] V3 endpoints work (Test 3)
- [ ] Localhost config works (Test 4)
- [ ] No errors in logs
- [ ] Performance metrics normal

---

## 🎯 SUCCESS CRITERIA

✅ **RAG Server**:
- `/api/auth/demo` returns valid token
- Response time < 200ms
- No errors in logs

✅ **Frontend**:
- Login works without fallback token
- All API calls use centralized config
- Localhost detection works
- No hardcoded URLs in console/network

✅ **Integration**:
- Frontend → RAG auth flow complete
- Token stored in localStorage
- Session management working
- Memory service integration OK

---

## 📞 SUPPORT

**Issues?** Check:
1. Fly.io status: https://status.fly.io/
2. RAG Server logs: `fly logs --app nuzantara-rag`
3. Browser console for errors
4. Network tab for failed requests

**Branch**: `claude/analyze-frontend-backend-coordination-011CUu1coX6KFraX8AVtgein`
**PR URL**: https://github.com/Balizero1987/nuzantara/pull/new/claude/analyze-frontend-backend-coordination-011CUu1coX6KFraX8AVtgein

---

**Status**: ✅ Ready for Production
**Risk Level**: 🟢 Low (backward compatible, graceful fallbacks)
**Estimated Downtime**: 0 minutes (rolling deployment)
