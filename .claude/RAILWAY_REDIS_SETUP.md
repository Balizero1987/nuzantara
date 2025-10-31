# 🔴 Railway Redis Setup Guide

## Passi per aggiungere Redis al progetto Railway

### 1. Dashboard Railway
- URL: https://railway.app
- Progetto: `fulfilling-creativity` (production)

### 2. Aggiungi Redis Plugin

**Opzione A - Dalla Dashboard UI:**
1. Clicca "**+ New**" nel progetto
2. Seleziona "**Database**"
3. Scegli "**Add Redis**"
4. Clicca "**Add Redis**" per confermare

**Opzione B - Da Service:**
1. Nel progetto, vai a "**TS-BACKEND**" service
2. Tab "**Variables**"
3. Clicca "**+ New Variable**"
4. Scegli "**Add Plugin**" → "**Redis**"

### 3. Collega Redis a TS-BACKEND

Dopo aver aggiunto Redis:

1. Vai al servizio "**Redis**" appena creato
2. Clicca su "**Connect**"
3. Seleziona "**TS-BACKEND**" come servizio da collegare
4. Railway creerà automaticamente la variabile `REDIS_URL`

### 4. Verifica Variabili

1. Vai a "**TS-BACKEND**" → "**Variables**"
2. Dovresti vedere `REDIS_URL` con valore tipo:
   ```
   redis://default:password@redis.railway.internal:6379
   ```

### 5. Redeploy (Automatico)

Railway farà automaticamente il redeploy del TS-BACKEND quando aggiungi la variabile.

---

## ✅ Come verificare che funziona

Dopo il deploy, controlla i log di **TS-BACKEND**:

**Prima (senza Redis):**
```
⚠️  REDIS_URL not configured - pub/sub features disabled
⚠️  REDIS_URL not set - WebSocket real-time features disabled
```

**Dopo (con Redis):**
```
✅ Redis publisher connected
✅ Redis subscriber connected
✅ WebSocket server initialized
🔌 WebSocket ready for real-time features
```

---

## 🎯 Features Abilitate con Redis

Una volta configurato Redis, avrai:

✅ **WebSocket Real-Time**
- Notifiche push agli utenti
- Live updates senza polling

✅ **Pub/Sub System**
- User notifications
- AI job queue
- Cache invalidation
- Live chat
- Analytics events

✅ **Distributed Cache**
- Cache condivisa tra più istanze
- Migliori performance

---

## 💰 Costo

Railway include **Redis gratuito** nel piano free tier:
- 256MB RAM
- 100 connessioni max
- Perfetto per sviluppo e small production

---

## 🐛 Troubleshooting

**Se Redis non si connette:**
1. Verifica che `REDIS_URL` sia settato in TS-BACKEND variables
2. Controlla che Redis service sia "Active" (pallino verde)
3. Verifica i log di Redis per errori
4. Controlla che i servizi siano nello stesso progetto Railway

**Se TS-BACKEND crasha:**
1. Il codice ora supporta Redis opzionale
2. Dovrebbe partire anche senza Redis
3. Se crasha, controlla i "Deploy Logs" per l'errore specifico

---

## 📞 Quick Reference

**Railway Commands** (se usi CLI):
```bash
railway login                    # Login interattivo
railway add --plugin redis       # Aggiungi Redis
railway link                     # Collega progetto locale
railway variables                # Mostra variabili
```

**Railway Dashboard URLs:**
- Progetti: https://railway.app/dashboard
- Docs Redis: https://docs.railway.app/databases/redis
- Support: https://railway.app/help

---

**Generated**: 2025-10-31 by Claude Code
**Purpose**: Guide to enable Redis on Railway for TS-BACKEND real-time features
