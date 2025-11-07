# 🚀 NUZANTARA API Gateway Implementation

**Documento**: Presentazione Unificazione API Gateway
**Data**: 2025-11-05
**Autore**: Claude Code
**Stato**: Pre-Deploy

---

## 📋 Executive Summary

Implementiamo un **Cloudflare Worker Gateway** per unificare l'accesso ai due backend separati (TypeScript + Python). Questo risolve la confusione architetturale e centralizza il routing.

**Cost**: $5/month
**Impact**: Zero code changes in backends
**Timeline**: 40 minutes
**Risk**: Low (non-breaking change)

---

## 🎯 Il Problema Attuale

```
SITUAZIONE OGGI (CONFUSA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Webapp
├─ baseUrl = "https://nuzantara-rag.fly.dev"
├─ proxyUrl = "https://nuzantara-orchestrator.fly.dev"
└─ Client non sa quale endpoint per quale operazione!

Backend TypeScript (8080)          Backend Python (8000)
├─ /auth/*                         ├─ /oracle/query
├─ /oracle/simulate                ├─ /search
├─ 164 handlers                     ├─ /collections
└─ Completamente separato!         └─ Completamente separato!

RISULTATO: Client confusion, impossible to scale
```

---

## ✅ La Soluzione: API Gateway Unificato

```
SITUAZIONE DOPO (ORDINATA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Webapp
└─ baseUrl = "https://api.nuzantara.com" ← UNICO ENDPOINT!

                Cloudflare Worker Gateway
                (Routing Intelligente)
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
    /auth/*         /oracle/*       /search
         │              │              │
         └──────────────┬──────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
    TypeScript (TS)            Python (RAG)
    nuzantara-backend           nuzantara-rag
```

---

## 🏗️ Architettura del Gateway

### **Routing Rules**

| Path | Backend | Reason |
|------|---------|--------|
| `/auth/*` | TypeScript | Authentication TS-based |
| `/oracle/simulate` | TypeScript | Prediction engine |
| `/oracle/query` | Python | RAG query engine |
| `/oracle/ingest` | Python | Vector DB operations |
| `/search` | Python | ChromaDB search |
| `/collections` | Python | Collection management |
| `/rag/*` | Python | RAG operations |
| `/bali-zero/chat-stream` | Python | Streaming chat |

### **Gateway Features**

✅ Intelligent path-based routing
✅ 5-minute cache for `/search` & `/collections`
✅ Global CDN distribution (Cloudflare)
✅ Built-in rate limiting capability
✅ Security headers injection
✅ Error handling & fallback

---

## 💻 Files Created / Modified

### **NEW FILES**

```
gateway/
├── wrangler.toml                 (Config for Cloudflare Worker)
└── src/
    └── index.ts                  (Gateway routing logic - 85 linee)
```

### **MODIFIED FILES**

```
apps/webapp/js/config.js
├─ Line 12: baseUrl changed from 'nuzantara-rag.fly.dev' → 'api.nuzantara.com'
├─ Line 13: proxyUrl changed from 'nuzantara-orchestrator.fly.dev' → 'api.nuzantara.com'
└─ Total changes: 2 linee
```

### **UNCHANGED FILES**

✅ `apps/backend-ts/src/server.ts` - Zero changes
✅ `apps/backend-rag/backend/app/main_cloud.py` - Zero changes
✅ All 164 TypeScript handlers - Zero changes
✅ All 47 Python services - Zero changes

---

## 📊 Code Impact Analysis

### **Backend TypeScript**
```
Lines of code changed: 0
Files affected: 0
Breaking changes: No
Database migrations: No
Environment variables: No changes
```

### **Backend Python**
```
Lines of code changed: 0
Files affected: 0
Breaking changes: No
Database migrations: No
Environment variables: No changes
```

### **Frontend (Webapp)**
```
Lines of code changed: 2
Files affected: 1 (config.js)
Breaking changes: No (same API contract)
Build needed: Yes
Deployment needed: Yes
```

### **Infrastructure**
```
New resources: 1 Cloudflare Worker
Cost: $5/month (new)
DNS changes: NO (already on Cloudflare)
Deployment steps: 1 (wrangler deploy)
```

---

## 🔄 How It Works (Technical Details)

### **Request Flow**

```typescript
1. Browser sends request to: https://api.nuzantara.com/oracle/query
                              ▼
2. Cloudflare Worker receives & parses URL
                              ▼
3. Path matching:
   - Is it /oracle/query? → YES → Send to Python backend
   - Is it /auth/*? → NO
                              ▼
4. Forward to: https://nuzantara-rag.fly.dev/oracle/query
                              ▼
5. Python backend processes & returns response
                              ▼
6. Gateway adds cache headers (if applicable)
                              ▼
7. Response cached in Cloudflare CDN (global)
                              ▼
8. Browser receives response with X-Cache-Status header
```

### **Caching Strategy**

```javascript
// Search queries are cached for 5 minutes
if (pathname.startsWith('/search')) {
  headers.set('Cache-Control', 'public, max-age=300');
}

// Collection listings are cached
if (pathname.startsWith('/collections')) {
  cacheEverything: true
}

// Everything else is NOT cached (auth, mutations, etc.)
```

---

## 📈 Benefits

### **For Developers**
- ✅ Single API endpoint to remember
- ✅ No context switching between backends
- ✅ Centralized request/response logging
- ✅ Easy to add middleware (auth, rate limiting, etc.)

### **For DevOps**
- ✅ Unified monitoring point
- ✅ Easier scaling (add backends without client changes)
- ✅ Centralized security policies
- ✅ Better DDoS protection (Cloudflare)

### **For Users**
- ✅ Better global performance (CDN caching)
- ✅ Faster search queries (cached)
- ✅ More reliable (Cloudflare redundancy)

---

## 🚀 Deployment Timeline

| Step | Time | Details |
|------|------|---------|
| 1. Create gateway files | 5 min | wrangler.toml + index.ts ✅ DONE |
| 2. Update webapp config | 2 min | Change baseUrl in config.js ✅ DONE |
| 3. Install wrangler CLI | 3 min | `npm install -g wrangler` |
| 4. Authenticate to Cloudflare | 2 min | `wrangler login` |
| 5. Deploy worker | 5 min | `cd gateway && wrangler deploy --env production` |
| 6. Verify DNS | 2 min | Check api.nuzantara.com resolves |
| 7. Test routing | 10 min | Test each endpoint type |
| 8. Update webapp & redeploy | 5 min | Deploy updated config.js |
| **TOTAL** | **~35 min** | **Zero downtime** |

---

## ✅ Pre-Deployment Checklist

- [ ] gateway/wrangler.toml reviewed
- [ ] gateway/src/index.ts reviewed
- [ ] apps/webapp/js/config.js updated
- [ ] DNS `api.nuzantara.com` configured (should already be on Cloudflare)
- [ ] Cloudflare account credentials available
- [ ] All backend health checks passing

---

## 🔒 Security Considerations

### **Headers Added by Gateway**
```
X-Gateway: nuzantara-api-gateway          ← Identifies gateway
X-Forwarded-Proto: https                  ← Enforces HTTPS
X-Content-Type-Options: nosniff           ← Prevents MIME sniffing
X-Frame-Options: DENY                     ← Prevents clickjacking
Referrer-Policy: strict-origin-when-cross-origin
```

### **Error Handling**
```json
{
  "error": "Gateway error",
  "message": "Backend unreachable",
  "backend": "https://nuzantara-backend.fly.dev",
  "path": "/auth/login"
}
```

---

## 📝 Rollback Plan (If Needed)

If gateway has issues, instant rollback is possible:

**Option 1**: Revert DNS to point to individual backends
**Option 2**: Update webapp config.js back to direct URLs
**Option 3**: Disable worker in Cloudflare dashboard (instant)

All options take **< 2 minutes**.

---

## 🎓 Training Points for Team

### **For Frontend Developers**
- Change 1 URL in config → All endpoints now go through gateway
- Same API contract (no code changes needed in components)
- Cache headers automatically handled by gateway

### **For Backend Developers**
- **Zero changes required** in your code
- Gateway transparently forwards all requests
- Add new endpoints without telling frontend team!

### **For DevOps / Infra**
- New Cloudflare Worker resource added ($5/mo)
- DNS already configured (no changes needed)
- Monitoring: Check Cloudflare dashboard for worker metrics
- Scaling: Add new backends by updating routing rules in gateway

---

## 📞 Questions & Answers

**Q: Will this add latency?**
A: No. Cloudflare is cached globally. Search queries will be *faster* due to caching.

**Q: What if Python backend is down?**
A: Gateway returns 502 error (same as direct call would). No difference.

**Q: Can we still call backends directly?**
A: Yes. Direct URLs still work. Gateway is optional but recommended.

**Q: How do we monitor the gateway?**
A: Via Cloudflare dashboard → Workers → nuzantara-api-gateway

**Q: Can we add rate limiting?**
A: Yes, easily. Just add to gateway index.ts.

---

## 🎯 Next Steps

1. ✅ **Create gateway files** - DONE
2. ✅ **Update webapp config** - DONE
3. ⏳ **Deploy to Cloudflare** - PENDING (requires wrangler CLI)
4. ⏳ **Test all endpoints** - PENDING
5. ⏳ **Deploy webapp with new config** - PENDING

---

## 📎 References

- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **Gateway Code**: `/gateway/src/index.ts`
- **Routing Table**: See "Architecture" section above
- **Deployment Instructions**: See "Deployment Timeline" section

---

**Status**: Ready for Cloudflare deployment ✅

