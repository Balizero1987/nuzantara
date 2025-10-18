# 🧹 SAFE CLEANUP PLAN - ZANTARA v5.2.0

## ✅ FASE 1: Backup Completo
```bash
cp -r "/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch" "/Users/antonellosiano/Desktop/zantara-bridge-backup-$(date +%Y%m%d)"
```

## 🗑️ FASE 2: Rimozione Sicura

### Archive Directory (100% Safe)
```bash
rm -rf archive/old-openapi/         # 17 OpenAPI specs obsolete
rm -rf archive/old-custom-gpt/      # 14 debug documents
# MANTIENI: archive/oauth2/ (potrebbe servire per reference)
```

### Environment Backups (Safe)
```bash
rm .env.backup .env.original .env.updated .env.fixed .env.v520
# MANTIENI: .env (attuale)
```

### Documentation Duplicata (Safe)
```bash
rm SECURITY_CLEANUP_REPORT.md
rm OAUTH2_SUCCESS_REPORT.md
rm DEPLOYMENT_SUCCESS_REPORT.md
rm FINAL_CLEANUP_REPORT.md
# MANTIENI: HANDOVER_LOG.md, AI_START_HERE.md (critici)
```

### Test Files Isolati (Careful)
```bash
rm test-calendar.json test-docs.json test-drive.json
rm test-identity.json test-prod-ai.json test-ambaradam.json
rm test-firestore.json test-sheets.json test-slides.json test-prod-oauth2.json
# MANTIENI: test-*.sh scripts (potrebbero servire per debugging)
```

### Build Artifacts (Safe)
```bash
rm dist/handlers.js.backup
```

## ⚠️ NON TOCCARE MAI

### Core Systems
```bash
✅ src/                    # v5.2.0 core
✅ bridge.js               # Critical fallback
✅ handlers.js             # Legacy handler registry
✅ server.js               # Alternative server
✅ custom-gpt-handlers.js  # Business logic
✅ memory.js               # Memory system
✅ cache.js                # Performance
✅ rate-limiter.js         # Security
```

## 📊 RISULTATO ATTESO
- **File rimossi**: ~45 file (archive + backups + docs)
- **Spazio liberato**: ~15-20MB
- **Rischio rottura**: 0% (solo file isolati)
- **Funzionalità mantenute**: 100%

## 🔍 VERIFICA POST-CLEANUP
```bash
# Test server v5.2.0
npm start
curl http://localhost:8080/health

# Test fallback bridge
# (Deve funzionare per handler non in v5.2.0)
```