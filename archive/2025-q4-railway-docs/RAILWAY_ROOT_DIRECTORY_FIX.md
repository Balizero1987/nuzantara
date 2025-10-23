# 🚨 RAILWAY ROOT DIRECTORY FIX - Problema Identificato

## 🔴 ERRORE SPECIFICO:
```
Dockerfile `Dockerfile` does not exist
```

## 🔍 CAUSA DEL PROBLEMA:
Railway RAG BACKEND ha Root Directory configurato come `/` (root del repo) invece di `apps/backend-rag/backend/`

## 🛠️ SOLUZIONE IMMEDIATA:

### STEP 1: Correggere Root Directory nel Railway Dashboard

**URL**: https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9

1. Vai su **RAG BACKEND** service
2. Clicca su **Settings**
3. Trova **Root Directory**
4. Cambia da `/` a `apps/backend-rag/backend`
5. Salva

### STEP 2: Verificare Dockerfile Path

Nel Railway Dashboard:
- **Dockerfile Path**: `Dockerfile` (dovrebbe essere relativo alla Root Directory)
- **Builder**: `DOCKERFILE`

### STEP 3: Redeploy

Dopo aver cambiato Root Directory:
1. Vai su **Deployments**
2. Clicca **Redeploy** sull'ultimo deployment
3. Oppure usa Railway CLI: `railway up --service "RAG BACKEND"`

## 🎯 CONFIGURAZIONE CORRETTA:

### RAG BACKEND:
- **Root Directory**: `apps/backend-rag/backend`
- **Dockerfile Path**: `Dockerfile`
- **Builder**: `DOCKERFILE`

### TS-BACKEND:
- **Root Directory**: `apps/backend-ts`
- **Dockerfile Path**: `Dockerfile`
- **Builder**: `DOCKERFILE`

## 🚀 COMANDI RAILWAY CLI:

```bash
# Verifica configurazione attuale
railway status

# Deploy RAG BACKEND dopo fix Root Directory
railway up --service "RAG BACKEND"

# Monitor logs
railway logs --service "RAG BACKEND" --tail 20
```

## 📋 CHECKLIST:

- [ ] Cambiare Root Directory RAG BACKEND a `apps/backend-rag/backend`
- [ ] Verificare Dockerfile Path = `Dockerfile`
- [ ] Verificare Builder = `DOCKERFILE`
- [ ] Redeploy RAG BACKEND
- [ ] Testare endpoint: https://scintillating-kindness-production-47e3.up.railway.app/health
