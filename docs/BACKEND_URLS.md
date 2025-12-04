# Backend URLs Documentation

## Overview

This document clarifies the different backend URLs used in the Nuzantara project.

## Primary Backend URL

**Production**: `https://nuzantara-rag.fly.dev`

This is the main backend API endpoint used by:
- Frontend webapp (`apps/webapp-next`)
- Production deployments
- Default fallback in `constants.ts`

**Port**: `8080` (standardized across all environments)

## Secondary Backend URL

**TypeScript Backend**: `https://nuzantara-backend.fly.dev`

This URL is referenced in `apps/backend-rag/.env.example` as `TS_BACKEND_URL` and is used for:
- Tool execution service (TypeScript-based backend)
- Cross-service communication within the backend

**Note**: This is a separate service from the main Python/FastAPI backend.

## Development URLs

### Local Development

- **Backend**: `http://localhost:8080`
- **Frontend**: `http://localhost:3000`
- **WebSocket**: `ws://localhost:8080/ws`

### Docker Compose

- **Backend**: `http://localhost:8080` (mapped from container port 8080)
- **Qdrant**: `http://localhost:6333`

## Environment Variables

### Frontend (`apps/webapp-next/.env.example`)

```bash
# Client-side API URL (uses proxy route)
NEXT_PUBLIC_API_URL=http://localhost:8080

# Server-side backend URL (for Next.js API routes)
NUZANTARA_API_URL=http://localhost:8080
```

### Backend (`apps/backend-rag/.env.example`)

```bash
# Main backend port
PORT=8080

# TypeScript backend URL (for tool execution)
TS_BACKEND_URL=https://nuzantara-backend.fly.dev

# Vector database
QDRANT_URL=https://nuzantara-qdrant.fly.dev
```

## Port Standardization

All environments now use port **8080** for consistency:

- ✅ Docker Compose: `8080:8080`
- ✅ Dockerfile: `EXPOSE 8080`
- ✅ Fly.io: `internal_port = 8080`
- ✅ Frontend defaults: `localhost:8080`

## Migration Notes

Previously, docker-compose used port 8000, but this has been standardized to 8080 to match production (Fly.io) configuration.
