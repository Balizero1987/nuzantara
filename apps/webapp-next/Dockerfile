# Use Node.js 18 Alpine as base
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Build the app (skip TypeScript check)
RUN pnpm vite build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install serve for static files
RUN npm add -g serve

# Copy built assets
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the app
CMD ["serve", "-s", "dist", "-l", "3000"]