# 🚀 FLY.IO SECRETS SETUP

Configura i secrets su Fly.io per i backend in produzione.

---

## 🔑 SECRETS DA CONFIGURARE

### Backend TypeScript

```bash
# Vai nella directory
cd apps/backend-ts

# Configura secrets Fly.io
fly secrets set \
  JWT_SECRET="SFiWmXo6LNrDdwLyVfJXhrwdK/Kq4RYrHAnvpD2/Crw=" \
  DATABASE_URL="postgresql://user:pass@host:5432/dbname" \
  REDIS_URL="redis://user:pass@host:6379" \
  ENABLE_CRON="true" \
  CRON_TIMEZONE="Asia/Singapore" \
  CRON_HEALTH_CHECK="*/15 * * * *" \
  CRON_DAILY_REPORT="0 9 * * *" \
  NODE_ENV="production"

# Verifica secrets configurati
fly secrets list
```

### Backend RAG

```bash
# Vai nella directory
cd apps/backend-rag

# Configura secrets Fly.io
fly secrets set \
  OPENROUTER_API_KEY="LA_TUA_NUOVA_KEY_QUI" \
  AI_MODEL="meta-llama/llama-3.3-70b-instruct" \
  AI_PROVIDER="openrouter" \
  DATABASE_URL="postgresql://user:pass@host:5432/dbname" \
  REDIS_URL="redis://user:pass@host:6379" \
  CHROMA_HOST="your-chromadb-host" \
  CHROMA_PORT="8001"

# Verifica secrets configurati
fly secrets list
```

---

## 📋 CHECKLIST DEPLOYMENT

### ✅ Backend TypeScript

- [ ] JWT_SECRET configurato
- [ ] DATABASE_URL configurato (Fly Postgres)
- [ ] REDIS_URL configurato (Upstash Redis)
- [ ] ENABLE_CRON=true
- [ ] Cron schedules configurati
- [ ] NODE_ENV=production

### ✅ Backend RAG

- [ ] OPENROUTER_API_KEY configurato
- [ ] AI_MODEL configurato (Llama 3.3 70B)
- [ ] AI_PROVIDER=openrouter
- [ ] DATABASE_URL configurato (stesso del TS)
- [ ] REDIS_URL configurato (stesso del TS)
- [ ] CHROMA_HOST configurato

---

## 🗄️ DATABASE SETUP (Fly Postgres)

```bash
# Crea database Fly Postgres (se non esiste)
fly postgres create --name nuzantara-db --region sin

# Ottieni connection string
fly postgres connect -a nuzantara-db

# Copia il DATABASE_URL e configuralo nei secrets
# postgres://user:pass@nuzantara-db.internal:5432/dbname
```

---

## 🔴 REDIS SETUP (Upstash)

```bash
# Opzione A: Usa Upstash Redis (raccomandato, gratis)
# 1. Vai su https://upstash.com
# 2. Crea database Redis
# 3. Copia Redis URL
# 4. Configura nei secrets

# Opzione B: Fly Redis (se preferisci)
fly redis create --name nuzantara-redis --region sin
fly redis connect -a nuzantara-redis
```

---

## 🗃️ CHROMADB SETUP

### Opzione A: ChromaDB su Fly.io (raccomandato)

```bash
# Deploy ChromaDB su Fly
cd apps/chromadb-deploy  # Se hai una dir dedicata

# Oppure usa immagine Docker
fly launch --image chromadb/chroma:latest --name nuzantara-chromadb

# Ottieni hostname
fly info -a nuzantara-chromadb
# Esempio: nuzantara-chromadb.fly.dev

# Configura nel backend RAG
fly secrets set CHROMA_HOST="nuzantara-chromadb.fly.dev" -a backend-rag
```

### Opzione B: ChromaDB Hosted (alternativa)

```bash
# Usa servizio hosted tipo:
# - Chroma Cloud (beta)
# - Self-hosted su altro provider

CHROMA_HOST="your-chroma-host.com"
CHROMA_PORT="443"
```

---

## 🚀 DEPLOY

Dopo aver configurato i secrets:

```bash
# Backend TypeScript
cd apps/backend-ts
fly deploy

# Backend RAG
cd apps/backend-rag
fly deploy

# ChromaDB (se necessario)
cd apps/chromadb-deploy
fly deploy
```

---

## ✅ VERIFICA

```bash
# 1. Verifica secrets configurati
fly secrets list -a backend-ts
fly secrets list -a backend-rag

# 2. Verifica app running
fly status -a backend-ts
fly status -a backend-rag

# 3. Test health check
curl https://backend-ts.fly.dev/health
curl https://backend-rag.fly.dev/health

# 4. Test agenti attivi
curl https://backend-ts.fly.dev/api/monitoring/cron-status
```

---

## 🔒 SECURITY NOTES

### ✅ SICURO:
- Secrets configurati con `fly secrets set`
- Non committare mai secrets su git
- Usare DATABASE_URL e REDIS_URL da Fly/Upstash

### ⚠️ ATTENZIONE:
- OpenRouter key esposta solo su Fly (non su git)
- Rigenera JWT_SECRET per produzione (non usare quello di dev)
- Configura CORS_ORIGIN per il tuo dominio

---

## 💰 COSTI STIMATI

| Servizio | Piano | Costo |
|----------|-------|-------|
| Fly.io (2 apps) | Hobby | $0-5/mese |
| Fly Postgres | Free tier | $0/mese |
| Upstash Redis | Free tier | $0/mese |
| OpenRouter | FREE models | $0/mese |
| ChromaDB Fly | Hobby | $0-3/mese |
| **TOTALE** | | **$0-8/mese** |

---

## 📝 TEMPLATE fly.toml

### Backend TypeScript

```toml
app = "nuzantara-backend-ts"
primary_region = "sin"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "8080"
  NODE_ENV = "production"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = "512mb"
  cpu_kind = "shared"
  cpus = 1
```

### Backend RAG

```toml
app = "nuzantara-backend-rag"
primary_region = "sin"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "8000"

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = "1gb"
  cpu_kind = "shared"
  cpus = 1
```

---

**🎯 Tutto pronto per il deploy su Fly.io!**
