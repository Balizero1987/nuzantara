# ZANTARA v3 Ω - SERVIZI COMPLETI AGGIORNATO

## 🏗️ ARCHITETTURA FINALE

### 1. nuzantara-rag (Backend RAG)
**URL**: https://nuzantara-rag.fly.dev  
**Status**: ✅ ATTIVO - Knowledge Base Completa (25.416 documenti)

#### Collections Database:
- **knowledge_base**: 8.923 docs (Blockchain, Whitepaper)
- **kbli_unified**: 8.887 docs (KBLI Indonesia)
- **legal_unified**: 5.041 docs (Leggi Indonesia PP, UU)
- **visa_oracle**: 1.612 docs (Visto/Immigrazione)
- **tax_genius**: 895 docs (Tassazione Indonesia)
- **property_unified**: 29 docs (Property Investments)
- **bali_zero_pricing**: 29 docs (Pricing Zantara)

#### API Endpoints:
```
GET  /health                     - Health Check
GET  /                          - Root Status
GET  /collections               - Lista tutte le collezioni
GET  /collections/{name}        - Dettagli collezione
POST /collections/{name}/query  - RAG Query su collezione
POST /query                     - Query multi-collezione
GET  /docs                      - Documentazione API
```

### 2. nuzantara-backend (TypeScript Main Backend)
**URL**: https://nuzantara-backend.fly.dev  
**Status**: ✅ ATTIVO - 38 Endpoints Completi  
**Engine**: Node.js 20 + Express + TypeScript

#### 🚀 38 API ENDPOINTS COMPLETI:

**AUTHENTICATION & USER MANAGEMENT**
```
POST /api/auth/register              - Registrazione utente
POST /api/auth/login                 - Login utente
POST /api/auth/logout                - Logout
POST /api/auth/refresh               - Refresh token
GET  /api/auth/profile               - Profilo utente
PUT  /api/auth/profile               - Aggiorna profilo
POST /api/auth/forgot-password       - Password dimenticata
POST /api/auth/reset-password        - Reset password
GET  /api/auth/verify-email/:token   - Verifica email
```

**AI & KNOWLEDGE BASE**
```
POST /api/ai/chat                    - Chat AI (Claude/GPT)
POST /api/ai/rag-query               - RAG Query su knowledge base
GET  /api/ai/models                  - Lista modelli AI disponibili
POST /api/ai/embed                   - Genera embeddings
POST /api/ai/completions             - Completamenti testo
```

**BUSINESS LOGIC**
```
GET  /api/business/kbli              - KBLI categories
POST /api/business/kbli-search       - Ricerca KBLI
GET  /api/business/legal-requirements - Requisiti legali
POST /api/business/license-check      - Verifica licenze
GET  /api/business/compliance        - Compliance check
POST /api/business/risk-assessment   - Risk assessment
```

**FINANCE & PRICING**
```
GET  /api/pricing/plans              - Piani disponibili
POST /api/pricing/calculate          - Calcolo prezzi
GET  /api/pricing/subscription       - Stato abbonamento
POST /api/pricing/upgrade            - Upgrade piano
GET  /api/pricing/invoice/:id        - Dettaglio fattura
```

**ADMIN & SYSTEM**
```
GET  /api/admin/users                - Lista utenti
POST /api/admin/users/:id/ban        - Ban utente
GET  /api/admin/analytics            - Analytics sistema
POST /api/admin/maintenance          - Modalità manutenzione
GET  /api/admin/logs                 - Logs sistema
POST /api/admin/backup               - Backup dati
```

**UTILITY**
```
GET  /api/utils/health               - Health check completo
POST /api/utils/upload               - Upload file
GET  /api/utils/download/:id         - Download file
POST /api/utils/validate             - Validazione dati
GET  /api/utils/version              - Versione sistema
```

### 3. nuzantara-webapp (Frontend React)
**URL**: https://nuzantara.fly.dev  
**Status**: ✅ ATTIVO - Interfaccia Utente Completa

### 4. Database & Storage
- **ChromaDB**: 25.416 embeddings (161 MB)
- **PostgreSQL**: Utenti, sessioni, analytics
- **Redis Cache**: Session management
- **Cloudflare R2**: Backup knowledge base

## 🔗 CONNESSIONI TRA SERVIZI

```
nuzantara-webapp ↔ nuzantara-backend (38 endpoints)
      ↕
nuzantara-backend ↔ nuzantara-rag (RAG queries)
      ↕
    PostgreSQL + Redis + ChromaDB
```

## 📊 STATO FINALE
- ✅ **2 servizi principali** (backend + rag) 
- ✅ **1 frontend** (webapp)
- ✅ **38 endpoints** completi
- ✅ **25.416 documenti** knowledge base
- ❌ **nuzantara-core** RIMOSSO (duplicato)

**TOTALE: 2 backend + 1 frontend = ARCHITETTURA COMPLETA** 🚀