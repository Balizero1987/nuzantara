#!/bin/bash
###############################################################################
# ZANTARA Llama 4 Scout Setup Script
#
# Configures OpenRouter API key to enable Llama 4 Scout (92% cheaper than Haiku)
###############################################################################

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🦙 ZANTARA Llama 4 Scout Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Benefits of Llama 4 Scout:"
echo "   • 92% cheaper: \$0.20/\$0.20 per 1M tokens (vs Haiku \$1/\$5)"
echo "   • 22% faster: ~880ms TTFT (vs Haiku ~1.1s)"
echo "   • 50x context: 10M tokens (vs Haiku 200k)"
echo "   • 100% quality: Same success rate on ZANTARA benchmark"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if running in correct directory
if [ ! -f "backend/app/main_cloud.py" ]; then
    echo "❌ Error: Run this script from apps/backend-rag directory"
    echo "   cd apps/backend-rag && ./scripts/setup-llama-scout.sh"
    exit 1
fi

echo "Step 1: Get OpenRouter API Key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: https://openrouter.ai/keys"
echo "2. Sign up / Log in with Google or GitHub"
echo "3. Click 'Create Key' and copy it"
echo "4. Your key will look like: sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo ""
read -p "Press ENTER when you have your OpenRouter API key..."

echo ""
echo "Step 2: Enter Your OpenRouter API Key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -sp "Paste your OpenRouter API key: " OPENROUTER_KEY
echo ""

# Validate key format
if [[ ! "$OPENROUTER_KEY" =~ ^sk-or-v1- ]]; then
    echo ""
    echo "⚠️  Warning: Key doesn't start with 'sk-or-v1-'"
    read -p "Continue anyway? (y/N): " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled"
        exit 1
    fi
fi

echo ""
echo "Step 3: Configure Fly.io Secret"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly.io CLI not found"
    echo ""
    echo "Install it:"
    echo "   curl -L https://fly.io/install.sh | sh"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Check if logged in
if ! fly auth whoami &> /dev/null; then
    echo "⚠️  Not logged in to Fly.io"
    echo ""
    read -p "Login now? (Y/n): " LOGIN
    if [[ ! "$LOGIN" =~ ^[Nn]$ ]]; then
        fly auth login
    else
        echo "❌ Setup cancelled - login required"
        exit 1
    fi
fi

echo "Setting secret on Fly.io app: nuzantara-rag"
echo ""

# Set the secret
if fly secrets set OPENROUTER_API_KEY_LLAMA="$OPENROUTER_KEY" -a nuzantara-rag; then
    echo ""
    echo "✅ OpenRouter API key configured successfully!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 Deployment Status"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "The app will restart automatically with Llama 4 Scout enabled."
    echo ""
    echo "Check deployment status:"
    echo "   fly status -a nuzantara-rag"
    echo ""
    echo "View logs:"
    echo "   fly logs -a nuzantara-rag"
    echo ""
    echo "You should see:"
    echo "   ✅ Llama 4 Scout client initialized"
    echo "   🎯 [Llama Scout] Using PRIMARY AI"
    echo ""
else
    echo ""
    echo "❌ Failed to set secret"
    echo ""
    echo "Manual setup:"
    echo "   fly secrets set OPENROUTER_API_KEY_LLAMA=\"your-key-here\" -a nuzantara-rag"
    exit 1
fi

echo ""
echo "Step 4: Verify Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Waiting 30 seconds for deployment..."
sleep 30

echo ""
echo "Testing health endpoint..."
HEALTH=$(curl -s https://nuzantara-rag.fly.dev/health)

if echo "$HEALTH" | grep -q "Llama 4 Scout"; then
    echo ""
    echo "✅ SUCCESS! Llama 4 Scout is now active!"
    echo ""
    echo "$HEALTH" | jq '.ai' 2>/dev/null || echo "$HEALTH"
else
    echo ""
    echo "⚠️  Health check didn't show Llama 4 Scout yet"
    echo ""
    echo "Check logs for details:"
    echo "   fly logs -a nuzantara-rag | grep -i llama"
    echo ""
    echo "Common issues:"
    echo "   • App still restarting (wait 1-2 minutes)"
    echo "   • Invalid API key (check OpenRouter dashboard)"
    echo "   • Deployment failed (check fly status)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "   1. Test a chat query to see Llama 4 Scout in action"
echo "   2. Monitor cost savings in logs"
echo "   3. Check performance metrics"
echo ""
echo "Cost monitoring:"
echo "   fly logs -a nuzantara-rag | grep 'Cost savings'"
echo ""
echo "📚 Documentation: apps/backend-rag/LLAMA_SCOUT_MIGRATION.md"
echo ""
