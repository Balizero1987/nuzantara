# NUZANTARA Packages

Shared packages used across multiple apps.

## 📦 Packages

### types
**TypeScript type definitions**

Shared type definitions used across backend-api and other TypeScript apps.

```bash
cd packages/types
npm install
```

### tools
**Developer tools** - OAuth2, testing utilities

- `refresh-oauth2-tokens.mjs` - OAuth2 token refresh utility
- `test-*.mjs` - Integration test scripts
- `test-drive-*.py` - Python Drive access tests

```bash
cd packages/tools
npm run refresh-tokens
```

### widget
**Embeddable chat widget** - Vanilla JS SDK

- `zantara-sdk.js` - Main SDK
- `zantara-widget.html` - Widget UI
- `demo.html` - Integration demo

```bash
cd packages/widget
npm run demo  # Serves on port 8002
```

### assets
**Brand assets** - Logos, icons

- SVG logos (scalable)
- PNG logos (512x512)
- Icon variants

```bash
cd packages/assets
npm run showcase  # View all assets
```

### utils-legacy
**Legacy utility functions**

- `errors.ts` - Error handling
- `hash.ts` - Hashing utilities
- `retry.ts` - Retry logic

```bash
cd packages/utils-legacy
npm run build
```

### kb-scripts
**Knowledge base scripts** (placeholder)

See `apps/backend-rag/` for actual KB ingestion scripts.

---

## 🔗 Usage in Apps

Packages are referenced via npm workspaces:

```json
{
  "dependencies": {
    "@nuzantara/types": "*",
    "@nuzantara/utils-legacy": "*"
  }
}
```

---

**Last Updated**: 2025-10-04
