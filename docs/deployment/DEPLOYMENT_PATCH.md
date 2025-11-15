# DEPLOYMENT PATCH - Plugin Architecture
# Applica queste modifiche per deployare il sistema plugin

## ═══════════════════════════════════════════════════════
## STEP 1: Backend Python - Registra Plugin all'Avvio
## ═══════════════════════════════════════════════════════

FILE: apps/backend-rag/backend/app/main_cloud.py

AGGIUNGI dopo gli import esistenti:
```python
from core.plugins import registry
from plugins.bali_zero.pricing_plugin import PricingPlugin
from plugins.team.search_member_plugin import TeamMemberSearchPlugin
from plugins.team.list_members_plugin import TeamMembersListPlugin
from pathlib import Path
import logging

logger = logging.getLogger(__name__)
```

AGGIUNGI prima di `app = FastAPI(...)`:
```python
@app.on_event("startup")
async def register_plugins():
    """Registra tutti i plugin all'avvio"""
    logger.info("🔌 Registering plugins...")

    try:
        # Registra i plugin di esempio
        await registry.register(PricingPlugin)
        await registry.register(TeamMemberSearchPlugin)
        await registry.register(TeamMembersListPlugin)

        # Auto-discover altri plugin nella directory
        plugins_dir = Path(__file__).parent.parent / "plugins"
        if plugins_dir.exists():
            await registry.discover_plugins(plugins_dir, "backend.plugins")

        stats = registry.get_statistics()
        logger.info(f"✅ Registered {stats['total_plugins']} plugins")

    except Exception as e:
        logger.error(f"❌ Failed to register plugins: {e}")
```

AGGIUNGI dopo la creazione di app:
```python
# Includi le route dei plugin
from api.plugins import router as plugins_router
app.include_router(plugins_router)
```

## ═══════════════════════════════════════════════════════
## STEP 2: Backend TypeScript - Registra Route Plugin
## ═══════════════════════════════════════════════════════

FILE: apps/backend-ts/src/server.ts

AGGIUNGI dopo gli import esistenti:
```typescript
import pluginsRouter from './api/pluginsRouter';
```

AGGIUNGI dopo le altre route:
```typescript
// Plugin API routes
app.use('/api/plugins', pluginsRouter);
```

## ═══════════════════════════════════════════════════════
## STEP 3: Frontend - Aggiungi Route Plugin Marketplace
## ═══════════════════════════════════════════════════════

FILE: apps/webapp/src/App.tsx (o il tuo file router)

AGGIUNGI import:
```tsx
import PluginMarketplace from './components/PluginMarketplace';
import './components/PluginMarketplace.css';
```

AGGIUNGI route (adatta al tuo router):
```tsx
<Route path="/admin/plugins" element={<PluginMarketplace />} />
```

## ═══════════════════════════════════════════════════════
## STEP 4: Test Deployment
## ═══════════════════════════════════════════════════════

1. BACKEND PYTHON - Verifica avvio:
```bash
cd apps/backend-rag
python -m backend.app.main_cloud
# Dovresti vedere: "✅ Registered 3 plugins"
```

2. TEST API - Verifica endpoint:
```bash
# Lista plugin
curl http://localhost:8000/api/plugins/list | jq

# Dovrebbe restituire:
# {
#   "success": true,
#   "count": 3,
#   "plugins": [...]
# }

# Esegui plugin pricing
curl -X POST http://localhost:8000/api/plugins/bali_zero.pricing/execute \
  -H 'Content-Type: application/json' \
  -d '{"input_data": {"service_type": "kitas"}}' | jq

# Metriche
curl http://localhost:8000/api/plugins/bali_zero.pricing/metrics | jq
```

3. FRONTEND - Apri browser:
```
http://localhost:3000/admin/plugins
```

Dovresti vedere la Plugin Marketplace con i 3 plugin.

## ═══════════════════════════════════════════════════════
## STEP 5: Environment Variables (Opzionale - per Redis)
## ═══════════════════════════════════════════════════════

FILE: .env (aggiungi se vuoi caching con Redis)

```bash
# Plugin System (opzionale - migliora performance)
REDIS_URL=redis://localhost:6379
PLUGIN_CACHE_ENABLED=true
PLUGIN_CACHE_TTL=3600
```

Poi nel main_cloud.py:
```python
import redis.asyncio as redis
from core.plugins import executor

@app.on_event("startup")
async def setup_redis():
    """Setup Redis per caching plugin (opzionale)"""
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        executor.redis = await redis.from_url(redis_url)
        logger.info("✅ Redis caching enabled for plugins")
```

## ═══════════════════════════════════════════════════════
## STEP 6: Deploy su Railway/Production
## ═══════════════════════════════════════════════════════

1. Fai commit e push (GIÀ FATTO):
```bash
git status  # Già tutto pushato
```

2. Merge nel branch di staging:
```bash
git checkout staging
git merge claude/unified-plugin-architecture-011CUrnjMboFCvqZi9KPAqZV
git push origin staging
```

3. Railway deploierà automaticamente

4. Verifica deployment:
```bash
# Sostituisci con il tuo URL Railway
curl https://your-app.railway.app/api/plugins/list | jq
curl https://your-app.railway.app/api/plugins/health | jq
```

## ═══════════════════════════════════════════════════════
## TROUBLESHOOTING
## ═══════════════════════════════════════════════════════

### Problema: "Plugin not found"
```python
# Verifica che i plugin siano registrati
from core.plugins import registry
print(registry.get_all_plugin_names())
```

### Problema: Import error
```bash
# Verifica che le directory abbiano __init__.py
ls apps/backend-rag/backend/core/plugins/__init__.py
ls apps/backend-rag/backend/plugins/__init__.py
```

### Problema: API route 404
```python
# Verifica che il router sia incluso
app.include_router(plugins_router)
```

## ═══════════════════════════════════════════════════════
## CHECKLIST DEPLOYMENT
## ═══════════════════════════════════════════════════════

Backend Python:
□ Aggiunti import plugin in main_cloud.py
□ Aggiunto @app.on_event("startup") con registry.register()
□ Aggiunto app.include_router(plugins_router)
□ Server si avvia senza errori
□ Log mostra "✅ Registered 3 plugins"

Backend TypeScript:
□ Aggiunto import pluginsRouter
□ Aggiunto app.use('/api/plugins', pluginsRouter)

Frontend:
□ Aggiunto import PluginMarketplace
□ Aggiunta route /admin/plugins
□ Marketplace si apre correttamente

Test API:
□ GET /api/plugins/list funziona
□ POST /api/plugins/{name}/execute funziona
□ GET /api/plugins/{name}/metrics funziona

## ═══════════════════════════════════════════════════════
## NEXT: Migrare Altri Tool
## ═══════════════════════════════════════════════════════

Usa lo script di migrazione:
```bash
python scripts/plugins/migrate_handler_to_plugin.py \
  --handler-name oracle_query \
  --category bali-zero \
  --description "Query RAG oracle"
```

Questo crea:
- plugins/bali_zero/oracle_query_plugin.py
- tests/plugins/test_oracle_query_plugin.py

Completa i TODO nel file generato, poi registra il plugin.

═══════════════════════════════════════════════════════════
Fine Patch
═══════════════════════════════════════════════════════════
