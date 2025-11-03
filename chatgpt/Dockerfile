# Multi-stage build for Zantara (Node 20 ESM)

FROM node:20-alpine AS builder
WORKDIR /app

# Install deps first (no lockfile enforced to keep repo-agnostic)
COPY package.json package-lock.json* .npmrc* ./
RUN set -eux; \
  if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy sources and build
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only prod deps
COPY package.json package-lock.json* .npmrc* ./
RUN set -eux; \
  if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi && \
  npm cache clean --force

# Copy compiled app
COPY --from=builder /app/dist ./dist

# Default port
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch(`http://127.0.0.1:${process.env.PORT||3000}/health`).then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))" || exit 1

CMD ["node", "dist/server.js"]
