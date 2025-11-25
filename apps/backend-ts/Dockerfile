# ZANTARA TypeScript Backend - Production Dockerfile
# Multi-stage build for minimal size and memory usage

# --- Stage 1: Builder ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies with network optimizations
RUN npm install --verbose --no-audit --no-fund

# Copy source code
COPY src ./src

# Build the application
# RUN npm run build

# Prune dev dependencies to save space for the next stage copy
RUN npm prune --production

# --- Stage 2: Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime dependencies (curl for healthcheck)
RUN apk add --no-cache curl

# Copy source files and dependencies (using tsx for runtime TypeScript execution)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig*.json ./

# Environment settings
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start the application using tsx (skip build for now)
CMD ["npx", "tsx", "src/server.ts"]