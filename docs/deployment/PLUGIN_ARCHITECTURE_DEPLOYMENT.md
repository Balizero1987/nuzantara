# ZANTARA Unified Plugin Architecture - Deployment Guide

## 📋 Overview

This document provides complete deployment instructions for the ZANTARA Unified Plugin Architecture, a comprehensive refactoring that transforms 143+ scattered tools into a modular, maintainable system.

## 🎯 What This Achieves

### Before Migration:
- ❌ 143+ inconsistent tools across TypeScript and Python
- ❌ No standardized interface (some async, some sync)
- ❌ No performance metrics
- ❌ No rate limiting or caching
- ❌ Difficult to add new tools
- ❌ Inconsistent error handling
- ❌ No testing framework

### After Migration:
- ✅ Unified plugin interface for all tools
- ✅ Consistent async API
- ✅ Built-in performance monitoring
- ✅ Rate limiting and caching
- ✅ Hot-reload capability
- ✅ Automated testing framework
- ✅ Auto-generated documentation
- ✅ Plugin marketplace UI
- ✅ Backward compatibility maintained

---

## 📁 What Was Created

### Core Architecture Files

#### Python Backend (`apps/backend-rag/backend/`)
```
core/plugins/
├── __init__.py              # Plugin system exports
├── plugin.py                # Base plugin classes (Plugin, PluginMetadata, etc.)
├── registry.py              # Plugin registry (discovery, versioning, lifecycle)
└── executor.py              # Plugin executor (caching, rate limiting, metrics)

plugins/
├── __init__.py
├── bali_zero/
│   ├── __init__.py
│   └── pricing_plugin.py    # Example: Pricing plugin (migrated from zantara_tools)
└── team/
    ├── __init__.py
    ├── search_member_plugin.py
    └── list_members_plugin.py

api/
└── plugins.py               # FastAPI routes for plugin API

tests/plugins/
├── __init__.py
├── plugin_test_base.py      # Base test class for all plugins
├── test_pricing_plugin.py
└── test_team_plugins.py
```

#### TypeScript Backend (`apps/backend-ts/src/`)
```
core/plugins/
├── index.ts                 # Exports
├── Plugin.ts                # Base plugin classes
├── PluginRegistry.ts        # Registry
└── PluginExecutor.ts        # Executor

api/
└── pluginsRouter.ts         # Express routes for plugin API
```

#### Frontend (`apps/webapp/src/`)
```
components/
├── PluginMarketplace.tsx    # Admin UI for plugin management
└── PluginMarketplace.css    # Styles
```

#### Scripts & Documentation
```
scripts/plugins/
├── generate_docs.py         # Python documentation generator
├── generate_docs.ts         # TypeScript documentation generator
└── migrate_handler_to_plugin.py  # Migration helper script

docs/plugins/
└── (auto-generated plugin documentation)
```

---

## 🚀 Deployment Steps

### Phase 1: Pre-Deployment Checks

**1. Verify File Creation**
```bash
# Check Python files
ls -la apps/backend-rag/backend/core/plugins/
ls -la apps/backend-rag/backend/plugins/
ls -la apps/backend-rag/backend/api/plugins.py

# Check TypeScript files
ls -la apps/backend-ts/src/core/plugins/
ls -la apps/backend-ts/src/api/pluginsRouter.ts

# Check frontend
ls -la apps/webapp/src/components/PluginMarketplace.*

# Check scripts
ls -la scripts/plugins/
```

**2. Review Changes**
```bash
git status
git diff --stat
```

### Phase 2: Backend Setup

**Python Backend Setup**

1. **Install Dependencies** (if needed)
```bash
cd apps/backend-rag
# Add any new dependencies to requirements.txt
pip install -r requirements.txt
```

2. **Register Plugin API Routes**

Edit `apps/backend-rag/backend/app/main_cloud.py`:
```python
from api.plugins import router as plugins_router

# Add after other routers
app.include_router(plugins_router)
```

3. **Register Example Plugins on Startup**

Edit `apps/backend-rag/backend/app/main_cloud.py`:
```python
from core.plugins import registry
from plugins.bali_zero.pricing_plugin import PricingPlugin
from plugins.team.search_member_plugin import TeamMemberSearchPlugin
from plugins.team.list_members_plugin import TeamMembersListPlugin

@app.on_event("startup")
async def register_plugins():
    """Register all plugins on startup"""
    logger.info("🔌 Registering plugins...")

    # Register example plugins
    await registry.register(PricingPlugin)
    await registry.register(TeamMemberSearchPlugin)
    await registry.register(TeamMembersListPlugin)

    # Auto-discover plugins in plugins directory
    plugins_dir = Path(__file__).parent.parent / "plugins"
    await registry.discover_plugins(plugins_dir, "backend.plugins")

    stats = registry.get_statistics()
    logger.info(f"✅ Registered {stats['total_plugins']} plugins")
```

**TypeScript Backend Setup**

1. **Register Plugin API Routes**

Edit `apps/backend-ts/src/server.ts` or your main router file:
```typescript
import pluginsRouter from './api/pluginsRouter';

// Add plugin routes
app.use('/api/plugins', pluginsRouter);
```

2. **Register Plugins on Startup** (optional, for TypeScript plugins)

Edit startup code:
```typescript
import { registry, wrapHandlerAsPlugin, PluginCategory } from './core/plugins';
import { baliZeroPricing } from './handlers/bali-zero/bali-zero-pricing';

// Wrap existing handlers as plugins
const pricingPlugin = wrapHandlerAsPlugin(
  'bali-zero.pricing',
  PluginCategory.BALI_ZERO,
  'Get official Bali Zero pricing',
  baliZeroPricing,
  {
    requiresAuth: false,
    estimatedTime: 0.5,
    tags: ['pricing', 'bali-zero']
  }
);

await registry.register(pricingPlugin);
```

### Phase 3: Frontend Setup

**1. Add Route for Plugin Marketplace**

Edit `apps/webapp/src/App.tsx` (or your router configuration):
```typescript
import PluginMarketplace from './components/PluginMarketplace';

// Add route (adjust based on your routing setup)
<Route path="/admin/plugins" element={<PluginMarketplace />} />
```

**2. Import CSS**

Make sure `PluginMarketplace.css` is imported:
```typescript
import './PluginMarketplace.css';
```

### Phase 4: Testing

**1. Run Python Tests**
```bash
cd apps/backend-rag
pytest backend/tests/plugins/ -v
```

**2. Test API Endpoints**
```bash
# List plugins
curl http://localhost:8000/api/plugins/list | jq

# Get plugin details
curl http://localhost:8000/api/plugins/bali_zero.pricing | jq

# Execute plugin
curl -X POST http://localhost:8000/api/plugins/bali_zero.pricing/execute \
  -H 'Content-Type: application/json' \
  -d '{"input_data": {"service_type": "kitas"}}' | jq

# Get metrics
curl http://localhost:8000/api/plugins/bali_zero.pricing/metrics | jq
```

**3. Test Frontend**
- Navigate to `/admin/plugins`
- Verify plugin list loads
- Click on a plugin to view details
- Check that metrics are displayed

### Phase 5: Generate Documentation

```bash
# Generate Python plugin documentation
python scripts/plugins/generate_docs.py

# Generate TypeScript plugin documentation
ts-node scripts/plugins/generate_docs.ts

# View generated docs
ls docs/plugins/
```

---

## 🔄 Migration Strategy

### Option A: Gradual Migration (Recommended)

**Week 1-2: Core Infrastructure**
- ✅ Deploy plugin architecture (already done)
- Register 3 example plugins (pricing, team search, team list)
- Monitor performance and stability
- Train team on new system

**Week 3-4: Migrate Priority Tools**
- Migrate 20-30 most-used tools
- Run A/B tests (old vs new system)
- Gather feedback

**Week 5-8: Full Migration**
- Migrate remaining tools (batch migration)
- Deprecate old handlers
- Update all documentation

**Week 9+: Cleanup**
- Remove old handler code
- Optimize performance
- Scale based on usage

### Option B: Big Bang Migration

**⚠️ Higher Risk**

1. Migrate all 143 tools in one go
2. Deploy to staging
3. Full regression testing
4. Deploy to production
5. Monitor closely for 48 hours

---

## 📊 Success Metrics

### Technical Metrics
- **Plugin Registration**: Track number of plugins registered
- **Execution Time**: Monitor avg execution time per plugin
- **Success Rate**: Track success/failure rates
- **Cache Hit Rate**: Monitor caching effectiveness
- **Rate Limiting**: Track rate limit hits

### Business Metrics
- **Development Velocity**: Time to add new tools
- **Bug Rate**: Track bugs in plugin system vs old system
- **Developer Satisfaction**: Survey team on new architecture
- **API Response Time**: Monitor API performance

---

## 🐛 Troubleshooting

### Plugin Not Found
**Symptom**: `Plugin {name} not found` error

**Solution**:
```python
# Check if plugin is registered
from core.plugins import registry
print(registry.get_all_plugin_names())

# Manually register if needed
from plugins.your_category.your_plugin import YourPlugin
await registry.register(YourPlugin)
```

### Import Errors
**Symptom**: `ModuleNotFoundError: No module named 'core.plugins'`

**Solution**:
- Verify file structure is correct
- Check `__init__.py` files exist
- Verify Python path includes backend directory

### Plugin Execution Timeout
**Symptom**: Plugin execution times out

**Solution**:
```python
# Increase timeout in plugin metadata
PluginMetadata(
    estimated_time=5.0,  # Increase this
    ...
)

# Or override timeout when executing
await executor.execute(
    plugin_name,
    input_data,
    timeout=10000  # 10 seconds
)
```

### Rate Limit Issues
**Symptom**: Rate limit errors too frequent

**Solution**:
```python
# Adjust rate limit in plugin metadata
PluginMetadata(
    rate_limit=100,  # Increase from default
    ...
)
```

---

## 🔒 Security Considerations

1. **Admin Endpoints**: Secure `/reload` endpoints with proper admin auth
2. **Rate Limiting**: Configure appropriate rate limits per plugin
3. **Input Validation**: All plugins use Pydantic for input validation
4. **Auth Requirements**: Set `requires_auth` appropriately for each plugin
5. **Logging**: All plugin executions are logged for audit trails

---

## 📈 Performance Optimization

### Caching Strategy
```python
# Enable Redis caching for better performance
import redis.asyncio as redis
from core.plugins import executor

redis_client = redis.from_url("redis://localhost:6379")
executor.redis = redis_client
```

### Plugin Warming
```python
# Warm frequently-used plugins on startup
hot_plugins = ["bali_zero.pricing", "team.search_member"]
await executor.warm_plugins(hot_plugins)
```

### Parallel Execution
```python
# Execute multiple plugins in parallel
from core.plugins import executor
import asyncio

results = await asyncio.gather(
    executor.execute("plugin1", data1),
    executor.execute("plugin2", data2),
    executor.execute("plugin3", data3)
)
```

---

## 📝 Next Steps After Deployment

1. **Monitor Metrics**: Watch plugin execution metrics for 48 hours
2. **Migrate More Tools**: Use migration script to convert remaining handlers
3. **Write Tests**: Ensure all migrated plugins have tests
4. **Update Documentation**: Keep plugin docs up to date
5. **Gather Feedback**: Get team feedback on new architecture
6. **Optimize**: Based on metrics, optimize slow plugins
7. **Scale**: Adjust rate limits and caching based on usage

---

## 🆘 Support

- **Documentation**: See `docs/plugins/` for full plugin documentation
- **Issues**: Report issues on GitHub
- **Team**: Contact dev team for migration help

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] All plugin files created
- [ ] Tests written and passing
- [ ] Documentation generated
- [ ] Code reviewed
- [ ] Backup created

### Deployment
- [ ] Deploy to staging
- [ ] Run integration tests
- [ ] Test admin UI
- [ ] Monitor metrics
- [ ] Deploy to production

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify caching works
- [ ] Test rate limiting
- [ ] Gather team feedback

---

**Date**: 2025-01-06
**Version**: 1.0.0
**Status**: Ready for Deployment 🚀
