# Multi-stage optimized Dockerfile for Railway deployment
# Optimized for faster builds and smaller production image

# ========================================
# Stage 1: Dependencies Builder
# ========================================
FROM node:18-alpine AS deps

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies with better caching
RUN npm ci --only=production --frozen-lockfile && \
    npm cache clean --force

# ========================================
# Stage 2: Build Stage
# ========================================
FROM node:18-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci --frozen-lockfile

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY src ./src

# Build TypeScript with optimizations
RUN npm run build && \
    # Remove source maps and dev files to reduce size
    find dist -name "*.map" -delete && \
    find dist -name "*.d.ts" -delete

# ========================================
# Stage 3: Production Runtime
# ========================================
FROM node:18-alpine AS runtime

# Install OpenSSL for Prisma and curl for health checks
RUN apk add --no-cache openssl curl

WORKDIR /app

# Create non-root user first
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies from deps stage
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Switch to non-root user
USER nodejs

# Expose port (Railway will set PORT env var)
EXPOSE 8080

# Environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
