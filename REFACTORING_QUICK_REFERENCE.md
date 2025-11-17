# NUZANTARA - Refactoring Quick Reference Guide

**Quick Links to Key Sections:**
- [Critical Issues Checklist](#critical-issues-checklist)
- [File Organization Map](#file-organization-map)
- [Dependency Issues](#dependency-issues)
- [Code Quality Metrics](#code-quality-metrics)
- [Action Items by Priority](#action-items-by-priority)

---

## CRITICAL ISSUES CHECKLIST

### Must Fix Immediately (This Week)

- [ ] **TypeScript Strict Mode** - File: `apps/backend-ts/tsconfig.json`
  - Change `"strict": false` to `true`
  - Address 2,255+ any/unknown type violations
  - **Effort:** 3-5 days
  - **Risk:** High (will reveal bugs)

- [ ] **Delete Corrupted Files** - Location: `apps/backend-ts/src/`
  - `server.ts(537,11)` 
  - `server-debug.ts(121,7)`
  - **Effort:** 30 minutes
  - **Risk:** Low

- [ ] **Update Vulnerable Dependencies**
  ```bash
  npm audit fix --force
  # Then manually review astro, esbuild, glob, js-yaml updates
  ```
  - **Effort:** 1-2 hours
  - **Risk:** Medium (breaking changes possible)

### Fix This Month

- [ ] **Consolidate main_cloud.py** (5,199 lines → <1,000 lines each)
  - Split into modules: `routes.py`, `handlers.py`, `models.py`, etc.
  - **Effort:** 2-3 weeks
  - **Risk:** High (extensive refactoring)

- [ ] **Update All 12 Apps to Workspaces**
  - Add to `package.json` workspaces array
  - Standardize version numbers
  - **Effort:** 1 week
  - **Risk:** Low

- [ ] **Consolidate Python Dependencies**
  - Merge 7 `requirements.txt` files into 1
  - Create: `apps/backend-rag/requirements.txt`
  - **Effort:** 2-3 days
  - **Risk:** Medium (version conflicts)

---

## FILE ORGANIZATION MAP

### Apps Status

| App | Dir | Files | Size | Status | Fix Priority |
|-----|-----|-------|------|--------|--------------|
| backend-ts | `apps/backend-ts/` | 335 TS | 17M | Core, needs refactor | HIGH |
| backend-rag | `apps/backend-rag/` | 164 Py | 88M | Monolithic file issue | CRITICAL |
| webapp | `apps/webapp/` | ? | 67M | Large, redundant? | MEDIUM |
| webapp-next | `apps/webapp-next/` | ? | 16M | Duplicate? | MEDIUM |
| vibe-dashboard | `apps/vibe-dashboard/` | ? | 54M | Large bundle | MEDIUM |
| intel-scraping | `apps/intel-scraping/` | ? | 739K | Well-organized | LOW |
| publication | `apps/publication/` | ? | 8.5M | Well-organized | LOW |
| memory-service | `apps/memory-service/` | ? | 221K | Underdeveloped | LOW |
| dashboard | `apps/dashboard/` | ? | 43K | Basic | LOW |
| bali-intel-scraper | `apps/bali-intel-scraper/` | ? | 77K | Minimal | LOW |
| qdrant-service | `apps/qdrant-service/` | ? | 1K | Skeleton | LOW |
| self-healing | `apps/self-healing/` | ? | 94K | Limited scope | LOW |

### Root-Level Organization Issues

```
nuzantara/
├── 🔴 CLEANUP NEEDED:
│   ├── 10 Python scripts at root (generate_*.py, validate_*.py, etc.)
│   ├── Large dataset files (DATASET_GEMMA/, *.json 10MB+)
│   ├── Suspicious files: server.ts(537,11), server-debug.ts(121,7)
│   ├── Multiple server variants (server.ts, server-debug.ts, etc.)
│   └── Scattered migration files
│
├── 🟡 REORGANIZE:
│   ├── docs/ (23MB → should be 5MB max)
│   ├── Multiple requirements.txt locations
│   ├── .env.architect, .env.safe, .env.spark
│   ├── Unclear src/spark/, gateway/ purpose
│   └── Missing packages/ directory
│
└── ✅ KEEP:
    ├── .github/workflows/ (8 CI/CD workflows)
    ├── docker/ (well-organized)
    ├── scripts/ (good structure)
    ├── monitoring/ (good structure)
    └── apps/ (good structure)
```

---

## DEPENDENCY ISSUES

### Security Vulnerabilities (npm audit)

| Package | Severity | Issue | Fix |
|---------|----------|-------|-----|
| glob | HIGH | Command injection | Update to latest |
| astro | MODERATE | X-Forwarded-Host bypass | Update to 5.15.9+ |
| esbuild | MODERATE | GHSA-67mh-4wv8-2f99 | Update to latest |
| js-yaml | MODERATE | Prototype pollution | Update to >=4.1.1 |

### Python Dependencies Issues

**Problem:** 7 `requirements.txt` files in different locations
```
apps/backend-rag/requirements.txt                    ❌ Empty (62 bytes)
apps/backend-rag/backend/requirements.txt            ✓ Real file
apps/backend-rag/backend/requirements-backend.txt    ❌ Duplicate?
apps/backend-rag/scripts/requirements.txt            ⚠️  Unknown
apps/bali-intel-scraper/requirements.txt             ⚠️  Separate
apps/self-healing/agents/requirements.txt            ⚠️  Separate
apps/self-healing/orchestrator/requirements.txt      ⚠️  Separate
```

**Solution:** Consolidate to single source of truth
```
apps/backend-rag/requirements.txt       (single file)
apps/bali-intel-scraper/requirements.txt (keep separate)
```

### Workspace Configuration

**Current (INCOMPLETE):**
```json
"workspaces": [
  "apps/backend-ts",
  "apps/backend-rag",
  "apps/dashboard",
  "apps/webapp",
  "apps/publication",
  "packages/*"           ← doesn't exist
]
```

**Should Be (COMPLETE):**
```json
"workspaces": [
  "apps/backend-ts",
  "apps/backend-rag",
  "apps/bali-intel-scraper",
  "apps/dashboard",
  "apps/intel-scraping",
  "apps/memory-service",
  "apps/publication",
  "apps/qdrant-service",
  "apps/self-healing",
  "apps/vibe-dashboard",
  "apps/webapp",
  "apps/webapp-next",
  "packages/*"           ← create this directory
]
```

---

## CODE QUALITY METRICS

### TypeScript Issues

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Strict Mode | ❌ OFF | ON | 🔴 CRITICAL |
| any/unknown types | 2,255+ | 0 | 🔴 CRITICAL |
| @ts-ignore comments | 10+ | 0 | 🟡 HIGH |
| Deeply nested imports | 4+ | 0 | 🟡 HIGH |
| Test coverage | ~40% | 80%+ | 🟡 MEDIUM |
| TODO/FIXME comments | 415+ | <50 | 🟡 HIGH |

### Python Issues

| Metric | Current | Status |
|--------|---------|--------|
| Monolithic files (>3K lines) | 1 (5,199 lines) | 🔴 CRITICAL |
| TODO/FIXME comments | 22+ | 🟡 MEDIUM |
| Test coverage | Unknown | ⚠️  UNKNOWN |
| Consistent naming | Poor | 🟡 MEDIUM |

### File Size Issues

| File | Current | Status |
|------|---------|--------|
| main_cloud.py | 5,199 lines | 🔴 CRITICAL |
| server.ts | 24.6 KB | 🟡 HIGH |
| webapp app size | 67 MB | 🟡 MEDIUM |
| backend-ts size | 17 MB | 🟡 MEDIUM |
| docs directory | 23 MB | 🟡 MEDIUM |

---

## ACTION ITEMS BY PRIORITY

### URGENT (This Week)

1. **Enable TypeScript Strict Mode**
   - File: `apps/backend-ts/tsconfig.json`
   - Change: `"strict": false` → `true`
   - Also enable: `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`
   - Time: 3-5 days
   - Impact: Will surface ~2,255 type errors

2. **Delete Corrupted Files**
   - Delete: `apps/backend-ts/src/server.ts(537,11)`
   - Delete: `apps/backend-ts/src/server-debug.ts(121,7)`
   - Time: 30 minutes
   - Impact: Reduce build confusion

3. **Fix Security Vulnerabilities**
   - Run: `npm audit fix --force`
   - Review: astro, esbuild, glob updates
   - Test: E2E tests after update
   - Time: 2-4 hours
   - Impact: Critical security fixes

4. **Consolidate Python Dependencies**
   - Delete 6 of 7 `requirements.txt` files
   - Keep only: `apps/backend-rag/requirements.txt`
   - Time: 2-3 hours
   - Impact: Easier maintenance

### HIGH (This Month)

5. **Update Workspaces Configuration**
   - Add all 12 apps to `package.json` workspaces
   - Standardize versions (currently 5.2.0 vs 1.0.0)
   - Time: 3-5 days
   - Impact: Unified dependency management

6. **Start Refactoring main_cloud.py**
   - Split 5,199-line file into modules
   - Create: routers/, handlers/, models/, services/
   - Time: 2-3 weeks
   - Impact: Maintainability, testing, security

7. **Consolidate Server Variants**
   - Decide: Keep only one of:
     - `server.ts` (main)
     - `server-debug.ts` (debug)
     - `server-incremental.ts` (incremental)
     - `server-minimal.ts` (minimal)
   - Time: 1 week
   - Impact: Clarity, reduced confusion

8. **Organize Root-Level Files**
   - Create: `scripts/dataset-generation/`
   - Move: All 10 Python scripts
   - Move: Dataset files to proper directory
   - Create: `.gitignore` rules for datasets
   - Time: 1-2 days
   - Impact: Better organization

9. **Reduce Documentation Size**
   - Target: 23 MB → 5 MB max
   - Actions:
     - Archive old session logs
     - Remove duplicate guides
     - Consolidate patches
   - Time: 2-3 days
   - Impact: Easier navigation

### MEDIUM (Next 2 Months)

10. **Type Safety Improvements**
    - Add comprehensive type definitions
    - Remove all `@ts-ignore` comments
    - Add strict types to handlers
    - Time: 2 weeks
    - Impact: Better IDE support, fewer bugs

11. **Test Coverage**
    - Target: 80%+ coverage
    - Add E2E tests for critical flows
    - Setup coverage CI checks
    - Time: 3 weeks
    - Impact: Fewer regressions

12. **Path Aliases**
    - Configure: `paths` in `tsconfig.json`
    - Replace: All `../../../../` imports
    - Benefits: Easier refactoring, clarity
    - Time: 1 week
    - Impact: Better code organization

13. **Frontend Strategy**
    - Decide: Which frontend is authoritative?
    - Options:
      - Keep `webapp` (vanilla JS)
      - Keep `webapp-next` (Next.js) and deprecate others
      - Keep `vibe-dashboard` (React) and merge
    - Time: Depends on decision
    - Impact: Reduced duplication

### LOW (Later)

14. Unused dependency audit
15. Performance optimization (bundle size)
16. Monitoring improvements
17. Documentation templates

---

## COMMAND QUICK REFERENCE

### Fix TypeScript Strict Mode
```bash
# 1. Enable strict mode
cd apps/backend-ts
# Edit tsconfig.json: set "strict": true

# 2. Run type check
npm run typecheck

# 3. Fix errors incrementally
# Expect: 2,255+ errors
# Fix in batches of 50-100 per day
```

### Consolidate Requirements
```bash
# 1. Review all requirements.txt files
cat apps/backend-rag/backend/requirements.txt
cat apps/backend-rag/backend/requirements-backend.txt
# ... etc

# 2. Merge into single file
cp apps/backend-rag/backend/requirements.txt apps/backend-rag/requirements.txt

# 3. Delete duplicates
rm apps/backend-rag/backend/requirements-backend.txt
```

### Update Workspaces
```bash
# 1. Edit package.json
nano package.json

# 2. Add all 12 apps
# 3. Update workspace versions
npm install
```

### Security Audit
```bash
npm audit
npm audit fix
npm audit fix --force  # for breaking changes
npm test  # verify nothing broke
```

---

## ESTIMATED TIMELINE

| Phase | Duration | Key Tasks | Impact |
|-------|----------|-----------|--------|
| **Foundation** | 1-2 weeks | TypeScript strict, fix vulnerabilities, consolidate deps | Immediate quality improvement |
| **Architecture** | 2-3 weeks | Update workspaces, organize files, start main_cloud.py | Better project structure |
| **Code Quality** | 3-4 weeks | Type definitions, deep imports, error handling | Reduced technical debt |
| **Testing & Docs** | 2-3 weeks | Coverage, documentation, guides | Easier onboarding |
| **Performance** | 1-2 weeks | Optimization, monitoring, security scanning | Production readiness |
| **TOTAL** | **9-15 weeks** | Full refactoring | Enterprise-grade quality |

---

## SUCCESS CRITERIA

After completing refactoring:
- ✅ TypeScript strict mode enabled
- ✅ 0 security vulnerabilities in npm audit
- ✅ 80%+ test coverage
- ✅ 0 `any` types (with exceptions documented)
- ✅ All monolithic files < 1,000 lines
- ✅ All 12 apps in workspaces
- ✅ Documentation < 5 MB
- ✅ <50 total TODO/FIXME comments
- ✅ Consistent naming conventions
- ✅ Path aliases for all imports

---

## RESOURCES

- **Full Analysis:** `REFACTORING_ANALYSIS_COMPREHENSIVE.md`
- **Architecture Docs:** `docs/ARCHITECTURE.md`
- **Deployment Guide:** `docs/DEPLOYMENT_GUIDE.md`
- **Configuration:** `Makefile` for all commands

**Generated:** 2025-11-17  
**Status:** Production-ready with technical debt requiring systematic refactoring
