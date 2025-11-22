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

# Install dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY src ./src

# Build the application (transpile TS to JS in /dist)
RUN npm run build

# Prune dev dependencies to save space for the next stage copy (optional but good practice)
RUN npm prune --production

# --- Stage 2: Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime dependencies (curl for healthcheck)
RUN apk add --no-cache curl

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Environment settings
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start the application using Node (NOT tsx/nodemon)
# This reduces memory usage significantly (~50MB vs ~200MB+)
CMD ["node", "dist/index.js"]