# ==============================================
# 🚀 ZANTARA Backend Production Dockerfile
# Multi-stage build for optimal image size
# ==============================================

# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY apps/backend-ts/package*.json ./
COPY apps/backend-ts/package-lock.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY apps/backend-ts/ ./

# Build the application
RUN npm run build

# Production Stage
FROM node:20-alpine AS production

# Install required packages for runtime
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy built application and dependencies from builder
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json

# Copy configuration files
COPY apps/backend-ts/.env.production .env.production

# Use non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Expose port
EXPOSE 3000

# Start application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]

# Labels
LABEL maintainer="Zantara Team"
LABEL version="1.0.0"
LABEL description="ZANTARA Backend Production Image"