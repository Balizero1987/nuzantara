# 🔧 Manual Fixes Required - NUZANTARA Codebase

Questi fix richiedono attenzione manuale e non possono essere automatizzati completamente.

---

## 1. CRM Endpoints - Backend Python

**File:** `apps/backend-rag/backend/app/routers/crm_clients.py`
**File:** `apps/backend-rag/backend/app/routers/crm_interactions.py`
**File:** `apps/backend-rag/backend/app/routers/crm_practices.py`

### Cambiamento richiesto:
```python
# PRIMA:
router = APIRouter(prefix="/crm/clients", tags=["crm-clients"])

# DOPO:
router = APIRouter(prefix="/api/crm/clients", tags=["crm-clients"])
```

Applicare a tutti e tre i file CRM.

**Alternativa:** Modificare il frontend per rimuovere `/api` prefix (meno raccomandato).

---

## 2. Search Endpoint - Backend Python

**File:** `apps/backend-rag/backend/app/routers/search.py`

### Cambiamento richiesto:
```python
# PRIMA:
router = APIRouter(prefix="/search", tags=["search"])

# DOPO:
router = APIRouter(prefix="/api/search", tags=["search"])
```

---

## 3. Memory Service URL Verification

**File:** `apps/webapp/js/api-config.js`

### Verifica richiesta:
```bash
# Test se il servizio esiste:
curl -I https://nuzantara-memory.fly.dev/health
```

Se NON esiste (404 o connection refused):

```javascript
// PRIMA:
memory: {
  url: 'https://nuzantara-memory.fly.dev'
},

// DOPO:
memory: {
  url: 'https://nuzantara-rag.fly.dev'  // Usa Python backend
},
```

---

## 4. Mock Login Production Guard

**File:** `apps/backend-ts/src/server.ts`

### Trova (circa linea 477):
```typescript
const mockLoginRoutes = await import('./routes/test/mock-login.js');
app.use('/test', mockLoginRoutes.default);
logger.info('🧪 Mock login test routes loaded');
```

### Sostituisci con:
```typescript
// Load mock login only in development/test environments
if (process.env.NODE_ENV !== 'production') {
  const mockLoginRoutes = await import('./routes/test/mock-login.js');
  app.use('/test', mockLoginRoutes.default);
  logger.info('🧪 Mock login test routes loaded (DEV MODE)');
} else {
  logger.info('⚠️ Mock login disabled in production');
}
```

---

## 5. API Config - Complete Fix

**File:** `apps/webapp/js/api-config.js`

### Sezione CRM (linee 14-21):
```javascript
// PRIMA:
crm: {
  clients: '/api/crm/clients',
  clientsCreate: '/api/crm/clients',
  interactions: '/api/crm/interactions',
  practices: '/api/crm/practices',
  analytics: '/api/crm/analytics',
  sharedMemory: '/api/crm/shared-memory'
},

// DOPO (Opzione A - Se fissi il backend Python):
crm: {
  clients: '/api/crm/clients',
  clientsCreate: '/api/crm/clients',
  interactions: '/api/crm/interactions',
  practices: '/api/crm/practices',
  // analytics: '/api/crm/analytics',  // TODO: Not implemented yet
  sharedMemory: '/api/crm/shared-memory'
},

// DOPO (Opzione B - Se NON fissi il backend):
crm: {
  clients: '/crm/clients',
  clientsCreate: '/crm/clients',
  interactions: '/crm/interactions',
  practices: '/crm/practices',
  // analytics: '/api/crm/analytics',  // TODO: Not implemented yet
  sharedMemory: '/api/crm/shared-memory'
},
```

### Sezione Agents (linee 29-36):
```javascript
// PRIMA:
agents: {
  compliance: '/api/agents/compliance/alerts',
  journey: '/api/agents/journey/{journey_id}/next-steps',
  research: '/api/autonomous-agents/conversation-trainer/run',
  semanticSearch: '/api/search/',
  hybridQuery: '/api/search/',
  documentIntelligence: '/ai/creative/vision'
},

// DOPO:
agents: {
  compliance: '/api/agents/compliance/alerts',
  journey: '/api/agents/journey/{journey_id}/next-steps',
  research: '/api/autonomous-agents/conversation-trainer/run',
  semanticSearch: '/search',  // ✅ Fixed (removed /api)
  hybridQuery: '/search',     // ✅ Fixed (removed /api)
  // documentIntelligence: '/ai/creative/vision'  // ❌ Not implemented
},
```

---

## 6. Standardize Hardcoded URLs

### File: `apps/webapp/js/agents-client.js`
```javascript
// PRIMA:
apiUrl: window.API_CONFIG?.backend?.url || 'https://nuzantara-rag.fly.dev',

// DOPO:
apiUrl: window.API_CONFIG?.rag?.url || 'https://nuzantara-rag.fly.dev',
```

### File: `apps/webapp/js/system-handlers-client.js`
Rimuovi hardcoded URL e usa `API_CONFIG.backend.url`

### File: `apps/webapp/js/team-analytics-client.js`
Rimuovi hardcoded URL e usa `API_CONFIG.backend.url`

### File: `apps/webapp/js/zantara-client.js`
Verifica che usi `API_CONFIG` correttamente

---

## 7. Cleanup V3 Omega Comments

**Files to clean:**
- `apps/backend-ts/src/server.ts`
- `apps/backend-ts/src/core/load-all-handlers.ts`
- `apps/backend-ts/src/routing/router.ts`

### Rimuovi tutti i commenti tipo:
```typescript
// REMOVED: v3 Ω services (legacy - no longer used)
// REMOVED: registerV3OmegaServices() function
// REMOVED: serviceRegistry initialization (v3 legacy)
```

Sostituiscili con commenti più puliti se necessario, oppure eliminali completamente.

---

## 8. Create Missing Endpoints (Optional)

Se vuoi implementare gli endpoint mancanti invece di rimuoverli:

### A. `/api/crm/analytics` (Backend Python)
Crea nuovo router: `apps/backend-rag/backend/app/routers/crm_analytics.py`

### B. `/ai/creative/vision` (Backend Python o TypeScript)
Implementa endpoint per document intelligence

### C. Compliance Alerts (Backend TypeScript)
Rimuovi placeholder e implementa logica reale in:
`apps/backend-ts/src/server.ts` (linee 248-260)

---

## 9. Documentation Updates

### Crea file: `ARCHITECTURE.md`
Documenta:
1. Quale backend per quale servizio
2. Mappa completa endpoints
3. Differenza tra Python e TypeScript backend
4. Convenzione naming degli endpoints

### Update: `README.md`
Aggiungi sezione su architettura multi-backend

---

## 10. Testing Checklist

Dopo aver applicato i fix, testa:

- [ ] Login Python backend (`/auth/login`)
- [ ] Login TypeScript backend (`/api/auth/team/login`)
- [ ] CRM clients list (`/crm/clients` o `/api/crm/clients`)
- [ ] CRM interactions
- [ ] CRM practices
- [ ] CRM shared memory (`/api/crm/shared-memory`)
- [ ] Search endpoints (`/search`)
- [ ] Agent compliance alerts
- [ ] Autonomous agents research
- [ ] CSRF token fetch (`/csrf-token`)
- [ ] Memory service (verify URL works)
- [ ] Mock login NOT accessible in production

---

## Priority Order

1. **Critical (Do First):**
   - CRM endpoints fix (Backend Python: add `/api`)
   - CSRF token endpoint (Frontend: remove `/api`)
   - Search endpoints (Frontend: remove `/api`)
   - Memory service URL verification

2. **Important (Do Soon):**
   - Mock login production guard
   - Remove obsolete teamLogin reference
   - Remove documentIntelligence reference

3. **Nice to Have (When Possible):**
   - Standardize all hardcoded URLs
   - Cleanup V3 comments
   - Create missing endpoints
   - Update documentation

---

## Verification Commands

```bash
# After fixes, run these to verify:

# 1. Check Python backend routes
cd apps/backend-rag/backend
grep -r "prefix=" app/routers/*.py

# 2. Check TypeScript backend routes
cd apps/backend-ts/src
grep -r "app.use" server.ts | grep -E "(route|api)"

# 3. Check frontend API calls
cd apps/webapp/js
grep -r "fetch.*API_CONFIG\|fetch.*http" *.js

# 4. Test endpoints
curl -I https://nuzantara-backend.fly.dev/health
curl -I https://nuzantara-rag.fly.dev/health
curl -I https://nuzantara-memory.fly.dev/health

# 5. Check for hardcoded URLs
grep -r "nuzantara-backend\|nuzantara-rag\|nuzantara-memory" apps/webapp/js/*.js
```

---

## Need Help?

Refer to:
- **Full Audit:** `CODEBASE_AUDIT_REPORT.md`
- **Auto-fix Script:** `fix-critical-issues.sh`
- **Architecture Docs:** (To be created)

---

**Last Updated:** 2025-01-23
