# Dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create necessary directories
RUN mkdir -p screenshots covers

# Install sharp dependencies
RUN apt-get update && apt-get install -y \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

# Run as non-root user
RUN useradd -m scraper && chown -R scraper:scraper /app
USER scraper

# Default command (can be overridden in docker-compose)
CMD ["node", "dist/app.js"]

