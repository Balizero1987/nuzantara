# Lista Completa Test di Funzionamento - Nuzantara

Lista completa di tutti gli endpoint e test disponibili, organizzata per categoria.

---

## 📋 CATEGORIA 1: Health & Infrastructure

### 1.1 Health Check
- **Endpoint**: `GET /health`
- **Descrizione**: Verifica stato generale del sistema
- **Test**: Status 200, response contiene `status: "healthy"`
- **Priorità**: 🔴 CRITICA

### 1.2 Database Connection
- **Endpoint**: `GET /health` (verifica campo `database.status`)
- **Descrizione**: Verifica connessione database
- **Test**: `database.status === "connected"`
- **Priorità**: 🔴 CRITICA

---

## 📋 CATEGORIA 2: Authentication & Identity

### 2.1 Login Team
- **Endpoint**: `POST /api/auth/team/login`
- **Body**: `{"email": "zero@balizero.com", "pin": "010719"}`
- **Descrizione**: Autenticazione utente team
- **Test**: Status 200, response contiene `token` e `user`
- **Priorità**: 🔴 CRITICA

### 2.2 Seed Team
- **Endpoint**: `POST /api/auth/team/seed-team`
- **Descrizione**: Popola database con utenti team
- **Test**: Status 200, utenti creati/aggiornati
- **Priorità**: 🟡 MEDIA

### 2.3 Run Migration 010
- **Endpoint**: `POST /api/auth/team/run-migration-010`
- **Descrizione**: Esegue migrazione schema team_members
- **Test**: Status 200, colonne aggiunte/verificate
- **Priorità**: 🟡 MEDIA (temporaneo)

### 2.4 Reset Admin User
- **Endpoint**: `POST /api/auth/team/reset-admin-user`
- **Descrizione**: Reset utente admin
- **Test**: Status 200
- **Priorità**: 🟢 BASSA

---

## 📋 CATEGORIA 3: Auth Router (Legacy)

### 3.1 Login (Legacy)
- **Endpoint**: `POST /api/auth/login`
- **Body**: `{"email": "...", "password": "..."}`
- **Descrizione**: Login legacy
- **Test**: Status 200, token generato
- **Priorità**: 🟡 MEDIA

### 3.2 Get Profile
- **Endpoint**: `GET /api/auth/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Profilo utente autenticato
- **Test**: Status 200, dati utente
- **Priorità**: 🟡 MEDIA

### 3.3 Logout
- **Endpoint**: `POST /api/auth/logout`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Logout utente
- **Test**: Status 200
- **Priorità**: 🟢 BASSA

### 3.4 Check Auth
- **Endpoint**: `GET /api/auth/check`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Verifica token valido
- **Test**: Status 200
- **Priorità**: 🟡 MEDIA

### 3.5 CSRF Token
- **Endpoint**: `GET /api/auth/csrf-token`
- **Descrizione**: Genera token CSRF
- **Test**: Status 200, token CSRF
- **Priorità**: 🟢 BASSA

---

## 📋 CATEGORIA 4: Knowledge & RAG

### 4.1 List Collections
- **Endpoint**: `GET /api/knowledge/collections`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Lista collezioni knowledge base
- **Test**: Status 200, array collezioni
- **Priorità**: 🟡 MEDIA

### 4.2 Knowledge Stats
- **Endpoint**: `GET /api/knowledge/stats`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Statistiche knowledge base
- **Test**: Status 200, statistiche
- **Priorità**: 🟡 MEDIA

---

## 📋 CATEGORIA 5: Chat & Streaming

### 5.1 Chat Stream (Bali Zero)
- **Endpoint**: `GET /bali-zero/chat-stream?query=<query>&user_email=<email>&conversation_history=<json>`
- **Headers**: `Authorization: Bearer <token>`, `Accept: text/event-stream`
- **Descrizione**: Stream chat SSE per Bali Zero
- **Test**: Status 200, Content-Type: text/event-stream, stream funzionante
- **Priorità**: 🔴 CRITICA

---

## 📋 CATEGORIA 6: Dashboard & Stats

### 6.1 Dashboard Stats
- **Endpoint**: `GET /api/dashboard/stats`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Statistiche dashboard generale
- **Test**: Status 200, statistiche complete
- **Priorità**: 🟡 MEDIA

---

## 📋 CATEGORIA 7: CRM - Clients

### 7.1 Create Client
- **Endpoint**: `POST /api/crm/clients`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{"name": "...", "email": "...", ...}`
- **Descrizione**: Crea nuovo cliente
- **Test**: Status 200/201, cliente creato
- **Priorità**: 🟡 MEDIA

### 7.2 List Clients
- **Endpoint**: `GET /api/crm/clients`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Lista tutti i clienti
- **Test**: Status 200, array clienti
- **Priorità**: 🟡 MEDIA

### 7.3 Get Client
- **Endpoint**: `GET /api/crm/clients/{client_id}`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Dettagli cliente specifico
- **Test**: Status 200, dati cliente
- **Priorità**: 🟡 MEDIA

### 7.4 Get Client by Email
- **Endpoint**: `GET /api/crm/clients/by-email/{email}`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Trova cliente per email
- **Test**: Status 200, dati cliente
- **Priorità**: 🟡 MEDIA

### 7.5 Update Client
- **Endpoint**: `PATCH /api/crm/clients/{client_id}`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Aggiorna cliente
- **Test**: Status 200, cliente aggiornato
- **Priorità**: 🟡 MEDIA

### 7.6 Delete Client
- **Endpoint**: `DELETE /api/crm/clients/{client_id}`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Elimina cliente
- **Test**: Status 200/204
- **Priorità**: 🟡 MEDIA

### 7.7 Get Client Summary
- **Endpoint**: `GET /api/crm/clients/{client_id}/summary`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Riepilogo completo cliente
- **Test**: Status 200, summary completo
- **Priorità**: 🟡 MEDIA

### 7.8 Clients Stats
- **Endpoint**: `GET /api/crm/clients/stats/overview`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Statistiche clienti
- **Test**: Status 200, statistiche
- **Priorità**: 🟢 BASSA

---

## 📋 CATEGORIA 8: CRM - Practices

### 8.1 Create Practice
- **Endpoint**: `POST /api/crm/practices`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Crea nuova pratica
- **Test**: Status 200/201, pratica creata
- **Priorità**: 🟡 MEDIA

### 8.2 List Practices
- **Endpoint**: `GET /api/crm/practices`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Lista tutte le pratiche
- **Test**: Status 200, array pratiche
- **Priorità**: 🟡 MEDIA

### 8.3 Get Active Practices
- **Endpoint**: `GET /api/crm/practices/active?assigned_to=<email>`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Lista pratiche attive
- **Test**: Status 200, array pratiche attive
- **Priorità**: 🟡 MEDIA

### 8.4 Get Upcoming Renewals
- **Endpoint**: `GET /api/crm/practices/renewals/upcoming?days=90`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Pratiche in scadenza
- **Test**: Status 200, array pratiche
- **Priorità**: 🟡 MEDIA

### 8.5 Get Practice
- **Endpoint**: `GET /api/crm/practices/{practice_id}`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Dettagli pratica specifica
- **Test**: Status 200, dati pratica
- **Priorità**: 🟡 MEDIA

### 8.6 Update Practice
- **Endpoint**: `PATCH /api/crm/practices/{practice_id}`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Aggiorna pratica
- **Test**: Status 200, pratica aggiornata
- **Priorità**: 🟡 MEDIA

### 8.7 Add Document to Practice
- **Endpoint**: `POST /api/crm/practices/{practice_id}/documents/add`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Aggiunge documento a pratica
- **Test**: Status 200, documento aggiunto
- **Priorità**: 🟢 BASSA

### 8.8 Practices Stats
- **Endpoint**: `GET /api/crm/practices/stats/overview`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Statistiche pratiche
- **Test**: Status 200, statistiche
- **Priorità**: 🟢 BASSA

---

## 📋 CATEGORIA 9: CRM - Interactions

### 9.1 Create Interaction
- **Endpoint**: `POST /api/crm/interactions`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Crea nuova interazione
- **Test**: Status 200/201, interazione creata
- **Priorità**: 🟡 MEDIA

### 9.2 List Interactions
- **Endpoint**: `GET /api/crm/interactions`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Lista tutte le interazioni
- **Test**: Status 200, array interazioni
- **Priorità**: 🟡 MEDIA

### 9.3 Get Interaction
- **Endpoint**: `GET /api/crm/interactions/{interaction_id}`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Dettagli interazione specifica
- **Test**: Status 200, dati interazione
- **Priorità**: 🟡 MEDIA

### 9.4 Get Client Timeline
- **Endpoint**: `GET /api/crm/interactions/client/{client_id}/timeline?limit=50`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Timeline interazioni cliente
- **Test**: Status 200, array interazioni
- **Priorità**: 🟡 MEDIA

### 9.5 Get Practice History
- **Endpoint**: `GET /api/crm/interactions/practice/{practice_id}/history`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Storico interazioni pratica
- **Test**: Status 200, array interazioni
- **Priorità**: 🟡 MEDIA

### 9.6 Interactions Stats
- **Endpoint**: `GET /api/crm/interactions/stats/overview`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Statistiche interazioni
- **Test**: Status 200, statistiche
- **Priorità**: 🟢 BASSA

### 9.7 Create Interaction from Conversation
- **Endpoint**: `POST /api/crm/interactions/from-conversation`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Crea interazione da conversazione
- **Test**: Status 200, interazione creata
- **Priorità**: 🟢 BASSA

### 9.8 Sync Gmail Interactions
- **Endpoint**: `POST /api/crm/interactions/sync-gmail`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Sincronizza interazioni da Gmail
- **Test**: Status 200, sincronizzazione completata
- **Priorità**: 🟢 BASSA

---

## 📋 CATEGORIA 10: CRM - Shared Memory

### 10.1 Search Shared Memory
- **Endpoint**: `GET /api/crm/shared-memory/search?query=<query>&...`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Ricerca nella memoria condivisa
- **Test**: Status 200, risultati ricerca
- **Priorità**: 🟡 MEDIA

### 10.2 Get Upcoming Renewals
- **Endpoint**: `GET /api/crm/shared-memory/upcoming-renewals?days=90`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Rinnovi in scadenza
- **Test**: Status 200, array rinnovi
- **Priorità**: 🟡 MEDIA

### 10.3 Get Client Full Context
- **Endpoint**: `GET /api/crm/shared-memory/client/{client_id}/full-context`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Contesto completo cliente
- **Test**: Status 200, contesto completo
- **Priorità**: 🟡 MEDIA

### 10.4 Get Team Overview
- **Endpoint**: `GET /api/crm/shared-memory/team-overview`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Panoramica team
- **Test**: Status 200, overview team
- **Priorità**: 🟢 BASSA

---

## 📋 CATEGORIA 11: Conversations

### 11.1 Save Conversation
- **Endpoint**: `POST /api/conversations/save`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Salva conversazione
- **Test**: Status 200, conversazione salvata
- **Priorità**: 🟡 MEDIA

### 11.2 Get Conversation History
- **Endpoint**: `GET /api/conversations/history?user_email=<email>&...`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Storico conversazioni
- **Test**: Status 200, array conversazioni
- **Priorità**: 🟡 MEDIA

### 11.3 Clear Conversation History
- **Endpoint**: `DELETE /api/conversations/clear?user_email=<email>&session_id=<id>`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Cancella storico conversazioni
- **Test**: Status 200
- **Priorità**: 🟢 BASSA

### 11.4 Conversation Stats
- **Endpoint**: `GET /api/conversations/stats?user_email=<email>`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Statistiche conversazioni
- **Test**: Status 200, statistiche
- **Priorità**: 🟢 BASSA

---

## 📋 CATEGORIA 12: Oracle Universal

### 12.1 Hybrid Oracle Query
- **Endpoint**: `POST /api/oracle/query`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{"query": "...", "documents": [...], ...}`
- **Descrizione**: Query Oracle ibrida
- **Test**: Status 200, risposta Oracle
- **Priorità**: 🟡 MEDIA

### 12.2 Submit User Feedback
- **Endpoint**: `POST /api/oracle/feedback`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Invia feedback utente
- **Test**: Status 200
- **Priorità**: 🟢 BASSA

### 12.3 Oracle Health Check
- **Endpoint**: `GET /api/oracle/health`
- **Descrizione**: Health check Oracle
- **Test**: Status 200
- **Priorità**: 🟢 BASSA

### 12.4 Get User Profile
- **Endpoint**: `GET /api/oracle/user/profile/{user_email}`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Profilo utente Oracle
- **Test**: Status 200, profilo utente
- **Priorità**: 🟢 BASSA

### 12.5 Test Drive Connection
- **Endpoint**: `GET /api/oracle/drive/test`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Test connessione Google Drive
- **Test**: Status 200
- **Priorità**: 🟢 BASSA

### 12.6 Get Personalities
- **Endpoint**: `GET /api/oracle/personalities`
- **Descrizione**: Lista personalità disponibili
- **Test**: Status 200, array personalità
- **Priorità**: 🟢 BASSA

### 12.7 Test Personality
- **Endpoint**: `POST /api/oracle/personality/test?personality_type=<type>&message=<msg>`
- **Descrizione**: Test personalità specifica
- **Test**: Status 200, risposta personalizzata
- **Priorità**: 🟢 BASSA

### 12.8 Test Gemini Integration
- **Endpoint**: `GET /api/oracle/gemini/test`
- **Descrizione**: Test integrazione Gemini
- **Test**: Status 200
- **Priorità**: 🟢 BASSA

---

## 📋 CATEGORIA 13: Oracle Ingest

### 13.1 Ingest Documents
- **Endpoint**: `POST /api/oracle/ingest/ingest`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Ingestione documenti Oracle
- **Test**: Status 200, documenti ingeriti
- **Priorità**: 🟡 MEDIA

### 13.2 List Collections
- **Endpoint**: `GET /api/oracle/ingest/collections`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Lista collezioni Oracle
- **Test**: Status 200, array collezioni
- **Priorità**: 🟡 MEDIA

---

## 📋 CATEGORIA 14: Search

### 14.1 Semantic Search
- **Endpoint**: `POST /api/search`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{"query": "...", ...}`
- **Descrizione**: Ricerca semantica
- **Test**: Status 200, risultati ricerca
- **Priorità**: 🟡 MEDIA

### 14.2 Search Health
- **Endpoint**: `GET /api/search/health`
- **Descrizione**: Health check search
- **Test**: Status 200
- **Priorità**: 🟢 BASSA

---

## 📋 CATEGORIA 15: Ingest

### 15.1 Upload and Ingest
- **Endpoint**: `POST /api/ingest/upload`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Body**: `file`, `title`, `author`, `tier_override`
- **Descrizione**: Upload e ingest file
- **Test**: Status 200, file ingerito
- **Priorità**: 🟡 MEDIA

### 15.2 Ingest Local File
- **Endpoint**: `POST /api/ingest/file`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Ingest file locale
- **Test**: Status 200, file ingerito
- **Priorità**: 🟡 MEDIA

### 15.3 Batch Ingest
- **Endpoint**: `POST /api/ingest/batch`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Ingest batch file
- **Test**: Status 200, batch completato
- **Priorità**: 🟢 BASSA

### 15.4 Ingest Stats
- **Endpoint**: `GET /api/ingest/stats`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Statistiche ingestione
- **Test**: Status 200, statistiche
- **Priorità**: 🟢 BASSA

---

## 📋 CATEGORIA 16: Intel

### 16.1 Search Intel
- **Endpoint**: `POST /api/intel/search`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Ricerca intel
- **Test**: Status 200, risultati intel
- **Priorità**: 🟡 MEDIA

### 16.2 Store Intel
- **Endpoint**: `POST /api/intel/store`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Salva intel
- **Test**: Status 200, intel salvato
- **Priorità**: 🟡 MEDIA

### 16.3 Get Critical Items
- **Endpoint**: `GET /api/intel/critical?category=<cat>&days=7`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Elementi critici
- **Test**: Status 200, array elementi critici
- **Priorità**: 🟡 MEDIA

### 16.4 Get Trends
- **Endpoint**: `GET /api/intel/trends?category=<cat>&days=30`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Trend intel
- **Test**: Status 200, trend
- **Priorità**: 🟢 BASSA

### 16.5 Get Collection Stats
- **Endpoint**: `GET /api/intel/stats/{collection}`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Statistiche collezione intel
- **Test**: Status 200, statistiche
- **Priorità**: 🟢 BASSA

---

## 📋 CATEGORIA 17: Memory Vector

### 17.1 Init Memory Collection
- **Endpoint**: `POST /api/memory-vector/init`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Inizializza collezione memoria
- **Test**: Status 200, collezione inizializzata
- **Priorità**: 🟡 MEDIA

### 17.2 Generate Embedding
- **Endpoint**: `POST /api/memory-vector/embed`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Genera embedding
- **Test**: Status 200, embedding generato
- **Priorità**: 🟡 MEDIA

### 17.3 Store Memory Vector
- **Endpoint**: `POST /api/memory-vector/store`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Salva memory vector
- **Test**: Status 200, memoria salvata
- **Priorità**: 🟡 MEDIA

### 17.4 Search Memories Semantic
- **Endpoint**: `POST /api/memory-vector/search`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Ricerca semantica memorie
- **Test**: Status 200, risultati ricerca
- **Priorità**: 🟡 MEDIA

### 17.5 Find Similar Memories
- **Endpoint**: `POST /api/memory-vector/similar`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Trova memorie simili
- **Test**: Status 200, memorie simili
- **Priorità**: 🟡 MEDIA

### 17.6 Delete Memory Vector
- **Endpoint**: `DELETE /api/memory-vector/{memory_id}`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Elimina memory vector
- **Test**: Status 200/204
- **Priorità**: 🟢 BASSA

### 17.7 Memory Stats
- **Endpoint**: `GET /api/memory-vector/stats`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Statistiche memory vector
- **Test**: Status 200, statistiche
- **Priorità**: 🟢 BASSA

### 17.8 Memory Vector Health
- **Endpoint**: `GET /api/memory-vector/health`
- **Descrizione**: Health check memory vector
- **Test**: Status 200
- **Priorità**: 🟢 BASSA

---

## 📋 CATEGORIA 18: Notifications

### 18.1 Get Notification Status
- **Endpoint**: `GET /api/notifications/status`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Stato notifiche
- **Test**: Status 200, stato notifiche
- **Priorità**: 🟡 MEDIA

### 18.2 List Notification Templates
- **Endpoint**: `GET /api/notifications/templates`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Lista template notifiche
- **Test**: Status 200, array template
- **Priorità**: 🟡 MEDIA

### 18.3 Send Notification
- **Endpoint**: `POST /api/notifications/send`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Invia notifica
- **Test**: Status 200, notifica inviata
- **Priorità**: 🟡 MEDIA

### 18.4 Send Template Notification
- **Endpoint**: `POST /api/notifications/send-template`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Invia notifica da template
- **Test**: Status 200, notifica inviata
- **Priorità**: 🟡 MEDIA

### 18.5 Test Notification Channels
- **Endpoint**: `POST /api/notifications/test`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Test canali notifica
- **Test**: Status 200
- **Priorità**: 🟢 BASSA

---

## 📋 CATEGORIA 19: Productivity

### 19.1 Draft Email
- **Endpoint**: `POST /api/productivity/gmail/draft`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Crea bozza email Gmail
- **Test**: Status 200, bozza creata
- **Priorità**: 🟡 MEDIA

### 19.2 Schedule Meeting
- **Endpoint**: `POST /api/productivity/calendar/schedule`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Programma meeting calendario
- **Test**: Status 200, meeting programmato
- **Priorità**: 🟡 MEDIA

### 19.3 List Events
- **Endpoint**: `GET /api/productivity/calendar/events?limit=10`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Lista eventi calendario
- **Test**: Status 200, array eventi
- **Priorità**: 🟡 MEDIA

### 19.4 Search Drive
- **Endpoint**: `GET /api/productivity/drive/search?query=<query>`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Ricerca Google Drive
- **Test**: Status 200, risultati ricerca
- **Priorità**: 🟡 MEDIA

---

## 📋 CATEGORIA 20: Agents

### 20.1 List Agent Endpoints
- **Endpoint**: `GET /api/agents/*`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Vari endpoint agenti
- **Test**: Status 200
- **Priorità**: 🟡 MEDIA

---

## 📋 CATEGORIA 21: Autonomous Agents

### 21.1 Run Conversation Trainer
- **Endpoint**: `POST /api/autonomous-agents/conversation-trainer/run?days_back=7`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Esegue conversation trainer
- **Test**: Status 200, task avviato
- **Priorità**: 🟢 BASSA

### 21.2 Run Client Value Predictor
- **Endpoint**: `POST /api/autonomous-agents/client-value-predictor/run`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Esegue client value predictor
- **Test**: Status 200, task avviato
- **Priorità**: 🟢 BASSA

### 21.3 Run Knowledge Graph Builder
- **Endpoint**: `POST /api/autonomous-agents/knowledge-graph-builder/run`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Esegue knowledge graph builder
- **Test**: Status 200, task avviato
- **Priorità**: 🟢 BASSA

---

## 📋 CATEGORIA 22: Handlers

### 22.1 List All Handlers
- **Endpoint**: `GET /api/handlers/list`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Lista tutti gli handler disponibili
- **Test**: Status 200, array handler
- **Priorità**: 🟡 MEDIA

### 22.2 Search Handlers
- **Endpoint**: `GET /api/handlers/search?query=<query>`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Ricerca handler
- **Test**: Status 200, risultati ricerca
- **Priorità**: 🟢 BASSA

### 22.3 Get Handlers by Category
- **Endpoint**: `GET /api/handlers/category/{category}`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Handler per categoria
- **Test**: Status 200, array handler
- **Priorità**: 🟢 BASSA

---

## 📋 CATEGORIA 23: Team Activity

### 23.1 Clock In
- **Endpoint**: `POST /api/team-activity/clock-in`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Registra ingresso
- **Test**: Status 200, ingresso registrato
- **Priorità**: 🟡 MEDIA

### 23.2 Clock Out
- **Endpoint**: `POST /api/team-activity/clock-out`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Registra uscita
- **Test**: Status 200, uscita registrata
- **Priorità**: 🟡 MEDIA

### 23.3 Get My Status
- **Endpoint**: `GET /api/team-activity/my-status?user_id=<id>`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Stato personale utente
- **Test**: Status 200, stato utente
- **Priorità**: 🟡 MEDIA

### 23.4 Get Team Status
- **Endpoint**: `GET /api/team-activity/status`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Stato team completo
- **Test**: Status 200, array stati team
- **Priorità**: 🟡 MEDIA

### 23.5 Get Daily Hours
- **Endpoint**: `GET /api/team-activity/hours?...`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Ore giornaliere
- **Test**: Status 200, array ore
- **Priorità**: 🟢 BASSA

### 23.6 Get Weekly Summary
- **Endpoint**: `GET /api/team-activity/activity/weekly?...`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Riepilogo settimanale
- **Test**: Status 200, summary settimanale
- **Priorità**: 🟢 BASSA

### 23.7 Get Monthly Summary
- **Endpoint**: `GET /api/team-activity/activity/monthly?...`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Riepilogo mensile
- **Test**: Status 200, summary mensile
- **Priorità**: 🟢 BASSA

### 23.8 Export Timesheet
- **Endpoint**: `GET /api/team-activity/export?...`
- **Headers**: `Authorization: Bearer <token>`
- **Descrizione**: Esporta timesheet
- **Test**: Status 200, file esportato
- **Priorità**: 🟢 BASSA

### 23.9 Team Activity Health
- **Endpoint**: `GET /api/team-activity/health`
- **Descrizione**: Health check team activity
- **Test**: Status 200
- **Priorità**: 🟢 BASSA

---

## 📋 CATEGORIA 24: Media

### 24.1 Generate Image
- **Endpoint**: `POST /api/media/generate-image`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{...}`
- **Descrizione**: Genera immagine
- **Test**: Status 200, immagine generata
- **Priorità**: 🟢 BASSA

---

## 📋 CATEGORIA 25: Frontend - Next.js Routes

### 25.1 Login Page
- **URL**: `GET /` o `GET /login`
- **Descrizione**: Pagina login frontend
- **Test**: Pagina renderizza correttamente, form visibile
- **Priorità**: 🔴 CRITICA

### 25.2 Login API Route
- **Endpoint**: `POST /api/auth/login` (Next.js route handler)
- **Body**: `{"email": "...", "pin": "..."}`
- **Descrizione**: Proxy login a backend
- **Test**: Status 200, token restituito
- **Priorità**: 🔴 CRITICA

### 25.3 Chat Page
- **URL**: `GET /chat`
- **Descrizione**: Pagina chat frontend
- **Test**: Pagina renderizza correttamente, interfaccia chat visibile
- **Priorità**: 🔴 CRITICA

### 25.4 Chat Stream API Route
- **Endpoint**: `GET /api/chat/stream` (Next.js route handler)
- **Query**: `message`, `history`, `user_email`
- **Descrizione**: Proxy chat stream a backend
- **Test**: Status 200, stream SSE funzionante
- **Priorità**: 🔴 CRITICA

### 25.5 Dashboard Page
- **URL**: `GET /dashboard`
- **Descrizione**: Pagina dashboard frontend
- **Test**: Pagina renderizza correttamente, statistiche visualizzate
- **Priorità**: 🟡 MEDIA

### 25.6 Dashboard Stats API Route
- **Endpoint**: `GET /api/dashboard/stats` (Next.js route handler)
- **Descrizione**: Proxy dashboard stats a backend
- **Test**: Status 200, statistiche restituite
- **Priorità**: 🟡 MEDIA

---

## 📊 Riepilogo Totale

- **Totale Endpoint Backend**: ~125+
- **Totale Endpoint Frontend**: ~6
- **Totale Categorie**: 25

### Priorità
- 🔴 **CRITICA**: 8 endpoint
- 🟡 **MEDIA**: ~70 endpoint
- 🟢 **BASSA**: ~50 endpoint

---

## 📝 Note

- Tutti gli endpoint richiedono backend online (`https://nuzantara-rag.fly.dev`)
- Per test locali, usa `http://localhost:8000` (backend) e `http://localhost:3000` (frontend)
- Token valido necessario per endpoint protetti (tranne health check)
- Alcuni endpoint potrebbero non esistere (404 OK per test)
- Frontend disponibile su `https://zantara.balizero.com` o `https://nuzantara-webapp-next.fly.dev`

