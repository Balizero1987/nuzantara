# 🔧 AGGIORNA DNS SU CLOUDFLARE
## Per zantara.balizero.com → Backend Fly.io

**Provider DNS**: Cloudflare (rilevato)
**Dominio**: zantara.balizero.com
**Attuale**: Punta a GitHub Pages (185.199.x.x)
**Obiettivo**: Puntare a Fly.io Backend

---

## 📝 ISTRUZIONI PASSO-PASSO

### 1. **Accedi a Cloudflare**
```
https://dash.cloudflare.com
→ Login
→ Seleziona: balizero.com
```

### 2. **Vai alla sezione DNS**
```
Click su "DNS" nel menu laterale
```

### 3. **ELIMINA i vecchi record**
Trova e ELIMINA questi record per `zantara`:
- ❌ A record `zantara` → 185.199.108.153
- ❌ A record `zantara` → 185.199.109.153
- ❌ A record `zantara` → 185.199.110.153
- ❌ A record `zantara` → 185.199.111.153
- ❌ AAAA records con 2606:50c0:...

### 4. **AGGIUNGI i nuovi record**

**OPZIONE A: Usa CNAME (PIÙ SEMPLICE)**
```
Type: CNAME
Name: zantara
Target: dmzq3lr.nuzantara-backend.fly.dev
Proxy: OFF (importante!)
TTL: Auto
```

**OPZIONE B: Usa A + AAAA**
```
Record 1:
Type: A
Name: zantara
IPv4: 66.241.125.146
Proxy: OFF
TTL: Auto

Record 2:
Type: AAAA
Name: zantara
IPv6: 2a09:8280:1::aa:9074:0
Proxy: OFF
TTL: Auto
```

### 5. **IMPORTANTE: Proxy OFF!**
⚠️ **Disabilita il proxy Cloudflare** (icona nuvola arancione → grigia)
Altrimenti il certificato SSL non funzionerà!

---

## 🎯 RISULTATO FINALE

Dopo aver fatto le modifiche:

### Nel DNS di Cloudflare vedrai:
```
CNAME   zantara   dmzq3lr.nuzantara-backend.fly.dev   ☁️(grigio)   Auto
```
O
```
A       zantara   66.241.125.146                       ☁️(grigio)   Auto
AAAA    zantara   2a09:8280:1::aa:9074:0              ☁️(grigio)   Auto
```

### Attendi 5-10 minuti poi verifica:
```bash
# Test DNS
dig zantara.balizero.com

# Dovrebbe rispondere con:
# 66.241.125.146 (invece di 185.199.x.x)
```

---

## ✅ VERIFICA FINALE

Una volta aggiornato il DNS, esegui:
```bash
# Verifica certificato
flyctl certs check zantara.balizero.com --app nuzantara-backend

# Test il dominio
curl https://zantara.balizero.com/health
```

---

## 🚀 DOPO IL DNS

Il certificato SSL si attiverà automaticamente quando il DNS sarà corretto.

Poi potrai accedere a:
- ✅ https://zantara.balizero.com (backend)
- ✅ https://zantara.balizero.com/health (health check)

---

## ⏱️ TEMPISTICHE

- **Propagazione DNS**: 5-30 minuti
- **Certificato SSL**: Automatico dopo DNS corretto
- **Test completo**: ~15 minuti totali

---

**Antonio, vai su Cloudflare e segui questi passi!**

Fammi sapere quando hai fatto le modifiche DNS e verifico che funzioni tutto.