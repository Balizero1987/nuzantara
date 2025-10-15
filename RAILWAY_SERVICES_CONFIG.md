# Railway Services Configuration

## Two Services Setup

This repository contains TWO separate services that need to be deployed to Railway:

### 1. Python RAG Backend (Service: scintillating-kindness)
**Root Directory:** (empty - uses repo root)
**Dockerfile Path:** `Dockerfile.rag`
**Port:** 8080
**URL:** https://scintillating-kindness-production-47e3.up.railway.app

Configuration file: `railway.toml` (root level)

### 2. TypeScript API Backend (Service: nuzantara)
**Root Directory:** `apps/backend-api`
**Dockerfile Path:** `Dockerfile`
**Port:** 8080
**URL:** https://nuzantara-production.up.railway.app

Configuration file: `apps/backend-api/railway.json`

## Railway Dashboard Configuration

For each service, configure in Railway Dashboard → Service Settings:

### scintillating-kindness Settings:
```
Root Directory: (leave empty)
Dockerfile Path: Dockerfile.rag
```

### nuzantara Settings:
```
Root Directory: apps/backend-api
Dockerfile Path: Dockerfile
```

## Why Two Separate Configurations?

- `railway.toml` at root is GLOBAL and read by all services
- Each service needs its own build configuration
- Service-specific `railway.json` in subdirectory overrides global settings
- Without separate configs, both services try to build with the same Dockerfile (causing failures)

## Environment Variables Required

### scintillating-kindness (Python RAG):
- `DATABASE_URL` - PostgreSQL connection (auto-provided by Railway)
- `R2_ACCESS_KEY_ID` - Cloudflare R2 access key
- `R2_SECRET_ACCESS_KEY` - Cloudflare R2 secret
- `R2_ENDPOINT_URL` - Cloudflare R2 endpoint
- `R2_BUCKET_NAME` - ChromaDB storage bucket

### nuzantara (TypeScript API):
- (Add TypeScript backend env vars here)
