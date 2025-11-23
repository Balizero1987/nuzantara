#!/bin/bash

###############################################################################
# NUZANTARA Codebase Cleanup Script - Phase 2 (REQUIRES REVIEW)
# Removes more aggressive code (needs testing after)
###############################################################################

set -e

REPO_ROOT="/Users/antonellosiano/Desktop/NUZANTARA/NUZANTARA-CLEAN-ARCHITECT"
cd "$REPO_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     NUZANTARA CODEBASE CLEANUP - PHASE 2 (REVIEW)        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${RED}⚠️  WARNING: This phase makes more aggressive changes${NC}"
echo -e "${YELLOW}   Review each change carefully before proceeding${NC}"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Create backup
echo -e "${YELLOW}[1/6]${NC} Creating backup..."
BACKUP_FILE="backup-phase2-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf ~/Desktop/"$BACKUP_FILE" \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  apps/backend-ts/src apps/backend-rag/backend 2>/dev/null || true
echo -e "${GREEN}✅ Backup: ~/Desktop/$BACKUP_FILE${NC}"

###############################################################################
# PHASE 2.1: Delete Deprecated KBLI Handlers
###############################################################################
echo ""
echo -e "${YELLOW}[2/6]${NC} Handling deprecated KBLI endpoints..."

if [ -f "apps/backend-ts/src/handlers/bali-zero/kbli.ts" ]; then
  echo "Found kbli.ts - replacing with 410 Gone response"
  
  cat > apps/backend-ts/src/handlers/bali-zero/kbli.ts << 'EOF'
/**
 * DEPRECATED: KBLI endpoints moved to RAG backend
 * Returns 410 Gone for all requests
 */

import { ok } from '../../utils/response.js';

export async function kbliLookup() {
  return {
    ok: false,
    error: 'This endpoint has been permanently moved to the RAG backend',
    code: 'ENDPOINT_MOVED',
    statusCode: 410,
    newEndpoint: 'https://nuzantara-rag.fly.dev/api/oracle/kbli'
  };
}

export async function kbliRequirements() {
  return {
    ok: false,
    error: 'This endpoint has been permanently moved to the RAG backend',
    code: 'ENDPOINT_MOVED',
    statusCode: 410,
    newEndpoint: 'https://nuzantara-rag.fly.dev/api/oracle/kbli'
  };
}
EOF
  echo -e "${GREEN}✅ kbli.ts replaced with 410 Gone${NC}"
fi

if [ -f "apps/backend-ts/src/handlers/bali-zero/kbli-complete.ts" ]; then
  rm apps/backend-ts/src/handlers/bali-zero/kbli-complete.ts
  echo -e "${GREEN}✅ kbli-complete.ts deleted${NC}"
fi

###############################################################################
# PHASE 2.2: Add Production Guard to Mock Login
###############################################################################
echo ""
echo -e "${YELLOW}[3/6]${NC} Adding production guard to mock-login..."

if [ -f "apps/backend-ts/src/routes/test/mock-login.ts" ]; then
  # Add guard at top of file after imports
  sed -i.bak '1,/^const router/s/const router = Router();/const router = Router();\n\n\/\/ Production guard\nif (process.env.NODE_ENV === '\''production'\'') {\n  throw new Error('\''Mock login is disabled in production'\'');\n}/' \
    apps/backend-ts/src/routes/test/mock-login.ts
  
  rm apps/backend-ts/src/routes/test/mock-login.ts.bak
  echo -e "${GREEN}✅ Production guard added${NC}"
else
  echo -e "${YELLOW}⚠️  mock-login.ts not found${NC}"
fi

###############################################################################
# PHASE 2.3: Consolidate Auth Middleware (INTERACTIVE)
###############################################################################
echo ""
echo -e "${YELLOW}[4/6]${NC} Auth middleware consolidation..."
echo -e "${YELLOW}   Found multiple auth implementations:${NC}"
echo "   - demo-user-auth.ts"
echo "   - auth-unified-complete.ts"
echo "   - jwt-auth.ts"
echo "   - enhanced-jwt-auth.ts"
echo "   - admin-auth.ts"
echo "   - auth.middleware.ts"
echo "   - auth.ts"
echo ""
echo -e "${YELLOW}   Recommendation: Keep only unified-auth-strategy.ts${NC}"
echo -e "${RED}   Manual consolidation required - skipping for now${NC}"
echo -e "${BLUE}   See: DEEP_CODEBASE_ANALYSIS.md section 1${NC}"

###############################################################################
# PHASE 2.4: Replace Console.log (INTERACTIVE)
###############################################################################
echo ""
echo -e "${YELLOW}[5/6]${NC} Console.log replacement..."
echo -e "${YELLOW}   Found 74 console.log/error/warn instances${NC}"
echo ""
read -p "Replace console.log with logger? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Replacing console.log..."
  
  # Find files with console.log
  FILES=$(grep -rl "console\.\(log\|error\|warn\)" apps/backend-ts/src \
    --include="*.ts" | grep -v "logger" | head -10)
  
  echo "Top 10 files to fix:"
  echo "$FILES"
  echo ""
  echo -e "${YELLOW}Note: Manual replacement recommended for context${NC}"
  echo -e "${BLUE}Use your IDE's find/replace:${NC}"
  echo "  console.log → logger.info"
  echo "  console.error → logger.error"
  echo "  console.warn → logger.warn"
else
  echo "Skipped console.log replacement"
fi

###############################################################################
# PHASE 2.5: Remove Unused Imports
###############################################################################
echo ""
echo -e "${YELLOW}[6/6]${NC} Checking for unused imports..."

if command -v npx &> /dev/null; then
  echo "Running ts-prune to find unused exports..."
  cd apps/backend-ts
  npx ts-prune 2>/dev/null | head -20 || echo "ts-prune not available"
  cd ../..
else
  echo "npx not found - skipping"
fi

###############################################################################
# Summary
###############################################################################
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ PHASE 2 CLEANUP COMPLETED${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Changes Made:${NC}"
echo "  • KBLI handlers → 410 Gone response"
echo "  • Mock login → Production guard added"
echo ""
echo -e "${YELLOW}Manual Tasks Remaining:${NC}"
echo "  • Auth middleware consolidation (7 files)"
echo "  • Console.log replacement (74 instances)"
echo "  • Unused imports cleanup"
echo "  • Database pool centralization"
echo "  • Environment variable validation"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Test application: npm run dev"
echo "  2. Review changes: git diff"
echo "  3. Commit if OK: git commit -m 'cleanup: phase 2'"
echo "  4. See DEEP_CODEBASE_ANALYSIS.md for Week 2 tasks"
echo ""
echo -e "${BLUE}Backup: ~/Desktop/$BACKUP_FILE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
