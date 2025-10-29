#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   🚀 PATCH-5: Database Migration Setup                    ║"
echo "║   Pinecone Account Configuration                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if API key is already set
if [ ! -z "$PINECONE_API_KEY" ]; then
    echo "✅ PINECONE_API_KEY is already set"
    echo "   Key length: ${#PINECONE_API_KEY} characters"
    echo ""
    read -p "Do you want to use this key? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        unset PINECONE_API_KEY
    else
        echo "✅ Using existing API key"
        exit 0
    fi
fi

echo "📋 Step 1: Create Pinecone Account"
echo "   ════════════════════════════════"
echo ""
echo "   1. Open: https://app.pinecone.io/"
echo "   2. Click 'Sign Up' (or 'Log In' if you have an account)"
echo "   3. Complete registration with your email"
echo "   4. Verify your email address"
echo ""
read -p "Press ENTER when you've created your account..."

echo ""
echo "📋 Step 2: Get API Key"
echo "   ══════════════════"
echo ""
echo "   1. In Pinecone dashboard, go to 'API Keys' section"
echo "   2. Click 'Create API Key' or copy existing key"
echo "   3. The key format looks like: pcsk_xxxxx..."
echo "   4. Copy the entire key"
echo ""
read -p "Press ENTER when you have your API key ready..."

echo ""
echo "📋 Step 3: Enter API Key"
echo "   ═══════════════════"
echo ""
read -p "Paste your Pinecone API key: " PINECONE_API_KEY

# Validate key format
if [[ ! $PINECONE_API_KEY =~ ^pcsk_ ]]; then
    echo ""
    echo "⚠️  Warning: API key doesn't start with 'pcsk_'"
    echo "   Make sure you copied the full key"
    echo ""
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled"
        exit 1
    fi
fi

# Test connection
echo ""
echo "🔍 Testing Pinecone connection..."
export PINECONE_API_KEY="$PINECONE_API_KEY"

python3 -c "
import os
from pinecone import Pinecone

try:
    pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
    indexes = pc.list_indexes().names()
    print(f'✅ Connection successful!')
    print(f'   Found {len(indexes)} existing indexes')
    if indexes:
        for idx in indexes:
            print(f'   - {idx}')
except Exception as e:
    print(f'❌ Connection failed: {e}')
    exit(1)
"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Connection test failed"
    echo "   Please check your API key and try again"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   ✅ Pinecone Setup Complete!                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📝 To make this permanent, add to your shell profile:"
echo ""
echo "   echo 'export PINECONE_API_KEY=\"$PINECONE_API_KEY\"' >> ~/.zshrc"
echo "   source ~/.zshrc"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "   1. Test migration:"
echo "      ./migration/test_migration.sh"
echo ""
echo "   2. Run migration:"
echo "      ./migration/migrate.sh tax_updates property_knowledge"
echo ""
echo "   3. Verify results:"
echo "      cat migration_results_*.json"
echo ""
