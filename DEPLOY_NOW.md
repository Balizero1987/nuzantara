# 🚀 Deploy Orchestrator su Railway - Istruzioni Immediate

**Stato Attuale:**
- ✅ Router FLAN esposto: `https://5198cdac49f5.ngrok-free.app`
- ✅ Codice pushato su GitHub (commit 9fc7507)
- ✅ Railway configurato: Progetto "fulfilling-creativity"
- ⏳ Orchestrator: Da deployare

---

## 🎯 Step 1: Crea Nuovo Servizio (2 minuti)

Dalla dashboard Railway che hai aperta:

1. **Click "+ New"** (in alto a destra)
2. **Seleziona "Empty Service"**
3. **Nome servizio**: `ORCHESTRATOR`
4. **Click "Add Service"**

---

## 🔧 Step 2: Configura il Servizio (3 minuti)

### A. Collega GitHub Repository

1. Nel servizio ORCHESTRATOR appena creato
2. Click **"Settings"** (tab a destra)
3. Scroll to **"Service Source"**
4. Click **"Connect Repo"**
5. Seleziona: **`Balizero1987/nuzantara`**
6. Branch: **`main`**
7. **Root Directory**: `/apps/orchestrator`
8. Click **"Deploy"**

### B. Configura Variabili d'Ambiente

1. Vai al tab **"Variables"**
2. Click **"+ New Variable"**
3. Aggiungi queste 2 variabili:

```
ANTHROPIC_API_KEY
[Usa la tua API key di Anthropic - sk-ant-api03-...]

FLAN_ROUTER_URL
https://5198cdac49f5.ngrok-free.app
```

4. Click **"Add"** per ogni variabile

---

## 🚀 Step 3: Deploy (Automatico)

Railway triggererà automaticamente il deploy:

1. Vai al tab **"Deployments"**
2. Vedrai: **"Building..."** → poi **"Deploying..."**
3. Aspetta **2-3 minuti**
4. Status diventa: **"Active"** ✅

---

## ✅ Step 4: Verifica (1 minuto)

### A. Ottieni URL Pubblico

1. Nel servizio ORCHESTRATOR
2. Guarda in alto: vedrai l'URL generato
3. Es: `orchestrator-production-abc123.up.railway.app`

### B. Test Health Check

```bash
# Sostituisci con il TUO URL da Railway
curl https://orchestrator-production-abc123.up.railway.app/health
```

**Output atteso:**
```json
{
  "status": "healthy",
  "checks": {
    "orchestrator": "healthy",
    "flanRouter": "healthy",
    "haiku": "configured"
  }
}
```

### C. Test Query Completa

```bash
curl -X POST https://orchestrator-production-abc123.up.railway.app/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the price of KITAS?"}'
```

---

## 🔥 Quick Fix per TS-BACKEND (Bonus)

Vedo che TS-BACKEND sta fallendo. Ho già pushato il fix (commit 9fc7507).

Railway dovrebbe re-deployare automaticamente. Controlla:
1. Vai al servizio **TS-BACKEND**
2. Tab **"Deployments"**
3. Dovresti vedere un nuovo build in corso
4. Aspetta che diventi **"Active"** ✅

---

## 📊 Sistema Finale

Dopo questi step, avrai:

```
┌─────────────────────────────────────────┐
│  🌐 PRODUZIONE (Railway)                │
│  - ORCHESTRATOR: [tuo-url].railway.app │
│  - TS-BACKEND: ts-backend-production... │
│  - RAG-BACKEND: scintillating-kindness...│
└─────────────────────────────────────────┘
           ↓ comunica con ↓
┌─────────────────────────────────────────┐
│  🖥️  LOCALE (tuo Mac + ngrok)           │
│  - FLAN Router: https://5198...ngrok.io │
└─────────────────────────────────────────┘
```

---

## ⚠️ IMPORTANTE: ngrok

**ngrok DEVE rimanere attivo** finché usi il sistema!

Se chiudi il terminale, il router non sarà più raggiungibile.

**Per uso persistente:**
- Ottieni ngrok account paid ($8/mese) per URL fisso
- OPPURE deploy FLAN router su VM con IP pubblico

---

## 🐛 Troubleshooting

### Errore: "flanRouter: unhealthy"

**Causa:** ngrok è stato chiuso o URL cambiato

**Fix:**
```bash
# Controlla ngrok
curl http://localhost:4040/api/tunnels

# Se non risponde, riavvia ngrok
ngrok http 8000

# Aggiorna variabile su Railway:
# Dashboard → ORCHESTRATOR → Variables → FLAN_ROUTER_URL
# Inserisci nuovo URL ngrok
```

### Errore: "Anthropic API error"

**Causa:** API key non valida

**Fix:**
- Verifica API key su: https://console.anthropic.com/
- Aggiorna su Railway: Variables → ANTHROPIC_API_KEY

---

## 📞 Comandi Utili

```bash
# Check ngrok status
curl http://localhost:4040/api/tunnels | jq

# Test router locale
curl http://localhost:8000/health

# Test orchestrator locale
curl http://localhost:3000/health

# Monitor Railway deployments
# → Usa dashboard Railway
```

---

## ✅ Checklist Finale

- [ ] Nuovo servizio ORCHESTRATOR creato su Railway
- [ ] Repository GitHub collegato (`/apps/orchestrator`)
- [ ] Variabili d'ambiente configurate (API_KEY + ROUTER_URL)
- [ ] Deploy completato (status: Active)
- [ ] Health check ritorna "healthy"
- [ ] Query test funziona
- [ ] ngrok è attivo e raggiungibile

---

**🎉 Fatto? Hai il sistema Router-Only in produzione su Railway!**

**Prossimi step:**
1. Testare con query reali dalla webapp
2. Monitorare metriche e performance
3. Sostituire ngrok con deploy permanente del router

---

**Domande?** Tutti i dettagli sono in `RAILWAY_DEPLOYMENT_GUIDE.md`
