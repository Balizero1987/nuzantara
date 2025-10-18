# 🚨 RAILWAY DEPLOYMENT FIX - URGENTE

> **Data**: 2025-10-18
> **Problema**: Tutti i deployment su Railway falliscono
> **Root Cause**: Root Directory non configurate nei servizi

---

## ❌ PROBLEMA IDENTIFICATO

I deployment falliscono perché le **Root Directory** non sono configurate su Railway Dashboard. Railway non sa dove trovare il codice nel monorepo.

---

## ⚠️ IMPORTANTE: APPLICA I CAMBIAMENTI!

Dopo aver configurato le Root Directory, **DEVI cliccare "Apply X changes"** per applicare le modifiche!

## ✅ SOLUZIONE IMMEDIATA

### 1. TS-BACKEND (TypeScript Backend)

1. **Vai a**: https://railway.com/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9
2. **Clicca su**: `TS-BACKEND` service
3. **Vai a**: Tab "Settings"
4. **Sezione**: "Source"
5. **Campo "Root Directory"**: Inserisci esattamente:
   ```
   apps/backend-ts
   ```
6. **Clicca**: "Update" o premi Enter
7. **IMPORTANTE**: Clicca "Apply 1 change" nel banner che appare
8. Railway applicherà le modifiche e farà auto-deploy

### 2. RAG BACKEND (Python Backend)

1. **Stesso progetto**: https://railway.com/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9
2. **Clicca su**: `RAG BACKEND` service
3. **Vai a**: Tab "Settings"
4. **Sezione**: "Source"
5. **Campo "Root Directory"**: Inserisci esattamente:
   ```
   apps/backend-rag/backend
   ```
6. **Clicca**: "Update" o premi Enter
7. **IMPORTANTE**: Clicca "Apply 1 change" nel banner che appare
8. Railway applicherà le modifiche e farà auto-deploy

---

## 📝 CONFIGURAZIONI CORRETTE

### TS-BACKEND
- **Root Directory**: `apps/backend-ts`
- **Builder**: Nixpacks (già configurato)
- **Build Command**: `npm run build` (già configurato in railway.toml)
- **Start Command**: `npm start` (già configurato in railway.toml)
- **Port**: 8080

### RAG BACKEND
- **Root Directory**: `apps/backend-rag/backend`
- **Builder**: Dockerfile (già configurato)
- **Dockerfile Path**: `Dockerfile` (relativo alla root directory)
- **Port**: 8000
- **Healthcheck Timeout**: 600s (ChromaDB download richiede tempo)

---

## 🔧 VERIFICA POST-FIX

Dopo aver configurato le Root Directory:

1. **Controlla deployment status**:
   ```bash
   railway status
   ```

2. **Monitora i logs**:
   ```bash
   # Per TS Backend
   railway logs --service ts-backend

   # Per RAG Backend
   railway logs --service "rag backend"
   ```

3. **Verifica gli endpoint**:
   - TS Backend: https://nuzantara-production.up.railway.app/health
   - RAG Backend: https://scintillating-kindness-production-47e3.up.railway.app/health

---

## ⚠️ NOTE IMPORTANTI

1. **Non modificare** i file railway.toml - sono già configurati correttamente
2. **Non usare** railway.json nel root - Railway usa la configurazione nel dashboard per monorepo
3. **Assicurati** che il campo sia esattamente come scritto (no trailing slash)
4. **Attendi** 3-5 minuti per il deploy completo dopo aver salvato

---

## 🎯 EXPECTED RESULT

Dopo aver configurato le Root Directory:
- ✅ Railway trova il codice nel path corretto
- ✅ Build process parte correttamente
- ✅ Deploy completato con successo
- ✅ Health checks passano
- ✅ Servizi raggiungibili sugli URL pubblici

---

## 📊 TROUBLESHOOTING

Se continua a fallire dopo aver configurato le Root Directory:

1. **Verifica GitHub connection**:
   - TS-BACKEND non ha source repo connesso! Potrebbe essere necessario:
     - Click "Connect Source" → "Connect Repo"
     - Seleziona `Balizero1987/nuzantara`
     - Branch: `main`

2. **Controlla environment variables**:
   - Vai a tab "Variables"
   - Verifica che ci siano tutte le variabili necessarie

3. **Verifica package.json scripts**:
   ```bash
   cd apps/backend-ts
   cat package.json | grep scripts -A 5
   ```

---

## 🔗 RIFERIMENTI

- Railway Dashboard: https://railway.com/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9
- GitHub Repo: https://github.com/Balizero1987/nuzantara
- Documentazione Railway Monorepo: https://docs.railway.app/guides/monorepo

---

**Fine Fix Document**