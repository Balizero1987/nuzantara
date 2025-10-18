# 📦 Dependencies Cleanup Plan - 2025-10-18

**Current state**: 742 packages installed (1.0GB)
**Objective**: Remove unused/obsolete dependencies
**Expected**: ~600-650 packages (~800MB)

---

## 📊 Current Analysis

### Package.json Dependencies
- **devDependencies**: 17 packages
- **dependencies**: 44 packages
- **Total declared**: 61 packages
- **Installed (with transitive)**: 742 packages

### node_modules Size
```
Before: 1.0GB, 742 packages
Target: ~800MB, ~600 packages
Reduction: ~200MB, ~150 packages
```

---

## ❌ PACKAGES TO REMOVE (8 packages)

### 1. **twilio** (CONFIRMED UNUSED) ❌
**Size**: ~5MB + dependencies
**Status**: Removed in 2025-10-09 (see docs/TWILIO_REMOVED_2025-10-09.md)
**Usage**: Not found in codebase
**Action**: REMOVE

```bash
npm uninstall twilio
```

### 2. **cohere-ai** (UNUSED) ❌
**Size**: ~2MB + dependencies
**Status**: Not used (we use Anthropic Claude + OpenAI)
**Usage**: Not found in codebase
**Action**: REMOVE

```bash
npm uninstall cohere-ai
```

### 3. **chart.js** (FRONTEND LIBRARY) ❌
**Size**: ~1MB
**Status**: Frontend charting library, not needed in backend
**Usage**: Not found in backend code
**Action**: REMOVE

```bash
npm uninstall chart.js
```

### 4. **swagger-ui-express** (COMMENTED OUT) ❌
**Size**: ~3MB + dependencies
**Status**: Commented out in index.ts
**Usage**: `// import swaggerUi from 'swagger-ui-express';`
**Action**: REMOVE (can add back if needed)

```bash
npm uninstall swagger-ui-express
```

### 5. **open** (CLI TOOL) ❌
**Size**: ~500KB
**Status**: CLI tool for opening URLs/files, not needed in server
**Usage**: Not found in codebase
**Action**: REMOVE

```bash
npm uninstall open
```

### 6. **node-cron** (UNUSED - Railway Cron) ❌
**Size**: ~200KB
**Status**: Not used (cron jobs run on Railway, not in-process)
**Usage**: Not found in codebase
**Reason**: Railway handles cron scheduling via `railway_cron.toml`
**Action**: REMOVE

```bash
npm uninstall node-cron
```

### 7. **@google-cloud/firestore** (REDUNDANT) ❌
**Size**: ~10MB + dependencies
**Status**: Redundant (firebase-admin includes Firestore)
**Usage**: Not directly imported (firebase-admin provides it)
**Action**: REMOVE

```bash
npm uninstall @google-cloud/firestore
```

### 8. **@types/node-fetch** (UNUSED - Node 18+) ❌
**Size**: ~100KB
**Status**: Node 18+ has native fetch, types built-in
**Usage**: Not needed with modern Node.js
**Action**: REMOVE

```bash
npm uninstall @types/node-fetch
```

---

## ⚠️ PACKAGES TO REVIEW (Maybe remove)

### 1. **@google/generative-ai** (Gemini API)
**Size**: ~2MB
**Status**: Used only in test mocks
**Production use**: None found
**Decision**: **KEEP for now** (might be used in future, minimal size)

### 2. **@octokit/rest** (GitHub API)
**Size**: ~3MB + dependencies
**Usage**: GitHub integration (PR reviews, etc.)
**Decision**: **KEEP** (used for DevAI GitHub integration)

### 3. **autocannon** (Load testing)
**Size**: ~2MB
**Status**: devDependency for performance testing
**Decision**: **KEEP** (useful for testing)

### 4. **playwright** (Browser automation)
**Size**: ~100MB (browsers)
**Status**: devDependency for E2E testing
**Decision**: **KEEP** (important for testing)

---

## ✅ PACKAGES TO KEEP (Essential)

### Core Runtime
- ✅ **express** - HTTP server
- ✅ **axios** - HTTP client
- ✅ **dotenv** - Environment variables
- ✅ **cors** - CORS handling
- ✅ **express-rate-limit** - Rate limiting

### AI/ML
- ✅ **@anthropic-ai/sdk** - Claude API (PRIMARY)
- ✅ **openai** - OpenAI API (fallback/tools)
- ✅ **@google/generative-ai** - Gemini (future use)

### Database
- ✅ **@prisma/client** - PostgreSQL ORM
- ✅ **@prisma/extension-accelerate** - Prisma caching
- ✅ **redis** - Redis client
- ✅ **firebase-admin** - Firebase/Firestore

### Security
- ✅ **bcryptjs** - Password hashing
- ✅ **jsonwebtoken** - JWT auth
- ✅ **@google-cloud/secret-manager** - Secrets management

### Utilities
- ✅ **cheerio** - HTML parsing (scraping)
- ✅ **glob** - File pattern matching
- ✅ **js-yaml** - YAML parsing
- ✅ **lru-cache** - In-memory caching
- ✅ **multer** - File uploads
- ✅ **node-cache** - Simple caching
- ✅ **winston** - Logging
- ✅ **ws** - WebSocket
- ✅ **zod** - Schema validation

### Google APIs
- ✅ **googleapis** - Google Workspace integration

### MCP/Tools
- ✅ **@modelcontextprotocol/sdk** - MCP support

### TypeScript/Build (devDependencies)
- ✅ **typescript** - TypeScript compiler
- ✅ **tsx** - TypeScript execution
- ✅ **esbuild** - Fast bundler
- ✅ **nodemon** - Dev server

### Testing (devDependencies)
- ✅ **jest** - Test framework
- ✅ **@jest/globals** - Jest globals
- ✅ **ts-jest** - TypeScript support for Jest
- ✅ **supertest** - HTTP testing
- ✅ **@playwright/test** - E2E testing
- ✅ **playwright** - Browser automation

### Type Definitions (devDependencies)
- ✅ **@types/*** - TypeScript types for libraries

---

## 🔄 EXECUTION PLAN

### Phase 1: Backup (DONE in docs cleanup)
```bash
# Already have full git history + backup
```

### Phase 2: Remove Unused Packages
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY

# Remove 8 unused packages
npm uninstall twilio
npm uninstall cohere-ai
npm uninstall chart.js
npm uninstall swagger-ui-express
npm uninstall open
npm uninstall node-cron
npm uninstall @google-cloud/firestore
npm uninstall @types/node-fetch
```

### Phase 3: Clean Install
```bash
# Remove node_modules and lockfile
rm -rf node_modules
rm package-lock.json  # Will regenerate

# Fresh install
npm install

# Verify build works
npm run build
npm run typecheck
```

### Phase 4: Verify
```bash
# Check size
du -sh node_modules/

# Count packages
ls node_modules/ | wc -l

# Test build
npm run build

# Test typecheck
npm run typecheck
```

---

## 📊 Expected Results

### Before
```
node_modules: 1.0GB
Packages: 742
Dependencies in package.json: 61
```

### After
```
node_modules: ~800MB (-200MB, -20%)
Packages: ~600-650 (-100-150, -15-20%)
Dependencies in package.json: 53 (-8)
```

### Removed Dependencies
1. twilio (~5MB)
2. cohere-ai (~2MB)
3. chart.js (~1MB)
4. swagger-ui-express (~3MB)
5. open (~500KB)
6. node-cron (~200KB)
7. @google-cloud/firestore (~10MB)
8. @types/node-fetch (~100KB)

**Total savings**: ~22MB direct + ~180MB transitive dependencies = **~200MB**

---

## ⚠️ Risks & Mitigation

### Risk 1: Breaking Changes
**Mitigation**:
- Test build after removal
- Test typecheck after removal
- Git history allows rollback

### Risk 2: Hidden Dependencies
**Mitigation**:
- Some packages might be used indirectly
- Run full test suite after cleanup
- Monitor for runtime errors

### Risk 3: Future Use
**Mitigation**:
- twilio: Can reinstall if needed (1 min)
- cohere-ai: Can reinstall if needed (1 min)
- Others: Easy to add back

---

## 🎯 Success Criteria

✅ Build succeeds (`npm run build`)
✅ TypeCheck succeeds (`npm run typecheck`)
✅ Tests pass (`npm test`)
✅ node_modules < 900MB
✅ Package count < 700
✅ No runtime errors in production

---

## 📝 Next Steps After Cleanup

### Optional (Future Optimization)
1. **Audit remaining dependencies**
   ```bash
   npm audit
   ```

2. **Check for updates**
   ```bash
   npm outdated
   ```

3. **Dedupe packages**
   ```bash
   npm dedupe
   ```

4. **Consider pnpm** (better deduplication)
   ```bash
   # pnpm uses symlinks, saves ~40% space
   npm install -g pnpm
   pnpm import  # Import from package-lock.json
   pnpm install
   ```

---

## 🔍 Additional Analysis

### Large Dependencies (Review later)
- **googleapis** (~40MB) - Google Workspace integration (NEEDED)
- **firebase-admin** (~20MB) - Firebase/Firestore (NEEDED)
- **playwright** (~100MB browsers) - E2E testing (devDep, NEEDED)
- **@anthropic-ai/sdk** (~5MB) - Claude API (PRIMARY, NEEDED)

These are all essential, but consider:
- Using lighter alternatives where possible
- Lazy loading heavy deps
- Tree-shaking to reduce bundle size

---

**Status**: 📐 PLAN READY
**Next**: Execute cleanup commands
**Time**: ~5 minutes
