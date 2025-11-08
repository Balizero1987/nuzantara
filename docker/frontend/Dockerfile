# ============================================
# ZANTARA Frontend - Optimized Multi-Stage Dockerfile
# Production-ready static webapp with nginx
# ============================================

# -------------------- Stage 1: Builder --------------------
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --no-audit --no-fund && \
    npm cache clean --force

# Copy source code
COPY . .

# Build for production (if build script exists)
# Otherwise, prepare static files
RUN if grep -q "\"build\"" package.json; then npm run build; else mkdir -p dist && cp -r public/* dist/ 2>/dev/null || true; fi

# -------------------- Stage 2: Production --------------------
FROM nginx:1.25-alpine AS production

# Install security updates
RUN apk update && apk upgrade && \
    rm -rf /var/cache/apk/*

# Copy custom nginx configuration
COPY docker/frontend/nginx.conf /etc/nginx/nginx.conf
COPY docker/frontend/default.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/*.html /usr/share/nginx/html/ 2>/dev/null || true
COPY --from=builder /app/public /usr/share/nginx/html/public 2>/dev/null || true
COPY --from=builder /app/assets /usr/share/nginx/html/assets 2>/dev/null || true
COPY --from=builder /app/css /usr/share/nginx/html/css 2>/dev/null || true

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Create nginx user for non-root execution
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]

# Build metadata
LABEL maintainer="ZANTARA DevOps <devops@balizero.com>" \
      version="1.0.0" \
      description="ZANTARA Frontend Webapp" \
      org.opencontainers.image.source="https://github.com/Balizero1987/nuzantara"
