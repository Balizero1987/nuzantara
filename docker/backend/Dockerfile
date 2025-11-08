# ============================================
# ZANTARA Backend - Optimized Multi-Stage Dockerfile
# Production-ready TypeScript/Node.js backend
# ============================================

# -------------------- Stage 1: Base --------------------
FROM node:20-alpine AS base

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# -------------------- Stage 2: Dependencies --------------------
FROM base AS deps

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
# Use --legacy-peer-deps for chromadb compatibility
RUN npm ci --legacy-peer-deps --no-audit --no-fund && \
    npm cache clean --force

# -------------------- Stage 3: Builder --------------------
FROM base AS builder

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove development dependencies
RUN npm prune --production --legacy-peer-deps && \
    npm cache clean --force

# -------------------- Stage 4: Production --------------------
FROM base AS production

# Set NODE_ENV to production
ENV NODE_ENV=production \
    PORT=8080 \
    NODE_OPTIONS="--max-old-space-size=512"

# Copy only production dependencies
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["npx", "tsx", "src/server.ts"]

# Build metadata
LABEL maintainer="ZANTARA DevOps <devops@balizero.com>" \
      version="1.0.0" \
      description="ZANTARA Backend Service" \
      org.opencontainers.image.source="https://github.com/Balizero1987/nuzantara"
