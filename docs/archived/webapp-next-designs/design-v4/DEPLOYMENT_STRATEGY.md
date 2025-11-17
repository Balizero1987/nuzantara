# 🚀 ZANTARA v4 - Parallel Deployment Strategy

**Goal**: Deploy new design WITHOUT touching current production

---

## 📊 Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   CLOUDFLARE DNS                        │
└──────────────────┬──────────────────┬───────────────────┘
                   │                  │
         ┌─────────▼────────┐  ┌─────▼──────────┐
         │  PRODUCTION      │  │  BETA/V4       │
         │  (CURRENT)       │  │  (NEW)         │
         └─────────┬────────┘  └─────┬──────────┘
                   │                  │
         ┌─────────▼────────┐  ┌─────▼──────────┐
         │ Cloudflare Pages │  │ Cloudflare Pages│
         │ Project: zantara │  │ Project: zantara-v4│
         └─────────┬────────┘  └─────┬──────────┘
                   │                  │
                   ▼                  ▼
         zantara.balizero.com   zantara-v4.balizero.com
         (unchanged)            (new design)
```

---

## 🌐 Domain Strategy

### Production (CURRENT) - NON TOCCARE
```
Domain: zantara.balizero.com
Source: apps/webapp (current codebase)
Cloudflare Project: zantara (existing)
Status: PRODUCTION
Version: v3.x (current)
Users: ALL current users
```

### Beta/Testing (NEW) - Parallel Deploy
```
Domain: zantara-v4.balizero.com (or beta.zantara.balizero.com)
Source: apps/webapp-next/design-v4
Cloudflare Project: zantara-v4 (new project)
Status: BETA TESTING
Version: v4.0 (new design)
Users: Beta testers / internal team
```

---

## 📋 Deployment Steps (When Ready)

### Step 1: Local Development Complete
```bash
cd apps/webapp-next/design-v4

# Test everything locally
./dev-server.sh
# Test at http://localhost:8002

# Checklist:
# ✅ Login works
# ✅ Chat works
# ✅ API integration works
# ✅ SSE streaming works
# ✅ Mobile responsive
# ✅ All browsers tested
```

### Step 2: Create New Cloudflare Pages Project

**Via Cloudflare Dashboard**:

1. Login to Cloudflare
2. Go to Pages
3. Create new project: `zantara-v4`
4. Connect to GitHub repo
5. Build settings:
   - Framework preset: None
   - Build command: (leave empty - no build needed)
   - Build output: `/apps/webapp-next/design-v4`
   - Root directory: `/apps/webapp-next/design-v4`

### Step 3: Configure Custom Domain

**Add subdomain to existing site**:

```
DNS Records (Cloudflare):
Type: CNAME
Name: zantara-v4
Target: zantara-v4.pages.dev
Proxy: Yes (orange cloud)
```

Result: `https://zantara-v4.balizero.com`

### Step 4: Environment Variables (Cloudflare Pages)

```
API_BASE_URL=https://nuzantara-backend.fly.dev
RAG_URL=https://nuzantara-rag.fly.dev
ENABLE_ANALYTICS=false
DEBUG_MODE=false
```

### Step 5: Deploy

```bash
# Automatic deployment via GitHub push
git add apps/webapp-next/design-v4
git commit -m "feat: Deploy ZANTARA v4 beta to zantara-v4.balizero.com"
git push origin main

# Cloudflare Pages auto-deploys
```

### Step 6: Verify Deployment

```bash
# Test beta site
curl https://zantara-v4.balizero.com/health

# Test login
curl -X POST https://zantara-v4.balizero.com/api/... (via proxy or direct backend)

# Verify current production unchanged
curl https://zantara.balizero.com/
```

---

## 🧪 Testing Strategy

### Phase 1: Internal Testing (Week 4)
**Testers**: Zero, Zainal, Ruslana, Amanda, Anton
**Domain**: zantara-v4.balizero.com
**Duration**: 1 week
**Focus**:
- Login flow
- API integration
- SSE streaming
- Mobile responsiveness
- Cross-browser compatibility

### Phase 2: Beta Testing (Week 5-6)
**Testers**: Selected team members + friendly clients
**Domain**: zantara-v4.balizero.com
**Duration**: 2 weeks
**Focus**:
- Real-world usage
- Performance
- Bug identification
- Feedback collection

### Phase 3: Gradual Migration (Week 7)
**Strategy**: Traffic splitting
**Domains**: Both running parallel
**Method**:
```javascript
// Cloudflare Workers - Traffic split
if (Math.random() < 0.2) { // 20% traffic
  return fetch('https://zantara-v4.balizero.com' + request.url)
} else { // 80% traffic
  return fetch('https://zantara.balizero.com' + request.url)
}
```

### Phase 4: Full Migration (Week 8)
**Action**: Switch primary domain
**Method**:
1. Point `zantara.balizero.com` to new v4 codebase
2. Keep `zantara-v3.balizero.com` as rollback option
3. Monitor for 48h
4. If stable: decommission v3

---

## 🔄 Rollback Plan

### If Issues Detected in v4

**Immediate** (< 5 min):
```bash
# Cloudflare Dashboard
# Go to zantara-v4 project
# Rollback to previous deployment
# OR disable custom domain temporarily
```

**Quick** (< 30 min):
```bash
# Revert git commit
git revert HEAD
git push origin main

# Cloudflare auto-redeploys previous version
```

### If Major Issues During Migration

**Option A**: DNS switch back
```
# Cloudflare DNS
# Change zantara.balizero.com CNAME back to old target
```

**Option B**: Code rollback
```bash
# Deploy v3 codebase to zantara-v4 temporarily
# Investigate issues
# Redeploy v4 when fixed
```

---

## 📊 Monitoring During Parallel Deploy

### Metrics to Track

**Production (v3)**:
- Uptime: Should remain 100%
- Traffic: Should gradually decrease as v4 tested
- Errors: Should remain at baseline

**Beta (v4)**:
- Initial load time
- API response times
- Error rates
- User engagement
- Feature usage

### Alerts Setup

**Cloudflare Analytics**:
- Error rate > 5% → Alert
- Response time > 3s → Alert
- Availability < 99% → Alert

**Backend Monitoring**:
```bash
# Watch backend logs for v4 traffic
fly logs -a nuzantara-backend | grep "v4"
```

---

## 🔐 Security Considerations

### Same Backend, Different Frontends

**Current Setup**:
```
Frontend v3 (zantara.balizero.com)     ┐
                                        ├→ Backend (nuzantara-backend.fly.dev)
Frontend v4 (zantara-v4.balizero.com)  ┘
```

**CORS Configuration** (backend already handles):
```javascript
// apps/backend-ts/src/middleware/cors.middleware.ts
const allowedOrigins = [
  'https://zantara.balizero.com',      // ✅ Current
  'https://zantara-v4.balizero.com',   // ✅ Add this for v4
  'http://localhost:8002'              // ✅ Local dev
]
```

**Action Required**: Add v4 domain to CORS whitelist when deploying

---

## 💰 Cost Analysis

### Current Costs (Production)
- Cloudflare Pages: FREE (1 project)
- Bandwidth: FREE (unlimited on Free plan)
- Backend: Fly.io costs (unchanged)

### Additional Costs (Parallel Deploy)
- Cloudflare Pages: FREE (2nd project still free)
- Bandwidth: FREE (parallel site)
- Custom domain: FREE (using existing domain)
- Total additional cost: **$0/month**

### When Migrated Fully
- Decommission v3 project
- Keep v4 only
- Same cost as before: **$0/month**

---

## 📅 Timeline Summary

| Week | Phase | Activity | Domain |
|------|-------|----------|--------|
| 1-3 | Development | Local coding & testing | localhost:8002 |
| 4 | Internal Beta | Deploy to beta domain | zantara-v4.balizero.com |
| 5-6 | Beta Testing | Team + select users | zantara-v4.balizero.com |
| 7 | Gradual Migration | Traffic split 20/80 | Both domains |
| 8 | Full Migration | Switch primary domain | zantara.balizero.com (v4) |
| 9+ | Cleanup | Decommission v3 | v4 only |

---

## ✅ Checklist Before Parallel Deploy

### Code Ready
- [ ] All features implemented
- [ ] Tested locally extensively
- [ ] No console errors
- [ ] API integration working
- [ ] SSE streaming functional
- [ ] Mobile responsive verified
- [ ] Cross-browser tested

### Backend Ready
- [ ] CORS updated for v4 domain
- [ ] API endpoints verified
- [ ] Rate limits configured
- [ ] Health checks passing
- [ ] Monitoring enabled

### Deployment Ready
- [ ] Cloudflare project created
- [ ] Custom domain configured
- [ ] Environment variables set
- [ ] Git repository synced
- [ ] Rollback plan documented

### Team Ready
- [ ] Team informed of beta
- [ ] Beta testers selected
- [ ] Feedback channels setup
- [ ] Support plan ready
- [ ] Migration timeline communicated

---

## 🎯 Success Criteria

### For Parallel Deploy
- ✅ V4 deploys successfully to zantara-v4.balizero.com
- ✅ V3 remains untouched at zantara.balizero.com
- ✅ Both sites functional simultaneously
- ✅ No impact to current users
- ✅ Beta testers can access v4

### For Full Migration
- ✅ V4 performance >= V3
- ✅ All features working
- ✅ Error rate < V3 baseline
- ✅ User feedback positive
- ✅ No major bugs reported
- ✅ Team trained on new UI

---

## 📝 Communication Plan

### To Team (Before Deploy)
**Subject**: New ZANTARA v4 Beta Launch

```
Team,

We're launching a new design for ZANTARA at:
https://zantara-v4.balizero.com

IMPORTANT:
- Current site (zantara.balizero.com) unchanged
- V4 is for testing only
- Please test and provide feedback
- Report any issues immediately

Testing focus:
1. Login flow
2. Chat functionality
3. Mobile experience
4. Performance

Timeline:
- This week: Internal testing
- Next 2 weeks: Extended beta
- Week 7: Gradual migration
- Week 8: Full switch (if stable)
```

### To Users (When Migrating)
**Subject**: ZANTARA Platform Update

```
Dear Users,

We've upgraded ZANTARA with a new, improved design.

What's new:
- Modern, elegant interface
- Faster performance
- Better mobile experience
- Same powerful AI backend

Your data and sessions are preserved.

If you experience any issues, contact support.
```

---

## 🔧 Technical Notes

### No Build Process
- Pure HTML/CSS/JS
- Direct file serving
- No webpack/vite/bundler
- Instant deploys

### Git Strategy
```bash
# Keep v4 in separate directory
apps/webapp-next/design-v4/

# Production (v3) untouched
apps/webapp/

# Both in same repo, different paths
# Cloudflare deploys from specific path
```

### Future Enhancements
Once v4 stable, consider:
- Progressive Web App (PWA)
- Service Worker caching
- Offline support
- Push notifications
- Analytics integration

---

**Created**: 5 Nov 2025
**Status**: Ready for implementation
**Risk Level**: LOW (parallel deploy = safe)
**Estimated Cost**: $0 (using free tier)

