FROM mirror.gcr.io/library/node:22-alpine AS builder

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
FROM mirror.gcr.io/library/node:22-alpine
WORKDIR /app

# Optional: skip postinstall scripts in runtime install as well
ARG NPM_IGNORE_SCRIPTS=false

# Install only production deps
COPY package*.json ./
RUN if [ "$NPM_IGNORE_SCRIPTS" = "true" ]; then npm ci --omit=dev --ignore-scripts; else npm ci --omit=dev; fi

# Bring compiled output and runtime assets
COPY --from=builder /app/dist ./dist
COPY openapi-v520-custom-gpt.yaml ./openapi-v520-custom-gpt.yaml
# Copy runtime files for unified architecture
COPY --from=builder /app/bridge.js ./
COPY --from=builder /app/cache.js ./
COPY --from=builder /app/dist/handlers.js ./handlers.js
COPY --from=builder /app/zantara-v2-key.json ./
# Copy utils directory for Bridge dependencies
COPY --from=builder /app/utils ./utils
# Copy OAuth2 tokens (if exists)
COPY --from=builder /app/oauth2-tokens.json ./
# Copy additional runtime dependencies
COPY --from=builder /app/memory.js ./
COPY --from=builder /app/config.js ./
COPY --from=builder /app/openaiClient.js ./
COPY --from=builder /app/nlu.js ./
COPY --from=builder /app/chatbot.js ./
COPY --from=builder /app/dist/custom-gpt-handlers.js ./custom-gpt-handlers.js
COPY --from=builder /app/dist/user-memory-handlers.js ./user-memory-handlers.js
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Expose port
EXPOSE 8080

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Optional healthcheck (self-contained via Node)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "http=require('http');http.get('http://localhost:8080/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
# Start server
CMD ["node", "dist/index.js"]
