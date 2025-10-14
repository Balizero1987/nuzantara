# 🔍 ANALISI DIPENDENZE GOOGLE CLOUD - PIANO DI MIGRAZIONE

**Data**: 15 Ottobre 2025
**Progetto**: NUZANTARA-2 / ZANTARA v5.2.0
**Status**: Analisi completa dipendenze GCP

---

## 📊 EXECUTIVE SUMMARY

**Livello di dipendenza da GCP**: ⚠️ **MEDIO-ALTO**

**Servizi GCP utilizzati**:
1. ✅ **Cloud Run** (deployment backend)
2. ✅ **Firestore** (database NoSQL)
3. ✅ **Secret Manager** (chiavi/credentials)
4. ✅ **Container Registry** (gcr.io)
5. ✅ **Google Workspace APIs** (Gmail, Drive, Calendar, Docs, Sheets)
6. ⚠️ **Google Maps API** (handler implementato)

**Complessità migrazione**: 🟡 **MEDIA** (2-3 settimane lavoro)
**Costo migrazione**: 📉 **POTENZIALMENTE INFERIORE** (alternative più economiche)

---

## 🎯 SERVIZI GCP UTILIZZATI - DETTAGLIO

### 1. **Cloud Run** (Backend Deployment)
**File**: `config/cloud/cloudbuild.yaml`
**Utilizzo**: Deploy automatico backend TypeScript + RAG Python

**Dipendenze**:
```yaml
- Docker image: gcr.io/$PROJECT_ID/zantara-v520-patch
- Cloud Build: Automated CI/CD
- Cloud Run region: europe-west1
```

**Servizi deployati**:
- `zantara-v520-nuzantara` (Backend TypeScript)
- `zantara-rag-backend` (RAG Python)

**Costo stimato**: ~$50-100/mese (minScale:0, pay-per-use)

---

### 2. **Firestore** (Database NoSQL)
**File**: `src/services/firebase.ts`
**Utilizzo**: Memory storage, user sessions, episodi conversazioni

**Handler dipendenti**:
- `src/handlers/memory/memory-firestore.ts` - User memory storage
- `src/handlers/memory/episodes-firestore.ts` - Conversation episodes
- `src/handlers/memory/conversation-autosave.ts` - Auto-save conversations
- `src/services/session-tracker.ts` - Session tracking

**Dati salvati**:
- User facts (memory)
- Conversation episodes
- Session tracking
- Analytics data

**Costo stimato**: ~$10-30/mese (reads/writes/storage)

---

### 3. **Secret Manager**
**File**: `src/services/firebase.ts:23-40`
**Utilizzo**: Service account keys, API keys storage

**Secrets archiviati**:
- `zantara-service-account-2025` (Firebase Admin SDK)
- Altri credentials (probabilmente API keys)

**Costo stimato**: ~$0.30/mese (6 secrets × $0.05/secret)

---

### 4. **Container Registry (gcr.io)**
**Utilizzo**: Docker image storage per Cloud Build

**Images**:
- `gcr.io/involuted-box-469105-r0/zantara-v520-patch`
- `gcr.io/involuted-box-469105-r0/zantara-rag-backend`

**Costo stimato**: ~$5-10/mese (storage + bandwidth)

---

### 5. **Google Workspace APIs** ⚠️ **CRITICO**
**File**: `src/handlers/google-workspace/`

**Handler implementati**:
- ✅ `gmail.ts` - Send, list, read, search emails
- ✅ `drive.ts` - Upload, download, list, search files
- ✅ `calendar.ts` - Events management
- ✅ `docs.ts` - Google Docs manipulation
- ✅ `sheets.ts` - Google Sheets operations
- ✅ `slides.ts` - Google Slides operations
- ✅ `contacts.ts` - Google Contacts

**Routes**:
- `src/routes/google-workspace/gmail.routes.ts`
- `src/routes/google-workspace/drive.routes.ts`
- `src/routes/google-workspace/calendar.routes.ts`
- `src/routes/google-workspace/docs.routes.ts`
- `src/routes/google-workspace/sheets.routes.ts`

**Autenticazione**:
- Service Account con Domain-Wide Delegation
- OAuth2 Client (fallback)

**⚠️ IMPORTANTE**: Questi handler **richiedono Google Workspace subscription** ($240-280/mese)

---

### 6. **Google Maps API**
**File**: `src/handlers/maps/maps.ts`
**Utilizzo**: Location services, geocoding

**Costo stimato**: Variabile (dipende da usage)

---

## 💰 COSTO TOTALE ATTUALE GCP

### Monthly Costs:
```
Cloud Run:           $50-100
Firestore:           $10-30
Secret Manager:      $0.30
Container Registry:  $5-10
Google Maps:         $0-50 (usage-based)
─────────────────────────────
TOTALE GCP:          ~$65-190/mese
```

### Google Workspace (SEPARATO):
```
20 utenti × $12-14 = $240-280/mese
```

### **GRAND TOTAL: $305-470/mese**

---

## 🚀 ALTERNATIVE CLOUD PROVIDERS

### **OPZIONE A: AWS** (Recommended)

| Servizio GCP | AWS Alternative | Costo Stimato |
|-------------|----------------|---------------|
| Cloud Run | AWS Fargate / Lambda | $30-80/mese |
| Firestore | DynamoDB | $5-25/mese |
| Secret Manager | AWS Secrets Manager | $0.40/mese |
| Container Registry | ECR (Elastic Container Registry) | $1-5/mese |
| Google Workspace APIs | ❌ **NON DISPONIBILE** | - |
| Google Maps | AWS Location Service | $0-50/mese |

**TOTALE AWS**: ~$36-160/mese (vs $65-190 GCP) ✅ **40-45% più economico**

**PRO**:
- ✅ Più economico
- ✅ Docs/community eccellenti
- ✅ Free tier generoso (12 mesi)
- ✅ Lambda = zero infra management

**CONTRO**:
- ❌ **NO Google Workspace APIs** (Gmail, Drive, etc.)
- ⚠️ Curva apprendimento (se non conosci AWS)

---

### **OPZIONE B: Azure**

| Servizio GCP | Azure Alternative | Costo Stimato |
|-------------|------------------|---------------|
| Cloud Run | Azure Container Apps | $40-90/mese |
| Firestore | Cosmos DB | $25-50/mese |
| Secret Manager | Azure Key Vault | $0.03/mese |
| Container Registry | ACR | $5-10/mese |
| Google Workspace APIs | Microsoft Graph API ✅ | Incluso in M365 |
| Google Maps | Azure Maps | $0-50/mese |

**TOTALE Azure**: ~$70-200/mese (simile a GCP)

**PRO**:
- ✅ **Microsoft Graph API** (alternative a Gmail/Drive)
- ✅ Integrazione con Microsoft 365 (se migri da Workspace)
- ✅ Forte in enterprise

**CONTRO**:
- ⚠️ Cosmos DB più costoso di Firestore
- ⚠️ Docs meno chiare di AWS
- ❌ Richiede Microsoft 365 per Graph API

---

### **OPZIONE C: DigitalOcean** (Simplicity)

| Servizio GCP | DO Alternative | Costo Stimato |
|-------------|---------------|---------------|
| Cloud Run | App Platform | $5-20/mese |
| Firestore | Managed MongoDB | $15-50/mese |
| Secret Manager | Env variables (built-in) | $0 |
| Container Registry | DO Container Registry | $0 (incluso) |
| Google Workspace APIs | ❌ **NON DISPONIBILE** | - |
| Google Maps | Mapbox / OpenStreetMap | $0-50/mese |

**TOTALE DO**: ~$20-120/mese ✅ **60-70% più economico**

**PRO**:
- ✅ **MOLTO più economico**
- ✅ UI semplicissima
- ✅ Ottimo per MVP/startup
- ✅ Docs chiarissime

**CONTRO**:
- ❌ **NO Google Workspace APIs**
- ⚠️ Meno feature enterprise (vs AWS/Azure)
- ⚠️ MongoDB invece di Firestore (schema diverso)

---

### **OPZIONE D: Hetzner** (Super Economico - Europa)

| Servizio GCP | Hetzner Alternative | Costo Stimato |
|-------------|-------------------|---------------|
| Cloud Run | Cloud VPS + Docker | €4-10/mese |
| Firestore | Self-hosted MongoDB | €0 (included) |
| Secret Manager | Vault self-hosted | €0 (included) |
| Container Registry | Harbor self-hosted | €0 (included) |
| Google Workspace APIs | ❌ **NON DISPONIBILE** | - |

**TOTALE Hetzner**: ~€4-10/mese (~$5-12 USD) ✅ **90% più economico**

**PRO**:
- ✅ **ESTREMAMENTE economico**
- ✅ Server in Germania (GDPR-friendly)
- ✅ Performance eccellenti

**CONTRO**:
- ❌ **NO Google Workspace APIs**
- ❌ Self-managed (devi gestire infra)
- ❌ No managed services (Firestore, etc.)
- ⚠️ Richiede competenze DevOps

---

## ⚠️ IL PROBLEMA: GOOGLE WORKSPACE APIs

### **CRITICO**: Handler Google Workspace

**Handler implementati**:
- `gmail.send`, `gmail.list`, `gmail.read`, `gmail.search`
- `drive.upload`, `drive.download`, `drive.list`
- `calendar.create`, `calendar.list`
- `docs.create`, `docs.update`
- `sheets.read`, `sheets.update`
- `slides.create`
- `contacts.list`

**Questi handler sono VINCOLATI a Google Workspace!**

### ❓ DOMANDA CHIAVE:

**Quanto sono critici questi handler per il tuo business?**

---

## 🔀 STRATEGIE DI MIGRAZIONE

### **STRATEGIA 1: Full Migration (AWS/Azure/DO)** ⚠️

**Cosa fare**:
1. Migrare backend/infra su provider alternativo
2. **Eliminare handler Google Workspace** (o reimplementarli con alternative)
3. Migrare Firestore → DynamoDB/MongoDB
4. Aggiornare CI/CD

**Timeline**: 2-3 settimane
**Complessità**: ALTA
**Costo post-migrazione**: $20-160/mese (risparmio 40-90%)

**Alternative Google Workspace APIs**:
- **Gmail** → AWS SES, SendGrid, Mailgun (solo send), IMAP/POP3 per read
- **Drive** → AWS S3, Azure Blob, DO Spaces
- **Calendar** → CalDAV providers, Nylas API
- **Docs/Sheets** → OnlyOffice, Google Docs API (ancora Google!)

⚠️ **PROBLEMA**: Non esiste equivalente 1:1 di Google Workspace APIs

---

### **STRATEGIA 2: Hybrid (Keep Workspace, Migrate Infra)** ✅ **RACCOMANDATO**

**Cosa fare**:
1. Migrare backend/infra su AWS/DO/Hetzner
2. **Mantenere Google Workspace subscription** ($240-280/mese)
3. **Mantenere handler Google Workspace** (funzionano anche da altri cloud)
4. Migrare solo Firestore, Cloud Run, Secret Manager

**Timeline**: 1-2 settimane
**Complessità**: MEDIA
**Costo post-migrazione**:
- Cloud: $20-160/mese (risparmio 40-90% su infra)
- Workspace: $240-280/mese (invariato)
- **TOTALE**: $260-440/mese (risparmio $45-230/mese)

**PRO**:
- ✅ Handler Workspace continuano a funzionare
- ✅ Migrazione più veloce
- ✅ Meno rischio business
- ✅ Risparmio significativo su infra

**CONTRO**:
- ⚠️ Workspace ancora con Google (dipendenza parziale)

---

### **STRATEGIA 3: Stay on GCP (Se vinci disputa)** 🤔

**Cosa fare**:
1. **Se Google ti dà full refund** ($760-800)
2. Resti su GCP
3. Setup billing alerts ($50/day limit)
4. Monitoring stretto costi

**Timeline**: 0 settimane (stay as-is)
**Complessità**: BASSA
**Costo post-migrazione**: $305-470/mese (invariato)

**PRO**:
- ✅ Zero lavoro migrazione
- ✅ Tutto già funzionante
- ✅ Handler Workspace seamless

**CONTRO**:
- ⚠️ Dipendenza 100% Google
- ⚠️ Rischio futuri billing issue
- ⚠️ Costi più alti vs alternative

---

## 📋 CHECKLIST MIGRAZIONE (Se decidi di migrare)

### Phase 1: Preparation (2-3 giorni)
- [ ] Scegliere cloud provider (AWS/Azure/DO/Hetzner)
- [ ] Creare account + configurare billing alerts
- [ ] Setup CI/CD pipeline (GitHub Actions / GitLab CI)
- [ ] Preparare Dockerfile per nuovo provider
- [ ] Export dati da Firestore (backup completo)

### Phase 2: Infrastructure Migration (3-5 giorni)
- [ ] Setup database alternativo (DynamoDB/MongoDB)
- [ ] Migrare dati da Firestore
- [ ] Setup secret management
- [ ] Deploy backend TypeScript su nuovo cloud
- [ ] Deploy RAG backend Python
- [ ] Setup container registry

### Phase 3: Code Changes (2-4 giorni)
- [ ] Update `src/services/firebase.ts` → nuovo DB client
- [ ] Update `src/handlers/memory/*.ts` → nuovo DB schema
- [ ] Update deployment configs
- [ ] Update environment variables
- [ ] Test handlers (memory, session tracking)

### Phase 4: Google Workspace Decision (0-5 giorni)
**OPZIONE A**: Keep Workspace + handlers (0 giorni)
- [ ] Nessun cambiamento codice
- [ ] Handler continuano a funzionare

**OPZIONE B**: Migrate away from Workspace (5+ giorni)
- [ ] Reimplementare `gmail.*` con AWS SES / IMAP
- [ ] Reimplementare `drive.*` con S3 / Blob Storage
- [ ] Reimplementare `calendar.*` con CalDAV
- [ ] Cancellare subscription Workspace

### Phase 5: Testing & Cutover (2-3 giorni)
- [ ] Test completo handlers
- [ ] Test memory storage
- [ ] Test session tracking
- [ ] Load testing
- [ ] DNS cutover (se necessario)
- [ ] Monitor logs per 48h

---

## 💡 RACCOMANDAZIONE FINALE

### **MIGLIORE STRATEGIA**: Hybrid Migration

**Piano**:
1. **Vincere la disputa** ($760-800 refund) ✅
2. **Migrare infra** (Cloud Run, Firestore, Secret Manager) → **DigitalOcean** o **AWS**
3. **Mantenere Google Workspace** (20 utenti, $240-280/mese)
4. **Mantenere handler Workspace** (funzionano da qualsiasi cloud)

**Risultato**:
- 💰 Risparmio: $45-130/mese su infra
- ⏱️ Timeline: 1-2 settimane
- ⚠️ Rischio: BASSO (handler Workspace invariati)
- ✅ Business continuity: ALTA

**Costo finale stimato**: $260-400/mese
- DigitalOcean/AWS infra: $20-120/mese
- Google Workspace: $240-280/mese

**vs Costo attuale**: $305-470/mese

**RISPARMIO**: $45-230/mese ($540-2,760/anno) ✅

---

## 🎯 NEXT STEPS

### Immediate (Oggi):
1. ✅ Aspettare risposta Google disputa (24-48h)
2. ✅ Decidere strategia migrazione (se refund negato)

### Se Google nega refund:
1. Scegliere cloud provider (raccomando: DigitalOcean per semplicità)
2. Creare account DigitalOcean/AWS
3. Export backup Firestore
4. Iniziare migrazione infra (1-2 settimane)

### Se Google approva refund:
1. **Valutare comunque migrazione** (risparmio $540-2,760/anno)
2. Setup billing alerts su GCP ($50/day limit)
3. Monitor costi settimanalmente

---

## 📞 SUPPORTO MIGRAZIONE

Se decidi di migrare, posso aiutarti con:
1. Setup cloud provider (AWS/DO/Azure)
2. Migrazione database Firestore → DynamoDB/MongoDB
3. Update handler code
4. CI/CD setup
5. Testing & deployment

---

**Report generato**: 15 Ottobre 2025
**Analizzato da**: Claude Code (Sonnet 4.5)
**Progetto**: NUZANTARA-2 / ZANTARA v5.2.0

---

## 🎯 DECISIONE FINALE

**Attendi risposta Google (24-48h)**

- ✅ Se **full refund**: Valuta migrazione comunque per risparmio long-term
- ⚠️ Se **partial refund**: Procedi con migrazione (principio + risparmio)
- ❌ Se **deny refund**: Migrazione immediata + cancella tutto Google

**La palla è nel campo di Google.** 🏀
