# NUZANTARA - Frontend Strategy

**Version**: 1.0.0  
**Date**: 2025-11-17 (Phase 2 - Architecture Refactoring)  
**Status**: Defined

This document clarifies the frontend architecture strategy for NUZANTARA, resolving ambiguity about which frontend applications are active, deprecated, or archived.

---

## Executive Summary

**Current State**: 5 frontend-related directories creating confusion  
**Recommendation**: Maintain 3 active frontends with clear distinct purposes  
**Action**: Archive 2 non-production directories

---

## 1. Active Production Frontends

### 1.1 Primary Web Application ⭐ (PRIMARY)

**Directory**: `apps/webapp/`  
**Name**: `nuzantara-webapp`  
**Technology**: Vanilla JavaScript + HTML/CSS  
**Size**: 67MB  
**Status**: ✅ **PRODUCTION** (Main application)

**Purpose**:
- Main user-facing web application
- PWA (Progressive Web App)
- Core NUZANTARA functionality

**Rationale**:
- Largest codebase (67MB)
- Most feature-complete
- Active development
- Vanilla JS = no framework lock-in, fast performance

**Scripts**:
```json
{
  "name": "nuzantara-webapp",
  "version": "5.2.0",
  "description": "NUZANTARA Web Application"
}
```

**Decision**: ✅ **KEEP & MAINTAIN**

---

### 1.2 Operations Dashboard (MONITORING)

**Directory**: `apps/dashboard/`  
**Name**: `@nuzantara/dashboard`  
**Technology**: Vanilla JavaScript  
**Size**: 43KB  
**Status**: ✅ **PRODUCTION** (Monitoring)

**Purpose**:
- Operations monitoring
- System health metrics
- Admin/DevOps interface

**Rationale**:
- Distinct purpose (monitoring vs user app)
- Lightweight (43KB)
- Independent deployment
- Different audience (ops team vs users)

**Decision**: ✅ **KEEP & MAINTAIN**

---

### 1.3 Publication Platform (CONTENT)

**Directory**: `apps/publication/`  
**Name**: `@nuzantara/publication`  
**Technology**: Astro 4.16  
**Size**: 12MB  
**Status**: ✅ **PRODUCTION** (Content)

**Purpose**:
- Bali Zero Publication platform
- McKinsey-style content delivery
- Static site generation

**Rationale**:
- Unique purpose (content publishing)
- Modern Astro framework
- SEO-optimized
- Fast static delivery

**Decision**: ✅ **KEEP & MAINTAIN**

---

## 2. Non-Production Directories

### 2.1 Webapp Next (ARCHIVED)

**Directory**: `apps/webapp-next/`  
**Size**: 16MB  
**Status**: ⚠️ **DRAFT/DESIGN FILES**

**Contents**:
- DESIGN_ANALYSIS_STRATEGY.md
- README.md
- TEST_CHECKLIST.md
- design-v4/ (mockups)
- chat-draft/ (prototypes)

**Analysis**:
- No package.json (not an npm package)
- No production code
- Design/planning artifacts only
- Historical reference value

**Decision**: 📦 **ARCHIVE**

**Action**:
```bash
# Move to archived location
mkdir -p docs/archived/webapp-next-designs
mv apps/webapp-next/* docs/archived/webapp-next-designs/
rmdir apps/webapp-next
```

---

### 2.2 Vibe Dashboard (BUILD OUTPUT ONLY)

**Directory**: `apps/vibe-dashboard/`  
**Size**: 54MB  
**Status**: ⚠️ **BUILD OUTPUT** (no source)

**Contents**:
- `out/` directory only (compiled files)
- No source code
- No package.json at root
- Build artifacts from unknown source

**Analysis**:
- 54MB of compiled output
- Missing source code
- Cannot be rebuilt or maintained
- Unclear origin

**Decision**: 🗑️ **DELETE or ARCHIVE**

**Recommended Action**:
```bash
# Option 1: Delete (if no value)
rm -rf apps/vibe-dashboard

# Option 2: Archive (if might be useful)
mkdir -p apps/archived/vibe-dashboard-build
mv apps/vibe-dashboard apps/archived/
```

---

## 3. Frontend Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   NUZANTARA FRONTENDS                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  PRIMARY: apps/webapp/                          │   │
│  │  Main Web Application (Vanilla JS)              │   │
│  │  • User-facing PWA                              │   │
│  │  • Core functionality                           │   │
│  │  • Port: 3000 (default)                         │   │
│  │  • Deploy: GitHub Pages                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  MONITORING: apps/dashboard/                    │   │
│  │  Operations Dashboard (Vanilla JS)              │   │
│  │  • System metrics                               │   │
│  │  • Health monitoring                            │   │
│  │  • Port: 8081 (internal)                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  CONTENT: apps/publication/                     │   │
│  │  Publication Platform (Astro)                   │   │
│  │  • Bali Zero content                            │   │
│  │  • Static site                                  │   │
│  │  • SEO optimized                                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ARCHIVED:                                      │   │
│  │  • webapp-next (design files)                   │   │
│  │  • vibe-dashboard (build output)                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Technology Rationale

### Why Vanilla JavaScript for Primary App?

✅ **Advantages**:
- No framework dependencies
- Faster load times
- No build step required (optional)
- Direct DOM manipulation
- Easier to maintain long-term
- No version upgrade treadmill

❌ **Disadvantages**:
- More boilerplate code
- Manual state management
- Less tooling support

**Verdict**: Good choice for a PWA with performance requirements

### Why Astro for Publication?

✅ **Advantages**:
- Static site generation (fast)
- SEO-friendly
- Islands architecture
- Modern DX
- Markdown support

**Verdict**: Perfect for content platform

---

## 5. Deployment Strategy

### Production Deployments

| Frontend | Deploy Target | URL | Update Frequency |
|----------|--------------|-----|------------------|
| **webapp** | GitHub Pages | https://zantara.balizero.com | On merge to main |
| **dashboard** | Internal/Fly.io | Internal only | Weekly |
| **publication** | GitHub Pages | https://publication.balizero.com | On content update |

### Development Workflow

```bash
# Primary app
cd apps/webapp
npm run dev          # Port 3000

# Dashboard
cd apps/dashboard  
npm run dev          # Port 8081

# Publication
cd apps/publication
npm run dev          # Port 4321 (Astro default)
```

---

## 6. Migration Plan (Phase 3)

### Immediate Actions

1. **Document Current State** ✅ (this document)

2. **Archive webapp-next**
   ```bash
   mkdir -p docs/archived/webapp-next-designs
   mv apps/webapp-next/* docs/archived/webapp-next-designs/
   ```

3. **Handle vibe-dashboard**
   - Decision needed: Delete or archive?
   - Recommendation: Archive (might have useful compiled code)
   ```bash
   mkdir -p apps/archived/
   mv apps/vibe-dashboard apps/archived/
   ```

4. **Update Documentation**
   - README.md - clarify frontend strategy
   - ARCHITECTURE.md - update frontend section
   - DEPLOYMENT_GUIDE.md - remove references to deprecated frontends

### Future Considerations

**Q: Should we consolidate to a single framework?**  
A: Not recommended. Current multi-frontend strategy serves distinct purposes:
- webapp: Main user application
- dashboard: Operations tooling
- publication: Content delivery

Each optimized for its use case.

**Q: What about Next.js/React?**  
A: Evaluated (webapp-next was an exploration). Decided against due to:
- Build complexity
- Bundle size
- Vanilla JS sufficient for current needs

**Q: Mobile apps?**  
A: PWA (webapp) provides mobile experience. Native apps not currently planned.

---

## 7. Maintenance Guidelines

### Active Frontends

For each active frontend:

✅ **Required**:
- Regular security updates
- Dependency audits (npm audit)
- E2E testing
- Performance monitoring
- User feedback integration

### Archived Frontends

For archived directories:

📦 **Guidelines**:
- Move to `docs/archived/` or `apps/archived/`
- Create README explaining archive reason
- Keep for 6-12 months minimum
- Review annually for deletion

---

## 8. Decision Matrix

| Criteria | webapp | dashboard | publication | webapp-next | vibe-dashboard |
|----------|--------|-----------|-------------|-------------|----------------|
| Has Source Code | ✅ | ✅ | ✅ | ❌ | ❌ |
| In Production | ✅ | ✅ | ✅ | ❌ | ❌ |
| Active Development | ✅ | ✅ | ✅ | ❌ | ❌ |
| Unique Purpose | ✅ | ✅ | ✅ | ❌ | ❌ |
| Has package.json | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| **Decision** | **KEEP** | **KEEP** | **KEEP** | **ARCHIVE** | **ARCHIVE** |

---

## 9. Summary

### ✅ KEEP (3 Active Frontends)

1. **apps/webapp** - Primary web application (67MB, Vanilla JS)
2. **apps/dashboard** - Operations monitoring (43KB, Vanilla JS)
3. **apps/publication** - Content platform (12MB, Astro)

### 📦 ARCHIVE (2 Directories)

1. **apps/webapp-next** → `docs/archived/webapp-next-designs/`
2. **apps/vibe-dashboard** → `apps/archived/vibe-dashboard-build/`

### 📊 Before/After

**Before**: 5 frontend directories (confusion)  
**After**: 3 active frontends (clear purpose)  
**Archived**: 2 directories (preserved for reference)

---

## 10. FAQ

**Q: Why not use React/Vue/Angular?**  
A: Vanilla JS chosen for webapp due to performance, simplicity, and no framework lock-in. Astro chosen for publication due to static site requirements.

**Q: Can we add more frontends later?**  
A: Yes, but each must have distinct purpose and justification. Avoid feature overlap.

**Q: What about mobile?**  
A: webapp is a PWA providing mobile experience. Native apps not currently in roadmap.

**Q: How do we handle shared frontend code?**  
A: Use `packages/utils` and `packages/types` for shared logic. Keep frontend-specific code in respective apps.

---

**Maintained by**: NUZANTARA Development Team  
**Last Updated**: 2025-11-17  
**Next Review**: 2025-12-17 (monthly review recommended)
