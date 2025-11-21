# Archived Server Variants

This directory contains archived server variants that were used during development/debugging but are not actively used in production.

## Files

- **server-debug.ts** (16KB) - Debug version with enhanced error logging
- **server-minimal.ts** (4.4KB) - Minimal server for incremental testing
- **server-incremental.ts** (22KB) - Incremental feature-by-feature version

## Production Server

The active production server is: **`../server.ts`** (25KB)

This file is used by:
- `npm start` → `npx tsx src/server.ts`
- `npm run dev` → `tsx watch src/server.ts`

## Why Archived?

These variants were creating confusion about which server file was authoritative. They were kept for reference but moved here to clarify that `server.ts` is the single source of truth.

## Restoration

If you need to restore any of these files:
```bash
mv archived/server-debug.ts .
```

**Date Archived**: 2025-11-17 (Phase 2 - Architecture Refactoring)
