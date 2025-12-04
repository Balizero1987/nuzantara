# ZANTARA Backend Access Testing - Complete Guide

## 📋 Overview

Questa guida descrive il processo completo di testing dell'accesso di Zantara ai servizi backend, i problemi identificati, e le soluzioni applicate.

## 🎯 Obiettivo

Verificare che Zantara abbia piena conoscenza e accesso a tutti i servizi backend Python:
- CRM Services
- Conversations Service
- Memory Service
- Agentic Functions
- Python Tools (get_pricing, search_team_member, etc.)

## 🧪 Test Eseguiti

### 1. Test Iniziale (Senza Fix)
**Comando**:
```bash
cd apps/webapp-next
TOKEN=$(python3 scripts/generate_test_token.py)
node scripts/test_zantara_backend_access.js --token "$TOKEN" --api-key "zantara-secret-2024"
```

**Risultati**:
- Success Rate: 22% (11/50 domande)
- CRM Services: 0% answered
- Conversations Service: 0% answered
- Memory Service: 25% answered (informazioni errate)

### 2. Test Ricerca Diretta
**Comando**:
```bash
cd apps/backend-rag
export JWT_SECRET_KEY="..."
export OPENAI_API_KEY="..."
python scripts/test_direct_search.py
```

**Risultati**:
- ✅ 8/8 queries trovano risultati
- ✅ 7/8 queries trovano documenti backend nei top 5
- ✅ Distance scores: 0.33-0.60 (ottima rilevanza)

**Conclusione**: Documenti sono trovabili, ma Zantara non li cerca nella collection giusta.

### 3. Test Query Routing (Prima del Fix)
**Comando**:
```bash
cd apps/backend-rag
python scripts/test_query_routing.py
```

**Risultati**:
- ❌ 0/10 queries routate a knowledge_base
- ❌ 8/10 queries routate a kbli_eye (collezione sbagliata)
- ❌ 2/10 queries routate a visa_oracle (collezione sbagliata)

**Conclusione**: QueryRouter non riconosce query sui backend services.

### 4. Test Query Routing (Dopo il Fix)
**Risultati**:
- ✅ 9/10 queries routate a zantara_books/knowledge_base
- ✅ Solo 1 query ancora problematica
- ✅ Miglioramento: +90%

## 🔧 Fix Applicati

### Fix 1: Ingestion Documentazione
**File**: `apps/backend-rag/scripts/ingest_backend_services_docs.py`

**Esecuzione**:
```bash
cd apps/backend-rag
export JWT_SECRET_KEY="07XoX6Eu24amEuUye7MhTFO62jzaYJ48myn04DvECN0="
export API_KEYS="zantara-secret-2024"
export OPENAI_API_KEY="sk-proj-..."
export QDRANT_URL="https://nuzantara-qdrant.fly.dev"
python scripts/ingest_backend_services_docs.py --collection knowledge_base
```

**Risultato**:
- ✅ 8 documenti ingeriti
- ✅ Collection: 8931 → 8939 documenti

### Fix 2: Query Routing Enhancement
**File**: `apps/backend-rag/backend/services/query_router.py`

**Modifiche**:
1. Aggiunto `BACKEND_SERVICES_KEYWORDS` (55+ keywords)
2. Aggiunto priority routing prima del domain routing
3. Raffinato KBLI_KEYWORDS per ridurre false positive

**Deployment**:
```bash
cd apps/backend-rag
fly deploy
```

## 📊 Script di Test

### Test Completo Backend Access
```bash
cd apps/webapp-next
TOKEN=$(python3 scripts/generate_test_token.py)
node scripts/test_zantara_backend_access.js \
  --token "$TOKEN" \
  --api-key "zantara-secret-2024" \
  --category "CRM Services"
```

### Test Singola Categoria
```bash
# Categorie disponibili:
# - "General API Knowledge"
# - "CRM Services"
# - "Conversations Service"
# - "Memory Service"
# - "Tools & Handlers"
# - "Agentic Functions"
# - "Oracle Services"
# - etc.

node scripts/test_zantara_backend_access.js \
  --token "$TOKEN" \
  --api-key "zantara-secret-2024" \
  --category "<CATEGORY>"
```

### Test Integrazione Webapp
```bash
cd apps/webapp-next
TOKEN=$(python3 scripts/generate_test_token.py)
node scripts/test_zantara_webapp_integration.js \
  --token "$TOKEN" \
  --api-key "zantara-secret-2024"
```

### Test Ricerca Diretta Qdrant
```bash
cd apps/backend-rag
export OPENAI_API_KEY="sk-proj-..."
export QDRANT_URL="https://nuzantara-qdrant.fly.dev"
python scripts/test_direct_search.py
```

### Test Query Routing
```bash
cd apps/backend-rag
python scripts/test_query_routing.py
```

## 📈 Metriche Success

| Metrica | Prima | Dopo | Miglioramento |
|---------|-------|------|---------------|
| Overall Success Rate | 22% | 75%+ (atteso) | **+53%** |
| CRM Services | 0% | 80%+ (atteso) | **+80%** |
| Conversations Service | 0% | 80%+ (atteso) | **+80%** |
| Memory Service | 25% | 90%+ (atteso) | **+65%** |
| Query Routing Accuracy | 0% | 90% | **+90%** |
| Direct Search Success | N/A | 87.5% | ✅ |

## 🔍 Debugging Guide

### Se Zantara Non Conosce un Servizio

1. **Test Ricerca Diretta**:
   ```bash
   cd apps/backend-rag
   python scripts/test_direct_search.py
   ```
   - Verifica se il documento è in Qdrant
   - Controlla distance scores
   - Verifica metadata (category: backend_services)

2. **Test Query Routing**:
   ```bash
   python scripts/test_query_routing.py
   ```
   - Verifica a quale collezione viene indirizzata la query
   - Controlla se ci sono keywords match
   - Verifica se serve aggiungere keywords

3. **Test End-to-End**:
   ```bash
   cd apps/webapp-next
   TOKEN=$(python3 scripts/generate_test_token.py)
   node scripts/test_zantara_backend_access.js --token "$TOKEN" --api-key "..."
   ```

### Se il Routing è Sbagliato

**Soluzione**: Aggiungere keywords in `query_router.py`

```python
# In BACKEND_SERVICES_KEYWORDS, aggiungere:
BACKEND_SERVICES_KEYWORDS = [
    # ... esistenti ...
    "nuova_keyword",
    "new_keyword",
]
```

### Se il Documento Non Esiste

**Soluzione**: Aggiungere documentazione in `ingest_backend_services_docs.py`

```python
docs.append({
    "content": """
    # Nuovo Servizio - Documentazione
    
    ## Overview
    ...
    """,
    "metadata": {
        "service": "nome_servizio",
        "category": "backend_services",
        "type": "api_documentation",
        "title": "Titolo Documento",
    },
})
```

Poi eseguire ingestion:
```bash
python scripts/ingest_backend_services_docs.py --collection knowledge_base
```

## 📁 File Struttura

```
apps/webapp-next/
├── scripts/
│   ├── test_zantara_backend_access.js      # Test completo servizi backend
│   ├── test_zantara_webapp_integration.js  # Test integrazione webapp
│   ├── generate_test_token.py              # Token JWT generator
│   └── get_auth_token.js                   # Auth helper
├── ZANTARA_TEST_RESULTS_COMPLETE.md        # Risultati test completi
├── ZANTARA_BACKEND_ACCESS_PROBLEM_ANALYSIS.md  # Analisi problema
├── ROUTING_FIX_APPLIED.md                  # Documentazione fix routing
└── README_ZANTARA_TESTING.md               # Questa guida

apps/backend-rag/
└── scripts/
    ├── ingest_backend_services_docs.py     # Ingestion documentazione
    ├── test_direct_search.py               # Test ricerca diretta
    └── test_query_routing.py               # Test routing
```

## 🎓 Best Practices

1. **Sempre testare in isolamento**: Ricerca diretta → Routing → End-to-end
2. **Usare metadata specifici**: `category: backend_services` per identificare documenti
3. **Keywords complete**: Aggiungere sinonimi e traduzioni (IT, EN, ID)
4. **Verificare distance scores**: < 0.6 = ottima rilevanza, > 0.7 = rilevanza bassa
5. **Monitorare routing**: Log QueryRouter decision per ogni query

## ⚠️ Limitazioni Conosciute

1. **1 query** ancora routata male: "Quali tools Python sono disponibili"
   - Match "disponibili" → KBLI keywords
   - Fix: rendere "disponibili" meno generico o aggiungere context check

2. **Backend services** require specific keywords
   - Non tutte le formulazioni matchano
   - Potrebbero servire ulteriori keywords per edge cases

## 🎯 Success Criteria

- [ ] Success rate > 75% su tutte le categorie
- [ ] Query routing accuracy > 90%
- [ ] Direct search trova backend docs in top 3
- [ ] Zero informazioni errate (ChromaDB → Qdrant)
- [ ] Tools Python tutti conosciuti da Zantara

## 🔗 Riferimenti

- Backend Main: `apps/backend-rag/backend/app/main_cloud.py`
- Query Router: `apps/backend-rag/backend/services/query_router.py`
- Search Service: `apps/backend-rag/backend/services/search_service.py`
- Intelligent Router: `apps/backend-rag/backend/services/intelligent_router.py`

