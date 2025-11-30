#!/bin/bash
# Setup GitHub Secrets for CI/CD
# Requires: GitHub CLI (gh) installed and authenticated

set -e

echo "🔐 Setting up GitHub Secrets for Nuzantara CI/CD"
echo "================================================"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) not found. Install it first:"
    echo "   brew install gh"
    echo "   OR visit: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI"
    echo "   Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI authenticated"
echo ""

# Repository (auto-detect or use provided)
REPO="Balizero1987/nuzantara"

echo "📦 Repository: $REPO"
echo ""

# Set secrets
echo "Setting OPENAI_API_KEY..."
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY environment variable not set"
    echo "   Run: export OPENAI_API_KEY=sk-..."
    exit 1
fi
echo "$OPENAI_API_KEY" | gh secret set OPENAI_API_KEY -R "$REPO"

echo "Setting DATABASE_URL_TEST..."
DATABASE_URL_TEST="${DATABASE_URL_TEST:-postgresql://test:test@localhost:5432/nuzantara_test}"
echo "$DATABASE_URL_TEST" | gh secret set DATABASE_URL_TEST -R "$REPO"

echo "Setting JWT_SECRET_KEY..."
JWT_SECRET="${JWT_SECRET:-nuzantara-ci-test-jwt-secret-$(openssl rand -hex 32)}"
echo "$JWT_SECRET" | gh secret set JWT_SECRET_KEY -R "$REPO"

echo ""
echo "✅ All secrets configured!"
echo ""
echo "📋 Configured secrets:"
gh secret list -R "$REPO"

echo ""
echo "🎉 GitHub Actions CI/CD is now fully configured!"
echo "   View workflows: https://github.com/$REPO/actions"
