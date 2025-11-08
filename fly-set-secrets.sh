#!/bin/bash
# Script to configure Fly.io secrets for Nuzantara apps
# Usage: ./fly-set-secrets.sh

set -e

echo "🔐 Fly.io Secrets Configuration for Nuzantara Backend"
echo "=================================================="
echo ""

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl not found. Installing..."
    curl -L https://fly.io/install.sh | sh
    export PATH="$HOME/.fly/bin:$PATH"
fi

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly.io"
    echo "Please run: flyctl auth login"
    exit 1
fi

echo "✅ Logged in to Fly.io"
echo ""

# App configuration
APP_NAME="nuzantara-backend"

echo "📱 Configuring secrets for: $APP_NAME"
echo ""

# Check if app exists
if ! flyctl apps list | grep -q "$APP_NAME"; then
    echo "⚠️  App '$APP_NAME' does not exist"
    echo "Creating app..."
    flyctl apps create "$APP_NAME" --org personal
    echo "✅ App created"
fi

# Set OpenRouter API Key
echo "🔑 Setting OpenRouter API key..."
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "⚠️  OPENROUTER_API_KEY not found in environment"
    echo "Please provide your OpenRouter API key:"
    read -s OPENROUTER_API_KEY
fi

flyctl secrets set OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
    --app "$APP_NAME"

echo "✅ OpenRouter API key configured"
echo ""

# Optional: Set other environment variables if needed
echo "📋 Current secrets for $APP_NAME:"
flyctl secrets list --app "$APP_NAME"
echo ""

echo "✅ All secrets configured successfully!"
echo ""
echo "Next steps:"
echo "  1. Deploy: flyctl deploy --app $APP_NAME --config apps/backend-ts/fly.toml"
echo "  2. Check logs: flyctl logs --app $APP_NAME"
echo "  3. Monitor: flyctl status --app $APP_NAME"
echo ""
