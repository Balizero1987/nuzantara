# Shared Configuration

Consolidated configuration directory for NUZANTARA project.

## 📂 Structure

### `/core/`
Essential configuration files used across the entire project:
- `railway*.toml` - Fly.io deployment configs
- `tsconfig*.json` - TypeScript compilation settings
- `eslint.config.js` - Code linting rules
- `jest.config.js` - Test framework configuration
- `categories_v2.json` - Business category definitions
- `category_guardrails.json` - Category validation rules

### `/dev/`
Development and testing data:
- `*test*.json` - Test result files
- `*training*.json` - AI training metadata
- `claude-models*.json` - Model evaluation results
- `zantara_*_metadata.json` - Training datasets

### `/templates/`
Configuration templates and examples:
- `compliance_templates.json` - Legal compliance templates

## 🔧 Usage

### From Root
```bash
# Build configs
npm run build # Uses shared/config/core/tsconfig.json

# Fly.io deployment
railway up # Uses shared/config/core/railway.toml
```

### From Apps
```bash
# App-specific configs are in respective app directories:
# apps/webapp/config/ - Web app settings
# apps/backend-ts/config/ - Backend TypeScript settings
```

## 📋 Migration Notes

Moved from old `config/` structure:
- Core configs → `shared/config/core/`
- Test data → `shared/config/dev/`
- App configs → `apps/*/config/`
- Old files → `config/archive/`

---
**Last Updated**: 2025-10-18