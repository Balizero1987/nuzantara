# Deprecated Endpoints Report

**Generated:** $(date)

## Endpoints to Remove in Next Phase

### Backend TypeScript

1. **KBLI Handlers** (apps/backend-ts/src/handlers/bali-zero/)
   - ❌ **REMOVED** - `kbli.ts` and `kbli-complete.ts` have been removed
   - ✅ **NEW ENDPOINT:** KBLI queries are now handled exclusively through:
     - `POST /api/oracle/query` (Python RAG backend)
   - ✅ **MIGRATION:** All KBLI flows should use the universal Oracle endpoint
   - ✅ **DEAD CODE REMOVED:** `kbli-external.ts` service has also been removed
   - **Action:** Ensure all clients use `POST /api/oracle/query` for KBLI queries

2. **Tax Routes** (commented out in server.ts:572-573)
   - Tax routes are commented but files might exist
   - **Action:** Verify if needed, else delete

3. **Test Routes** (apps/backend-ts/src/routes/test/)
   - `mock-login.ts` → Should be dev-only
   - **Action:** Add NODE_ENV guard

### Backend Python

No deprecated endpoints found.

### Frontend

1. **documentIntelligence** → Already removed ✅

---

**Recommendation:** Phase 2 cleanup (manual review required)
