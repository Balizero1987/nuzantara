# 🚀 START HERE - Zantara Project

**Ultimo Test**: 2025-10-10
**Status**: ✅ 48% handler funzionanti, Production Ready per core features

---

## 📍 Link Rapidi

| Risorsa | URL |
|---------|-----|
| **Webapp Live** | https://zantara.balizero.com/login.html |
| **Backend API** | https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app |
| **Health Check** | https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/health |

---

## 📖 Documentazione Essenziale

### Per Iniziare SUBITO
1. **[ZANTARA_WEBAPP_QUICKSTART.md](./ZANTARA_WEBAPP_QUICKSTART.md)** ⭐
   - Come usare la webapp
   - Handler funzionanti
   - Esempi di codice pronti all'uso
   - Use cases comuni

### Test e Status
2. **[ZANTARA_WEBAPP_TEST_REPORT.md](./ZANTARA_WEBAPP_TEST_REPORT.md)** 📊
   - Report completo 48 handler testati
   - Cosa funziona (23 handler)
   - Cosa manca (24 handler)
   - Problemi noti e soluzioni

### Architettura e Development
3. **[PROJECT_CONTEXT.md](./docs/PROJECT_CONTEXT.md)** 🏗️
   - Architettura completa sistema
   - 164 handler totali disponibili
   - Setup backend TypeScript + Python RAG

4. **[DUAL_LAYER_MEMORY_BEST_PRACTICES.md](./DUAL_LAYER_MEMORY_BEST_PRACTICES.md)** 💾
   - Sistema memoria dual-layer
   - Postgres + Redis cache
   - Best practices

---

## ✅ Cosa Funziona ORA (Production Ready)

### 📧 Google Workspace - 89%
```javascript
// Email, Drive, Contacts, Sheets, Calendar
await apiCall('gmail.list', { maxResults: 10 });
await apiCall('drive.search', { query: 'invoice' });
await apiCall('contacts.create', { givenName: 'John', familyName: 'Doe' });
```

### 💾 Memory System - 100%
```javascript
// Dual-layer memory: Postgres + Redis
await apiCall('memory.save', { userId: 'user123', content: 'Prefers morning meetings' });
await apiCall('memory.search.semantic', { userId: 'user123', query: 'meeting' });
```

### 🤖 RAG Search - 75%
```javascript
// Semantic search su knowledge base
await apiCall('rag.search', { query: 'PT PMA requirements', limit: 5 });
await apiCall('rag.query', { query: 'How to setup PT PMA?' });
```

### 🗺️ Google Maps - 50%
```javascript
// Places, Directions
await apiCall('maps.places', { query: 'restaurants', location: '-8.6705,115.2126' });
```

### 👥 Team Management - 100%
```javascript
// Track team activity
await apiCall('team.recent_activity', { hours: 24 });
```

---

## ⚠️ Cosa NON Funziona

### Handler Non Registrati (24)
- Twitter/X, Instagram, WhatsApp
- Slack, Notion, Linear, GitHub
- Stripe payments
- Auth system
- Google Cloud Platform handlers

### Problemi da Risolvere (1)
- `bali.zero.chat` - RAG backend timeout issue

**Dettagli completi**: Vedi [ZANTARA_WEBAPP_TEST_REPORT.md](./ZANTARA_WEBAPP_TEST_REPORT.md)

---

## 🧪 Test Veloci

### Script già pronti in `/tmp/`:
```bash
# Test 3 handler core (RAG, Maps, Contacts)
node /tmp/test_3_fixes.js

# Test completo 48 handler
node /tmp/test_all_zantara_features.js

# Test specifici failing handlers
node /tmp/test_failing_handlers.js
```

### Test manuale singolo handler:
```bash
curl -X POST https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key":"rag.search","params":{"query":"PT PMA","limit":5}}'
```

---

## 🎯 Quick Win Use Cases

### 1. Email Management
```javascript
// Lista email
const emails = await apiCall('gmail.list', { maxResults: 10 });

// Invia email
await apiCall('gmail.send', {
  to: 'client@example.com',
  subject: 'Invoice',
  body: 'Content here'
});
```

### 2. Knowledge Base Search
```javascript
// Cerca nella KB
const results = await apiCall('rag.search', {
  query: 'PT PMA capital requirements',
  limit: 5
});
```

### 3. Contact Management
```javascript
// Lista contatti
const contacts = await apiCall('contacts.list', { pageSize: 50 });

// Crea contatto
await apiCall('contacts.create', {
  givenName: 'Maria',
  familyName: 'Rossi',
  emailAddresses: [{ value: 'maria@example.com' }]
});
```

### 4. User Memory
```javascript
// Salva preferenze utente
await apiCall('memory.save', {
  userId: 'user123',
  content: 'Prefers English communication'
});

// Recupera profilo
const profile = await apiCall('memory.retrieve', { userId: 'user123' });
```

---

## 🔧 Per Sviluppatori

### Setup Locale
```bash
# Clone repo (già fatto se leggi questo)
cd /Users/antonellosiano/Desktop/NUZANTARA-2

# Install dependencies
npm install

# Build backend
npm run build:backend

# Run tests
node /tmp/test_all_zantara_features.js
```

### Deploy su Google Cloud Run
```bash
# Build e push Docker image
gcloud builds submit --config=cloudbuild.yaml

# Deploy
gcloud run deploy zantara-v520-nuzantara \
  --region=europe-west1 \
  --image=gcr.io/involuted-box-469105-r0/zantara-v520-nuzantara:latest
```

### Aggiungere Nuovo Handler
1. Crea file handler: `src/handlers/[category]/[name].ts`
2. Registra in: `src/handlers/[category]/registry.ts`
3. Aggiungi a: `src/handlers/registry.ts`
4. Build + Deploy
5. Test: Aggiungi a script in `/tmp/`

---

## 📊 Statistiche Progetto

| Categoria | Handlers Totali | Funzionanti | % |
|-----------|-----------------|-------------|---|
| Google Workspace | 9 | 8 | 89% |
| Memory System | 5 | 5 | 100% |
| Team Management | 1 | 1 | 100% |
| RAG & AI | 4 | 3 | 75% |
| Google Maps | 4 | 2 | 50% |
| Social Media | 8 | 0 | 0% |
| Project Tools | 8 | 0 | 0% |
| Payments | 2 | 0 | 0% |
| **TOTALE** | **48 testati** | **23** | **48%** |

**Nota**: Ci sono 164 handler totali nel backend, 48 testati nella webapp.

---

## 🚨 Problemi Noti

### 1. Bali Zero Chat - Service Unavailable
**Handler**: `bali.zero.chat`
**Status**: ❌ Non funziona
**Causa**: RAG backend Python timeout o down
**Priority**: HIGH

**Debug**:
```bash
curl https://zantara-rag-backend-himaadsxua-ew.a.run.app/health
```

### 2. Handler Non Registrati (24)
**Status**: ❌ "handler_not_found"
**Causa**: Non registrati nel sistema o non implementati
**Priority**: MEDIUM

Vedi lista completa in [ZANTARA_WEBAPP_TEST_REPORT.md](./ZANTARA_WEBAPP_TEST_REPORT.md)

---

## 📚 File Importanti nel Repo

```
NUZANTARA-2/
├── ZANTARA_WEBAPP_QUICKSTART.md    ⭐ Inizia qui per usare la webapp
├── ZANTARA_WEBAPP_TEST_REPORT.md   📊 Report completo test
├── START_HERE_ZANTARA.md           📍 Questo file
├── docs/
│   └── PROJECT_CONTEXT.md          🏗️ Architettura completa
├── src/
│   ├── handlers/                   🔧 Tutti gli handler
│   │   ├── registry.ts             📋 Registry globale
│   │   ├── google-workspace/       📧 Gmail, Drive, Contacts
│   │   ├── maps/                   🗺️ Google Maps
│   │   ├── rag/                    🤖 RAG Search
│   │   └── bali-zero/              💾 Memory, Team
│   └── services/                   ⚙️ Services layer
├── /tmp/
│   ├── test_all_zantara_features.js  🧪 Test completo
│   ├── test_3_fixes.js               ✅ Test rapido
│   └── test_failing_handlers.js      🔍 Debug failing
└── cloudbuild.yaml                   🚀 Deploy config
```

---

## 🎓 Learning Path

### Livello 1: Utente Webapp
1. Leggi [ZANTARA_WEBAPP_QUICKSTART.md](./ZANTARA_WEBAPP_QUICKSTART.md)
2. Apri https://zantara.balizero.com/login.html
3. Prova i use cases nella quick start guide
4. Consulta [ZANTARA_WEBAPP_TEST_REPORT.md](./ZANTARA_WEBAPP_TEST_REPORT.md) per limiti

### Livello 2: Developer
1. Studia [PROJECT_CONTEXT.md](./docs/PROJECT_CONTEXT.md)
2. Esplora `src/handlers/` per vedere implementazioni
3. Lancia test: `node /tmp/test_all_zantara_features.js`
4. Aggiungi nuovo handler (vedi sezione "Per Sviluppatori")

### Livello 3: Maintainer
1. Risolvi "Bali Zero Chat" timeout issue
2. Implementa handler mancanti (Twitter, Slack, etc)
3. Migliora test coverage (48 -> 164 handler)
4. Setup monitoring e alerting

---

## 🆘 Supporto

### Problemi Comuni
- **Backend non risponde**: Check health endpoint
- **Handler not found**: Verifica in [test report](./ZANTARA_WEBAPP_TEST_REPORT.md)
- **Timeout**: RAG backend ha cold start ~5-10s
- **CORS errors**: Check webapp config in `js/api-config.js`

### Logs
```bash
# Backend logs
gcloud run services logs read zantara-v520-nuzantara \
  --region=europe-west1 \
  --limit=100

# RAG backend logs
gcloud run services logs read zantara-rag-backend \
  --region=europe-west1 \
  --limit=100
```

---

## ✨ Highlights

✅ **Production Ready**:
- Google Workspace integration (89%)
- Dual-layer memory system (100%)
- RAG semantic search (75%)
- Team activity tracking (100%)

🔧 **In Development**:
- Social media integrations (0%)
- Project management tools (0%)
- Payment processing (0%)
- Bali Zero chat (debugging)

📊 **Metrics**:
- 48 handler testati / 164 totali disponibili
- 23 funzionanti (48%)
- Backend v5.2.0 healthy
- Webapp deployed su GitHub Pages + Cloud Run

---

**Creato**: 2025-10-10
**Ultimo Test**: 2025-10-10
**Next Review**: Quando implementi handler mancanti
**Maintainer**: Bali Zero Team

🚀 **START NOW**: Apri [ZANTARA_WEBAPP_QUICKSTART.md](./ZANTARA_WEBAPP_QUICKSTART.md)
