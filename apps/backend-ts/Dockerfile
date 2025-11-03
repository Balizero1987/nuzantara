# TypeScript Backend Dockerfile for Fly.io
FROM node:20-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./
COPY tsconfig*.json ./

# Install ALL dependencies (including devDependencies for build)
# Use --legacy-peer-deps to resolve chromadb/@google/generative-ai conflict
RUN npm install --legacy-peer-deps

# Copy source code
COPY src/ ./src/

# Build bypassed - running TypeScript directly with tsx
# RUN npm run build

# Expose port (Fly.io uses PORT env var)
EXPOSE $PORT

# Health check removed - using Fly.io's built-in health monitoring

# Start the application with tsx runtime (bypass compilation)
CMD ["npx", "tsx", "src/server.ts"]
# Build 1761271374
