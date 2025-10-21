# NUZANTARA - Quick Fix Guide per Errori Comuni

## 🚨 Errori Più Comuni e Fix Immediati

### 1. ❌ CORS Error nel Browser Console

**Errore:**
```
Access to fetch at 'https://ts-backend-production-568d.up.railway.app/call' 
from origin 'https://example.com' has been blocked by CORS policy
```

**Fix Immediato:**
```bash
# 1. Verificare origin corrente
railway variables --service backend-ts | grep CORS_ORIGINS

# 2. Aggiungere origin mancante
railway variables set CORS_ORIGINS="https://zantara.balizero.com,https://balizero1987.github.io,http://localhost:3000,https://example.com" --service backend-ts

# 3. Redeploy backend
railway up --service backend-ts
```

**Verifica:**
```bash
# Test CORS con curl
curl -X OPTIONS https://ts-backend-production-568d.up.railway.app/health \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

---

### 2. ❌ 401 Unauthorized

**Errore:**
```json
{"error": "Missing x-api-key"}
```

**Causa:** Origin non nella whitelist O API key mancante

**Fix Opzione A (Webapp Origin Bypass - RACCOMANDATO):**
```typescript
// apps/backend-ts/src/middleware/auth.ts (linea 21)
// Aggiungere origin alla whitelist:
if (origin === 'https://zantara.balizero.com' || 
    origin === 'https://balizero1987.github.io' ||
    origin === 'https://tuo-dominio.com') { // ← AGGIUNGERE QUI
  req.ctx = { role: "external" };
  return next();
}
```

**Fix Opzione B (API Key):**
```javascript
// apps/webapp/js/api-config.js (linea 162)
// Aggiungere API key agli headers:
headers: {
  ...API_CONFIG.headers,
  'x-api-key': 'zantara-internal-dev-key-2025', // ← AGGIUNGERE
  ...(userId ? { 'x-user-id': userId } : {}),
}
```

---

### 3. ❌ 502 Bad Gateway (Backend RAG)

**Errore:**
```json
{"status":"error","code":502,"message":"Application failed to respond"}
```

**Causa:** Backend RAG in sleep (Railway cold start)

**Fix Immediato (Webapp):**
```javascript
// apps/webapp/js/api-config.js
// AGGIUNGERE retry logic migliorato:

async function callWithColdStartRetry(url, options) {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      // 502 = cold start, aspettare più a lungo
      if (response.status === 502 && i < maxRetries - 1) {
        console.log(`[ZANTARA] Cold start detected, retry ${i+1}/${maxRetries}...`);
        await new Promise(r => setTimeout(r, 15000)); // 15 secondi
        continue;
      }
      
      return response;
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}
```

**Fix Permanente:**
```bash
# Implementare health check ping (ogni 10 minuti)
# File: apps/backend-ts/src/services/rag-warmup.ts

import fetch from 'node-fetch';

const RAG_URL = process.env.RAG_BACKEND_URL || 'https://scintillating-kindness-production-47e3.up.railway.app';

export function startRAGWarmup() {
  setInterval(async () => {
    try {
      await fetch(`${RAG_URL}/health`, { timeout: 5000 });
      console.log('✅ RAG backend warmed up');
    } catch (e) {
      console.log('⚠️ RAG warmup failed:', e.message);
    }
  }, 10 * 60 * 1000); // Ogni 10 minuti
}

// In apps/backend-ts/src/index.ts (linea 260):
import { startRAGWarmup } from './services/rag-warmup.js';
startRAGWarmup();
```

---

### 4. ❌ Handler Not Found

**Errore:**
```json
{"ok": false, "error": "handler_not_found"}
```

**Fix:**
```javascript
// 1. Verificare handler key esatto
// apps/backend-ts/src/routing/router.ts (linee 173-924)

// 2. Lista handler disponibili:
fetch('https://ts-backend-production-568d.up.railway.app/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    key: 'system.handlers.list', 
    params: {} 
  })
}).then(r => r.json()).then(data => {
  console.log('Available handlers:', data.data);
});

// 3. Handler key corretto per common tasks:
// - Contact info: 'contact.info'
// - Team list: 'team.list'
// - AI chat: 'ai.chat'
// - Memory save: 'memory.save'
// - Pricing: 'bali.zero.pricing'
```

---

### 5. ❌ Request Timeout

**Errore:**
```
Error: Request timeout
```

**Fix:**
```javascript
// apps/webapp/js/core/api-client.js (linea 14)
// Aumentare timeout:
this.timeout = config.api.timeout; // Default: 30000

// Per operazioni lunghe (AI, RAG):
async call(endpoint, params = {}, useStreaming = false, timeout = null) {
  const actualTimeout = timeout || this.timeout;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), actualTimeout);
  // ...
}

// Usage:
await apiClient.call('rag.query', { query: '...' }, false, 60000); // 60s timeout
```

---

### 6. ❌ JWT Token Expired

**Errore:**
```json
{"error": "Session expired"}
```

**Fix (Auto-refresh già implementato):**
```javascript
// apps/webapp/js/auth/jwt-service.js (linea 222-236)
// Verifica auto-refresh funzionante:

async getAuthHeader() {
  // Check if token needs refresh
  if (this.needsRefresh()) {
    try {
      await this.refreshAccessToken(); // ← Auto-refresh
    } catch (e) {
      window.location.href = '/login-claude-style.html';
      throw new Error('Session expired');
    }
  }
  return token ? `Bearer ${token}` : null;
}

// Se problema persiste, aumentare expiryBuffer:
// apps/webapp/js/config.js (linea 24)
expiryBuffer: 600, // 10 minuti invece di 5
```

---

### 7. ❌ Mixed Content Warning

**Errore:**
```
Mixed Content: The page at 'https://zantara.balizero.com' 
requested an insecure resource 'http://localhost:8080/call'
```

**Fix:**
```javascript
// apps/webapp/js/api-config.js (linea 152)
// Verificare che localhost sia solo in dev:

if (isDevelopment) {
  apiUrl = 'http://localhost:3003' + endpoint;
  console.log('Using local proxy for development');
} else {
  // PRODUCTION: sempre HTTPS
  apiUrl = 'https://ts-backend-production-568d.up.railway.app' + endpoint;
}
```

---

### 8. ❌ Streaming Non Funziona

**Errore:**
```
No response body available for streaming
```

**Fix:**
```javascript
// apps/webapp/js/streaming-client.js (linea 54)
// Verificare URL streaming corretto:

getAPIBase() {
  // Use the getStreamingUrl helper if available
  if (window.ZANTARA_API?.getStreamingUrl) {
    return window.ZANTARA_API.getStreamingUrl();
  }

  // PRODUCTION: endpoint streaming
  return 'https://ts-backend-production-568d.up.railway.app/chat'; // ← Verificare
}

// Backend: verificare endpoint /chat esista
// apps/backend-ts/src/index.ts - dovrebbe avere route POST /chat
```

---

## 🔍 Strumenti di Debug

### 1. Browser Console Commands

```javascript
// Verificare configurazione
console.log(window.ZANTARA_API.config);

// Test health check
await window.ZANTARA_API.checkHealth();

// Test API call
await window.ZANTARA_API.call('/call', { 
  key: 'contact.info', 
  params: {} 
});

// Telemetry stats
window.ZANTARA_TELEMETRY.print();
window.ZANTARA_TELEMETRY.getSummary();

// Storage check
console.log(localStorage.getItem('zantara-auth-token'));
console.log(localStorage.getItem('zantara-user-email'));
```

### 2. Railway CLI Commands

```bash
# Logs in tempo reale
railway logs --service backend-ts --tail 50

# Verificare env variables
railway variables --service backend-ts

# Redeploy
railway up --service backend-ts

# Status deployment
railway status
```

### 3. cURL Tests

```bash
# Test health
curl https://ts-backend-production-568d.up.railway.app/health | jq .

# Test /call endpoint
curl -X POST https://ts-backend-production-568d.up.railway.app/call \
  -H "Content-Type: application/json" \
  -H "Origin: https://zantara.balizero.com" \
  -d '{"key":"contact.info","params":{}}' | jq .

# Test CORS preflight
curl -X OPTIONS https://ts-backend-production-568d.up.railway.app/health \
  -H "Origin: https://zantara.balizero.com" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

### 4. Test Script Automatico

```bash
# Run integration test
node test-integration-errors.cjs
```

---

## 📋 Checklist Pre-Deploy

Prima di deployare modifiche:

- [ ] **CORS origins** aggiornati in env variables
- [ ] **API URLs** corretti in webapp config
- [ ] **Test locale** con `npm run dev`
- [ ] **Build success** con `npm run build`
- [ ] **Railway health check** passa
- [ ] **Browser console** senza errori CORS
- [ ] **Test /call endpoint** con curl
- [ ] **Integration test** passa: `node test-integration-errors.cjs`

---

## 🆘 Escalation Path

Se problema persiste dopo quick fix:

1. **Check Railway logs:**
   ```bash
   railway logs --service backend-ts --tail 100 > backend-logs.txt
   ```

2. **Browser console log:**
   - F12 > Console > Save console output
   - Network tab > Save HAR file

3. **Test script output:**
   ```bash
   node test-integration-errors.cjs > test-output.txt 2>&1
   ```

4. **Environment snapshot:**
   ```bash
   railway variables --service backend-ts > env-vars.txt
   ```

5. **Condividi:** Invia file a team per analisi approfondita

---

## 📞 Quick Reference

| Issue | Priority | Fix Time | Downtime |
|-------|----------|----------|----------|
| CORS Error | 🔴 High | 5 min | No |
| 401 Unauthorized | 🔴 High | 10 min | No |
| 502 Cold Start | 🟡 Medium | 30 min | No |
| Handler Not Found | 🟢 Low | 15 min | No |
| Timeout | 🟡 Medium | 20 min | No |
| JWT Expired | 🟢 Low | Auto-fix | No |
| Mixed Content | 🟢 Low | 5 min | No |
| Streaming | 🟡 Medium | 30 min | No |

---

**Last Updated:** 21 Ottobre 2025  
**Version:** 5.2.0  
**Status:** Production Ready ✅
