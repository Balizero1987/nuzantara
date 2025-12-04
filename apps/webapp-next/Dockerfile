# Use Node.js 20 Alpine as base
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
# Copy source code
COPY . .

# Build args
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GOOGLE_AI_API_KEY

# Set env vars for build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_AI_API_KEY=$NEXT_PUBLIC_GOOGLE_AI_API_KEY

# Build the Next.js app
RUN pnpm next build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install dependencies for production
RUN apk add --no-cache curl
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the app
CMD ["node", "server.js"]