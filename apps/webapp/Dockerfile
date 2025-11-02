# ZANTARA Webapp with KB Integration
FROM node:20.18.0-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Simple static server for demo
RUN npm install -g serve
RUN serve -s /app -p 3000 &

# Start the app
CMD ["serve", "-s", "/app", "-l", "3000"]