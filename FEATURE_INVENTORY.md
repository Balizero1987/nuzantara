# 🔍 FEATURE INVENTORY - Backend Node.js TypeScript

**Data Analisi:** 2025-01-27
**Versione Backend:** 5.2.1
**Obiettivo:** Dismissione backend Node.js - Migrazione funzionalità business a Python

---

## 📋 RISPOSTE DOMANDE CHIAVE

### 1. 🔐 **AUTH: Come gestisce il login?**

**Sistema di Autenticazione:**
- **JWT (JSON Web Tokens)** con scadenza 7 giorni
- **PIN-based login** (4-8 cifre) con hash bcrypt
- **Team member authentication** tramite tabella PostgreSQL `team_members`
- **Session management** in-memory con TTL 24h + persistenza DB (`user_sessions`)
- **Unified Auth Strategy** con supporto multipli provider (enhanced, demo, jwt)
- **Token refresh** e **revocation** endpoints
- **Audit trail** completo su `auth_audit_log` (IP, user agent, timestamp, success/failure)

**Tabelle PostgreSQL:**
- `team_members` (id, email, pin_hash, role, department, language, last_login, failed_attempts, locked_until)
- `user_sessions` (session_id, user_id, expires_at, ip_address, user_agent)
- `auth_audit_log` (email, action, ip_address, timestamp, success, failure_reason)

**Endpoints:**
- `POST /api/auth/team/login` - Login con email + PIN
- `POST /auth/validate` - Validazione token
- `POST /auth/refresh` - Refresh token
- `POST /auth/revoke` - Revoca token
- `GET /api/auth/check` - Verifica autenticazione corrente
- `GET /api/user/profile` - Profilo utente corrente

---

### 2. 🔗 **INTEGRAZIONI: Webhook attivi?**

#### ✅ **WhatsApp Business API** (Meta)
- **Webhook:** `GET/POST /webhook/whatsapp`
- **Verification token:** `zantara-balizero-2025-secure-token`
- **Phone:** +62 823-1355-1979
- **Funzionalità:**
  - Ricezione messaggi (1-to-1 e gruppi)
  - Invio messaggi intelligenti con AI
  - Analisi sentiment
  - User intelligence (profilo utenti WhatsApp)
  - Group analytics
  - Salvataggio messaggi in memory service
  - Auto-risposta intelligente con ZANTARA AI

#### ✅ **Instagram Business API** (Meta)
- **Webhook:** `GET/POST /webhook/instagram`
- **Stesso Meta App ID:** 1074166541097027
- **Funzionalità:**
  - Ricezione Direct Messages
  - Invio DM manuali
  - User analytics
  - Sentiment analysis
  - Auto-risposta intelligente

#### ✅ **Twilio WhatsApp** (Sandbox)
- **Webhook:** `POST /webhook/twilio/whatsapp`
- **Invio manuale:** `POST /twilio/whatsapp/send`

#### ❌ **Stripe:** NON trovato (nessun webhook Stripe nel codice)

#### ✅ **Google Workspace** (OAuth2 + Service Account)
- **Gmail:** Send, List, Read emails
- **Drive:** Upload, List, Search, Read files
- **Calendar:** Create, List, Get events
- **Sheets:** Read, Append, Create spreadsheets
- **Docs:** Create, Read, Update documents
- **Contacts:** List, Create contacts

---

### 3. ⚡ **REALTIME: Socket.IO per cosa?**

**Socket.IO Server** (`websocket.ts`):
- **Autenticazione:** Richiede `userId` in handshake
- **Rooms:** `user:{userId}` e `room:{roomId}` per chat
- **Eventi Redis Pub/Sub → WebSocket:**
  - `notification` - Notifiche utente (`CHANNELS.USER_NOTIFICATIONS:*`)
  - `ai-result` - Risultati AI asincroni (`CHANNELS.AI_RESULTS:*`)
  - `chat-message` - Messaggi chat in tempo reale (`CHANNELS.CHAT_MESSAGES:*`)
  - `system-event` - Eventi di sistema broadcast (`CHANNELS.SYSTEM_EVENTS`)
- **Keep-alive:** Ping/pong per mantenere connessione
- **Room management:** Join/leave room per chat multi-utente

**Dipendenza Redis:** Richiede `REDIS_URL` per funzionare

---

### 4. 💾 **DATABASE: Scrive su tabelle che Python non tocca?**

#### ✅ **TABELLE ESCLUSIVE Node.js (da migrare):**

1. **`team_members`**
   - Gestione team members con PIN hash
   - Ruoli, dipartimenti, lingue
   - **CRITICO:** Usato per autenticazione

2. **`auth_audit_log`**
   - Log completo tentativi login
   - IP, user agent, timestamp
   - **CRITICO:** Compliance e sicurezza

3. **`user_sessions`**
   - Sessioni utente attive
   - Expiry tracking
   - **MEDIO:** Può essere sostituito con JWT stateless

4. **`audit_events`**
   - Audit trail generale (non solo auth)
   - GDPR compliance (retention days)
   - **CRITICO:** Compliance legale

5. **`persistent_sessions`** (ZANTARA V4.0)
   - Sessioni persistenti cross-request
   - Metadata, language, expiry
   - **CRITICO:** Memoria conversazioni

6. **`conversation_history`** (ZANTARA V4.0)
   - Storico messaggi conversazioni
   - Tokens used, model used, processing time
   - **CRITICO:** Context per AI

7. **`collective_memory`** (ZANTARA V4.0)
   - Memoria condivisa team
   - Knowledge sharing cross-session
   - **CRITICO:** Intelligenza collettiva

8. **`cross_session_context`** (ZANTARA V4.0)
   - Context sharing tra sessioni
   - **CRITICO:** Continuity conversazioni

9. **`team_knowledge_sharing`** (ZANTARA V4.0)
   - Knowledge base team
   - **CRITICO:** Base conoscenza

10. **`memory_analytics`** (ZANTARA V4.0)
    - Analytics su memoria
    - **MEDIO:** Reporting

11. **`memory_cache`** (ZANTARA V4.0)
    - Cache memoria
    - **MEDIO:** Performance optimization

**Nota:** Python backend scrive su `user_stats`, `conversations`, `crm_*` - tabelle diverse!

---

### 5. 🔄 **PROXY: Rotte passacarte verso Python?**

#### ✅ **Proxy Routes (INUTILE - solo forwarding):**

1. **`/api/agents/*`** → `PYTHON_SERVICE_URL/api/agents/*`
   - Tutti gli agenti AI gestiti da Python
   - **INUTILE:** Rimuovere proxy, chiamare direttamente Python

2. **`/api/crm/*`** → `PYTHON_SERVICE_URL/api/crm/*`
   - CRM completamente gestito da Python
   - **ECCEZIONE:** `/api/crm/shared-memory/search` → alias per `/api/persistent-memory/collective/search` (Node.js)
   - **INUTILE:** Rimuovere proxy, chiamare direttamente Python

3. **`/api/agents/compliance/alerts`**
   - Placeholder che ritorna array vuoto
   - **INUTILE:** Dead code

---

## 🎯 FEATURE INVENTORY PER PRIORITÀ

---

## 🔴 **CRITICO** - Da riscrivere in Python SUBITO

### 🔐 **1. Autenticazione Team Members**
- **File:** `handlers/auth/team-login.ts`, `handlers/auth/team-login-secure.ts`
- **Database:** `team_members`, `auth_audit_log`, `user_sessions`
- **Funzionalità:**
  - Login con email + PIN (bcrypt hash)
  - Generazione JWT token (7 giorni expiry)
  - Session management
  - Audit log completo (IP, user agent, timestamp)
  - Rate limiting tentativi falliti
  - Lock account dopo N tentativi
- **Endpoints:**
  - `POST /api/auth/team/login`
  - `POST /api/auth/team/logout`
  - `GET /api/auth/team/members`
- **Dipendenze:** `jsonwebtoken`, `bcryptjs`, PostgreSQL

### 📱 **2. WhatsApp Business API Integration**
- **File:** `handlers/communication/whatsapp.ts`
- **Funzionalità:**
  - Webhook receiver (`/webhook/whatsapp`)
  - Webhook verification (Meta challenge)
  - Ricezione messaggi (1-to-1 e gruppi)
  - Invio messaggi intelligenti con AI
  - Group analytics e intelligence
  - Sentiment analysis
  - User profiling
  - Auto-risposta con ZANTARA AI
  - Salvataggio messaggi in memory service
- **Endpoints:**
  - `GET /webhook/whatsapp` (verification)
  - `POST /webhook/whatsapp` (receiver)
  - `POST /whatsapp/send` (manual send)
  - `GET /whatsapp/analytics/:groupId`
- **Dipendenze:** Meta Graph API, Memory Service, AI Service

### 📸 **3. Instagram Business API Integration**
- **File:** `handlers/communication/instagram.ts`
- **Funzionalità:**
  - Webhook receiver (`/webhook/instagram`)
  - Webhook verification
  - Ricezione Direct Messages
  - Invio DM manuali
  - User analytics
  - Sentiment analysis
  - Auto-risposta intelligente
- **Endpoints:**
  - `GET /webhook/instagram` (verification)
  - `POST /webhook/instagram` (receiver)
  - `POST /instagram/send` (manual send)
  - `GET /instagram/analytics/:userId`
- **Dipendenze:** Meta Graph API, Memory Service, AI Service

### 💾 **4. Persistent Memory System (ZANTARA V4.0)**
- **File:** `routes/persistent-memory.routes.ts`
- **Database:** `persistent_sessions`, `conversation_history`, `collective_memory`, `cross_session_context`, `team_knowledge_sharing`, `memory_analytics`, `memory_cache`
- **Funzionalità:**
  - Session management persistente
  - Conversation history storage
  - Cross-session context retrieval
  - Collective memory sharing
  - Team knowledge base
  - Memory analytics
- **Endpoints:**
  - `POST /api/persistent-memory/sessions`
  - `GET /api/persistent-memory/sessions/:sessionId`
  - `POST /api/persistent-memory/conversations`
  - `GET /api/persistent-memory/conversations/:sessionId`
  - `POST /api/persistent-memory/collective/save`
  - `GET /api/persistent-memory/collective/search`
  - `GET /api/persistent-memory/collective/shared`
- **CRITICO:** Base per tutte le conversazioni AI

### 📊 **5. Audit Trail System**
- **File:** `services/audit-trail.ts`
- **Database:** `audit_events`
- **Funzionalità:**
  - Log completo eventi sistema
  - GDPR compliance (retention days per tipo evento)
  - Query e reporting
  - Metadata JSONB per flessibilità
- **CRITICO:** Compliance legale e sicurezza

### 🔌 **6. WebSocket Real-Time Notifications**
- **File:** `websocket.ts`, `utils/pubsub.ts`
- **Funzionalità:**
  - Notifiche utente real-time
  - AI results streaming
  - Chat messages real-time
  - System events broadcast
- **Dipendenze:** Socket.IO, Redis Pub/Sub
- **CRITICO:** UX real-time features

---

## 🟡 **MEDIO** - Da migrare dopo le critiche

### 📧 **7. Google Workspace Integration**
- **File:** `handlers/google-workspace/*.ts`
- **Funzionalità:**
  - **Gmail:** Send, List, Read emails
  - **Drive:** Upload, List, Search, Read files
  - **Calendar:** Create, List, Get events
  - **Sheets:** Read, Append, Create spreadsheets
  - **Docs:** Create, Read, Update documents
  - **Contacts:** List, Create contacts
- **Endpoints:**
  - `/api/gmail/*`
  - `/api/drive/*`
  - `/api/calendar/*`
  - `/api/sheets/*`
  - `/api/docs/*`
- **Dipendenze:** `googleapis`, OAuth2 client
- **Nota:** Richiede OAuth2 setup e Service Account

### 🤖 **8. AI Services (ZANTARA Chat)**
- **File:** `handlers/ai-services/ai.ts`, `handlers/ai-services/zantara-llama.ts`
- **Funzionalità:**
  - Chat AI con ZANTARA/LLAMA
  - Memory integration (session, conversation history)
  - Identity recognition (team members)
  - Context retrieval da memory service
  - Streaming responses (SSE)
- **Endpoints:**
  - `POST /api/ai/chat`
  - `POST /api/ai/embeddings`
- **Dipendenze:** Memory Service, AI providers
- **Nota:** Usa memory service Python, ma gestisce routing e context

### 🎨 **9. Creative AI Services**
- **File:** `handlers/ai-services/creative.ts`, `handlers/ai-services/imagine-art-handler.ts`
- **Funzionalità:**
  - Image generation (Imagine.art)
  - Image upscaling
  - Creative content generation
- **Endpoints:**
  - `POST /api/creative/generate`
  - `POST /api/creative/imagine/generate`
  - `POST /api/creative/imagine/upscale`
- **Dipendenze:** Imagine.art API

### 🏢 **10. Bali Zero Business Services**
- **File:** `handlers/bali-zero/*.ts`
- **Funzionalità:**
  - **Oracle:** Simulazione timeline servizi (visa, company, tax, legal, property)
  - **Pricing:** Calcolo prezzi, fatture, subscription, upgrade
  - **Team:** Lista team members, departments, activity tracking
  - **Advisory:** Document preparation, assistant routing
- **Endpoints:**
  - `POST /api/oracle/simulate`
  - `POST /api/oracle/analyze`
  - `POST /api/pricing/*`
  - `GET /api/team/*`
- **Nota:** Usa RAG backend Python per dati, ma gestisce business logic

### 📈 **11. Analytics & Monitoring**
- **File:** `handlers/analytics/*.ts`
- **Funzionalità:**
  - Dashboard analytics
  - Weekly reports
  - Daily drive recap
  - Conversation analytics
  - Service usage analytics
- **Endpoints:**
  - `GET /api/analytics/dashboard`
  - `GET /api/analytics/weekly-report`
  - `GET /api/analytics/daily-recap`
- **Nota:** Aggrega dati da varie fonti

### 🔄 **12. RAG Integration**
- **File:** `handlers/rag/rag.ts`, `handlers/bali-zero/oracle-universal.ts`
- **Funzionalità:**
  - Query RAG backend Python
  - Collection routing (visa_oracle, company_oracle, tax_genius, etc.)
  - Multi-topic detection
  - Universal oracle queries
- **Endpoints:**
  - `POST /api/rag/query`
  - `POST /api/oracle/universal`
- **Nota:** Wrapper su Python RAG, ma gestisce routing logic

### 🌐 **13. Translation Service**
- **File:** `handlers/communication/translate.ts`
- **Funzionalità:**
  - Traduzione testi multi-lingua
  - Supporto ID/EN/IT
- **Endpoints:**
  - `POST /api/translate`
- **Dipendenze:** AI service per traduzione

### 🗺️ **14. Maps Integration**
- **File:** `handlers/maps/maps.ts`
- **Funzionalità:**
  - Directions
  - Places search
  - Place details
- **Endpoints:**
  - `POST /api/maps/directions`
  - `POST /api/maps/places`
- **Dipendenze:** Google Maps API (presumibilmente)

### ⏰ **15. Cron Scheduler (AI Automation)**
- **File:** `services/cron-scheduler.ts`
- **Funzionalità:**
  - AI health check (ogni ora)
  - Monitoring rate limits
  - Circuit breaker status
  - Cost tracking
- **Nota:** Job scheduling per automazioni

### 📱 **16. Mobile API Endpoints**
- **File:** `routes/mobile-api-endpoints.ts`
- **Funzionalità:**
  - Endpoints ottimizzati per mobile
  - Contact information
  - Service listings
- **Endpoints:**
  - `GET /api/mobile/*`
- **Nota:** Wrapper/formatting per mobile apps

---

## 🟢 **INUTILE** - Proxy o codice morto

### 🔄 **17. Proxy Routes (Python Backend)**
- **File:** `server.ts` (linee 284-342)
- **Funzionalità:**
  - `/api/agents/*` → Python backend (proxy pass-through)
  - `/api/crm/*` → Python backend (proxy pass-through)
  - `/api/agents/compliance/alerts` → Placeholder (ritorna array vuoto)
- **Azione:** Rimuovere proxy, frontend chiama direttamente Python

### 🧪 **18. Test/Mock Routes**
- **File:** `routes/test/mock-login.ts`
- **Funzionalità:**
  - Mock login per testing (solo DEV)
- **Azione:** Rimuovere o mantenere solo per testing locale

### 📝 **19. Admin Setup Routes**
- **File:** `routes/admin/setup.ts`, `routes/admin/setup-bypass.ts`
- **Funzionalità:**
  - Database initialization
  - Team member creation
- **Nota:** Utile per setup iniziale, poi può essere script Python

### 🔍 **20. Code Quality Routes**
- **File:** `routes/code-quality.routes.ts`
- **Funzionalità:**
  - Monitoring code quality
  - Linting reports
- **Nota:** Tool interno, non business-critical

### 📊 **21. Performance Monitoring Routes**
- **File:** `routes/performance.routes.ts`, `middleware/performance-middleware.ts`
- **Funzionalità:**
  - Performance metrics collection
  - Response time tracking
  - Endpoint analytics
- **Nota:** Monitoring interno, può essere sostituito con strumenti standard

### 🏥 **22. Health Check Routes**
- **File:** `routes/health.ts`
- **Funzionalità:**
  - Health check endpoint
  - Service status
- **Nota:** Standard endpoint, facile da replicare

### 📈 **23. Metrics Routes (Prometheus)**
- **File:** `middleware/observability.middleware.ts`
- **Funzionalità:**
  - Prometheus metrics endpoint (`/metrics`)
- **Nota:** Standard Prometheus, facile da replicare

---

## 📊 **RIEPILOGO STATISTICHE**

### Database Tables (Node.js exclusive):
- **11 tabelle** gestite esclusivamente da Node.js
- **3 tabelle** critiche per autenticazione
- **7 tabelle** critiche per persistent memory

### Webhook Attivi:
- ✅ WhatsApp Business API
- ✅ Instagram Business API
- ✅ Twilio WhatsApp (sandbox)
- ❌ Stripe (non trovato)

### Integrazioni Esterne:
- ✅ Google Workspace (Gmail, Drive, Calendar, Sheets, Docs, Contacts)
- ✅ Meta Graph API (WhatsApp, Instagram)
- ✅ Twilio API
- ✅ Imagine.art API
- ✅ Socket.IO + Redis Pub/Sub

### Endpoints Totali:
- **~150+ endpoint** totali
- **~30 endpoint** critici da migrare
- **~50 endpoint** medi da migrare
- **~70 endpoint** inutili/proxy/monitoring

---

## 🚨 **RISCHI MIGRAZIONE**

1. **Webhook Meta:** Cambiare URL webhook richiede riconfigurazione Meta Business Account
2. **JWT Secrets:** Deve essere condiviso tra Node.js e Python durante transizione
3. **Socket.IO:** Client frontend devono essere aggiornati se cambia implementazione
4. **Database Schema:** Migrazione dati da tabelle Node.js a Python richiede downtime pianificato
5. **OAuth2 Tokens:** Google Workspace tokens devono essere migrati/rigenerati

---

## ✅ **CHECKLIST MIGRAZIONE**

### Fase 1: Critiche (Settimana 1-2)
- [ ] Autenticazione team members (JWT + PIN)
- [ ] WhatsApp webhook receiver
- [ ] Instagram webhook receiver
- [ ] Persistent memory system
- [ ] Audit trail system
- [ ] WebSocket notifications

### Fase 2: Medie (Settimana 3-4)
- [ ] Google Workspace integration
- [ ] AI services routing
- [ ] Bali Zero business logic
- [ ] Analytics aggregation
- [ ] RAG integration wrapper

### Fase 3: Cleanup (Settimana 5)
- [ ] Rimuovere proxy routes
- [ ] Migrare test routes
- [ ] Documentazione API
- [ ] Decommissioning Node.js backend

---

**Documento generato da:** Senior Legacy Auditor
**Data:** 2025-01-27
**Versione:** 1.0
