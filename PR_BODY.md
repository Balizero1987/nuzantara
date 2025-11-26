## 🎯 Obiettivo

Standardizzare l'endpoint health del Backend RAG da `/healthz` a `/health` per allineare con gli standard e risolvere inconsistenze.

## ✅ Modifiche

### Backend RAG
- ✅ Rimosso endpoint `/healthz` da `main_cloud.py`
- ✅ Standardizzato su `/health` (già presente tramite health router)
- ✅ Aggiornati `fly.toml` files (apps/backend-rag/ e deploy/)
- ✅ Aggiornato Dockerfile per usare `/health`

### Workflow GitHub Actions
- ✅ Aggiornato `deploy-backend-rag.yml` per usare `/health`
- ✅ Workflow resettati allo stato originale (per evitare OAuth issues)

### Documentazione
- ✅ Aggiornati tutti i riferimenti a `/healthz` nei documenti
- ✅ Aggiornata deployment strategy
- ✅ Aggiornati test post-deploy

### Code Quality
- ✅ Corretti errori sintassi JavaScript
- ✅ Risolti ESLint errors

## 🧪 Test

- [ ] Backend RAG `/health` endpoint (3/3 OK previsto)
- [ ] Backend TS `/health` endpoint
- [ ] Smoke tests completi

## 📊 Risultato Atteso

- Backend RAG usa `/health` consistentemente (3/3 endpoint OK)
- Nessun endpoint `/healthz` rimanente
- Deploy automatico funzionante
