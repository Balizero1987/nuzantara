#!/bin/bash

echo "🚀 Deploying ZANTARA to Cloudflare Pages..."
echo "=========================================="

# Files da deploy
FILES=("index.html" "login.html" "chat-premium.html" "_redirects" "_headers")

echo "📋 Checking files..."
for file in "${FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file found"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

echo ""
echo "🔧 To deploy:"
echo "1. Go to: https://dash.cloudflare.com/pages"
echo "2. Click: 'Create project' → 'Upload assets'"
echo "3. Upload files: ${FILES[*]}"
echo "4. Set domain: zantara.balizero.com"
echo "5. Click: 'Save and Deploy'"

echo ""
echo "⚡ Expected URLs after deploy:"
echo "🌐 https://zantara.balizero.com → /login"
echo "🔐 https://zantara.balizero.com/login → form Name/Email/PIN"
echo "💬 https://zantara.balizero.com/chat-premium → chat interface"

echo ""
echo "🎯 Ready for manual deploy!"