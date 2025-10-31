# NUZANTARA Configurations

Centralized configuration files for all apps and services.

## 📁 Structure

### app/
Application configurations

- `chat-app-config.json` - Chat app configuration
- `chat-app-manifest.json` - Chat app manifest
- `openapi-v520-custom-gpt.yaml` - Custom GPT OpenAPI spec
- `openapi.yaml` - Main OpenAPI specification

### misc/
Miscellaneous configurations

- Test files (test-conversation*.json)
- Deployment markers
- Metrics configurations
- Workspace auth URLs

### Root-level configs

**TypeScript**:
- `tsconfig.json` - Main TypeScript config
- `tsconfig.build.json` - Build-specific config

**Fly.io**:
- `railway.toml` - Python RAG backend config
- `railway.typescript.toml` - TypeScript backend config
- `railway_cron.toml` - Scheduled tasks config

**Testing**:
- `jest.config.js` - Jest test configuration

## 🔧 Usage

### TypeScript projects
```json
// Extend from root config
{
  "extends": "../../configs/tsconfig.json"
}
```

### Fly.io Deploy
```bash
# Fly.io auto-deploys on git push
railway up
```

### App configs
Referenced by apps via relative paths or environment variables.

## 📝 Notes

- `.env.example` remains in root (security best practice)
- `.dockerignore` remains in root (Docker requirements)
- App-specific configs should go in `apps/{app-name}/`
- GCP configs archived to `archive/config-gcp/` (2025-10-17)

---

**Last Updated**: 2025-10-18 (Fly.io migration)
