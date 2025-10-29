# Dockerfile for ZANTARA Router-Only Orchestrator
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY main.ts ./
COPY lib ./lib
COPY SYSTEM_PROMPT.txt ./

# Expose port
EXPOSE 3000

# Start command
CMD ["npx", "ts-node", "main.ts"]
