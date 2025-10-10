# Zantara Webapp - Quick Start Guide

## 🚀 Accesso Rapido

**URL Webapp**: https://zantara.balizero.com/login.html
**Backend API**: https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app
**Versione**: 5.2.0

---

## ✅ Cosa Funziona SUBITO (Pronto per Produzione)

### 📧 Google Workspace
```javascript
// Leggi email
await apiCall('gmail.list', { maxResults: 10 });

// Invia email
await apiCall('gmail.send', {
  to: 'user@example.com',
  subject: 'Hello',
  body: 'Message content'
});

// Lista file Drive
await apiCall('drive.list', { pageSize: 20 });

// Cerca su Drive
await apiCall('drive.search', { query: 'invoice', pageSize: 10 });

// Leggi contatti
await apiCall('contacts.list', { pageSize: 50 });

// Crea contatto
await apiCall('contacts.create', {
  givenName: 'John',
  familyName: 'Doe',
  emailAddresses: [{ value: 'john@example.com' }]
});

// Leggi Google Sheets
await apiCall('sheets.read', {
  spreadsheetId: 'YOUR_SHEET_ID',
  range: 'Sheet1!A1:Z100'
});
```

### 🗺️ Google Maps
```javascript
// Cerca luoghi
await apiCall('maps.places', {
  query: 'restaurants in Ubud',
  location: '-8.6705,115.2126',
  radius: 5000
});

// Calcola direzioni
await apiCall('maps.directions', {
  origin: '-8.6705,115.2126',
  destination: '-8.7467,115.1681',
  mode: 'driving'
});
```

### 💾 Memory System (Sistema Memoria Completo)
```javascript
const userId = 'user123';

// Salva memoria
await apiCall('memory.save', {
  userId,
  content: 'User prefers morning meetings',
  type: 'preference'
});

// Recupera tutte le memorie
await apiCall('memory.retrieve', { userId });

// Ricerca semantica
await apiCall('memory.search.semantic', {
  userId,
  query: 'meeting preferences',
  limit: 5
});

// Ricerca ibrida (keyword + semantic)
await apiCall('memory.search.hybrid', {
  userId,
  query: 'morning',
  limit: 5
});

// Statistiche cache
await apiCall('memory.cache.stats', {});
```

### 🤖 RAG Search (Ricerca Semantica KB)
```javascript
// Ricerca veloce (no LLM)
await apiCall('rag.search', {
  query: 'PT PMA requirements',
  limit: 10
});

// Query completa con risposta LLM
await apiCall('rag.query', {
  query: 'How to setup PT PMA in Bali?',
  k: 5,
  use_llm: true
});

// Health check
await apiCall('rag.health', {});
```

### 👥 Team Activity
```javascript
// Membri attivi ultime 24h
await apiCall('team.recent_activity', {
  hours: 24,
  limit: 10,
  department: 'engineering'
});
```

---

## ⚠️ Cosa NON Funziona (Da Implementare)

### Non Registrati
- ❌ Twitter/X integration
- ❌ Instagram integration
- ❌ WhatsApp integration
- ❌ Slack integration
- ❌ Notion integration
- ❌ Linear integration
- ❌ GitHub integration
- ❌ Stripe payments
- ❌ Authentication system
- ❌ Google Cloud Platform handlers

### Problemi Noti
- ❌ `bali.zero.chat` - Service unavailable (RAG backend timeout)
- ❌ `calendar.events` - Handler not found
- ❌ `maps.geocode` - Handler not found
- ❌ `maps.distance` - Handler not found

---

## 🧪 Test Rapidi

### Test 1: Verifica Backend
```bash
curl https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/health
```

### Test 2: RAG Search
```bash
curl -X POST https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key":"rag.search","params":{"query":"PT PMA","limit":5}}'
```

### Test 3: Script Completo
```bash
# Test 3 handler principali
node /tmp/test_3_fixes.js

# Test completo (tutti i 48 handler)
node /tmp/test_all_zantara_features.js
```

---

## 📝 Formato Chiamate API

### JavaScript (Webapp)
```javascript
const API_BASE = 'https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app';
const API_KEY = 'zantara-internal-dev-key-2025';

async function apiCall(key, params = {}) {
  const response = await fetch(`${API_BASE}/call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify({ key, params })
  });
  return await response.json();
}

// Usa così
const result = await apiCall('gmail.list', { maxResults: 10 });
if (result.ok) {
  console.log('Success:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### cURL (Terminal)
```bash
curl -X POST https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "gmail.list",
    "params": {"maxResults": 10}
  }'
```

---

## 🎯 Use Cases Comuni

### 1. Gestione Email
```javascript
// Leggi ultime 10 email
const emails = await apiCall('gmail.list', { maxResults: 10 });

// Invia email
await apiCall('gmail.send', {
  to: 'client@example.com',
  subject: 'Invoice #123',
  body: 'Please find attached...'
});
```

### 2. Ricerca Documentazione
```javascript
// Cerca info su PT PMA
const results = await apiCall('rag.search', {
  query: 'PT PMA requirements for foreigners',
  limit: 5
});

// Ottieni risposta completa
const answer = await apiCall('rag.query', {
  query: 'How much capital needed for PT PMA?',
  use_llm: true
});
```

### 3. Gestione Contatti
```javascript
// Lista tutti i contatti
const contacts = await apiCall('contacts.list', { pageSize: 100 });

// Aggiungi nuovo contatto
await apiCall('contacts.create', {
  givenName: 'Maria',
  familyName: 'Rossi',
  emailAddresses: [{ value: 'maria@example.com' }],
  phone: '+62812345678',
  organization: 'Bali Zero',
  title: 'Client'
});
```

### 4. Cerca Luoghi
```javascript
// Trova ristoranti a Ubud
const places = await apiCall('maps.places', {
  query: 'italian restaurants',
  location: '-8.5069,115.2625', // Ubud center
  radius: 3000
});

// Calcola tempo di viaggio
const route = await apiCall('maps.directions', {
  origin: 'Ubud, Bali',
  destination: 'Canggu, Bali',
  mode: 'driving'
});
```

### 5. Sistema Memoria Utente
```javascript
const userId = 'user_12345';

// Salva preferenze
await apiCall('memory.save', {
  userId,
  content: 'Prefers communication in English',
  type: 'preference'
});

await apiCall('memory.save', {
  userId,
  content: 'Interested in PT PMA setup',
  type: 'interest'
});

// Recupera profilo completo
const profile = await apiCall('memory.retrieve', { userId });

// Cerca memorie rilevanti
const relevant = await apiCall('memory.search.semantic', {
  userId,
  query: 'business setup preferences',
  limit: 5
});
```

---

## 📊 Response Format

### Success Response
```json
{
  "ok": true,
  "data": {
    // Handler-specific data
  }
}
```

### Error Response
```json
{
  "ok": false,
  "error": "Error message"
}
```

### Common Errors
- `handler_not_found` - Handler non registrato nel sistema
- `Service unavailable` - Servizio esterno non raggiungibile
- `Invalid parameters` - Parametri mancanti o errati
- `Authentication failed` - API key non valida

---

## 🔧 Troubleshooting

### Backend non risponde
```bash
# Check health
curl https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/health

# Check logs su Google Cloud
gcloud run services logs read zantara-v520-nuzantara \
  --region=europe-west1 \
  --limit=50
```

### Handler not found
- Controlla che l'handler sia registrato in `src/handlers/registry.ts`
- Verifica che il nome del handler sia corretto (case-sensitive)
- Consulta `ZANTARA_WEBAPP_TEST_REPORT.md` per lista completa

### RAG Search lento
- RAG backend Python può avere cold start (~5-10s)
- Usa `rag.search` invece di `rag.query` se non serve risposta LLM
- Cache integrata per query ripetute

---

## 📚 Documentazione Completa

- [Test Report Completo](./ZANTARA_WEBAPP_TEST_REPORT.md) - 48 handler testati
- [Project Context](./docs/PROJECT_CONTEXT.md) - Architettura completa
- [Memory System](./DUAL_LAYER_MEMORY_BEST_PRACTICES.md) - Dual-layer memory
- [Deployment](./DEPLOYMENT_COMPLETE.txt) - Deploy su Google Cloud Run

---

## ⚡ Next Steps per Sviluppatori

### Per aggiungere nuovo handler:
1. Crea handler in `src/handlers/[category]/[name].ts`
2. Registra in `src/handlers/[category]/registry.ts`
3. Aggiungi a `src/handlers/registry.ts`
4. Build e deploy: `npm run build:backend && gcloud builds submit`
5. Test: Aggiungi a `/tmp/test_all_zantara_features.js`

### Per investigare Bali Zero Chat:
```bash
# Check RAG backend
curl https://zantara-rag-backend-himaadsxua-ew.a.run.app/health

# Test diretto endpoint
curl -X POST https://zantara-rag-backend-himaadsxua-ew.a.run.app/bali-zero/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"test","user_role":"member"}'
```

---

**Last Updated**: 2025-10-10
**Maintainer**: Bali Zero Team
**Support**: Check logs on Google Cloud Run
