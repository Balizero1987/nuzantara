# Router.ts Refactor Guide

**Date**: 2025-10-10
**Status**: IN PROGRESS (5/15 modules done - Phase 1 Complete!)
**Effort**: 3-5 days (full team)

---

## Problem Statement

**Current State**:
- `src/router.ts`: **1,476 lines** (monolithic file)
- 107 handler definitions mixed with route logic
- Difficult to:
  - Navigate (1,400+ lines to scroll)
  - Test (unit tests require full router import)
  - Collaborate (merge conflicts on every PR)
  - Maintain (all changes touch same file)

**Impact**:
- ⏱️ Developer time: +15 min/PR for merge conflicts
- 🐛 Bug risk: HIGH (all routes in one file)
- 👥 Team collaboration: BLOCKED (serialized edits)
- 🧪 Test coverage: LOW (hard to test individual routes)

---

## Solution: Modular Route Architecture

### New Structure

```
src/
├── routes/
│   ├── index.ts                    # Aggregator (exports all routes)
│   ├── google-workspace/
│   │   ├── gmail.routes.ts         # ✅ DONE (example)
│   │   ├── drive.routes.ts
│   │   ├── calendar.routes.ts
│   │   ├── sheets.routes.ts
│   │   └── docs.routes.ts
│   ├── ai-services/
│   │   ├── ai.routes.ts
│   │   ├── creative.routes.ts
│   │   └── advanced-ai.routes.ts
│   ├── bali-zero/
│   │   ├── oracle.routes.ts
│   │   ├── pricing.routes.ts
│   │   ├── team.routes.ts
│   │   └── advisory.routes.ts
│   ├── communication/
│   │   ├── whatsapp.routes.ts
│   │   ├── instagram.routes.ts
│   │   └── translate.routes.ts
│   └── analytics/
│       ├── analytics.routes.ts
│       ├── dashboard.routes.ts
│       └── weekly-report.routes.ts
├── router.ts                       # LEGACY (kept for /call RPC endpoint)
└── index.ts                        # Updated to use routes/index.ts
```

### Benefits

**Before**:
- 1 file (1,476 lines)
- All routes in one place
- Serial development

**After**:
- ~15 route files (~80-120 lines each)
- Modular organization
- Parallel development

**Improvements**:
- ✅ **Maintainability**: 93% easier (1,476 → 100 lines avg)
- ✅ **Testability**: Unit tests per route module
- ✅ **Team Collaboration**: No more merge conflicts
- ✅ **Navigation**: Find routes by category (Gmail, AI, etc.)
- ✅ **Lazy Loading**: Load routes on-demand (faster cold start)

---

## Migration Plan

### Phase 1: Extract Google Workspace (Week 1) ✅ COMPLETE
- [x] `gmail.routes.ts` - ✅ DONE (5 endpoints: send, list, read, search, labels)
- [x] `drive.routes.ts` - ✅ DONE (5 endpoints: upload, list, search, read + GET support)
- [x] `calendar.routes.ts` - ✅ DONE (3 endpoints: list, create, get)
- [x] `sheets.routes.ts` - ✅ DONE (3 endpoints: read, append, create)
- [x] `docs.routes.ts` - ✅ DONE (3 endpoints: create, read, update)

**Total**: 1 day (6 hours) - **Progress: 100% complete ✅**

### Phase 2: Extract AI Services (Week 1)
- [ ] `ai.routes.ts` - Estimated: 3 hours (large file)
- [ ] `creative.routes.ts` - Estimated: 2 hours
- [ ] `advanced-ai.routes.ts` - Estimated: 1 hour

**Total**: 0.75 days (6 hours)

### Phase 3: Extract Bali Zero (Week 2)
- [ ] `oracle.routes.ts` - Estimated: 2 hours
- [ ] `pricing.routes.ts` - Estimated: 1 hour
- [ ] `team.routes.ts` - Estimated: 1 hour
- [ ] `advisory.routes.ts` - Estimated: 1 hour

**Total**: 0.5 days (5 hours)

### Phase 4: Extract Communication (Week 2)
- [ ] `whatsapp.routes.ts` - Estimated: 2 hours
- [ ] `instagram.routes.ts` - Estimated: 2 hours
- [ ] `translate.routes.ts` - Estimated: 1 hour

**Total**: 0.5 days (5 hours)

### Phase 5: Extract Analytics (Week 2)
- [ ] `analytics.routes.ts` - Estimated: 2 hours
- [ ] `dashboard.routes.ts` - Estimated: 1 hour
- [ ] `weekly-report.routes.ts` - Estimated: 1 hour

**Total**: 0.5 days (4 hours)

### Phase 6: Update index.ts & Testing (Week 3)
- [ ] Update `src/index.ts` to use modular routes
- [ ] Keep `router.ts` for legacy `/call` RPC endpoint
- [ ] Write unit tests for each route module
- [ ] Update documentation (README.md)

**Total**: 1 day (8 hours)

---

## Implementation Guide

### Step 1: Create Route Module (Example: Drive)

**File**: `src/routes/google-workspace/drive.routes.ts`

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { ok, err } from '../../utils/response.js';
import { apiKeyAuth, RequestWithCtx } from '../../middleware/auth.js';
import { driveUpload, driveList, driveSearch } from '../../handlers/google-workspace/drive.js';

const router = Router();

// Schemas
const DriveUploadSchema = z.object({
  name: z.string(),
  content: z.string(),
  mimeType: z.string().optional(),
  folderId: z.string().optional(),
});

/**
 * POST /api/drive/upload
 * Upload file to Google Drive
 */
router.post('/upload', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = DriveUploadSchema.parse(req.body);
    const result = await driveUpload(params, req);
    return res.json(ok(result));
  } catch (error: any) {
    return res.status(400).json(err(error.message));
  }
});

/**
 * POST /api/drive/list
 * List files in Google Drive
 */
router.post('/list', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = z.object({
      maxResults: z.number().optional().default(20),
      folderId: z.string().optional(),
    }).parse(req.body);

    const result = await driveList(params, req);
    return res.json(ok(result));
  } catch (error: any) {
    return res.status(400).json(err(error.message));
  }
});

export default router;
```

### Step 2: Register in routes/index.ts

```typescript
import driveRoutes from './google-workspace/drive.routes.js';

export function attachModularRoutes(app: Express) {
  app.use('/api/drive', driveRoutes);
  // ... other routes
}
```

### Step 3: Update src/index.ts

```typescript
// BEFORE
import { attachRoutes } from "./router.js";
attachRoutes(app);

// AFTER
import { attachModularRoutes } from "./routes/index.js";
import { attachRoutes } from "./router.js"; // Keep for /call RPC

attachModularRoutes(app); // New modular routes
attachRoutes(app); // Legacy /call endpoint
```

### Step 4: Write Tests

**File**: `src/routes/google-workspace/__tests__/drive.routes.test.ts`

```typescript
import request from 'supertest';
import express from 'express';
import driveRoutes from '../drive.routes.js';

describe('Drive Routes', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/drive', driveRoutes);

  it('POST /api/drive/upload - should upload file', async () => {
    const res = await request(app)
      .post('/api/drive/upload')
      .set('x-api-key', 'test-key')
      .send({
        name: 'test.txt',
        content: 'Hello World',
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
```

---

## Testing Strategy

### Unit Tests (Per Route Module)
- Test each endpoint independently
- Mock handler dependencies
- Fast execution (~100ms per test)

### Integration Tests (Full App)
- Test `/api/gmail/*` endpoints end-to-end
- Use test database/external service mocks
- Verify middleware chain (auth, rate-limit, etc.)

### Migration Tests
- Compare responses: old `/call` vs new `/api/*`
- Ensure backward compatibility
- Performance benchmarks (latency should be same or better)

---

## Rollout Strategy

### Week 1: Google Workspace + AI Services
- Extract high-traffic routes first (Gmail, Drive, AI)
- Deploy to staging for testing
- Monitor latency/error rates

### Week 2: Bali Zero + Communication + Analytics
- Extract remaining routes
- Full integration testing
- Gradual rollout to production (10% → 50% → 100%)

### Week 3: Cleanup + Documentation
- Remove old route definitions from `router.ts`
- Keep only `/call` RPC endpoint
- Update all documentation
- Training session for team

---

## Backward Compatibility

**IMPORTANT**: Keep `/call` RPC endpoint for legacy clients

```typescript
// router.ts (simplified)
app.post("/call", apiKeyAuth, async (req, res) => {
  const { key, params } = req.body;

  // Route to new modular endpoints internally
  if (key === 'gmail.send') {
    // Forward to /api/gmail/send
    return fetch('http://localhost:8080/api/gmail/send', {
      method: 'POST',
      headers: { 'x-api-key': req.get('x-api-key') },
      body: JSON.stringify(params)
    });
  }

  // ... handle other keys
});
```

---

## Metrics to Track

**Performance**:
- [ ] Latency (p50, p95, p99) - Target: no regression
- [ ] Throughput (req/s) - Target: +10% (lazy loading)
- [ ] Cold start time - Target: -20% (fewer imports)

**Code Quality**:
- [ ] Test coverage - Target: 80%+ per module
- [ ] Cyclomatic complexity - Target: <10 per function
- [ ] File size - Target: <150 lines per route file

**Developer Experience**:
- [ ] Time to find route - Target: <10s (vs 2min before)
- [ ] Merge conflict rate - Target: -90%
- [ ] PR review time - Target: -50% (smaller diffs)

---

## Risk Mitigation

**Risk**: Breaking changes in production
**Mitigation**:
- Feature flag for new routes
- Canary deployment (10% traffic)
- Automated rollback on error rate spike

**Risk**: Performance regression
**Mitigation**:
- Load testing before rollout
- Monitor cold start times
- Keep old routes as fallback

**Risk**: Team not adopting new structure
**Mitigation**:
- Training session (30 min)
- Update PR template with examples
- Automated linting for new routes

---

## Timeline Summary

| Phase | Tasks | Effort | Deadline |
|-------|-------|--------|----------|
| 1 | Google Workspace | 1 day | Week 1 |
| 2 | AI Services | 0.75 days | Week 1 |
| 3 | Bali Zero | 0.5 days | Week 2 |
| 4 | Communication | 0.5 days | Week 2 |
| 5 | Analytics | 0.5 days | Week 2 |
| 6 | Testing & Deploy | 1 day | Week 3 |
| **TOTAL** | **All phases** | **~5 days** | **3 weeks** |

---

## Success Criteria

- [x] Gmail routes extracted (example complete)
- [ ] All 15 route modules created
- [ ] Test coverage >80%
- [ ] Zero breaking changes
- [ ] Performance metrics stable
- [ ] Team training completed
- [ ] Documentation updated

---

**Status**: **5/15 modules done** (Phase 1 Complete: Gmail, Drive, Calendar, Sheets, Docs ✅)
**Next Action**: Phase 2 - Extract AI routes (ai.routes.ts, creative.routes.ts) - Est: 5 hours
**Owner**: Development Team
**Priority**: MEDIUM (can be done incrementally)

---

**End of Refactor Guide**
