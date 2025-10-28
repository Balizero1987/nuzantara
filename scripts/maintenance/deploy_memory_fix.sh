#!/bin/bash

# ZANTARA Memory System Fix - Deployment Script
# Run this script to deploy the memory fixes to production

echo "🚀 ZANTARA Memory System Fix Deployment"
echo "========================================"
echo ""

# Step 1: Run tests locally
echo "📋 Step 1: Running local tests..."
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/apps/backend-rag

echo "Running memory system tests..."
PYTHONPATH=backend python test_memory_system.py
if [ $? -ne 0 ]; then
    echo "❌ Tests failed! Aborting deployment."
    exit 1
fi

echo ""
echo "Running verification script..."
PYTHONPATH=backend python verify_memory_fix.py
if [ $? -ne 0 ]; then
    echo "❌ Verification failed! Aborting deployment."
    exit 1
fi

echo ""
echo "✅ All tests passed!"
echo ""

# Step 2: Stage and commit changes
echo "📋 Step 2: Preparing git commit..."
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY

# Show what will be committed
echo "Files to be committed:"
git status --short apps/backend-rag/backend/services/memory_service_postgres.py
git status --short apps/backend-rag/backend/prompts/zantara_system_prompt.md
git status --short apps/backend-rag/test_memory_system.py
git status --short apps/backend-rag/verify_memory_fix.py
git status --short MEMORY_FIX_DEPLOYMENT_CHECKLIST.md

echo ""
read -p "Do you want to commit these changes? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

# Add files
git add apps/backend-rag/backend/services/memory_service_postgres.py
git add apps/backend-rag/backend/prompts/zantara_system_prompt.md
git add apps/backend-rag/test_memory_system.py
git add apps/backend-rag/verify_memory_fix.py
git add MEMORY_FIX_DEPLOYMENT_CHECKLIST.md

# Commit with detailed message
git commit -m "🔧 FIX: ZANTARA memory system - Add retrieve() and search() methods

CRITICAL BUGS FIXED:
1. Added missing retrieve() method to MemoryServicePostgres
   - Returns ZantaraTools-compatible format
   - Category filtering support
   - Robust error handling

2. Added missing search() method to MemoryServicePostgres
   - PostgreSQL ILIKE pattern matching
   - Automatic fallback to cache
   - Timeout protection

3. Updated system prompt with MEMORY-FIRST PROTOCOL
   - Claude now loads memory at conversation start
   - Personalized greetings for returning users

IMPACT:
- Fixes AttributeError when Claude uses memory tools
- Enables conversation continuity
- Provides personalized user experience

Tested with: test_memory_system.py (6/6 tests passing)"

echo ""
echo "✅ Changes committed!"
echo ""

# Step 3: Push to production
echo "📋 Step 3: Deploying to Railway..."
read -p "Push to production? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Push cancelled. Changes are committed locally."
    echo "To push later, run: git push origin main"
    exit 0
fi

git push origin main

echo ""
echo "✅ Deployed to Railway!"
echo ""
echo "========================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Monitor Railway logs: railway logs -f"
echo "2. Test with a real user conversation"
echo "3. Check for personalized greetings"
echo "4. Verify no AttributeErrors in logs"
echo ""
echo "Rollback command if needed:"
echo "git revert HEAD && git push origin main"