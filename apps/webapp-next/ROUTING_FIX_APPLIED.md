# Query Routing Fix - Risultati

## 🎯 Problema Identificato

**QueryRouter non indirizzava le query sui servizi backend a `knowledge_base`.**

### Root Cause
Il QueryRouter cercava di categorizzare le query sui servizi backend usando keywords esistenti (visa, kbli, tax, legal, property), ma non aveva keywords specifiche per "backend services", "API", "tools", "CRM", "conversations", "memory", ecc.

Risultato: 
- Query con "crm" matchava KBLI keywords ("business") → routing a `kbli_eye`
- Query con "database" matchava KBLI keywords → routing a `kbli_eye`
- Query senza keyword match → routing a `visa_oracle` (default)
- **0% delle query** veniva indirizzata a `knowledge_base` dove erano i documenti ingeriti

## ✅ Fix Applicato

### Modifiche a `backend/services/query_router.py`

1. **Aggiunto nuovo set di keywords**: `BACKEND_SERVICES_KEYWORDS`
   - backend, api, endpoint, servizio backend
   - python tool, tool executor, handler
   - crm service, conversation service, memory service
   - postgresql, qdrant, vector database
   - auto-crm, client journey, compliance monitoring
   - E molti altri (55+ keywords totali)

2. **Aggiunto priority routing**
   - Backend services queries ora hanno priorità alta
   - Vengono indirizzate a `zantara_books` (mappata a `knowledge_base`)
   - Il check avviene PRIMA del routing per dominio standard

3. **Raffinato KBLI keywords**
   - Rimosso "sector" generico → "business sector", "sektor usaha"
   - Reso più specifico per evitare false positive

## 📊 Risultati Test

### Prima del Fix
- **Routing corretto**: 0/10 queries (0%)
- Routing prevalente: `kbli_eye` (8 queries), `visa_oracle` (2 queries)

### Dopo il Fix
- **Routing corretto**: 9/10 queries (90%)
- Routing prevalente: `zantara_books` (9 queries), `kbli_eye` (1 query)

### Miglioramento
- **+90%** di routing corretto
- 9 su 10 query ora trovano la collection con i documenti backend

## 🧪 Verifica Ricerca Diretta

Test di ricerca diretta in `knowledge_base` ha confermato:
- **7/8 queries** (87.5%) trovano i documenti backend services nei top 5 risultati
- Documenti sono semanticamente trovabili
- Distance scores: 0.33-0.58 (buona rilevanza)

## 🚀 Prossimi Passi

1. ✅ Routing fix applicato
2. ⏳ Testare Zantara con query post-fix
3. ⏳ Verificare che Zantara risponda correttamente con conoscenza backend services
4. ⏳ Se necessario, aggiungere ulteriori keywords per 100% routing accuracy

## 🔧 Per Applicare il Fix in Produzione

Il backend deve essere riavviato per applicare le modifiche:

```bash
# Restart backend
fly deploy apps/backend-rag
# O se in locale
cd apps/backend-rag && python -m uvicorn app.main_cloud:app --reload
```

## 📝 File Modificati

- `backend/services/query_router.py` - Aggiunto BACKEND_SERVICES_KEYWORDS e priority routing

