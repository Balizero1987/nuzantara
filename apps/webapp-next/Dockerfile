# syntax=docker/dockerfile:1.6

# -----------------------------------------------------------------------------
# Frontend build dependencies (includes dev deps for Next.js build)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

# Husky tries to touch .git during install; disable hooks in container builds
ENV HUSKY=0

# Copy root workspace manifests plus the frontend workspace package file.
# This Dockerfile is meant to be built from the repo root:
#   docker build -f apps/webapp-next/Dockerfile .
COPY package.json package-lock.json ./
COPY apps/webapp-next/package.json apps/webapp-next/

# Install only the workspace dependencies so we don't pull every package
RUN npm install --workspace apps/webapp-next --include-workspace-root=false

# -----------------------------------------------------------------------------
# Build stage - compiles the Next.js application
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
ENV HUSKY=0

# Re-use the dependencies from the previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/webapp-next/package.json ./apps/webapp-next/package.json

# Copy the frontend source
COPY apps/webapp-next ./apps/webapp-next

WORKDIR /app/apps/webapp-next
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GOOGLE_AI_API_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_AI_API_KEY=$NEXT_PUBLIC_GOOGLE_AI_API_KEY

RUN npm run build

# -----------------------------------------------------------------------------
# Production dependencies stage (installs runtime-only deps)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS prod-deps
WORKDIR /app
ENV HUSKY=0

COPY package.json package-lock.json ./
COPY apps/webapp-next/package.json apps/webapp-next/
RUN npm install --workspace apps/webapp-next --include-workspace-root=false --omit=dev

# -----------------------------------------------------------------------------
# Runtime image
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache curl

# Copy the production dependencies and build artifacts
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/webapp-next/.next/standalone ./
COPY --from=builder /app/apps/webapp-next/.next/static ./.next/static
COPY --from=builder /app/apps/webapp-next/public ./public

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
