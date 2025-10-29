# 🌐 Orchestrator 24/7 Hosting - Opzioni

**Obiettivo**: Tenere Orchestrator online 24/7 invece che locale sul Mac

---

## ✅ OPZIONE 1: RAILWAY (RACCOMANDATO)

**Perché scegliere Railway:**
- ✅ I tuoi backend sono già qui
- ✅ Tutto già configurato (Dockerfile, railway.json)
- ✅ Deploy in 2 minuti
- ✅ Auto-scaling, SSL gratis, health checks
- ✅ Logs, metrics, monitoraggio incluso

**Costo**: $2-3/mese (512MB RAM, 0.5 vCPU)
**Free tier**: $5/mese credit → primi 2 mesi GRATIS

### Setup Railway (2 minuti):

```bash
# 1. Login (apre browser)
railway login

# 2. Vai nella directory orchestrator
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/apps/orchestrator

# 3. Link al progetto esistente
railway link

# 4. Crea servizio
railway service create orchestrator

# 5. Configura variabili d'ambiente
railway variables set ANTHROPIC_API_KEY="YOUR_ANTHROPIC_API_KEY"
railway variables set FLAN_ROUTER_URL="https://5198cdac49f5.ngrok-free.app"
railway variables set PORT="3000"

# 6. Deploy!
railway up

# 7. Ottieni URL pubblico
railway domain
```

**URL finale**: `https://orchestrator-production-xxxx.up.railway.app`

**Pro**:
- ✅ 24/7 uptime
- ✅ Auto-restart se crasha
- ✅ Integrato con gli altri servizi
- ✅ Zero configurazione infrastruttura

**Contro**:
- ⚠️ Dipende da ngrok per FLAN Router (vedi sotto)
- ⚠️ $2-3/mese dopo free tier

---

## ✅ OPZIONE 2: FLY.IO

**Perché Fly.io:**
- ✅ Free tier PERMANENTE (3 VM gratis)
- ✅ Edge network globale (bassa latency)
- ✅ Dockerfile supportato nativamente

**Costo**: **GRATIS** (3 shared-cpu-1x, 256MB RAM)
**Limite**: 160GB bandwidth/mese (più che sufficiente)

### Setup Fly.io (3 minuti):

```bash
# 1. Installa Fly CLI
brew install flyctl

# 2. Login
flyctl auth login

# 3. Vai nella directory
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/apps/orchestrator

# 4. Inizializza app
flyctl launch
# Nome: nuzantara-orchestrator
# Region: Singapore (sin) o Tokyo (nrt) - vicino a Indonesia
# PostgreSQL: No
# Deploy now: No

# 5. Configura secrets
flyctl secrets set ANTHROPIC_API_KEY="YOUR_ANTHROPIC_API_KEY"
flyctl secrets set FLAN_ROUTER_URL="https://5198cdac49f5.ngrok-free.app"

# 6. Deploy
flyctl deploy

# 7. Ottieni URL
flyctl info
```

**URL finale**: `https://nuzantara-orchestrator.fly.dev`

**ATTUALMENTE DEPLOYATO**: ✅ **LIVE**
- Orchestrator: https://nuzantara-orchestrator.fly.dev
- FLAN Router: https://nuzantara-flan-router.fly.dev
- Health Check: https://nuzantara-orchestrator.fly.dev/health
- Metrics: https://nuzantara-orchestrator.fly.dev/api/metrics

**Pro**:
- ✅ **GRATIS permanente** (tier generoso)
- ✅ Global edge network
- ✅ Auto-scaling
- ✅ Zero cold starts

**Contro**:
- ⚠️ Dipende da ngrok per FLAN Router
- ⚠️ Serve imparare Fly.io CLI (ma è semplice)

---

## ✅ OPZIONE 3: RENDER

**Perché Render:**
- ✅ Free tier PERMANENTE
- ✅ UI molto semplice (no CLI se non vuoi)
- ✅ Auto-deploy da GitHub

**Costo**: **GRATIS** (free tier con sleep dopo 15min inattività)
**Upgrade**: $7/mese per always-on

### Setup Render (dashboard web):

1. Vai su https://render.com
2. Collega GitHub repo `Balizero1987/nuzantara`
3. Crea nuovo "Web Service"
4. Imposta:
   - Root Directory: `apps/orchestrator`
   - Build Command: `npm install && npm run build`
   - Start Command: `node dist/main.js`
5. Aggiungi env vars:
   - `ANTHROPIC_API_KEY`
   - `FLAN_ROUTER_URL`
6. Click "Deploy"

**URL finale**: `https://nuzantara-orchestrator.onrender.com`

**Pro**:
- ✅ GRATIS (con limitazioni)
- ✅ Setup via dashboard (no CLI)
- ✅ Auto-deploy da Git push

**Contro**:
- ⚠️ **Free tier sleep** dopo 15min inattività (richiede 1-2min wakeup)
- ⚠️ Dipende da ngrok per FLAN Router

---

## 🚨 IL PROBLEMA NGROK

**Tutti i metodi sopra hanno un problema:**

L'Orchestrator su cloud chiamerà:
```
FLAN_ROUTER_URL=https://5198cdac49f5.ngrok-free.app
```

**Problemi ngrok free:**
- 🔴 URL cambia ogni restart
- 🔴 Richiede Mac acceso 24/7
- 🔴 Sessione scade dopo ~8 ore

---

## ✅ SOLUZIONE COMPLETA 24/7

Per avere **TUTTO** online 24/7, devi deployare anche FLAN Router:

### Opzione A: FLAN Router su RunPod (GPU Cloud)

**Costo**: ~$0.20/ora = **$150/mese** (GPU)
**Troppo caro per il tuo caso!**

### Opzione B: FLAN Router su CPU Cloud (Fly.io)

**Costo**: **GRATIS** (Fly.io free tier)

```bash
# 1. Crea Dockerfile per FLAN Router
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/apps/flan-router

# 2. Deploy su Fly.io
flyctl launch --name nuzantara-flan-router
flyctl deploy

# 3. URL stabile
https://nuzantara-flan-router.fly.dev
```

**Poi aggiorna Orchestrator:**
```bash
# Su Railway/Fly.io/Render
FLAN_ROUTER_URL=https://nuzantara-flan-router.fly.dev
```

**Costo totale**: **$0-2/mese** (tutto su free tier!)

---

## 🎯 RACCOMANDAZIONE

### FASE 1: Deploy Orchestrator ADESSO (2 min)

**Railway** (più semplice, già configurato):
```bash
railway login
cd apps/orchestrator
railway link
railway service create orchestrator
railway variables set ANTHROPIC_API_KEY="YOUR_API_KEY"
railway variables set FLAN_ROUTER_URL="https://5198cdac49f5.ngrok-free.app"
railway up
```

**Risultato**:
- ✅ Orchestrator 24/7 su Railway
- ⚠️ FLAN Router ancora locale (ngrok)
- ⚠️ Devi tenere Mac acceso per FLAN

---

### FASE 2: Deploy FLAN Router su Fly.io (10 min)

Dopo, possiamo deployare FLAN Router su Fly.io free tier:

```bash
cd apps/flan-router
flyctl launch --name nuzantara-flan-router
flyctl deploy
```

Poi aggiorna Railway orchestrator:
```bash
railway variables set FLAN_ROUTER_URL="https://nuzantara-flan-router.fly.dev"
```

**Risultato**:
- ✅ Orchestrator 24/7 su Railway
- ✅ FLAN Router 24/7 su Fly.io (GRATIS!)
- ✅ Mac può spegnere, tutto online

---

## 📊 CONFRONTO COSTI

| Soluzione | Orchestrator | FLAN Router | Totale/mese | Uptime |
|-----------|-------------|-------------|-------------|---------|
| **Attuale** | Locale | Locale + ngrok | $0 | Solo con Mac acceso |
| **Railway + ngrok** | Railway $2 | Locale + ngrok | $2 | Orchestrator 24/7, Router solo con Mac |
| **Railway + Fly.io** | Railway $2 | Fly.io GRATIS | $2 | **100% 24/7** ✅ |
| **Fly.io + Fly.io** | Fly.io GRATIS | Fly.io GRATIS | **$0** 🎉 | **100% 24/7** ✅ |
| **Render + Fly.io** | Render GRATIS* | Fly.io GRATIS | **$0** | 24/7 con sleep |

*Render free ha sleep dopo 15min inattività

---

## 🏆 MIGLIORE OPZIONE

### Per te: **Fly.io + Fly.io = $0/mese, 100% uptime**

**Passi**:
1. Deploy Orchestrator su Fly.io (GRATIS, 3 VM free tier)
2. Deploy FLAN Router su Fly.io (GRATIS, 3 VM free tier)
3. Usa 2 delle tue 3 VM gratuite
4. Tutto online 24/7, zero costi

**Vuoi che ti aiuto a farlo?**

Opzioni:
- A) Deploy su Railway ADESSO (2 min, $2/mese)
- B) Deploy su Fly.io ADESSO (5 min, GRATIS)
- C) Deploy TUTTO (Orchestrator + FLAN) su Fly.io (15 min, GRATIS, 100% cloud)
