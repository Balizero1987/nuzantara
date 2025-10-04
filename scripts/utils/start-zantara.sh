#!/bin/bash
# ZANTARA v5.2.0 Startup Script
# Automatically loads environment variables and starts the server

cd "$(dirname "$0")"

# Load .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded from .env"
else
    echo "⚠️  No .env file found, using defaults"
fi

# Override with explicit keys (ensure they're set)
export API_KEYS_INTERNAL="${API_KEYS_INTERNAL:-zantara-internal-dev-key-2025}"
export API_KEYS_EXTERNAL="${API_KEYS_EXTERNAL:-zantara-external-dev-key-2025}"
export PORT="${PORT:-8080}"
export NODE_ENV="${NODE_ENV:-development}"

echo "🚀 Starting ZANTARA v5.2.0 on port $PORT..."
echo "🔑 Internal API Key: $API_KEYS_INTERNAL"
echo "🔑 External API Key: $API_KEYS_EXTERNAL"
echo ""

# Start the server
node dist/index.js