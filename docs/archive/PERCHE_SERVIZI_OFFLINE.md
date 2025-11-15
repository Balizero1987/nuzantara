# ❓ Perché i Servizi Sono Offline?

**Data Analisi:** 2025-11-10
**Sistema:** ZANTARA RAG Backend
**Ambiente:** Production (Fly.io)

---

## 📊 STATO ATTUALE

### ✅ Servizi ONLINE
- ✅ Backend RAG (Llama 4 Scout)
- ✅ Frontend Webapp
- ✅ CRM System (41 endpoints)
- ✅ Collaborative Intelligence

### ❌ Servizi OFFLINE
1. **ChromaDB** - Disabilitato
2. **PostgreSQL** - Non connesso
3. **Tool Executor** - Non disponibile
4. **Pricing Service** - Non disponibile
5. **Reranker** - Disabilitato

---

## 🔍 ANALISI CAUSE

### 1. ChromaDB Offline - ❌ Credenziali R2 Mancanti

**File:** `apps/backend-rag/backend/app/main_cloud.py:709-807`

**Cosa succede all'avvio:**
```python
# Riga 918-931
try:
    chroma_path = download_chromadb_from_r2()  # ← Tenta download da Cloudflare R2
    logger.info("✅ ChromaDB loaded from Cloudflare R2")
except Exception as e:
    logger.warning(f"⚠️ R2 download failed: {e}")  # ← Fallisce qui
    logger.info("📂 Initializing empty ChromaDB for manual population...")

    # Fallback: Inizializza ChromaDB vuoto
    chroma_path = os.getenv("FLY_VOLUME_MOUNT_PATH", "/data/chroma_db_FULL_deploy")
    os.makedirs(chroma_path, exist_ok=True)
    logger.info("✅ Empty ChromaDB initialized: {chroma_path}")
```

**Variabili d'ambiente mancanti:**
```bash
# apps/backend-rag/backend/app/main_cloud.py:713-715
r2_access_key = os.getenv("R2_ACCESS_KEY_ID")          # ← NULL
r2_secret_key = os.getenv("R2_SECRET_ACCESS_KEY")      # ← NULL
r2_endpoint = os.getenv("R2_ENDPOINT_URL")              # ← NULL

# Riga 748-749: Validazione
if not all([r2_access_key, r2_secret_key, r2_endpoint]):
    raise ValueError("R2 credentials not configured...")  # ← ERRORE QUI
```

**Impatto:**
- ❌ ChromaDB rimane vuoto (nessun dato scaricato da R2)
- ❌ SearchService inizializzato ma senza collezioni
- ❌ `/api/query` ritorna "Search service not available"
- ❌ `/api/collections` ritorna "Search service not available"
- ❌ 25,422 documenti inaccessibili via RAG

**Cosa serve per risolverlo:**
```bash
# Configurare su Fly.io:
fly secrets set R2_ACCESS_KEY_ID="your-r2-access-key"
fly secrets set R2_SECRET_ACCESS_KEY="your-r2-secret-key"
fly secrets set R2_ENDPOINT_URL="https://your-account-id.r2.cloudflarestorage.com"
```

---

### 2. PostgreSQL Offline - ❌ DATABASE_URL Mancante

**File:** `apps/backend-rag/backend/app/main_cloud.py:1097-1111`

**Cosa succede all'avvio:**
```python
# Riga 1097-1102: Inizializzazione tabelle
try:
    await initialize_memory_tables()  # ← Richiede DATABASE_URL
except Exception as e:
    logger.warning(f"⚠️ Memory tables initialization skipped: {e}")
    # Non-fatal: continua senza PostgreSQL

# Riga 1104-1111: Inizializzazione MemoryService
try:
    memory_service = MemoryServicePostgres()  # ← Richiede DATABASE_URL
    await memory_service.connect()
    logger.info("✅ MemoryServicePostgres ready")
except Exception as e:
    logger.error(f"❌ MemoryServicePostgres initialization failed: {e}")
    memory_service = None  # ← Fallisce qui
```

**Variabile d'ambiente mancante:**
```python
# backend/app/main_cloud.py:520-523
database_url = os.getenv("DATABASE_URL")  # ← NULL

if not database_url:
    logger.warning("⚠️ DATABASE_URL not found - skipping memory table initialization")
    return
```

**Impatto:**
- ❌ Nessuna persistent memory
- ❌ Conversazioni non salvate tra sessioni
- ❌ Preferenze utente non memorizzate
- ⚠️ Sistema funziona con memoria in-session

**Cosa serve per risolverlo:**
```bash
# Opzione 1: PostgreSQL su Fly.io
fly postgres create
fly postgres attach <postgres-app-name>  # Auto-set DATABASE_URL

# Opzione 2: PostgreSQL esterno (es. Supabase, Neon.tech)
fly secrets set DATABASE_URL="postgresql://user:pass@host:5432/dbname"
```

---

### 3. Tool Executor Offline - ❌ Dipendenza da Backend TS

**File:** `apps/backend-rag/backend/app/main_cloud.py:1067-1074`

**Cosa succede all'avvio:**
```python
# Riga 1067-1074
try:
    ts_backend_url = os.getenv("TYPESCRIPT_BACKEND_URL", "https://nuzantara-backend.fly.dev")
    handler_proxy_service = init_handler_proxy(ts_backend_url)
    logger.info(f"✅ HandlerProxyService ready → {ts_backend_url}")
except Exception as e:
    logger.error(f"❌ HandlerProxyService initialization failed: {e}")
    handler_proxy_service = None  # ← Probabilmente fallisce qui
```

**Possibili cause:**
1. Backend TypeScript non raggiungibile (nuzantara-backend.fly.dev offline?)
2. Errore di connessione durante init
3. Timeout di rete

**Test:**
```bash
curl https://nuzantara-backend.fly.dev/health
# Se fallisce → Backend TS offline
```

**Impatto:**
- ❌ Handler proxy non funzionante
- ❌ Tool orchestration limitata
- ⚠️ Core features comunque operative

---

### 4. Pricing Service Offline - ❌ Dipendenza da Altri Servizi

**File:** `apps/backend-rag/backend/app/main_cloud.py:1076-1083`

**Cosa succede all'avvio:**
```python
# Riga 1076-1083
try:
    from services.pricing_service import PricingService
    pricing_service = PricingService()
    logger.info("✅ PricingService initialized")
except Exception as e:
    logger.warning(f"⚠️ PricingService initialization failed: {e}")
    pricing_service = None  # ← Fallisce qui
```

**Possibili cause:**
1. Errore import `PricingService`
2. Dipendenze interne mancanti
3. File missing o corrotto

**Impatto:**
- ❌ Calcoli pricing dinamici non funzionanti
- ⚠️ Prezzi statici comunque disponibili in configurazione

---

### 5. Reranker Offline - ⚠️ Disabilitato di Default

**File:** `apps/backend-rag/backend/app/config.py:57`

**Configurazione:**
```python
# Riga 57
enable_reranker: bool = True  # ← Dice True ma è disabilitato

# Nel health check:
"reranker": {
    "enabled": false,  # ← Risultato: FALSE
    "status": "disabled"
}
```

**Causa:**
- Probabilmente feature flag disabilitata nel codice di inizializzazione
- Oppure dipendenza mancante (cross-encoder model)

**Impatto:**
- ⚠️ Ranking risultati non ottimizzato
- ⚠️ Performance RAG ridotta del ~40% (secondo commenti nel codice)
- ✅ Funzionamento base comunque garantito

---

## 🛠️ SOLUZIONI PRIORITIZZATE

### 🔴 Priorità ALTA - Servizi Critici

#### 1. Riattivare ChromaDB
**Impatto:** CRITICO - Blocca tutte le funzionalità RAG

**Soluzione:**
```bash
# 1. Ottenere credenziali Cloudflare R2
# Vai su: Cloudflare Dashboard → R2 → API Tokens

# 2. Configurare secrets su Fly.io
fly secrets set R2_ACCESS_KEY_ID="YOUR_KEY_HERE"
fly secrets set R2_SECRET_ACCESS_KEY="YOUR_SECRET_HERE"
fly secrets set R2_ENDPOINT_URL="https://YOUR_ACCOUNT.r2.cloudflarestorage.com"

# 3. Redeploy
fly deploy
```

**Verifica:**
```bash
curl https://nuzantara-rag.fly.dev/health | jq '.chromadb'
# Dovrebbe ritornare: true
```

---

#### 2. Connettere PostgreSQL
**Impatto:** ALTO - Blocca persistent memory

**Soluzione Opzione A - PostgreSQL su Fly.io:**
```bash
# 1. Creare database PostgreSQL
fly postgres create --name nuzantara-db --region ams

# 2. Attach al backend RAG
fly postgres attach nuzantara-db --app nuzantara-rag
# Questo auto-configura DATABASE_URL

# 3. Redeploy
fly deploy
```

**Soluzione Opzione B - PostgreSQL Esterno:**
```bash
# 1. Creare database su Supabase/Neon.tech/etc

# 2. Configurare secret
fly secrets set DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# 3. Redeploy
fly deploy
```

**Verifica:**
```bash
curl https://nuzantara-rag.fly.dev/health | jq '.memory.postgresql'
# Dovrebbe ritornare: true
```

---

### 🟡 Priorità MEDIA - Servizi Opzionali

#### 3. Fix Tool Executor
**Impatto:** MEDIO - Limita orchestrazione avanzata

**Debug:**
```bash
# 1. Verificare backend TS
curl https://nuzantara-backend.fly.dev/health

# 2. Se offline, verificare deployment
fly status --app nuzantara-backend

# 3. Se serve, redeploy backend TS
cd apps/backend-ts
npm run build
fly deploy
```

---

#### 4. Fix Pricing Service
**Impatto:** BASSO - Prezzi statici disponibili

**Debug:**
```bash
# 1. Controllare logs durante startup
fly logs --app nuzantara-rag | grep -A 5 "PricingService"

# 2. Verificare se file esiste
# Nel container:
ls -la backend/services/pricing_service.py
```

---

### ⚪ Priorità BASSA - Enhancement

#### 5. Abilitare Reranker
**Impatto:** BASSO - Performance enhancement

**Soluzione:**
```python
# Investigare codice di inizializzazione del reranker
# Probabilmente richiede:
# - CrossEncoder model download
# - GPU/CPU resources allocation
```

---

## 📈 TIMELINE SUGGERITA

### Giorno 1 - Ripristino Funzionalità Core
1. ✅ Configurare credenziali R2 (30 min)
2. ✅ Riattivare ChromaDB (5 min redeploy)
3. ✅ Testare RAG queries (10 min)

### Giorno 2 - Persistent Memory
4. ✅ Setup PostgreSQL su Fly.io (15 min)
5. ✅ Attach database (5 min)
6. ✅ Testare memory save/retrieve (10 min)

### Giorno 3 - Services Opzionali
7. 🔧 Debug Tool Executor (30 min)
8. 🔧 Debug Pricing Service (20 min)
9. 🔧 Abilitare Reranker (opzionale)

---

## ⚠️ IMPORTANTE

**Sistema Comunque Funzionale:**
- ✅ Llama 4 Scout operativo (AI core)
- ✅ CRM system attivo
- ✅ Frontend accessibile
- ✅ Collaborative Intelligence funzionante

**Servizi offline NON bloccano:**
- ✅ Chat con AI
- ✅ Gestione clienti CRM
- ✅ Frontend webapp
- ✅ Sistema base

**Servizi offline BLOCCANO:**
- ❌ RAG queries (domande al knowledge base)
- ❌ Semantic search
- ❌ Persistent memory tra sessioni
- ❌ Tool orchestration avanzata

---

## 🔗 LINK UTILI

### Documentazione Fly.io
- **Secrets:** https://fly.io/docs/reference/secrets/
- **PostgreSQL:** https://fly.io/docs/postgres/
- **Volumes:** https://fly.io/docs/volumes/

### Cloudflare R2
- **Dashboard:** https://dash.cloudflare.com/
- **R2 Docs:** https://developers.cloudflare.com/r2/

### Verifica Stato
- **Health Check:** https://nuzantara-rag.fly.dev/health
- **Root Info:** https://nuzantara-rag.fly.dev/

---

**Documento creato:** 2025-11-10
**Autore:** Claude Code (Sonnet 4.5)
**Branch:** claude/analyze-codebase-features-011CUyPo3nSGqshfcq34hU4z
