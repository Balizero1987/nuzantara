# NUZANTARA Scripts

Automation scripts for deployment, monitoring, testing, and utilities.

## 📁 Structure

### deploy/
Deployment scripts (8 files)

- `deploy-production.sh` - Full production deployment
- `deploy-full-stack.sh` - Complete stack deployment
- `deploy-direct.sh` - Direct deployment (no build)
- `deploy-code-only.sh` - Code-only deployment
- `deploy-rebuild.sh` - Rebuild + deploy
- `deploy-to-production.sh` - Production push

### monitoring/
Monitoring and performance tools

- `memory-tools.sh` - Memory analysis utilities
- `performance-test.sh` - Performance testing

### setup/
Initial setup scripts (6 files)

- `setup-google-admin.sh` - Google Admin configuration
- `setup-chat-app.sh` - Chat app setup
- `setup-google-chat-local.sh` - Local Google Chat
- `setup-googlechat-webhook.sh` - Webhook configuration
- `ngrok-setup.sh` - Ngrok tunnel setup
- `install-ai-system-v2.sh` - AI system installation

### utils/
Utility scripts (38 files)

**Testing**:
- `test-all-handlers.sh` - Test all 96 handlers
- `test-all-systems.sh` - Full system test
- `test-production.sh` - Production testing
- `test-ai-models.sh` - AI model testing
- `test-memory.sh` - Memory system test
- `test-integration.sh` - Integration tests

**Deployment**:
- `start-zantara.sh` - Start ZANTARA system
- `stop-full-stack.sh` - Stop all services
- `quick-deploy-v6-interfaces.sh` - Quick v6 deploy

**Utilities**:
- `docker-entrypoint.sh` - Docker entrypoint
- `fix-production-oauth2.sh` - OAuth2 fixes
- `reauthorize-production.sh` - Reauthorize
- `workspace-status.sh` - Workspace status
- `zantara-health-check.sh` - Health check
- `zantara-corpus-collector.sh` - Corpus collection

## 🚀 Common Commands

### Deploy to production
```bash
./scripts/deploy/deploy-production.sh
```

### Run all tests
```bash
./scripts/utils/test-all-systems.sh
```

### Check system health
```bash
./scripts/utils/zantara-health-check.sh
```

### Performance test
```bash
./scripts/monitoring/performance-test.sh
```

## 📊 Stats

- **deploy/**: 8 scripts
- **monitoring/**: 2 scripts
- **setup/**: 6 scripts
- **utils/**: 38 scripts
- **root level**: 8 scripts

**Total**: ~62 automation scripts

---

**Last Updated**: 2025-10-04
