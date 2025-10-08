# Handover: Backend Handlers

Category: `backend-handlers`

---

## 2025-10-08 05:40 (Team Activity Handler + Registry Issue) [sonnet-4.5_m1]

**Added**:
- `src/handlers/bali-zero/team-activity.ts` - New handler for team activity tracking
- `src/router.ts:33,377-384` - Direct registration of `team.recent_activity` handler

**Changed**:
- `src/handlers/bali-zero/registry.ts:12,57` - Added teamRecentActivity import and registration

**Issue Identified**:
- ⚠️ **Handler registry auto-load bug**: New handlers registered in `registry.ts` NOT loaded by `loadAllHandlers()`
- Registry registration works locally but fails in production deployment
- Root cause: Unknown - needs investigation in `src/core/load-all-handlers.ts`

**Workaround Applied**:
- Register new handlers DIRECTLY in `src/router.ts` (not just registry.ts)
- This bypasses the broken auto-load system
- Pattern to follow for all new handlers until auto-load is fixed

**Handler Details**:
```typescript
// team.recent_activity - Track team login/activity
{
  hours: number,      // Lookback period (default: 24)
  limit: number,      // Max results (default: 10)
  department?: string // Filter by dept (optional)
}
// Returns: Mock data (Zero, Amanda, Veronika, Zainal) with timeAgo
```

**Testing**:
```bash
curl -s -X POST https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key":"team.recent_activity","params":{"hours":24}}' | jq '.data.activities'
# Expected: 4 team members with activity timestamps
```

**TODO**:
- [ ] Fix handler registry auto-load system in `load-all-handlers.ts`
- [ ] Replace mock data with real session tracking
- [ ] Remove workaround once auto-load is fixed

**Related**:
→ Full session: [.claude/diaries/2025-10-08_sonnet-4.5_m1.md](#deployment-troubleshooting)

---

## 2025-10-02 00:30 (Bridge.js Fix) [sonnet-4.5_m2]

**Changed**:
- `src/services/bridgeProxy.ts:1-11` - Disabled legacy bridge.js loading (MODULE_NOT_FOUND fix)
- `dist/services/bridgeProxy.js` - Recompiled with bridge disabled
- Deployed: `zantara-v520-nuzantara-00012-5sk`

**Impact**:
- ✅ RPC `/call` endpoint now functional (no more MODULE_NOT_FOUND)
- ✅ All handlers use TypeScript implementations directly
- ⚠️ Legacy bridge-only handlers may fail (document.analyze, drive.download, etc.)

**Testing**:
```bash
# Test RPC endpoint
curl -s 'https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/call' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: zantara-external-dev-key-2025' \
  --data-raw '{"key":"ai.chat","params":{"message":"test"}}'
# Expected: Handler executes (may fail on missing API keys, but no MODULE_NOT_FOUND)
```

**Related**:
→ Full session: [.claude/diaries/2025-10-01_sonnet-4.5_m2.md](#fix-applied-bridgejs-error-resolved)

---
