#!/bin/bash
# Quick Deploy Script for Nuzantara Backend with AI Automation
# Run this on your Mac where flyctl is installed

set -e

echo "🚀 Deploying Nuzantara Backend with AI Automation to Fly.io"
echo "============================================================"
echo ""

# Navigate to backend-ts directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/apps/backend-ts"

echo "📍 Current directory: $(pwd)"
echo ""

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl not found"
    echo "Install it with: curl -L https://fly.io/install.sh | sh"
    exit 1
fi

echo "✅ flyctl found: $(flyctl version)"
echo ""

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly.io"
    echo "Run: flyctl auth login"
    exit 1
fi

echo "✅ Logged in as: $(flyctl auth whoami)"
echo ""

# Set the OpenRouter API key
echo "🔑 Setting OpenRouter API key..."
OPENROUTER_API_KEY="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"

flyctl secrets set OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
    --app nuzantara-backend \
    --detach

echo "✅ OpenRouter API key configured"
echo ""

# Deploy the application
echo "🚀 Deploying to Fly.io..."
echo ""

flyctl deploy \
    --app nuzantara-backend \
    --remote-only \
    --ha=false

echo ""
echo "✅ Deployment complete!"
echo ""

# Wait for app to be ready
echo "⏳ Waiting for app to be ready (30 seconds)..."
sleep 30

# Health check
echo "🏥 Running health checks..."
echo ""

HEALTH_URL="https://nuzantara-backend.fly.dev/health"
echo "Testing: $HEALTH_URL"
HEALTH_RESPONSE=$(curl -s "$HEALTH_URL")
echo "Response: $HEALTH_RESPONSE"
echo ""

AI_HEALTH_URL="https://nuzantara-backend.fly.dev/api/monitoring/ai-health"
echo "Testing: $AI_HEALTH_URL"
AI_HEALTH_RESPONSE=$(curl -s "$AI_HEALTH_URL")
echo "Response: $AI_HEALTH_RESPONSE"
echo ""

# Display monitoring endpoints
echo "📊 AI Automation Monitoring Endpoints:"
echo "  - Health: https://nuzantara-backend.fly.dev/api/monitoring/ai-health"
echo "  - Cron Status: https://nuzantara-backend.fly.dev/api/monitoring/cron-status"
echo "  - AI Stats: https://nuzantara-backend.fly.dev/api/monitoring/ai-stats"
echo "  - Refactoring: https://nuzantara-backend.fly.dev/api/monitoring/refactoring-stats"
echo "  - Test Gen: https://nuzantara-backend.fly.dev/api/monitoring/test-generator-stats"
echo ""

# Show logs
echo "📝 Recent logs:"
flyctl logs --app nuzantara-backend -n 50

echo ""
echo "✅ Deployment successful!"
echo "🌐 App URL: https://nuzantara-backend.fly.dev"
echo ""
echo "Next steps:"
echo "  - Monitor logs: flyctl logs --app nuzantara-backend"
echo "  - Check status: flyctl status --app nuzantara-backend"
echo "  - View metrics: flyctl dashboard metrics --app nuzantara-backend"
echo ""
