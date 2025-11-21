# ==============================================
# 🚀 ZANTARA Frontend Production Dockerfile
# Multi-stage build for optimal image size
# ==============================================

# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY apps/webapp/package*.json ./
COPY apps/webapp/package-lock.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY apps/webapp/ ./

# Build the application
RUN npm run build

# Production Stage
FROM nginx:alpine AS production

# Install required packages
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY apps/webapp/nginx.conf /etc/nginx/nginx.conf

# Copy environment variables
COPY apps/webapp/.env.production /usr/share/nginx/html/.env.production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Expose port
EXPOSE 8080

# Use non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

USER nextjs

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Labels
LABEL maintainer="Zantara Team"
LABEL version="1.0.0"
LABEL description="ZANTARA Frontend Production Image"