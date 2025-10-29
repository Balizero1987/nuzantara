#!/bin/bash
set -e

echo "🚀 NUZANTARA Edge Worker Deployment"
echo "===================================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing Wrangler CLI..."
    npm install -g wrangler
fi

# Login to Cloudflare (if not already logged in)
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare:"
    wrangler login
fi

# Deploy to staging first
echo "📤 Deploying to staging..."
wrangler publish --env staging

# Run tests on staging
echo "🧪 Running tests on staging..."
node cloudflare/performance-test.js staging

# Confirm production deployment
read -p "Deploy to production? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to production..."
    wrangler publish --env production
    
    echo "✅ Deployment complete!"
    echo "🌍 Edge worker live at: api.nuzantara.com"
else
    echo "❌ Production deployment cancelled"
fi
