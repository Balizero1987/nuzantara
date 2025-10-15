FROM node:22-alpine AS builder

# Install dependencies for native modules (if any)
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# Optional: skip npm postinstall scripts (e.g., Prisma engines) during build
ARG NPM_IGNORE_SCRIPTS=false

# Install all deps for build
COPY package*.json ./
RUN if [ "$NPM_IGNORE_SCRIPTS" = "true" ]; then npm ci --ignore-scripts; else npm ci; fi

# Copy sources and build
COPY . .
RUN npm run build

# -------- Runtime image --------
FROM node:22-alpine
WORKDIR /app

# Optional: skip postinstall scripts in runtime install as well
ARG NPM_IGNORE_SCRIPTS=false

# Install only production deps
COPY package*.json ./
RUN if [ "$NPM_IGNORE_SCRIPTS" = "true" ]; then npm ci --omit=dev --ignore-scripts; else npm ci --omit=dev; fi

# Bring compiled output (tsc generates full dist/ tree)
COPY --from=builder /app/dist ./dist

# Copy runtime assets
COPY --from=builder /app/openapi-v520-custom-gpt.yaml* ./
COPY --from=builder /app/zantara-v2-key.json* ./
COPY --from=builder /app/oauth2-tokens.json* ./

# Copy legacy JS files if they exist
COPY --from=builder /app/bridge.js* ./
COPY --from=builder /app/cache.js* ./
COPY --from=builder /app/memory.js* ./
COPY --from=builder /app/config.js* ./
COPY --from=builder /app/openaiClient.js* ./
COPY --from=builder /app/nlu.js* ./
COPY --from=builder /app/chatbot.js* ./
COPY --from=builder /app/utils* ./utils/

# Expose port
EXPOSE 8080

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Optional healthcheck (self-contained via Node)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "http=require('http');http.get('http://localhost:8080/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# Start server
CMD ["node", "dist/index.js"]
