# 🚨 RAILWAY ROOT DIRECTORY PERSO - Fix Definitivo

## 🔴 PROBLEMA RICORRENTE:
```
Dockerfile `Dockerfile` does not exist
```

## 📊 CAUSA:
Railway ha perso la configurazione Root Directory durante auto-deploy o aggiornamenti.

## 🛠️ FIX IMMEDIATO:

### **STEP 1: Railway Dashboard - RAG BACKEND**
1. Vai su: https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9
2. Clicca su **RAG BACKEND** service
3. Vai su **Settings** tab
4. Trova **Root Directory** field
5. **Cambia a**: `apps/backend-rag/backend`
6. **Salva**

### **STEP 2: Railway Dashboard - TS-BACKEND**
1. Clicca su **TS-BACKEND** service
2. Vai su **Settings** tab
3. Trova **Root Directory** field
4. **Cambia a**: `apps/backend-ts`
5. **Salva**

### **STEP 3: Redeploy Services**
Dopo aver corretto Root Directory:
1. **RAG BACKEND** → Deployments → Redeploy
2. **TS-BACKEND** → Deployments → Redeploy

## 🎯 CONFIGURAZIONE CORRETTA:

### **RAG BACKEND:**
- **Root Directory**: `apps/backend-rag/backend`
- **Dockerfile Path**: `Dockerfile`
- **Builder**: `DOCKERFILE`

### **TS-BACKEND:**
- **Root Directory**: `apps/backend-ts`
- **Dockerfile Path**: `Dockerfile`
- **Builder**: `DOCKERFILE`

## 📋 CHECKLIST:

- [ ] RAG BACKEND Root Directory = `apps/backend-rag/backend`
- [ ] TS-BACKEND Root Directory = `apps/backend-ts`
- [ ] Salvare modifiche nel Dashboard
- [ ] Redeploy RAG BACKEND
- [ ] Redeploy TS-BACKEND
- [ ] Testare health endpoints

## 🔍 VERIFICA:

```bash
# Test RAG BACKEND
curl https://scintillating-kindness-production-47e3.up.railway.app/health

# Test TS-BACKEND
curl https://ts-backend-production-568d.up.railway.app/health
```

## ⚠️ NOTA IMPORTANTE:

Railway a volte perde la configurazione Root Directory durante:
- Auto-deploy da GitHub
- Aggiornamenti di Railway
- Modifiche alle variabili d'ambiente

**Soluzione**: Ricontrollare sempre Root Directory dopo ogni deploy!
