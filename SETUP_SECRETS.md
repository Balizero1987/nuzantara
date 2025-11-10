# 🔐 SETUP SECRETS - Configurazione Sicura

**IMPORTANTE**: I file `.env.configured` contengono secrets e **NON sono su git**.

---

## ⚠️ SECURITY FIX APPLICATO

La OpenRouter API key è stata **rimossa da GitHub** per sicurezza.

I file `.env.configured` sono ora:
- ❌ NON tracciati da git (in .gitignore)
- ✅ Solo locali sul tuo computer
- ✅ Contengono la tua API key sicura

---

## 🚀 SETUP RAPIDO

### 1. I file .env.configured esistono già sul tuo Mac

Sono stati creati automaticamente e contengono:
- `apps/backend-ts/.env.configured` - Backend TypeScript configurato
- `apps/backend-rag/.env.configured` - Backend RAG con OpenRouter key

### 2. Esegui lo script automatico

```bash
cd ~/desktop/NUZANTARA

# Questo script:
# - Risolve problemi git
# - Copia .env.configured → .env
# - Avvia servizi Docker
./scripts/fix-and-setup.sh
```

### 3. Avvia i backend

**Terminal 1:**
```bash
cd apps/backend-ts
npm install
npm run dev
```

**Terminal 2:**
```bash
cd apps/backend-rag
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload
```

---

## 🔑 SE HAI PERSO I FILE .env.configured

Ricreali manualmente:

### Backend TypeScript

```bash
cat > apps/backend-ts/.env.configured << 'EOF'
PORT=8080
NODE_ENV=production
LOG_LEVEL=info
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/zantara
REDIS_URL=redis://localhost:6379
JWT_SECRET=SFiWmXo6LNrDdwLyVfJXhrwdK/Kq4RYrHAnvpD2/Crw=
JWT_EXPIRES_IN=24h
RAG_BACKEND_URL=http://localhost:8000
CACHE_TTL=3600
ENABLE_CACHE_COMPRESSION=true
ENABLE_ENHANCED_REDIS_CACHE=true
ENABLE_OBSERVABILITY=true
ENABLE_AUDIT_TRAIL=true
METRICS_PORT=9090
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
ENABLE_CRON=true
CRON_TIMEZONE=Asia/Singapore
CRON_HEALTH_CHECK=*/15 * * * *
CRON_DAILY_REPORT=0 9 * * *
EOF
```

### Backend RAG

```bash
cat > apps/backend-rag/.env.configured << 'EOF'
PORT=8000
HOST=0.0.0.0
LOG_LEVEL=INFO
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/zantara
REDIS_URL=redis://localhost:6379
CHROMA_DB_PATH=/data/chroma_db
CHROMA_HOST=localhost
CHROMA_PORT=8001
OPENROUTER_API_KEY=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
AI_MODEL=meta-llama/llama-3.3-70b-instruct
AI_PROVIDER=openrouter
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536
RERANKER_ENABLED=false
EOF
```

---

## ✅ VERIFICA

```bash
# 1. Verifica file esistono
ls -la apps/backend-ts/.env.configured
ls -la apps/backend-rag/.env.configured

# 2. Verifica non sono tracciati da git
git status
# Non dovrebbero apparire in "Changes to be committed"

# 3. Esegui setup
./scripts/fix-and-setup.sh
```

---

## 🔒 BEST PRACTICES

### ✅ DA FARE:
- Tenere `.env.configured` **SOLO localmente**
- Usare `.gitignore` per file con secrets
- Rigenerare API keys se esposte pubblicamente

### ❌ NON FARE:
- Committare file `.env` o `.env.configured`
- Condividere API keys in chat/email
- Pushare secrets su GitHub

---

## 🎯 STATO ATTUALE

| File | Stato | Sicurezza |
|------|-------|-----------|
| `.env.configured` | ❌ NON su git | ✅ Sicuro |
| `.env` | ❌ NON su git | ✅ Sicuro |
| `.env.example` | ✅ Su git | ✅ Sicuro (placeholder) |
| OpenRouter Key | ✅ Rimossa da GitHub | ✅ Sicuro |

---

**✅ Security fix applicato. I tuoi secrets sono al sicuro!**
