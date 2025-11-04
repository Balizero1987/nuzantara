# NUZANTARA Configurations

Centralized configuration files for all apps and services.

## 📁 Structure

### app/
Application configurations

- `chat-app-config.json` - Chat app configuration
- `chat-app-manifest.json` - Chat app manifest
- `openapi-v520-custom-gpt.yaml` - Custom GPT OpenAPI spec
- `openapi.yaml` - Main OpenAPI specification

### cloud/
Cloud infrastructure configs

- `cloud-run-config.yaml` - Cloud Run service config
- `cloudbuild.yaml` - Main Cloud Build config
- `cloudbuild-v520.yaml` - v5.2.0 build config
- `cloudbuild-custom.yaml` - Custom build config
- `cloudbuild-rebuild.yaml` - Rebuild config
- `scheduler-config.yaml` - Cloud Scheduler jobs

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

**Cloud Build**:
- `cloudbuild-m13.yaml` - M13 build config
- `cloudbuild-rag.yaml` - RAG backend build

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

### Cloud Build
```bash
gcloud builds submit --config=configs/cloud/cloudbuild.yaml
```

### App configs
Referenced by apps via relative paths or environment variables.

## 📝 Notes

- `.env.example` remains in root (security best practice)
- `.dockerignore`, `.gcloudignore` remain in root (tool requirements)
- App-specific configs should go in `apps/{app-name}/`

---

**Last Updated**: 2025-10-04
